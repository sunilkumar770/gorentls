# PRD: Frontend Stabilization and Backend Sync

## Goal
Stabilize the GoRentals frontend by implementing resilience patterns (Error Boundaries), standardized API handling, and ensuring data consistency with the Spring Boot backend.

## User Stories

### US-001: Implement Error Boundaries
- **Task**: Wrap the `DashboardPage` and other major layouts in React Error Boundaries using `react-error-boundary`.
- **Reason**: Prevent the entire app from crashing if a rendering error occurs in a sub-component (like the refactored dashboard sections).
- **Acceptance Criteria**:
  - `error.tsx` pages exist for critical routes.
  - A fallback UI is shown when a component crashes.
  - "Try Again" functionality re-triggers data fetching.

### US-002: Standardize API Error Handling
- **Task**: Create a utility or hook to handle Spring Boot error responses consistently.
- **Reason**: Spring Boot returns structured errors (`timestamp`, `message`, etc.). The frontend should display these user-friendly messages via `toast`.
- **Acceptance Criteria**:
  - Axios/Fetch interceptor handles `401`, `403`, and `400` errors globally.
  - Toast notifications display the `message` field from the backend response.

### US-003: Date/Time Consistency
- **Task**: Audit and fix date parsing in the Dashboard and Booking cards.
- **Reason**: Backend uses ISO 8601. Frontend must parse these consistently to avoid "Invalid Date".
- **Acceptance Criteria**:
  - All date displays use a centralized `formatDate` utility.
  - `formatDate` handles nulls and various ISO formats safely.

### US-004: Form Validation Parity
- **Task**: Ensure frontend forms (like registration) have validation rules matching the backend's Bean Validation (`@NotBlank`, `@Email`, etc.).
- **Reason**: Reduce unnecessary round-trips for basic input errors.
- **Acceptance Criteria**:
  - Registration and profile update forms have client-side validation.
