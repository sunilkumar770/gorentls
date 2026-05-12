# Phase 5: Booking, Payment & Transaction Trust Engineering

## 1. Overview
Finalize the booking and payment infrastructure for GoRentals to enable end-to-end transactions with high trust and escrow protection.

## 2. Current Failures
- `/pricing` is a 404.
- `/checkout` page is missing.
- No booking state machine in the UI (Pending -> Confirmed -> Active -> Completed).
- Missing escrow/secure-hold messaging.
- Double-booking risk (no availability check).
- Payment integration status (Razorpay needs verification).

## 3. Implementation Plan

### 3.1. Frontend
- [ ] Create `/pricing` page with tiers, timeline, and FAQ.
- [ ] Create `/checkout` page with review, escrow messaging, and booking submission.
- [ ] Implement `PayoutCalculator` for owners.
- [ ] Modify `BookingCalendar` to check availability via `/api/items/:id/availability`.
- [ ] Implement `BookingConfirmed` success screen.

### 3.2. Backend
- [ ] Implement `GET /api/items/:id/availability`.
- [ ] Implement `POST /api/bookings` (creates PENDING booking).
- [ ] Implement `PATCH /api/bookings/:id/confirm` (transitions to CONFIRMED).
- [ ] Implement `PATCH /api/bookings/:id/decline` (transitions to CANCELLED).
- [ ] Implement `PATCH /api/bookings/:id/complete` (transitions to COMPLETED).
- [ ] Add DB exclusion constraint to prevent double-booking.

## 4. Technical Details
- Use Razorpay for payments (escrow logic).
- Pricing: 5% platform fee + refundable deposit.
- Date conflict validation in frontend and backend.

## 5. Success Criteria
- Clean production build.
- `/pricing` and `/checkout` routes functional.
- Double-booking prevented.
- Trust messaging visible and accurate.
