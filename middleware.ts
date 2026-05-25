import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken } from '@/lib/session';
import { ADMIN_SESSION_COOKIE } from '@/lib/admin-auth';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Create headers to pass context to server components
  const requestHeaders = new Headers(request.headers);
  
  // Use a custom header to identify which path the client is "acting" on.
  // This is vital for API calls from different tabs.
  const invokePath = request.headers.get('x-invoke-path');
  const activePath = invokePath || pathname;
  
  requestHeaders.set('x-pathname', activePath);
  requestHeaders.set('x-url', request.url);
  
  if (request.nextUrl.searchParams.get('from') === 'admin' || (invokePath && invokePath.includes('from=admin'))) {
    requestHeaders.set('x-from-admin', 'true');
  }

  const nextWithHeaders = () => NextResponse.next({
    request: {
      headers: requestHeaders,
    }
  });

  // Access control for admin area - always based on ACTUAL URL
  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    const sessionToken = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;

    if (!sessionToken) {
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('next', pathname);
      return NextResponse.redirect(loginUrl);
    }

    try {
      const session = await verifySessionToken(sessionToken);
      if (session?.role !== 'ADMIN') {
        const loginUrl = new URL('/admin/login', request.url);
        loginUrl.searchParams.set('next', pathname);
        return NextResponse.redirect(loginUrl);
      }
    } catch {
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('next', pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (pathname === '/admin/dashboard') {
      return NextResponse.redirect(new URL('/laporan?from=admin', request.url));
    }
  }

  return nextWithHeaders();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images (public images)
     * - icons (public icons)
     * - uploads (uploaded files)
     */
    '/((?!_next/static|_next/image|favicon.ico|images|icons|uploads).*)',
  ],
};
