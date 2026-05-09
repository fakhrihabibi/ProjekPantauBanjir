import { NextResponse } from 'next/server';
import { z } from 'zod';
import { ADMIN_SESSION_COOKIE, createAdminSessionToken } from '@/lib/admin-auth';

export const runtime = 'nodejs';

const loginSchema = z.object({
  username: z.string().min(1, 'Username wajib diisi'),
  password: z.string().min(1, 'Password wajib diisi'),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Username dan password wajib diisi.',
        },
        { status: 400 }
      );
    }

    const configuredUsername = process.env.ADMIN_USERNAME ?? 'admin';
    const configuredPassword = process.env.ADMIN_PASSWORD;

    if (!configuredPassword) {
      return NextResponse.json(
        {
          success: false,
          error: 'ADMIN_PASSWORD belum dikonfigurasi di environment.',
        },
        { status: 503 }
      );
    }

    const { username, password } = parsed.data;

    if (username !== configuredUsername || password !== configuredPassword) {
      return NextResponse.json(
        {
          success: false,
          error: 'Username atau password salah.',
        },
        { status: 401 }
      );
    }

    const token = await createAdminSessionToken();
    const response = NextResponse.json({ success: true });

    response.cookies.set(ADMIN_SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 8,
    });

    return response;
  } catch (error) {
    console.error('Admin login failed:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Terjadi kesalahan saat login admin.',
      },
      { status: 500 }
    );
  }
}
