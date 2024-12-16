from rest_framework import serializers
from .models import Vendor


class VendorShortSerializer(serializers.ModelSerializer):
    class Meta:
        model = Vendor
        fields = [
            "id",
            "store_name",
            "logo",
        ]


class VendorCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Vendor
        fields = [
            "id",
            "user",
            "store_name",
            "store_description",
            "logo",
            "store_email",
            "store_phone",
        ]
        read_only_fields = ["id"]


class VendorListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Vendor
        fields = [
            "id",
            "store_name",
            "store_description",
            "store_phone",
            "logo",
            "is_approved",
        ]


class VendorDetailSerializer(serializers.ModelSerializer):
    user = serializers.SerializerMethodField()

    class Meta:
        model = Vendor
        fields = "__all__"
        read_only_fields = ["id", "is_approved", "approved_by", "approved_at"]

    def get_user(self, obj):
        return {
            "id": obj.user.id,
            "full_name": obj.user.full_name,
            "email": obj.user.email,
        }


class VendorApprovalSerializer(serializers.ModelSerializer):
    class Meta:
        model = Vendor
        fields = ["is_approved"]
