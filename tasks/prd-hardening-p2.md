# PRD: GoRentals Final Production Hardening (Phase 2)

## 1. Goal
Perfect the GoRentals marketplace for production by resolving critical infrastructure gaps, finishing half-implemented features, and ensuring end-to-end reliability.

## 2. User Stories
- **US-001 (CI/CD)**: As a developer, I want the CI/CD pipeline to correctly inject all public environment variables into the Docker build so that the app works in production.
- **US-002 (Data Model)**: As an owner, I want to specify the condition of my gear so that renters have clear expectations.
- **US-003 (Storage)**: As a user, I want my uploads to go to the centralized platform storage (Cloudinary) instead of a legacy Supabase instance.
- **US-004 (Security)**: As an admin, I want logs to be clean of sensitive SQL queries in production.
- **US-005 (Notifications)**: As a renter, I want to be notified when my refund is processed by the payment gateway.

## 3. Acceptance Criteria
- [ ] `deploy.yml` and `Dockerfile` handle `NEXT_PUBLIC_RAZORPAY_KEY_ID` and `NEXT_PUBLIC_WS_URL`.
- [ ] `Listing` entity includes a `condition` field (String).
- [ ] `RazorpayWebhookHandler` triggers notifications for all financial events.
- [ ] `application.yml` has `DEBUG` logging disabled for SQL in the `prod` profile.
- [ ] Frontend uses `toast.error()` instead of `alert()`.

## 4. Dependencies
- Razorpay API keys (for testing)
- Cloudinary credentials (for storage migration)
