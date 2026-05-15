# PRD: GoRentals UI/UX Refactor & Production Hardening

## Overview
Systematic refactor of the GoRentals frontend to address 18 critical and major UI/UX issues identified in the production audit.

## User Stories

### US-001: Fix Dashboard Runtime Crash
- **Goal:** Prevent `bookings.filter is not a function` error.
- **Requirement:** Add defensive array normalization for `bookings` data in `DashboardPage.tsx`.

### US-002: Implement Booking Detail Route
- **Goal:** Fix 404 on `/dashboard/bookings/[id]`.
- **Requirement:** Create `src/app/(dashboard)/dashboard/bookings/[id]/page.tsx` with a detailed booking view.

### US-003: Fix Stores Hero Section Contrast
- **Goal:** Ensure "Browse Owners" text is readable in light mode.
- **Requirement:** Replace undefined Tailwind tokens with slate scale colors in `stores/page.tsx`.

### US-004: Fix Listing Card Dark Mode Contrast
- **Goal:** Make listing titles and prices visible in dark mode.
- **Requirement:** Add `dark:` variants to text colors in `ListingCard.tsx`.

### US-005: Fix Listing Detail Page Contrast
- **Goal:** Ensure all description and metadata text is readable in both modes.
- **Requirement:** Refactor `listings/[id]/page.tsx` to use standard slate colors.

### US-006: Fix Store Page Filter Pills
- **Goal:** Ensure city filter pills have visible text in light mode.
- **Requirement:** Update pill styles in `stores/page.tsx`.

### US-007: Fix Store Card Visibility
- **Goal:** Ensure all store card metadata is readable in light mode.
- **Requirement:** Update text colors in store card components.

### US-008: Calendar Logic & Styling
- **Goal:** Disable past dates and add visual feedback.
- **Requirement:** Implement `isDisabled` logic and line-through styling in `BookingCalendar.tsx` (or inline calendar).

### US-009: Fix Field Mapping for Condition
- **Goal:** Show actual condition instead of category.
- **Requirement:** Map `listing.condition` correctly in the detail view.

### US-010: Friendly Booking Status Labels
- **Goal:** Hide raw enum underscores.
- **Requirement:** Map enums to human-readable labels in `dashboard/bookings`.

### US-011: Implement Search Filters Drawer
- **Goal:** Make the "Filters" button functional.
- **Requirement:** Add a drawer/modal for search filters.

### US-012: Theme Toggle Feedback & Persistence
- **Goal:** Show active state for theme toggle and ensure public pages respect theme.
- **Requirement:** Update `ThemeToggle.tsx` and ensure `ThemeProvider` is correctly wrapping everything.

### US-013: FAQ Accordion Refinement
- **Goal:** Improve help page readability.
- **Requirement:** Add dividers and button feedback to `help/page.tsx`.

### US-014: Auth Pages Dark Mode
- **Goal:** Add dark mode support to Login/Signup.
- **Requirement:** Add `dark:` variants to auth layout and components.

### US-015: Signup Role Toggle Visuals
- **Goal:** Clarify which role is selected.
- **Requirement:** Add background fill to active toggle state.

### US-016: Messages Panel Dividers
- **Goal:** Separate conversation list from chat view.
- **Requirement:** Add borders/dividers in `dashboard/messages`.

### US-017: Listing Card Hover Effects
- **Goal:** Add interactive feedback to cards.
- **Requirement:** Implement lift/shadow/scale on hover for `ListingCard.tsx`.

### US-018: Mobile City Pills Scroll
- **Goal:** Ensure city filters don't cut off.
- **Requirement:** Add horizontal scroll with indicator/mask.

## Acceptance Criteria
- All 18 points resolved.
- WCAG AA contrast compliance across all pages.
- Zero runtime crashes on dashboard.
- Consistent design system usage (slate/indigo).
