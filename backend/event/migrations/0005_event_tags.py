# Generated by Django 5.1.1 on 2024-10-19 07:01

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('event', '0004_alter_event_image'),
    ]

    operations = [
        migrations.AddField(
            model_name='event',
            name='tags',
            field=models.CharField(blank=True, max_length=100, null=True),
        ),
    ]