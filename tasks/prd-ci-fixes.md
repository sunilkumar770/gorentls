# PRD - Final Hardening & CI Fixes

## User Stories

### US-001: Backend Test Stability
- **Requirement**: Create `GORENTALS/src/main/resources/application-test.yml` with H2 `create-drop` and disabled Flyway.
- **Acceptance Criteria**: Backend tests boot using H2 without schema validation errors.

### US-002: BookingRepository Restoration
- **Requirement**: Add `@Repository` to `BookingRepository.java` and implement `existsConflictingBooking`.
- **Acceptance Criteria**: Code compiles and `ListingService` can call the new method.

### US-003: Docker Compose Cleanup
- **Requirement**: Fix Redis hostname typo in `docker-compose.yml`.
- **Acceptance Criteria**: `SPRING_DATA_REDIS_HOST` is set to `redis`.

### US-004: Frontend Component Integration
- **Requirement**: Update all imports of `DashboardNav` to default syntax and remove `user` prop.
- **Acceptance Criteria**: Frontend builds and lints successfully.

## Verification
- Run `./mvnw clean test -Dspring.profiles.active=test`
- Run `npm run lint` and `npm run build` in frontend.
