# Generated by Django 5.1.1 on 2024-12-22 12:39

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("user", "0002_profile"),
    ]

    operations = [
        migrations.RemoveField(
            model_name="profile",
            name="avatar",
        ),
        migrations.AddField(
            model_name="user",
            name="avatar",
            field=models.ImageField(blank=True, null=True, upload_to="avatars/"),
        ),
    ]