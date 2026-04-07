import api from '@/lib/axios';
import type { Booking, BookingStatus, Listing } from '@/types';

// Simplified helper to map the nested ListingResponse to our Listing interface
function mapListingResponseSlim(listingData: any): Listing | undefined {
  if (!listingData) return undefined;
  return {
    id: listingData.id,
    store_id: listingData.store?.id || '',
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
  return {
    id: data.id,
    listingId: data.listing?.id || '',
    storeId: data.owner?.id || '', // Note: In the backend, owner often acts as store identifier in simple flows
    renterId: data.renter?.id || '',
    ownerId: data.owner?.id || '',
    checkInDate: data.startDate,
    checkOutDate: data.endDate,
    rentalCost: data.rentalAmount || 0,
    serviceFee: 0, 
    securityDeposit: data.securityDeposit || 0,
    totalAmount: data.totalAmount || 0,
    status: (data.status || 'PENDING').toUpperCase() as BookingStatus,
    paymentStatus: (data.paymentStatus || 'PENDING').toUpperCase() as any,
    razorpayOrderId: data.razorpayOrderId || null,
    razorpayPaymentId: data.razorpayPaymentId || null,
    createdAt: data.createdAt || new Date().toISOString(),
    listing: mapListingResponseSlim(data.listing)
  };
}

export async function createBooking(booking: {
  listingId: string;
  startDate: string;
  endDate: string;
}): Promise<Booking> {
  const javaRequest = {
    listingId: booking.listingId,
    startDate: booking.startDate,
    endDate: booking.endDate
  };

  const response = await api.post('/bookings', javaRequest);
  return mapBookingResponse(response.data);
}

export async function getRenterBookings(): Promise<Booking[]> {
  try {
    const response = await api.get('/bookings/my-bookings');
    // The backend returns a Page object
    const content = response.data.content || [];
    return content.map(mapBookingResponse);
  } catch (error: any) {
    console.error('Failed to get renter bookings', error);
    return [];
  }
}

export async function getOwnerBookings(): Promise<Booking[]> {
  try {
    const response = await api.get('/bookings/owner/bookings');
    // The backend returns a Page object
    const content = response.data.content || [];
    return content.map(mapBookingResponse);
  } catch (error: any) {
    console.error('Failed to get owner bookings', error);
    return [];
  }
}

export async function acceptBooking(bookingId: string): Promise<Booking> {
  const response = await api.patch(`/bookings/${bookingId}/accept`);
  return mapBookingResponse(response.data);
}

export async function rejectBooking(bookingId: string): Promise<Booking> {
  const response = await api.patch(`/bookings/${bookingId}/reject`);
  return mapBookingResponse(response.data);
}

export async function cancelBooking(bookingId: string): Promise<Booking> {
  const response = await api.patch(`/bookings/${bookingId}/cancel`);
  return mapBookingResponse(response.data);
}

export async function completeBooking(bookingId: string): Promise<Booking> {
  const response = await api.patch(`/bookings/${bookingId}/complete`);
  return mapBookingResponse(response.data);
}
