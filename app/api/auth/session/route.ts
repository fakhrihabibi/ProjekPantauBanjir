import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';

export const runtime = 'nodejs';

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({
      authenticated: false,
      role: null,
      user: null,
    });
  }

  return NextResponse.json({
    authenticated: true,
    role: user.role,
    user,
  });
}
