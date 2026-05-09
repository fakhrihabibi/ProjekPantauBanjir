import { NextResponse } from 'next/server';
import { registerSchema } from '@/lib/schemas';
import { AUTH_SESSION_COOKIE, createSessionToken } from '@/lib/session';
import {
  createUserAccount,
  findUserByEmail,
  hashPassword,
  normalizeEmail,
} from '@/lib/auth';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: parsed.error.issues[0]?.message ?? 'Data registrasi tidak valid.',
        },
        { status: 400 }
      );
    }

    const email = normalizeEmail(parsed.data.email);
    const existingUser = await findUserByEmail(email);

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          error: 'Email sudah terdaftar.',
        },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(parsed.data.password);
    const user = await createUserAccount({
      name: parsed.data.name.trim(),
      email,
      passwordHash,
      role: 'USER',
    });

    if (!user) {
      throw new Error('Failed to create user account.');
    }

    const token = await createSessionToken({
      id: user.id,
      name: user.name,
      email: user.email,
      role: 'USER',
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });

    response.cookies.set(AUTH_SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 8,
    });

    return response;
  } catch (error) {
    console.error('User register failed:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Terjadi kesalahan saat membuat akun.',
      },
      { status: 500 }
    );
  }
}
