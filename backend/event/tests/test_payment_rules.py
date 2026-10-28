"""Tests for the manual-payment decisions in DECISIONS.md (DEC-002, -003, -004, -007)."""

from datetime import timedelta
from unittest import mock
from zoneinfo import ZoneInfo

from django.db import IntegrityError, transaction
from django.test import TestCase
from django.urls import reverse
from django.utils import timezone
from rest_framework import serializers
from rest_framework.test import APIClient

from utils.exceptions import Conflict
from vendor.models import VendorPaymentMethod

from ..models import ManualPaymentSubmission, SeatBooking
from ..services import (
    cancel_booking,
    expire_booking,
    reserve_booking,
    review_payment,
    submit_payment_reference,
)
from .helpers import BookingFixturesMixin, make_event, make_user


def frozen_now(moment):
    return mock.patch("django.utils.timezone.now", return_value=moment)


class OneUnfinishedBookingTests(BookingFixturesMixin, TestCase):
    """DEC-003: many bookings per event, but only one unfinished at a time."""

    def reserve(self, user=None, seat_number=1, event=None):
        return reserve_booking(
            user=user or self.customer,
            event_id=(event or self.event).id,
            seat_number=seat_number,
        )

    def assert_blocked(self):
        with self.assertRaises(Conflict) as ctx:
            self.reserve()
        self.assertEqual(ctx.exception.detail.code, "unfinished_booking_exists")

    def test_awaiting_payment_reference_blocks_a_second_reservation(self):
        self.reserve(seat_number=2)
        self.assert_blocked()
        self.assertEqual(self.available_seats(), 3)

    def test_pending_verification_blocks_a_second_reservation(self):
        self.pending_booking()
        self.assert_blocked()

    def test_confirmed_booking_allows_another(self):
        self.confirmed_booking(seat_number=2)
        self.reserve(seat_number=1)
        self.assertEqual(
            SeatBooking.objects.filter(user=self.customer, event=self.event).count(), 2
        )
        self.assert_seats_consistent()

    def test_finished_bookings_allow_another(self):
        cancelled = self.reserve()
        cancel_booking(user=self.customer, booking_id=cancelled.id)
        rejected = self.pending_booking()
        review_payment(
            vendor=self.vendor, booking_id=rejected.id, action="reject", reason="Not found"
        )
        self.reserve()
        self.assert_seats_consistent()

    def test_lapsed_hold_is_expired_instead_of_blocking(self):
        stale = self.reserve(seat_number=2)
        SeatBooking.objects.filter(pk=stale.pk).update(
            payment_reference_expires_at=timezone.now() - timedelta(minutes=1)
        )

        fresh = self.reserve(seat_number=4)

        stale.refresh_from_db()
        self.assertEqual(stale.status, "expired")
        self.assertIsNotNone(stale.seats_released_at)
        self.assertEqual(fresh.status, "awaiting_payment_reference")
        self.assertEqual(self.available_seats(), 1)
        self.assert_seats_consistent()

    def test_other_customers_and_events_are_unaffected(self):
        self.reserve()
        self.reserve(user=self.other_customer)
        self.reserve(event=make_event(self.vendor, title="Another trip"))

    def test_database_rejects_a_second_unfinished_booking(self):
        first = self.reserve()
        with self.assertRaises(IntegrityError), transaction.atomic():
            SeatBooking.objects.create(
                event=self.event,
                user=self.customer,
                seat_number=1,
                status="pending_verification",
            )
        self.assertEqual(first.status, "awaiting_payment_reference")

    def test_api_returns_conflict_with_code(self):
        self.reserve()
        client = APIClient()
        client.force_authenticate(user=self.customer)
        response = client.post(
            reverse("event:book-seat"),
            {"event": str(self.event.id), "seat_number": 1},
            format="json",
        )
        self.assertEqual(response.status_code, 409)
        self.assertEqual(response.json()["code"], "unfinished_booking_exists")


