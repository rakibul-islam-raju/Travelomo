"""
Seed command — creates demo vendors, customers, and events.

Credentials
-----------
Vendors
  vendor1@travelomo.com  /  Vendor@1234
  vendor2@travelomo.com  /  Vendor@1234
  vendor3@travelomo.com  /  Vendor@1234

Customers
  customer1@travelomo.com  /  Customer@1234
  customer2@travelomo.com  /  Customer@1234
  customer3@travelomo.com  /  Customer@1234
  customer4@travelomo.com  /  Customer@1234
  customer5@travelomo.com  /  Customer@1234
"""

from datetime import date, timedelta

from django.core.management.base import BaseCommand
from django.db import transaction

from user.models import User, Profile
from vendor.models import Vendor
from event.models import Event

# ---------------------------------------------------------------------------
# Seed data
# ---------------------------------------------------------------------------

VENDOR_PASSWORD = "Vendor@1234"
CUSTOMER_PASSWORD = "Customer@1234"

VENDORS = [
    {
        "user": {
            "email": "vendor1@travelomo.com",
            "first_name": "Alice",
            "last_name": "Rahman",
            "phone": "+8801711000001",
        },
        "store": {
            "store_name": "Wanderlust Tours",
            "tagline": "Explore beyond limits",
            "store_description": "Premium tour packages across South Asia.",
            "store_email": "info@wanderlust.com",
            "store_phone": "+8801711000001",
            "city": "Dhaka",
            "country": "Bangladesh",
            "is_approved": True,
        },
    },
    {
        "user": {
            "email": "vendor2@travelomo.com",
            "first_name": "Bashir",
            "last_name": "Hossain",
            "phone": "+8801722000002",
        },
        "store": {
            "store_name": "Summit Seekers",
            "tagline": "Reach new heights",
            "store_description": "Adventure treks and mountain expeditions.",
            "store_email": "hello@summitseekers.com",
            "store_phone": "+8801722000002",
            "city": "Chittagong",
            "country": "Bangladesh",
            "is_approved": True,
        },
    },
    {
        "user": {
            "email": "vendor3@travelomo.com",
            "first_name": "Chandni",
            "last_name": "Islam",
            "phone": "+8801733000003",
        },
        "store": {
            "store_name": "Coastal Escapes",
            "tagline": "Sun, sand and stories",
            "store_description": "Beach holidays and coastal tours.",
            "store_email": "contact@coastalescapes.com",
            "store_phone": "+8801733000003",
            "city": "Cox's Bazar",
            "country": "Bangladesh",
            "is_approved": True,
        },
    },
]

CUSTOMERS = [
    {"email": "customer1@travelomo.com", "first_name": "Dana",   "last_name": "Chowdhury", "phone": "+8801811000001"},
    {"email": "customer2@travelomo.com", "first_name": "Ehsan",  "last_name": "Karim",     "phone": "+8801822000002"},
    {"email": "customer3@travelomo.com", "first_name": "Farida", "last_name": "Begum",     "phone": "+8801833000003"},
    {"email": "customer4@travelomo.com", "first_name": "Golam",  "last_name": "Nabi",      "phone": "+8801844000004"},
    {"email": "customer5@travelomo.com", "first_name": "Hasina", "last_name": "Akter",     "phone": "+8801855000005"},
]

# Events are keyed by vendor store_name for easy look-up after vendor creation.
EVENTS_BY_VENDOR = {
    "Wanderlust Tours": [
        {
            "title": "Sundarbans Mangrove Safari",
            "description": (
                "A 3-day guided safari through the world's largest mangrove forest. "
                "Spot Royal Bengal Tigers, cruise through serene waterways, and camp "
                "under the stars."
            ),
            "start_date": date.today() + timedelta(days=30),
            "end_date": date.today() + timedelta(days=33),
            "location": "Sundarbans, Bangladesh",
            "total_seats": 20,
            "actual_price": 8500,
            "discount_price": 7200,
            "tags": "nature,wildlife,forest,adventure",
            "status": "published",
            "is_featured": True,
            "cancellation_days": 7,
        },
        {
            "title": "Sylhet Tea Garden Retreat",
            "description": (
                "Explore the lush tea gardens of Sylhet, visit Ratargul Swamp Forest, "
                "and enjoy a peaceful 2-night homestay experience."
            ),
            "start_date": date.today() + timedelta(days=15),
            "end_date": date.today() + timedelta(days=17),
            "location": "Sylhet, Bangladesh",
            "total_seats": 15,
            "actual_price": 5000,
            "discount_price": 0,
            "tags": "nature,tea,relaxation",
            "status": "published",
            "is_featured": False,
            "cancellation_days": 5,
        },
    ],
    "Summit Seekers": [
        {
            "title": "Bandarban Peak Trek",
            "description": (
                "A challenging 4-day trek through the Bandarban hills, covering "
                "Keokradong and Tajingdong peaks. Suitable for intermediate hikers."
            ),
            "start_date": date.today() + timedelta(days=20),
            "end_date": date.today() + timedelta(days=24),
            "location": "Bandarban, Bangladesh",
            "total_seats": 12,
            "actual_price": 9000,
            "discount_price": 8000,
            "tags": "trek,hills,adventure,nature",
            "status": "published",
            "is_featured": True,
            "cancellation_days": 10,
        },
        {
            "title": "Sajek Valley Weekend",
            "description": (
                "Two nights in the clouds at Sajek Valley. Enjoy breathtaking sunrise "
                "views, tribal culture tours, and bonfires."
            ),
            "start_date": date.today() + timedelta(days=10),
            "end_date": date.today() + timedelta(days=12),
            "location": "Sajek, Rangamati, Bangladesh",
            "total_seats": 18,
            "actual_price": 6500,
            "discount_price": 5800,
            "tags": "valley,weekend,nature,culture",
            "status": "published",
            "is_featured": False,
            "cancellation_days": 3,
        },
    ],
    "Coastal Escapes": [
        {
            "title": "Cox's Bazar Beach Getaway",
            "description": (
                "3 days on the world's longest natural sea beach. Includes hotel stay, "
                "seafood dinners, and a sunset boat cruise."
            ),
            "start_date": date.today() + timedelta(days=25),
            "end_date": date.today() + timedelta(days=28),
            "location": "Cox's Bazar, Bangladesh",
            "total_seats": 30,
            "actual_price": 7000,
            "discount_price": 6000,
            "tags": "beach,sea,relax,sunset",
            "status": "published",
            "is_featured": True,
            "cancellation_days": 5,
        },
        {
            "title": "Saint Martin Island Escape",
            "description": (
                "Discover coral reefs, pristine beaches, and local culture on "
                "Bangladesh's only coral island in this 2-night package."
            ),
            "start_date": date.today() + timedelta(days=45),
            "end_date": date.today() + timedelta(days=47),
            "location": "Saint Martin Island, Bangladesh",
            "total_seats": 25,
            "actual_price": 10000,
            "discount_price": 9000,
            "tags": "island,coral,beach,diving",
            "status": "published",
            "is_featured": True,
            "cancellation_days": 7,
        },
    ],
}


