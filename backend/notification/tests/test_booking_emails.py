"""MAIL-001: booking confirmation and status emails."""

from django.core import mail
from django.test import TestCase

from event.services import review_payment
from event.tasks import send_booking_confirmation_email, send_booking_status_email
from event.tests.helpers import BookingFixturesMixin

from ..models import EmailDelivery
from .helpers import EagerCeleryMixin

MISSING_BOOKING_ID = "00000000-0000-0000-0000-000000000000"


class BookingConfirmationEmailTests(EagerCeleryMixin, BookingFixturesMixin, TestCase):
    def send_confirmation(self, booking_id):
        with self.captureOnCommitCallbacks(execute=True):
            return send_booking_confirmation_email(str(booking_id))

    def test_confirmed_booking_gets_confirmation_email(self):
        booking = self.confirmed_booking(seat_number=2)

        result = self.send_confirmation(booking.id)

        self.assertEqual(result, f"Confirmation email queued for booking {booking.id}")
        self.assertEqual(len(mail.outbox), 1)
        message = mail.outbox[0]
        self.assertEqual(message.to, ["customer@example.com"])
        self.assertEqual(message.subject, "Booking Confirmed - Sundarbans Weekend")

        html, mimetype = message.alternatives[0]
        self.assertEqual(mimetype, "text/html")
        for expected in ["Customer Tester", "Sundarbans Weekend", "Khulna", "2400.00", str(booking.id)]:
            self.assertIn(expected, html)
        self.assertIn("<td>2</td>", html)  # seats booked

        self.assertNotIn("<", message.body)
        self.assertIn("Sundarbans Weekend", message.body)

        delivery = EmailDelivery.objects.get()
        self.assertEqual(delivery.kind, "booking_confirmation")
        self.assertEqual(delivery.booking, booking)
        self.assertEqual(delivery.status, EmailDelivery.Status.SENT)

    def test_missing_booking_is_logged_and_sends_nothing(self):
        with self.assertLogs("event.tasks", "WARNING") as logs:
            result = self.send_confirmation(MISSING_BOOKING_ID)

        self.assertEqual(result, f"Booking {MISSING_BOOKING_ID} not found")
        self.assertIn("confirmation email not sent", logs.output[0])
        self.assertEqual(mail.outbox, [])
        self.assertFalse(EmailDelivery.objects.exists())

    def test_unconfirmed_booking_gets_no_confirmation(self):
        booking = self.pending_booking()

        result = self.send_confirmation(booking.id)

        self.assertEqual(result, f"Booking {booking.id} is not confirmed")
        self.assertEqual(mail.outbox, [])

    def test_vendor_approval_sends_confirmation(self):
        booking = self.pending_booking()

        with self.captureOnCommitCallbacks(execute=True):
            review_payment(vendor=self.vendor, booking_id=booking.id, action="approve")

        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(mail.outbox[0].subject, "Booking Confirmed - Sundarbans Weekend")


class BookingStatusEmailTests(EagerCeleryMixin, BookingFixturesMixin, TestCase):
    def test_status_email_carries_reference_status_and_message(self):
        booking = self.pending_booking()

        with self.captureOnCommitCallbacks(execute=True):
            send_booking_status_email(str(booking.id), "We received your transaction ID.")

        message = mail.outbox[0]
        self.assertEqual(message.subject, "Booking update - Sundarbans Weekend")
        html = message.alternatives[0][0]
        for expected in [booking.booking_reference, "Pending verification", "We received your transaction ID."]:
            self.assertIn(expected, html)
        self.assertEqual(EmailDelivery.objects.get().kind, "booking_status")

    def test_missing_booking_is_logged_and_sends_nothing(self):
        with self.assertLogs("event.tasks", "WARNING"):
            result = send_booking_status_email(MISSING_BOOKING_ID, "Anything")

        self.assertEqual(result, f"Booking {MISSING_BOOKING_ID} not found")
        self.assertEqual(mail.outbox, [])

    def test_vendor_rejection_sends_status_email(self):
        booking = self.pending_booking()

        with self.captureOnCommitCallbacks(execute=True):
            review_payment(
                vendor=self.vendor,
                booking_id=booking.id,
                action="reject",
                reason="Transaction not found",
            )

        self.assertEqual(len(mail.outbox), 1)
        html = mail.outbox[0].alternatives[0][0]
        self.assertIn("Payment rejected", html)
        self.assertIn("could not verify your transaction", html)
