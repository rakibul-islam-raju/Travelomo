from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("event", "0016_manual_payment_decisions"),
    ]

    operations = [
        migrations.AlterField(
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
            ),
        ),
        migrations.AlterField(
            model_name="manualpaymentsubmission",
            name="amount",
            field=models.DecimalField(decimal_places=2, max_digits=12),
        ),
        migrations.AddConstraint(
            model_name="manualpaymentsubmission",
            constraint=models.UniqueConstraint(
                condition=models.Q(("status__in", ["pending", "verified"])),
                fields=("channel", "normalized_transaction_id"),
                name="unique_live_transaction_per_channel",
            ),
        ),
        migrations.AddConstraint(
            model_name="seatbooking",
            constraint=models.UniqueConstraint(
                condition=models.Q(
                    (
                        "status__in",
                        ["awaiting_payment_reference", "pending_verification"],
                    )
                ),
                fields=("event", "user"),
                name="one_unfinished_booking_per_customer_event",
            ),
        ),
    ]
