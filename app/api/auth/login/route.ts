import { NextResponse } from 'next/server';
import { loginSchema } from '@/lib/schemas';
import { findUserByEmail, normalizeEmail, verifyPassword } from '@/lib/auth';
import { AUTH_SESSION_COOKIE, createSessionToken } from '@/lib/session';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: parsed.error.issues[0]?.message ?? 'Email dan password wajib diisi.',
        },
        { status: 400 }
      );
    }

    const email = normalizeEmail(parsed.data.email);
    const user = await findUserByEmail(email);

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: 'Email atau password salah.',
        },
        { status: 401 }
      );
    }

    if (user.role !== 'USER') {
      return NextResponse.json(
        {
          success: false,
          error: 'Akun admin harus login melalui halaman admin.',
        },
        { status: 403 }
      );
    }

    const isValid = await verifyPassword(parsed.data.password, user.passwordHash);

    if (!isValid) {
      return NextResponse.json(
        {
          success: false,
          error: 'Email atau password salah.',
        },
        { status: 401 }
      );
    }

    const token = await createSessionToken({
      id: user.id,
      name: user.name,
      email: user.email,
      role: 'USER',
    });
    const response = NextResponse.json({ success: true });

    response.cookies.set(AUTH_SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 8,
    });

    return response;
  } catch (error) {
    console.error('User login failed:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Terjadi kesalahan saat login.',
      },
      { status: 500 }
    );
  }
}
