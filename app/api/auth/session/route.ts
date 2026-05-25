import { NextResponse } from 'next/server';
import { getCurrentSession, getCurrentUser } from '@/lib/auth';

export const runtime = 'nodejs';

export async function GET() {
  // Prefer session-level check so admin env login (admin-env) is recognized
  const session = await getCurrentSession();

  if (!session) {
    return NextResponse.json({ authenticated: false, role: null, user: null });
  }

  // For USER sessions, try to return full user info
  if (session.role === 'USER') {
    const user = await getCurrentUser();

    if (user) {
      return NextResponse.json({ authenticated: true, role: session.role, user });
    }
  }

  // For ADMIN (including env admin), return session-derived user info
  return NextResponse.json({
    authenticated: true,
    role: session.role,
    user: {
      id: session.userId,
      name: session.name,
      email: session.email,
      role: session.role,
    },
  });
}
