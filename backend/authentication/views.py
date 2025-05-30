import random
import string

from django.conf import settings
from django.core.exceptions import ValidationError
from django.shortcuts import get_object_or_404

from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework.views import APIView

from user.models import User
from utils.Token import Token

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

    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)

        if response.status_code == 200:
            access_token = response.data.get("access")
            refresh_token = response.data.get("refresh")
            user = response.data.get("user")

            # set access token cookie
            response.set_cookie(
                settings.AUTH_COOKIES["access"]["name"],
                access_token,
                httponly=settings.AUTH_COOKIES["access"]["httponly"],
                secure=settings.AUTH_COOKIES["access"]["secure"],
                samesite=settings.AUTH_COOKIES["access"]["samesite"],
                max_age=settings.AUTH_COOKIES["access"]["max_age"],
            )

            # set refresh token cookie
            response.set_cookie(
                settings.AUTH_COOKIES["refresh"]["name"],
                refresh_token,
                httponly=settings.AUTH_COOKIES["refresh"]["httponly"],
                secure=settings.AUTH_COOKIES["refresh"]["secure"],
                samesite=settings.AUTH_COOKIES["refresh"]["samesite"],
                max_age=settings.AUTH_COOKIES["refresh"]["max_age"],
            )

            # set role cookie
            response.set_cookie(
                settings.AUTH_COOKIES["role"]["name"],
                user.get("role"),
                httponly=settings.AUTH_COOKIES["role"]["httponly"],
                secure=settings.AUTH_COOKIES["role"]["secure"],
                samesite=settings.AUTH_COOKIES["role"]["samesite"],
                max_age=settings.AUTH_COOKIES["role"]["max_age"],
            )

            # set role cookie
            response.set_cookie(
                settings.AUTH_COOKIES["role"]["name"],
                user.get("role"),
                httponly=settings.AUTH_COOKIES["role"]["httponly"],
                secure=settings.AUTH_COOKIES["role"]["secure"],
                samesite=settings.AUTH_COOKIES["role"]["samesite"],
                max_age=settings.AUTH_COOKIES["role"]["max_age"],
            )

            # set logged in cookie
            response.set_cookie(
                settings.AUTH_COOKIES["logged_in"]["name"],
                "true",
                httponly=settings.AUTH_COOKIES["logged_in"]["httponly"],
                secure=settings.AUTH_COOKIES["logged_in"]["secure"],
                samesite=settings.AUTH_COOKIES["logged_in"]["samesite"],
                max_age=settings.AUTH_COOKIES["logged_in"]["max_age"],
            )

        return response


class LogoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        response = Response(
            {"message": "Logged out successfully"}, status=status.HTTP_200_OK
        )

        response.delete_cookie(settings.AUTH_COOKIES["access"]["name"])
        response.delete_cookie(settings.AUTH_COOKIES["refresh"]["name"])
        response.delete_cookie(settings.AUTH_COOKIES["role"]["name"])
        response.delete_cookie(settings.AUTH_COOKIES["logged_in"]["name"])

        return response


class VendorRegistrationView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = [permissions.AllowAny]
    serializer_class = VendorRegistrationSerializer


class CustomerRegistrationView(generics.CreateAPIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = CustomerRegistrationSerializer


class ActivateAccountView(generics.GenericAPIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, *args, **kwargs) -> Response:
        email = request.GET.get("email")
        token = request.GET.get("token")

        try:
            user = User.objects.get(email=email)
            if not user.token:
                return Response(
                    {"message": "Invalid token"}, status=status.HTTP_400_BAD_REQUEST
                )

            # Verify the token matches the hashed token stored on the user
            if not Token.verify_token(token, user.token):
                return Response(
                    {"message": "Invalid token"}, status=status.HTTP_400_BAD_REQUEST
                )

            if user.is_active:
                return Response(
                    {"message": "Account already activated"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Activate account and clear token
            user.is_active = True
            user.token = None
            user.save()

            return Response(
                {"message": "Account activated successfully"}, status=status.HTTP_200_OK
            )
        except User.DoesNotExist as e:
            print(f"User not found error: {str(e)}")
            return Response(
                {"message": "Invalid token"}, status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            print(f"Unexpected error: {str(e)}")
            return Response(
                {"message": "An error occurred"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
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
