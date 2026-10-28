# Travelomo API Contract: Pagination and Errors

Defined for `BASE-004`. This is the canonical shape that the Django API returns and that both clients (Next.js `frontend/`, Vite `admin/`) consume. New endpoints must follow it. Existing code that deviates is listed under [Conformance gaps](#conformance-gaps), with the TODO item that fixes each gap.

The shapes below are DRF's defaults (`LimitOffsetPagination`, the standard exception handler). Both clients already parse them, so the contract does not introduce a new envelope.

---

## 1. Pagination

### 1.1 Which endpoints paginate

Any `GET` endpoint that returns a collection that can grow without bound must paginate. A collection that is bounded per owner and small by design may return a bare JSON array. That exception must be named here.

| Endpoint | Paginated |
|---|---|
| `GET /api/v1/events/` | Yes |
| `GET /api/v1/events/vendor-event/` | Yes |
| `GET /api/v1/events/admin-event/` | Yes |
| `GET /api/v1/bookings/my/` | Yes |
| `GET /api/v1/bookings/vendor/` | Yes |
| `GET /api/v1/vendors/` | Yes |
| `GET /api/v1/users/` | Yes |
| `GET /api/v1/staffs/` | Yes |
| `GET /api/v1/vendors/payment-methods/` | **No**: bare array (a vendor's own payment methods; bounded) |
| `GET /api/v1/stats/...` | Not a list: aggregate objects |

### 1.2 Request

| Query param | Type | Default | Rules |
|---|---|---|---|
| `limit` | positive integer | `PAGE_SIZE` env (`20`) | Page size. Missing, non-numeric, or `≤ 0` falls back to the default. **Maximum `100`.** Larger values are clamped. |
| `offset` | integer ≥ 0 | `0` | Number of items to skip. Missing or invalid becomes `0`. |

Filters (for example `search`, `status`, date ranges) combine with `limit`/`offset`. Clients reset `offset` to `0` whenever a filter changes.

### 1.3 Response: `200 OK`

```json
{
  "count": 57,
  "next": "https://api.example.com/api/v1/events/?limit=20&offset=40",
  "previous": "https://api.example.com/api/v1/events/?limit=20&offset=0",
  "results": [ { "...": "item" } ]
}
```

| Field | Type | Meaning |
|---|---|---|
| `count` | integer | Total items matching the **filters**, across all pages |
| `next` | absolute URL or `null` | Next page. `null` on the last page |
| `previous` | absolute URL or `null` | Previous page. `null` on the first page |
| `results` | array | Items on this page, in the endpoint's documented order |

Rules:

- An `offset` past the end returns `200` with `"results": []` and the true `count`. It is not a `404`.
- `next`/`previous` are opaque. Clients may follow them or compute pages from `limit`/`offset`/`count`, but must not parse them for anything else.
- **Ordering must be deterministic.** The default list order is newest first, `-created_at`, with a unique tiebreaker (`-id`) so offset pages cannot skip or repeat rows when timestamps tie.
- Each item in `results` has the same shape as that endpoint's item serializer. The envelope never changes per endpoint.

### 1.4 Client types

Next.js (`frontend/types/common.ts`):

```ts
export interface GenericListResponse<T> {
  count: number;
  results: T[];
  next: string | null;
  previous: string | null;
}
export interface GenericListParams { limit?: number; offset?: number; search?: string; }
```

Admin (`admin/src/config/index.js`): `initialParams = { limit: RESULT_PER_PAGE, offset: 0 }`. Use `count` as the Ant Design table's `pagination.total`.

---

## 2. Errors

Every error from `/api/v1/` is a JSON object with an HTTP 4xx/5xx status. There are two shapes, and the client can tell them apart by whether a `detail` key is present.

### 2.1 Shape A: general error

Use this for errors that are not about a specific input field: authentication, permissions, not-found, method, throttling, conflicts, and business-rule rejections that apply to the request as a whole.

```json
{ "detail": "This event is not open for booking.", "code": "event_not_bookable" }
```

| Field | Required | Meaning |
|---|---|---|
| `detail` | Yes | A message that can be shown to the end user as is. A single string, never a list. |
| `code` | Optional | A stable, machine-readable `snake_case` identifier that clients may branch on. The message text may change. The code may not. |

SimpleJWT token errors also include a `messages` array. Clients ignore it and use `detail`/`code` (`token_not_valid`).

### 2.2 Shape B: validation error (`400` only)

Use this for errors about the request body or query that the user can fix field by field.

```json
{
  "seat_number": ["Only 2 seats are available."],
  "transaction_id": ["This transaction ID has already been submitted."],
  "non_field_errors": ["Choose a payment method that is still active."]
}
```

- Each key is a request field name, or `non_field_errors` for cross-field problems.
- **Each value is always an array of strings.** A nested serializer nests the same structure: `{ "address": { "city": ["This field is required."] } }`.
- Never mix `detail` into a Shape B body. If one error applies to the whole request, use Shape A instead.

In backend code, raise `serializers.ValidationError({"field": ["message"]})` or let serializer validation do it. To reject a whole request, raise a DRF exception that yields Shape A (`ValidationError` only for `400`, `PermissionDenied`, `NotFound`, or a `409` `APIException` subclass), passing `detail` as a **string** argument, not wrapped in a dict.

### 2.3 Status codes

| Status | When | Shape |
|---|---|---|
| `400` | Invalid input, or a business rule rejects the request | B for field errors, A for whole-request rules |
| `401` | Missing, invalid, or expired credentials | A |
| `403` | Authenticated but the wrong role (for example, a vendor calling a customer-only endpoint) | A |
| `404` | Resource does not exist **or is not visible to the caller**. Use 404, not 403, for another user's or vendor's object so IDs cannot be probed. | A |
| `405` | Method not allowed | A |
| `409` | Request conflicts with current state: already reviewed, already cancelled, duplicate transaction ID (per `DEC-007`) | A, with `code` |
| `429` | Throttled (`AUTH-012`) | A |
| `500` | Unhandled server error. The body is `{"detail": "Something went wrong. Please try again.", "code": "server_error"}` and must not include internals. | A |

### 2.4 Action endpoints with no resource body

Endpoints that perform an action and have no resource to return (cancel, logout, send-reset-link) respond `200` with `{ "detail": "Booking cancelled successfully." }`. Endpoints with no body at all use `204`. The Next.js `fetcher` already handles `204`.

### 2.5 Enforcement

`utils.exceptions.api_exception_handler` (set as DRF's `EXCEPTION_HANDLER`) enforces both shapes for every endpoint:

- It wraps string field values in lists and turns a bare-string `ValidationError` into `non_field_errors`.
- It converts Django's `ValidationError` into a `400` instead of letting it become a `500`.
- It adds `code` to general errors.
- Outside `DEBUG`, it returns unhandled exceptions as a JSON `500` and logs them. With `DEBUG` on, Django's debug page is kept.

For whole-request rules, raise `utils.exceptions.BusinessRuleError` (`400`) or `utils.exceptions.Conflict` (`409`) with a `code`.

### 2.6 Booking error codes

| Endpoint | Status | `code` | Meaning |
|---|---|---|---|
| `POST /bookings/` | 400 | `event_not_bookable` | Event is not `published`, or it is archived |
| | 400 | `booking_closed` | Event starts today or has already started |
| | 400 | `payment_unavailable` | Vendor has no active payment method |
| | 400 | `sold_out` | No seats left, including when the last seats were just taken |
| | 409 | `unfinished_booking_exists` | This customer already has a reservation for the event that is awaiting a payment reference or pending verification (`DEC-003`). A hold whose deadline has passed is expired instead of blocking |
| | 400 | — (field `seat_number`) | Fewer than 1 seat, more than 100, or more than are available |
| `POST /bookings/{id}/payment-reference/` | 404 | `not_found` | Not this customer's booking |
| | 409 | `invalid_booking_state` | Booking is no longer awaiting a payment reference |
| | 409 | `booking_expired` | Seat hold expired. The booking is now `expired` and its seats are released |
| | 400 | — (field `transaction_id` / `payment_method`) | ID too short; already backs a pending or verified submission on the same channel at any vendor (`DEC-007`); or method inactive |
| `POST /bookings/{id}/cancel/` | 404 | `not_found` | Not this customer's booking |
| | 409 | `already_cancelled` | Booking was already cancelled. Seats are not restored again |
| | 409 | `invalid_booking_state` | Booking is `expired` or `payment_rejected` |
| | 400 | `cancellation_closed` | Confirmed booking is past its cancellation deadline, or the event allows no cancellation |
| `POST /bookings/vendor/{id}/review/` | 404 | `not_found` | Booking is not for one of this vendor's events |
| | 409 | `invalid_booking_state` | Already reviewed, or no longer pending |
| | 409 | `booking_expired` | Verification window expired. The booking is now `expired` and its seats are released |
| Customer-only endpoints | 403 | `permission_denied` | Caller is a vendor or admin |
| Vendor-only endpoints | 403 | `permission_denied` | Caller is a customer or admin |
| All booking endpoints | 401 | `not_authenticated` | No valid session |

A duplicate transaction ID stays a `400` field error (`DEC-007`). It is a problem with what the customer typed, so clients show it under the field. The message never names the other booking or vendor.

### 2.7 Client handling

Both `frontend/utils/extractErrorMessages.ts` and `admin/src/utils/extractErrorMessage.js` should resolve the message in this order:

1. `detail` (string) → show it.
2. Otherwise treat the body as Shape B. For each key, take the string array (or a single string, accepted during migration). Show `non_field_errors` messages as they are, and other fields as `"<Field label>: <message>"`. Forms should show each field's messages next to that field instead.
3. If the body is not JSON or is empty, fall back to a generic message for the HTTP status.

The Next.js client implements this. `lib/fetcher.ts` throws an `ApiError` (`lib/apiError.ts`) with `status`, `code` and `fieldErrors`, and `status` is `0` for network failures. Pass `silent: true` when the UI shows the error inline instead of in a toast; the customer booking calls do this. The admin extractor has not been updated yet.

---

## Conformance gaps

Found in the source audit on 2026-10-28 (commit `d8751b5`). Each gap stays open until the linked item ships with tests.

| # | Gap | Where | Fix in | Status |
|---|---|---|---|---|
| 1 | Field errors were raised with **string** values, for example `{"seat_number": "Only 2 seats are available."}`. Both clients' extractors only read array values, so **the user saw an empty error message.** | `backend/event/services.py`; both extractor files | `BOOK-007`, `BUI-002` | **Fixed** on the server and in the Next.js extractor, which accepts string values. The admin extractor still reads only lists, which is harmless now that the server always sends lists. |
| 2 | Whole-request errors were wrapped as `ValidationError({"detail": ...})`, so wrong role and not-found both returned `400` instead of `403`/`404`. | `backend/event/services.py` | `BOOK-001`, `BOOK-007` | **Fixed** |
| 3 | "Already reviewed/cancelled" state conflicts returned `400`, not `409`. | `backend/event/services.py` | `BOOK-007`, `PAY-009` | **Fixed** |
| 4 | Auth views use `{"message": ...}` for both errors and success. `ActivateAccountView` catches all exceptions and returns `500 {"message": "An error occurred"}`. | `backend/authentication/views.py:120-163` | `AUTH-001`–`AUTH-004` | Open |
| 5 | `ChangePasswordView` raises Django's `django.core.exceptions.ValidationError`, so a wrong old password returned an **HTML 500**. | `backend/authentication/views.py:228` | `AUTH-004` | **Fixed by the handler**: now `400 {"non_field_errors": ["Wrong Password"]}`. The view still needs `AUTH-004`. |
| 6 | `ForgetPasswordView` returns `404 {"message": "User not found"}`, which reveals whether an account exists. | `backend/authentication/views.py:182` | `AUTH-002` | Open |
| 7 | `raise ValidationError("...")` with a bare string gave a top-level array, `["..."]`. | `backend/user/views.py:70` | `ADMIN-003` | **Fixed by the handler**: now `non_field_errors` |
| 8 | No `EXCEPTION_HANDLER` was configured, so unhandled exceptions produced Django's HTML 500 page. | `backend/core/settings.py` | `BOOK-007` | **Fixed** |
| 9 | `limit` had no maximum. | `backend/core/settings.py` | `BOOK-012` | **Fixed**: `utils.pagination.StandardLimitOffsetPagination`, max 100, applies to all lists |
| 10 | List ordering is `-created_at` with no unique tiebreaker. | Model `Meta.ordering`, `event/views.py` | `BOOK-012` | **Fixed for booking lists and the admin event list** (`-created_at, -id`). Still open for the public and vendor event lists, vendors, users and staff. |
| 11 | `AdminEventListView.ordering` is set, but no `OrderingFilter` is configured, so it has no effect. It falls back to `Event.Meta.ordering`. | `backend/event/views.py` | `ADMIN-002` | **Fixed**: the unused `ordering` attribute is gone and the queryset orders by `-created_at, -id`. |
| 12 | `GenericListResponse.next/previous` were typed `string`, but are `null` on the first and last pages. | `frontend/types/common.ts` | `BOOK-012` | **Fixed** |
| 13 | `getMyBookings`/`getVendorBookings` sent no `limit`/`offset`, so users only ever see the first 20 bookings. | `frontend/services/bookingService.ts` | `BOOK-012`, `BUI-006`, `BUI-008` | **Fixed for customers**: My Bookings pages with "Load more" (`BUI-006`). The vendor bookings page still requests only the first page (`BUI-008`). |
| 14 | `GET /events/` returned `500` for every caller except admins. It filtered on `is_deleted`, which migration `0009` removed, and read `request.user.role`, which anonymous users do not have. | `backend/event/views.py` | `EVT-007` | **Fixed**: public listing uses `Event.objects.publicly_listed()` |
| 15 | `start_price`/`end_price` filtered on `price`, a Python property, so any price filter returned `500`. | `backend/event/filters.py` | `EVT-001` | **Fixed**: filters use the database expression `Event.objects.with_effective_price()` |
| 16 | The admin event-detail query called `/vendors/<id>/`, so it returned a vendor or `404` instead of the event. | `admin/src/redux/event/eventApi.js` | `ADMIN-001` | **Fixed**: calls `GET /events/admin-event/<id>/` |
