from django.db.models import Q

from django_filters import rest_framework as filters

from .models import Event


class EventFilter(filters.FilterSet):
    start_date = filters.DateFilter(field_name="start_date", lookup_expr="gte")
    end_date = filters.DateFilter(field_name="end_date", lookup_expr="lte")
    search = filters.CharFilter(method="search_filter")
    seat_available = filters.NumberFilter(
        field_name="seat_available", lookup_expr="gte"
    )
    start_price = filters.NumberFilter(field_name="price", lookup_expr="gte")
    end_price = filters.NumberFilter(field_name="price", lookup_expr="lte")

    class Meta:
        model = Event
        fields = [
            "start_date",
            "end_date",
            "search",
            "seat_available",
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
