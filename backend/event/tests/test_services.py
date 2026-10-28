from datetime import timedelta

from django.test import TestCase, override_settings
from django.utils import timezone
from rest_framework.exceptions import NotFound, PermissionDenied, ValidationError

from utils.exceptions import BusinessRuleError, Conflict

from ..models import Event, ManualPaymentSubmission, SeatBooking
from ..services import (
    cancel_booking,
    expire_booking,
    reserve_booking,
    review_payment,
    submit_payment_reference,
)
from .helpers import BookingFixturesMixin


@override_settings(
    BOOKING_PAYMENT_REFERENCE_TTL_MINUTES=20,
    BOOKING_VERIFICATION_TTL_HOURS=24,
)
class ManualPaymentBookingTests(BookingFixturesMixin, TestCase):
    def test_reservation_holds_seats_and_snapshots_price(self):
        booking = reserve_booking(
            user=self.customer, event_id=self.event.id, seat_number=2
        )

        self.event.refresh_from_db()
        self.assertEqual(booking.status, "awaiting_payment_reference")
        self.assertEqual(booking.unit_price, 1200)
        self.assertEqual(booking.total_amount, 2400)
        self.assertEqual(self.event.available_seats, 3)
        self.assertTrue(booking.booking_reference.startswith("TL-"))

    def test_vendor_account_cannot_reserve_customer_seats(self):
        with self.assertRaises(PermissionDenied):
            reserve_booking(
                user=self.vendor_user, event_id=self.event.id, seat_number=1
            )

    def test_reservation_requires_active_payment_instructions(self):
        self.payment_method.is_active = False
        self.payment_method.save(update_fields=["is_active"])

        with self.assertRaises(BusinessRuleError) as ctx:
            reserve_booking(
                user=self.customer, event_id=self.event.id, seat_number=1
            )
        self.assertEqual(ctx.exception.get_codes(), "payment_unavailable")

    def test_customer_submits_transaction_for_verification(self):
        booking = reserve_booking(
            user=self.customer, event_id=self.event.id, seat_number=1
        )
        updated = submit_payment_reference(
            user=self.customer,
            booking_id=booking.id,
            payment_method_id=self.payment_method.id,
            transaction_id=" Trx 12345 ",
        )

        submission = ManualPaymentSubmission.objects.get(booking=booking)
        self.assertEqual(updated.status, "pending_verification")
        self.assertEqual(submission.transaction_id, "Trx 12345")
        self.assertEqual(submission.normalized_transaction_id, "TRX12345")

    def test_transaction_id_cannot_be_reused_for_same_method(self):
        first = reserve_booking(
            user=self.customer, event_id=self.event.id, seat_number=1
        )
        second = reserve_booking(
            user=self.other_customer, event_id=self.event.id, seat_number=1
        )
        submit_payment_reference(
            user=self.customer,
            booking_id=first.id,
            payment_method_id=self.payment_method.id,
            transaction_id="ABC-123",
        )

        with self.assertRaises(ValidationError):
            submit_payment_reference(
                user=self.other_customer,
                booking_id=second.id,
                payment_method_id=self.payment_method.id,
                transaction_id=" abc-123 ",
            )

    def test_owning_vendor_can_approve_payment(self):
        booking = reserve_booking(
            user=self.customer, event_id=self.event.id, seat_number=1
        )
        submit_payment_reference(
            user=self.customer,
            booking_id=booking.id,
            payment_method_id=self.payment_method.id,
            transaction_id="OK-100",
        )

        updated = review_payment(
            vendor=self.vendor, booking_id=booking.id, action="approve"
        )

        self.event.refresh_from_db()
        self.assertEqual(updated.status, "confirmed")
        self.assertEqual(updated.payment_submission.status, "verified")
        self.assertEqual(self.event.available_seats, 4)

    def test_rejection_releases_seats_exactly_once(self):
        booking = reserve_booking(
            user=self.customer, event_id=self.event.id, seat_number=2
        )
        submit_payment_reference(
            user=self.customer,
            booking_id=booking.id,
            payment_method_id=self.payment_method.id,
            transaction_id="BAD-100",
        )
        review_payment(
            vendor=self.vendor,
            booking_id=booking.id,
            action="reject",
            reason="Transaction was not found",
        )

        with self.assertRaises(Conflict):
            review_payment(
                vendor=self.vendor,
                booking_id=booking.id,
                action="reject",
                reason="Trying again",
            )

        booking.refresh_from_db()
        self.event.refresh_from_db()
        self.assertEqual(booking.status, "payment_rejected")
        self.assertIsNotNone(booking.seats_released_at)
        self.assertEqual(self.event.available_seats, 5)

    def test_expiry_and_cancellation_release_seats(self):
        expired_booking = reserve_booking(
            user=self.customer, event_id=self.event.id, seat_number=1
        )
        SeatBooking.objects.filter(pk=expired_booking.id).update(
            payment_reference_expires_at=timezone.now() - timedelta(seconds=1)
        )
        self.assertTrue(expire_booking(expired_booking.id))
        self.assertFalse(expire_booking(expired_booking.id))

        active_booking = reserve_booking(
            user=self.customer, event_id=self.event.id, seat_number=2
        )
        cancel_booking(user=self.customer, booking_id=active_booking.id)

        self.event.refresh_from_db()
        self.assertEqual(self.event.available_seats, 5)


