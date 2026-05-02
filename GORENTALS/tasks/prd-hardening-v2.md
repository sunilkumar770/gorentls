# PRD: GoRentals Backend Hardening (Phase 2)

## Goal
Secure sensitive financial data, prevent brute-force attacks on authentication, and standardize error responses to prevent internal information leakage.

## User Stories

### US-001: Mask Payout Account Details
- **Acceptance Criteria**:
  - `OwnerPayoutAccount` fields `accountNumber`, `ifsc`, `upiId`, and `verificationRef` are NOT serialized in JSON responses.
  - The `maskedIdentifier()` computed field remains visible.

### US-002: Authentication Rate Limiting
- **Acceptance Criteria**:
  - `/api/auth/login` and `/api/auth/admin-login` are limited to 5 attempts per 15 minutes per IP.
  - Returns `429 Too Many Requests` when limit is exceeded.

### US-003: Standardize Error Responses
- **Acceptance Criteria**:
  - `GlobalExceptionHandler` has a specific handler for `BusinessException`.
  - Generic `Exception` handler returns a masked message (e.g., "An internal server error occurred") instead of `ex.getMessage()`.

### US-004: Codebase Cleanup
- **Acceptance Criteria**:
  - Unused `UserResponse` imports removed from `ListingService.java` and `BookingService.java`.
