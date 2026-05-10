# PRD: Final Backend Polish & Production Readiness

## Goal
Perform a comprehensive audit of the GoRentals backend to resolve any remaining technical debt, security vulnerabilities, and code quality issues. This is the final step before the system is considered "Production Ready".

## Scope

### 1. Security & Protection
- **Global Exception Handler**: Remove sensitive internal details (`ex.getMessage()`) from the generic `Exception` handler. Use a sanitized "Unexpected Error" message for production.
- **IDOR Audit**: Double-check all controllers (User, Profile, Listing, Booking, Payment, Messaging) to ensure the `callerEmail` or `userId` from the `AuthenticationPrincipal` is strictly verified against the target entity's owner.
- **Search Hardening**: Ensure all repository `LIKE` search patterns escape special characters (`%`, `_`).
- **Rate Limiting**: Ensure all sensitive endpoints (Login, Register, Webhooks, Admin actions) have `@RateLimited` or equivalent protection.

### 2. Code Quality & Consistency
- **DTO Mapping**: Audit `BookingService`, `ListingService`, and `UserService` for manual mapping logic. Consolidate mapping into static `mapTo...` methods or a dedicated Mapper utility to reduce service-layer bloat.
- **Lombok Standardization**: Ensure consistent use of `@Data`, `@Getter`/`@Setter`, and `@Builder` across all models and DTOs.
- **Exception Strategy**: Audit for any remaining `RuntimeException` throws that should be specific `BusinessException` types with appropriate HTTP status codes.

### 3. Performance & Resource Optimization
- **N+1 Performance**: Verify `@EntityGraph` usage on all listing and booking fetching paths.
- **Database Indexing**: Add missing indexes for high-traffic query columns (e.g., `listing.city`, `booking.start_date`, `user.phone`).

### 4. API & Documentation
- **Swagger/OpenAPI**: Add missing `@Operation` and `@ApiResponse` annotations to clarify API usage for frontend developers.

## User Stories

### US-401: Secure Error Responses
- **Requirement**: `GlobalExceptionHandler` must not expose stack traces or raw Hibernate/Spring error messages for unhandled exceptions.
- **Acceptance Criteria**: Generic `Exception` returns "An unexpected error occurred. Please contact support." instead of `ex.getMessage()`.

### US-402: IDOR & Search Hardening
- **Requirement**: All direct object references (UUIDs) in API paths must be validated against the authenticated user's identity.
- **Requirement**: Search inputs must be escaped before being used in JPA `LIKE` queries.
- **Acceptance Criteria**: Attempting to fetch a booking ID belonging to another user returns 403 Forbidden.

### US-403: Code Consolidation & Mappers
- **Requirement**: Move repetitive mapping logic from services to a centralized mapper or static mapping methods.
- **Acceptance Criteria**: `BookingService` and `ListingService` methods are shorter and focus on business logic, not DTO construction.

### US-404: Production Readiness (Indexes & Rate Limiting)
- **Requirement**: Add missing indexes for `city`, `category`, and `bookingStatus`.
- **Requirement**: Apply rate limiting to `RazorpayWebhookHandler` and `AuthController`.

## Proposed Changes

### [Security]
- `GlobalExceptionHandler.java`: Refactor generic handler.
- `ListingRepository.java`: Escape keyword searches.

### [Code Quality]
- `BookingService.java`: Standardize mapping.
- `ListingService.java`: Standardize mapping.

### [Database]
- `V2026_05_09_1600__performance_indexes.sql`: New migration.

## Verification Plan
- **Security Tests**: Verify IDOR protection.
- **Integration Tests**: Verify search functionality still works with special characters.
- **Performance**: Check execution plan for indexed queries.