class ReservationEligibilityTests(BookingFixturesMixin, TestCase):
    """BOOK-002: only open, future, unarchived events with free seats can be booked."""

    def assert_rejected(self, code, seat_number=1, user=None):
        with self.assertRaises(BusinessRuleError) as ctx:
            reserve_booking(
                user=user or self.customer,
                event_id=self.event.id,
                seat_number=seat_number,
            )
        self.assertEqual(ctx.exception.get_codes(), code)
        self.assertEqual(SeatBooking.objects.count(), 0)
        self.assertEqual(self.available_seats(), 5)

    def test_non_bookable_statuses_are_rejected(self):
        for status in ["draft", "paused", "travelling", "cancelled", "completed"]:
            with self.subTest(status=status):
                Event.objects.filter(pk=self.event.pk).update(status=status)
                self.assert_rejected("event_not_bookable")

    def test_archived_event_is_rejected(self):
        Event.objects.filter(pk=self.event.pk).update(is_archived=True)
        self.assert_rejected("event_not_bookable")

    def test_event_starting_today_or_earlier_is_rejected(self):
        today = timezone.localdate()
        for start_date in [today, today - timedelta(days=1)]:
            with self.subTest(start_date=start_date):
                Event.objects.filter(pk=self.event.pk).update(
                    start_date=start_date, end_date=today + timedelta(days=2)
                )
                self.assert_rejected("booking_closed")

    def test_event_starting_tomorrow_is_bookable(self):
        Event.objects.filter(pk=self.event.pk).update(
            start_date=timezone.localdate() + timedelta(days=1)
        )
        booking = reserve_booking(
            user=self.customer, event_id=self.event.id, seat_number=1
        )
        self.assertEqual(booking.status, "awaiting_payment_reference")

    def test_invalid_seat_counts_are_rejected(self):
        for seat_number in [0, -1]:
            with self.subTest(seat_number=seat_number):
                with self.assertRaises(ValidationError) as ctx:
                    reserve_booking(
                        user=self.customer,
                        event_id=self.event.id,
                        seat_number=seat_number,
                    )
                self.assertIn("seat_number", ctx.exception.detail)
        self.assertEqual(self.available_seats(), 5)

    def test_requesting_more_than_available_is_a_seat_number_error(self):
        with self.assertRaises(ValidationError) as ctx:
            reserve_booking(user=self.customer, event_id=self.event.id, seat_number=6)
        self.assertEqual(
            ctx.exception.detail["seat_number"], ["Only 5 seats are available."]
        )
        self.assertEqual(self.available_seats(), 5)

    def test_unknown_event_is_an_event_field_error(self):
        with self.assertRaises(ValidationError) as ctx:
            reserve_booking(
                user=self.customer,
                event_id="00000000-0000-0000-0000-000000000000",
                seat_number=1,
            )
        self.assertIn("event", ctx.exception.detail)

    def test_admin_cannot_reserve(self):
        with self.assertRaises(PermissionDenied):
            reserve_booking(user=self.admin, event_id=self.event.id, seat_number=1)


