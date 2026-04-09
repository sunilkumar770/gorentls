import api from '@/lib/axios';
import type { Profile, UserType } from '@/types';

// Shape the backend actually returns
export interface BackendAuthResponse {
  accessToken: string;
  refreshToken?: string;
  userType: string;   // 'RENTER' | 'OWNER' | 'ADMIN'
  email: string;
  fullName: string;
  userId: string;
}

/** Convert a BackendAuthResponse into a frontend Profile */
export function buildProfile(data: BackendAuthResponse): Profile {
  return {
    id:              data.userId,
    email:           data.email,
    fullName:        data.fullName,
    phone:           null,
    profilePicture:  null,
    userType:        data.userType as UserType,
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
function setToken(token: string) {
  localStorage.setItem('gr_token', token);
  localStorage.setItem('token', token);
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

/**
 * Admin login — hits /auth/admin/login (separate from regular /auth/login)
 * Backend requires ADMIN role — regular user credentials will fail here.
 */
export async function adminSignIn(
  email: string,
  password: string
): Promise<{ data?: BackendAuthResponse; error?: string }> {
  try {
    const response = await api.post('/auth/admin/login', { email, password });
    const token = response.data.accessToken;
    if (token) setToken(token);
    return { data: response.data };
  } catch (error: any) {
    return {
      error: error.response?.data?.message || error.message || 'Invalid admin credentials',
    };
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
    // FIX: store token on registration — same as signIn()
    const token = response.data.accessToken;
    if (token) setToken(token);
    return { data: response.data };
  } catch (error: any) {
    return { error: error.response?.data?.message || error.message || 'Failed to create account' };
  }
}
