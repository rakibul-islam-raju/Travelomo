# Travelomo — End-to-End User Flow

> Three actors. One platform. This document shows every journey from first visit to completed booking.

---

## Platform Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         TRAVELOMO PLATFORM                          │
│                                                                     │
│   ┌──────────────┐    ┌──────────────────┐    ┌─────────────────┐  │
│   │   CUSTOMER   │    │     VENDOR       │    │      ADMIN      │  │
│   │  (Traveller) │    │ (Travel Agency)  │    │   (Platform)    │  │
│   │              │    │                  │    │                 │  │
│   │ Browse       │    │ Create Events    │    │ Approve Vendors │  │
│   │ Book         │    │ Manage Bookings  │    │ Manage Users    │  │
│   │ Cancel       │    │ View Earnings    │    │ Monitor Events  │  │
│   └──────────────┘    └──────────────────┘    └─────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 1. Customer Journey

### 1.1 Registration & Activation

```
                         CUSTOMER REGISTRATION FLOW
                         ───────────────────────────

  [Visits Travelomo]
         │
         ▼
  ┌──────────────────┐
  │  Click "Sign Up" │
  └────────┬─────────┘
           │
           ▼
  ┌──────────────────────────────────┐
  │  Fill Registration Form          │
  │  • Full Name                     │
  │  • Email                         │
  │  • Password                      │
  └────────────────┬─────────────────┘
                   │
                   ▼
         ┌─────────────────┐
         │  POST /auth/    │  ──────► Account created
         │  register/      │          is_active = FALSE
         └────────┬────────┘
                  │
                  ▼
         ┌─────────────────────────────┐
         │  Activation email sent      │
         │  via Celery (background)    │
         └────────────┬────────────────┘
                      │
                      ▼
         ┌────────────────────────────────┐
         │  Customer clicks email link    │
         │  GET /auth/activate/?token=... │
         └────────────┬───────────────────┘
                      │
              ┌───────┴────────┐
              │                │
           Valid?            Expired?
              │                │
              ▼                ▼
       ┌────────────┐   ┌──────────────────┐
       │ Activated! │   │  Request new     │
       │is_active=  │   │  activation link │
       │  TRUE      │   └──────────────────┘
       └─────┬──────┘
             │
             ▼
     ┌───────────────┐
     │  Can now Log  │
     │     In        │
     └───────────────┘
```

---

### 1.2 Browse & Discover Events

```
                         EVENT DISCOVERY FLOW
                         ─────────────────────

  ┌─────────────────────────────────────────────────────────┐
  │                     HOME PAGE                            │
  │                                                         │
  │   Hero Banner                                           │
  │   ┌─────────────────────────────────────────────┐       │
  │   │  Search Form (location / date / keyword)    │       │
  │   └─────────────────────────────────────────────┘       │
  │                                                         │
  │   Featured Events ──────────────────────────────────►  │
  └─────────────────────────────────────────────────────────┘
           │                          │
     [Browse All]              [Click Featured]
           │                          │
           ▼                          │
  ┌─────────────────┐                 │
  │  /events page   │                 │
  │                 │                 │
  │  Filter by:     │                 │
  │  • Date range   │                 │
  │  • Price range  │                 │
  │  • Location     │                 │
  │  • Seats avail  │                 │
  └────────┬────────┘                 │
           │                          │
     [Click Event]                    │
           │◄─────────────────────────┘
           ▼
  ┌──────────────────────────────────────────────┐
  │              EVENT DETAIL PAGE               │
  │  ┌───────────────────┐  ┌─────────────────┐  │
  │  │  Event Image      │  │  Booking Card   │  │
  │  │  Title            │  │                 │  │
  │  │  Description      │  │  $150 / seat    │  │
  │  │  Date & Location  │  │  📅 Dates       │  │
  │  │  Vendor Info      │  │  📍 Location    │  │
  │  │  Tags             │  │  👥 12/20 seats │  │
  │  └───────────────────┘  │  [Book Now] ──► │  │
  │                         └─────────────────┘  │
  └──────────────────────────────────────────────┘
```

---

### 1.3 Booking Flow

