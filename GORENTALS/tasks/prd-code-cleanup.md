# PRD: GoRentals Codebase Cleanup & Technical Debt Resolution

## Goal
Resolve all "warming codes" (warnings) and technical debt identified during the security audit. This includes cleaning up unused/duplicate imports, removing legacy configuration files, and standardizing error handling imports.

## User Stories

### US-001: Integration Test Cleanup
- **Requirement**: Remove duplicate and unused imports in `IntegrationTestBase.java`.
- **Success Criteria**: 
    - Lines 13-18 (duplicate imports) are removed.
    - `EnabledIfSystemProperty` and `Container` imports are removed.
    - Code still compiles and tests can run.

### US-002: Rate Limiting Consolidation
- **Requirement**: Merge necessary logic from `RateLimitingConfig.java` into `RateLimitConfig.java` and delete the legacy file.
- **Success Criteria**:
    - `RateLimitConfig.java` contains all required bucket configurations.
    - `RateLimitingConfig.java` is deleted.
    - References to `RateLimitingConfig` (e.g., in tests) are updated to `RateLimitConfig`.

### US-003: Service & Controller Import Pruning
- **Requirement**: Remove all unused `UserResponse` and `ErrorResponse` imports across the service and controller layers.
- **Success Criteria**:
    - `BookingService.java`, `ListingService.java`, `UserController.java`, and `BookingPaymentController.java` have no unused imports.
    - `TraceIdFilter.java` is cleaned of legacy servlet imports.

## Proposed Changes

### [MODIFY] src/test/java/com/rentit/config/IntegrationTestBase.java
- Cleanup imports.

### [DELETE] src/main/java/com/rentit/config/RateLimitingConfig.java
- Remove legacy config.

### [MODIFY] src/main/java/com/rentit/config/RateLimitConfig.java
- Ensure all required buckets are present.

### [MODIFY] Multiple Files
- Prune unused imports in services and controllers.

## Verification Plan
- Run `./mvnw clean compile` to ensure no regression or new warnings.
- Run `RateLimitingTest.java` to verify the new config works.
