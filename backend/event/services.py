from datetime import timedelta
from decimal import Decimal

from django.conf import settings
from django.db import IntegrityError, transaction
from django.db.models import F
from django.utils import timezone
from rest_framework import serializers
from rest_framework.exceptions import NotFound, PermissionDenied

from utils.exceptions import BusinessRuleError, Conflict
from vendor.models import VendorPaymentMethod

from .models import Event, ManualPaymentSubmission, SeatBooking

# Booking rows are locked with `of=("self",)` so PostgreSQL locks only the booking.
# Locking the nullable side of an outer join (e.g. `payment_submission`) is an error,
# and locking joined event/vendor rows would serialize unrelated requests.
LOCK_SELF = ("self",)


def _release_seats(booking: SeatBooking) -> None:
    """Release a reservation once while its booking row is locked."""
    if booking.seats_released_at is not None:
        return

    Event.objects.filter(pk=booking.event_id).update(
        available_seats=F("available_seats") + booking.seat_number
    )
    booking.seats_released_at = timezone.now()


def _expire(booking: SeatBooking) -> None:
    """Expire a locked booking: release its seats once and close a pending submission."""
    booking.status = "expired"
    _release_seats(booking)
    booking.save(update_fields=["status", "seats_released_at", "updated_at"])
    ManualPaymentSubmission.objects.filter(booking=booking, status="pending").update(
        status="expired", updated_at=timezone.now()
    )


def _deadline(event: Event, ttl: timedelta):
    """DEC-002: a hold never outlasts the start of the event."""
    return min(timezone.now() + ttl, event.starts_at)


def _seats_label(count: int) -> str:
    return f"{count} seat{'s are' if count != 1 else ' is'}"


def reserve_booking(*, user, event_id, seat_number: int) -> SeatBooking:
    if user.role != "customer":
        raise PermissionDenied("Only customer accounts can reserve seats.")
    if seat_number < 1:
        raise serializers.ValidationError(
            {"seat_number": ["Choose at least one seat."]}
        )

    with transaction.atomic():
        try:
            # Concurrent reservations for the same event wait here, one at a time.
            event = (
                Event.objects.select_for_update(of=LOCK_SELF)
                .select_related("vendor")
                .get(pk=event_id)
            )
        except Event.DoesNotExist as exc:
            raise serializers.ValidationError(
                {"event": ["This event is no longer available."]}
            ) from exc

        if event.status != "published" or event.is_archived:
            raise BusinessRuleError(
                "This event is not open for booking.", code="event_not_bookable"
            )
        if event.start_date <= timezone.localdate():
            raise BusinessRuleError(
                "Booking has closed because this event has started.",
                code="booking_closed",
            )
        if not event.vendor.payment_methods.filter(is_active=True).exists():
            raise BusinessRuleError(
                "The organizer has not added payment instructions yet. "
                "Please try again later.",
                code="payment_unavailable",
            )

        # DEC-003: one unfinished reservation per customer and event. A hold whose
        # deadline has passed but has not been swept yet is expired here instead.
        unfinished = SeatBooking.objects.filter(
            event=event, user=user, status__in=SeatBooking.UNFINISHED_STATUSES
        ).values_list("pk", flat=True)
        for booking_id in unfinished:
            if not expire_booking(booking_id):
                raise Conflict(
                    "You already have a reservation for this event that is waiting "
                    "for payment or verification. Finish or cancel it in My Bookings "
                    "before booking again.",
                    code="unfinished_booking_exists",
                )
            event.refresh_from_db(fields=["available_seats"])

        available_seats = event.available_seats or 0
        if available_seats == 0:
            raise BusinessRuleError("This event is sold out.", code="sold_out")
        if seat_number > available_seats:
            raise serializers.ValidationError(
                {"seat_number": [f"Only {_seats_label(available_seats)} available."]}
            )

        # The conditional update is a second guard: it can never take
        # available_seats below zero, even if the row lock above were bypassed.
        reserved = Event.objects.filter(
            pk=event.pk, available_seats__gte=seat_number
        ).update(available_seats=F("available_seats") - seat_number)
        if not reserved:
            raise BusinessRuleError(
                "Those seats were just taken. Please choose fewer seats.",
                code="sold_out",
            )

        unit_price = Decimal(str(event.price))
        booking = SeatBooking.objects.create(
            event=event,
            user=user,
            seat_number=seat_number,
            unit_price=unit_price,
            total_amount=unit_price * seat_number,
            currency="BDT",
            status="awaiting_payment_reference",
            payment_reference_expires_at=_deadline(
                event,
                timedelta(minutes=settings.BOOKING_PAYMENT_REFERENCE_TTL_MINUTES),
            ),
        )

    return booking