```
                           BOOKING FLOW
                           ────────────

  [Clicks "Book Now"]
         │
         ├─── NOT logged in? ──────────────────────────────────────►
         │                                                    Redirect to /login
         │                                                          │
         │◄─────────────────────────────────────────────────────────┘
         │         (after login, lands back on event page)
         │
         ▼ (logged in)
  ┌──────────────────────────────────────────────┐
  │             BOOKING DIALOG OPENS             │
  │                                              │
  │   Number of Seats  [ 1 ▲▼ ]  (max: 12)      │
  │                                              │
  │   ┌──────────────────────────────────┐       │
  │   │  Price per seat    $150          │       │
  │   │  Seats             × 2           │       │
  │   │  ─────────────────────────       │       │
  │   │  Total             $300          │       │
  │   └──────────────────────────────────┘       │
  │                                              │
  │   Free cancellation up to 7 days before      │
  │   the event.                                 │
  │                                              │
  │   [Cancel]          [Confirm Booking]        │
  └──────────────────────────────────────────────┘
         │
         ▼
  ┌──────────────────────────┐
  │  POST /api/v1/bookings/  │
  └────────────┬─────────────┘
               │
         ┌─────┴──────┐
         │            │
      Success?      Error?
         │            │
         ▼            ▼
  ┌──────────┐  ┌───────────────────────────┐
  │ Booking  │  │ "Only X seats available"  │
  │Confirmed │  │ or "Event not available"  │
  │ Toast ✓  │  └───────────────────────────┘
  └────┬─────┘
       │
       ▼  (simultaneously, in background)
  ┌────────────────────────────────────────┐
  │  Celery fires send_booking_            │
  │  confirmation_email task               │
  │                                        │
  │  Customer receives email:              │
  │  • Booking ID                          │
  │  • Event title, dates, location        │
  │  • Seats booked, total price           │
  └────────────────────────────────────────┘
       │
       ▼
  Event page refreshes
  Available seats count decreases
```

---

### 1.4 View & Cancel Bookings

```
                       MY BOOKINGS FLOW
                       ────────────────

  [Navigate to /my-bookings]
         │
         ▼
  ┌──────────────────────────────────────────────────────┐
  │                    MY BOOKINGS                       │
  │                                                      │
  │  ┌────────────────────────────────────────────────┐  │
  │  │ Sundarbans Tour 7D              [confirmed]    │  │
  │  │ 📅 Apr 10 – Apr 17   📍 Khulna                │  │
  │  │ Seats: 2   Total: $300                         │  │
  │  │                              [Cancel Booking]  │  │
  │  └────────────────────────────────────────────────┘  │
  │                                                      │
  │  ┌────────────────────────────────────────────────┐  │
  │  │ Cox's Bazar Weekend Trip        [cancelled]    │  │
  │  │ 📅 Mar 01 – Mar 03   📍 Cox's Bazar            │  │
  │  │ Seats: 1   Total: $80                          │  │
  │  │                      (cancellation deadline    │  │
  │  │                       has passed — no button)  │  │
  │  └────────────────────────────────────────────────┘  │
  └──────────────────────────────────────────────────────┘

         [Cancel Booking] clicked
                │
                ▼
         ┌──────────────────────────────────────────┐
         │  Check: can_cancel?                      │
         │  • status == confirmed      ✓            │
         │  • cancellation_days > 0    ✓            │
         │  • today <= start - 7 days  ✓            │
         └─────────────────┬────────────────────────┘
                           │
                  ┌────────┴──────────┐
                  │                   │
               Yes ✓              No — deadline
                  │                passed ✗
                  ▼                   │
         ┌──────────────┐     ┌───────────────────────┐
         │  Booking     │     │  "Cancellation        │
         │  cancelled   │     │   deadline has        │
         │  Seats       │     │   passed" error       │
         │  restored    │     └───────────────────────┘
         │  to event    │
         └──────────────┘
```

---

## 2. Vendor Journey

### 2.1 Registration & Approval

```
                       VENDOR ONBOARDING FLOW
                       ──────────────────────

  [Visits /vendor-registration]
         │
         ▼
  ┌──────────────────────────────────────┐
  │  Fill Vendor Registration Form       │
  │  • Personal info (name, email, pass) │
  │  • Store name                        │
  │  • Store email, phone                │
  │  • Address, city, country            │
  │  • Social links (optional)           │
  └───────────────────┬──────────────────┘
                      │
                      ▼
              ┌───────────────────┐
              │  Account created  │
              │  is_approved=FALSE│
              │  Role = vendor    │
              └────────┬──────────┘
                       │
                       ▼
              ┌───────────────────────────────┐
              │  Activation email sent        │
              │  (same as customer flow)      │
              └────────┬──────────────────────┘
                       │
                       ▼
              ┌───────────────────────────────┐
              │  Vendor activates account     │
              │  but CANNOT publish events    │
              │  until approved by Admin      │
              └────────┬──────────────────────┘
                       │
                       ▼
              ┌─────────────────────────────────────┐
              │  ADMIN reviews pending vendors      │
              │  in admin panel                     │
              │                                     │
              │  [Approve] ──► is_approved = TRUE   │
              │  [Disable] ──► vendor blocked       │
              └─────────────────────────────────────┘
                       │
                       ▼
              ┌────────────────────────────┐
              │  Vendor can now log in     │
              │  and create events         │
              └────────────────────────────┘
```

