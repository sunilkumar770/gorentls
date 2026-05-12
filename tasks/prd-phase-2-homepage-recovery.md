# PRD: Phase 2 — Homepage Recovery & Trust Rebuild

## Goal
Stabilize the GoRentals homepage by removing fabricated metrics and "Smoke Test" data, and implementing a premium Indigo-based design system that prioritizes user trust and conversion.

## Requirements

### 1. Design System Refresh
- Replace current color palette with a premium Indigo theme (#4f46e5).
- Implement a consistent typography hierarchy (Hero H1, Section H2, Card Title/Price).
- Use a 2-level button hierarchy (Primary Indigo, Ghost Slate).

### 2. Homepage Rebuild
- **Hero Section**: Headline "Rent smarter. Own less." with a location anchor ("Hyderabad, India").
- **Category Grid**: Remove hardcoded/fake item counts. Clean icon-based navigation.
- **Listing Grid**: 
  - Filter out any listing containing "Smoke" or "Test" (case-insensitive).
  - Implement a high-quality empty state ("Be the first to list") if no real listings exist.
- **Trust Band**: Replace cosmetic badges with honest, infrastructure-focused descriptions (KYC, Escrow, etc.).
- **Owner CTA**: Add a mid-page "Have gear collecting dust?" onboarding band.

### 3. Data Sanitization
- Execute a deep SQL purge to remove "Smoke Test" items, owners, and associated broken records (Bookings, Payments).

### 4. Technical Implementation
- Use Next.js 14 Server Components for the main layout.
- Ensure all images use `ImageWithFallback` or high-quality placeholders.
- Fix Navbar session hydration issues.

## User Stories
- **US-001**: As a renter, I want to see a clean, professional homepage so that I feel safe renting high-value gear.
- **US-002**: As an owner, I want to see a clear path to list my gear so that I can start earning immediately.
- **US-003**: As a developer, I want the database to be free of junk data so that my test suites are reliable.
