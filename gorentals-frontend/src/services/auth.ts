import api from '@/lib/axios';
import type { Profile } from '@/types';

// Shape the backend actually returns
export interface BackendAuthResponse {
  accessToken: string;
  refreshToken?: string;
  userType: string;   // 'RENTER' | 'OWNER' | 'ADMIN'
  email: string;
  fullName: string;
  userId: string;
}

/** Map backend userType (RENTER/OWNER/ADMIN) → frontend user_type */
function mapUserType(backendType: string): Profile['user_type'] {
  switch (backendType?.toUpperCase()) {
    case 'OWNER': return 'store_owner';
    case 'ADMIN': return 'admin';
    default:      return 'renter';
  }
}

/** Convert a BackendAuthResponse into a frontend Profile */
export function buildProfile(data: BackendAuthResponse): Profile {
  return {
    id:                  data.userId,
    email:               data.email,
    full_name:           data.fullName,
    phone_number:        null,
    avatar_url:          null,
    user_type:           mapUserType(data.userType),
    kyc_verified:        false,
    verification_status: 'unverified',
    city:                null,
    state:               null,
    created_at:          new Date().toISOString(),
  };
}

export async function signIn(
  email: string,
  password: string
): Promise<{ data?: BackendAuthResponse; error?: string }> {
  try {
    const response = await api.post<BackendAuthResponse>('/auth/login', { email, password });
    return { data: response.data };
  } catch (error: any) {
    return { error: error.response?.data?.message || 'Invalid email or password' };
  }
}

export async function signUp(
  email: string,
  password: string,
  fullName: string,
  phone: string,
  userType: 'RENTER' | 'OWNER' = 'RENTER'
): Promise<{ data?: BackendAuthResponse; error?: string }> {
  try {
    const response = await api.post<BackendAuthResponse>('/auth/register', {
      email,
      password,
      fullName,
      phone,
      userType,
    });
    return { data: response.data };
  } catch (error: any) {
    return { error: error.response?.data?.message || error.message || 'Failed to create account' };
  }
}

export async function signOut() {
  // JWT is stateless — client clears the token (handled by AuthContext.logout)
  return Promise.resolve();
}
