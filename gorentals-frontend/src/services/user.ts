import api from '@/lib/axios';
import type { Profile } from '@/types';

export async function getProfile(): Promise<Profile> {
  const res = await api.get<Profile>('/users/me');
  return res.data;
}

export async function updateProfile(
  data: Partial<Omit<Profile, 'id' | 'createdAt' | 'updatedAt' | 'role'>>,
): Promise<Profile> {
  const res = await api.patch<Profile>('/users/profile', data);
  return res.data;
}

export async function uploadAvatar(
  file: File,
): Promise<{ avatarUrl: string }> {
  const fd = new FormData();
  fd.append('avatar', file);
  const res = await api.post<{ avatarUrl: string }>('/users/avatar', fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
}

export async function getUserById(userId: string): Promise<Profile> {
  const res = await api.get<Profile>(`/users/${userId}`);
  return res.data;
}

export async function submitKYC(data: {
  documentType: string;
  idNumber: string;
  documentUrl: string;
}): Promise<Profile> {
  const res = await api.post<Profile>('/users/kyc', data);
  return res.data;
}
