from rest_framework import serializers

from .models import Event


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
            "available_seats",
            "actual_price",
            "discount_price",
            "image",
            "features",
            "tags",
            "is_featured",
            "status",
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
    class Meta:
        model = Event
        fields = "__all__"
        read_only_fields = ["id", "vendor", "created_at", "updated_at"]


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
            "actual_price",
            "discount_price",
            "image",
            "is_featured",
            "status",
        ]
