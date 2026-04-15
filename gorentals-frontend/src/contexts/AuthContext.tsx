"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Profile } from '@/types';
import Cookies from 'js-cookie';

interface AuthContextType {
  user: Profile | null;
  token: string | null;
  isLoading: boolean;
  login: (token: string, user: Profile) => void;
  logout: () => void;
  updateUser: (newUser: Profile) => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Profile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('gr_token');
    const storedUser = localStorage.getItem('gr_user');
    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem('gr_token');
        localStorage.removeItem('gr_user');
      }
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    const handleWsAuthFailure = () => {
      console.warn('[AuthContext] WS auth failure → auto logout');
      localStorage.removeItem('gr_token');
      localStorage.removeItem('gr_user');
      document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; SameSite=Lax';
      setToken(null);
      setUser(null);
      window.location.href = '/login';
    };
    window.addEventListener('ws:auth-failure', handleWsAuthFailure);
    return () => window.removeEventListener('ws:auth-failure', handleWsAuthFailure);
  }, []);

  const login = (token: string, user: Profile) => {
    localStorage.setItem('gr_token', token);
    localStorage.setItem('gr_user', JSON.stringify(user));
    
    // Set cookie for middleware access
    Cookies.set('accessToken', token, {
      expires: 7,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });
    
    // Legacy cookie name support if needed by any other part
    document.cookie = `token=${token}; path=/; SameSite=Lax; max-age=${60 * 60 * 24 * 7}`;
    
    setToken(token);
    setUser(user);
  };

  const logout = () => {
    localStorage.removeItem('gr_token');
    localStorage.removeItem('gr_user');
    
    Cookies.remove('accessToken');
    document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; SameSite=Lax';
    
    setToken(null);
    setUser(null);
  };

  const updateUser = (newUser: Profile) => {
    localStorage.setItem('gr_user', JSON.stringify(newUser));
    setUser(newUser);
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
