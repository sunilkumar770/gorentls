"use client";

import React, { createContext, useState, useEffect } from 'react';
import type { Profile } from '@/types';
import { buildProfile, setToken, clearToken } from '@/services/auth';
import api from '@/lib/axios';
import { safeStorage } from '@/lib/safeStorage';

interface AuthContextType {
  user: Profile | null;
  token: string | null;
  isLoading: boolean;
  login: (token: string, user: Profile) => void;
  logout: () => void;
  updateUser: (newUser: Profile) => void;
  refreshUser: () => Promise<void>;
}

export type AuthUser = Profile;

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ 
  children, 
  initialUser 
}: { 
  children: React.ReactNode; 
  initialUser: Profile | null; 
}) {
  const [user, setUser] = useState<Profile | null>(initialUser);
  const [token, setTokenState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(!initialUser);

  useEffect(() => {
    async function initAuth() {
      try {
        // 1. Recover token from persistent storage
        let storedToken = safeStorage.getItem('gorentals_token');
        
        // Fallback to cookie if safeStorage is empty
        if (!storedToken) {
          const cookieToken = document.cookie
            .split('; ')
            .find(row => row.startsWith('gorentals_token='))
            ?.split('=')[1];
          if (cookieToken) {
            storedToken = cookieToken;
            safeStorage.setItem('gorentals_token', cookieToken);
          }
        }

        if (!storedToken) {
          setIsLoading(false);
          return;
        }

        // Set token immediately for axios interceptors
        setTokenState(storedToken);

        // 2. Load cached user for instant UI response
        const storedUser = safeStorage.getItem('gr_user');
        if (storedUser) {
          try {
            setUser(JSON.parse(storedUser));
          } catch {
            safeStorage.removeItem('gr_user');
          }
        }

        // 3. Verify session with backend
        try {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 8000);
          const res = await api.get('/users/me', { signal: controller.signal });
          clearTimeout(timeout);

          const profile = buildProfile(res.data);
          setUser(profile);
          safeStorage.setItem('gr_user', JSON.stringify(profile));
        } catch (err: unknown) { 
          const _err = err as { response?: { status?: number; data?: { message?: string; error?: string } }; message?: string };
          const status = _err?.response?.status;
          if (status === 401 || status === 403) {
            if (process.env.NODE_ENV === "development") console.warn('[AuthContext] Session expired/invalid. Clearing...');
            clearToken();
            setTokenState(null);
            setUser(null);
          } else {
            if (process.env.NODE_ENV === "development") console.warn('[AuthContext] Backend unreachable, using cached session if available');
          }
        }
      } catch (err) {
        if (process.env.NODE_ENV === "development") console.error('[AuthContext] Initialization failed:', err);
      } finally {
        setIsLoading(false);
      }
    }

    initAuth();
  }, []);

  useEffect(() => {
    const handleWsAuthFailure = () => {
      clearToken();
      setTokenState(null);
      setUser(null);
      window.location.href = '/login?reason=ws_auth_failure';
    };
    window.addEventListener('ws:auth-failure', handleWsAuthFailure);
    return () => window.removeEventListener('ws:auth-failure', handleWsAuthFailure);
  }, []);

  const login = (newToken: string, newUser: Profile) => {
    setToken(newToken);
    safeStorage.setItem('gr_user', JSON.stringify(newUser));
    setTokenState(newToken);
    setUser(newUser);
  };

  const logout = () => {
    clearToken();
    // Also clear the HTTP cookie middleware depends on
    document.cookie = 'gorentals_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=Lax';
    setTokenState(null);
    setUser(null);
    
    // Add navigation to homepage after logout
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  };

  const updateUser = (newUser: Profile) => {
    safeStorage.setItem('gr_user', JSON.stringify(newUser));
    setUser(newUser);
  };

  const refreshUser = async () => {
    try {
      const res = await api.get('/users/me');
      const profile = buildProfile(res.data);
      setUser(profile);
      safeStorage.setItem('gr_user', JSON.stringify(profile));
    } catch (err) {
      if (process.env.NODE_ENV === "development") console.error('[AuthContext] Refresh failed:', err);
      throw err;
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout, updateUser, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

