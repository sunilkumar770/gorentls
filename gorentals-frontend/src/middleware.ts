import { NextResponse, type NextRequest } from 'next/server';

/**
 * Decode JWT payload without a library.
 * Safe for Next.js Edge Runtime — uses only atob() which is available there.
 * Does NOT verify the signature — that is the backend's job.
 * We only need the role claim for routing decisions.
 */
function decodeJwtRole(token: string): string {
  try {
    const base64Payload = token.split('.')[1];
    if (!base64Payload) return '';
    // Convert base64url → base64 standard before decoding
    const base64 = base64Payload.replace(/-/g, '+').replace(/_/g, '/');
    const json = atob(base64);
    const payload = JSON.parse(json);
    
    // Spring JWT may use: role | userType | authorities[0]
    const raw: string =
      payload.role ??
      payload.userType ??
      payload.authorities?.[0] ??
      '';
    return raw.replace(/^ROLE_/, '').toUpperCase();
  } catch {
    return '';
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Read token from cookie (set by AuthContext on login)
  const token =
    request.cookies.get('accessToken')?.value ??
    request.cookies.get('token')?.value ??
    '';

  const role = token ? decodeJwtRole(token) : '';
  const isLoggedIn = !!token;
  const isAdmin    = role === 'ADMIN' || role === 'SUPER_ADMIN';
  const isOwner    = role === 'OWNER';

  // ── Guard: admin routes ────────────────────────────────────────────────────
  if (pathname.startsWith('/admin')) {
    if (!isLoggedIn) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (!isAdmin) {
      // Logged in but not admin → send to their own dashboard
      return NextResponse.redirect(
        new URL(isOwner ? '/owner/dashboard' : '/', request.url)
      );
    }
  }

  // ── Guard: owner-only routes ───────────────────────────────────────────────
  if (pathname.startsWith('/owner') || pathname.startsWith('/create-listing')) {
    if (!isLoggedIn) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
    // Note: owners and admins can both access /owner paths usually
  }

  // ── Guard: authenticated-only routes ──────────────────────────────────────
  const authRequired = ['/my-bookings', '/wishlist', '/messages', '/checkout', '/profile', '/dashboard'];
  if (authRequired.some(p => pathname.startsWith(p)) && !isLoggedIn) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // ── Guard: redirect logged-in users away from /login ──────────────────────
  if (pathname === '/login' && isLoggedIn) {
    const dest = isAdmin ? '/admin' : isOwner ? '/owner/dashboard' : '/';
    return NextResponse.redirect(new URL(dest, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/owner/:path*',
    '/create-listing/:path*',
    '/my-bookings/:path*',
    '/wishlist/:path*',
    '/messages/:path*',
    '/checkout/:path*',
    '/profile/:path*',
    '/dashboard/:path*',
    '/login',
  ],
};
