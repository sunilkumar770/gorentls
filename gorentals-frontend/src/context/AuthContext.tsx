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
        // 1. Recover token from safeStorage (localStorage wrapper)
        // NOTE: HttpOnly cookies cannot be read by JS (document.cookie is intentionally NOT used here).
        // The token in safeStorage is set by setToken() after successful login.
        // The HttpOnly cookie is set server-side via /api/auth/set-token and is used
        // automatically by the browser for credentialed requests.
        const storedToken = safeStorage.getItem('gorentals_token');

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
          const _err = err as { response?: { status?: number } };
          const status = _err?.response?.status;
          if (status === 401 || status === 403) {
            // Session invalid: clear everything
            clearToken();
            setTokenState(null);
            setUser(null);
          }
          // Network error: keep cached session, don't clear
        }
      } catch (err) {
        if (process.env.NODE_ENV === 'development') console.error('[AuthContext] Initialization failed:', err);
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

  const logout = async () => {
    // 1. Call the Next.js API route which clears the HttpOnly cookie server-side
    // This is the ONLY correct way to clear an HttpOnly cookie from the client side.
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // Best-effort: proceed with client-side cleanup regardless
    }

    // 2. Clear client-side state and localStorage token
    clearToken();
    setTokenState(null);
    setUser(null);

    // 3. Redirect to homepage
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
      if (process.env.NODE_ENV === 'development') console.error('[AuthContext] Refresh failed:', err);
      throw err;
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout, updateUser, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}
