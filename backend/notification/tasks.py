import logging

from celery import shared_task
from django.conf import settings
from django.db.models import F
from django.utils import timezone

from .delivery import describe_error, is_transient_error, requeue_stale, retry_delay, send_delivery
from .models import EmailDelivery

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=None, acks_late=True)
def deliver_email(self, delivery_id):
    """
    Send one EmailDelivery, retrying temporary failures with backoff.

    The retry budget is `EMAIL_DELIVERY_MAX_ATTEMPTS` counted in the database,
    so requeues and duplicate task messages cannot exceed it.
    """
    # Claim the delivery atomically so two workers never send the same email.
    claimed = EmailDelivery.objects.filter(
        pk=delivery_id, status=EmailDelivery.Status.PENDING
    ).update(
        status=EmailDelivery.Status.SENDING,
        attempts=F("attempts") + 1,
        updated_at=timezone.now(),
    )
    if not claimed:
        return f"Email delivery {delivery_id} skipped: not pending"

    delivery = EmailDelivery.objects.get(pk=delivery_id)
    try:
        send_delivery(delivery)
    except Exception as exc:
        return _handle_failure(self, delivery, exc)

    EmailDelivery.objects.filter(pk=delivery.pk).update(
        status=EmailDelivery.Status.SENT,
        sent_at=timezone.now(),
        last_error="",
        updated_at=timezone.now(),
    )
    logger.info(
        "Email delivery %s (%s) sent to %s on attempt %d",
        delivery.id,
        delivery.kind,
        delivery.recipient,
        delivery.attempts,
    )
    return f"Email delivery {delivery_id} sent"


def _handle_failure(task, delivery, exc):
    error = describe_error(exc)
    log_context = (delivery.id, delivery.kind, delivery.booking_id, delivery.attempts, error)

    if is_transient_error(exc) and delivery.attempts < settings.EMAIL_DELIVERY_MAX_ATTEMPTS:
        EmailDelivery.objects.filter(pk=delivery.pk).update(
            status=EmailDelivery.Status.PENDING,
            last_error=error,
            updated_at=timezone.now(),
        )
        logger.warning(
            "Email delivery %s (%s, booking %s) failed on attempt %d, retrying: %s",
            *log_context,
        )
        raise task.retry(exc=exc, countdown=retry_delay(delivery.attempts))

    EmailDelivery.objects.filter(pk=delivery.pk).update(
        status=EmailDelivery.Status.FAILED,
        last_error=error,
        failed_at=timezone.now(),
        updated_at=timezone.now(),
    )
    # ERROR level so log-based alerting picks up undelivered email.
    logger.error(
        "Email delivery %s (%s, booking %s) failed permanently after %d attempt(s): %s",
        *log_context,
    )
    return f"Email delivery {delivery.id} failed"


@shared_task
def requeue_stale_email_deliveries():
    count = requeue_stale()
    return f"Requeued {count} stale email deliveries"
