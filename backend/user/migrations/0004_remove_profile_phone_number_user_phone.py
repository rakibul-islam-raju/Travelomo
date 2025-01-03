# Generated by Django 5.1.1 on 2025-01-03 05:51

import phonenumber_field.modelfields
from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("user", "0003_remove_profile_avatar_user_avatar"),
    ]

    operations = [
        migrations.RemoveField(
            model_name="profile",
            name="phone_number",
        ),
        migrations.AddField(
            model_name="user",
            name="phone",
            field=phonenumber_field.modelfields.PhoneNumberField(
                blank=True, max_length=128, null=True, region=None
            ),
        ),
    ]