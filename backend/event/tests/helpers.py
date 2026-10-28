from datetime import timedelta

from django.utils import timezone

from user.models import User
from vendor.models import Vendor, VendorPaymentMethod

from ..models import Event, SeatBooking
from ..services import reserve_booking, review_payment, submit_payment_reference


def make_user(email, role="customer", **extra):
    # No password: tests authenticate with force_authenticate, and skipping
    # the hasher keeps each setUp fast.
    return User.objects.create_user(
        email=email,
        password=None,
        first_name=email.split("@")[0].title(),
        last_name="Tester",
        role=role,
        is_active=True,
        **extra,
    )


def make_vendor(email, store_name):
    user = make_user(email, role="vendor")
    vendor = Vendor.objects.create(user=user, store_name=store_name, is_approved=True)
    payment_method = VendorPaymentMethod.objects.create(
        vendor=vendor,
        channel="bkash",
        name="bKash",
        account_name=store_name,
        account_number="01700000000",
        instructions="Use Send Money.",
    )
    return vendor, payment_method


def make_event(vendor, **overrides):
    fields = {
        "title": "Sundarbans Weekend",
        "description": "A calm weekend away.",
        "start_date": timezone.localdate() + timedelta(days=30),
        "end_date": timezone.localdate() + timedelta(days=32),
        "location": "Khulna",
        "total_seats": 5,
        "actual_price": 1500,
        "discount_price": 1200,
        "status": "published",
        "cancellation_days": 2,
    }
    fields.update(overrides)
    return Event.objects.create(vendor=vendor, **fields)


class BookingFixturesMixin:
    """Two customers, an admin, and two vendors; the first vendor owns `self.event`."""

    def setUp(self):
        super().setUp()
        self.customer = make_user("customer@example.com")
        self.other_customer = make_user("customer2@example.com")
        self.admin = make_user("admin@example.com", role="admin", is_staff=True)
        self.vendor, self.payment_method = make_vendor(
            "vendor@example.com", "Friendly Tours"
        )
        self.vendor_user = self.vendor.user
        self.other_vendor, self.other_payment_method = make_vendor(
            "vendor2@example.com", "Other Tours"
        )
        self.event = make_event(self.vendor)

    def pending_booking(self, user=None, seat_number=1, transaction_id=None):
        user = user or self.customer
        booking = reserve_booking(
            user=user, event_id=self.event.id, seat_number=seat_number
        )
        return submit_payment_reference(
            user=user,
            booking_id=booking.id,
            payment_method_id=self.payment_method.id,
            transaction_id=transaction_id or f"TRX-{booking.booking_reference}",
        )

    def confirmed_booking(self, user=None, seat_number=1):
        booking = self.pending_booking(user=user, seat_number=seat_number)
        return review_payment(vendor=self.vendor, booking_id=booking.id, action="approve")

    def available_seats(self):
        return Event.objects.values_list("available_seats", flat=True).get(
            pk=self.event.pk
        )

    def assert_seats_consistent(self):
        """available_seats must equal total_seats minus every seat still held."""
        held = sum(
            SeatBooking.objects.filter(
                event=self.event, seats_released_at__isnull=True
            ).values_list("seat_number", flat=True)
        )
        self.event.refresh_from_db()
        self.assertEqual(self.event.available_seats, self.event.total_seats - held)
