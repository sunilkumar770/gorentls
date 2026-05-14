/**
 * H-3 / H-4 Fix: Server-side HttpOnly JWT Cookie Setter
 *
 * This Next.js API route sets the JWT as an HttpOnly, Secure, SameSite=Lax cookie.
 * HttpOnly means JavaScript CANNOT read this cookie — XSS cannot steal the token.
 *
 * Usage: After login, the client calls POST /api/auth/set-token with { token }
 * The server sets the cookie server-side. The token is never stored in localStorage.
 */
import { NextRequest, NextResponse } from 'next/server';

const TOKEN_COOKIE_NAME = 'gorentals_token';
const TOKEN_MAX_AGE = 60 * 60 * 24 * 7; // 7 days in seconds

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token } = body;

    if (!token || typeof token !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid token' },
        { status: 400 }
      );
    }

    // Basic JWT shape validation (3 dot-separated base64url parts)
    const parts = token.split('.');
    if (parts.length !== 3) {
      return NextResponse.json(
        { error: 'Invalid token format' },
        { status: 400 }
      );
    }

    const isProd = process.env.NODE_ENV === 'production';

    const response = NextResponse.json({ ok: true });
    response.cookies.set(TOKEN_COOKIE_NAME, token, {
      httpOnly: true,      // H-3 Fix: JS cannot access this cookie
      secure: isProd,      // Only send over HTTPS in production
      sameSite: 'lax',     // Protects against CSRF while allowing normal navigation
      maxAge: TOKEN_MAX_AGE,
      path: '/',
    });

    return response;
  } catch (err) {
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    );
  }
}

/**
 * DELETE /api/auth/set-token — clears the cookie on logout
 */
export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(TOKEN_COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,  // Immediately expire
    path: '/',
  });
  return response;
}
