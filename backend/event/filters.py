from django.db.models import Q
from django.utils import timezone

from django_filters import rest_framework as filters

from .models import Event


class EventFilter(filters.FilterSet):
    start_date = filters.DateFilter(field_name="start_date", lookup_expr="gte")
    end_date = filters.DateFilter(field_name="end_date", lookup_expr="lte")
    search = filters.CharFilter(method="search_filter")
    available_seats = filters.NumberFilter(
        field_name="available_seats", lookup_expr="gte"
    )
    start_price = filters.NumberFilter(field_name="price", lookup_expr="gte")
    end_price = filters.NumberFilter(field_name="price", lookup_expr="lte")

    class Meta:
        model = Event
        fields = [
            "start_date",
            "end_date",
            "search",
            "available_seats",
            "start_price",
            "end_price",
            "is_featured",
        ]

    def search_filter(self, queryset, name, value):
        return queryset.filter(
            Q(title__icontains=value)
            | Q(description__icontains=value)
            | Q(location__icontains=value)
            | Q(tags__icontains=value)
        )


class VendorEventFilter(EventFilter):
    class Meta(EventFilter.Meta):
        fields = EventFilter.Meta.fields + ["is_published", "is_archived"]


class AdminEventFilter(EventFilter):
    is_completed = filters.BooleanFilter(method="is_completed_filter")

    class Meta(EventFilter.Meta):
        fields = EventFilter.Meta.fields + [
            "is_published",
            "is_archived",
            "is_deleted",
            "is_completed",
        ]

    def is_completed_filter(self, queryset, name, value):
        if value:
            return queryset.filter(end_date__lt=timezone.now().date())
        return queryset.filter(end_date__gte=timezone.now().date())
