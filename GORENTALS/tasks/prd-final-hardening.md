# PRD: Final Production Hardening

## Goal
Harden the GoRentals backend for production deployment.

## Requirements
1. **Resilience**: Implement Resilience4j (Circuit Breaker and Retry) for all Razorpay API interactions in `RazorpayIntegrationService.java` and `application.yml`.
2. **Idempotency**: Ensure `X-Idempotency-Key` is used for all sensitive Razorpay operations (Refunds, Payouts).
3. **Security**: Gated Swagger/Actuator endpoints in `SecurityConfig.java` and verified security headers.
4. **Cleanup**: Remove all unused imports, variables, and stale TODOs in `AdminService.java`, `BookingService.java`, and `ListingService.java`.
5. **Tests**: Stabilize `RateLimitingIntegrationTest.java` and ensure `IntegrationTestBase` is correctly used by all integration tests.
6. **Docker**: Ensure `IntegrationTestBase` skips tests if Docker is not available instead of failing the build.

## Files to Modify
- `GORENTALS/src/main/java/com/rentit/service/RazorpayIntegrationService.java`
- `GORENTALS/src/main/resources/application.yml`
- `GORENTALS/src/main/java/com/rentit/config/SecurityConfig.java`
- `GORENTALS/src/main/java/com/rentit/service/AdminService.java`
- `GORENTALS/src/main/java/com/rentit/service/BookingService.java`
- `GORENTALS/src/test/java/com/rentit/config/IntegrationTestBase.java`
- `GORENTALS/src/test/java/com/rentit/RateLimitingIntegrationTest.java`