---

### 2.2 Event Lifecycle

```
                         EVENT LIFECYCLE
                         ───────────────

  [Vendor Dashboard → Create Event]
         │
         ▼
  ┌─────────────────────────────────────────┐
  │  Fill Event Form                        │
  │  • Title, Description (rich text)       │
  │  • Start Date / End Date                │
  │  • Location                             │
  │  • Total Seats                          │
  │  • Price per seat / Discount price      │
  │  • Cancellation deadline (days)         │
  │  • Tags, Image                          │
  │  • Status: Draft or Published           │
  └──────────────────┬──────────────────────┘
                     │
         ┌───────────┴────────────┐
         │                        │
      [Draft]                [Published]
         │                        │
         │ (hidden from public)   │ (visible to customers)
         │                        │
         └───────────┬────────────┘
                     │
                     ▼
       ┌─────────────────────────────────┐
       │         EVENT STATUSES          │
       │                                 │
       │  draft ──► published            │
       │       ──► paused (vendor hides) │
       │       ──► cancelled             │
       │       ──► travelling (active)   │
       │       ──► completed ◄── Celery  │
       └─────────────────────────────────┘

       Status Transitions:
       ─────────────────────────────────────────────────

       draft      → vendor saves as draft, not visible
       published  → visible to customers, bookings open
       paused     → vendor temporarily hides the event
       travelling → event is currently happening
       cancelled  → event cancelled, no more bookings
       completed  → end_date passed (auto via Celery task)
```

---

### 2.3 Vendor Dashboard

```
                      VENDOR DASHBOARD OVERVIEW
                      ─────────────────────────

  ┌──────────────────────────────────────────────────────────────┐
  │                    VENDOR DASHBOARD                          │
  │                                                              │
  │  ┌────────────────┐  ┌────────────────┐  ┌───────────────┐  │
  │  │ Total Earnings │  │ Events Running │  │ Travellers    │  │
  │  │   $1,800       │  │      3         │  │    142        │  │
  │  └────────────────┘  └────────────────┘  └───────────────┘  │
  │                                                              │
  │  ┌──────────────────────────────┐  ┌────────────────────┐   │
  │  │  Registered Travellers Chart │  │  Events by Status  │   │
  │  │  (line chart, date range)    │  │  (pie chart)       │   │
  │  └──────────────────────────────┘  └────────────────────┘   │
  │                                                              │
  │  Sidebar:                                                    │
  │  ├── Dashboard (stats)                                       │
  │  ├── Events (list, create, edit, duplicate)                  │
  │  └── Bookings (see who booked your events)                   │
  └──────────────────────────────────────────────────────────────┘

  EARNINGS CALCULATION:
  ──────────────────────────────────────────────────────
  SUM(seat_number × effective_price)
    WHERE event belongs to this vendor
    AND   event status = "completed"
    AND   booking status = "confirmed"
  ──────────────────────────────────────────────────────
  effective_price = discount_price (if > 0) else actual_price
```

---

### 2.4 View Bookings (Vendor)

```
  [Dashboard → Bookings]
         │
         ▼
  ┌───────────────────────────────────────────────────────────────┐
  │                     VENDOR BOOKINGS                           │
  │                                                               │
  │ Event              Customer    Email         Seats  Total     │
  │ ─────────────────────────────────────────────────────────     │
  │ Sundarbans Tour    Karim H.    karim@...      2     $300      │
  │ Sundarbans Tour    Priya S.    priya@...      1     $150      │
  │ Cox's Bazar Trip   Ahmed R.    ahmed@...      3     $240 ●    │
  │ Cox's Bazar Trip   Nadia K.    nadia@...      2     $160      │
  │                                                               │
  │ ● = cancelled                                                 │
  └───────────────────────────────────────────────────────────────┘
```

