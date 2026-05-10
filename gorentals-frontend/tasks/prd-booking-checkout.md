# PRD: Booking & Checkout Redesign

## Goal
Redesign the booking flow and checkout summary pages to match the GoRentals Premium Marketplace aesthetic.

## User Stories

### US-001: Implement Booking Flow Page (/book)
**As a user, I want to select rental dates and shipping options for an item.**
- Display item summary card (thumbnail, title, owner, location, condition).
- Display rate (₹X/day).
- Date picker for start/end dates.
- Auto-calculate duration (e.g., "3 days").
- Price breakdown: rate × days.
- Shipping options (Standard, Express, Next Day).
- "Proceed to Checkout" button.

### US-002: Implement Checkout Summary Page (/checkout)
**As a user, I want to review my order and select a payment method.**
- Breadcrumb back to `/book`.
- Order summary (item, seller, dates, rental period).
- Price breakdown with deposit and total (including strikethrough original price).
- Payment methods: PhonePe, Razorpay.
- "Confirm & Pay" button.

## Design Constraints
- Indigo-primary (#4F46E5).
- "No-Line" visual philosophy.
- Two-panel layout where applicable.
- Premium, editorial typography (Satoshi/Inter).

## Technical Requirements
- Next.js page components.
- Tailored vanilla CSS or utility classes (following existing patterns).
- Static mock data.
