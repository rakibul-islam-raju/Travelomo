from datetime import datetime
from django.template.loader import render_to_string
from django.utils import timezone
from django.utils.html import strip_tags
from celery import shared_task

from notification.emails import send_email
from .models import Event, SeatBooking


@shared_task
def update_completed_events():
    """
    Celery task to update event statuses to "completed" after their end_date has passed.
    This task should be scheduled to run periodically (e.g., daily).
    """
    today = timezone.now().date()

    # Find all events that have ended but are not marked as completed
    events_to_complete = Event.objects.filter(end_date__lt=today, status="published")

    # Update their status to completed
    count = events_to_complete.update(status="completed")

    return f"Updated {count} events to completed status"


@shared_task
def send_booking_confirmation_email(booking_id):
    try:
        booking = SeatBooking.objects.select_related("event", "user").get(id=booking_id)
    except SeatBooking.DoesNotExist:
        return f"Booking {booking_id} not found"

    subject = f"Booking Confirmed - {booking.event.title}"
    html_content = render_to_string(
        "mail/booking/booking_confirmation.html",
        {
            "user_name": booking.user.full_name,
            "event_title": booking.event.title,
            "event_start_date": booking.event.start_date,
            "event_end_date": booking.event.end_date,
            "event_location": booking.event.location,
            "seats_booked": booking.seat_number,
            "total_price": booking.total_price,
            "booking_id": str(booking.id),
        },
    )
    plain_message = strip_tags(html_content)

    send_email(
        subject=subject,
        plain_message=plain_message,
        html_content=html_content,
        to_email=[booking.user.email],
    )

    return f"Confirmation email sent for booking {booking_id}"
