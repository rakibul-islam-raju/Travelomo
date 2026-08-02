from datetime import timedelta

from django.test import TestCase, override_settings
from django.utils import timezone
from rest_framework.exceptions import ValidationError

from user.models import User
from vendor.models import Vendor, VendorPaymentMethod

from .models import Event, ManualPaymentSubmission, SeatBooking
from .services import (
    cancel_booking,
    expire_booking,
    reserve_booking,
    review_payment,
    submit_payment_reference,
)


@override_settings(
    BOOKING_PAYMENT_REFERENCE_TTL_MINUTES=20,
    BOOKING_VERIFICATION_TTL_HOURS=24,
)
class ManualPaymentBookingTests(TestCase):
    def setUp(self):
        self.customer = User.objects.create_user(
            email="customer@example.com",
            password="password",
            first_name="Customer",
            last_name="One",
            role="customer",
            is_active=True,
        )
        self.other_customer = User.objects.create_user(
            email="customer2@example.com",
            password="password",
            first_name="Customer",
            last_name="Two",
            role="customer",
            is_active=True,
        )
        self.vendor_user = User.objects.create_user(
            email="vendor@example.com",
            password="password",
            first_name="Vendor",
            last_name="Owner",
            role="vendor",
            is_active=True,
        )
        self.vendor = Vendor.objects.create(
            user=self.vendor_user,
            store_name="Friendly Tours",
            is_approved=True,
        )
        self.payment_method = VendorPaymentMethod.objects.create(
            vendor=self.vendor,
            name="bKash",
            account_name="Friendly Tours",
            account_number="01700000000",
            instructions="Use Send Money.",
        )
        self.event = Event.objects.create(
            vendor=self.vendor,
            title="Sundarbans Weekend",
            description="A calm weekend away.",
            start_date=timezone.localdate() + timedelta(days=30),
            end_date=timezone.localdate() + timedelta(days=32),
            location="Khulna",
            total_seats=5,
            actual_price=1500,
            discount_price=1200,
            status="published",
            cancellation_days=2,
        )

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
        with self.assertRaises(ValidationError):
            reserve_booking(
                user=self.vendor_user, event_id=self.event.id, seat_number=1
            )

    def test_reservation_requires_active_payment_instructions(self):
        self.payment_method.is_active = False
        self.payment_method.save(update_fields=["is_active"])

        with self.assertRaises(ValidationError):
            reserve_booking(
                user=self.customer, event_id=self.event.id, seat_number=1
            )

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

        with self.assertRaises(ValidationError):
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
