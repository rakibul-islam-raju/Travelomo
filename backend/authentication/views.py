import random
import string

from django.conf import settings
from django.core.exceptions import ValidationError
from django.shortcuts import get_object_or_404

from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView

from user.models import User
from notification.emails import send_activation_email
from utils.generate_token import generate_token

from .serializers import (
    ForgetPasswordSerializer,
    ResetPasswordSerializer,
    ChangePasswordSerializer,
    CustomTokenObtainPairSerializer,
    VendorRegistrationSerializer,
    CustomerRegistrationSerializer,
    MeSerializer,
)


class MeView(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = MeSerializer

    def get(self, request, *args, **kwargs):
        user = request.user
        serializer = self.get_serializer(instance=user)
        return Response(serializer.data)


class LoginView(TokenObtainPairView):
    permission_classes = [permissions.AllowAny]
    serializer_class = CustomTokenObtainPairSerializer


class VendorRegistrationView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = [permissions.AllowAny]
    serializer_class = VendorRegistrationSerializer

    def perform_create(self, serializer):
        user = serializer.save()
        # store token and save
        token = generate_token(length=100)
        user.token = token
        user.save()

        activation_url = f"{settings.FRONTEND_BASE_URL}/activate-account/?email={user.email}&token={token}"

        # Send activation email
        send_activation_email(user.email, activation_url)


class CustomerRegistrationView(generics.CreateAPIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = CustomerRegistrationSerializer

    def perform_create(self, serializer):
        user = serializer.save()
        # store token and save
        token = generate_token(length=100)
        user.token = token
        user.save()

        activation_url = f"{settings.FRONTEND_BASE_URL}/activate-account/?email={user.email}&token={token}"

        # Send activation email
        send_activation_email(user.email, activation_url)


class ActivateAccountView(generics.GenericAPIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, *args, **kwargs):
        email = request.GET.get("email")
        token = request.GET.get("token")

        try:
            user = User.objects.get(email=email)
            if user.token != token:
                return Response(
                    {"message": "Invalid token"}, status=status.HTTP_400_BAD_REQUEST
                )

            if user.is_active:
                return Response(
                    {"message": "Account already activated"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            user.is_active = True
            user.token = None  # Clear the token after activation
            user.save()

            return Response(
                {"message": "Account activated successfully"}, status=status.HTTP_200_OK
            )
        except User.DoesNotExist:
            return Response(
                {"message": "Invalid token"}, status=status.HTTP_400_BAD_REQUEST
            )


class ForgetPasswordView(generics.GenericAPIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = ForgetPasswordSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data.get("email")
        user = User.objects.get(email=email)
        if user:
            token = "".join(random.choices(string.ascii_letters + string.digits, k=100))
            user.password_reset_token = token
            user.save()

            return Response({"message": "Password reset email sent"})
        return Response({"message": "User not found"}, status=status.HTTP_404_NOT_FOUND)


class ResetPasswordView(generics.GenericAPIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = ResetPasswordSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        token = serializer.validated_data.get("token")
        password = serializer.validated_data.get("password")
        email = serializer.validated_data.get("email")

        try:
            user = get_object_or_404(User, email=email)
            if user.token != token:
                return Response(
                    {"message": "Invalid token"}, status=status.HTTP_400_BAD_REQUEST
                )

            user.set_password(password)
            user.token = None
            user.save()
            return Response({"message": "Password reset successful"})

        except User.DoesNotExist:
            return Response(
                {"message": "Invalid token"}, status=status.HTTP_400_BAD_REQUEST
            )


class ChangePasswordView(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = ChangePasswordSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        old_password = serializer.validated_data.get("old_password")
        new_password = serializer.validated_data.get("new_password")

        user = request.user

        if not user.check_password(old_password):
            raise ValidationError("Wrong Password")

        user.set_password(new_password)
        user.save()

        return Response({"message": "Password changed"}, status=status.HTTP_200_OK)
