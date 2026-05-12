import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { parseToken, isTokenExpired } from './utils/jwt';

// Protected route patterns
const PROTECTED_PATHS = [
  '/dashboard',
  '/messages',
  '/checkout',
  '/owner',
  '/create-listing',
  '/profile',
  '/wishlist',
  '/my-bookings',
  '/notifications',
];

// Admin-only paths
const ADMIN_PATHS = ['/admin'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if this is a protected path
  const isProtected = PROTECTED_PATHS.some(path => pathname.startsWith(path));
  const isAdminPath = ADMIN_PATHS.some(path => pathname.startsWith(path));

  if (!isProtected && !isAdminPath) {
    return NextResponse.next();
  }

  // Try to get token from cookies
  const token = request.cookies.get('gorentals_token')?.value || request.cookies.get('token')?.value;

  // 1. No token → redirect to login
  if (!token) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('from', pathname);
    return NextResponse.redirect(url);
  }

  // 2. Decode and Validate Expiration
  const payload = parseToken(token);
  if (!payload || isTokenExpired(payload)) {
    console.warn(`[Middleware] Invalid or expired token for ${pathname}`);
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete('gorentals_token');
    response.cookies.delete('token');
    return response;
  }

  // 3. RBAC Checks
  const role = payload.role || payload.userType;

  // Admin route requires ADMIN role
  if (isAdminPath && role !== 'ADMIN') {
    console.error(`[Middleware] Access denied for ${pathname}: Role is ${role}`);
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Owner routes require OWNER or ADMIN role
  const isOwnerPath = pathname.startsWith('/owner') || pathname.startsWith('/create-listing');
  if (isOwnerPath && role !== 'OWNER' && role !== 'ADMIN') {
    console.error(`[Middleware] Access denied for ${pathname}: Role is ${role}`);
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

// Configure matcher to run on specific routes only
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/messages/:path*',
    '/checkout/:path*',
    '/owner/:path*',
    '/create-listing/:path*',
    '/profile/:path*',
    '/wishlist/:path*',
    '/my-bookings/:path*',
    '/notifications/:path*',
    '/admin/:path*',
  ],
};
