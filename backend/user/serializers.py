from rest_framework import serializers

from .models import User, Profile


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "email", "first_name", "last_name", "is_active"]


class ProfileShortSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profile
        fields = ["avatar", "phone_number"]


class ProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profile
        fields = "__all__"


class UserListSerializer(UserSerializer):
    profile = ProfileShortSerializer()

    class Meta(UserSerializer.Meta):
        fields = UserSerializer.Meta.fields + ["profile"]


class UserDetailSerializer(UserSerializer):
    profile = ProfileSerializer()

    class Meta(UserSerializer.Meta):
        fields = UserSerializer.Meta.fields + ["profile"]


class StaffListSerializer(UserSerializer):
    profile = ProfileShortSerializer()

    class Meta(UserSerializer.Meta):
        fields = UserSerializer.Meta.fields + [
            "role",
            "is_active",
            "is_staff",
            "is_superuser",
            "profile",
        ]


class StaffDetailSerializer(StaffListSerializer):
    profile = ProfileSerializer()

    class Meta(StaffListSerializer.Meta):
        fields = StaffListSerializer.Meta.fields + ["profile"]


class CreateStaffSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "email", "first_name", "last_name", "is_superuser"]
        read_only_fields = ["id"]


class DisableUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "is_active"]
        read_only_fields = ["id"]
