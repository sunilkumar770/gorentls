// ────────────────────────────────────────────────────────────
// Canonical type definitions — single source of truth for
// all frontend components. Sync with backend enums exactly.
// ────────────────────────────────────────────────────────────

// ── Enums (must match Spring Boot BookingStatus exactly) ─────
export type BookingStatus =
  | 'PENDING'
  | 'ACCEPTED'
  | 'CONFIRMED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'RETURNED'
  | 'CANCELLED'
  | 'REJECTED';

export type PaymentStatus =
  | 'PENDING'
  | 'INITIATED'
  | 'COMPLETED'
  | 'PAID'         // legacy alias — treat same as COMPLETED
  | 'FAILED'
  | 'REFUNDED';

export type UserRole =
  | 'RENTER'
  | 'OWNER'
  | 'ADMIN'
  | 'SUPER_ADMIN';

// ── Image ─────────────────────────────────────────────────────
export interface ListingImage {
  id:             string;
  listing_id?:    string;
  image_url:      string;
  is_primary:     boolean;
  display_order?: number;
}

// ── Store ─────────────────────────────────────────────────────
export interface Store {
  id:                  string;
  owner_id:            string;
  store_name:          string;
  store_description:   string | null;
  store_logo_url:      string | null;
  store_rating:        number;
  store_city:          string | null;
  verification_status: 'verified' | 'pending' | 'rejected';
  is_active:           boolean;
}

// ── User shapes ───────────────────────────────────────────────
export interface UserSummary {
  id:       string;
  fullName: string;
  email:    string;
  phone?:   string;
}

export interface User extends UserSummary {
  role:      UserRole;
  createdAt: string;
}

// ── Listing ───────────────────────────────────────────────────
export interface Listing {
  // ── Identity
  id:        string;
  store_id:  string;
  owner_id:  string;

  // ── Content
  title:        string;
  description:  string | null;
  category:     string;
  subcategory?: string | null;
  brand?:       string | null;
  condition?:   string | null;
  location?:    string;
  address?:     string;
  city?:        string;
  state?:       string;
  type?:        string;

  // ── Pricing
  price_per_day:    number;
  price_per_week?:  number | null;
  price_per_month?: number | null;
  security_deposit: number;

  // ── Status
  is_published: boolean;
  is_available: boolean;

  // ── Stats
  average_rating: number;
  total_reviews:  number;
  total_views:    number;

  // ── Timestamps
  created_at:  string;
  updated_at?: string;

  // ── Relations
  listing_images?: ListingImage[];
  stores?:         Store;
  owner?:          UserSummary;
}

// ── Search filters ────────────────────────────────────────────
export interface SearchFilters {
  category?:  string;
  city?:      string;
  min_price?: number;
  max_price?: number;
  sort?:      'price_asc' | 'price_desc' | 'newest' | 'rating';
  page?:      number;
  size?:      number;
}

// ── BookingListing — lean shape returned inside booking responses ────────────
export interface BookingListing {
  id:              string;
  title:           string;
  city?:           string;
  state?:          string;
  pricePerDay?:    number;
  securityDeposit?: number | null;
  images?:         string[] | null;
  listing_images?: ListingImage[];
  type?:           string;
}

/** @deprecated use Listing instead — keep for backward-compat with existing components */
export type ListingSummary = BookingListing;

// ── Booking ───────────────────────────────────────────────────
// Backend may return startDate/endDate OR checkInDate/checkOutDate.
// Always use getBookingStartDate() / getBookingEndDate() from utils.ts.
export interface Booking {
  id:              string;
  listing:         BookingListing;
  renter:          UserSummary;
  owner:           UserSummary;
  startDate:       string;          // primary field
  endDate:         string;          // primary field
  checkInDate?:    string;          // fallback alias
  checkOutDate?:   string;          // fallback alias
  totalDays:       number;
  rentalAmount:    number;
  securityDeposit: number;
  totalAmount:     number;
  status:          BookingStatus;
  paymentStatus:   PaymentStatus;
  message?:        string;
  razorpayOrderId?:   string;
  razorpayPaymentId?: string;
  createdAt:       string;
  updatedAt:       string;
}

// ── Spring Boot paged response ────────────────────────────────
export interface PagedResponse<T> {
  content:       T[];
  totalPages:    number;
  totalElements: number;
  number:        number;  // 0-indexed current page
  size:          number;
  first:         boolean;
  last:          boolean;
}

// ── Auth ──────────────────────────────────────────────────────
export interface AuthTokens {
  accessToken:  string;
  refreshToken?: string;
  userType:     UserRole;
  userId:       string;
  email:        string;
}

// ─────────────────────────────────────────────────────────────
// Additions: Profile · Notification · Conversation · Message
// ─────────────────────────────────────────────────────────────

// ── User profile ──────────────────────────────────────────────
export interface Profile {
  id:          string;
  fullName:    string;
  email:       string;
  phone?:      string;
  role:        UserRole;
  userType:    UserRole; // Unified field for RBAC
  bio?:        string;
  avatarUrl?:  string;
  profilePicture?: string;
  kycDocumentType?: string;
  kycDocumentId?: string;
  kycDocumentUrl?: string;
  address?: string;
  pincode?: string;
  city?:       string;
  state?:      string;
  kycStatus?:  'NOT_SUBMITTED' | 'PENDING' | 'VERIFIED' | 'REJECTED';
  isActive?:   boolean;
  createdAt:   string;
  updatedAt:   string;
}

// ── Notifications ─────────────────────────────────────────────
export type NotificationType =
  | 'BOOKING_UPDATE'
  | 'PAYMENT'
  | 'MESSAGE'
  | 'KYC_UPDATE'
  | 'SYSTEM';

export interface Notification {
  id:        string;
  userId:    string;
  title:     string;
  message:   string;
  type:      NotificationType;
  isRead:    boolean;
  link?:     string;
  createdAt: string;
}

export interface NotificationPage {
  content:       Notification[];
  totalPages:    number;
  totalElements: number;
  number:        number;
  unreadCount:   number;
}

// ── Messaging ─────────────────────────────────────────────────
export interface ChatMessage {
  id:             string;
  conversationId: string;
  senderId:       string;
  senderName:     string;
  content:        string;
  isRead:         boolean;
  createdAt:      string;
}

export interface Conversation {
  id:             string;
  listingId?:     string;
  listingTitle?:  string;
  listingImage?:  string;
  otherUser:      UserSummary;  // the person you're talking TO
  lastMessage?:   string;
  lastMessageAt?: string;
  unreadCount:    number;
  createdAt:      string;
}
