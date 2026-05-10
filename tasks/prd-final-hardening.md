# PRD: Final Production Hardening & Frontend Resiliency

## Goal
Complete the production hardening of the GoRentals platform by addressing the remaining frontend vulnerabilities and ensuring full integration of the newly implemented backend safety features.

## Requirements

### 1. Frontend Resiliency (Auth & Storage)
- **Task**: Replace all direct `localStorage` access in the React application with the `safeStorage` wrapper.
- **File**: `gorentals-frontend/src/contexts/AuthContext.tsx`
- **Logic**: Use `safeStorage.getItem('gr_token')` instead of `localStorage.getItem('gr_token')`.
- **Reasoning**: Protect against `SecurityError` in private browsing or sandboxed environments.

### 2. JWT & Auth Stability
- **Task**: Ensure the frontend handles the 401 Unauthorized responses from the `refreshToken` endpoint correctly.
- **Logic**: If `api.post('/auth/refresh')` returns 401, trigger a full logout and redirect to `/login?reason=session_expired`.

### 3. User Settings Persistence
- **Task**: Verify that the "Settings" page in the frontend actually calls `updateSettings` and that the backend properly saves these to the `user_settings` table.
- **Verification**: Check `UserService.java` and `UserSettingsRepository`.

### 4. Background Services
- **Task**: Ensure `@EnableScheduling` is added to the Spring Boot main class to activate `RefundRetryService`.

## User Stories
- **US-001**: As a developer, I want all storage access to be safe from browser-level permission errors so the app doesn't crash.
- **US-002**: As a user, I want my session to be correctly cleared if my token expires, rather than seeing a 500 error.
- **US-003**: As a renter, I want my refund to be processed automatically even if the initial attempt fails.