class SoldOutTests(BookingFixturesMixin, TestCase):
    """BOOK-014: sold-out state and the final seats."""

    def test_last_seats_can_be_booked_then_event_is_sold_out(self):
        reserve_booking(user=self.customer, event_id=self.event.id, seat_number=5)
        self.assertEqual(self.available_seats(), 0)

        with self.assertRaises(BusinessRuleError) as ctx:
            reserve_booking(
                user=self.other_customer, event_id=self.event.id, seat_number=1
            )
        self.assertEqual(ctx.exception.get_codes(), "sold_out")
        self.assertEqual(SeatBooking.objects.count(), 1)

    def test_null_available_seats_is_treated_as_sold_out(self):
        Event.objects.filter(pk=self.event.pk).update(available_seats=None)
        with self.assertRaises(BusinessRuleError) as ctx:
            reserve_booking(user=self.customer, event_id=self.event.id, seat_number=1)
        self.assertEqual(ctx.exception.get_codes(), "sold_out")

    def test_released_seats_make_the_event_bookable_again(self):
        booking = reserve_booking(
            user=self.customer, event_id=self.event.id, seat_number=5
        )
        cancel_booking(user=self.customer, booking_id=booking.id)

        reserve_booking(user=self.other_customer, event_id=self.event.id, seat_number=5)
        self.assertEqual(self.available_seats(), 0)
        self.assert_seats_consistent()


class PriceSnapshotTests(BookingFixturesMixin, TestCase):
    """BOOK-014: a booking's price never follows later event price edits."""

    def test_snapshot_uses_discount_price_when_set(self):
        booking = reserve_booking(
            user=self.customer, event_id=self.event.id, seat_number=3
        )
        self.assertEqual(booking.unit_price, 1200)
        self.assertEqual(booking.total_amount, 3600)
        self.assertEqual(booking.currency, "BDT")

    def test_snapshot_uses_actual_price_without_discount(self):
        Event.objects.filter(pk=self.event.pk).update(discount_price=0)
        booking = reserve_booking(
            user=self.customer, event_id=self.event.id, seat_number=2
        )
        self.assertEqual(booking.unit_price, 1500)
        self.assertEqual(booking.total_amount, 3000)

    def test_price_edits_do_not_change_existing_bookings(self):
        booking = self.confirmed_booking(seat_number=2)

        Event.objects.filter(pk=self.event.pk).update(
            actual_price=9000, discount_price=8000
        )

        booking.refresh_from_db()
        self.assertEqual(booking.unit_price, 1200)
        self.assertEqual(booking.total_amount, 2400)
        self.assertEqual(booking.total_price, 2400)