---

## 3. Admin Journey

```
                          ADMIN PANEL FLOW
                          ────────────────

  [Logs into Admin Panel]
         │
         ▼
  ┌──────────────────────────────────────────────────────────────┐
  │                      ADMIN DASHBOARD                         │
  │                                                              │
  │  ┌─────────────┐  ┌──────────────┐  ┌───────────────────┐   │
  │  │ Total Users │  │Total Vendors │  │  Running Events   │   │
  │  └─────────────┘  └──────────────┘  └───────────────────┘   │
  │                                                              │
  │  ⚠ Pending Vendor Approvals (widget)                         │
  │  ────────────────────────────────────                        │
  │  • Rina's Travels    [Approve] [Disable]                     │
  │  • Blue Ocean Tours  [Approve] [Disable]                     │
  └──────────────────────────────────────────────────────────────┘

  Admin Actions:
  ┌─────────────────────────────────────────────────────────┐
  │  Vendors   → List, View Detail, Approve, Disable        │
  │  Users     → List, View Detail, Activate/Deactivate,    │
  │              Send Password Reset                         │
  │  Events    → List all events, filter by status          │
  │  Staff     → Create, List, Activate/Deactivate          │
  └─────────────────────────────────────────────────────────┘
```

---

## 4. Complete End-to-End Flow

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                    TRAVELOMO — COMPLETE FLOW                                 │
└──────────────────────────────────────────────────────────────────────────────┘

VENDOR                      ADMIN                       CUSTOMER
──────                      ─────                       ────────

Register                                                Register
    │                                                       │
Activate email                                         Activate email
    │                                                       │
    │                   Review vendor                       │
    │◄──────────────── [Approve] ──────────────────────────►│
    │                                                       │
Create Event                                           Browse Events
(draft → published)                                        │
    │                                                  View Event Detail
    │◄──────────────────────────────────────── Book Now ───►│
    │                                                       │
    │           ┌───────────────────────┐                   │
    │           │     DATABASE          │                   │
    │           │  SeatBooking created  │                   │
    │           │  available_seats - N  │◄──────────────────┘
    │           └───────────┬───────────┘
    │                       │
    │                  Celery fires
    │                  confirmation email
    │                       │
    │                       ▼
    │                  Customer inbox ✉
    │
    │                  [Optional] Customer cancels
    │                       │
    │           ┌───────────────────────┐
    │           │  booking → cancelled  │
    │           │  available_seats + N  │
    │           └───────────────────────┘
    │
Event end_date passes
    │
Celery marks event
→ completed
    │
Dashboard updates:
• Total Earnings ↑
• Travellers count ↑
• Pie chart updates
```

---

## 5. Authentication & Token Flow

```
  ┌────────────────────────────────────────────────────────┐
  │                  JWT AUTH FLOW                         │
  │                                                        │
  │  Login                                                 │
  │  POST /auth/login/                                     │
  │       │                                                │
  │       ▼                                                │
  │  Response: access_token + refresh_token (httpOnly)     │
  │       │                                                │
  │       ▼                                                │
  │  Every API request:                                    │
  │  Authorization: Bearer <access_token>                  │
  │       │                                                │
  │       ├── 200 OK → continue                           │
  │       │                                                │
  │       └── 401 Unauthorized                            │
  │                │                                       │
  │                ▼                                       │
  │         POST /auth/refresh/ (auto, via fetcher.ts)     │
  │                │                                       │
  │                ├── Success → retry original request    │
  │                │                                       │
  │                └── Fail → "Session expired" toast      │
  │                           redirect to /login           │
  └────────────────────────────────────────────────────────┘
```

---

## 6. Background Jobs (Celery)

```
  ┌──────────────────────────────────────────────────────────┐
  │                  CELERY BACKGROUND TASKS                 │
  │                                                          │
  │  Trigger                  Task                           │
  │  ─────────────────────────────────────────────────────   │
  │  User registers      →   send activation email           │
  │  Password reset req  →   send password reset email       │
  │  Staff created       →   send staff welcome email        │
  │  User deactivated    →   send deactivation email         │
  │  Booking confirmed   →   send booking confirmation email │
  │                                                          │
  │  Scheduled (daily):                                      │
  │  end_date < today    →   mark events as "completed"      │
  │                          (update_completed_events task)  │
  └──────────────────────────────────────────────────────────┘
```

---

*Last updated: 2026-04-02*
