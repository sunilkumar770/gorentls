import api from '@/lib/axios';
import type { Booking, BookingStatus, Listing } from '@/types';

// Simplified helper to map the nested ListingResponse to our Listing interface
// It just extracts the basics needed for the bookings UI display
function mapListingResponseSlim(listingData: any): Listing | undefined {
  if (!listingData) return undefined;
  return {
    id: listingData.id,
    store_id: listingData.owner?.id || '',
    owner_id: listingData.owner?.id || '',
    title: listingData.title,
    description: listingData.description,
    category: listingData.category,
    subcategory: listingData.type,
    brand: null,
    condition: 'good',
    price_per_day: listingData.pricePerDay || 0,
    price_per_week: null,
    price_per_month: null,
    security_deposit: listingData.securityDeposit || 0,
    is_published: listingData.isPublished,
    is_available: listingData.isAvailable,
    average_rating: listingData.totalRatings || 0,
    total_reviews: listingData.ratingCount || 0,
    total_views: 0,
    created_at: listingData.createdAt || new Date().toISOString(),
    listing_images: (listingData.images || []).map((url: string, index: number) => ({
      id: `${listingData.id}-img-${index}`,
      listing_id: listingData.id,
      image_url: url,
      is_primary: index === 0,
      display_order: index,
    }))
  };
}

function mapBookingResponse(data: any): Booking {
  // Map Java status to TS BookingStatus
  let status: BookingStatus = 'pending_confirmation';
  const javaStatus = (data.status || '').toUpperCase();
  if (javaStatus === 'CONFIRMED') status = 'confirmed';
  if (javaStatus === 'REJECTED') status = 'owner_rejected';
  if (javaStatus === 'CANCELLED') status = 'renter_cancelled';
  if (javaStatus === 'COMPLETED') status = 'completed';

  let paymentStatus: any = 'pending';
  const javaPayment = (data.paymentStatus || '').toUpperCase();
  if (javaPayment === 'COMPLETED' || javaPayment === 'COMPLETED_OFFLINE') paymentStatus = 'completed';
  if (javaPayment === 'FAILED') paymentStatus = 'failed';

  return {
    id: data.id,
    listing_id: data.listing?.id || '',
    store_id: data.owner?.id || '',
    renter_id: data.renter?.id || '',
    owner_id: data.owner?.id || '',
    check_in_date: data.startDate,
    check_out_date: data.endDate,
    rental_cost: data.rentalAmount || 0,
    service_fee: 0, // Not explicitly from Java yet
    security_deposit: data.securityDeposit || 0,
    total_amount: data.totalAmount || 0,
    booking_status: status,
    payment_status: paymentStatus,
    razorpay_order_id: data.razorpayOrderId || null,
    razorpay_payment_id: data.razorpayPaymentId || null,
    created_at: data.createdAt || new Date().toISOString(),
    listings: mapListingResponseSlim(data.listing)
  };
}

export async function createBooking(booking: {
  listing_id: string;
  store_id: string;
  owner_id: string;
  renter_id: string;
  check_in_date: string;
  check_out_date: string;
  rental_cost: number;
  service_fee: number;
  security_deposit: number;
  total_amount: number;
}): Promise<Booking> {
  const javaRequest = {
    listingId: booking.listing_id,
    startDate: booking.check_in_date,
    endDate: booking.check_out_date
  };

  const response = await api.post('/bookings', javaRequest);
  return mapBookingResponse(response.data);
}

export async function getRenterBookings(renterId: string): Promise<Booking[]> {
  try {
    const response = await api.get('/bookings/my-bookings');
    const content = response.data.content || [];
    return content.map(mapBookingResponse);
  } catch (error) {
    console.error('Failed to get renter bookings', error);
    return [];
  }
}

export async function getOwnerBookings(ownerId: string): Promise<Booking[]> {
  try {
    const response = await api.get('/bookings/owner/bookings');
    const content = response.data.content || [];
    return content.map(mapBookingResponse);
  } catch (error) {
    console.error('Failed to get owner bookings', error);
    return [];
  }
}

export async function updateBookingPayment(
  bookingId: string,
  razorpayOrderId: string,
  razorpayPaymentId: string
) {
  // We need to implement an endpoint for verifying razorpay in java. 
  // Currently we just patch the generic complete/accept if required, or let payment service handle it.
  console.warn('updateBookingPayment not fully integrated with Java backend payment verification.');
}
