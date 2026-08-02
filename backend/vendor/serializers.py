from rest_framework import serializers
from .models import Vendor, VendorPaymentMethod


class VendorPaymentMethodSerializer(serializers.ModelSerializer):
    class Meta:
        model = VendorPaymentMethod
        fields = [
            "id",
            "name",
            "account_name",
            "account_number",
            "instructions",
            "is_active",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def validate_name(self, value):
        return value.strip()

    def validate_account_name(self, value):
        return value.strip()

    def validate_account_number(self, value):
        return value.strip()


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


class MeVendorSerializer(serializers.ModelSerializer):
    payment_methods = VendorPaymentMethodSerializer(many=True, read_only=True)

    class Meta:
        model = Vendor
        fields = "__all__"


class VendorDetailSerializer(serializers.ModelSerializer):
    user = serializers.SerializerMethodField()

    class Meta:
        model = Vendor
        fields = "__all__"
        read_only_fields = ["id", "is_approved", "approved_by", "approved_at", "user"]

    def get_user(self, obj):
        return {
            "id": obj.user.id,
            "full_name": obj.user.full_name,
            "email": obj.user.email,
            "avatar": obj.user.avatar.url if obj.user.avatar else None,
        }


class VendorDetailSerializerForAdmin(VendorDetailSerializer):
    approved_by = serializers.SerializerMethodField()

    class Meta(VendorDetailSerializer.Meta):
        read_only_fields = VendorDetailSerializer.Meta.read_only_fields + [
            "approved_by"
        ]

    def get_approved_by(self, obj):
        return {
            "id": obj.approved_by.id,
            "full_name": obj.approved_by.full_name,
            "email": obj.approved_by.email,
            "avatar": obj.approved_by.avatar,
        }


class VendorApprovalSerializer(serializers.ModelSerializer):
    class Meta:
        model = Vendor
        fields = ["is_approved"]
