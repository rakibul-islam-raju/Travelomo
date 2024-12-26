from decimal import Decimal

from django.db import models
from django.utils.text import slugify

from vendor.models import Vendor
from utils.models import BaseModel


def generate_image_path(instance, filename):
    vendor_store_name = instance.vendor.store_name
    return f"event_images/{vendor_store_name}/{filename}"


class Event(BaseModel):
    vendor = models.ForeignKey(Vendor, on_delete=models.CASCADE)
    title = models.CharField(max_length=100)
    slug = models.SlugField(null=False, blank=True)
    description = models.TextField()
    start_date = models.DateField()
    end_date = models.DateField()
    location = models.CharField(max_length=100)
    seat_available = models.PositiveSmallIntegerField()
    actual_price = models.DecimalField(max_digits=10, decimal_places=2)
    discount_price = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True
    )
    image = models.ImageField(upload_to=generate_image_path, blank=True, null=True)
    features = models.JSONField(default=list, blank=True, null=True)
    tags = models.CharField(max_length=100, blank=True, null=True)

    is_featured = models.BooleanField(default=False)
    is_published = models.BooleanField(default=False)
    is_deleted = models.BooleanField(default=False)
    is_archived = models.BooleanField(default=False)

    def __str__(self) -> str:
        return self.title

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.title)
        super().save(*args, **kwargs)

    class Meta:
        ordering = ["-created_at"]

    @property
    def price(self) -> Decimal:
        if self.discount_price:
            return self.discount_price
        return self.actual_price

    @property
    def is_completed(self) -> bool:
        return self.end_date < timezone.now().date()
