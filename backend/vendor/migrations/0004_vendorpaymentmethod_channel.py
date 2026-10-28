from django.db import migrations, models

# Existing methods were free text. Infer the channel from the vendor's label;
# anything unrecognised is treated as a bank transfer (see DECISIONS.md, DEC-001).
CHANNEL_KEYWORDS = [
    ("bkash", "bkash"),
    ("nagad", "nagad"),
    ("rocket", "rocket"),
    ("upay", "upay"),
]


def infer_channel(name):
    compact = "".join(name.lower().split())
    for keyword, channel in CHANNEL_KEYWORDS:
        if keyword in compact:
            return channel
    return "bank_transfer"


def backfill_channel(apps, schema_editor):
    VendorPaymentMethod = apps.get_model("vendor", "VendorPaymentMethod")
    for method in VendorPaymentMethod.objects.filter(channel__isnull=True).iterator():
        method.channel = infer_channel(method.name)
        method.save(update_fields=["channel"])


class Migration(migrations.Migration):

    dependencies = [
        ("vendor", "0003_vendorpaymentmethod"),
    ]

    operations = [
        migrations.AddField(
            model_name="vendorpaymentmethod",
            name="channel",
            field=models.CharField(
                choices=[
                    ("bkash", "bKash"),
                    ("nagad", "Nagad"),
                    ("rocket", "Rocket"),
                    ("upay", "Upay"),
                    ("bank_transfer", "Bank transfer"),
                ],
                max_length=20,
                null=True,
            ),
        ),
        migrations.RunPython(backfill_channel, migrations.RunPython.noop),
    ]
