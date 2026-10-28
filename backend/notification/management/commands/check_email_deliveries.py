from datetime import timedelta

from django.core.management.base import BaseCommand, CommandError
from django.db.models import Count
from django.utils import timezone

from notification.delivery import stale_deliveries
from notification.models import EmailDelivery


class Command(BaseCommand):
    help = (
        "Report email delivery health. Exits with an error if any email failed "
        "or is stuck, so it can back a cron job or uptime check."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--hours",
            type=int,
            default=24,
            help="Look at deliveries created in the last N hours (default 24).",
        )

    def handle(self, *args, **options):
        since = timezone.now() - timedelta(hours=options["hours"])
        recent = EmailDelivery.objects.filter(created_at__gte=since)

        counts = dict(recent.values_list("status").annotate(total=Count("id")))
        summary = ", ".join(
            f"{label.lower()}: {counts.get(status, 0)}"
            for status, label in EmailDelivery.Status.choices
        )
        self.stdout.write(f"Email deliveries in the last {options['hours']}h: {summary}")

        failed = recent.filter(status=EmailDelivery.Status.FAILED)
        stuck = stale_deliveries().filter(created_at__gte=since)
        for delivery in list(failed[:20]) + list(stuck[:20]):
            self.stdout.write(
                f"  {delivery.status.upper():8} {delivery.id} {delivery.kind} "
                f"to {delivery.recipient} after {delivery.attempts} attempt(s): "
                f"{delivery.last_error[:120]}"
            )

        problems = failed.count() + stuck.count()
        if problems:
            raise CommandError(f"{problems} email delivery problem(s) need attention.")
        self.stdout.write(self.style.SUCCESS("Email delivery is healthy."))
