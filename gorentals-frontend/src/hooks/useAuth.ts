// src/hooks/useAuth.ts
'use client'
import { useContext } from 'react';
import { AuthContext } from '@/context/AuthContext';

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  
  const user = ctx.user;
  const role = user?.userType ?? ''; // Note: src/contexts/AuthContext uses userType in Profile

  return {
    ...ctx,
    isAuthenticated: !!user,
    isAdmin: role === 'ADMIN',
    isOwner: role === 'OWNER',
    isRenter: role === 'RENTER',
    userType: role, // compatibility
    profile: user, // compatibility
    loading: ctx.isLoading, // compatibility
  }
}
