from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from user.models import User
from vendor.serializers import VendorShortSerializer


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        user_data = {
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "is_active": user.is_active,
            "role": user.role,
        }

        # if user is vendor and has vendor model then add vendor data to user data
        if user.role == "vendor" and hasattr(user, "vendor"):
            vendor = user.vendor
            vendor_data = VendorShortSerializer(vendor).data
            user_data["vendor"] = vendor_data

        token["user"] = user_data
        return token


class AdminCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(max_length=128, required=True, write_only=True)

    class Meta:
        model = User
        fields = ["id", "email", "first_name", "last_name", "password", "role"]
        read_only_fields = ["id", "role"]

    def create(self, validated_data):
        user = User.objects.create_user(**validated_data, role="admin")
        return user


class VendorRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(max_length=128, required=True, write_only=True)

    class Meta:
        model = User
        fields = ["id", "email", "first_name", "last_name", "password", "role"]
        read_only_fields = ["id", "role"]

    def create(self, validated_data):
        user = User.objects.create_user(**validated_data, role="vendor")
        return user


class CustomerRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(max_length=128, required=True, write_only=True)

    class Meta:
        model = User
        fields = ["id", "email", "first_name", "last_name", "password", "role"]
        read_only_fields = ["id", "role"]

    def create(self, validated_data):
        user = User.objects.create_user(**validated_data, role="customer")
        return user


class ForgetPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField()


class ResetPasswordSerializer(serializers.Serializer):
    password = serializers.CharField(max_length=128)
    token = serializers.CharField(max_length=100)


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
            "role",
        ]