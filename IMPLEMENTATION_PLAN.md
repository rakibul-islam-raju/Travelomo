# Travelomo Implementation Plan

## 1. Purpose

This plan turns the gaps in `FEATURES.md` into a dependency-ordered delivery roadmap for the Django API, Next.js customer/vendor application, and React admin panel.

The immediate product goal is a reliable end-to-end journey:

1. A customer can discover an event.
2. The customer can reserve seats and submit an external-payment transaction ID.
3. The customer and vendor can see the booking.
4. Booking, cancellation, payment, earnings, and notification data stay consistent.
5. Admin users can investigate and manage the supporting records.

## 2. Source Audit and Status Corrections

`FEATURES.md` is the product baseline, but parts of its status table lag behind the current source. Before feature work starts, update the table using tests rather than file presence alone.

| Area | Current source evidence | Planning interpretation |
|---|---|---|
| Booking API | Create, customer list, vendor list, and cancellation views exist in `backend/event/views.py` | Partial; needs permissions, concurrency protection, pagination contract verification, manual-payment verification states, and tests |
| Booking UI | Booking dialog, customer booking page, and vendor booking page exist in `frontend/` | Partial; needs error handling, auth return URL, responsive states, confirmation/receipt flow, and integration tests |
| Booking email | Celery task and template exist | Partial; delivery path and retry behavior need tests; confirmation must follow vendor verification rather than initial submission |
| Earnings | Confirmed completed bookings are aggregated in `backend/stats/views/vendor.py` | Partial; amounts are derived from mutable event prices and do not distinguish pending from vendor-verified payments |
| Public events page | Route exists but currently renders only a heading | Not done beyond route scaffolding |
| Password recovery | API endpoints and partial UIs exist | Partial and inconsistent; token generation/storage and email delivery need repair before the UI is completed |
| Vendor profile update | Backend `PATCH` support exists | Partial; vendor UI and mutation are missing |
| Admin event detail | Route exists; page is a placeholder and its API query points at a vendor endpoint | Not done |

Known baseline risks to address early:

- A booking total is calculated from the event's current price, so historical totals can change when an event price is edited.
- Booking creation decrements seats, but it does not collect a transaction ID or wait for vendor verification and needs stronger concurrency guarantees.
- Concurrent cancellation requests can restore seats more than once unless the booking row is locked or conditionally updated.
- Customer-only booking permissions are not enforced explicitly.
- The public price filters query the `price` Python property as though it were a database field.
- The password-request endpoint references inconsistent token storage and does not complete the documented email flow.
- Booking confirmation code depends on a Celery worker and template configuration that currently has no automated coverage.
- The public event-detail page has a missing `Button` import and should be included in baseline build fixes.

## 3. Delivery Principles

- Treat the API as the contract shared by the two UIs. Document request, response, error, filtering, and pagination shapes before wiring screens.
- Store financial and booking facts as immutable snapshots. Do not derive past totals from mutable event fields.
- Let the backend own availability, totals, booking state, cancellation eligibility, payment verification, and permissions.
- Treat a customer-supplied transaction ID only as a verification request; only the owning vendor can mark it verified.
- Make submission, approval, rejection, expiry, and seat restoration idempotent and auditable.
- Add automated coverage with each vertical slice, including permission failures and concurrent seat updates.
- Ship behind environment configuration where external services are involved, with sandbox/test credentials first.
- Update `FEATURES.md` only when acceptance criteria pass, not merely when files or placeholders exist.

## 4. Target Domain Changes

Before adding manual payment verification, evolve `SeatBooking` into a durable booking record. Exact names can change during implementation, but the model must support these facts:

- Booking reference suitable for customer support and receipts.
- Statuses for at least `awaiting_payment_reference`, `pending_verification`, `confirmed`, `payment_rejected`, `expired`, and `cancelled`.
- Immutable `unit_price`, `seat_count`, `subtotal`, `currency`, and expected/verified amount snapshots.
- Payment-reference submission deadline and vendor-verification deadline.
- Verification, rejection, expiry, and cancellation timestamps plus reasons where applicable.
- Database constraints preventing zero/negative seats and invalid monetary values.

Add a `ManualPaymentSubmission` model rather than mixing mutable verification data into the booking. It should record the booking, payment channel/method, normalized external transaction ID, customer-submitted amount if required, currency, status, submitting customer, verifying vendor user, submitted/verified timestamps, and an optional rejection note. Keep an audit trail if a rejected payment can be resubmitted.

