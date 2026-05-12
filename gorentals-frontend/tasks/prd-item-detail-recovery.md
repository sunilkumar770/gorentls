# PRD: Phase 1 — Item Detail Page Recovery

## 1. Objective
Rebuild the item detail page from a broken client-side component into a professional, server-side rendered marketplace page with high conversion signals.

## 2. Technical Stack
- **Framework:** Next.js (App Router, Server Components)
- **Fetching:** Standard `fetch` API for server-side data retrieval.
- **Styling:** Tailwind CSS with semantic tokens (`bg-card`, `text-text`, etc.).
- **Icons:** Lucide React.
- **Utils:** `date-fns`, `@/lib/utils`.

## 3. Scope of Work

### A. New Route Structure
- **Path:** `src/app/item/[id]`
- **Files:**
  - `page.tsx`: Async server component for data fetching and layout assembly.
  - `loading.tsx`: Pulse skeleton state.
  - `error.tsx`: Error boundary for fetch failures.
  - `not-found.tsx`: 404 state for invalid IDs.

### B. Core Page Logic (`page.tsx`)
- Fetch listing data from `${process.env.NEXT_PUBLIC_API_URL}/items/${id}` (corrected from `/api/api/items`).
- Use `notFound()` on fetch failure.
- Implement responsive 2:1 column grid on desktop, single column on mobile.

### C. Components to Create
1. **`src/components/item/ItemGallery.tsx`**: Multi-image slider/grid with `ImageWithFallback`.
2. **`src/components/item/ItemPricingBlock.tsx`**: Transparency-first breakdown (Base + 5% Fee + Deposit).
3. **`src/components/item/ItemBookingPanel.tsx`**: Date picker with progressive state: "Check Availability" → "Book Now".
4. **`src/components/item/ItemOwnerCard.tsx`**: Profile info with KYC verification badge.
5. **`src/components/item/ItemTrustBlock.tsx`**: Escrow and verified condition messaging.
6. **`src/components/item/ItemReviews.tsx`**: Placeholder/List for item reviews.
7. **`src/components/item/ItemSpecsCard.tsx`**: Categorized specs and condition.
8. **`src/components/ui/ImageWithFallback.tsx`**: Prevents broken images by using category icons.

### D. Cleanup
- Remove the legacy `src/app/(public)/item/[id]/page.tsx`.

## 4. User Stories
- **US-001:** As a user, I want a fast-loading page with a skeleton state so I don't see a blank screen.
- **US-002:** As a user, I want to see a transparent price breakdown so I know exactly what I'm paying.
- **US-003:** As a user, I want to know if the owner is verified (KYC) to build trust.
- **US-004:** As a user, I want a clear path to book the item with a reactive availability check.

## 5. Implementation Code Snippets
[Use the specific code snippets provided in the user's report for the Page, Loading, Error, and Fallback components.]
