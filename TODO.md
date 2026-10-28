# Travelomo TODO

This checklist executes `IMPLEMENTATION_PLAN.md`. Keep IDs stable in issues and pull requests. Check an item only after its acceptance evidence exists; file presence alone is not completion.

Priority legend:

- **P0** — release/security/data-integrity blocker
- **P1** — core workflow completion
- **P2** — operational completeness or important UX
- **P3** — future enhancement

## 0. Decisions and Baseline

- [x] **DEC-001 · P0** Define which external payment methods/channels vendors can configure and the instructions customers must see. — `DECISIONS.md`; `VendorPaymentMethod.channel`
- [x] **DEC-002 · P0** Define separate deadlines for customer transaction-ID submission and vendor verification, plus timeout behavior. — `DECISIONS.md`; 20 min / 24 h capped at `Event.starts_at`; `DeadlineTests`
- [x] **DEC-003 · P0** Define booking status transitions and whether repeat bookings for the same customer/event are allowed. — `DECISIONS.md`; one unfinished booking per customer/event; `OneUnfinishedBookingTests`
- [x] **DEC-004 · P0** Define cancellation, off-platform refund communication/recording, resubmission, and admin-override rules. — `DECISIONS.md`; rejection is final, refunds off-platform, admin view-only; `ReadOnlyBookingAdminTests`
- [ ] **DEC-005 · P0** Define whether the dashboard metric is “verified booking value” or another manually reconciled amount. — default proposed in `DECISIONS.md`: confirmed-booking snapshots; needs owner confirmation
- [ ] **DEC-006 · P1** Confirm receipt/invoice fields, supported currency display, timezone, and legal/tax requirements. — fields/BDT/Asia/Dhaka proposed in `DECISIONS.md`; legal/tax review open
- [x] **DEC-007 · P0** Define transaction-ID normalization and uniqueness scope, including whether payment channel is required. — `DECISIONS.md`; unique per channel among pending/verified; `TransactionIdTests`
- [x] **BASE-001 · P0** Run and record current backend tests, frontend build, and admin test/build results. — recorded in `BASELINE.md`
- [x] **BASE-002 · P0** Fix the missing `Button` import on the public event-detail page. — import added in `37bfa24`; `next build` passes (`BASELINE.md`)
- [ ] **BASE-003 · P1** Correct `FEATURES.md` status entries using verified behavior from the source audit.
- [x] **BASE-004 · P1** Define and document canonical pagination and API error response shapes. — `API_CONTRACT.md`
- [ ] **BASE-005 · P1** Generate/validate the OpenAPI schema and identify contract mismatches in both clients.

## 1. Booking Integrity

- [x] **BOOK-001 · P0** Add a customer-only booking permission and tests for every role. — `IsCustomer`/`IsVendor` on views; service raises 403; role matrix in `event/tests/test_api.py`
- [x] **BOOK-002 · P0** Reject bookings for non-bookable event status, past/start-date policy, archived events, and invalid seat counts. — `reserve_booking` checks; `ReservationEligibilityTests`
- [x] **BOOK-003 · P0** Extract booking creation into an atomic domain/service function. — `event/services.py:reserve_booking`
- [x] **BOOK-004 · P0** Prevent overselling when concurrent customers request the final seats. — event row lock + conditional decrement; `test_concurrency.py`
- [x] **BOOK-005 · P0** Extract cancellation into an atomic domain/service function. — `event/services.py:cancel_booking`
- [x] **BOOK-006 · P0** Prevent repeated or concurrent cancellation from restoring seats twice. — booking row lock + status check + `seats_released_at`; `CancellationTests`, `test_concurrency.py`
- [x] **BOOK-007 · P0** Replace invalid/inconsistent exception handling with stable DRF validation responses. — `utils/exceptions.py` handler, `BusinessRuleError`/`Conflict`; codes in `API_CONTRACT.md` §2.6
- [ ] **BOOK-008 · P0** Add immutable unit price, seat count, subtotal/total, and currency snapshots to bookings.
- [ ] **BOOK-009 · P0** Backfill existing booking snapshots and add database constraints/indexes.
- [ ] **BOOK-010 · P1** Add a support-friendly unique booking reference.
- [ ] **BOOK-011 · P1** Add booking detail/receipt API output with a safely masked transaction reference and verification audit data appropriate to the viewer.
- [x] **BOOK-012 · P1** Verify customer and vendor booking lists use the agreed pagination contract. — `utils/pagination.py` (max 100), `-created_at, -id` ordering; `BookingPaginationTests`
- [ ] **BOOK-013 · P1** Add vendor booking filters for event, customer, date, and status.
- [x] **BOOK-014 · P0** Add tests for booking, cancellation deadline, repeated cancellation, sold-out state, and price snapshots. — `event/tests/test_services.py`
- [x] **BOOK-015 · P0** Add database-backed concurrency tests using an engine with production-equivalent locking. — `event/tests/test_concurrency.py` (PostgreSQL, threaded)