class DeadlineTests(BookingFixturesMixin, TestCase):
    """DEC-002: 20 minutes to submit, 24 hours to verify, never past the event start."""

    def setUp(self):
        super().setUp()
        self.tomorrow_event = make_event(
            self.vendor,
            title="Tomorrow",
            start_date=timezone.localdate() + timedelta(days=1),
            end_date=timezone.localdate() + timedelta(days=2),
        )

    def test_event_starts_at_midnight_in_dhaka(self):
        starts_at = self.event.starts_at.astimezone(ZoneInfo("Asia/Dhaka"))
        self.assertEqual(starts_at.date(), self.event.start_date)
        self.assertEqual((starts_at.hour, starts_at.minute), (0, 0))

    def test_default_windows(self):
        before = timezone.now()
        booking = reserve_booking(
            user=self.customer, event_id=self.event.id, seat_number=1
        )
        self.assertAlmostEqual(
            booking.payment_reference_expires_at,
            before + timedelta(minutes=20),
            delta=timedelta(seconds=30),
        )
        booking = submit_payment_reference(
            user=self.customer,
            booking_id=booking.id,
            payment_method_id=self.payment_method.id,
            transaction_id="TRX-WINDOW",
        )
        self.assertAlmostEqual(
            booking.verification_expires_at,
            before + timedelta(hours=24),
            delta=timedelta(seconds=30),
        )

    def test_payment_window_is_capped_at_event_start(self):
        starts_at = self.tomorrow_event.starts_at
        with frozen_now(starts_at - timedelta(minutes=5)):
            booking = reserve_booking(
                user=self.customer, event_id=self.tomorrow_event.id, seat_number=1
            )
        self.assertEqual(booking.payment_reference_expires_at, starts_at)

    def test_verification_window_is_capped_at_event_start(self):
        starts_at = self.tomorrow_event.starts_at
        with frozen_now(starts_at - timedelta(hours=2)):
            booking = reserve_booking(
                user=self.customer, event_id=self.tomorrow_event.id, seat_number=1
            )
            booking = submit_payment_reference(
                user=self.customer,
                booking_id=booking.id,
                payment_method_id=self.payment_method.id,
                transaction_id="TRX-LATE",
            )
        self.assertEqual(booking.verification_expires_at, starts_at)


class TransactionIdTests(BookingFixturesMixin, TestCase):
    """DEC-001/DEC-007: fixed channels; an ID backs one live submission per channel."""

    def setUp(self):
        super().setUp()
        self.other_event = make_event(self.other_vendor, title="Other vendor trip")
        self.other_nagad = VendorPaymentMethod.objects.create(
            vendor=self.other_vendor,
            channel="nagad",
            name="Nagad Merchant",
            account_name="Other Tours",
            account_number="01800000000",
        )

    def submit(self, transaction_id, user=None, event=None, method=None):
        booking = reserve_booking(
            user=user or self.customer,
            event_id=(event or self.event).id,
            seat_number=1,
        )
        return submit_payment_reference(
            user=user or self.customer,
            booking_id=booking.id,
            payment_method_id=(method or self.payment_method).id,
            transaction_id=transaction_id,
        )

    def assert_duplicate(self, transaction_id, **kwargs):
        with self.assertRaises(serializers.ValidationError) as ctx:
            self.submit(transaction_id, **kwargs)
        self.assertIn("transaction_id", ctx.exception.detail)

    def test_same_id_on_same_channel_at_another_vendor_is_rejected(self):
        self.submit("8N7A6B5C4D")
        self.assert_duplicate(
            "8N7A6B5C4D",
            user=self.other_customer,
            event=self.other_event,
            method=self.other_payment_method,  # also bKash
        )

    def test_same_id_on_another_channel_is_allowed(self):
        self.submit("8N7A6B5C4D")
        self.submit(
            "8N7A6B5C4D",
            user=self.other_customer,
            event=self.other_event,
            method=self.other_nagad,
        )

    def test_ids_are_compared_after_normalization(self):
        self.submit("8n7a 6b5c 4d")
        self.assert_duplicate(" 8N7A6B5C4D ", user=self.other_customer)

    def test_verified_id_cannot_be_reused(self):
        booking = self.submit("TRX-VERIFIED")
        review_payment(vendor=self.vendor, booking_id=booking.id, action="approve")
        self.assert_duplicate("TRX-VERIFIED", user=self.other_customer)

    def test_rejected_id_can_be_resubmitted_on_a_new_booking(self):
        booking = self.submit("TRX-RETRY")
        review_payment(
            vendor=self.vendor, booking_id=booking.id, action="reject", reason="Typo?"
        )
        retry = self.submit("TRX-RETRY")
        self.assertEqual(retry.status, "pending_verification")

    def test_withdrawn_id_can_be_reused(self):
        booking = self.submit("TRX-WITHDRAWN")
        cancel_booking(user=self.customer, booking_id=booking.id)
        self.assertEqual(
            ManualPaymentSubmission.objects.get(booking=booking).status, "withdrawn"
        )
        self.submit("TRX-WITHDRAWN")

    def test_expired_id_can_be_reused(self):
        booking = self.submit("TRX-EXPIRED")
        SeatBooking.objects.filter(pk=booking.pk).update(
            verification_expires_at=timezone.now() - timedelta(minutes=1)
        )
        self.assertTrue(expire_booking(booking.id))
        self.assertEqual(
            ManualPaymentSubmission.objects.get(booking=booking).status, "expired"
        )
        self.submit("TRX-EXPIRED")

    def test_late_review_expires_the_submission(self):
        booking = self.submit("TRX-LATE-REVIEW")
        SeatBooking.objects.filter(pk=booking.pk).update(
            verification_expires_at=timezone.now() - timedelta(minutes=1)
        )
        with self.assertRaises(Conflict):
            review_payment(vendor=self.vendor, booking_id=booking.id, action="approve")
        self.assertEqual(
            ManualPaymentSubmission.objects.get(booking=booking).status, "expired"
        )

    def test_submission_snapshots_channel_and_amount(self):
        booking = self.submit("TRX-SNAPSHOT")
        self.payment_method.channel = "rocket"
        self.payment_method.save()

        submission = ManualPaymentSubmission.objects.get(booking=booking)
        self.assertEqual(submission.channel, "bkash")
        self.assertEqual(submission.amount, booking.total_amount)
        self.assertEqual(submission.currency, "BDT")


