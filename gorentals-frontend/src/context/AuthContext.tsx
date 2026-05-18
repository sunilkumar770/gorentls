"use client";

import React, { createContext, useState, useEffect } from 'react';
import type { Profile } from '@/types';
import { buildProfile, setToken, clearToken } from '@/services/auth';
import api from '@/lib/axios';
import { safeStorage } from '@/lib/safeStorage';
import websocketService from '@/services/websocketService';

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
        console.log('[AuthContext] Initializing. Stored token found:', !!storedToken);
        
        // Fallback to cookie if safeStorage is empty
        if (!storedToken) {
          const cookieToken = document.cookie
            .split('; ')
            .find(row => row.startsWith('gorentals_token='))
            ?.split('=')[1];
          console.log('[AuthContext] Checking cookie for token:', !!cookieToken);
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
        websocketService.setToken(storedToken);

        // 2. Load cached user for instant UI response
        const storedUser = safeStorage.getItem('gorentals_user');
        console.log('[AuthContext] Stored user found:', !!storedUser);
        if (storedUser) {
          try {
            setUser(JSON.parse(storedUser));
          } catch {
            safeStorage.removeItem('gorentals_user');
          }
        }

        // 3. Verify session with backend
        try {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 8000);
          console.log('[AuthContext] Validating token with backend...');
          const res = await api.get('/users/me', { signal: controller.signal });
          console.log('[AuthContext] Token valid. User profile received.');
          clearTimeout(timeout);

          const profile = buildProfile(res.data);
          setUser(profile);
          safeStorage.setItem('gorentals_user', JSON.stringify(profile));
        } catch (err: unknown) { 
          const _err = err as { response?: { status?: number; data?: { message?: string; error?: string } }; message?: string };
          const status = _err?.response?.status;
          if (status === 401 || status === 403) {
            console.warn('[AuthContext] Session expired/invalid. Clearing...');
            websocketService.disconnectPermanently();
            clearToken();
            setTokenState(null);
            setUser(null);
          } else {
            console.warn('[AuthContext] Backend unreachable, using cached session if available');
          }
        }
      } catch (err) {
        console.error('[AuthContext] Initialization failed:', err);
      } finally {
        setIsLoading(false);
      }
    }

    initAuth();
  }, []);

  useEffect(() => {
    const handleWsAuthFailure = () => {
      websocketService.disconnectPermanently();
      clearToken();
      setTokenState(null);
      setUser(null);
      window.location.href = '/login?reason=ws_auth_failure';
    };
    window.addEventListener('ws:auth-failure', handleWsAuthFailure);
    return () => window.removeEventListener('ws:auth-failure', handleWsAuthFailure);
  }, []);

  const login = (newToken: string, newUser: Profile) => {
    console.log('[AuthContext] Logging in user:', newUser.email);
    setToken(newToken);
    // Set cookie for middleware edge reads
    document.cookie = `gorentals_token=${newToken}; path=/; SameSite=Lax; max-age=${60 * 60 * 24 * 7}`;
    safeStorage.setItem('gorentals_user', JSON.stringify(newUser));
    setTokenState(newToken);
    setUser(newUser);
    websocketService.setToken(newToken);
  };

  const logout = () => {
    // Permanently disconnect WebSocket to stop background reconnect loops
    websocketService.disconnectPermanently();

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
    safeStorage.setItem('gorentals_user', JSON.stringify(newUser));
    setUser(newUser);
  };

  const refreshUser = async () => {
    try {
      const res = await api.get('/users/me');
      const profile = buildProfile(res.data);
      setUser(profile);
      safeStorage.setItem('gorentals_user', JSON.stringify(profile));
    } catch (err) {
      console.error('[AuthContext] Refresh failed:', err);
      throw err;
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout, updateUser, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}
