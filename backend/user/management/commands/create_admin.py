from django.conf import settings
from django.core.management.base import BaseCommand

from user.models import User


class Command(BaseCommand):
    help = "Create super user"

    def handle(self, *args, **options):
        # create user
        password = settings.DEFAULT_ADMIN_PASS
        user, created = User.objects.get_or_create(
            first_name="Admin",
            last_name="User",
            email=settings.DEFAULT_ADMIN_EMAIL,
            is_staff=True,
            is_active=True,
            is_superuser=True,
            role="admin",
        )
        if created:
            user.set_password(password)
            user.save()

        self.stdout.write(
            self.style.SUCCESS(
                f"'{user.first_name} {user.last_name}' user created.\n"
                f"Email Address '{user.email}'\nPassword: '{password}'"
            )
        )

        self.stdout.write(self.style.SUCCESS("Admin user created successfully."))
