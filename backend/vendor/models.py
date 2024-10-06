from django.db import models

from phonenumber_field.modelfields import PhoneNumberField

from user.models import User
from utils.models import BaseModel


class Vendor(BaseModel):
    # basic information
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="vendor")
    store_name = models.CharField(max_length=100, unique=True)
    store_description = models.TextField(blank=True, null=True)
    logo = models.ImageField(upload_to="vendor_logos/", blank=True, null=True)
    store_email = models.EmailField(blank=True, null=True)
    store_phone = PhoneNumberField(blank=True, null=True, region="BD")

    # business details
    address_line_1 = models.CharField(max_length=255, blank=True, null=True)
    address_line_2 = models.CharField(max_length=255, blank=True, null=True)
    city = models.CharField(max_length=100, blank=True, null=True)
    state = models.CharField(max_length=100, blank=True, null=True)
    zip_code = models.CharField(max_length=10, blank=True, null=True)
    country = models.CharField(max_length=100, blank=True, null=True)

    # Social Media Links
    website = models.URLField(blank=True, null=True)
    social_media_links = models.JSONField(blank=True, null=True)

    # Additional Information
    is_approved = models.BooleanField(default=False)
    approved_by = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="approved_by",
        blank=True,
        null=True,
    )
    approved_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return self.store_name
