from datetime import timedelta

from django.core.exceptions import ValidationError as DjangoValidationError
from django.test import TestCase, override_settings
from django.urls import reverse
from django.utils import timezone
from rest_framework import exceptions
from rest_framework.test import APIClient

from utils.exceptions import api_exception_handler

from ..models import Event, SeatBooking
from ..services import reserve_booking, review_payment
from .helpers import BookingFixturesMixin, make_event

CUSTOMER_ONLY = [
    ("post", "event:book-seat", False),
    ("get", "event:my-bookings", False),
    ("post", "event:submit-payment-reference", True),
    ("post", "event:cancel-booking", True),
]
VENDOR_ONLY = [
    ("get", "event:vendor-bookings", False),
    ("post", "event:vendor-review-payment", True),
]


class BookingApiTestCase(BookingFixturesMixin, TestCase):
    def setUp(self):
        super().setUp()
        self.client = APIClient()

    def as_user(self, user):
        self.client.force_authenticate(user=user)
        return self.client

    def book(self, user=None, **data):
        payload = {"event": str(self.event.id), "seat_number": 1, **data}
        return self.as_user(user or self.customer).post(
            reverse("event:book-seat"), payload, format="json"
        )


class BookingPermissionTests(BookingApiTestCase):
    """BOOK-001: every booking endpoint, every role."""

    def setUp(self):
        super().setUp()
        self.booking = self.pending_booking(seat_number=1)

    def url(self, name, needs_pk):
        return reverse(name, kwargs={"pk": self.booking.pk}) if needs_pk else reverse(name)

    def call(self, method, name, needs_pk, user=None):
        client = APIClient()
        if user:
            client.force_authenticate(user=user)
        return getattr(client, method)(self.url(name, needs_pk), {}, format="json")

    def test_anonymous_requests_are_unauthenticated(self):
        for method, name, needs_pk in CUSTOMER_ONLY + VENDOR_ONLY:
            with self.subTest(endpoint=name):
                response = self.call(method, name, needs_pk)
                self.assertEqual(response.status_code, 401)
                self.assertEqual(response.data["code"], "not_authenticated")

    def test_customer_endpoints_reject_vendor_and_admin(self):
        for user in [self.vendor_user, self.admin]:
            for method, name, needs_pk in CUSTOMER_ONLY:
                with self.subTest(role=user.role, endpoint=name):
                    response = self.call(method, name, needs_pk, user=user)
                    self.assertEqual(response.status_code, 403)
                    self.assertEqual(response.data["code"], "permission_denied")

    def test_vendor_endpoints_reject_customer_and_admin(self):
        for user in [self.customer, self.admin]:
            for method, name, needs_pk in VENDOR_ONLY:
                with self.subTest(role=user.role, endpoint=name):
                    response = self.call(method, name, needs_pk, user=user)
                    self.assertEqual(response.status_code, 403)

    def test_rejected_requests_change_nothing(self):
        for user in [None, self.vendor_user, self.admin]:
            for method, name, needs_pk in CUSTOMER_ONLY:
                self.call(method, name, needs_pk, user=user)
        self.booking.refresh_from_db()
        self.assertEqual(self.booking.status, "pending_verification")
        self.assertEqual(SeatBooking.objects.count(), 1)
        self.assertEqual(self.available_seats(), 4)

    def test_customer_can_use_customer_endpoints(self):
        # DEC-003: finish the pending booking from setUp before booking again.
        review_payment(vendor=self.vendor, booking_id=self.booking.id, action="approve")
        response = self.book(seat_number=2)
        self.assertEqual(response.status_code, 201)
        new_booking_id = response.data["id"]

        response = self.client.get(reverse("event:my-bookings"))
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["count"], 2)

        response = self.client.post(
            reverse("event:submit-payment-reference", kwargs={"pk": new_booking_id}),
            {"payment_method": str(self.payment_method.id), "transaction_id": "TRX-9001"},
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["status"], "pending_verification")

        response = self.client.post(
            reverse("event:cancel-booking", kwargs={"pk": new_booking_id})
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data, {"detail": "Booking cancelled successfully."})

    def test_vendor_can_use_vendor_endpoints(self):
        client = self.as_user(self.vendor_user)
        response = client.get(reverse("event:vendor-bookings"))
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["count"], 1)

        response = client.post(
            reverse("event:vendor-review-payment", kwargs={"pk": self.booking.pk}),
            {"action": "approve"},
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["status"], "confirmed")

    def test_other_customer_gets_not_found_for_foreign_booking(self):
        client = self.as_user(self.other_customer)
        for name in ["event:cancel-booking", "event:submit-payment-reference"]:
            with self.subTest(endpoint=name):
                response = client.post(
                    reverse(name, kwargs={"pk": self.booking.pk}),
                    {"payment_method": str(self.payment_method.id), "transaction_id": "TRX-1"},
                    format="json",
                )
                self.assertEqual(response.status_code, 404)
                self.assertEqual(response.data["code"], "not_found")

    def test_other_vendor_cannot_see_or_review_booking(self):
        client = self.as_user(self.other_vendor.user)
        response = client.get(reverse("event:vendor-bookings"))
        self.assertEqual(response.data["count"], 0)

        response = client.post(
            reverse("event:vendor-review-payment", kwargs={"pk": self.booking.pk}),
            {"action": "approve"},
            format="json",
        )
        self.assertEqual(response.status_code, 404)
        self.booking.refresh_from_db()
        self.assertEqual(self.booking.status, "pending_verification")