The server must still calculate and snapshot the amount due. A customer-entered amount or transaction ID is evidence for manual review, not proof that the correct amount was paid. Transaction IDs must be normalized and protected against reuse; the uniqueness scope should include the payment channel if different channels can issue overlapping IDs.

Recommended state transition:

```text
available seats
      |
      v
awaiting_payment_reference -- no transaction ID before deadline --> expired --> seats restored
      |
      +-- customer submits transaction ID --> pending_verification
                                                |
                                                +-- vendor rejects --> payment_rejected --> seats restored
                                                |
                                                +-- verification timeout --> expired --> seats restored
                                                |
                                                +-- owning vendor approves --> confirmed
                                                                                 |
                                                                                 +-- cancellation --> cancelled
                                                                                 +-- event completed --> retained for earnings/history
```

The recommended booking operation is two-step: Travelomo first reserves the requested seats and returns the exact amount, vendor payment instructions, and a short submission deadline; the customer then pays externally and submits the transaction ID before that deadline. This avoids a customer paying first and discovering that no seats remain. After submission, keep the seats reserved while the vendor verifies the transaction. Restore seats exactly once if either deadline expires or the vendor rejects the submission. Any refund after a confirmed cancellation happens outside Travelomo; the platform may record a manual refund note/status later, but it does not initiate money movement.

## 5. Phased Implementation

### Phase 0 — Confirm Manual Payment Rules

Resolve the decisions that affect data modeling and user-visible behavior:

- Which external payment methods/channels vendors may advertise and which instructions customers see before booking.
- How long the initial seat hold lasts while the customer makes the external payment and submits the transaction ID.
- How long seats remain held while a submitted transaction awaits vendor verification.
- The vendor verification SLA and what happens when a vendor does not act before expiry.
- Transaction-ID normalization and uniqueness scope, including whether a payment method/channel is required.
- Whether customers can make more than one booking for the same event.
- Cancellation policy, how off-platform refunds are communicated/recorded, and who can override a cancellation.
- Whether “earnings” means the total value of vendor-verified bookings or another manually reconciled value.
- Receipt/invoice fields and legal/tax requirements.

Deliverables:

- Approved booking/manual-verification state diagram.
- API contract for submission, vendor approval/rejection, expiry, and optional resubmission.
- Vendor payment-instruction data requirements and access rules.

Exit criteria:

- Each decision above has an owner and an accepted answer.
- Test fixtures cover valid, duplicate, rejected, expired, and resubmitted transaction IDs.

### Phase 1 — Stabilize the Existing Vertical Slice

Backend:

- Add booking tests for role permissions, event status/date eligibility, sold-out events, insufficient seats, cancellation deadlines, repeated cancellation, and two customers competing for the last seats.
- Move booking/cancellation rules from views into atomic service functions.
- Lock or conditionally update both event and booking rows so seat counts cannot be over-decremented or over-restored.
- Return consistent DRF validation errors and enforce customer-only booking.
- Decide and document the list pagination shape used by both Next.js pages.
- Add coverage for the booking email task, including a missing booking and mail delivery failure/retry behavior.
- Fix public event filters, especially effective-price filtering.

Frontend:

- Fix the event-detail build error and run the production build.
- Preserve the intended event URL when redirecting an unauthenticated customer to login.
- Show API errors in booking/cancellation UIs and prevent invalid or duplicate submissions.
- Invalidate/refetch both event availability and booking lists after mutations.
- Add explicit loading, empty, error, sold-out, and cancellation-confirmation states.
- Make the vendor booking table usable on narrow screens and add server-driven pagination/filtering if the dataset can grow.

Admin:

- Fix the event-detail API endpoint and replace the placeholder with an operational read-only detail screen.

Exit criteria:

- The existing non-payment booking journey works end to end in a local/test environment.
- Concurrency tests prove seats remain between zero and total capacity.
- Backend tests and both UI production builds pass.

### Phase 2 — Manual Payment Submission and Vendor Verification

Backend data and services:

- Add immutable price/currency snapshots and expanded booking statuses via migrations.
- Add `ManualPaymentSubmission`, admin registration, transaction-ID constraints/indexes, verification audit fields, and optional resubmission history.
- Add vendor-owned payment instructions/methods so customers know where and how much to pay before booking.
- Implement a booking service that calculates totals from server-side event data, reserves seats, and returns the exact amount, payment instructions, booking reference, and transaction-submission deadline.
- Implement transaction-ID submission that validates ownership, hold expiry, channel, and reuse before moving the reservation to pending verification.
- Add expiry processing that restores seats exactly once when the customer does not submit in time or the vendor does not verify in time.
- Add idempotency for reservation creation, transaction-ID submission, vendor approval, rejection, and expiry.

