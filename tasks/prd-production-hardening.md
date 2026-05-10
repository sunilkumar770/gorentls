# PRD: GoRentals Production Hardening (Auth & Notifications)

## Overview
Address critical production risks and fabrications identified in the audit. This includes fixing the JWT refresh exception mapping, implementing real settings persistence, adding refund recovery logic, and hardening the auth storage bootstrap.

## User Stories

### US-001: Harden JWT Refresh & Charset
- **Acceptance Criteria**:
    - Update `JwtUtil.java` to use `secret.getBytes(StandardCharsets.UTF_8)`.
    - Change `refreshToken()` to throw `ResponseStatusException(HttpStatus.UNAUTHORIZED)` instead of `RuntimeException`.
    - Verify with unit tests.

### US-002: Implement Settings Persistence
- **Acceptance Criteria**:
    - Replace the stub in `UserService.updateSettings()`.
    - Create a `UserSettings` entity and repository if needed, or expand `UserProfile`.
    - Ensure settings are persisted to the database and returned correctly.

### US-003: Refund Failure Recovery
- **Acceptance Criteria**:
    - Update `BookingService.java` to handle refund failures gracefully.
    - Implement a basic retry mechanism or mark the booking for "Manual Reconciliation" in a persistent way.
    - Ensure failed refunds don't leave the system in a "silent success" state.

### US-004: Resilient Auth Bootstrap
- **Acceptance Criteria**:
    - Wrap `localStorage` access in `AuthContext.tsx` with a safe utility (e.g., `safeStorage`).
    - Ensure the auth flow continues (falling back to cookies or guest mode) if `localStorage` access is denied (SecurityError).

### US-005: Notification Broadcast Verification
- **Acceptance Criteria**:
    - Inspect the `NotificationRepository.broadcast` native SQL performance.
    - (Optional) If scale is a concern, refactor to batch-based background job.
    - If WebSocket is required, implement `SimpMessagingTemplate` delivery.

## Technical Tasks
1. [ ] Refactor `JwtUtil.java`
2. [ ] Implement `UserService` settings persistence
3. [ ] Add `BookingService` refund reconciliation
4. [ ] Hardened `AuthContext.tsx` storage logic
