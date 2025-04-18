from rest_framework import serializers


class DashboardCountSerializer(serializers.Serializer):
    total_travellers = serializers.IntegerField()
    total_vendors = serializers.IntegerField()
    total_running_events = serializers.IntegerField()
    total_completed_events = serializers.IntegerField()


class VendorDashboardSummarySerializer(serializers.Serializer):
    total_completed_events = serializers.IntegerField()
    total_running_events = serializers.IntegerField()
    total_user_travelled = serializers.IntegerField()
    total_earnings = serializers.FloatField()


class VendorRegisteredTravellersSerializer(serializers.Serializer):
    total_registered_travellers = serializers.IntegerField()


class VendorEventPieChartSerializer(serializers.Serializer):
    total_published_events = serializers.IntegerField()
    total_draft_events = serializers.IntegerField()
    total_completed_events = serializers.IntegerField()
    total_cancelled_events = serializers.IntegerField()
    total_archived_events = serializers.IntegerField()
