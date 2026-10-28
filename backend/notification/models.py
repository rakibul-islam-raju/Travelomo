from django.db import models

from utils.models import BaseModel


class EmailDelivery(BaseModel):
    """
    One outgoing email and its delivery outcome.

    The rendered message is stored so retries and manual resends send exactly
    what was originally composed, and failures stay visible in the admin.
    """

    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        SENDING = "sending", "Sending"
        SENT = "sent", "Sent"
        FAILED = "failed", "Failed"

    kind = models.CharField(max_length=50, help_text="e.g. booking_confirmation")
    booking = models.ForeignKey(
        "event.SeatBooking",
        on_delete=models.SET_NULL,
        related_name="email_deliveries",
        blank=True,
        null=True,
    )
    recipient = models.EmailField()
    subject = models.CharField(max_length=255)
    plain_body = models.TextField()
    html_body = models.TextField(blank=True)
    status = models.CharField(
        max_length=10, choices=Status.choices, default=Status.PENDING
    )
    attempts = models.PositiveSmallIntegerField(default=0)
    last_error = models.TextField(blank=True)
    sent_at = models.DateTimeField(blank=True, null=True)
    failed_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name_plural = "email deliveries"
        indexes = [models.Index(fields=["status", "updated_at"])]

    def __str__(self) -> str:
        return f"{self.kind} to {self.recipient} ({self.status})"
