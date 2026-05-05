# Frontend Linting Fixes

## Overview
The frontend project (`gorentals-frontend`) has 77 linting errors, predominantly `@typescript-eslint/no-explicit-any` and `react-hooks/set-state-in-effect`. These need to be resolved to ensure clean production builds.

## User Stories
- [ ] US-001: Fix `any` types in `src/services/auth.ts` and `src/services/listings.ts`.
- [ ] US-002: Fix `react-hooks/set-state-in-effect` in `src/app/(protected)/admin/page.tsx` and `src/app/(protected)/checkout/[id]/page.tsx`.
- [ ] US-003: Fix `any` types in `src/app/(auth)/admin/login/page.tsx`, `src/app/(auth)/login/page.tsx`, `src/app/(auth)/signup/page.tsx`.
- [ ] US-004: Fix remaining `any` types in `src/app/(protected)/dashboard/page.tsx`, `src/app/(protected)/messages/[id]/page.tsx`, `src/app/(protected)/messages/page.tsx`.
