// src/app/api/auth/logout/route.ts
// Next.js API Route: Handles logout by clearing the HttpOnly JWT cookie.
// Also notifies the backend so it can clear its own cookie.
import { NextRequest, NextResponse } from 'next/server';

const TOKEN_COOKIE_NAME = 'gorentals_token';
const isProd = process.env.NODE_ENV === 'production';

export async function POST(req: NextRequest) {
  // ── 1. Notify backend to clear its cookie (best-effort) ──
  const token = req.cookies.get(TOKEN_COOKIE_NAME)?.value;
  if (token) {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';
      await fetch(`${apiUrl}/auth/logout`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        // Short timeout – don't block logout on backend failure
        signal: AbortSignal.timeout(3000),
      });
    } catch {
      // Best-effort: log but do not block logout if backend is unreachable
      console.warn('[logout] Backend logout notification failed (non-blocking)');
    }
  }

  // ── 2. Always clear the frontend cookie regardless of backend response ──
  const response = NextResponse.json({ success: true });

  // Expire the cookie immediately
  response.cookies.set(TOKEN_COOKIE_NAME, '', {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
    expires: new Date(0),
  });

  // Also clear the legacy 'token' cookie if present
  response.cookies.set('token', '', {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
    expires: new Date(0),
  });

  return response;
}
