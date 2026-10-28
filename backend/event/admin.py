from django.contrib import admin
from django.contrib.admin.sites import AlreadyRegistered
from django.apps import apps

from .models import ManualPaymentSubmission, SeatBooking


class ReadOnlyAdmin(admin.ModelAdmin):
    """DEC-004: no admin overrides in v1. Status changes go through event.services,
    which keeps seat counts and emails consistent; the admin site only views."""

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False


@admin.register(SeatBooking)
class SeatBookingAdmin(ReadOnlyAdmin):
    list_display = [
        "booking_reference",
        "event",
        "user",
        "seat_number",
        "total_amount",
        "status",
        "created_at",
    ]
    list_filter = ["status"]
    search_fields = ["booking_reference", "user__email", "event__title"]
    date_hierarchy = "created_at"


@admin.register(ManualPaymentSubmission)
class ManualPaymentSubmissionAdmin(ReadOnlyAdmin):
    list_display = [
        "booking",
        "channel",
        "transaction_id",
        "amount",
        "status",
        "reviewed_at",
        "created_at",
    ]
    list_filter = ["status", "channel"]
    search_fields = [
        "booking__booking_reference",
        "normalized_transaction_id",
        "submitted_by__email",
    ]
    date_hierarchy = "created_at"


apps_models = apps.get_app_config("event").get_models()

for model in apps_models:
    try:
        admin.site.register(model)
    except AlreadyRegistered:
        pass
