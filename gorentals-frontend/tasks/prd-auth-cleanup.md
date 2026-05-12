# PRD: Protected Route Redirects & Cleanup

## Goal
Standardize the authentication redirect logic across all protected routes in the GoRentals frontend and cleanup unused files.

## User Stories

### US-001: Implement Client-Side Redirect Logic
- In all pages under `src/app/(protected)` and `src/app/(dashboard)`, implement a `useEffect` that checks if `authLoading` is false and `user` is null.
- If unauthenticated, use `router.push('/login?from=' + currentPath)`.
- Show a standard loading spinner while `authLoading` is true.

### US-002: Cleanup Duplicate Auth Context
- Since we have switched to `src/contexts/AuthContext.tsx`, remove the old `src/context/AuthContext.tsx` and ensure all references are updated. (Note: already updated layout.tsx).

### US-003: Update Admin Dashboard
- Ensure `src/app/(protected)/admin/page.tsx` has the role check logic (only allow 'ADMIN').

## Target Files
- `src/app/(dashboard)/dashboard/page.tsx`
- `src/app/(dashboard)/owner/dashboard/page.tsx` (if exists)
- `src/app/(protected)/my-bookings/page.tsx`
- `src/app/(protected)/notifications/page.tsx`
- `src/app/(protected)/profile/page.tsx`
- `src/app/(protected)/wishlist/page.tsx`
- `src/app/(protected)/admin/page.tsx`
- `src/app/(protected)/create-listing/page.tsx`
