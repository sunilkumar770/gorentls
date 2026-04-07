import { NextResponse, type NextRequest } from 'next/server';

// Every path that requires a valid JWT cookie
const PROTECTED_PATHS = [
  '/dashboard',
  '/checkout',
  '/booking',
  '/owner',
  '/profile',
  '/settings',
  '/create-listing',
  '/admin',           // ← ADDED: was the security hole
];

// Paths that must redirect away if user is already logged in
const AUTH_PATHS = ['/login', '/signup'];

// Paths that require a specific role beyond just being authenticated
// key = path prefix, value = required role string (must match JWT claim exactly)
const ROLE_REQUIRED: Record<string, string> = {
  '/owner': 'OWNER',
  '/admin': 'ADMIN',
};

/**
 * Decode JWT payload without a library.
 * Safe for Next.js Edge Runtime — uses only atob() which is available there.
 * Does NOT verify the signature — that is the backend's job.
 * We only need the role claim for routing decisions.
 */
function decodeJwtPayload(token: string): Record<string, string> | null {
  try {
    const base64Payload = token.split('.')[1];
    if (!base64Payload) return null;
    // Convert base64url → base64 standard before decoding
    const base64 = base64Payload.replace(/-/g, '+').replace(/_/g, '/');
    const json = atob(base64);
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED_PATHS.some(p => pathname.startsWith(p));
  const isAuthPage  = AUTH_PATHS.some(p => pathname.startsWith(p));

  // ── STEP 1: No token on protected route → send to login ─────────────────
  if (isProtected && !token) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/login';
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // ── STEP 2: Already logged in, hit auth page → send to dashboard ─────────
  if (isAuthPage && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // ── STEP 3: Role check for owner + admin routes ──────────────────────────
  if (token) {
    const matchedRolePath = Object.keys(ROLE_REQUIRED).find(p =>
      pathname.startsWith(p)
    );

    if (matchedRolePath) {
      const payload      = decodeJwtPayload(token);
      const userRole     = payload?.role;                        // "OWNER" | "RENTER" | "ADMIN"
      const requiredRole = ROLE_REQUIRED[matchedRolePath];       // "OWNER" | "ADMIN"

      if (userRole !== requiredRole) {
        // Wrong role — redirect to their own dashboard, not logout
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  // Exclude Next.js internals and the Razorpay webhook (needs raw body, no cookie needed)
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/razorpay/webhook).*)'],
};
