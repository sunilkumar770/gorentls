# PRD: Phase 2 — Booking Funnel Restoration & Sanitization

## Context
Item Detail Pages are currently broken because they hit `/api/items` instead of `/api/listings`. Additionally, 16+ "Smoke Test" items are cluttering the homepage. Some pages show a "stripped" navbar, indicating a session loss or hydration failure.

## Objectives
1. **Fix API Fetch**: Update `getItem` in `src/app/(public)/item/[id]/page.tsx` to use `/api/listings/{id}`.
2. **Standardize Field Mapping**: Align frontend item mapping with backend `ListingResponse` (e.g., `pricePerDay` vs `price_per_day`).
3. **Purge Smoke Test Data**: Remove all listings with "Smoke" or "Test" in the title from the database.
4. **Debug Navbar**: Identify why the authenticated state is lost on certain Item Detail routes.

## User Stories
- **US-001**: As a user, I can click a listing and see its full details, images, and pricing without seeing "Not Found".
- **US-002**: As a user, I see a clean homepage free of test/junk data.
- **US-003**: As an authenticated user, I expect my avatar and profile menu to persist when I view an item.

## Technical Tasks
- [ ] Update `src/app/(public)/item/[id]/page.tsx` API URL.
- [ ] Update `displayItem` mapping in `page.tsx`.
- [ ] Create and run a database purge script for smoke test items.
- [ ] Verify `AuthProvider` initialization on item pages.
