# PRD: Stores Module Final Verification

## Goal
Verify that the Stores page correctly aggregates real listing data, owner-filtered search works as expected, and the listing detail page links to the correct store-filtered view.

## User Stories
- **US-001**: As a user, I can visit /stores and see a list of owners who have active listings.
- **US-002**: As a user, I can click "Visit Store" and see only listings owned by that owner on the search page.
- **US-003**: As a user, I can click "View Store" from a listing detail page and be taken to the owner's filtered search results.

## Technical Requirements
- Use `getListings` with `ownerId` parameter for search filtering.
- Ensure `mapListingResponse` provides consistent `owner` and `ownerId` fields.
- Verify backend `ListingRepository` correctly handles `ownerId` without 400 errors.