def submit_payment_reference(
    *, user, booking_id, payment_method_id, transaction_id: str
) -> SeatBooking:
    transaction_id = transaction_id.strip()
    if len(transaction_id) < 4:
        raise serializers.ValidationError(
            {"transaction_id": ["Enter the complete transaction ID."]}
        )

    expired = False
    try:
        with transaction.atomic():
            try:
                booking = (
                    SeatBooking.objects.select_for_update(of=LOCK_SELF)
                    .select_related("event__vendor")
                    .get(pk=booking_id, user=user)
                )
            except SeatBooking.DoesNotExist as exc:
                raise NotFound("Booking reservation not found.") from exc

            if booking.status != "awaiting_payment_reference":
                raise Conflict(
                    "This reservation is not accepting a payment reference.",
                    code="invalid_booking_state",
                )
            if (
                booking.payment_reference_expires_at
                and booking.payment_reference_expires_at <= timezone.now()
            ):
                _expire(booking)
                expired = True
            else:
                try:
                    payment_method = VendorPaymentMethod.objects.get(
                        pk=payment_method_id,
                        vendor=booking.event.vendor,
                        is_active=True,
                    )
                except VendorPaymentMethod.DoesNotExist as exc:
                    raise serializers.ValidationError(
                        {"payment_method": ["Choose an available payment method."]}
                    ) from exc

                ManualPaymentSubmission.objects.create(
                    booking=booking,
                    payment_method=payment_method,
                    submitted_by=user,
                    transaction_id=transaction_id,
                    amount=booking.total_amount,
                    currency=booking.currency,
                )
                booking.status = "pending_verification"
                booking.verification_expires_at = _deadline(
                    booking.event,
                    timedelta(hours=settings.BOOKING_VERIFICATION_TTL_HOURS),
                )
                booking.save(
                    update_fields=[
                        "status",
                        "verification_expires_at",
                        "updated_at",
                    ]
                )
                from .tasks import send_booking_status_email

                transaction.on_commit(
                    lambda booking_id=str(booking.id): send_booking_status_email.delay(
                        booking_id,
                        (
                            "We received your transaction ID. The organizer will "
                            "verify it before your seats are confirmed."
                        ),
                    ),
                    robust=True,
                )
    except IntegrityError as exc:
        raise serializers.ValidationError(
            {
                "transaction_id": [
                    "This transaction ID has already been submitted. "
                    "Check the ID or contact the organizer."
                ]
            }
        ) from exc

    if expired:
        # Raised after the commit so the expiry and seat release are kept.
        raise Conflict(
            "Your seat hold expired before the transaction ID was submitted. "
            "No booking was confirmed; please start again.",
            code="booking_expired",
        )

    return booking


