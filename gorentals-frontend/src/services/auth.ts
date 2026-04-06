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

/** Map backend userType (RENTER/OWNER/ADMIN) → frontend userType */
function mapUserType(backendType: string): Profile['userType'] {
  switch (backendType?.toUpperCase()) {
    case 'OWNER': return 'store_owner';
    case 'ADMIN': return 'admin';
    default:      return 'renter';
  }
}

/** Convert a BackendAuthResponse into a frontend Profile */
export function buildProfile(data: BackendAuthResponse): Profile {
  return {
    id:              data.userId,
    email:           data.email,
    fullName:        data.fullName,
    phone:           null,
    profilePicture:  null,
    userType:        mapUserType(data.userType),
    isActive:        true,
    kycStatus:       'PENDING',
    kycDocumentType: null,
    kycDocumentId:   null,
    kycDocumentUrl:  null,
    city:            null,
    state:           null,
    address:         null,
    pincode:         null,
    createdAt:       new Date().toISOString(),
  };
}

// Helper: sync token to BOTH storage locations
// - 'gr_token' in localStorage → read by Axios interceptor (axios.ts)
// - 'token' cookie           → read by middleware.ts (server-side)
function setToken(token: string) {
  localStorage.setItem('gr_token', token);  // Axios reads this
  localStorage.setItem('token', token);     // Legacy compat
  document.cookie = `token=${token}; path=/; SameSite=Lax; max-age=${60 * 60 * 24 * 7}`;
}

function clearToken() {
  localStorage.removeItem('gr_token');
  localStorage.removeItem('token');
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
    return { error: error.response?.data?.message || error.message || 'Invalid email or password' };
  }
}

export const authService = {
  login: async (data: any): Promise<any> => {
    const response = await api.post('/auth/login', data);
    const token = response.data.token || response.data.accessToken;
    if (token) setToken(token);
    return response.data;
  },

  register: async (data: any): Promise<any> => {
    const response = await api.post('/auth/register', data);
    const token = response.data.token || response.data.accessToken;
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
    return { data: response.data };
  } catch (error: any) {
    return { error: error.response?.data?.message || error.message || 'Failed to create account' };
  }
}

export async function signOut() {
  // JWT is stateless — client clears the token (handled by AuthContext.logout)
  return Promise.resolve();
}
