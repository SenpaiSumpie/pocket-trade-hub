import { NextRequest, NextResponse } from 'next/server';

const PUBLIC_PATHS = ['/login', '/signup'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const accessToken = request.cookies.get('accessToken')?.value;

  // Authenticated user trying to visit auth pages -> redirect to /cards
  if (accessToken && PUBLIC_PATHS.includes(pathname)) {
    return NextResponse.redirect(new URL('/cards', request.url));
  }

  // Unauthenticated user trying to visit protected pages -> redirect to /login
  if (!accessToken && !PUBLIC_PATHS.includes(pathname)) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - api routes
     * - public assets
     */
    '/((?!_next/static|_next/image|favicon\\.ico|api).*)',
  ],
};