API:

- Add a customer reservation endpoint that holds seats before external payment and returns the vendor's configured payment instructions.
- Add an authenticated customer endpoint to submit the external transaction ID and selected payment channel for their unexpired reservation.
- Add vendor-only approve and reject endpoints scoped to bookings for that vendor's events.
- Reject transaction-ID reuse and return a safe conflict response without exposing another customer's booking.
- Add booking-detail/receipt data with the payment-verification status and appropriately masked transaction reference.
- Define cancellation endpoints and manual refund-note/status behavior according to Phase 0; Travelomo will not issue the refund.
- Prevent approval after rejection/expiry/cancellation unless an explicit, audited resubmission or admin recovery flow exists.

Frontend:

- Start the booking operation by reserving seats, then show vendor payment instructions, the server-calculated amount, and a visible submission deadline.
- Collect and validate the payment channel and external transaction ID as the second step of the same booking operation.
- Add awaiting-reference, verification-pending, confirmed, rejected, expired, and resubmission states.
- Add a booking detail/receipt page reachable from “My Bookings.”
- Explain that submission is not confirmation and that seats are held only until the verification deadline.
- Add vendor actions to review the booking, transaction reference, expected amount, and approve or reject with a reason.

Operations and tests:

- Test approval, rejection, expiry, duplicate transaction IDs, resubmission, repeated vendor actions, and unauthorized vendor actions.
- Test expiry-versus-approval races and simultaneous reservation of the final seat.
- Add structured logs for booking reference, masked transaction reference, actor, and state transition without exposing customer payment details unnecessarily.

Exit criteria:

- A customer can reserve available seats, see the exact external-payment instructions, and submit one transaction reference before the hold expires.
- Only the owning vendor can approve or reject that submission, and every decision records actor and time.
- Rejected/expired submissions restore seats exactly once; duplicate transaction IDs and repeated actions cannot duplicate bookings, emails, or seat changes.
- Receipts and customer/vendor lists show the same immutable amount and verification status.

### Phase 3 — Customer Account and Credential Management

Backend:

- Add authenticated customer profile read/update support for name, phone, avatar, and address fields with ownership enforcement.
- Repair password-request token creation, hashing/storage, expiry, one-time use, and email delivery.
- Apply password validation to reset/change endpoints and revoke sessions/tokens as appropriate after a password change.
- Avoid account enumeration in password-request responses.

Frontend:

- Build the `/profile` page already referenced by the header.
- Add profile editing, avatar upload, validation, and saved/error feedback.
- Build the customer reset-password page using email/token query parameters.
- Add authenticated change-password UI.
- Add navigation to booking history and booking receipts.

Admin:

- Wire the existing forget/reset-password forms to the API or remove admin-specific duplicates in favor of the shared reset link.
- Wire “Send Password Reset Link” actions and report success/failure accurately.
- Add authenticated change-password UI for staff.

Exit criteria:

- A customer can update only their own profile.
- A reset link expires, is single-use, and produces a generic request response.
- Password reset/change integration tests pass for customer and admin surfaces.

### Phase 4 — Vendor Profile and Booking Operations

- Add an edit form backed by `PATCH /vendors/{id}/` for store name, description, contact details, address/social fields, and logo.
- Refresh the vendor store and `/me` data after save so the sidebar updates immediately.
- Add booking search/filtering by event, date, customer, and status.
- Add booking detail/export only if required by operations; protect customer personal data.
- Make earnings use confirmed vendor-verified booking snapshots, not pending submissions or current event prices.
- Label the metric accurately (for example, “verified booking value”) because Travelomo cannot prove bank settlement or off-platform refunds.

Exit criteria:

- Vendors can update only their own organization data.
- Booking totals and dashboard verified-booking values reconcile against approved manual payment submissions for a controlled test dataset.

### Phase 5 — Discovery and Public Event Experience

- Replace the placeholder `/events` page with a paginated event grid.
- Wire keyword/location, date range, guest count, effective price, and availability filters to URL query parameters and the API.
- Make the home search form navigate to `/events` with the same canonical parameters.
- Support clearing filters, empty results, back/forward navigation, loading skeletons, and recoverable errors.
- Validate public event visibility rules and hide events that are archived, unavailable, cancelled, or no longer bookable as defined by product policy.
- Add frontend tests for query serialization and backend tests for every filter combination that relies on calculated price/availability.

