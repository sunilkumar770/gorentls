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

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // RC-4: Allow access to admin login page
  if (pathname === '/admin/login') {
    return NextResponse.next();
  }

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
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/login';
    loginUrl.searchParams.set('from', pathname);
    const response = NextResponse.redirect(loginUrl);
    response.cookies.delete('gorentals_token');
    response.cookies.delete('token');
    return response;
  }

  // 3. RBAC Checks
  const rawRole = (payload.role || payload.userType || '').toString();
  const role = rawRole.replace(/^ROLE_/, '').toUpperCase();
  const isSuperAdmin = role === 'SUPER_ADMIN';
  const isAdmin = role === 'ADMIN' || isSuperAdmin;

  // Admin route requires ADMIN or SUPER_ADMIN role
  if (isAdminPath && !isAdmin) {
    console.error(`[Middleware] Access denied for ${pathname}: Role is ${role}`);
    const dashUrl = request.nextUrl.clone();
    dashUrl.pathname = '/dashboard';
    dashUrl.search = '';
    return NextResponse.redirect(dashUrl);
  }

  // Owner routes require OWNER, ADMIN, or SUPER_ADMIN role
  const isOwnerPath = pathname.startsWith('/owner') || pathname.startsWith('/create-listing');
  if (isOwnerPath && !['OWNER', 'ADMIN', 'SUPER_ADMIN'].includes(role)) {
    console.error(`[Middleware] Access denied for ${pathname}: Role is ${role}`);
    const dashUrl = request.nextUrl.clone();
    dashUrl.pathname = '/dashboard';
    dashUrl.search = '';
    return NextResponse.redirect(dashUrl);
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

