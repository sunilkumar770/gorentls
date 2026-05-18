# PRD: Full Light-Mode Redesign

## Overview
Rebuild the GoRentals frontend visual layer to a standardized, premium light-mode design system. The existing Indigo/Slate token system in `tokens.css` is already correct — this PRD enforces it consistently across every shared surface and removes all dark-mode hardcoding.

## User Stories

### US-001: Force light-mode baseline in app shell
**As a** developer,  
**I want** the root layout to always render in light mode,  
**so that** every page gets a consistent white background and the visual hierarchy is stable.

**Acceptance Criteria:**
- `src/app/layout.tsx` sets `ThemeProvider` with `defaultTheme="light"` and `enableSystem={false}`
- `<body>` uses `bg-surface-base text-text-primary` classes (no raw hex or dark: variants)
- `Toaster` is configured with light-mode style overrides (white bg, slate text, indigo success)
- Verify: visiting any page never shows a dark background

### US-002: Fix globals.css shimmer and glass-nav
**As a** developer,  
**I want** the shimmer loading animation and glass nav classes to use semantic CSS variables,  
**so that** they always render correctly regardless of system color scheme.

**Acceptance Criteria:**
- `.shimmer` gradient uses `var(--color-surface-subtle)` and `var(--color-surface-raised)` instead of broken `var(--bg-subtle)`
- `.glass-nav` has no dark-mode specific overrides — it works purely from the light-mode palette
- Verify: shimmer loading states are visible and animate correctly

### US-003: Standardize Navbar to semantic tokens
**As a** user,  
**I want** the navigation bar to always appear clean, white, and professional,  
**so that** it matches the premium marketplace aesthetic.

**Acceptance Criteria:**
- `Navbar.tsx` uses `.glass-nav` instead of raw `bg-white/80 dark:bg-slate-950/80`
- All nav link hover states use `text-brand-600` — no raw indigo hex values
- Profile dropdown uses `bg-surface-raised` and `border-border-subtle`
- No `dark:` prefix class is present in Navbar
- Verify: Navbar looks white and premium at all viewport sizes

### US-004: Standardize Button variants
**As a** user,  
**I want** all buttons to have consistent, accessible styles matching the design system,  
**so that** the UI feels cohesive and professional.

**Acceptance Criteria:**
- Primary button: `bg-brand-500 hover:bg-brand-600 text-white`
- Secondary button: `bg-surface-raised border-border-default text-text-primary hover:bg-surface-subtle`
- Ghost button: `text-text-secondary hover:bg-surface-subtle hover:text-text-primary`
- Danger button: `bg-red-600 hover:bg-red-700 text-white`
- No `dark:` class in any Button variant
- Verify: all button states visible in Storybook or on a test page

### US-005: Standardize Card component
**As a** user,  
**I want** cards to stand out cleanly against the page background,  
**so that** content is easy to scan.

**Acceptance Criteria:**
- `Card.tsx` default variant: `bg-surface-raised border-border-subtle shadow-sm`
- Interactive cards hover: `hover:shadow-md hover:border-brand-300 hover:-translate-y-0.5`
- Ghost variant: `bg-transparent` (unchanged)
- No `dark:hover:border-brand-700` or any `dark:` prefix
- Verify: listing cards on /search page pop off the subtle background

### US-006: Standardize Input component
**As a** user,  
**I want** form inputs to have clear, accessible styling,  
**so that** filling forms is intuitive.

**Acceptance Criteria:**
- Input background: `bg-surface-base` (white, not subtle)
- Default border: `border-border-default`
- Hover border: `border-border-strong`
- Focus ring: `focus-visible:ring-brand-500`
- Error text: `text-red-600` (no `dark:text-red-400`)
- Verify: login form and register form inputs look clean and crisp

### US-007: Redesign the /search page
**As a** user browsing the marketplace,  
**I want** the search page to have strong visual hierarchy and a polished empty state,  
**so that** I stay engaged even when no results match.

**Acceptance Criteria:**
- Hero section: `bg-surface-base` with `text-brand-600` eyebrow label "BROWSE CATALOGUE"
- Search input wrapper: `bg-white border-border-default rounded-xl shadow-sm`
- Search button: `bg-brand-500 hover:bg-brand-600 text-white`
- Filter strip: wrapped in `bg-surface-subtle` container
- Active filter chip: `bg-indigo-50 text-indigo-700 border-indigo-200`
- Empty state: 64px icon container `bg-indigo-50 rounded-2xl` with `text-brand-600` icon
- Result cards: `bg-surface-raised` so they pop against `bg-surface-subtle` background
- Verify: page looks premium with zero results AND with results

## Dependencies
None

## Notes
- Dark mode rebuild is a future PRD
- ThemeToggle should be kept but system detection disabled
- No backend changes required