class CancellationTests(BookingFixturesMixin, TestCase):
    """BOOK-005/BOOK-006/BOOK-014: cancellation rules and exactly-once seat release."""

    def set_start_in(self, days):
        start = timezone.localdate() + timedelta(days=days)
        Event.objects.filter(pk=self.event.pk).update(
            start_date=start, end_date=start + timedelta(days=2)
        )

    def assert_cancel_rejected(self, booking, exc_type, code):
        with self.assertRaises(exc_type) as ctx:
            cancel_booking(user=self.customer, booking_id=booking.id)
        self.assertEqual(ctx.exception.get_codes(), code)

    def test_confirmed_booking_cancels_before_deadline(self):
        booking = self.confirmed_booking(seat_number=2)
        cancel_booking(user=self.customer, booking_id=booking.id)

        booking.refresh_from_db()
        self.assertEqual(booking.status, "cancelled")
        self.assertIsNotNone(booking.cancelled_at)
        self.assertEqual(self.available_seats(), 5)

    def test_confirmed_booking_cancels_on_deadline_day(self):
        booking = self.confirmed_booking()
        self.set_start_in(2)  # cancellation_days=2, so today is the last day

        cancel_booking(user=self.customer, booking_id=booking.id)
        self.assertEqual(self.available_seats(), 5)

    def test_confirmed_booking_cannot_cancel_after_deadline(self):
        booking = self.confirmed_booking(seat_number=2)
        self.set_start_in(1)

        self.assert_cancel_rejected(booking, BusinessRuleError, "cancellation_closed")
        booking.refresh_from_db()
        self.assertEqual(booking.status, "confirmed")
        self.assertEqual(self.available_seats(), 3)

    def test_confirmed_booking_cannot_cancel_when_event_disallows_it(self):
        Event.objects.filter(pk=self.event.pk).update(cancellation_days=0)
        booking = self.confirmed_booking()

        self.assert_cancel_rejected(booking, BusinessRuleError, "cancellation_closed")
        self.assertEqual(self.available_seats(), 4)

    def test_unpaid_reservation_can_always_be_cancelled(self):
        Event.objects.filter(pk=self.event.pk).update(cancellation_days=0)
        booking = reserve_booking(
            user=self.customer, event_id=self.event.id, seat_number=2
        )
        cancel_booking(user=self.customer, booking_id=booking.id)
        self.assertEqual(self.available_seats(), 5)

    def test_pending_cancellation_closes_the_submission(self):
        booking = self.pending_booking(seat_number=2)
        cancel_booking(user=self.customer, booking_id=booking.id)

        submission = ManualPaymentSubmission.objects.get(booking=booking)
        self.assertEqual(submission.status, "withdrawn")
        self.assertEqual(submission.rejection_reason, "")
        self.assertIsNone(submission.reviewed_at)
        self.assertEqual(self.available_seats(), 5)

    def test_repeated_cancellation_restores_seats_once(self):
        booking = self.confirmed_booking(seat_number=2)
        other = reserve_booking(
            user=self.other_customer, event_id=self.event.id, seat_number=1
        )
        cancel_booking(user=self.customer, booking_id=booking.id)

        for _ in range(3):
            self.assert_cancel_rejected(booking, Conflict, "already_cancelled")

        self.assertEqual(self.available_seats(), 4)
        other.refresh_from_db()
        self.assertEqual(other.status, "awaiting_payment_reference")
        self.assert_seats_consistent()

    def test_expired_or_rejected_booking_cannot_be_cancelled(self):
        expired = reserve_booking(
            user=self.customer, event_id=self.event.id, seat_number=1
        )
        SeatBooking.objects.filter(pk=expired.id).update(
            payment_reference_expires_at=timezone.now() - timedelta(seconds=1)
        )
        expire_booking(expired.id)

        rejected = self.pending_booking(seat_number=1)
        review_payment(
            vendor=self.vendor,
            booking_id=rejected.id,
            action="reject",
            reason="No such transaction",
        )

        for name, booking in [("expired", expired), ("rejected", rejected)]:
            with self.subTest(booking=name):
                self.assert_cancel_rejected(booking, Conflict, "invalid_booking_state")
        self.assertEqual(self.available_seats(), 5)

    def test_customer_cannot_cancel_someone_elses_booking(self):
        booking = self.confirmed_booking()
        with self.assertRaises(NotFound):
            cancel_booking(user=self.other_customer, booking_id=booking.id)
        booking.refresh_from_db()
        self.assertEqual(booking.status, "confirmed")


class ReviewOwnershipTests(BookingFixturesMixin, TestCase):
    def test_other_vendor_cannot_review(self):
        booking = self.pending_booking()
        with self.assertRaises(NotFound):
            review_payment(
                vendor=self.other_vendor, booking_id=booking.id, action="approve"
            )
        booking.refresh_from_db()
        self.assertEqual(booking.status, "pending_verification")

    def test_late_review_expires_booking_and_releases_seats(self):
        booking = self.pending_booking(seat_number=2)
        SeatBooking.objects.filter(pk=booking.id).update(
            verification_expires_at=timezone.now() - timedelta(seconds=1)
        )

        with self.assertRaises(Conflict) as ctx:
            review_payment(vendor=self.vendor, booking_id=booking.id, action="approve")
        self.assertEqual(ctx.exception.get_codes(), "booking_expired")

        booking.refresh_from_db()
        self.assertEqual(booking.status, "expired")
        self.assertEqual(self.available_seats(), 5)
