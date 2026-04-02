# Earnings Calculation — How It Works in Travelomo

## The Story: The Journey of a Booking into Earnings

Imagine a vendor — let's call her **Rina**. She runs a travel agency and has just created a 7-day Sundarbans tour on Travelomo. She sets the price at **$150 per seat**, with her event having **20 total seats**.

Over the next few weeks, 14 customers book seats. Some book 1 seat, some book 2. The platform records each booking in the `SeatBooking` table — noting the customer, the event, and how many seats they took.

One customer later cancels their 2-seat booking. The platform marks that booking as `cancelled` and restores the 2 seats back to the event.

The tour departs, everyone has a great time, and when the `end_date` passes, a Celery task automatically marks the event as `completed`.

Now Rina opens her vendor dashboard and sees **"Total Earnings"**. What should it show?

It should show the total money earned from **confirmed bookings** on her **completed events**.

---

## The Math

```
Earnings = Σ (seat_number × effective_price)
           for each CONFIRMED booking
           on a COMPLETED event
           belonging to THIS vendor
```

Where:

- `effective_price` = `discount_price` if the event had a discount applied, otherwise `actual_price`
- `confirmed` = bookings that were **not** cancelled
- `completed` = events whose `end_date` has passed (auto-marked by Celery)

**For Rina's tour:**
- 14 booked seats − 2 cancelled seats = **12 confirmed seats**
- Effective price = $150 (no discount on this event)
- **Total earnings = 12 × $150 = $1,800**

---

## Why It Was Broken

The backend view `VendorDashboardSummaryView` in `backend/stats/views/vendor.py` had this hardcoded on line 39:

```python
total_earnings = 00.00   # ← never calculated, always zero
```

The data was always there in the database — `SeatBooking` records pile up with every booking. But nobody ever wrote the query to sum them up.

---

## The Fix: One SQL Query

The fix replaces that hardcoded zero with a single database aggregation:

```python
from decimal import Decimal
from django.db.models import Count, Sum, Case, When, F, ExpressionWrapper, DecimalField

earnings_result = SeatBooking.objects.filter(
    event__vendor=self.request.user.vendor,   # only this vendor's events
    event__status="completed",                # only completed events
    status="confirmed",                       # exclude cancelled bookings
).aggregate(
    total=Sum(
        ExpressionWrapper(
            F("seat_number") * Case(
                When(event__discount_price__gt=0, then=F("event__discount_price")),
                default=F("event__actual_price"),
            ),
            output_field=DecimalField(),
        )
    )
)
total_earnings = float(earnings_result["total"] or Decimal("0.00"))
```

### Why `Case/When`?

The `Event.price` property in Python says:
> *"Use `discount_price` if it's set (> 0), otherwise use `actual_price`."*

But Python properties can't run inside a database query — they only work when you already have a Python object in memory. `Case/When` is the SQL equivalent. It replicates the same logic **inside the SUM** so the entire calculation happens in a single SQL `SELECT`, not by looping over every booking in Python.

### Why `status="confirmed"`?

Cancelled bookings should not count toward earnings. A customer who cancelled and got their seats back did not pay. Counting cancelled bookings would inflate the vendor's earnings incorrectly.

### Why `event__status="completed"`?

Earnings are only from events that have actually finished. A vendor hasn't truly "earned" money from an event that is still upcoming or currently running — that's revenue-in-progress. Once the event completes, the money is realized.

> **Note:** This is a business decision. If the product owner decides that earnings should include `travelling` (in-progress) events, just add `status__in=["completed", "travelling"]` to the filter.

---

## The Full Lifecycle: Seed to Earnings

```
Vendor creates event (status: published)
        │
        ▼
Customer books seats
→ SeatBooking created (status: confirmed)
→ Event.available_seats decremented atomically
→ Confirmation email sent via Celery
        │
        ▼
[Optional] Customer cancels booking
→ SeatBooking.status = cancelled
→ Event.available_seats restored atomically
        │
        ▼
Event end_date passes
→ Celery task runs nightly
→ Event.status = completed
        │
        ▼
Vendor opens dashboard
→ VendorDashboardSummaryView fires ONE SQL query
→ Filters: vendor's events, completed, confirmed bookings only
→ Aggregates: SUM(seat_number × effective_price)
→ Returns total_earnings
        │
        ▼
Vendor sees real earnings on their dashboard 💰
```

---

## What Changes in Code

| File | Change |
|------|--------|
| `backend/stats/views/vendor.py` | Replace `total_earnings = 00.00` with DB aggregation query; update imports |

**No migration needed** — no model changes.  
**No frontend changes needed** — `VendorSummaryInfo.tsx` already fetches and displays `total_earnings`. It was showing `$0.00` only because the backend was always returning zero.

---

## Verification Steps

1. Create an event with a price, book some seats, mark the event as `completed`
   → Dashboard should show `total_earnings = seats_booked × price`

2. Cancel one booking, check again
   → Earnings should decrease by `cancelled_seats × price`

3. A vendor with no completed events
   → Should show `$0.00` cleanly (not an error or `null`)

4. Event with discount price
   → Earnings should use `discount_price`, not `actual_price`
