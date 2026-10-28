# Travelomo Baseline — Test and Build Results

Recorded for `BASE-001` on 2026-10-28 against commit `d8751b5` (clean `main`). This is the reference point for later work: a regression is any result below that is worse after a change.

## Summary

| Component | Check | Result |
|---|---|---|
| Backend | `manage.py check` | Pass (1 warning) |
| Backend | `makemigrations --check` | Pass, no missing migrations |
| Backend | `manage.py test` | **Fail**: 6 passed, 2 errors (8 tests) |
| Backend | `spectacular --validate --fail-on-warn` | **Fail**: 31 errors (5 unique), 61 warnings (47 unique) |
| Frontend | `next build` | Pass (includes TypeScript check) |
| Frontend | `pnpm run lint` | **Not runnable**: script is broken on Next.js 16 |
| Admin | `yarn test` | Pass: 1 file, 1 test |
| Admin | `yarn lint` | Pass: 0 errors, 2 warnings |
| Admin | `yarn build` | Pass (1 chunk-size warning) |

## Environment

| Item | Version / setting |
|---|---|
| Python | 3.12.3, packages from `backend/requirements.txt` (Django 5.1.1, DRF 3.15.2) |
| Database | PostgreSQL 17 in a throwaway container (`docker-compose.yml` uses 16) |
| Node.js | 24.21.0 |
| Frontend packages | pnpm 9.15.9, `--frozen-lockfile` |
| Admin packages | yarn 1.22.22, `--frozen-lockfile` |
| Env files | None present. Backend values came from `backend/.env.example`, with DB/Redis hosts pointed at local test services. The frontend build ran without `.env.local`. |

## Backend

### Tests: 8 run, 2 errors

All tests are in `backend/event/tests.py` (`ManualPaymentBookingTests`). No other app has tests.

| Test | Result |
|---|---|
| `test_reservation_holds_seats_and_snapshots_price` | Pass |
| `test_vendor_account_cannot_reserve_customer_seats` | Pass |
| `test_reservation_requires_active_payment_instructions` | Pass |
| `test_customer_submits_transaction_for_verification` | Pass |
| `test_transaction_id_cannot_be_reused_for_same_method` | Pass |
| `test_owning_vendor_can_approve_payment` | **Error** |
| `test_rejection_releases_seats_exactly_once` | **Error** |
| `test_expiry_and_cancellation_release_seats` | Pass |

Both errors have the same cause, and it is a production bug rather than a test bug:

```
django.db.utils.NotSupportedError: FOR UPDATE cannot be applied to the nullable side of an outer join
  backend/event/services.py:211  review_payment()
```

`review_payment` calls `select_for_update().select_related("event", "user", "payment_submission")`. `payment_submission` is a reverse one-to-one, so it is joined with a LEFT OUTER JOIN, and PostgreSQL refuses to lock it. **Every vendor approve/reject request fails on PostgreSQL.** SQLite would hide this because it ignores `FOR UPDATE`. A likely fix is `select_for_update(of=("self",))`. It belongs to the booking-integrity work (`BOOK-003`/`PAY-007`).

### System check

One warning, `staticfiles.W004`: `backend/static` (listed in `STATICFILES_DIRS`) does not exist.

### OpenAPI schema validation

`spectacular --validate --fail-on-warn` fails. Generation errors affect these views: `ActivateAccountView`, `CancelBookingView`, `LogoutView`, `SendPasswordResetLinkView`, `VendorDetailView` (no serializer, or a `get_serializer_class` that fails without a request). The most common warnings:

- `CookieJWTAuthentication` has no `OpenApiAuthenticationExtension`, so authentication is missing from the schema.
- `get_queryset` uses `request.user` without guarding `swagger_fake_view`.
- `SerializerMethodField` methods have no type hints.
- The `status` enum name collides between models.

The full fix is tracked as `BASE-005`.

### Noise

`VendorEventListView.get_queryset` prints `FILTER PARAMS :=====>` on every request (`backend/event/views.py:145`).

## Frontend (Next.js)

### Build: pass

`next build` compiled and type-checked. It generated 15 static pages, and the rest render dynamically. The public event detail page builds, which confirms `BASE-002` (its `Button` import was added in `37bfa24`).

Warnings and findings:

- The installed Next.js is **16.2.2**, not 15 as `CLAUDE.md` states.
- Next.js warns that the `middleware` file convention is deprecated in favor of `proxy`.
- **The package manager is pnpm, not npm.** The only lockfile is `pnpm-lock.yaml`, but `CLAUDE.md` documents `npm run ...`.
- **pnpm ≥ 10 rejects the lockfile** (`ERR_PNPM_LOCKFILE_CONFIG_MISMATCH`). The lockfile records `overrides` for `@types/react`/`@types/react-dom` that `package.json` does not declare. pnpm 9 accepts it. `frontend/Dockerfile` runs `corepack enable pnpm` with no pinned version and `package.json` has no `packageManager` field, so a Docker build that resolves a newer pnpm will fail at install.

### Lint: not runnable

- `next lint` was removed in Next.js 16. The script fails with `Invalid project directory provided, no such directory: .../frontend/lint`.
- Running `eslint .` directly also fails. ESLint 9 requires a flat config (`eslint.config.mjs`), and the project only has `.eslintrc.json`.

Frontend tests: none exist, and there is no test script.

## Admin panel (Vite)

| Check | Result |
|---|---|
| `yarn test` | 1 file / 1 test passed (`src/__test__/auth/login.test.jsx`) |
| `yarn lint` | 0 errors, 2 `react-hooks/exhaustive-deps` warnings, in `src/hooks/useInfiniteScroll.js:20` and `src/hooks/useSearch.js:15` |
| `yarn build` | Built. Main JS chunk is 1,471.78 kB (475.82 kB gzip), above Vite's 500 kB warning limit |

Admin test coverage is limited to rendering the login form.

## Reproducing

```bash
# Backend: needs PostgreSQL. SQLite hides the FOR UPDATE failure above.
docker run -d --rm --name travelomo_baseline_pg -e POSTGRES_PASSWORD=baseline \
  -e POSTGRES_DB=travelomo -p 55433:5432 postgres:17
# Export the variables from backend/.env.example, with
# PG_HOST=127.0.0.1 PG_PORT=55433 PG_DB=travelomo PG_PASSWORD=baseline
cd backend && python manage.py check && python manage.py makemigrations --check --dry-run \
  && python manage.py test && python manage.py spectacular --validate --fail-on-warn --file /dev/null

# Frontend (pin pnpm 9 until the lockfile mismatch is fixed)
cd frontend && corepack pnpm@9.15.9 install --frozen-lockfile && corepack pnpm@9.15.9 run build

# Admin
cd admin && yarn install --frozen-lockfile && yarn test && yarn lint && yarn build
```
