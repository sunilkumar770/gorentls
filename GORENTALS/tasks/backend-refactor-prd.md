# Product Requirements Document: Backend Quality Improvements

## 1. Goal
Refactor the Java backend services (`BookingService.java` and `AdminService.java`) to adhere to Single Responsibility and DRY principles, improving code quality and maintainability without changing business logic or endpoints.

## 2. Requirements

### 2.1 Refactor `BookingService.java`
- **Goal:** Clean up the "God Method" `updateStatus`.
- **Action:** Replace hardcoded strings (e.g. `"BOOKING_REQUEST"`, `"BOOKING_CANCELLED"`) with a dedicated `NotificationConstants` class or Enum.
- **Action:** Extract the complex state-transition validation inside `updateStatus` into a private helper method `isValidTransition(BookingStatus current, BookingStatus newStatus)`.
- **Action:** Extract the notification-sending logic into a private method `sendPostTransitionNotifications(...)`.
- **Action:** Remove redundant `bookingRepository.findById()` calls at the end of `confirmBooking` and `updateStatus`. Return the `saved` entity directly.

### 2.2 Refactor `AdminService.java`
- **Goal:** Reduce complexity in `getPlatformAnalytics`.
- **Action:** Create a new service `PlatformAnalyticsService.java` and move the `getPlatformAnalytics(...)` logic there.
- **Action:** Inject the necessary repositories into `PlatformAnalyticsService.java`.
- **Action:** Replace hardcoded action strings in `logAction` (e.g., `"VERIFY_USER_KYC"`) with constants.

## 3. User Stories
### US-01: Extract `PlatformAnalyticsService`
- **Description:** Create `src/main/java/com/rentit/service/PlatformAnalyticsService.java`. Move `getPlatformAnalytics` from `AdminService` to this new service. Update the respective controller to use the new service if applicable, or have `AdminService` delegate to it.

### US-02: Refactor `BookingService` State Transitions
- **Description:** Create helper methods in `BookingService.java` for validation and notifications, simplifying `updateStatus` and `confirmBooking` methods. Remove redundant `findById()` queries on returning saved objects.

## 4. Technical Constraints
- Do not change API request/response DTO signatures.
- Keep the `@Transactional` annotations intact.
- Make sure to update any imports.
