# PRD: Verify Booking Flow and Dashboard Consistency

## Goal
Ensure a booking made by a renter correctly appears in the "My Rentals" dashboard and generates a valid receipt.

## User Stories
- **US-01**: Renter logs in and books an item.
- **US-02**: Renter completes payment (Razorpay).
- **US-03**: Renter sees the "Payment Success" page and can download a receipt.
- **US-04**: Renter navigates to "My Rentals" and sees the booking in the "Active" tab.

## Technical Requirements
- Audit `BookingRepository.findByRenterId`.
- Audit `MyRentalsPage.tsx` filtering logic.
- Audit `BookingStatus` enum in backend.
