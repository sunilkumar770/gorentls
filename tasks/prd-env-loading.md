# PRD: Authentication & Environment Fixes (Full Stack)

## Overview
The GoRentals platform is currently blocked by a combination of backend startup failures (missing environment variables) and frontend authentication bugs (token key mismatch, double /api prefix, and redundant logic). This PRD outlines the fixes across both layers.

## User Stories

### US-001: Automatic Backend .env Loading
- **Acceptance Criteria**:
    - The backend must automatically load variables from `.env` in the root of the `GORENTALS` directory.
    - This should only happen when running in the `dev` profile.
    - Use `dotenv-java` to ensure compatibility.

### US-002: Fix Frontend Token Key Mismatch
- **Acceptance Criteria**:
    - Update `AuthContext.tsx` to use `gorentals_token` instead of `gr_token` to match `services/auth.ts` and `axios.ts`.
    - Ensure persistent storage (`safeStorage`) uses the correct key for session restoration.

### US-003: Fix Login Page Logic & URL
- **Acceptance Criteria**:
    - Replace raw `fetch` call in `login/page.tsx` with the `signIn` service from `@/services/auth`.
    - Fix the double `/api` prefix in the login request.
    - Remove redundant `document.cookie` writes in `AuthContext.tsx` and rely on `setToken` service.

## Technical Tasks
1. [ ] **Backend**: Add `dotenv-java` dependency and update `GoRentals.java`.
2. [ ] **Frontend**: Refactor `AuthContext.tsx` (token keys, cookie cleaning).
3. [ ] **Frontend**: Refactor `login/page.tsx` (use `signIn`, fix URL).
4. [ ] **Verification**: Start backend and frontend, then perform a successful renter login.
