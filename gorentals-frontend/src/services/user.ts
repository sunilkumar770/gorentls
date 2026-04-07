import api from '../lib/axios';
import { Profile } from '../types';

export interface UpdateProfileData {
  fullName?: string;
  phone?: string;
  city?: string;
  address?: string;
  state?: string;
  pincode?: string;
  dateOfBirth?: string;
  profilePicture?: string;
}

export interface KYCSubmissionData {
  documentType: 'aadhaar' | 'pan' | 'passport';
  idNumber: string;
  documentUrl: string;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken?: string;
  userType: string;
  email: string;
  fullName: string;
  userId: string;
}

export const userService = {
  getMe: async () => {
    const response = await api.get<Profile>('/users/me');
    return response.data;
  },

  updateProfile: async (data: UpdateProfileData) => {
    const response = await api.patch<Profile>('/users/profile', data);
    return response.data;
  },

  changePassword: async (data: ChangePasswordData) => {
    const response = await api.post<{ message: string; success: boolean }>('/users/password', data);
    return response.data;
  },

  submitKYC: async (data: KYCSubmissionData) => {
    const response = await api.post<Profile>('/users/kyc', data);
    return response.data;
  },

  upgradeToOwner: async () => {
    const response = await api.post<AuthResponse>('/users/upgrade');
    return response.data;
  }
};
