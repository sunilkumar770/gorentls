import api from '@/lib/axios';
import type { Profile, UserRole } from '@/types';

// Shape the backend actually returns
export interface BackendAuthResponse {
  accessToken: string;
  refreshToken?: string;
  userType: string;   // 'RENTER' | 'OWNER' | 'ADMIN'
  email: string;
  fullName: string;
  userId: string;
}

/** 
 * Normalizes the backend auth response into a consistent frontend Profile shape.
 * Backend may return: role | userType, name | fullName, id | userId
 */
export function buildProfile(data: Partial<Profile> & Record<string, unknown>): Profile {
  const rawType: string = (data.userType as string) ?? (data.role as string) ?? '';
  const userType = rawType.replace(/^ROLE_/, '').toUpperCase();

  return {
    id:              (data.id as string)       ?? (data.userId as string)    ?? '',
    fullName:        (data.fullName as string) ?? (data.name as string)      ?? '',
    email:           data.email    ?? '',
    phone:           data.phone    ?? (data.phoneNumber as string) ?? '',
    role:            userType as UserRole,
    userType:        userType as UserRole,
    kycStatus:       data.kycStatus ?? 'PENDING',
    isActive:        data.isActive ?? true,
    isVerified:      data.isVerified ?? (data.verified as boolean) ?? false,
    createdAt:       data.createdAt ?? new Date().toISOString(),
    updatedAt:       data.updatedAt ?? new Date().toISOString(),
  } as Profile;
}

/** Cookie max-age = 7 days in seconds */
const TOKEN_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;

/**
 * Write the JWT to BOTH localStorage and a cookie so that:
 *  - Client-side Axios interceptor can read from localStorage
 *  - Next.js middleware (proxy.ts) can read from the cookie
 *
 * The Secure flag is applied in production to prevent cookie
 * transmission over HTTP (required for HTTPS deployments).
 */
export function setToken(token: string): void {
  localStorage.setItem('gr_token', token);

  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  document.cookie = `token=${token}; path=/; SameSite=Lax; max-age=${TOKEN_COOKIE_MAX_AGE}${secure}`;
}

/**
 * Remove the JWT from all storage locations.
 * Call this on logout, 401, or session expiry.
 */
export function clearToken(): void {
  localStorage.removeItem('gr_token');
  localStorage.removeItem('gr_user');
  document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; SameSite=Lax';
}

export async function signIn(
  email: string,
  password: string
): Promise<{ data?: BackendAuthResponse; error?: string }> {
  try {
    const response = await api.post<BackendAuthResponse>('/auth/login', { email, password });
    const token = response.data.accessToken;
    if (token) setToken(token);
    return { data: response.data };
  } catch (error: any) {
    const msg =
      error.response?.data?.message ??
      error.response?.data?.error   ??
      error.response?.statusText    ??
      error.message                 ??
      'Login failed. Please try again.';
    return { error: msg };
  }
}

/** 
 * Legacy alias for signIn to match user provided snippet 
 */
export const loginUser = signIn;

/**
 * Admin login specifically for the /auth/admin-login endpoint.
 */
export async function adminSignIn(
  email: string,
  password: string
): Promise<{ data?: BackendAuthResponse; error?: string }> {
  try {
    const response = await api.post<BackendAuthResponse>('/auth/admin-login', { email, password });
    const token = response.data.accessToken;
    if (token) setToken(token);
    return { data: response.data };
  } catch (error: any) {
    const msg =
      error.response?.data?.message ??
      error.response?.data?.error   ??
      error.response?.statusText    ??
      error.message                 ??
      'Admin login failed.';
    return {
      error: msg,
    };
  }
}

/** 
 * Legacy alias for adminSignIn to match user provided snippet 
 */
export const loginAdmin = adminSignIn;

export const authService = {
  login: async (data: Record<string, unknown>): Promise<BackendAuthResponse> => {
    const response = await api.post<BackendAuthResponse>('/auth/login', data);
    const token = response.data.accessToken;
    if (token) setToken(token);
    return response.data;
  },

  register: async (data: Record<string, unknown>): Promise<BackendAuthResponse> => {
    const response = await api.post<BackendAuthResponse>('/auth/register', data);
    const token = response.data.accessToken;
    if (token) setToken(token);
    return response.data;
  },

  getProfile: async (): Promise<Profile> => {
    const response = await api.get('/users/me');
    return response.data;
  },

  logout: () => {
    clearToken();
  }
};

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
    // FIX: store token on registration — same as signIn()
    const token = response.data.accessToken;
    if (token) setToken(token);
    return { data: response.data };
  } catch (error: any) {
    return { error: error.response?.data?.message || error.message || 'Failed to create account' };
  }
}