class Command(BaseCommand):
    help = "Seed demo vendors, customers, and events"

    def add_arguments(self, parser):
        parser.add_argument(
            "--flush",
            action="store_true",
            help="Delete all existing seed data before re-creating it",
        )

    @transaction.atomic
    def handle(self, *args, **options):
        if options["flush"]:
            self._flush()

        vendor_users = self._create_vendors()
        self._create_customers()
        self._create_events(vendor_users)

        self.stdout.write(self.style.SUCCESS("\nSeed completed successfully."))
        self._print_credentials()

    # ------------------------------------------------------------------
    # Private helpers
    # ------------------------------------------------------------------

    def _flush(self):
        all_emails = (
            [v["user"]["email"] for v in VENDORS]
            + [c["email"] for c in CUSTOMERS]
        )
        deleted, _ = User.objects.filter(email__in=all_emails).delete()
        self.stdout.write(self.style.WARNING(f"Flushed {deleted} existing seed users."))

    def _create_vendors(self):
        vendor_users = {}
        for data in VENDORS:
            u_data = data["user"]
            s_data = data["store"]

            user, created = User.objects.get_or_create(
                email=u_data["email"],
                defaults={
                    "first_name": u_data["first_name"],
                    "last_name": u_data["last_name"],
                    "phone": u_data.get("phone"),
                    "role": "vendor",
                    "is_active": True,
                },
            )
            if created:
                user.set_password(VENDOR_PASSWORD)
                user.save()
                self.stdout.write(f"  Created vendor user: {user.email}")
            else:
                self.stdout.write(f"  Skipped (exists): {user.email}")

            vendor, v_created = Vendor.objects.get_or_create(
                user=user,
                defaults=s_data,
            )
            if v_created:
                self.stdout.write(f"  Created vendor store: {vendor.store_name}")

            vendor_users[s_data["store_name"]] = vendor

        return vendor_users

    def _create_customers(self):
        for c_data in CUSTOMERS:
            user, created = User.objects.get_or_create(
                email=c_data["email"],
                defaults={
                    "first_name": c_data["first_name"],
                    "last_name": c_data["last_name"],
                    "phone": c_data.get("phone"),
                    "role": "customer",
                    "is_active": True,
                },
            )
            if created:
                user.set_password(CUSTOMER_PASSWORD)
                user.save()
                Profile.objects.get_or_create(user=user)
                self.stdout.write(f"  Created customer: {user.email}")
            else:
                self.stdout.write(f"  Skipped (exists): {user.email}")

    def _create_events(self, vendor_map):
        for store_name, events in EVENTS_BY_VENDOR.items():
            vendor = vendor_map.get(store_name)
            if not vendor:
                self.stdout.write(self.style.WARNING(f"  Vendor not found: {store_name}"))
                continue

            for e_data in events:
                event, created = Event.objects.get_or_create(
                    vendor=vendor,
                    title=e_data["title"],
                    defaults=e_data,
                )
                if created:
                    self.stdout.write(f"  Created event: {event.title}")
                else:
                    self.stdout.write(f"  Skipped (exists): {event.title}")

    def _print_credentials(self):
        self.stdout.write("\n" + "=" * 60)
        self.stdout.write(self.style.SUCCESS("SEED CREDENTIALS"))
        self.stdout.write("=" * 60)

        self.stdout.write(self.style.HTTP_INFO("\nVendors  (password: Vendor@1234)"))
        for v in VENDORS:
            self.stdout.write(f"  {v['user']['email']}")

        self.stdout.write(self.style.HTTP_INFO("\nCustomers  (password: Customer@1234)"))
        for c in CUSTOMERS:
            self.stdout.write(f"  {c['email']}")

        self.stdout.write("=" * 60 + "\n")
