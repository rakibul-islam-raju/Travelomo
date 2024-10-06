from django.urls import path

from .views import VendorListCreateView, VendorDetailView, VendorApprovalView

app_name = "vendor"

urlpatterns = [
    path("vendors/", VendorListCreateView.as_view(), name="vendor-list-create"),
    path("vendors/<int:pk>/", VendorDetailView.as_view(), name="vendor-detail"),
    path(
        "vendors/<int:pk>/approval/",
        VendorApprovalView.as_view(),
        name="vendor-approval",
    ),
]
