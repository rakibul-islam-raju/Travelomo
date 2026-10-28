# Travelomo Manual-Payment Decisions

This file records the answers to `DEC-001` through `DEC-007` in `TODO.md`. Customers pay vendors outside Travelomo, then submit the transaction ID. The vendor checks that ID against their own account and approves or rejects it. Travelomo never moves money.

Decided on 2026-10-28. Owner: Rakibul Islam.

| ID | Decision | Status |
|---|---|---|
| DEC-001 | Fixed list of payment channels; each method has a channel and a vendor label | Accepted, implemented |
| DEC-002 | 20 minutes to submit, 24 hours to verify, never past the event start | Accepted, implemented |
| DEC-003 | Many bookings per event, but only one unfinished at a time | Accepted, implemented |
| DEC-004 | A rejection releases the seats; the customer books again. No admin overrides | Accepted, implemented |
| DEC-005 | The dashboard shows "verified booking value" from confirmed booking snapshots | Default, confirm before `EARN-001` |
| DEC-006 | Receipt fields, BDT, Asia/Dhaka | Default; legal/tax review still open |
| DEC-007 | Normalized ID, unique per channel among pending and verified submissions | Accepted, implemented |

## Booking states

```
                     reserve_booking
                           │  holds seats, snapshots price
                           ▼
              ┌──────────────────────────────┐   20 min / event start passes
              │  awaiting_payment_reference  │ ─────────────────────────────► expired*
              └──────────────────────────────┘
                 │ customer submits ID     │ customer cancels
                 ▼                         └────────────────────────────────► cancelled*
              ┌──────────────────────────────┐   24 h / event start passes
              │     pending_verification     │ ─────────────────────────────► expired*
              └──────────────────────────────┘
                 │ vendor approves   │ vendor rejects   │ customer cancels
                 ▼                   ▼                  └───────────────────► cancelled*
             confirmed        payment_rejected*
                 │
                 │ customer cancels before the event's cancellation deadline
                 ▼
             cancelled*                  * seats released exactly once
```

`awaiting_payment_reference` and `pending_verification` are **unfinished**. `confirmed` can only move to `cancelled`. The starred states are final.

The payment submission follows the booking:

| Booking moves to | Submission becomes |
|---|---|
| `pending_verification` | `pending` (created) |
| `confirmed` | `verified` |
| `payment_rejected` | `rejected` |
| `cancelled` from pending | `withdrawn` |
| `expired` from pending | `expired` |
| `cancelled` from confirmed | stays `verified`; the payment happened |

## DEC-001 · Payment channels and instructions

- A vendor payment method has a **channel** from a fixed list: bKash, Nagad, Rocket, Upay, Bank transfer. It also has a free-text **label** (for example "bKash Personal"), account holder name, account or wallet number, optional instructions, and an active switch.
- A customer cannot reserve seats unless the vendor has at least one active method.
- After the seats are held, the customer sees every active method with its channel, label, account name, number and instructions, plus the exact amount and the deadline.
- When a customer submits a transaction ID, they choose a method, which sets the channel. So the channel is always known, and the customer never types it.
- Adding a channel means changing `VendorPaymentMethod.CHANNEL_CHOICES` and the matching `CHANNELS` list on the vendor payment-methods page.

**Existing methods were migrated by name:** any label containing "bkash", "nagad", "rocket" or "upay" got that channel. All other methods became **Bank transfer**. Vendors should check their methods after deploying.

Code: `vendor/models.py` (`VendorPaymentMethod.channel`), migrations `vendor/0004`–`0005`, `frontend/app/dashboard/payment-methods/page.tsx`.

## DEC-002 · Deadlines and timeout

| Window | Default | Setting |
|---|---|---|
| Customer submits the transaction ID | 20 minutes from reservation | `BOOKING_PAYMENT_REFERENCE_TTL_MINUTES` |
| Vendor verifies | 24 hours from submission | `BOOKING_VERIFICATION_TTL_HOURS` |

- **Both deadlines are capped at the event start:** midnight Asia/Dhaka on the start date (`Event.starts_at`). A customer who reserves at 23:50 the night before has 10 minutes, not 20.
- **On timeout,** the booking becomes `expired`, its seats are released exactly once, a pending submission becomes `expired`, and the customer is emailed.
- **Who expires it:** the `expire-stale-bookings` Celery task, every 5 minutes. A late submission or review also expires it on the spot, and so does the customer's next reservation for the same event. A late request gets `409 booking_expired`.
- **A vendor who doesn't verify in time** sees the booking expire like any other. There is no escalation to admins in v1.

Code: `event/services.py` (`_deadline`, `_expire`, `expire_booking`), `core/eventcelery.py`.

## DEC-003 · Repeat bookings and status transitions

- A customer may have several bookings for the same event, but **at most one unfinished booking**. To add seats, they finish (or cancel) the current one, then book again.
- A second reservation attempt returns `409 unfinished_booking_exists`. The booking dialog links to My Bookings.
- If the existing hold's deadline has already passed, it is expired and the new reservation goes ahead.
- A partial unique index on `(event, user)` for unfinished statuses backs this up.
- Transitions are exactly the diagram above.

