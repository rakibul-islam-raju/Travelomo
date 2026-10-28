from datetime import timedelta

from django.test import TestCase
from django.urls import reverse
from django.utils import timezone
from rest_framework.test import APIClient

from utils.exceptions import BusinessRuleError

from ..models import Event
from ..services import cancel_booking, reserve_booking
from .helpers import BookingFixturesMixin, make_event, make_vendor


def days(n):
    return timezone.localdate() + timedelta(days=n)


class DiscoveryTestCase(BookingFixturesMixin, TestCase):
    def setUp(self):
        super().setUp()
        self.client = APIClient()

    def as_user(self, user):
        self.client.force_authenticate(user=user)
        return self.client

    def listed_ids(self, client=None, url_name="event:event-list-create", **params):
        response = (client or APIClient()).get(reverse(url_name), params)
        self.assertEqual(response.status_code, 200, response.content)
        return {row["id"] for row in response.json()["results"]}

    def detail_status(self, event, client=None):
        url = reverse("event:event-detail", kwargs={"pk": event.pk})
        return (client or APIClient()).get(url).status_code


class EffectivePriceFilterTests(DiscoveryTestCase):
    """EVT-001: price filters use the price a customer pays, computed in the database."""

    def setUp(self):
        super().setUp()
        # setUp's self.event: actual 1500, discount 1200 -> pays 1200
        self.no_discount = make_event(
            self.vendor, title="No discount", actual_price=1000, discount_price=0
        )
        self.null_discount = make_event(
            self.vendor, title="Null discount", actual_price=2000, discount_price=None
        )
        # A naive actual_price filter would put this at 1300; customers pay 900.
        self.deep_discount = make_event(
            self.vendor, title="Deep discount", actual_price=1300, discount_price=900
        )

    def ids(self, *events):
        return {str(event.id) for event in events}

    def test_start_price_uses_discount_when_set(self):
        self.assertEqual(
            self.listed_ids(start_price=1100),
            self.ids(self.event, self.null_discount),
        )

    def test_end_price_uses_discount_when_set(self):
        self.assertEqual(
            self.listed_ids(end_price=1000),
            self.ids(self.no_discount, self.deep_discount),
        )

    def test_price_range_bounds_are_inclusive(self):
        self.assertEqual(
            self.listed_ids(start_price=1200, end_price=1200), self.ids(self.event)
        )
        self.assertEqual(
            self.listed_ids(start_price=1000, end_price=1200),
            self.ids(self.event, self.no_discount),
        )

    def test_price_filter_combines_with_search(self):
        self.assertEqual(
            self.listed_ids(search="discount", start_price=950),
            self.ids(self.no_discount, self.null_discount),
        )

    def test_invalid_price_is_a_field_error(self):
        response = APIClient().get(
            reverse("event:event-list-create"), {"start_price": "cheap"}
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("start_price", response.json())

    def test_admin_and_vendor_lists_share_the_price_filter(self):
        self.assertEqual(
            self.listed_ids(
                self.as_user(self.admin), "event:admin-event-list", end_price=1000
            ),
            self.ids(self.no_discount, self.deep_discount),
        )
        self.assertEqual(
            self.listed_ids(
                self.as_user(self.vendor_user), "event:vendor-event-list", end_price=1000
            ),
            self.ids(self.no_discount, self.deep_discount),
        )

    def test_database_price_matches_the_price_property(self):
        priced = Event.objects.with_effective_price()
        for event in Event.objects.all():
            self.assertTrue(
                priced.filter(pk=event.pk, effective_price=event.price).exists(),
                event.title,
            )

    def test_with_effective_price_can_be_applied_twice(self):
        events = Event.objects.with_effective_price().with_effective_price()
        self.assertEqual(events.filter(effective_price__lte=900).count(), 1)


class PublicVisibilityTests(DiscoveryTestCase):
    """EVT-007: what customers and anonymous visitors can list and open.

    Listing follows booking eligibility (published, unarchived, not yet
    started). Sold-out events stay listed. Detail pages stay reachable for
    published events after they start, so booking history links keep working.
    """

    def setUp(self):
        super().setUp()
        self.open_event = self.event
        self.sold_out = make_event(self.vendor, title="Sold out")
        Event.objects.filter(pk=self.sold_out.pk).update(available_seats=0)
        self.archived = make_event(self.vendor, title="Archived", is_archived=True)
        self.starts_today = make_event(
            self.vendor, title="Starts today", start_date=days(0), end_date=days(2)
        )
        self.in_progress = make_event(
            self.vendor, title="In progress", start_date=days(-1), end_date=days(1)
        )
        self.ended = make_event(
            self.vendor, title="Ended", start_date=days(-5), end_date=days(-3)
        )
        self.by_status = {
            status: make_event(self.vendor, title=status.title(), status=status)
            for status in ["draft", "paused", "travelling", "cancelled", "completed"]
        }

    def test_public_list_shows_only_bookable_and_sold_out_events(self):
        expected = {str(self.open_event.id), str(self.sold_out.id)}
        self.assertEqual(self.listed_ids(), expected)
        self.assertEqual(self.listed_ids(self.as_user(self.customer)), expected)

    def test_hidden_from_public_list(self):
        listed = self.listed_ids()
        hidden = [
            self.archived,
            self.starts_today,
            self.in_progress,
            self.ended,
            *self.by_status.values(),
        ]
        for event in hidden:
            self.assertNotIn(str(event.id), listed, event.title)

    def test_available_seats_filter_excludes_sold_out(self):
        self.assertEqual(
            self.listed_ids(available_seats=1), {str(self.open_event.id)}
        )

    def test_query_params_cannot_widen_the_public_list(self):
        self.assertEqual(self.listed_ids(status="draft"), set())
        self.assertEqual(self.listed_ids(is_archived="true"), set())

    def test_public_detail_for_published_unarchived_events(self):
        for event in [
            self.open_event,
            self.sold_out,
            self.starts_today,
            self.in_progress,
            self.ended,
        ]:
            self.assertEqual(self.detail_status(event), 200, event.title)
            self.assertEqual(
                self.detail_status(event, self.as_user(self.customer)), 200, event.title
            )

    def test_public_detail_is_not_found_for_hidden_events(self):
        for event in [self.archived, *self.by_status.values()]:
            self.assertEqual(self.detail_status(event), 404, event.title)
            self.assertEqual(
                self.detail_status(event, self.as_user(self.customer)), 404, event.title
            )

    def test_listing_matches_booking_eligibility(self):
        """An event is listed exactly when booking it fails for no reason but seats."""
        listed = self.listed_ids()
        for event in Event.objects.all():
            try:
                booking = reserve_booking(
                    user=self.customer, event_id=event.id, seat_number=1
                )
                cancel_booking(user=self.customer, booking_id=booking.id)
                bookable = True
            except BusinessRuleError as exc:
                bookable = exc.detail.code == "sold_out"
            self.assertEqual(str(event.id) in listed, bookable, event.title)

    def test_admin_lists_every_event(self):
        self.assertEqual(
            self.listed_ids(self.as_user(self.admin)),
            {str(event.id) for event in Event.objects.all()},
        )

    def test_vendor_lists_only_own_events(self):
        other = make_event(self.other_vendor, title="Other vendor's event")
        listed = self.listed_ids(self.as_user(self.vendor_user))
        self.assertNotIn(str(other.id), listed)
        self.assertEqual(
            listed,
            {str(pk) for pk in Event.objects.filter(vendor=self.vendor).values_list("pk", flat=True)},
        )


class AdminEventDetailTests(DiscoveryTestCase):
    """ADMIN-001/002: the admin event-detail endpoint."""

    def url(self, event=None):
        return reverse("event:admin-event-detail", kwargs={"pk": (event or self.event).pk})

    def test_only_admins_can_read(self):
        self.assertEqual(APIClient().get(self.url()).status_code, 401)
        for user in [self.customer, self.vendor_user]:
            client = APIClient()
            client.force_authenticate(user=user)
            self.assertEqual(client.get(self.url()).status_code, 403, user.email)

    def test_admin_can_read_hidden_events(self):
        archived_draft = make_event(
            self.vendor, title="Hidden", status="draft", is_archived=True
        )
        response = self.as_user(self.admin).get(self.url(archived_draft))
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["status"], "draft")
        self.assertTrue(response.json()["is_archived"])

    def test_unknown_event_is_not_found(self):
        response = self.as_user(self.admin).get(
            reverse(
                "event:admin-event-detail",
                kwargs={"pk": "00000000-0000-0000-0000-000000000000"},
            )
        )
        self.assertEqual(response.status_code, 404)

    def test_includes_event_and_vendor_details(self):
        data = self.as_user(self.admin).get(self.url()).json()
        for field in [
            "title",
            "start_date",
            "end_date",
            "location",
            "total_seats",
            "available_seats",
            "seat_booked",
            "actual_price",
            "discount_price",
            "price",
            "status",
            "is_archived",
            "cancellation_days",
        ]:
            self.assertIn(field, data)
        self.assertEqual(data["price"], 1200)
        self.assertEqual(
            data["vendor"],
            {
                "id": str(self.vendor.id),
                "store_name": "Friendly Tours",
                "logo": None,
                "store_email": None,
                "store_phone": None,
                "owner_email": "vendor@example.com",
                "is_approved": True,
            },
        )

    def test_booking_summary_with_no_bookings(self):
        summary = self.as_user(self.admin).get(self.url()).json()["booking_summary"]
        self.assertEqual(summary["total_bookings"], 0)
        self.assertEqual(summary["verified_booking_value"], "0.00")
        self.assertEqual(len(summary["statuses"]), 6)
        for row in summary["statuses"]:
            self.assertEqual((row["bookings"], row["seats"], row["amount"]), (0, 0, "0.00"))

    def test_booking_summary_counts_each_status(self):
        self.confirmed_booking(seat_number=2)
        self.pending_booking(user=self.other_customer, seat_number=1)
        cancelled = reserve_booking(user=self.customer, event_id=self.event.id, seat_number=1)
        cancel_booking(user=self.customer, booking_id=cancelled.id)
        # Another event's bookings must not leak into this summary.
        other_vendor, _ = make_vendor("vendor3@example.com", "Third Tours")
        other_event = make_event(other_vendor, title="Elsewhere")
        reserve_booking(user=self.customer, event_id=other_event.id, seat_number=1)

        summary = self.as_user(self.admin).get(self.url()).json()["booking_summary"]
        by_status = {row["status"]: row for row in summary["statuses"]}

        self.assertEqual(summary["total_bookings"], 3)
        self.assertEqual(summary["verified_booking_value"], "2400.00")
        self.assertEqual(summary["currency"], "BDT")
        self.assertEqual(
            (by_status["confirmed"]["bookings"], by_status["confirmed"]["seats"]), (1, 2)
        )
        self.assertEqual(by_status["confirmed"]["amount"], "2400.00")
        self.assertEqual(by_status["pending_verification"]["seats"], 1)
        self.assertEqual(by_status["cancelled"]["bookings"], 1)
        self.assertEqual(by_status["awaiting_payment_reference"]["bookings"], 0)
        self.assertEqual(by_status["confirmed"]["label"], "Confirmed")
