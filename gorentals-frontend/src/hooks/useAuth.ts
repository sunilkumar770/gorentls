'use client';

import { useContext } from 'react';
import { AuthContext } from '@/contexts/AuthContext';

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');

  const userObj = ctx.user || (typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('gr_user') || 'null') : null);
  const raw = userObj?.userType ?? userObj?.role ?? '';
  
  // Strip Spring's ROLE_ prefix if present (e.g. ROLE_ADMIN → ADMIN)
  const userType = (typeof raw === 'string' ? raw : '').replace(/^ROLE_/, '').toUpperCase();

  return {
    ...ctx,
    user: userObj,
    userType,
    isAuthenticated: !!userObj,
    isAdmin:  userType === 'ADMIN' || userType === 'SUPER_ADMIN',
    isOwner:  userType === 'OWNER',
    isRenter: userType === 'RENTER',
    
    // Backward compatibility aliases
    profile: ctx.user,
    loading: ctx.isLoading,
  };
}
