from datetime import datetime
from django.utils import timezone
from celery import shared_task

from .models import Event


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
