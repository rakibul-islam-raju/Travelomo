from datetime import datetime, time, timedelta
from decimal import Decimal
import uuid

from django.db import models
from django.db.models import Q, Value
from django.db.models.functions import Coalesce, NullIf
from django.utils import timezone
from django.utils.text import slugify

from vendor.models import Vendor, VendorPaymentMethod
from user.models import User
from utils.models import BaseModel


def generate_image_path(instance, filename):
    vendor_store_name = instance.vendor.store_name
    return f"event_images/{vendor_store_name}/{filename}"


class EventQuerySet(models.QuerySet):
    def with_effective_price(self):
        """Alias `effective_price`, the database twin of `Event.price`."""
        if "effective_price" in self.query.annotations:
            return self
        return self.alias(
            effective_price=Coalesce(
                NullIf("discount_price", Value(0)), "actual_price"
            )
        )

    def publicly_visible(self):
        """Events whose detail page anyone may open.

        Started events stay visible so customers can revisit what they booked;
        the page shows booking as closed.
        """
        return self.filter(status="published", is_archived=False)

    def publicly_listed(self):
        """Events shown in public discovery: those `reserve_booking` would accept.

        Sold-out events stay listed so customers can see them as sold out;
        the `available_seats` filter excludes them.
        """
        return self.publicly_visible().filter(start_date__gt=timezone.localdate())


class Event(BaseModel):
    STATUS_CHOICES = [
        ("draft", "Draft"),
        ("published", "Published"),
        ("paused", "Paused"),
        ("travelling", "Travelling"),
        ("cancelled", "Cancelled"),
        ("completed", "Completed"),
    ]
    vendor = models.ForeignKey(Vendor, on_delete=models.CASCADE)
    title = models.CharField(max_length=100)
    slug = models.SlugField(null=False, blank=True)
    description = models.TextField()
    start_date = models.DateField()
    end_date = models.DateField()
    location = models.CharField(max_length=100)
    total_seats = models.PositiveSmallIntegerField()
    available_seats = models.PositiveSmallIntegerField(blank=True, null=True, default=0)
    actual_price = models.PositiveIntegerField()
    discount_price = models.PositiveIntegerField(blank=True, null=True, default=0)
    image = models.ImageField(upload_to=generate_image_path, blank=True, null=True)
    tags = models.CharField(max_length=255, blank=True, null=True)
    status = models.CharField(max_length=100, choices=STATUS_CHOICES, default="draft")

    is_featured = models.BooleanField(default=False)
    is_archived = models.BooleanField(default=False)
    cancellation_days = models.PositiveSmallIntegerField(
        default=0,
        help_text="Days before start_date that cancellation is allowed. 0 = no cancellation.",
    )

    objects = EventQuerySet.as_manager()

    def __str__(self) -> str:
        return self.title

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.title)

        if self._state.adding and not self.available_seats:
            self.available_seats = self.total_seats

        if self.available_seats and self.available_seats > self.total_seats:
            raise ValueError("Available seats cannot be greater than total seats")

        super().save(*args, **kwargs)

    class Meta:
        ordering = ["-created_at"]

    @property
    def price(self) -> int:
        # Keep in sync with EventQuerySet.with_effective_price.
        if self.discount_price:
            return self.discount_price
        return self.actual_price

    @property
    def starts_at(self) -> datetime:
        """Midnight at the start of `start_date` in the project time zone (Asia/Dhaka)."""
        return timezone.make_aware(datetime.combine(self.start_date, time.min))

    @property
    def is_completed(self) -> bool:
        return self.end_date < timezone.now().date()

    @property
    def seat_booked(self) -> int:
        return self.total_seats - self.available_seats


