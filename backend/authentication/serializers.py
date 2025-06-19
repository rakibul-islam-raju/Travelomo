from django.conf import settings
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from user.models import User
from vendor.serializers import VendorShortSerializer
from vendor.models import Vendor

from notification.emails import send_activation_email
from utils.Token import Token


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        user_data = {
            "id": str(user.id),
            "first_name": user.first_name,
            "last_name": user.last_name,
            "full_name": user.first_name + " " + user.last_name,
            "email": user.email,
            "role": user.role,
            "is_active": user.is_active,
            "is_staff": user.is_staff,
            "is_superuser": user.is_superuser,
        }

        # if user is vendor and has vendor model then add vendor data to user data
        if user.role == "vendor" and hasattr(user, "vendor"):
            vendor = user.vendor
            vendor_data = VendorShortSerializer(vendor).data
            user_data["vendor"] = vendor_data

        token["user"] = user_data
        return token

    def validate(self, attrs):
        data = super().validate(attrs)

        # Add user data to response
        user = self.user
        user_data = {
            "id": str(user.id),
            "first_name": user.first_name,
            "last_name": user.last_name,
            "full_name": user.first_name + " " + user.last_name,
            "email": user.email,
            "role": user.role,
            "is_active": user.is_active,
            "is_staff": user.is_staff,
            "is_superuser": user.is_superuser,
            "avatar": user.avatar.url if user.avatar else None,
        }

        # Add vendor data if user is a vendor
        if user.role == "vendor" and hasattr(user, "vendor"):
            vendor = user.vendor
            vendor_data = VendorShortSerializer(vendor).data
            user_data["vendor"] = vendor_data

        data["user"] = user_data

        return data


class VendorRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(max_length=128, required=True, write_only=True)
    store_name = serializers.CharField(max_length=100, required=True, write_only=True)

    class Meta:
        model = User
        fields = [
            "id",
            "email",
            "first_name",
            "last_name",
            "password",
            "role",
            "store_name",
        ]
        read_only_fields = ["id", "role"]

    def create(self, validated_data) -> User:
        # generate token
        tokens = Token.generate_and_hash_token(length=100)
        token = tokens["token"]
        hash = tokens["hash"]

        store = validated_data.pop("store_name")
        user = User.objects.create_user(**validated_data, role="vendor", token=hash)

        activation_url = f"{settings.FRONTEND_BASE_URL}/activate-account/?email={user.email}&token={token}"

        # Send activation email
        send_activation_email(user.email, activation_url)

        # create vendor
        Vendor.objects.create(user=user, store_name=store)
        return user


class CustomerRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(max_length=128, required=True, write_only=True)

    class Meta:
        model = User
        fields = ["id", "email", "first_name", "last_name", "password", "role"]
        read_only_fields = ["id", "role"]

    def create(self, validated_data) -> User:
        # generate token
        tokens = Token.generate_and_hash_token(length=100)
        token = tokens["token"]
        hash = tokens["hash"]

        # Create user with the hashed token
        user = User.objects.create_user(
            email=validated_data["email"],
            password=validated_data["password"],
            first_name=validated_data["first_name"],
            last_name=validated_data["last_name"],
            role="customer",
            token=hash,
        )

        activation_url = f"{settings.FRONTEND_BASE_URL}/activate-account/?email={user.email}&token={token}"

        # Send activation email
        send_activation_email(user.email, activation_url)

        return user


class ForgetPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField()


class ResetPasswordSerializer(serializers.Serializer):
    password = serializers.CharField(max_length=128)
    token = serializers.CharField(max_length=100)
    email = serializers.EmailField()


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(max_length=128)
    new_password = serializers.CharField(max_length=128)


class MeSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            "id",
            "email",
            "first_name",
            "last_name",
            "full_name",
            "role",
            "is_active",
            "is_staff",
            "is_superuser",
        ]