## 2. Booking User Experience

- [x] **BUI-001 · P0** Preserve the event return URL through unauthenticated login. — `lib/redirect.ts` (safe `callbackUrl`), used by the sidebar, middleware and `LoginForm`
- [x] **BUI-002 · P0** Display booking API validation/network errors in the dialog. — inline errors via `ApiError` + `silent` fetcher option
- [x] **BUI-003 · P0** Prevent duplicate submits and handle zero/changed availability safely. — `useSubmitOnce`, live seat count, seat validation
- [x] **BUI-004 · P1** Refetch event availability and booking queries after booking/cancellation. — `useRefreshBookingData` (bookings, event availability, `router.refresh()`)
- [x] **BUI-005 · P1** Add an explicit cancellation confirmation dialog and error state. — `components/bookings/CancelBookingDialog.tsx`
- [x] **BUI-006 · P1** Complete loading, empty, error, confirmed, cancelled, sold-out, and non-cancellable states. — sidebar blocked/sold-out states; My Bookings non-cancellable note and Load more
- [ ] **BUI-007 · P1** Add booking detail/receipt page and link each history item to it.
- [ ] **BUI-008 · P1** Make vendor bookings responsive and add pagination/filter controls.
- [x] **BUI-009 · P1** Add component/integration tests for booking and cancellation UIs. — `frontend/__tests__/` (vitest, 54 tests)

## 3. Manual Payment Verification

- [x] **PAY-001 · P0** Add booking statuses for awaiting payment reference, pending verification, confirmed, payment rejected, expired, and cancelled as required by DEC-003/004. — `SeatBooking.BOOKING_STATUS_CHOICES` per DEC-003/004
- [x] **PAY-002 · P0** Add `ManualPaymentSubmission` with channel, normalized transaction ID, amount/currency data, status, verifier, timestamps, and rejection reason. — channel/amount/currency snapshots, statuses incl. withdrawn/expired; migrations `event/0016`–`0017`
- [x] **PAY-003 · P0** Add transaction-ID normalization and reuse protection with safe conflict responses. — `unique_live_transaction_per_channel`; safe `transaction_id` field error; `TransactionIdTests`
- [ ] **PAY-004 · P0** Add atomic reservation creation that snapshots the server-calculated amount, holds seats, and returns a submission deadline.
- [ ] **PAY-005 · P0** Add vendor-owned payment instructions/methods and return them with the customer's reservation.
- [ ] **PAY-006 · P0** Add an owner-only endpoint to submit channel plus transaction ID for an unexpired reservation and move it to pending verification.
- [ ] **PAY-007 · P0** Add owning-vendor-only approve/reject endpoints with audited actor and timestamp.
- [ ] **PAY-008 · P0** Add submission/verification expiry processing that restores seats exactly once.
- [ ] **PAY-009 · P0** Prevent repeated, unauthorized, late, or invalid approval/rejection transitions.
- [ ] **PAY-010 · P1** Build the two-step booking UI: reserve seats, then show amount/instructions/deadline and collect channel plus transaction ID.
- [ ] **PAY-011 · P1** Add awaiting-reference, pending, confirmed, rejected, expired, and allowed-resubmission states to customer and vendor UIs.
- [ ] **PAY-012 · P1** Add vendor review actions showing expected amount and transaction reference, with rejection reason input.
- [ ] **PAY-013 · P0** Test reservation timeout, late submission, approval, rejection, duplicate transaction IDs, verification timeout, resubmission, and unauthorized access.
- [ ] **PAY-014 · P0** Test expiry/approval races and simultaneous final-seat reservations.
- [ ] **PAY-015 · P1** Add structured transition logs with booking reference, masked transaction reference, actor, and reason.
- [ ] **PAY-016 · P1** Add vendor/admin reconciliation reports for pending, verified, rejected, expired, and cancelled bookings.

## 4. Emails and Notifications

