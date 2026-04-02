from rest_framework import serializers

from .models import Event, SeatBooking


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


class SeatBookingCreateSerializer(serializers.ModelSerializer):
    total_price = serializers.ReadOnlyField()
    can_cancel = serializers.ReadOnlyField()

    class Meta:
        model = SeatBooking
        fields = ["id", "event", "seat_number", "status", "total_price", "can_cancel", "created_at"]
        read_only_fields = ["id", "status", "created_at"]

    def validate(self, attrs):
        event = attrs["event"]
        seat_number = attrs["seat_number"]
        if event.status != "published":
            raise serializers.ValidationError("This event is not available for booking.")
        if seat_number <= 0:
            raise serializers.ValidationError("seat_number must be at least 1.")
        if seat_number > event.available_seats:
            raise serializers.ValidationError(
                f"Only {event.available_seats} seats available."
            )
        return attrs


class SeatBookingListSerializer(serializers.ModelSerializer):
    total_price = serializers.ReadOnlyField()
    can_cancel = serializers.ReadOnlyField()
    event_title = serializers.CharField(source="event.title", read_only=True)
    event_slug = serializers.CharField(source="event.slug", read_only=True)
    event_start_date = serializers.DateField(source="event.start_date", read_only=True)
    event_end_date = serializers.DateField(source="event.end_date", read_only=True)
    event_location = serializers.CharField(source="event.location", read_only=True)
    event_image = serializers.ImageField(source="event.image", read_only=True)
    event_price = serializers.ReadOnlyField(source="event.price")

    class Meta:
        model = SeatBooking
        fields = [
            "id",
            "event",
            "seat_number",
            "status",
            "total_price",
            "can_cancel",
            "event_title",
            "event_slug",
            "event_start_date",
            "event_end_date",
            "event_location",
            "event_image",
            "event_price",
            "created_at",
        ]


class VendorBookingListSerializer(serializers.ModelSerializer):
    total_price = serializers.ReadOnlyField()
    user_name = serializers.CharField(source="user.full_name", read_only=True)
    user_email = serializers.CharField(source="user.email", read_only=True)
    event_title = serializers.CharField(source="event.title", read_only=True)

    class Meta:
        model = SeatBooking
        fields = [
            "id",
            "event",
            "event_title",
            "user_name",
            "user_email",
            "seat_number",
            "status",
            "total_price",
            "created_at",
        ]
