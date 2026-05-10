# PRD: Auth Flow UI/UX Improvements

## Overview
Improve the authentication flow (Signup, Login, Forgot Password) by addressing critical UX antipatterns, security gaps, and UI inconsistencies identified in the deep-dive audit.

## User Stories

### US-001: Remove Role Toggle from Login
- **As a** returning user
- **I want to** sign in using just my credentials
- **So that** I don't have to manually select my role every time and avoid routing errors.
- **Acceptance Criteria**:
    - Remove the RENTER/OWNER toggle from `/login`.
    - Backend already returns the user's role in the JWT/Profile.
    - Frontend should automatically redirect to the correct dashboard based on the profile role returned after successful login.

### US-002: Implement Phone/Email Verification Placeholder
- **As a** new user
- **I want to** verify my phone/email during signup
- **So that** my account is secure and verified.
- **Acceptance Criteria**:
    - Add a step/modal for OTP verification after the signup form is submitted.
    - (Frontend only for now) Show a "Verify OTP" view if the backend returns a "PENDING_VERIFICATION" status or similar.

### US-003: Fix Signup Role Toggle UI
- **As a** new user
- **I want to** clearly see which role I am selecting
- **So that** I join with the correct account type.
- **Acceptance Criteria**:
    - Fix the text bleeding in the role selection labels.
    - Ensure labels and options have proper spacing.

### US-004: Enhance Forgot Password Success State
- **As a** user who forgot their password
- **I want to** see a clear confirmation that a reset link was sent
- **So that** I know I can check my inbox.
- **Acceptance Criteria**:
    - Ensure the success view is visually consistent with the rest of the auth flow.
    - Mask the email address in the success message (e.g., `j***@gmail.com`).
    - Add a right-side trust panel to `/forgot-password` for consistency with Signup/Login.

### US-005: Global Auth UI Polish
- **Acceptance Criteria**:
    - Add "Remember me" checkbox to `/login`.
    - Set `target="_blank"` for Terms/Privacy links on `/signup`.
    - Ensure 4.9★ rating is either dynamic or labeled as "Platform Average".

## Technical Tasks
1. [ ] Modify `login/page.tsx` to remove the role toggle and update the redirect logic.
2. [ ] Modify `signup/page.tsx` to fix the role toggle UI and add `target="_blank"` to links.
3. [ ] Update `forgot-password/page.tsx` to include the right-side panel and mask the email.
4. [ ] Add "Remember me" to the login form.