class BookingErrorResponseTests(BookingApiTestCase):
    """BOOK-007: booking errors follow the shapes in API_CONTRACT.md."""

    def test_invalid_seat_counts_are_field_errors(self):
        for seat_number in [0, -1, 101, "abc", None]:
            with self.subTest(seat_number=seat_number):
                response = self.book(seat_number=seat_number)
                self.assertEqual(response.status_code, 400)
                self.assertEqual(list(response.data), ["seat_number"])
                self.assertIsInstance(response.data["seat_number"], list)
        self.assertEqual(self.available_seats(), 5)

    def test_too_many_seats_is_a_field_error(self):
        response = self.book(seat_number=6)
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.data, {"seat_number": ["Only 5 seats are available."]})

    def test_unknown_event_is_a_field_error(self):
        response = self.book(event="00000000-0000-0000-0000-000000000000")
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.data, {"event": ["This event is no longer available."]})

    def test_sold_out_is_a_general_error_with_code(self):
        Event.objects.filter(pk=self.event.pk).update(available_seats=0)
        response = self.book()
        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.data, {"detail": "This event is sold out.", "code": "sold_out"}
        )

    def test_closed_event_is_a_general_error_with_code(self):
        Event.objects.filter(pk=self.event.pk).update(status="draft")
        response = self.book()
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.data["code"], "event_not_bookable")
        self.assertIsInstance(response.data["detail"], str)

    def test_repeated_cancel_is_a_conflict(self):
        booking = reserve_booking(user=self.customer, event_id=self.event.id, seat_number=2)
        url = reverse("event:cancel-booking", kwargs={"pk": booking.pk})
        client = self.as_user(self.customer)

        self.assertEqual(client.post(url).status_code, 200)
        response = client.post(url)
        self.assertEqual(response.status_code, 409)
        self.assertEqual(response.data["code"], "already_cancelled")
        self.assertEqual(self.available_seats(), 5)

    def test_cancel_after_deadline_is_a_business_rule_error(self):
        booking = self.confirmed_booking()
        start = timezone.localdate() + timedelta(days=1)
        Event.objects.filter(pk=self.event.pk).update(start_date=start)

        response = self.as_user(self.customer).post(
            reverse("event:cancel-booking", kwargs={"pk": booking.pk})
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.data["code"], "cancellation_closed")

    def test_duplicate_transaction_id_is_a_field_error(self):
        self.pending_booking(transaction_id="DUP-777")
        second = reserve_booking(
            user=self.other_customer, event_id=self.event.id, seat_number=1
        )
        response = self.as_user(self.other_customer).post(
            reverse("event:submit-payment-reference", kwargs={"pk": second.pk}),
            {"payment_method": str(self.payment_method.id), "transaction_id": " dup-777 "},
            format="json",
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(list(response.data), ["transaction_id"])

    def test_late_payment_reference_is_a_conflict_and_releases_seats(self):
        booking = reserve_booking(user=self.customer, event_id=self.event.id, seat_number=2)
        SeatBooking.objects.filter(pk=booking.pk).update(
            payment_reference_expires_at=timezone.now() - timedelta(seconds=1)
        )
        response = self.as_user(self.customer).post(
            reverse("event:submit-payment-reference", kwargs={"pk": booking.pk}),
            {"payment_method": str(self.payment_method.id), "transaction_id": "LATE-1"},
            format="json",
        )
        self.assertEqual(response.status_code, 409)
        self.assertEqual(response.data["code"], "booking_expired")
        booking.refresh_from_db()
        self.assertEqual(booking.status, "expired")
        self.assertEqual(self.available_seats(), 5)

    def test_reject_without_reason_is_a_field_error(self):
        booking = self.pending_booking()
        response = self.as_user(self.vendor_user).post(
            reverse("event:vendor-review-payment", kwargs={"pk": booking.pk}),
            {"action": "reject"},
            format="json",
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(list(response.data), ["reason"])


class ExceptionHandlerTests(TestCase):
    """BOOK-007: the project exception handler normalizes every error shape."""

    def handle(self, exc):
        return api_exception_handler(exc, {})

    def test_string_field_values_become_lists(self):
        response = self.handle(exceptions.ValidationError({"seat_number": "Too many."}))
        self.assertEqual(response.data, {"seat_number": ["Too many."]})

    def test_bare_string_becomes_non_field_error(self):
        response = self.handle(exceptions.ValidationError("Not allowed."))
        self.assertEqual(response.data, {"non_field_errors": ["Not allowed."]})

    def test_detail_stays_a_string(self):
        response = self.handle(exceptions.ValidationError({"detail": "Whole request."}))
        self.assertEqual(response.data, {"detail": "Whole request."})

    def test_django_validation_error_is_a_400(self):
        response = self.handle(DjangoValidationError("Wrong Password"))
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.data, {"non_field_errors": ["Wrong Password"]})

    def test_general_errors_include_code(self):
        response = self.handle(exceptions.NotFound("Missing."))
        self.assertEqual(response.data, {"detail": "Missing.", "code": "not_found"})

    @override_settings(DEBUG=False)
    def test_unhandled_error_is_json_500(self):
        with self.assertLogs("utils.exceptions", "ERROR"):
            response = self.handle(RuntimeError("database exploded"))
        self.assertEqual(response.status_code, 500)
        self.assertEqual(response.data["code"], "server_error")
        self.assertNotIn("exploded", response.data["detail"])

    @override_settings(DEBUG=True)
    def test_unhandled_error_uses_debug_page_in_development(self):
        self.assertIsNone(self.handle(RuntimeError("boom")))


class BookingPaginationTests(BookingApiTestCase):
    """BOOK-012: booking lists use the limit/offset envelope from API_CONTRACT.md."""

    def make_bookings(self, count, user=None, event=None, start=0):
        SeatBooking.objects.bulk_create(
            SeatBooking(
                event=event or self.event,
                user=user or self.customer,
                seat_number=1,
                booking_reference=f"TL-T{start + i:010d}",
                status="confirmed",
            )
            for i in range(count)
        )

    def test_customer_list_envelope_and_default_page(self):
        self.make_bookings(25)
        self.make_bookings(3, user=self.other_customer, start=100)

        response = self.as_user(self.customer).get(reverse("event:my-bookings"))

        self.assertEqual(response.status_code, 200)
        self.assertEqual(set(response.data), {"count", "next", "previous", "results"})
        self.assertEqual(response.data["count"], 25)
        self.assertEqual(len(response.data["results"]), 20)
        self.assertIsNone(response.data["previous"])
        self.assertIn("offset=20", response.data["next"])

        last_page = self.client.get(response.data["next"])
        self.assertEqual(len(last_page.data["results"]), 5)
        self.assertIsNone(last_page.data["next"])

    def test_offset_past_end_is_empty_not_404(self):
        self.make_bookings(3)
        response = self.as_user(self.customer).get(
            reverse("event:my-bookings"), {"offset": 50}
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["count"], 3)
        self.assertEqual(response.data["results"], [])

    def test_limit_is_capped_at_100(self):
        self.make_bookings(105)
        response = self.as_user(self.customer).get(
            reverse("event:my-bookings"), {"limit": 500}
        )
        self.assertEqual(len(response.data["results"]), 100)

    def test_invalid_limit_falls_back_to_default(self):
        self.make_bookings(25)
        for limit in ["abc", "0", "-5"]:
            with self.subTest(limit=limit):
                response = self.as_user(self.customer).get(
                    reverse("event:my-bookings"), {"limit": limit}
                )
                self.assertEqual(len(response.data["results"]), 20)

    def test_pages_never_skip_or_repeat_when_timestamps_tie(self):
        self.make_bookings(30)
        SeatBooking.objects.update(created_at=timezone.now())

        seen = []
        client = self.as_user(self.customer)
        for offset in range(0, 30, 7):
            response = client.get(
                reverse("event:my-bookings"), {"limit": 7, "offset": offset}
            )
            seen += [item["id"] for item in response.data["results"]]

        self.assertEqual(len(seen), 30)
        self.assertEqual(
            set(seen),
            {str(pk) for pk in SeatBooking.objects.values_list("id", flat=True)},
        )

    def test_vendor_list_is_paginated_and_scoped_to_vendor(self):
        other_event = make_event(self.other_vendor, title="Other Trip")
        self.make_bookings(22)
        self.make_bookings(4, event=other_event, start=100)

        response = self.as_user(self.vendor_user).get(reverse("event:vendor-bookings"))

        self.assertEqual(response.data["count"], 22)
        self.assertEqual(len(response.data["results"]), 20)
        self.assertTrue(
            all(item["event"] == self.event.id for item in response.data["results"])
        )
        self.assertIn("booking_reference", response.data["results"][0])
