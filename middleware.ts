import { NextRequest, NextResponse } from 'next/server';
import { AUTH_SESSION_COOKIE, verifySessionToken } from '@/lib/session';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!pathname.startsWith('/admin')) {
    return NextResponse.next();
  }

  if (pathname === '/admin/login') {
    return NextResponse.next();
  }

  const sessionToken = request.cookies.get(AUTH_SESSION_COOKIE)?.value;

  if (!sessionToken) {
    const loginUrl = new URL('/admin/login', request.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  try {
    const session = await verifySessionToken(sessionToken);
    const isValid = session?.role === 'ADMIN';

    if (!isValid) {
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('next', pathname);
      return NextResponse.redirect(loginUrl);
    }
  } catch {
    const loginUrl = new URL('/admin/login', request.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
