from django.urls import path

from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    LoginView,
    VendorRegistrationView,
    CustomerRegistrationView,
    ForgetPasswordView,
    ResetPasswordView,
    ChangePasswordView,
    ActivateAccountView,
)

app_name = "authentication"

urlpatterns = [
    path("login/", LoginView.as_view(), name="login"),
    path("refresh/", TokenRefreshView.as_view(), name="refresh-token"),
    path("register/vendor/", VendorRegistrationView.as_view(), name="vendor-signup"),
    path(
        "register/customer/", CustomerRegistrationView.as_view(), name="customer-signup"
    ),
    path("activate-account/", ActivateAccountView.as_view(), name="activate-account"),
    path("forget-password/", ForgetPasswordView.as_view(), name="forget-pass"),
    path("reset-password/", ResetPasswordView.as_view(), name="reset-pass"),
    path("change-password/", ChangePasswordView.as_view(), name="change-pass"),
]
