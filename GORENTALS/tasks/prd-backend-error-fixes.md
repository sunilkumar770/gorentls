# PRD: Backend Error Fixes and Service Audit

## Goal
Fix compilation errors and logic mismatches in the GoRentals backend.

## Requirements
1. Fix `RefundRetryService.java` to use `BookingRepository` for entity access.
2. Fix `BookingEscrowService.java` missing imports (`Map`, `HashMap`).
3. Audit `LedgerReconciliationService.java` and `BookingPaymentController.java` for similar issues.
4. Ensure all service-to-service calls use the correct signatures (DTO vs Entity).

### User Stories

- **US-001**: As a developer, I want `RefundRetryService` to compile and correctly handle booking entities during refund retries.
- **US-002**: As a developer, I want `BookingEscrowService` to have all required imports for WebSocket broadcasting.
- **US-003**: As a developer, I want to ensure no other service has been broken by the recent DTO refactoring.
