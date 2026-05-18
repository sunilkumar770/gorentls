# PRD: GoRentals Production Hardening & Perfection

## Goal
Transform GoRentals into a production-grade, secure, and highly maintainable marketplace by resolving all critical security gaps, standardizing data flows, and hardening the CI/CD pipeline.

## User Stories
- **US-001**: Implement Double-Submit Cookie CSRF protection and migrate frontend to secure HttpOnly-only authentication.
- **US-002**: Complete Razorpay webhook handlers (refund.failed, payment.failed) and ensure 100% financial state consistency.
- **US-003**: Standardize Listing data model across Backend DTOs and Frontend components (fix H-1).
- **US-004**: Harden CI/CD pipeline with strict build-time secret validation and automated linting/type-checking gates.
- **US-005**: Refactor manual DTO mapping to MapStruct and implement database-level financial constraints.

## Success Criteria
- [ ] Backend requires CSRF token for all state-changing requests.
- [ ] Frontend stores zero sensitive credentials in LocalStorage.
- [ ] CI/CD fails build if any production secret is missing.
- [ ] 100% test coverage for Razorpay webhook logic.
