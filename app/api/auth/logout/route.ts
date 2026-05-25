import { NextResponse } from 'next/server';
import { AUTH_SESSION_COOKIE } from '@/lib/session';
import { ADMIN_SESSION_COOKIE } from '@/lib/admin-auth';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const redirectTo = new URL('/', request.url);
  const response = NextResponse.redirect(redirectTo);

  // Clear ONLY User Session
  response.cookies.set(AUTH_SESSION_COOKIE, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  });

  return response;
}
