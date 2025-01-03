from django.utils import timezone

from rest_framework.generics import GenericAPIView
from rest_framework.response import Response

from user.models import User
from event.models import Event
from user.permissions import IsSystemAdmin

from stats.serializers import DashboardCountSerializer


class DashboardCountView(GenericAPIView):
    serializer_class = DashboardCountSerializer
    permission_classes = [IsSystemAdmin]

    def get(self, request):
        total_travellers = User.objects.filter(role="customer").count()
        total_vendors = User.objects.filter(role="vendor").count()
        total_running_events = Event.objects.filter(
            start_date__lte=timezone.now().date(),
            end_date__gte=timezone.now().date(),
            is_deleted=False,
        ).count()
        total_completed_events = Event.objects.filter(
            end_date__lt=timezone.now().date(), is_deleted=False
        ).count()

        data = {
            "total_travellers": total_travellers,
            "total_vendors": total_vendors,
            "total_running_events": total_running_events,
            "total_completed_events": total_completed_events,
        }

        serializer = self.get_serializer(data)
        return Response(serializer.data)
