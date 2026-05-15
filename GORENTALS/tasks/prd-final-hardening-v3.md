# PRD: Final Backend Hardening & Linting Cleanup (V3)

## Goals
Finalize the GoRentals backend production hardening by resolving all remaining technical debt, linting warnings, and TODOs identified in the latest system audit.

## Context
Previous hardening sessions addressed Bucket4j migration and exhaustive state management. This final pass focuses on code cleanliness and documentation accuracy to ensure a 100% stable and "review-ready" codebase.

## User Stories

### US-001: Core Service Linting Cleanup
- **Requirement**: Remove all unused imports, fields, and local variables in the following services within the main source tree:
  - `AdminService.java`
  - `BookingService.java`
  - `ListingService.java`
  - `NotificationService.java`
  - `PayoutEngine.java`
- **Acceptance Criteria**: `./mvnw test-compile` passes with zero warnings related to unused elements.

### US-002: TODO Resolution & Documentation Update
- **Requirement**: Address remaining TODO markers.
  - In `UserService.java`, update class-level documentation to reflect implemented settings logic.
  - In `BookingService.java`, resolve the TODO regarding refund processing (now handled by `BookingEscrowService`).
- **Acceptance Criteria**: Code comments accurately reflect the current implementation state.

### US-003: Integration Test Stabilization
- **Requirement**: Fix or suppress the resource leak warning in `IntegrationTestBase.java` using `@SuppressWarnings("resource")` for the `PostgreSQLContainer`.
- **Acceptance Criteria**: IDE and build logs show no resource leak warnings for this class.

### US-004: Production Logic Audit
- **Requirement**: Perform a final reasoning pass on `RazorpayIntegrationService` and `BookingEscrowService` using the `eigent` security role to ensure no edge-case failures in payment handling.
- **Acceptance Criteria**: A summary of the security audit is provided.

## Technical Tasks
1. Create a workspace worktree using `ralph-loop`.
2. Execute code cleanups across the 5 identified services.
3. Update Javadoc and TODOs.
4. Run Maven build to verify integrity.
5. Use `eigent_hybrid_reasoning` for the US-004 audit.
