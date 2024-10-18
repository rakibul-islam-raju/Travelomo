from django.conf import settings
from django.shortcuts import get_object_or_404

from rest_framework.response import Response
from rest_framework import status
from rest_framework.exceptions import ValidationError
from rest_framework import generics, filters
from rest_framework.permissions import IsAdminUser
from django_filters.rest_framework import DjangoFilterBackend

from utils.generate_token import generate_token
from notification.emails import send_password_reset_email

from .mails.user_mails import send_set_staff_password_email, send_user_deactivate_email
from .permissions import IsSuperUser
from .models import User
from .serializers import (
    UserListSerializer,
    UserDetailSerializer,
    StaffListSerializer,
    StaffDetailSerializer,
    CreateStaffSerializer,
    DisableUserSerializer,
)


class UserListView(generics.ListAPIView):
    queryset = User.objects.filter(role__in=["customer", "vendor"])
    serializer_class = UserListSerializer
    permission_classes = [IsAdminUser]
    filter_backends = [filters.SearchFilter, DjangoFilterBackend]
    search_fields = ["email", "first_name", "last_name", "profile__phone_number"]
    filterset_fields = ["is_active"]


class UserDetailView(generics.RetrieveAPIView):
    queryset = User.objects.filter(role="customer")
    serializer_class = UserDetailSerializer
    permission_classes = [IsAdminUser]


class StaffListCreateView(generics.ListCreateAPIView):
    queryset = User.objects.filter(is_staff=True, role="admin")
    serializer_class = StaffListSerializer
    filter_backends = [filters.SearchFilter, DjangoFilterBackend]
    search_fields = ["email", "first_name", "last_name", "profile__phone_number"]
    filterset_fields = ["is_active", "is_superuser"]

    def get_queryset(self):
        if self.request.method == "POST":
            return User.objects.all()
        return User.objects.filter(is_staff=True, role="admin")

    def get_permissions(self):
        if self.request.method == "POST":
            self.permission_classes = [IsSuperUser]
        else:
            self.permission_classes = [IsAdminUser]
        return super().get_permissions()

    def get_serializer_class(self):
        if self.request.method == "POST":
            return CreateStaffSerializer
        return StaffListSerializer

    def perform_create(self, serializer):
        validated_data = serializer.validated_data
        if validated_data.get("is_superuser") and not self.request.user.is_superuser:
            raise ValidationError("You are not authorized to create a superuser.")

        user = serializer.save(is_staff=True, role="admin")

        # store token and save
        token = generate_token(length=100)
        user.token = token
        user.save()

        activation_url = f"{settings.FRONTEND_BASE_URL}/reset-password/?email={user.email}&token={token}"
        send_set_staff_password_email(user, activation_url)

        return Response(
            {"message": "Staff user created successfully"},
            status=status.HTTP_201_CREATED,
        )


class StaffDetailView(generics.RetrieveAPIView):
    queryset = User.objects.filter(is_staff=True, role="admin")
    serializer_class = StaffDetailSerializer


class DeactivateUserView(generics.GenericAPIView):
    permission_classes = [IsAdminUser]
    serializer_class = DisableUserSerializer

    def get_queryset(self):
        if self.request.user.is_superuser:
            return User.objects.all()
        return User.objects.filter(is_staff=False, role="customer")

    def post(self, request, *args, **kwargs):
        user = self.get_queryset().get(pk=kwargs.get("pk"))

        if user.is_superuser or (user.is_staff and request.user.is_staff):
            raise ValidationError("You are not authorized to disable this user.")

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        if user.is_active == False:
            send_user_deactivate_email(user, "deactivate")
        else:
            send_user_deactivate_email(user, "activate")

        return Response(
            {"message": "User status updated successfully"},
            status=status.HTTP_200_OK,
        )


class SendPasswordResetLinkView(generics.GenericAPIView):
    permission_classes = [IsAdminUser]

    def get(self, request, *args, **kwargs):
        pk = kwargs.get("pk")
        user = get_object_or_404(User, pk=pk)
        token = generate_token(length=100)
        user.token = token
        user.save()

        password_reset_url = f"{settings.FRONTEND_BASE_URL}/reset-password/?email={user.email}&token={token}"
        send_password_reset_email(user.email, password_reset_url)

        return Response(
            {"message": "Password reset link sent"}, status=status.HTTP_200_OK
        )
