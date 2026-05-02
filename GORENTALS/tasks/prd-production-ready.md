# PRD: Production Readiness & Code Quality Hardening

## Overview
This PRD outlines the final steps to make the GoRentals backend production-ready. This includes fixing regressions in tests caused by security hardening, externalizing configuration, and modernizing legacy security code.

## Goals
1.  **Test Alignment**: Fix `RateLimitingIntegrationTest.java` to match the new hardened rate limits (5 attempts per 15 minutes).
2.  **Configuration Externalization**: Refactor `RateLimitConfig.java` to use values from `application.yml` instead of hardcoded defaults.
3.  **Security Modernization**: Update `JwtUtil.java` to use the non-deprecated JJWT 0.12.x API.
4.  **Production Defaults**: Ensure `application.yml` and `application-prod.yml` have sane, secure defaults for all environment variables.

## User Stories

### US-001: Fix Rate Limiting Tests
- **Context**: The rate limit for auth endpoints was lowered from 10/min to 5/15min.
- **Task**: Update `RateLimitingIntegrationTest.java` to reflect these limits.
- **Acceptance Criteria**: `mvn test -Dtest=RateLimitingIntegrationTest` passes.

### US-002: Externalize Rate Limits
- **Context**: `RateLimitConfig.java` currently has hardcoded limits.
- **Task**: Use `@ConfigurationProperties` or `@Value` to pull limits from `rate-limiting.*` in `application.yml`.
- **Acceptance Criteria**: Changing values in `application.yml` updates the actual limits without code changes.

### US-003: Modernize JWT Utility
- **Context**: `JwtUtil.java` uses deprecated JJWT methods (e.g., `setClaims`, `signWith` with old signatures).
- **Task**: Refactor to use the new fluent API in JJWT 0.12.x.
- **Acceptance Criteria**: Clean compilation with no deprecation warnings for `JwtUtil.java`.

### US-004: Production Config Audit
- **Context**: `application.yml` has some placeholders.
- **Task**: Ensure all sensitive fields use `${VAR:default}` pattern where the default is either safe or triggers a failure if missing.
- **Acceptance Criteria**: `application-prod.yml` only contains production-specific overrides (like allowed-origins).

## Verification Plan
1.  Run all integration tests: `./mvnw test`
2.  Check compilation warnings: `./mvnw clean compile -Dmaven.compiler.showDeprecation=true`
3.  Verify rate limiting manually if possible.
