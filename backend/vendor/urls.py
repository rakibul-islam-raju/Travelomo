from django.urls import path

from .views import (
    VendorMeView,
    VendorListCreateView,
    VendorDetailView,
    VendorApprovalView,
)

app_name = "vendor"

urlpatterns = [
    path("vendors/", VendorListCreateView.as_view(), name="vendor-list-create"),
    path("vendors/me/", VendorMeView.as_view(), name="me-vendor"),
    path("vendors/<str:pk>/", VendorDetailView.as_view(), name="vendor-detail"),
    path(
        "vendors/<str:pk>/approval/",
        VendorApprovalView.as_view(),
        name="vendor-approval",
    ),
]
