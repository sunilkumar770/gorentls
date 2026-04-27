import { NextResponse, type NextRequest } from 'next/server';

/**
 * Decode JWT payload without a library.
 * Safe for Next.js - uses only atob() which is available.
 */
function parseJwt(token: string) {
  try {
    const base64Payload = token.split('.')[1];
    if (!base64Payload) return { role: '', isAdmin: false, isOwner: false };
    
    const base64 = base64Payload.replace(/-/g, '+').replace(/_/g, '/');
    const json = atob(base64);
    const payload = JSON.parse(json);
    
    const raw: string =
      payload.role ??
      payload.userType ??
      payload.authorities?.[0] ??
      '';
    
    const role = raw.replace(/^ROLE_/, '').toUpperCase();
    return {
      role,
      isAdmin: role === 'ADMIN' || role === 'SUPER_ADMIN',
      isOwner: role === 'OWNER'
    };
  } catch {
    return { role: '', isAdmin: false, isOwner: false };
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // 1. Diagnostics
  console.log(`[Middleware] ${request.method} ${pathname}`);

  // 2. Public bypass
  if (
    pathname.startsWith('/_next') || 
    pathname.startsWith('/api') || 
    pathname.includes('.') ||
    pathname === '/login' ||
    pathname === '/signup' ||
    pathname === '/admin/login' ||
    pathname === '/'
  ) {
    return NextResponse.next();
  }

  // Read token from cookie
  const token = request.cookies.get('token')?.value || request.cookies.get('accessToken')?.value;
  const isLoggedIn = !!token;
  
  console.log(`[Middleware] Token present: ${isLoggedIn}`);

  if (!token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  const { role, isAdmin, isOwner } = parseJwt(token);
  console.log(`[Middleware] Parsed Role: ${role} | isAdmin: ${isAdmin} | isOwner: ${isOwner}`);

  // ── Guard: admin routes ────────────────────────────────────────────────────
  if (pathname.startsWith('/admin')) {
    if (!isAdmin) {
      console.warn(`[Middleware] Access denied to admin route ${pathname} for role ${role}`);
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
    if (request.nextUrl.searchParams.has('reason') || request.nextUrl.searchParams.has('redirect')) {
      return NextResponse.next();
    }
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