def review_payment(*, vendor, booking_id, action: str, reason: str = "") -> SeatBooking:
    if action not in ["approve", "reject"]:
        raise serializers.ValidationError(
            {"action": ["Choose either approve or reject."]}
        )
    if action == "reject" and len(reason.strip()) < 3:
        raise serializers.ValidationError(
            {"reason": ["Briefly explain why the payment was rejected."]}
        )

    expired = False
    with transaction.atomic():
        try:
            booking = (
                SeatBooking.objects.select_for_update(of=LOCK_SELF)
                .select_related("event", "user", "payment_submission")
                .get(pk=booking_id, event__vendor=vendor)
            )
        except SeatBooking.DoesNotExist as exc:
            raise NotFound("Booking not found for your store.") from exc

        if booking.status != "pending_verification":
            raise Conflict(
                "This payment has already been reviewed or is no longer active.",
                code="invalid_booking_state",
            )
        if (
            booking.verification_expires_at
            and booking.verification_expires_at <= timezone.now()
        ):
            _expire(booking)
            expired = True
        else:
            submission = booking.payment_submission
            submission.reviewed_by = vendor.user
            submission.reviewed_at = timezone.now()

            if action == "approve":
                booking.status = "confirmed"
                submission.status = "verified"
                submission.rejection_reason = ""
            else:
                booking.status = "payment_rejected"
                submission.status = "rejected"
                submission.rejection_reason = reason.strip()
                _release_seats(booking)

            booking.save(
                update_fields=["status", "seats_released_at", "updated_at"]
            )
            submission.save(
                update_fields=[
                    "status",
                    "reviewed_by",
                    "reviewed_at",
                    "rejection_reason",
                    "updated_at",
                ]
            )

            if action == "approve":
                from .tasks import send_booking_confirmation_email

                transaction.on_commit(
                    lambda booking_id=str(booking.id): send_booking_confirmation_email.delay(
                        booking_id
                    ),
                    robust=True,
                )
            else:
                from .tasks import send_booking_status_email

                transaction.on_commit(
                    lambda booking_id=str(booking.id): send_booking_status_email.delay(
                        booking_id,
                        (
                            "The organizer could not verify your transaction. "
                            "Your held seats have been released."
                        ),
                    ),
                    robust=True,
                )

    if expired:
        raise Conflict(
            "The verification window expired, so the held seats were released.",
            code="booking_expired",
        )

    return booking


def cancel_booking(*, user, booking_id) -> SeatBooking:
    with transaction.atomic():
        try:
            # Concurrent cancellations of one booking wait here; only the first
            # sees an active status, so seats are restored exactly once.
            booking = (
                SeatBooking.objects.select_for_update(of=LOCK_SELF)
                .select_related("event")
                .get(pk=booking_id, user=user)
            )
        except SeatBooking.DoesNotExist as exc:
            raise NotFound("Booking not found.") from exc

        if booking.status == "cancelled":
            raise Conflict(
                "This booking is already cancelled.", code="already_cancelled"
            )
        if booking.status in ["expired", "payment_rejected"]:
            raise Conflict(
                "This booking is no longer active.", code="invalid_booking_state"
            )
        if not booking.can_cancel:
            raise BusinessRuleError(
                "This booking can no longer be cancelled. "
                "Please contact the organizer if you need help.",
                code="cancellation_closed",
            )

        # A verified submission stays verified: the payment happened, and any
        # refund is arranged off-platform (DEC-004).
        ManualPaymentSubmission.objects.filter(
            booking=booking, status="pending"
        ).update(status="withdrawn", updated_at=timezone.now())

        booking.status = "cancelled"
        booking.cancelled_at = timezone.now()
        _release_seats(booking)
        booking.save(
            update_fields=[
                "status",
                "cancelled_at",
                "seats_released_at",
                "updated_at",
            ]
        )
        from .tasks import send_booking_status_email

        transaction.on_commit(
            lambda booking_id=str(booking.id): send_booking_status_email.delay(
                booking_id,
                "Your booking was cancelled and its seats were released.",
            ),
            robust=True,
        )

    return booking


def expire_booking(booking_id) -> bool:
    with transaction.atomic():
        try:
            booking = SeatBooking.objects.select_for_update().get(pk=booking_id)
        except SeatBooking.DoesNotExist:
            return False

        now = timezone.now()
        should_expire = (
            booking.status == "awaiting_payment_reference"
            and booking.payment_reference_expires_at
            and booking.payment_reference_expires_at <= now
        ) or (
            booking.status == "pending_verification"
            and booking.verification_expires_at
            and booking.verification_expires_at <= now
        )
        if not should_expire:
            return False

        _expire(booking)
        from .tasks import send_booking_status_email

        transaction.on_commit(
            lambda booking_id=str(booking.id): send_booking_status_email.delay(
                booking_id,
                "The booking deadline passed, so the held seats were released.",
            ),
            robust=True,
        )
        return True
