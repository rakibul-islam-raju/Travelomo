from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('event', '0013_alter_event_discount_price'),
    ]

    operations = [
        migrations.AddField(
            model_name='event',
            name='cancellation_days',
            field=models.PositiveSmallIntegerField(
                default=0,
                help_text='Days before start_date that cancellation is allowed. 0 = no cancellation.',
            ),
        ),
        migrations.AddField(
            model_name='seatbooking',
            name='status',
            field=models.CharField(
                choices=[('confirmed', 'Confirmed'), ('cancelled', 'Cancelled')],
                default='confirmed',
                max_length=20,
            ),
        ),
    ]
