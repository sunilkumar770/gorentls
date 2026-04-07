export type UserType = 'OWNER' | 'RENTER' | 'ADMIN';

export interface Profile {
  id: string;
  email: string;
  fullName: string | null;
  phone: string | null;
  profilePicture: string | null;
  userType: UserType | null;
  isActive: boolean;
  kycStatus: 'PENDING' | 'SUBMITTED' | 'APPROVED' | 'REJECTED';
  kycDocumentType: string | null;
  kycDocumentId: string | null;
  kycDocumentUrl: string | null;
  city: string | null;
  state: string | null;
  address: string | null;
  pincode: string | null;
  createdAt: string;
}

export interface Store {
  id: string;
  owner_id: string;
  store_name: string;
  store_description: string | null;
  store_logo_url: string | null;
  store_rating: number;
  store_city: string | null;
  verification_status: 'pending' | 'verified' | 'suspended' | 'rejected';
  is_active: boolean;
}

export interface ListingImage {
  id: string;
  listing_id: string;
  image_url: string;
  is_primary: boolean;
  display_order: number;
}

export interface Listing {
  id: string;
  store_id: string;
  owner_id: string;
  title: string;
  description: string | null;
  category: string;
  subcategory: string | null;
  brand: string | null;
  condition: 'like_new' | 'excellent' | 'good' | 'fair';
  price_per_day: number;
  price_per_week: number | null;
  price_per_month: number | null;
  security_deposit: number;
  is_published: boolean;
  is_available: boolean;
  average_rating: number;
  total_reviews: number;
  total_views: number;
  created_at: string;
  listing_images?: ListingImage[];
  stores?: Store;
}

export type BookingStatus =
  | 'pending_confirmation'
  | 'confirmed'
  | 'renter_cancelled'
  | 'owner_rejected'
  | 'ready_for_pickup'
  | 'in_progress'
  | 'returned'
  | 'completed'
  | 'disputed';

export interface Booking {
  id: string;
  listing_id: string;
  store_id: string;
  renter_id: string;
  owner_id: string;
  check_in_date: string;
  check_out_date: string;
  rental_cost: number;
  service_fee: number;
  security_deposit: number;
  total_amount: number;
  booking_status: BookingStatus;
  payment_status: 'pending' | 'completed' | 'failed' | 'refunded';
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
  created_at: string;
  listings?: Listing;
}

export interface SearchFilters {
  query?: string;
  category?: string;
  city?: string;
  min_price?: number;
  max_price?: number;
  start_date?: string;
  end_date?: string;
  sort?: 'newest' | 'price_asc' | 'price_desc' | 'rating';
}
