from rest_framework import serializers


class DashboardCountSerializer(serializers.Serializer):
    total_travellers = serializers.IntegerField()
    total_vendors = serializers.IntegerField()
    total_running_events = serializers.IntegerField()
    total_completed_events = serializers.IntegerField()
