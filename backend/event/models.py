from decimal import Decimal

from django.db import models
from django.utils import timezone
from django.utils.text import slugify

from vendor.models import Vendor
from user.models import User
from utils.models import BaseModel


def generate_image_path(instance, filename):
    vendor_store_name = instance.vendor.store_name
    return f"event_images/{vendor_store_name}/{filename}"


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

    objects = models.Manager()

    def __str__(self) -> str:
        return self.title

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.title)

        if not self.available_seats:
            self.available_seats = self.total_seats

        if self.available_seats and self.available_seats > self.total_seats:
            raise ValueError("Available seats cannot be greater than total seats")

        super().save(*args, **kwargs)

    class Meta:
        ordering = ["-created_at"]

    @property
    def price(self) -> int:
        if self.discount_price:
            return self.discount_price
        return self.actual_price

    @property
    def is_completed(self) -> bool:
        return self.end_date < timezone.now().date()

    @property
    def seat_booked(self) -> int:
        return self.total_seats - self.available_seats


class SeatBooking(BaseModel):
    event = models.ForeignKey(Event, on_delete=models.CASCADE)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    seat_number = models.PositiveSmallIntegerField()

    objects = models.Manager()

    def __str__(self) -> str:
        return f"{self.event.title} - {self.seat_number}"

    @property
    def total_price(self) -> Decimal:
        return self.event.price * self.seat_number
