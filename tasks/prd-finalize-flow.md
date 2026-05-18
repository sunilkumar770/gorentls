# PRD: Finalize GoRentals Marketplace Flow

## Goal
Harden the end-to-end booking and management experience in the GoRentals dashboard, ensuring all state transitions are functional, secure, and accompanied by proper resource cleanup.

## User Stories

### US-001: Renter Payment from Dashboard
**Description**: As a renter, I want to be able to pay for my "Pending Payment" booking directly from the dashboard.
**Acceptance Criteria**:
- "Pay Now" button appears for bookings in `PENDING_PAYMENT` status.
- Clicking "Pay Now" redirects the user to `/checkout/[id]`.
- The checkout page correctly loads the booking data for payment.

### US-002: Owner Booking Management
**Description**: As an owner, I want to accept or reject incoming booking requests from my dashboard.
**Acceptance Criteria**:
- "Accept" and "Reject" buttons appear for owners when a booking is in `PENDING` status.
- Clicking "Accept" moves the booking to `CONFIRMED`.
- Clicking "Reject" moves the booking to `CANCELLED` and triggers a refund if any advance was paid (Phase 2).
- Notification is sent to the renter on status change.

### US-003: Renter Cancellation
**Description**: As a renter, I want to cancel my pending booking request.
**Acceptance Criteria**:
- "Cancel Request" button appears for renters when a booking is in `PENDING` status.
- Clicking "Cancel" moves the booking to `CANCELLED`.
- Blocked dates for the listing are immediately released in the database.

### US-004: Media Cleanup on Deletion
**Description**: As a system, I want to delete Cloudinary images when a listing is removed to save storage.
**Acceptance Criteria**:
- Deleting a listing triggers a cleanup job/call to Cloudinary.
- All images associated with the listing are destroyed in Cloudinary.
- Failure to delete from Cloudinary is logged but doesn't block the listing deletion.

### US-005: Booking Receipts
**Description**: As a user, I want to download a PDF receipt for my completed transactions.
**Acceptance Criteria**:
- "Download Receipt" button appears for `COMPLETED` bookings.
- Clicking the button triggers a browser download of a valid PDF receipt.
