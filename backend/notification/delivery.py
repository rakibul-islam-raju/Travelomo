import logging
import smtplib
from datetime import timedelta

from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.db import transaction
from django.db.models import Q
from django.utils import timezone
from django.utils.html import strip_tags

from .models import EmailDelivery

logger = logging.getLogger(__name__)

# Deliveries left pending or sending this long are treated as lost (worker
# crash, dropped broker message) and requeued. Longer than the largest retry
# delay so a scheduled retry is not mistaken for a lost one.
STALE_AFTER = timedelta(minutes=30)
RETRY_BASE_DELAY_SECONDS = 60
RETRY_MAX_DELAY_SECONDS = 15 * 60


def queue_email(*, kind, recipient, subject, html_body, booking=None) -> EmailDelivery:
    """Record an email and hand it to the `deliver_email` task after commit."""
    delivery = EmailDelivery.objects.create(
        kind=kind,
        booking=booking,
        recipient=recipient,
        subject=subject,
        plain_body=strip_tags(html_body).strip(),
        html_body=html_body,
    )
    _enqueue(delivery.id)
    return delivery


def _enqueue(delivery_id) -> None:
    from .tasks import deliver_email

    transaction.on_commit(lambda: deliver_email.delay(str(delivery_id)))


def send_delivery(delivery: EmailDelivery) -> None:
    message = EmailMultiAlternatives(
        subject=delivery.subject,
        body=delivery.plain_body,
        from_email=settings.DEFAULT_FROM_EMAIL,
        to=[delivery.recipient],
    )
    if delivery.html_body:
        message.attach_alternative(delivery.html_body, "text/html")
    message.send(fail_silently=False)


def is_transient_error(exc: Exception) -> bool:
    """
    Whether a send failure may succeed if retried.

    SMTP 4xx replies and connection problems are temporary; 5xx replies
    (bad recipient, rejected sender, failed authentication) and non-network
    errors are not.
    """
    if isinstance(exc, smtplib.SMTPRecipientsRefused):
        return all(400 <= code < 500 for code, _ in exc.recipients.values())
    if isinstance(exc, smtplib.SMTPResponseException):
        return not 500 <= exc.smtp_code < 600
    if isinstance(exc, smtplib.SMTPNotSupportedError):
        return False
    # SMTPServerDisconnected, timeouts, refused connections and DNS failures
    # are all OSError subclasses (as is every SMTPException).
    return isinstance(exc, OSError)


def retry_delay(attempts: int) -> int:
    """Exponential backoff: 1, 2, 4, 8 minutes, capped at 15."""
    return min(RETRY_BASE_DELAY_SECONDS * 2 ** max(attempts - 1, 0), RETRY_MAX_DELAY_SECONDS)


def describe_error(exc: Exception) -> str:
    return f"{type(exc).__name__}: {exc}"[:2000]


def resend(deliveries) -> int:
    """Give failed deliveries a fresh retry budget and queue them again."""
    ids = list(
        deliveries.filter(status=EmailDelivery.Status.FAILED).values_list("id", flat=True)
    )
    EmailDelivery.objects.filter(id__in=ids).update(
        status=EmailDelivery.Status.PENDING,
        attempts=0,
        failed_at=None,
        updated_at=timezone.now(),
    )
    for delivery_id in ids:
        _enqueue(delivery_id)
    return len(ids)


def stale_deliveries(now=None):
    cutoff = (now or timezone.now()) - STALE_AFTER
    return EmailDelivery.objects.filter(
        Q(status=EmailDelivery.Status.PENDING) | Q(status=EmailDelivery.Status.SENDING),
        updated_at__lte=cutoff,
    )


def requeue_stale() -> int:
    """Requeue deliveries whose task was lost. Attempts already made still count."""
    ids = list(stale_deliveries().values_list("id", flat=True))
    EmailDelivery.objects.filter(id__in=ids).update(
        status=EmailDelivery.Status.PENDING, updated_at=timezone.now()
    )
    for delivery_id in ids:
        logger.warning("Requeuing stale email delivery %s", delivery_id)
        _enqueue(delivery_id)
    return len(ids)