Exit criteria:

- A shared URL reproduces the same search result.
- Home and events-page searches use one parameter contract.
- Event visibility and guest-capacity filters match backend booking eligibility.

### Phase 6 — Admin Completion

- Complete admin event detail with vendor, pricing, capacity, dates, status, archive state, and booking summary.
- Add staff update API/serializer permissions and the referenced edit modal.
- Add vendor deletion only after defining hard-delete versus deactivate/soft-delete behavior and impact on events, bookings, manual payment submissions, and audit history.
- Prefer deactivation when financial or booking history exists.
- Add admin coverage for permission boundaries, error states, and destructive confirmations.

Exit criteria:

- Admin detail links resolve to the correct records.
- Only superusers can make privileged staff changes.
- Vendor removal cannot erase required booking/payment-verification history accidentally.

### Phase 7 — Notifications and Future Customer Features

Implement these as separate vertical slices after the booking/manual-verification foundation is stable:

1. Event reminders using Celery Beat, per-booking deduplication, timezone-aware scheduling, and notification preferences.
2. In-app notifications with read/unread state, pagination, and links to the related booking/event.
3. Reviews/ratings restricted to eligible completed bookings, with moderation and aggregate ratings.
4. Wishlist/saved events with idempotent add/remove and a customer page.

Booking history itself belongs in the core release and is not deferred to this phase because it is already partially implemented and is required for receipts/cancellation.

## 6. Cross-Cutting Work

### API and Security

- Publish the generated OpenAPI schema and keep frontend types/contracts aligned.
- Test all role boundaries: anonymous, customer, vendor owner, another vendor, staff, and superuser.
- Rate-limit sensitive authentication and booking-submission endpoints at the application or gateway layer.
- Validate uploads and set size/type limits for avatars, logos, and event images.
- Store timestamps in UTC and convert only at presentation boundaries.

### Reliability and Observability

- Add correlation identifiers for booking and manual-verification workflows.
- Track failed Celery tasks, overdue verification requests, duplicate transaction-ID attempts, invalid state transitions, negative/over-capacity seat counts, and reservation-expiry backlog.
- Provide a vendor/admin reconciliation report for pending, verified, rejected, expired, and cancelled bookings.
- Ensure scheduled tasks are declared in deployable Celery Beat configuration rather than relying on a local schedule database file.

### Testing Strategy

- Backend unit tests: serializers, permissions, state transitions, transaction-ID normalization/reuse, totals, cancellation rules, filters, and email tasks.
- Backend transaction tests: overselling, duplicate cancellation, expiry versus approval races, and repeated vendor actions using a database with real locking semantics.
- Frontend component tests: forms, errors, disabled/loading states, filter serialization, and state badges.
- Admin tests: permissions, details, mutations, and confirmation behavior.
- End-to-end tests: register/login, discover, reserve seats, submit payment reference, vendor verify, receipt, cancel, reconcile, and admin inspect.

### Release Controls

- Apply additive migrations before code that requires the new fields; backfill snapshots before enforcing non-null constraints.
- Pilot manual verification with a small vendor cohort before general availability.
- Document rollback behavior for migrations and reservations/verification requests already in flight.
- Back up the database and test restoration before the manual-payment release.
- Update `FEATURES.md`, `USER-FLOW.md`, API docs, and operational runbooks at each phase exit.

## 7. Recommended Release Boundaries

### Release A — Reliable booking without online payment

Phase 1 plus the customer booking-history portions of Phase 3. This provides a tested booking/cancellation baseline and corrects status drift.

### Release B — Manually verified booking MVP

Phases 0 and 2, with external payment instructions, transaction-ID submission, vendor approval/rejection, expiry, customer status visibility, and reconciliation reporting. No payment gateway is in scope.

### Release C — Account and operations completion

Phases 3, 4, 5, and 6. This completes customer/vendor self-service, discovery, and admin workflows.

### Release D — Engagement features

Phase 7, delivered one feature at a time with its own acceptance criteria and analytics.

## 8. Definition of Done

A feature may be marked **Done** in `FEATURES.md` only when:

- Backend and applicable frontend/admin paths are implemented with no placeholder behavior.
- Authorization and validation failures are covered.
- Automated tests cover the primary path and important edge cases.
- Production builds and project checks pass.
- Migrations and environment/config changes are documented.
- Loading, empty, success, and error states are usable.
- Logs contain enough identifiers to investigate failures without exposing secrets.
- User-facing and API documentation match the shipped behavior.

Use `TODO.md` as the execution checklist for this plan.