class SeatBooking(BaseModel):
    BOOKING_STATUS_CHOICES = [
        ("awaiting_payment_reference", "Awaiting payment reference"),
        ("pending_verification", "Pending verification"),
        ("confirmed", "Confirmed"),
        ("payment_rejected", "Payment rejected"),
        ("expired", "Expired"),
        ("cancelled", "Cancelled"),
    ]
    # DEC-003: a customer may hold only one of these per event at a time.
    UNFINISHED_STATUSES = ["awaiting_payment_reference", "pending_verification"]

    event = models.ForeignKey(Event, on_delete=models.CASCADE)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    seat_number = models.PositiveSmallIntegerField()
    booking_reference = models.CharField(max_length=24, unique=True, editable=False)
    unit_price = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    currency = models.CharField(max_length=3, default="BDT")
    status = models.CharField(
        max_length=32,
        choices=BOOKING_STATUS_CHOICES,
        default="awaiting_payment_reference",
    )
    payment_reference_expires_at = models.DateTimeField(blank=True, null=True)
    verification_expires_at = models.DateTimeField(blank=True, null=True)
    seats_released_at = models.DateTimeField(blank=True, null=True)
    cancelled_at = models.DateTimeField(blank=True, null=True)

    objects = models.Manager()

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["event", "user"],
                condition=Q(
                    status__in=["awaiting_payment_reference", "pending_verification"]
                ),
                name="one_unfinished_booking_per_customer_event",
            )
        ]

    def __str__(self) -> str:
        return f"{self.booking_reference} - {self.event.title}"

    def save(self, *args, **kwargs):
        if not self.booking_reference:
            self.booking_reference = f"TL-{uuid.uuid4().hex[:12].upper()}"
        super().save(*args, **kwargs)

    @property
    def total_price(self) -> Decimal:
        return self.total_amount

    @property
    def can_cancel(self) -> bool:
        if self.status in ["awaiting_payment_reference", "pending_verification"]:
            return True
        if self.status != "confirmed":
            return False
        if self.event.cancellation_days == 0:
            return False
        deadline = self.event.start_date - timedelta(days=self.event.cancellation_days)
        return timezone.localdate() <= deadline


class ManualPaymentSubmission(BaseModel):
    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("verified", "Verified"),
        ("rejected", "Rejected"),
        ("withdrawn", "Withdrawn"),
        ("expired", "Expired"),
    ]
    # DEC-007: a transaction ID can back only one of these per channel.
    LIVE_STATUSES = ["pending", "verified"]

    # DEC-004: one submission per booking; after a rejection the customer books again.
    booking = models.OneToOneField(
        SeatBooking, on_delete=models.CASCADE, related_name="payment_submission"
    )
    payment_method = models.ForeignKey(
        VendorPaymentMethod, on_delete=models.PROTECT, related_name="submissions"
    )
    submitted_by = models.ForeignKey(
        User, on_delete=models.PROTECT, related_name="manual_payment_submissions"
    )
    # Snapshots taken at submission, so later edits to the method or price
    # cannot change what the vendor is verifying.
    channel = models.CharField(
        max_length=20, choices=VendorPaymentMethod.CHANNEL_CHOICES, editable=False
    )
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    currency = models.CharField(max_length=3, default="BDT")
    transaction_id = models.CharField(max_length=120)
    normalized_transaction_id = models.CharField(max_length=120, editable=False)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    reviewed_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        related_name="reviewed_manual_payments",
        blank=True,
        null=True,
    )
    reviewed_at = models.DateTimeField(blank=True, null=True)
    rejection_reason = models.CharField(max_length=300, blank=True)

    class Meta:
        ordering = ["-created_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["channel", "normalized_transaction_id"],
                condition=Q(status__in=["pending", "verified"]),
                name="unique_live_transaction_per_channel",
            )
        ]

    def save(self, *args, **kwargs):
        if not self.channel:
            self.channel = self.payment_method.channel
        self.transaction_id = self.transaction_id.strip()
        self.normalized_transaction_id = "".join(
            self.transaction_id.upper().split()
        )
        super().save(*args, **kwargs)

    def __str__(self) -> str:
        return f"{self.booking.booking_reference} - {self.transaction_id}"
