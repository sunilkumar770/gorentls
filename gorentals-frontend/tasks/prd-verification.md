# PRD-001: Backend-Frontend Verification & Final Polishing

## Goal
Verify the successful migration of GoRentals to a Spring Boot 3.x backend. Ensure all core rental features (auth, listings, bookings) work end-to-end without Supabase.

## User Stories
- **US-001**: As a user, I can register and login with the new JWT auth system.
- **US-002**: As a user, I can view listing details without being logged in (Public Access).
- **US-003**: As a store owner, I can see my listings in the dashboard (requires token).
- **US-004**: As a renter, I can create a booking for a listed item (requires token).

## Technical Requirements
- Frontend calling `http://localhost:8080/api` via Axios.
- Backend handling JWT in `Authorization` header.
- Proper mapping from Java DTOs to TypeScript interfaces in `listings.ts` and `bookings.ts`.

## Success Criteria
- [ ] Sign-up / Login redirects to `/dashboard`.
- [ ] Product page displays correct price and description from Java DB.
- [ ] No 403 errors during build or runtime search.
- [ ] `npm run build` succeeds.
