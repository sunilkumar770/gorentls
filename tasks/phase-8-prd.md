# PHASE 8 — DESIGN SYSTEM UNIFICATION

## Overview
This PRD outlines the tasks required for Phase 8 of GoRentals, which involves creating a unified Design System and updating existing frontend components to use canonical designs. 

### Instructions for Agent:
- Use **Graphify** as memory to understand component relationships.
- Use **CodeRabbit** for code reviews.
- Use **Eigents** for code generation and heavy lifting.
- All actions should run natively via Ralph-Loop and Get-Shut-Done workflows.

## 1. Design Token Strategy

### `src/styles/tokens.css`
Define CSS variables for brand colors, semantic surface tokens, borders, text, status variants, radii, spacing, typography, shadows, transitions, and z-index. Must include `.dark` overrides mapping `surface-base` to `#0f172a`, etc.

### `src/app/globals.css` (Tailwind v4)
Update the `@theme` block to map the new CSS variables from `tokens.css` into Tailwind utility names (e.g. `--color-brand-50: var(--color-brand-50)`).
Define standard interaction classes: `.focus-ring`, `.card-hover`, `.touch-target`.

## 2. Component Unification Plan

Create the following canonical components inside `src/components/ui/`:

- **Button.tsx**: Needs `primary`, `secondary`, `ghost`, `danger`, `success` variants. Built-in `loading` spinner. Replaces legacy `bg-indigo-600` inline styles.
- **Card.tsx**: `default`, `raised`, `bordered`, `ghost` variants.
- **Input.tsx**: Canonical form input supporting `leftIcon`, `rightIcon`, `error`, `hint`.
- **Badge.tsx**: Replace inline status tags. Map `BOOKING_STATUS_VARIANT` directly.
- **Alert.tsx**: Standardized `success`, `warning`, `error`, `info` variants.
- **Skeleton.tsx**: Loading placeholders to replace `animate-pulse` divs.
- **EmptyState.tsx**: Standardized `icon`, `title`, `description`, `cta`.
- **Typography.tsx**: `H1`, `H2`, `H3`, `Body`, `Caption`.
- **Avatar.tsx**: Fallback for user initials and image `src`.
- **lib/utils.ts**: Ensure `cn` utility exists.

## 3. Frontend Cleanup Plan

- **Accessibility**: Update `text-muted` in `tokens.css` light mode to `#64748b` (slate-500) for WCAG AA compliance. 
- **Touch Target**: Fix `DashboardNav` mobile navigation to use `.touch-target` or `min-h-[44px]`.
- **Dark/Light Mode**: Enforce surface hierarchy (Level 0 = `surface-base`, Level 1 = `surface-subtle`).
- **Global Replacement**: Audit `src/app/**/*.tsx` and replace inline styling (`bg-indigo-600 px-X py-X rounded-xl`) with the `<Button>` component.
