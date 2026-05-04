"use client";

import React, { createContext, useState, useEffect } from 'react';
import type { Profile } from '@/types';
import { buildProfile, setToken, clearToken } from '@/services/auth';
import api from '@/lib/axios';

interface AuthContextType {
  user: Profile | null;
  token: string | null;
  isLoading: boolean;
  login: (token: string, user: Profile) => void;
  logout: () => void;
  updateUser: (newUser: Profile) => void;
  refreshUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Profile | null>(null);
  const [token, setTokenState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function initAuth() {
      try {
        // 1. Recover token from persistent storage
        let storedToken = localStorage.getItem('gr_token');
        
        // Fallback to cookie if localStorage is empty
        if (!storedToken) {
          const cookieToken = document.cookie
            .split('; ')
            .find(row => row.startsWith('token='))
            ?.split('=')[1];
          if (cookieToken) {
            storedToken = cookieToken;
            localStorage.setItem('gr_token', cookieToken);
          }
        }

        if (!storedToken) {
          setIsLoading(false);
          return;
        }

        // Set token immediately for axios interceptors
        setTokenState(storedToken);

        // 2. Load cached user for instant UI response
        const storedUser = localStorage.getItem('gr_user');
        if (storedUser) {
          try {
            setUser(JSON.parse(storedUser));
          } catch {
            localStorage.removeItem('gr_user');
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
          localStorage.setItem('gr_user', JSON.stringify(profile));
        } catch (err: unknown) { 
          const _err = err as { response?: { status?: number; data?: { message?: string; error?: string } }; message?: string };
          const status = _err?.response?.status;
          if (status === 401 || status === 403) {
            console.warn('[AuthContext] Session expired/invalid. Clearing...');
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
    localStorage.setItem('gr_user', JSON.stringify(newUser));
    setTokenState(newToken);
    setUser(newUser);
  };

  const logout = () => {
    clearToken();
    setTokenState(null);
    setUser(null);
  };

  const updateUser = (newUser: Profile) => {
    localStorage.setItem('gr_user', JSON.stringify(newUser));
    setUser(newUser);
  };

  const refreshUser = async () => {
    try {
      const res = await api.get('/users/me');
      const profile = buildProfile(res.data);
      setUser(profile);
      localStorage.setItem('gr_user', JSON.stringify(profile));
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
