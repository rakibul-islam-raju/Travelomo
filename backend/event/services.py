from datetime import timedelta
from decimal import Decimal

from django.conf import settings
from django.db import IntegrityError, transaction
from django.db.models import F
from django.utils import timezone
from rest_framework import serializers

from vendor.models import VendorPaymentMethod

from .models import Event, ManualPaymentSubmission, SeatBooking


def _release_seats(booking: SeatBooking) -> None:
    """Release a reservation once while its booking row is locked."""
    if booking.seats_released_at is not None:
        return

    Event.objects.filter(pk=booking.event_id).update(
        available_seats=F("available_seats") + booking.seat_number
    )
    booking.seats_released_at = timezone.now()


def reserve_booking(*, user, event_id, seat_number: int) -> SeatBooking:
    if user.role != "customer":
        raise serializers.ValidationError(
            {"detail": "Only customer accounts can reserve seats."}
        )
    if seat_number < 1:
        raise serializers.ValidationError(
            {"seat_number": "Choose at least one seat."}
        )

    with transaction.atomic():
        try:
            event = (
                Event.objects.select_for_update()
                .select_related("vendor")
                .get(pk=event_id)
            )
        except Event.DoesNotExist as exc:
            raise serializers.ValidationError(
                {"event": "This event is no longer available."}
            ) from exc

        if event.status != "published" or event.is_archived:
            raise serializers.ValidationError(
                {"event": "This event is not open for booking."}
            )
        if event.start_date <= timezone.localdate():
            raise serializers.ValidationError(
                {"event": "Booking has closed because this event has started."}
            )
        if not event.vendor.payment_methods.filter(is_active=True).exists():
            raise serializers.ValidationError(
                {
                    "event": (
                        "The organizer has not added payment instructions yet. "
                        "Please try again later."
                    )
                }
            )
        if seat_number > event.available_seats:
            raise serializers.ValidationError(
                {
                    "seat_number": (
                        f"Only {event.available_seats} seat"
                        f"{'s are' if event.available_seats != 1 else ' is'} available."
                    )
                }
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
            payment_reference_expires_at=timezone.now()
            + timedelta(
                minutes=settings.BOOKING_PAYMENT_REFERENCE_TTL_MINUTES
            ),
        )
        Event.objects.filter(pk=event.pk).update(
            available_seats=F("available_seats") - seat_number
        )

    return booking


def submit_payment_reference(
    *, user, booking_id, payment_method_id, transaction_id: str
) -> SeatBooking:
    transaction_id = transaction_id.strip()
    if len(transaction_id) < 4:
        raise serializers.ValidationError(
            {"transaction_id": "Enter the complete transaction ID."}
        )

    expired = False
    try:
        with transaction.atomic():
            try:
                booking = (
                    SeatBooking.objects.select_for_update()
                    .select_related("event__vendor")
                    .get(pk=booking_id, user=user)
                )
            except SeatBooking.DoesNotExist as exc:
                raise serializers.ValidationError(
                    {"detail": "Booking reservation not found."}
                ) from exc

            if booking.status != "awaiting_payment_reference":
                raise serializers.ValidationError(
                    {"detail": "This reservation is not accepting a payment reference."}
                )
            if (
                booking.payment_reference_expires_at
                and booking.payment_reference_expires_at <= timezone.now()
            ):
                booking.status = "expired"
                _release_seats(booking)
                booking.save(
                    update_fields=["status", "seats_released_at", "updated_at"]
                )
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
                        {"payment_method": "Choose an available payment method."}
                    ) from exc

                ManualPaymentSubmission.objects.create(
                    booking=booking,
                    payment_method=payment_method,
                    submitted_by=user,
                    transaction_id=transaction_id,
                )
                booking.status = "pending_verification"
                booking.verification_expires_at = timezone.now() + timedelta(
                    hours=settings.BOOKING_VERIFICATION_TTL_HOURS
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
                "transaction_id": (
                    "This transaction ID has already been submitted. "
                    "Check the ID or contact the organizer."
                )
            }
        ) from exc

    if expired:
        raise serializers.ValidationError(
            {
                "detail": (
                    "Your seat hold expired before the transaction ID was submitted. "
                    "No booking was confirmed; please start again."
                )
            }
        )

    return booking


def review_payment(*, vendor, booking_id, action: str, reason: str = "") -> SeatBooking:
    if action not in ["approve", "reject"]:
        raise serializers.ValidationError(
            {"action": "Choose either approve or reject."}
        )
    if action == "reject" and len(reason.strip()) < 3:
        raise serializers.ValidationError(
            {"reason": "Briefly explain why the payment was rejected."}
        )

    expired = False
    with transaction.atomic():
        try:
            booking = (
                SeatBooking.objects.select_for_update()
                .select_related("event", "user", "payment_submission")
                .get(pk=booking_id, event__vendor=vendor)
            )
        except SeatBooking.DoesNotExist as exc:
            raise serializers.ValidationError(
                {"detail": "Booking not found for your store."}
            ) from exc

        if booking.status != "pending_verification":
            raise serializers.ValidationError(
                {"detail": "This payment has already been reviewed or is no longer active."}
            )
        if (
            booking.verification_expires_at
            and booking.verification_expires_at <= timezone.now()
        ):
            booking.status = "expired"
            _release_seats(booking)
            booking.save(update_fields=["status", "seats_released_at", "updated_at"])
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
        raise serializers.ValidationError(
            {
                "detail": (
                    "The verification window expired, so the held seats were released."
                )
            }
        )

    return booking


def cancel_booking(*, user, booking_id) -> SeatBooking:
    with transaction.atomic():
        try:
            booking = (
                SeatBooking.objects.select_for_update()
                .select_related("event")
                .get(pk=booking_id, user=user)
            )
        except SeatBooking.DoesNotExist as exc:
            raise serializers.ValidationError(
                {"detail": "Booking not found."}
            ) from exc

        if not booking.can_cancel:
            raise serializers.ValidationError(
                {
                    "detail": (
                        "This booking can no longer be cancelled. "
                        "Please contact the organizer if you need help."
                    )
                }
            )

        if hasattr(booking, "payment_submission") and booking.status == "pending_verification":
            submission = booking.payment_submission
            submission.status = "rejected"
            submission.rejection_reason = "Cancelled by customer"
            submission.reviewed_at = timezone.now()
            submission.save(
                update_fields=[
                    "status",
                    "rejection_reason",
                    "reviewed_at",
                    "updated_at",
                ]
            )

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

        booking.status = "expired"
        _release_seats(booking)
        booking.save(update_fields=["status", "seats_released_at", "updated_at"])
        from .tasks import send_booking_status_email

        transaction.on_commit(
            lambda booking_id=str(booking.id): send_booking_status_email.delay(
                booking_id,
                "The booking deadline passed, so the held seats were released.",
            ),
            robust=True,
        )
        return True
