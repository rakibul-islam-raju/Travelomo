# Travelomo - Feature Status

## About

Travelomo is a full-stack travel event management and booking platform. It connects **vendors** (travel organizers) who create and manage travel events with **customers** (travellers) who discover and book those events. An **admin panel** provides oversight for managing vendors, users, events, and staff.

The platform consists of three applications:
- **Frontend** (Next.js) - Public-facing site for browsing events and a vendor dashboard for event management
- **Admin Panel** (Vite + React) - Internal admin interface for vendor approvals, user management, and analytics
- **Backend** (Django REST Framework) - API server with JWT authentication, Celery for background tasks, and PostgreSQL database

---

## Legend

- **Done** - Fully implemented (backend + frontend/admin)
- **Partial** - Partially implemented (e.g. backend exists but UI incomplete, or UI exists but not wired up)
- **Not Done** - Not yet implemented

---

## Authentication & Account Management

| Feature | Backend | Frontend | Admin | Status |
|---------|---------|----------|-------|--------|
| Email/password login (JWT) | Done | Done | Done | **Done** |
| Customer registration | Done | Done | - | **Done** |
| Vendor registration | Done | Done | - | **Done** |
| Email account activation | Done | Done | - | **Done** |
| Forget password (request) | Done | Done | Partial (UI only) | **Partial** |
| Reset password (with token) | Done | Not Done | Partial (UI only) | **Partial** |
| Change password (authenticated) | Done | Not Done | Not Done | **Partial** |
| Token refresh | Done | Done | Done | **Done** |
| Logout | Done | Done | Done | **Done** |
| Get current user (`/me`) | Done | Done | Done | **Done** |
| Role-based route protection | Done | Done | Done | **Done** |

---

## Event Management

| Feature | Backend | Frontend (Vendor Dashboard) | Admin | Status |
|---------|---------|---------------------------|-------|--------|
| Create event | Done | Done | - | **Done** |
| Edit event | Done | Done | - | **Done** |
| Delete event | Done | Done | - | **Done** |
| Duplicate event (as draft) | Done | Done | - | **Done** |
| List vendor's events | Done | Done | - | **Done** |
| View event details (vendor) | Done | Done | - | **Done** |
| List all events (admin) | Done | - | Done | **Done** |
| View event details (admin) | Done | - | Partial (placeholder) | **Partial** |
| List published events (public) | Done | Done (home page) | - | **Done** |
| Public event detail page | Done | Done | - | **Done** |
| Event search & filtering | Done | Done | Done | **Done** |
| Featured events display | Done | Done | - | **Done** |
| Event status management | Done | Done | - | **Done** |
| Archive events | Done | - | Done (filter) | **Partial** |
| Auto-complete events (Celery) | Done | - | - | **Done** |
| Rich text event description | - | Done | - | **Done** |
| Event image upload | Done | Done | - | **Done** |

---

## Seat Booking / Ticketing

| Feature | Backend | Frontend | Admin | Status |
|---------|---------|----------|-------|--------|
| Seat booking model | Done | - | - | **Partial** |
| Book event (customer) | Not Done (model exists, no endpoint) | Not Done (button exists, not wired) | - | **Not Done** |
| View bookings (customer) | Not Done | Not Done | - | **Not Done** |
| View bookings (vendor) | Not Done | Not Done | - | **Not Done** |
| Booking confirmation / receipt | Not Done | Not Done | - | **Not Done** |
| Payment integration | Not Done | Not Done | - | **Not Done** |

---

## Vendor Management

| Feature | Backend | Frontend | Admin | Status |
|---------|---------|----------|-------|--------|
| Vendor profile creation | Done | Done (via registration) | - | **Done** |
| View own vendor profile | Done | Done (sidebar) | - | **Done** |
| Update vendor profile | Done | Not Done | - | **Partial** |
| List vendors (admin) | Done | - | Done | **Done** |
| View vendor detail (admin) | Done | - | Done | **Done** |
| Approve vendor (admin) | Done | - | Done | **Done** |
| Disable vendor (admin) | Done | - | Done | **Done** |
| Delete vendor (admin) | Done | - | Not Done | **Partial** |

---

## User Management (Admin)

| Feature | Backend | Admin | Status |
|---------|---------|-------|--------|
| List users | Done | Done | **Done** |
| View user detail | Done | Done | **Done** |
| Activate/deactivate user | Done | Done | **Done** |
| Send password reset link | Done | Done | **Done** |
| Filter by role/status | Done | Done | **Done** |

---

## Staff Management (Admin)

| Feature | Backend | Admin | Status |
|---------|---------|-------|--------|
| List staff | Done | Done | **Done** |
| Create staff | Done | Done | **Done** |
| View staff detail | Done | Done | **Done** |
| Edit staff | Not Done | Partial (referenced, not built) | **Not Done** |
| Activate/deactivate staff | Done | Done | **Done** |
| Superuser permission checks | Done | Done | **Done** |

---

## Analytics & Dashboard

| Feature | Backend | Frontend (Vendor) | Admin | Status |
|---------|---------|-------------------|-------|--------|
| Admin dashboard counts | Done | - | Done | **Done** |
| Vendor summary stats | Done | Done | - | **Done** |
| Registered travellers chart | Done | Done | - | **Done** |
| Event pie chart (by status) | Done | Done | - | **Done** |
| Pending vendor approvals widget | - | - | Done | **Done** |
| Total earnings calculation | Partial (returns 0.00) | Done (displays it) | - | **Partial** |

---

## Email / Notifications

| Feature | Backend | Status |
|---------|---------|--------|
| Account activation email | Done | **Done** |
| Password reset email | Done | **Done** |
| Staff welcome email | Done | **Done** |
| User deactivation notification | Done | **Done** |
| Booking confirmation email | Not Done | **Not Done** |
| Event reminder notifications | Not Done | **Not Done** |
| In-app notifications | Not Done | **Not Done** |

---

## Customer-Facing Features

| Feature | Status |
|---------|--------|
| Home page with hero/slider | **Done** |
| Events listing page | **Done** (basic) |
| Event detail page | **Done** |
| Event search form (home page) | **Partial** (UI only, not wired to API filtering) |
| Customer profile/account page | **Not Done** |
| Customer booking history | **Not Done** |
| Customer reviews/ratings | **Not Done** |
| Wishlist / saved events | **Not Done** |

---

## What Needs Work

### High Priority (Core missing features)

1. **Seat booking flow** - Model exists but no API endpoint or frontend for customers to actually book events
2. **Payment integration** - No payment system exists
3. **Customer profile page** - No way for customers to view/edit their profile
4. **Vendor profile edit** - Backend supports it but no UI in the vendor dashboard

### Medium Priority

5. **Reset password page (frontend)** - Backend done, frontend form missing
6. **Change password (frontend/admin)** - Backend done, no UI anywhere
7. **Admin event detail page** - Route exists but is a placeholder
8. **Edit staff modal (admin)** - Referenced but not built
9. **Earnings calculation** - Currently hardcoded to 0.00
10. **Home page search form** - UI exists but does not filter/redirect to events page with params

### Lower Priority / Future Features

11. Booking confirmation emails
12. Event reminder notifications
13. In-app notification system
14. Customer reviews/ratings
15. Wishlist / saved events
16. Customer booking history page
17. Delete vendor from admin panel
