"""
BOOK-015: concurrency tests against a database with real row locking.

Each call runs in its own thread with its own database connection, and a barrier
releases them together so they compete for the same rows. These tests need
PostgreSQL; SQLite ignores SELECT ... FOR UPDATE and serializes writes itself.
"""

import threading
import unittest
from datetime import timedelta
from unittest import mock

from django.db import connection
from django.test import TransactionTestCase
from django.utils import timezone

from utils.exceptions import BusinessRuleError, Conflict

from ..models import Event, SeatBooking
from ..services import cancel_booking, expire_booking, reserve_booking, review_payment
from ..tasks import send_booking_confirmation_email, send_booking_status_email
from .helpers import BookingFixturesMixin, make_user


def run_concurrently(*calls):
    """Start every call at the same moment; return each result or raised exception."""
    barrier = threading.Barrier(len(calls))
    outcomes = [None] * len(calls)

    def worker(index, call):
        try:
            barrier.wait(timeout=10)
            outcomes[index] = call()
        except Exception as exc:  # noqa: BLE001 - the test inspects every outcome
            outcomes[index] = exc
        finally:
            connection.close()

    threads = [
        threading.Thread(target=worker, args=(index, call))
        for index, call in enumerate(calls)
    ]
    for thread in threads:
        thread.start()
    for thread in threads:
        thread.join(timeout=30)
        if thread.is_alive():
            raise AssertionError("A concurrent booking call did not finish (deadlock?)")
    return outcomes


def errors(outcomes):
    return [outcome for outcome in outcomes if isinstance(outcome, Exception)]


def successes(outcomes):
    return [outcome for outcome in outcomes if not isinstance(outcome, Exception)]


@unittest.skipUnless(
    connection.vendor == "postgresql", "Concurrency tests need PostgreSQL row locks"
)
class BookingConcurrencyTests(BookingFixturesMixin, TransactionTestCase):
    def setUp(self):
        super().setUp()
        # Commits are real here, so on_commit would try to reach the Celery broker.
        for task in (send_booking_status_email, send_booking_confirmation_email):
            patcher = mock.patch.object(task, "delay")
            patcher.start()
            self.addCleanup(patcher.stop)

    def customers(self, count):
        return [make_user(f"racer{i}@example.com") for i in range(count)]

    def reserve_call(self, user, seat_number):
        return lambda: reserve_booking(
            user=user, event_id=self.event.id, seat_number=seat_number
        )

    def test_final_seats_are_never_oversold(self):
        Event.objects.filter(pk=self.event.pk).update(total_seats=3, available_seats=3)

        outcomes = run_concurrently(
            *(self.reserve_call(user, 1) for user in self.customers(10))
        )

        self.assertEqual(len(successes(outcomes)), 3)
        for error in errors(outcomes):
            self.assertIsInstance(error, BusinessRuleError)
            self.assertEqual(error.get_codes(), "sold_out")
        self.assertEqual(self.available_seats(), 0)
        self.assertEqual(SeatBooking.objects.count(), 3)
        self.assert_seats_consistent()

    def test_competing_multi_seat_requests_never_exceed_capacity(self):
        outcomes = run_concurrently(
            *(self.reserve_call(user, 2) for user in self.customers(4))
        )

        booked = successes(outcomes)
        self.assertEqual(len(booked), 2)
        self.assertEqual(self.available_seats(), 1)
        self.assertEqual(sum(booking.seat_number for booking in booked), 4)
        self.assert_seats_consistent()

    def test_concurrent_cancellation_restores_seats_once(self):
        booking = self.confirmed_booking(seat_number=2)
        reserve_booking(user=self.other_customer, event_id=self.event.id, seat_number=1)

        outcomes = run_concurrently(
            *(
                (lambda: cancel_booking(user=self.customer, booking_id=booking.id))
                for _ in range(8)
            )
        )

        self.assertEqual(len(successes(outcomes)), 1)
        for error in errors(outcomes):
            self.assertIsInstance(error, Conflict)
            self.assertEqual(error.get_codes(), "already_cancelled")
        self.assertEqual(self.available_seats(), 4)
        self.assert_seats_consistent()

    def test_cancellation_and_expiry_race_releases_seats_once(self):
        booking = reserve_booking(
            user=self.customer, event_id=self.event.id, seat_number=2
        )
        SeatBooking.objects.filter(pk=booking.pk).update(
            payment_reference_expires_at=timezone.now() - timedelta(seconds=1)
        )

        cancel = lambda: cancel_booking(user=self.customer, booking_id=booking.id)  # noqa: E731
        expire = lambda: expire_booking(booking.id)  # noqa: E731
        outcomes = run_concurrently(cancel, expire, cancel, expire, cancel, expire)

        cancelled = [o for o in outcomes if isinstance(o, SeatBooking)]
        expired = [o for o in outcomes if o is True]
        self.assertEqual(len(cancelled) + len(expired), 1)

        booking.refresh_from_db()
        self.assertIn(booking.status, ["cancelled", "expired"])
        self.assertEqual(self.available_seats(), 5)
        self.assert_seats_consistent()

    def test_approval_and_cancellation_race_stays_consistent(self):
        booking = self.pending_booking(seat_number=2)

        outcomes = run_concurrently(
            lambda: review_payment(
                vendor=self.vendor, booking_id=booking.id, action="approve"
            ),
            lambda: cancel_booking(user=self.customer, booking_id=booking.id),
        )

        # Either order ends cancelled: cancel-then-approve rejects the approval,
        # approve-then-cancel cancels a confirmed booking inside its deadline.
        for error in errors(outcomes):
            self.assertIsInstance(error, Conflict)
        booking.refresh_from_db()
        self.assertEqual(booking.status, "cancelled")
        self.assertEqual(self.available_seats(), 5)
        self.assert_seats_consistent()

    def test_rejection_and_expiry_race_releases_seats_once(self):
        booking = self.pending_booking(seat_number=3)
        SeatBooking.objects.filter(pk=booking.pk).update(
            verification_expires_at=timezone.now() - timedelta(seconds=1)
        )

        run_concurrently(
            lambda: review_payment(
                vendor=self.vendor,
                booking_id=booking.id,
                action="reject",
                reason="Not received",
            ),
            lambda: expire_booking(booking.id),
            lambda: expire_booking(booking.id),
        )

        booking.refresh_from_db()
        self.assertEqual(booking.status, "expired")
        self.assertEqual(self.available_seats(), 5)
        self.assert_seats_consistent()
