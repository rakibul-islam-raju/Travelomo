from django.contrib import admin, messages

from .delivery import resend
from .models import EmailDelivery


@admin.register(EmailDelivery)
class EmailDeliveryAdmin(admin.ModelAdmin):
    list_display = [
        "created_at",
        "kind",
        "recipient",
        "status",
        "attempts",
        "booking",
        "short_error",
    ]
    list_filter = ["status", "kind"]
    search_fields = ["recipient", "subject", "booking__booking_reference"]
    date_hierarchy = "created_at"
    actions = ["resend_failed"]
    readonly_fields = [field.name for field in EmailDelivery._meta.fields]

    def has_add_permission(self, request):
        return False

    @admin.display(description="Last error")
    def short_error(self, obj):
        return obj.last_error[:80]

    @admin.action(description="Resend selected failed emails")
    def resend_failed(self, request, queryset):
        count = resend(queryset)
        self.message_user(
            request,
            f"Queued {count} failed email(s) for resending. Deliveries that had not failed were skipped.",
            messages.SUCCESS if count else messages.WARNING,
        )
