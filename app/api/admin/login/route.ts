import { NextResponse } from 'next/server';
import { loginSchema } from '@/lib/schemas';
import { ADMIN_SESSION_COOKIE, createAdminSessionToken } from '@/lib/admin-auth';
import { findUserByEmail, normalizeEmail, verifyPassword } from '@/lib/auth';

export const runtime = 'nodejs';

function isConfiguredAdminCredential(email: string, password: string) {
  const configuredEmail = process.env.ADMIN_USERNAME?.trim().toLowerCase();
  const configuredPassword = process.env.ADMIN_PASSWORD;

  return Boolean(
    configuredEmail &&
      configuredPassword &&
      email === configuredEmail &&
      password === configuredPassword
  );
}

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

    if (isConfiguredAdminCredential(email, parsed.data.password)) {
      const token = await createAdminSessionToken({
        id: 'admin-env',
        email,
        name: 'Admin',
      });

      const response = NextResponse.json({ success: true });

      response.cookies.set(ADMIN_SESSION_COOKIE, token, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: 60 * 60 * 8,
      });

      return response;
    }

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

    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        {
          success: false,
          error: 'Akun ini bukan akun admin.',
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

    const token = await createAdminSessionToken(user);
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
