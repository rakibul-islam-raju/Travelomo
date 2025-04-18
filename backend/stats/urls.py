from django.urls import path

from stats.views.dashboard import DashboardCountView
from stats.views.vendor import (
    VendorDashboardSummaryView,
    VendorRegisteredTravellersView,
    VendorEventPieChartView,
)

app_name = "stats"

urlpatterns = [
    # dashboard urls
    path("dashboard/counts/", DashboardCountView.as_view(), name="dashboard-counts"),
    # vendor urls
    path(
        "vendor/dashboard-summary/",
        VendorDashboardSummaryView.as_view(),
        name="vendor-dashboard-summary",
    ),
    path(
        "vendor/registered-travellers/",
        VendorRegisteredTravellersView.as_view(),
        name="vendor-registered-travellers",
    ),
    path(
        "vendor/event-pie-chart/",
        VendorEventPieChartView.as_view(),
        name="vendor-event-pie-chart",
    ),
]
