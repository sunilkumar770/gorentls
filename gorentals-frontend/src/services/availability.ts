import api from '@/lib/axios';
import { AvailabilityResponse } from '@/types';

export async function getAvailability(listingId: string): Promise<AvailabilityResponse> {
  const res = await api.get<AvailabilityResponse>(`/listings/${listingId}/availability`);
  return res.data;
}

export async function blockDates(
  listingId: string,
  startDate: string,
  endDate: string,
): Promise<void> {
  await api.post(`/listings/${listingId}/block-dates`, { startDate, endDate });
}

export async function unblockDates(listingId: string, blockId: string): Promise<void> {
  await api.delete(`/listings/${listingId}/block-dates/${blockId}`);
}
