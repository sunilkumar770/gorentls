import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

// ── Date utilities ────────────────────────────────────────────
export function formatDate(dateString: string | undefined | null): string {
  if (!dateString) return '—';
  return new Date(dateString).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

export function formatDateShort(dateString: string | undefined | null): string {
  if (!dateString) return '—';
  return new Date(dateString).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short',
  });
}

/** Minimum 1 day between start and end */
export function daysBetween(start: Date, end: Date): number {
  const ms = end.getTime() - start.getTime();
  return Math.max(1, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}

/** Returns today's date as YYYY-MM-DD for HTML date input min= */
export function todayISO(): string {
  return new Date().toISOString().split('T')[0];
}

/** Returns tomorrow's date as YYYY-MM-DD */
export function tomorrowISO(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
}

// ── Currency ──────────────────────────────────────────────────
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', maximumFractionDigits: 0,
  }).format(amount ?? 0);
}

// ── Booking date normaliser ───────────────────────────────────
// Backend may send startDate OR checkInDate — always use these helpers.
export function getBookingStart(b: {
  startDate?: string; checkInDate?: string;
}): string {
  return b.startDate ?? b.checkInDate ?? '';
}

export function getBookingEnd(b: {
  endDate?: string; checkOutDate?: string;
}): string {
  return b.endDate ?? b.checkOutDate ?? '';
}

// ── Payment status helpers ────────────────────────────────────
export function isPaid(paymentStatus: string | undefined): boolean {
  return paymentStatus === 'COMPLETED' || paymentStatus === 'PAID';
}

export function isActiveBooking(status: string | undefined): boolean {
  return (
    status === 'CONFIRMED' ||
    status === 'IN_USE'
  );
}

// ── Listing image resolver ────────────────────────────────────
// Backend returns `images: string[] | null` (plain URLs).
// Legacy type had `listing_images: { image_url }[]`.
// This helper normalises both so components never break.
const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80';

export function getListingImage(
  listing: {
    images?: string[] | null;
    listing_images?: { image_url: string; is_primary?: boolean }[];
  } | null | undefined,
): string {
  if (!listing) return FALLBACK_IMAGE;
  if (listing.images && listing.images.length > 0) return listing.images[0];
  if (listing.listing_images && listing.listing_images.length > 0) {
    const primary = listing.listing_images.find(i => i.is_primary);
    return primary?.image_url ?? listing.listing_images[0].image_url;
  }
  return FALLBACK_IMAGE;
}

