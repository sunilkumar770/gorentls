// src/lib/auth.ts
import { cookies } from 'next/headers'
import { Profile } from '@/types'

export async function getCurrentUser(): Promise<Profile | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get('gorentals_token')?.value

  if (!token) return null

  try {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8080';
    const baseUrl = apiBaseUrl.endsWith('/api') ? apiBaseUrl : `${apiBaseUrl}/api`;
    console.log(`[getCurrentUser] Fetching user from backend: ${baseUrl}/users/me`);
    const res = await fetch(`${baseUrl}/users/me`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    })
    console.log(`[getCurrentUser] Backend response status: ${res.status}`);
    if (!res.ok) {
      console.warn(`[getCurrentUser] Failed to fetch user: ${res.status}`);
      return null
    }
    const data = await res.json()
    
    // Convert backend response to Profile type
    return {
      id: data.userId || data.id,
      fullName: data.fullName || data.name || 'User',
      email: data.email,
      phone: data.phone || '',
      userType: (data.userType || data.role || 'RENTER').replace('ROLE_', '') as any,
      role: (data.userType || data.role || 'RENTER').replace('ROLE_', '') as any,
      kycStatus: data.kycStatus || (data.isVerified ? 'APPROVED' : 'NOT_SUBMITTED'),
      isVerified: data.isVerified || data.verified || false,
      storeName: data.storeName || data.businessName,
      profilePicture: data.profilePicture || data.avatarUrl,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      address: data.address,
      city: data.city,
      state: data.state,
      pincode: data.pincode,
      dateOfBirth: data.dateOfBirth,
      autoApproveBookings: data.autoApproveBookings || false
    }
  } catch (error) {
    console.error('[getCurrentUser] Error:', error);
    return null
  }
}
