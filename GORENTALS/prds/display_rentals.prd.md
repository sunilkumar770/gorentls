# Display Renter Bookings & Favorites

## Overview
The renter needs to see their bookings and favorite items on the **My Rentals** page (`http://localhost:3000/dashboard`).

## User Stories
### US-001: Backend API for Bookings
- **Goal**: Ensure the `/api/bookings/my-bookings` endpoint correctly returns a `List<BookingDto>` for the currently authenticated user (renter).
- **Implementation Details**:
  - Update `BookingController.java` mapped to `/api/bookings/my-bookings` to use `@AuthenticationPrincipal UserDetails` or similar to get the current user ID.
  - Call `BookingService.getMyBookings(userId)`.
  - Add Graphify memory call: `GraphifyCache.addBookings(userId, bookings)` if Graphify is available.

### US-002: Backend API for Favorites
- **Goal**: Create a backend feature to manage user favorite listings.
- **Implementation Details**:
  - Add `V16__add_favorites_table.sql` migration script: `CREATE TABLE favorites (id BIGSERIAL PRIMARY KEY, user_id BIGINT NOT NULL, listing_id BIGINT NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, UNIQUE(user_id, listing_id));`
  - Create `Favorite.java` entity, `FavoriteDto.java`, `FavoriteRepository.java`, `FavoriteService.java`, and `FavoriteController.java`.
  - Expose `GET /api/favorites/my-favorites` (returns `List<FavoriteDto>`).
  - Expose `POST /api/favorites/{listingId}` to add a favorite.
  - Expose `DELETE /api/favorites/{listingId}` to remove a favorite.
  - All endpoints should be secured for the current authenticated user.

### US-003: Frontend My Rentals Page
- **Goal**: Update the frontend My Rentals page (`src/app/(protected)/dashboard/page.tsx`) to fetch and display the data.
- **Implementation Details**:
  - Create `useFavorites.ts` hook similar to `useBookings.ts` to call `/api/favorites/my-favorites`.
  - Update `useBookings.ts` to call `/api/bookings/my-bookings`.
  - Display two sections in `page.tsx`: "Your Bookings" and "Your Favorites".
  - Use `ListingGrid.tsx` or similar component to render the cards.

### US-004: Frontend Add/Remove Favorite Action
- **Goal**: Allow users to toggle favorites on items.
- **Implementation Details**:
  - Update `ItemCard.tsx` or the item detail page to show a favorite icon (heart/star).
  - Add `onClick` handler to toggle favorite status by calling the POST/DELETE endpoints.
  
## Success Criteria
- [ ] User logs in, books an item, and it shows in "Your Bookings".
- [ ] User clicks favorite on an item, and it shows in "Your Favorites".
- [ ] Backend tests for the new Favorite endpoints pass.
