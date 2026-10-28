"""Data model for DEC-003, DEC-004 and DEC-007 (see DECISIONS.md).

Adds channel/amount snapshots to submissions and backfills existing rows. The
new constraints are added in 0017, after this data is consistent.
"""

from django.db import migrations, models
from django.db.models import Count, F
from django.utils import timezone

UNFINISHED = ["awaiting_payment_reference", "pending_verification"]


def backfill_submissions(apps, schema_editor):
    ManualPaymentSubmission = apps.get_model("event", "ManualPaymentSubmission")
    submissions = ManualPaymentSubmission.objects.select_related(
        "payment_method", "booking"
    )
    for submission in submissions.iterator():
        submission.channel = submission.payment_method.channel
        submission.amount = submission.booking.total_amount
        submission.currency = submission.booking.currency
        if (
            submission.status == "rejected"
            and submission.rejection_reason == "Cancelled by customer"
        ):
            # cancel_booking used to record a withdrawal as a rejection.
            submission.status = "withdrawn"
            submission.rejection_reason = ""
            submission.reviewed_at = None
        elif submission.status == "pending" and submission.booking.status == "expired":
            submission.status = "expired"
        submission.save(
            update_fields=[
                "channel",
                "amount",
                "currency",
                "status",
                "rejection_reason",
                "reviewed_at",
            ]
        )


def expire_duplicate_unfinished_bookings(apps, schema_editor):
    """Keep each customer's newest unfinished booking per event; expire the rest."""
    SeatBooking = apps.get_model("event", "SeatBooking")
    Event = apps.get_model("event", "Event")
    ManualPaymentSubmission = apps.get_model("event", "ManualPaymentSubmission")
    now = timezone.now()

    duplicates = (
        SeatBooking.objects.filter(status__in=UNFINISHED)
        .values("event_id", "user_id")
        .annotate(count=Count("id"))
        .filter(count__gt=1)
    )
    for group in duplicates:
        older = SeatBooking.objects.filter(
            status__in=UNFINISHED, event_id=group["event_id"], user_id=group["user_id"]
        ).order_by("-created_at", "-id")[1:]
        for booking in older:
            if booking.seats_released_at is None:
                Event.objects.filter(pk=booking.event_id).update(
                    available_seats=F("available_seats") + booking.seat_number
                )
                booking.seats_released_at = now
            booking.status = "expired"
            booking.save(update_fields=["status", "seats_released_at"])
            ManualPaymentSubmission.objects.filter(
                booking=booking, status="pending"
            ).update(status="expired")


def check_live_transaction_ids_are_unique(apps, schema_editor):
    ManualPaymentSubmission = apps.get_model("event", "ManualPaymentSubmission")
    clashes = (
        ManualPaymentSubmission.objects.filter(status__in=["pending", "verified"])
        .values("channel", "normalized_transaction_id")
        .annotate(count=Count("id"))
        .filter(count__gt=1)
    )
    if clashes:
        details = []
        for clash in clashes:
            references = ManualPaymentSubmission.objects.filter(
                status__in=["pending", "verified"],
                channel=clash["channel"],
                normalized_transaction_id=clash["normalized_transaction_id"],
            ).values_list("booking__booking_reference", flat=True)
            details.append(
                f"{clash['channel']} {clash['normalized_transaction_id']}: "
                + ", ".join(references)
            )
        raise RuntimeError(
            "These transaction IDs back more than one pending or verified booking "
            "on the same channel. Reject or cancel the duplicates, then migrate "
            "again:\n" + "\n".join(details)
        )


class Migration(migrations.Migration):

    dependencies = [
        ("event", "0015_seatbooking_booking_reference_and_more"),
        ("vendor", "0004_vendorpaymentmethod_channel"),
    ]

    operations = [
        migrations.RemoveConstraint(
            model_name="manualpaymentsubmission",
            name="unique_transaction_per_payment_method",
        ),
        migrations.AlterField(
            model_name="manualpaymentsubmission",
            name="status",
            field=models.CharField(
                choices=[
                    ("pending", "Pending"),
                    ("verified", "Verified"),
                    ("rejected", "Rejected"),
                    ("withdrawn", "Withdrawn"),
                    ("expired", "Expired"),
                ],
                default="pending",
                max_length=20,
            ),
        ),
        migrations.AddField(
            model_name="manualpaymentsubmission",
            name="channel",
            field=models.CharField(
                choices=[
                    ("bkash", "bKash"),
                    ("nagad", "Nagad"),
                    ("rocket", "Rocket"),
                    ("upay", "Upay"),
                    ("bank_transfer", "Bank transfer"),
                ],
                editable=False,
                max_length=20,
                null=True,
            ),
        ),
        migrations.AddField(
            model_name="manualpaymentsubmission",
            name="amount",
            field=models.DecimalField(decimal_places=2, max_digits=12, null=True),
        ),
        migrations.AddField(
            model_name="manualpaymentsubmission",
            name="currency",
            field=models.CharField(default="BDT", max_length=3),
        ),
        migrations.RunPython(backfill_submissions, migrations.RunPython.noop),
        migrations.RunPython(
            expire_duplicate_unfinished_bookings, migrations.RunPython.noop
        ),
        migrations.RunPython(
            check_live_transaction_ids_are_unique, migrations.RunPython.noop
        ),
    ]