- [x] **MAIL-001 · P0** Test the existing booking confirmation template/task and its missing-booking behavior. — `notification/tests/test_booking_emails.py`
- [x] **MAIL-002 · P0** Add retry/error handling and monitoring for mail delivery failures. — `EmailDelivery` + `deliver_email` retries, admin Resend, stale sweep, `check_email_deliveries`
- [ ] **MAIL-003 · P0** Send a pending-verification notice on submission and booking confirmation only after vendor approval.
- [ ] **MAIL-004 · P1** Include booking reference, immutable totals, event details, and receipt link in the confirmation.
- [ ] **MAIL-005 · P1** Send rejection/expiry notices and deduplicate all notices across repeated state-transition requests.
- [ ] **MAIL-006 · P3** Add timezone-aware event reminders with per-booking deduplication and preferences.
- [ ] **NOTIF-001 · P3** Design in-app notification model, pagination, read/unread state, and related-object links.
- [ ] **NOTIF-002 · P3** Build customer/vendor notification UI after NOTIF-001.

## 5. Authentication and Account Management

- [ ] **AUTH-001 · P0** Repair password-request token generation/storage to use one hashed, expiring token strategy.
- [ ] **AUTH-002 · P0** Send the reset email and return a generic response that does not reveal account existence.
- [ ] **AUTH-003 · P0** Make reset tokens single-use and enforce expiry.
- [ ] **AUTH-004 · P0** Apply Django password validation to reset and change-password endpoints.
- [ ] **AUTH-005 · P1** Define and implement session/token revocation after password reset/change.
- [ ] **AUTH-006 · P1** Build and wire the Next.js reset-password page.
- [ ] **AUTH-007 · P1** Build authenticated customer/vendor change-password UI.
- [ ] **AUTH-008 · P1** Wire or consolidate the admin forget/reset-password screens.
- [ ] **AUTH-009 · P1** Wire admin “Send Password Reset Link” actions with correct success/error feedback.
- [ ] **AUTH-010 · P1** Add admin staff change-password UI.
- [ ] **AUTH-011 · P0** Add API/integration tests for request, invalid/expired/used token, reset, and change-password flows.
- [ ] **AUTH-012 · P2** Add rate limiting for login, password recovery, and booking submission at the app or gateway layer.

## 6. Customer Profile

- [ ] **CUST-001 · P1** Add authenticated own-profile GET/PATCH API and ownership tests.
- [ ] **CUST-002 · P1** Define writable name, phone, avatar, and address fields with validation.
- [ ] **CUST-003 · P1** Build the `/profile` page already linked from the frontend header.
- [ ] **CUST-004 · P1** Add profile edit, avatar upload, loading, saved, and error states.
- [ ] **CUST-005 · P1** Link profile navigation to booking history and receipts.
- [ ] **CUST-006 · P1** Add frontend and backend profile tests, including cross-user access denial.

## 7. Vendor Profile and Financial Dashboard

- [ ] **VEND-001 · P1** Add the vendor profile update mutation to `vendorServices`.
- [ ] **VEND-002 · P1** Build vendor edit form for store identity, description, contacts, address/social fields, and logo.
- [ ] **VEND-003 · P1** Refresh vendor store and `/me` data after updates.
- [ ] **VEND-004 · P0** Verify vendors cannot update another vendor or approval/audit fields.
- [ ] **EARN-001 · P0** Calculate the dashboard value from immutable vendor-verified booking snapshots, excluding pending/rejected/expired bookings.
- [ ] **EARN-002 · P1** Label the metric accurately (for example, “verified booking value”) because Travelomo cannot confirm bank settlement or off-platform refunds.
- [ ] **EARN-003 · P1** Reconcile dashboard values against controlled manual-payment submission fixtures.

## 8. Event Discovery

- [x] **EVT-001 · P0** Fix effective-price filtering so it uses database expressions/annotations instead of the `price` Python property. — `EventQuerySet.with_effective_price()`; `EffectivePriceFilterTests`
- [ ] **EVT-002 · P1** Define canonical query parameters for keyword/location, dates, guests, price, availability, and pagination.
- [ ] **EVT-003 · P1** Replace the placeholder public `/events` page with a paginated event grid.
- [ ] **EVT-004 · P1** Add events-page filter controls synchronized to the URL.
- [ ] **EVT-005 · P1** Wire the home search form to `/events` using the same parameters.
- [ ] **EVT-006 · P1** Add clear-filters, empty, loading, error, and back/forward navigation behavior.
- [x] **EVT-007 · P0** Test public visibility for archived, cancelled, completed, unpublished, sold-out, and date-ineligible events per product rules. — `publicly_listed()`/`publicly_visible()`; `PublicVisibilityTests` (also fixed the `GET /events/` 500)
- [ ] **EVT-008 · P1** Add backend filter tests and frontend query-serialization tests.

