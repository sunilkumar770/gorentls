# Product Requirements Document: End to End Health Test

## Objective
Programmatically verify that the core user flows of the GoRentals platform function correctly from Auth, to Listing Creation, to Checkout process, confirming Frontend-Backend schema alignment.

## User Stories
### US-001: Register & Authenticate Owner
- The system must successfully register a user as an Owner via `/api/auth/register-owner`.
- The system must capture the JWT token upon login.

### US-002: Create Listing
- The authenticated Owner must be able to create a listing via `POST /api/listings`.
- The listing must be successfully stored and queryable.

### US-003: Search Listing
- The system must fetch listings via `GET /api/listings/search` without causing a 500 JDBC DataType match.

### US-004: Create Booking
- The system must successfully create a booking using the new listing UUID via `POST /api/bookings`.

## Implementation Requirements
- Create an automated script `e2e_test.js` using Node/Fetch (or axios) that chains these actions together.
- The script should run sequentially and log success or failure.
- Ensure the Ralph agent runs `node e2e_test.js` to prove functionality.