**Existing data:** where a customer already had more than one unfinished booking for an event, migration `event/0016` kept the newest and expired the rest, releasing their seats.

Code: `event/models.py` (`SeatBooking.UNFINISHED_STATUSES`, constraint `one_unfinished_booking_per_customer_event`), `event/services.py` (`reserve_booking`).

## DEC-004 · Cancellation, refunds, rejection, admin override

- **Unfinished bookings** can always be cancelled by the customer. The seats are released and a pending submission becomes `withdrawn`.
- **Confirmed bookings** can be cancelled until `cancellation_days` before the start date, inclusive. `cancellation_days = 0` means a confirmed booking cannot be cancelled.
- **Refunds happen off-platform.** The customer arranges them with the organizer. v1 records nothing about refunds; the booking shows `cancelled` and the submission stays `verified`. A refund note or status is a possible later addition.
- **Rejection is final for that booking.** Seats are released at once and the customer must book again; there is no resubmission on the same booking. The same transaction ID may be submitted on the new booking (see DEC-007), so a vendor's mistaken rejection can be corrected.
- **No admin overrides in v1.** In Django admin, bookings and payment submissions are view-only, so nobody can change a status without the seat and email rules running. Any recovery tool must be a new audited service function.

Code: `event/services.py` (`cancel_booking`, `review_payment`), `event/admin.py`.

## DEC-005 · Dashboard metric

> Default chosen during implementation. Confirm before starting `EARN-001`.

- The dashboard metric is **"Verified booking value"**: the sum of `total_amount` over the vendor's `confirmed` bookings.
- `total_amount` is the snapshot taken at reservation, never the event's current price.
- Pending, rejected, expired and cancelled bookings are excluded. Cancelled bookings are excluded even if they were confirmed first, because Travelomo cannot know whether a refund was paid.
- **This replaces the "earnings" formula in `USER-FLOW.md` §2.3**, which used current prices and completed events only. The metric counts confirmed bookings whatever the event's status; the dashboard may show completed and upcoming events separately.
- The UI must not call it "earnings" or "revenue", because Travelomo cannot confirm the money settled.

The admin event detail page already uses this definition (`booking_summary.verified_booking_value`).

## DEC-006 · Receipt, currency, time zone

> Fields, currency and time zone are defaults for `BOOK-011`. The legal/tax question is still open.

- **Currency:** BDT only. Amounts are stored with 2 decimals and shown as whole taka with thousands separators, for example "BDT 2,400".
- **Time zone:** all dates and deadlines are shown in Asia/Dhaka, the backend's `TIME_ZONE`.
- **Receipt fields:** booking reference; issue date; customer name and email; event title, dates and location; vendor store name and contact; seats; unit price; total; currency; payment channel and method label; transaction ID masked to its last 4 characters; status; verification time.
- **Title:** "Booking receipt", not "invoice". The vendor is the seller and Travelomo is not a party to the payment.
- **Open:** whether vendors must issue VAT/tax invoices, and whether Travelomo needs a trade-licence or BIN line on receipts. This needs legal review before `BOOK-011` ships.

## DEC-007 · Transaction-ID normalization and uniqueness

- **Normalization:** trim, uppercase, and remove all whitespace. Other characters, including hyphens, are kept. The customer's original text is stored for display.
- **Minimum length:** 4 characters after trimming. **Maximum:** 120.
- **Uniqueness:** a normalized ID can back **one pending or verified submission per channel, across all of Travelomo**. This catches one bKash receipt being reused at two vendors.
- **Rejected, withdrawn and expired submissions don't block reuse.** A customer whose booking lapsed or was wrongly rejected can book again with the same genuine payment. The vendor review screen (`PAY-012`) should show earlier rejections of the same ID, so repeated attempts with a bad ID are visible.
- **A duplicate is a `400` field error on `transaction_id`.** The message never names the other booking or vendor.
- **Snapshots:** each submission stores its own channel, amount and currency at submission time. Later edits to the method or price don't change what the vendor is checking.

Code: `event/models.py` (`ManualPaymentSubmission`, constraint `unique_live_transaction_per_channel`), migrations `event/0016`–`0017`.

## Data model changes in this batch

| Model | Change |
|---|---|
| `VendorPaymentMethod` | New required `channel` |
| `SeatBooking` | Partial unique constraint: one unfinished booking per customer and event |
| `ManualPaymentSubmission` | New `channel`, `amount`, `currency` snapshots; new statuses `withdrawn` and `expired`; uniqueness moved from per-method to per-channel among live submissions |

`event/0016` refuses to run if two live submissions on one channel already share a normalized ID. It lists the booking references so someone can resolve them first. All four migrations reverse cleanly.

Tests: `backend/event/tests/test_payment_rules.py`.
