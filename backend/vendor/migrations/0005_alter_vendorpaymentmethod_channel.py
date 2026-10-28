from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("vendor", "0004_vendorpaymentmethod_channel"),
    ]

    operations = [
        migrations.AlterField(
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
            ),
        ),
    ]
