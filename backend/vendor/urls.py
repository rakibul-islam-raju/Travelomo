from django.urls import path

from .views import (
    VendorMeView,
    VendorListCreateView,
    VendorDetailView,
    VendorApprovalView,
    VendorPaymentMethodListCreateView,
    VendorPaymentMethodDetailView,
)

app_name = "vendor"

urlpatterns = [
    path("vendors/", VendorListCreateView.as_view(), name="vendor-list-create"),
    path("vendors/me/", VendorMeView.as_view(), name="me-vendor"),
    path(
        "vendors/payment-methods/",
        VendorPaymentMethodListCreateView.as_view(),
        name="vendor-payment-method-list",
    ),
    path(
        "vendors/payment-methods/<str:pk>/",
        VendorPaymentMethodDetailView.as_view(),
        name="vendor-payment-method-detail",
    ),
    path("vendors/<str:pk>/", VendorDetailView.as_view(), name="vendor-detail"),
    path(
        "vendors/<str:pk>/approval/",
        VendorApprovalView.as_view(),
        name="vendor-approval",
    ),
]
