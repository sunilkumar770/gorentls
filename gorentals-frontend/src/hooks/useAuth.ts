'use client';

import { useAuth as useAuthContext } from '@/contexts/AuthContext';

export function useAuth() {
  const { user: profile, isLoading: loading, login, logout, token } = useAuthContext();
  
  // To preserve compatibility with previous Supabase hook shape
  // user maps to profile (since we use a unified object)
  return { 
    user: profile, 
    profile, 
    loading, 
    isOwner: profile?.user_type === 'store_owner',
    login,
    logout,
    token
  };
}
