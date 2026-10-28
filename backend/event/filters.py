from django.db.models import Q
from django_filters import rest_framework as filters

from .models import Event


class EventFilter(filters.FilterSet):
    start_date = filters.DateFilter(field_name="start_date", lookup_expr="gte")
    end_date = filters.DateFilter(field_name="end_date", lookup_expr="lte")
    search = filters.CharFilter(method="search_filter")
    available_seats = filters.NumberFilter(
        field_name="available_seats", lookup_expr="gte"
    )
    # `price` is a Python property, so these filter on the database expression
    # for the price a customer actually pays.
    start_price = filters.NumberFilter(method="effective_price_filter")
    end_price = filters.NumberFilter(method="effective_price_filter")

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
            "status",
            "is_archived",
            "vendor",
        ]

    def search_filter(self, queryset, name, value):
        return queryset.filter(
            Q(title__icontains=value)
            | Q(description__icontains=value)
            | Q(location__icontains=value)
            | Q(tags__icontains=value)
        ).distinct()

    def effective_price_filter(self, queryset, name, value):
        lookup = "gte" if name == "start_price" else "lte"
        return queryset.with_effective_price().filter(
            **{f"effective_price__{lookup}": value}
        )


class VendorEventFilter(EventFilter):
    class Meta(EventFilter.Meta):
        fields = EventFilter.Meta.fields + ["is_archived"]


class AdminEventFilter(EventFilter):
    class Meta(EventFilter.Meta):
        fields = EventFilter.Meta.fields + [
            "is_archived",
        ]
