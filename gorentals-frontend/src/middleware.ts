import { NextResponse, type NextRequest } from 'next/server';

const PROTECTED_PATHS = ['/dashboard', '/checkout', '/booking', '/owner'];
const AUTH_PATHS = ['/login', '/signup'];

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const pathname = request.nextUrl.pathname;

  const isProtected = PROTECTED_PATHS.some(p => pathname.startsWith(p));
  const isAuthPage = AUTH_PATHS.some(p => pathname.startsWith(p));

  // If a route is protected and we don't have a token, redirect to login
  if (isProtected && !token) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  // If we are on login/signup but ALREADY have a token, redirect to dashboard
  if (isAuthPage && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/razorpay/webhook).*)'],
};