## 9. Admin Panel

- [x] **ADMIN-001 · P0** Fix the admin event-detail API query, which currently targets the vendor endpoint. — new `GET /events/admin-event/<id>/`; `admin/src/__test__/event/eventDetails.test.jsx`
- [x] **ADMIN-002 · P1** Replace the event detail placeholder with event, vendor, dates, price, capacity, status, archive, and booking summary data. — `AdminEventDetailSerializer.booking_summary`; `AdminEventDetailTests`
- [ ] **ADMIN-003 · P1** Add staff update serializer/API with superuser permission rules.
- [ ] **ADMIN-004 · P1** Build and wire the referenced edit-staff modal.
- [ ] **ADMIN-005 · P2** Decide vendor hard-delete versus deactivate/soft-delete behavior and document data-retention impact.
- [ ] **ADMIN-006 · P2** Implement the approved vendor removal/deactivation action with confirmation and audit protection.
- [ ] **ADMIN-007 · P1** Add tests for event detail, staff edit permissions, reset-link action, and vendor removal behavior.

## 10. Future Customer Features

- [ ] **REVIEW-001 · P3** Define review eligibility, moderation, edit/delete policy, and aggregate-rating rules.
- [ ] **REVIEW-002 · P3** Add review API restricted to eligible completed bookings.
- [ ] **REVIEW-003 · P3** Add event review list/form and vendor/admin moderation views as required.
- [ ] **WISH-001 · P3** Add idempotent saved-event model and add/remove/list API.
- [ ] **WISH-002 · P3** Add saved-event controls and wishlist page.

## 11. Quality, Operations, and Release

- [ ] **QA-001 · P0** Add backend coverage for permissions, booking/manual-verification transitions, transaction-ID reuse, totals, filters, emails, and cancellation.
- [ ] **QA-002 · P1** Add frontend tests for account, discovery, transaction submission, verification status, receipt, and cancellation states.
- [ ] **QA-003 · P1** Add admin tests for completed workflows and privilege boundaries.
- [ ] **QA-004 · P0** Add end-to-end happy path: discover → authenticate → reserve → pay externally → submit transaction ID → vendor approve → receipt → admin view.
- [ ] **QA-005 · P0** Add end-to-end failure paths for sold-out, rejected/expired verification, duplicate transaction ID, unauthorized approval, and cancellation.
- [ ] **OPS-001 · P0** Add alerts/metrics for failed Celery tasks, overdue verification requests, duplicate transaction-ID attempts, invalid transitions, and invalid seat counts.
- [ ] **OPS-002 · P1** Move periodic-task declarations into deployable Celery Beat configuration.
- [ ] **OPS-003 · P0** Plan additive migrations and backfill before making financial snapshot fields non-null.
- [ ] **OPS-004 · P0** Test database backup and restore before production manual-verification launch.
- [ ] **OPS-005 · P0** Document rollback behavior for migrations and in-flight reservations/verification requests.
- [ ] **REL-001 · P0** Pass backend test suite and schema validation.
- [ ] **REL-002 · P0** Pass Next.js production build and frontend tests.
- [ ] **REL-003 · P0** Pass admin lint, tests, and production build.
- [ ] **REL-004 · P0** Pilot transaction-ID verification and reconciliation with a small vendor cohort before general rollout.
- [ ] **REL-005 · P1** Update `FEATURES.md`, `USER-FLOW.md`, API docs, `.env.example`, and runbooks at each release boundary.

## Suggested First Execution Batch

Start with this bounded batch before introducing manual-payment migrations:

- [x] `BASE-001`, `BASE-002`, `BASE-004`
- [x] `BOOK-001` through `BOOK-007`, `BOOK-012`, `BOOK-014`, `BOOK-015`
- [x] `BUI-001` through `BUI-006`, `BUI-009`
- [x] `MAIL-001`, `MAIL-002`
- [x] `EVT-001`, `EVT-007`
- [x] `ADMIN-001`, `ADMIN-002`
- [ ] Then complete `DEC-001` through `DEC-007` and begin the manual-verification data model.
