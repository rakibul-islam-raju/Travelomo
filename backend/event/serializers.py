from decimal import Decimal

from django.db.models import Count, Sum
from rest_framework import serializers

from vendor.serializers import VendorPaymentMethodSerializer

from .models import Event, ManualPaymentSubmission, SeatBooking


class EventCreateSerializer(serializers.ModelSerializer):
    vendor = serializers.SerializerMethodField()

    class Meta:
        model = Event
        fields = [
            "id",
            "title",
            "slug",
            "description",
            "start_date",
            "end_date",
            "location",
            "total_seats",
            "actual_price",
            "discount_price",
            "image",
            "tags",
            "is_featured",
            "status",
            "cancellation_days",
            "vendor",
        ]
        read_only_fields = ["id", "vendor"]

    def validate_status(self, value):
        if value not in ["draft", "published"]:
            raise serializers.ValidationError(
                "Invalid status. Must be one of: draft, published"
            )
        return value

    def get_vendor(self, obj):
        return {
            "id": obj.vendor.id,
            "store_name": obj.vendor.store_name,
            "logo": obj.vendor.logo.url if obj.vendor.logo else None,
        }


class EventListSerializer(serializers.ModelSerializer):
    vendor = serializers.SerializerMethodField()

    class Meta:
        model = Event
        fields = [
            "id",
            "title",
            "slug",
            "start_date",
            "end_date",
            "location",
            "available_seats",
            "actual_price",
            "discount_price",
            "image",
            "is_featured",
            "tags",
            "created_at",
            "vendor",
            "price",
        ]

    def get_vendor(self, obj):
        return {
            "id": obj.vendor.id,
            "store_name": obj.vendor.store_name,
            "logo": obj.vendor.logo.url if obj.vendor.logo else None,
        }


class EventDetailSerializer(serializers.ModelSerializer):
    vendor = serializers.SerializerMethodField()

    class Meta:
        model = Event
        fields = [
            "id",
            "vendor",
            "title",
            "slug",
            "description",
            "start_date",
            "end_date",
            "location",
            "total_seats",
            "available_seats",
            "actual_price",
            "discount_price",
            "image",
            "tags",
            "status",
            "is_featured",
            "is_archived",
            "seat_booked",
            "price",
            "cancellation_days",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "vendor", "created_at", "updated_at"]

    def get_vendor(self, obj):
        return {
            "id": obj.vendor.id,
            "store_name": obj.vendor.store_name,
            "logo": obj.vendor.logo.url if obj.vendor.logo else None,
        }


class AdminEventDetailSerializer(EventDetailSerializer):
    booking_summary = serializers.SerializerMethodField()

    class Meta(EventDetailSerializer.Meta):
        fields = EventDetailSerializer.Meta.fields + ["booking_summary"]

    def get_vendor(self, obj) -> dict:
        vendor = obj.vendor
        return {
            "id": vendor.id,
            "store_name": vendor.store_name,
            "logo": vendor.logo.url if vendor.logo else None,
            "store_email": vendor.store_email,
            "store_phone": str(vendor.store_phone) if vendor.store_phone else None,
            "owner_email": vendor.user.email,
            "is_approved": vendor.is_approved,
        }

    def get_booking_summary(self, obj) -> dict:
        """Bookings, seats and snapshot amounts per status, from one grouped query."""
        rows = {
            row["status"]: row
            for row in SeatBooking.objects.filter(event=obj)
            .values("status")
            .annotate(
                bookings=Count("id"),
                seats=Sum("seat_number"),
                amount=Sum("total_amount"),
            )
            .order_by()
        }
        statuses = []
        for status, label in SeatBooking.BOOKING_STATUS_CHOICES:
            row = rows.get(status, {})
            statuses.append(
                {
                    "status": status,
                    "label": label,
                    "bookings": row.get("bookings", 0),
                    "seats": row.get("seats") or 0,
                    "amount": str(row.get("amount") or Decimal("0.00")),
                }
            )
        confirmed = rows.get("confirmed", {})
        return {
            "total_bookings": sum(row["bookings"] for row in statuses),
            "statuses": statuses,
            # Vendor-approved booking snapshots only; Travelomo cannot confirm settlement.
            "verified_booking_value": str(confirmed.get("amount") or Decimal("0.00")),
            "currency": "BDT",
        }


class VendorEventListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Event
        fields = [
            "id",
            "title",
            "slug",
            "start_date",
            "end_date",
            "location",
            "available_seats",
            "total_seats",
            "actual_price",
            "discount_price",
            "image",
            "is_featured",
            "status",
            "seat_booked",
            "cancellation_days",
        ]


class SeatBookingCreateSerializer(serializers.Serializer):
    event = serializers.UUIDField()
    seat_number = serializers.IntegerField(min_value=1, max_value=100)


class PaymentReferenceSubmitSerializer(serializers.Serializer):
    payment_method = serializers.UUIDField()
    transaction_id = serializers.CharField(max_length=120, trim_whitespace=True)


class PaymentReviewSerializer(serializers.Serializer):
    action = serializers.ChoiceField(choices=["approve", "reject"])
    reason = serializers.CharField(
        max_length=300, required=False, allow_blank=True, trim_whitespace=True
    )


class ManualPaymentSubmissionSerializer(serializers.ModelSerializer):
    payment_method_name = serializers.CharField(
        source="payment_method.name", read_only=True
    )
    reviewed_by_name = serializers.CharField(
        source="reviewed_by.full_name", read_only=True, allow_null=True
    )
    channel_label = serializers.CharField(
        source="get_channel_display", read_only=True
    )

    class Meta:
        model = ManualPaymentSubmission
        fields = [
            "id",
            "payment_method",
            "payment_method_name",
            "channel",
            "channel_label",
            "amount",
            "currency",
            "transaction_id",
            "status",
            "reviewed_by_name",
            "reviewed_at",
            "rejection_reason",
            "created_at",
        ]


class SeatBookingListSerializer(serializers.ModelSerializer):
    total_price = serializers.DecimalField(
        source="total_amount", max_digits=12, decimal_places=2, read_only=True
    )
    can_cancel = serializers.ReadOnlyField()
    event_title = serializers.CharField(source="event.title", read_only=True)
    event_slug = serializers.CharField(source="event.slug", read_only=True)
    event_start_date = serializers.DateField(source="event.start_date", read_only=True)
    event_end_date = serializers.DateField(source="event.end_date", read_only=True)
    event_location = serializers.CharField(source="event.location", read_only=True)
    event_image = serializers.ImageField(source="event.image", read_only=True)
    event_price = serializers.DecimalField(
        source="unit_price", max_digits=12, decimal_places=2, read_only=True
    )
    payment_submission = ManualPaymentSubmissionSerializer(read_only=True)
    payment_methods = serializers.SerializerMethodField()
    status_label = serializers.CharField(source="get_status_display", read_only=True)

    class Meta:
        model = SeatBooking
        fields = [
            "id",
            "event",
            "booking_reference",
            "seat_number",
            "status",
            "status_label",
            "total_price",
            "currency",
            "can_cancel",
            "payment_reference_expires_at",
            "verification_expires_at",
            "cancelled_at",
            "event_title",
            "event_slug",
            "event_start_date",
            "event_end_date",
            "event_location",
            "event_image",
            "event_price",
            "payment_submission",
            "payment_methods",
            "created_at",
        ]

    def get_payment_methods(self, obj):
        if obj.status != "awaiting_payment_reference":
            return []
        methods = obj.event.vendor.payment_methods.filter(is_active=True)
        return VendorPaymentMethodSerializer(methods, many=True).data


class VendorBookingListSerializer(serializers.ModelSerializer):
    total_price = serializers.DecimalField(
        source="total_amount", max_digits=12, decimal_places=2, read_only=True
    )
    user_name = serializers.CharField(source="user.full_name", read_only=True)
    user_email = serializers.CharField(source="user.email", read_only=True)
    event_title = serializers.CharField(source="event.title", read_only=True)
    payment_submission = ManualPaymentSubmissionSerializer(read_only=True)
    status_label = serializers.CharField(source="get_status_display", read_only=True)

    class Meta:
        model = SeatBooking
        fields = [
            "id",
            "booking_reference",
            "event",
            "event_title",
            "user_name",
            "user_email",
            "seat_number",
            "status",
            "status_label",
            "total_price",
            "currency",
            "payment_reference_expires_at",
            "verification_expires_at",
            "payment_submission",
            "created_at",
        ]
