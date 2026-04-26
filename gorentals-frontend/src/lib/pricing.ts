// src/lib/pricing.ts
// ─────────────────────────────────────────────────────────────────────────────
// GoRentals Pricing Engine
// Single source of truth for all price quote calculations on the frontend.
// Backend (Java PricingCalculator.java) mirrors this logic exactly.
// Both use HALF_UP rounding to 2 decimal places — totals are always identical.
// ─────────────────────────────────────────────────────────────────────────────

export const PRICING_CONFIG = {
  GST_RATE:          0.18,  // 18% GST on base rental
  PLATFORM_FEE_RATE: 0.05,  // 5% platform fee on base rental (Phase 1)
  OWNER_COMMISSION:  0.00,  // 0% owner commission (Phase 1)
} as const;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PriceBreakdownLine {
  label:    string;
  amount:   number;
  isBold?:  boolean;
  isGreen?: boolean;
  isNote?:  string;  // e.g. "(refundable)"
}

export interface Phase1Quote {
  /** Base rental: days × price_per_day */
  base:        number;
  /** 18% GST on base */
  gst:         number;
  /** 5% platform fee on base */
  platformFee: number;
  /** Security deposit (refundable, added on top) */
  deposit:     number;
  /** Total renter pays: base + gst + fee + deposit */
  total:       number;
  /** Owner receives: base + deposit (0% commission Phase 1) */
  ownerPayout: number;
  /** Pre-built breakdown lines for <PriceBreakdown /> */
  breakdown:   PriceBreakdownLine[];
}

export interface Phase2Quote {
  base:            number;
  gstOnBase:       number;
  userPlatformFee: number;
  gstOnUserFee:    number;
  ownerCommission: number;
  deposit:         number;
  totalUserPays:   number;
  ownerPayout:     number;
  breakdown:       PriceBreakdownLine[];
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

/** Round to 2dp HALF_UP — matches Java BigDecimal.setScale(2, HALF_UP).
 *  NOTE: do NOT use Number.EPSILON here — it can cause incorrect rounding
 *  for values like 1.005. Plain multiplication is correct for currency inputs. */
function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Guard: NaN / Infinity / negative → 0 */
function safePositive(n: number): number {
  return Number.isFinite(n) && n > 0 ? n : 0;
}

// ─── Phase 1: fixed rates ─────────────────────────────────────────────────────

/**
 * Calculate a Phase 1 price quote.
 *
 * @param baseRental  days × price_per_day (NOT including deposit)
 * @param deposit     security deposit (refundable)
 *
 * GST         = 18% of baseRental
 * platformFee = 5%  of baseRental
 * total       = base + gst + fee + deposit
 * ownerPayout = base + deposit  (no commission)
 */
export function calcQuotePhase1(
  baseRental: number,
  deposit: number = 0,
): Phase1Quote {
  const base = safePositive(baseRental);
  const dep  = safePositive(deposit);

  const gst         = round2(base * PRICING_CONFIG.GST_RATE);
  const platformFee = round2(base * PRICING_CONFIG.PLATFORM_FEE_RATE);
  const total       = round2(base + gst + platformFee + dep);
  const ownerPayout = round2(base + dep);

  const breakdown: PriceBreakdownLine[] = [
    { label: 'Rental amount',     amount: base },
    { label: 'GST (18%)',         amount: gst },
    { label: 'Platform fee (5%)', amount: platformFee },
    ...(dep > 0
      ? [{ label: 'Security deposit', amount: dep, isNote: '(refundable)' }]
      : []),
    { label: 'Total payable', amount: total, isBold: true, isGreen: true },
  ];

  return { base, gst, platformFee, deposit: dep, total, ownerPayout, breakdown };
}

// ─── Phase 2: configurable ────────────────────────────────────────────────────

/**
 * Phase 2 — configurable rates. Activate after 3 months.
 * Backwards-compatible: pass (base, 0.05, 0.00) for Phase 1 behaviour.
 *
 * @param baseRental   days × price_per_day
 * @param userFeePct   platform fee rate to renter  (0.05 = 5%)
 * @param ownerFeePct  commission rate from owner    (0.10 = 10%)
 * @param deposit      security deposit
 */
export function calcQuotePhase2(
  baseRental: number,
  userFeePct: number,
  ownerFeePct: number,
  deposit: number = 0,
): Phase2Quote {
  const base    = safePositive(baseRental);
  const dep     = safePositive(deposit);
  const uFee    = Math.max(0, userFeePct);
  const oFee    = Math.max(0, ownerFeePct);

  const gstOnBase       = round2(base * PRICING_CONFIG.GST_RATE);
  const userPlatformFee = round2(base * uFee);
  const gstOnUserFee    = round2(userPlatformFee * PRICING_CONFIG.GST_RATE);
  const ownerCommission = round2(base * oFee);

  const totalUserPays = round2(base + gstOnBase + userPlatformFee + gstOnUserFee + dep);
  const ownerPayout   = round2(base - ownerCommission + dep);

  const breakdown: PriceBreakdownLine[] = [
    { label: 'Rental amount',           amount: base },
    { label: 'GST on rental (18%)',     amount: gstOnBase },
    ...(userPlatformFee > 0
      ? [{ label: `Platform fee (${(uFee * 100).toFixed(0)}%)`, amount: userPlatformFee }]
      : []),
    ...(gstOnUserFee > 0
      ? [{ label: 'GST on platform fee (18%)', amount: gstOnUserFee }]
      : []),
    ...(dep > 0
      ? [{ label: 'Security deposit', amount: dep, isNote: '(refundable)' }]
      : []),
    { label: 'Total payable', amount: totalUserPays, isBold: true, isGreen: true },
  ];

  return {
    base, gstOnBase, userPlatformFee, gstOnUserFee,
    ownerCommission, deposit: dep, totalUserPays, ownerPayout, breakdown,
  };
}

// ─── Convenience wrapper ──────────────────────────────────────────────────────

/**
 * Calculate rental quote directly from listing data.
 * Use on item detail page for live preview before booking.
 */
export function calcRentalQuote(
  pricePerDay: number,
  days: number,
  deposit: number = 0,
): Phase1Quote {
  const base = round2(safePositive(pricePerDay) * Math.max(0, Math.floor(days)));
  return calcQuotePhase1(base, deposit);
}

// ─── Formatting ───────────────────────────────────────────────────────────────

/** Format as ₹1,23,456.78 (Indian locale) */
export function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/** Format as ₹1,23,456 (Indian locale, no paise) */
export function formatINRInt(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}
