from django.urls import path

from stats.views.dashboard import DashboardCountView

app_name = "stats"

urlpatterns = [
    # dashboard urls
    path(
        "stats/dashboard/counts/", DashboardCountView.as_view(), name="dashboard-counts"
    ),
]
