import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_PATHS = ['/login', '/register', '/'];

export function middleware(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;

  // Allow public paths through
  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'))) {
    return NextResponse.next();
  }

  // Check for auth token — Zustand persists to localStorage as JSON
  // We read the raw cookie value that Zustand sets
  const authCookie = request.cookies.get('mercury-auth')?.value;

  // Also check the Zustand persist cookie format
  let hasToken = false;
  if (authCookie) {
    try {
      const parsed = JSON.parse(decodeURIComponent(authCookie)) as { state?: { token?: string } };
      hasToken = !!parsed?.state?.token;
    } catch {
      hasToken = !!authCookie;
    }
  }

  if (!hasToken) {
    // Let client-side handle auth — don't hard redirect, just allow through
    // Client components with useAuthStore will redirect if no token
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api).*)'],
};