class PaymentMethodChannelApiTests(BookingFixturesMixin, TestCase):
    """DEC-001: vendors must pick a channel from the fixed list."""

    def setUp(self):
        super().setUp()
        self.client = APIClient()
        self.client.force_authenticate(user=self.vendor_user)
        self.url = reverse("vendor:vendor-payment-method-list")

    def payload(self, **overrides):
        return {
            "name": "Nagad Personal",
            "account_name": "Friendly Tours",
            "account_number": "01900000000",
            **overrides,
        }

    def test_channel_is_required(self):
        response = self.client.post(self.url, self.payload(), format="json")
        self.assertEqual(response.status_code, 400)
        self.assertIn("channel", response.json())

    def test_unknown_channel_is_rejected(self):
        response = self.client.post(
            self.url, self.payload(channel="paypal"), format="json"
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("channel", response.json())

    def test_channel_and_label_are_returned(self):
        response = self.client.post(
            self.url, self.payload(channel="nagad"), format="json"
        )
        self.assertEqual(response.status_code, 201, response.content)
        self.assertEqual(response.json()["channel"], "nagad")
        self.assertEqual(response.json()["channel_label"], "Nagad")


class ReadOnlyBookingAdminTests(BookingFixturesMixin, TestCase):
    """DEC-004: admins can view bookings and submissions but not change them."""

    def setUp(self):
        super().setUp()
        self.booking = self.pending_booking()
        superuser = make_user(
            "root@example.com", role="admin", is_staff=True, is_superuser=True
        )
        self.client.force_login(superuser)

    def test_bookings_and_submissions_are_view_only(self):
        for model in ["seatbooking", "manualpaymentsubmission"]:
            obj = (
                self.booking
                if model == "seatbooking"
                else self.booking.payment_submission
            )
            changelist = reverse(f"admin:event_{model}_changelist")
            change = reverse(f"admin:event_{model}_change", args=[obj.pk])
            self.assertEqual(self.client.get(changelist).status_code, 200, model)
            self.assertEqual(self.client.get(change).status_code, 200, model)
            self.assertEqual(
                self.client.get(reverse(f"admin:event_{model}_add")).status_code,
                403,
                model,
            )
            self.assertEqual(
                self.client.post(change, {"status": "confirmed"}).status_code,
                403,
                model,
            )
        self.booking.refresh_from_db()
        self.assertEqual(self.booking.status, "pending_verification")
