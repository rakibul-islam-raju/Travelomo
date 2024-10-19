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
            "seat_available",
            "actual_price",
            "discount_price",
            "image",
            "features",
            "tags",
            "is_featured",
            "is_published",
            "vendor",
        ]
        read_only_fields = ["id", "vendor"]

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
            "seat_available",
            "actual_price",
            "discount_price",
            "image",
            "is_featured",
            "tags",
            "created_at",
            "vendor",
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
            "seat_available",
            "actual_price",
            "discount_price",
            "image",
            "is_featured",
            "is_published",
        ]
