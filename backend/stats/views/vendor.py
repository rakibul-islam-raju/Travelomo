from datetime import datetime, timedelta
from django.db.models import Count
from django.db.models.functions import TruncDate, TruncMonth

from rest_framework.generics import GenericAPIView
from rest_framework.response import Response

from event.models import Event, SeatBooking
from user.permissions import IsVendor

from stats.serializers import (
    VendorDashboardSummarySerializer,
    VendorRegisteredTravellersSerializer,
    VendorEventPieChartSerializer,
)


class VendorDashboardSummaryView(GenericAPIView):
    serializer_class = VendorDashboardSummarySerializer
    permission_classes = [IsVendor]

    def get(self):
        total_completed_events = Event.objects.filter(
            vendor=self.request.user.vendor, is_completed=True
        ).count()
        total_running_events = Event.objects.filter(
            vendor=self.request.user.vendor,
            is_completed=False,
            start_date__lte=datetime.now(),
            end_date__gte=datetime.now(),
        ).count()
        total_user_travelled = SeatBooking.objects.filter(
            event__vendor=self.request.user.vendor, is_completed=True
        ).count()
        total_earnings = 00.00

        data = {
            "total_completed_events": total_completed_events,
            "total_running_events": total_running_events,
            "total_user_travelled": total_user_travelled,
            "total_earnings": total_earnings,
        }

        return Response(data)


class VendorRegisteredTravellersView(GenericAPIView):

    serializer_class = VendorRegisteredTravellersSerializer
    permission_classes = [IsVendor]

    def get(self, request, *args, **kwargs):
        """
        Get the total number of users who have registered to any of the vendor's events.
        This data will be used to generate a line chart based date range
        """
        report_type = request.query_params.get("report_type")
        if report_type == "last_7_days":
            start_date = datetime.now() - timedelta(days=7)
            end_date = datetime.now()
            group_by = "day"
        elif report_type == "this_week":
            start_date = datetime.now().replace(
                hour=0, minute=0, second=0, microsecond=0
            ) - timedelta(days=datetime.now().weekday())
            end_date = start_date + timedelta(days=6)
            group_by = "day"
        elif report_type == "last_30_days":
            start_date = datetime.now() - timedelta(days=30)
            end_date = datetime.now()
            group_by = "day"
        elif report_type == "this_month":
            start_date = datetime.now().replace(day=1)
            end_date = datetime.now()
            group_by = "day"
        elif report_type == "last_year":
            start_date = datetime.now() - timedelta(days=365)
            end_date = datetime.now()
            group_by = "month"
        elif report_type == "this_year":
            start_date = datetime.now().replace(day=1, month=1)
            end_date = datetime.now()
            group_by = "month"
        else:
            # Default to last 30 days if no report type specified
            start_date = datetime.now() - timedelta(days=30)
            end_date = datetime.now()
            group_by = "day"

        # Get the bookings within the date range
        bookings = SeatBooking.objects.filter(
            event__vendor=self.request.user.vendor,
            created_at__range=(start_date, end_date),
        )

        if group_by == "day":
            # Group by day
            daily_counts = (
                bookings.annotate(date=TruncDate("created_at"))
                .values("date")
                .annotate(count=Count("id"))
                .order_by("date")
            )

            # Format the data
            result = []
            for item in daily_counts:
                result.append(
                    {
                        "key": item["date"].strftime("%B %d"),  # Month Day format
                        "count": item["count"],
                    }
                )
        else:
            # Group by month
            monthly_counts = (
                bookings.annotate(month=TruncMonth("created_at"))
                .values("month")
                .annotate(count=Count("id"))
                .order_by("month")
            )

            # Format the data
            result = []
            for item in monthly_counts:
                result.append(
                    {
                        "key": item["month"].strftime("%B"),  # Month name
                        "count": item["count"],
                    }
                )

        return Response(result)


class VendorEventPieChartView(GenericAPIView):
    serializer_class = VendorEventPieChartSerializer
    permission_classes = [IsVendor]

    def get(self, request, *args, **kwargs):
        """
        Get the total number of events for each status
        """

        start_date = request.query_params.get("start_date")
        end_date = request.query_params.get("end_date")

        if start_date and end_date:
            start_date = datetime.strptime(start_date, "%Y-%m-%d")
            end_date = datetime.strptime(end_date, "%Y-%m-%d")

        total_published_events = Event.objects.filter(
            vendor=self.request.user.vendor,
            is_published=True,
            created_at__range=(start_date, end_date),
        ).count()
        total_draft_events = Event.objects.filter(
            vendor=self.request.user.vendor,
            is_published=False,
            created_at__range=(start_date, end_date),
        ).count()
        total_completed_events = Event.objects.filter(
            vendor=self.request.user.vendor,
            is_completed=True,
            created_at__range=(start_date, end_date),
        ).count()
        total_cancelled_events = Event.objects.filter(
            vendor=self.request.user.vendor,
            is_cancelled=True,
            created_at__range=(start_date, end_date),
        ).count()
        total_archived_events = Event.objects.filter(
            vendor=self.request.user.vendor,
            is_archived=True,
            created_at__range=(start_date, end_date),
        ).count()

        data = {
            "total_published_events": total_published_events,
            "total_draft_events": total_draft_events,
            "total_completed_events": total_completed_events,
            "total_cancelled_events": total_cancelled_events,
            "total_archived_events": total_archived_events,
        }

        return Response(data)
