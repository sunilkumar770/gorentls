# PRD: Backend Stability & Search API Fix

## Goal
Verify the implementation of the `PagedResponse` DTO and the serialization of listing search results.

## Requirements
- [x] Create `PagedResponse.java` DTO.
- [x] Refactor `ListingResponse` and `UserResponse` with Lombok to ensure Jackson compatibility.
- [x] Update `ListingService` and `ListingController` to use `PagedResponse`.
- [ ] Run a test simulation to ensure `/api/listings/search` returns a valid JSON structure.

## Verification
- Run `mvnw compile`.
- Ensure no Lombok "cannot find symbol" errors.
