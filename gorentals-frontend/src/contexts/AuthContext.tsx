"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Profile } from '@/types';

interface AuthContextType {
  user: Profile | null;
  token: string | null;
  isLoading: boolean;
  login: (token: string, user: Profile) => void;
  logout: () => void;
  updateUser: (newUser: Profile) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

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

  const login = (token: string, user: Profile) => {
    localStorage.setItem('gr_token', token);
    localStorage.setItem('gr_user', JSON.stringify(user));
    // Also write cookie so middleware can read it server-side
    document.cookie = `token=${token}; path=/; SameSite=Lax; max-age=${60 * 60 * 24 * 7}`;
    setToken(token);
    setUser(user);
  };

  const logout = () => {
    localStorage.removeItem('gr_token');
    localStorage.removeItem('gr_user');
    // Also clear the middleware cookie
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
