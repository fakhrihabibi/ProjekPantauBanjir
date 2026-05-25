import { cookies, headers } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'crypto';
import { promisify } from 'util';
import {
  AUTH_SESSION_COOKIE,
  type SessionPayload,
  type SessionRole,
  type SessionUser,
  createSessionToken,
  verifySessionToken,
} from '@/lib/session';
import { ADMIN_SESSION_COOKIE } from './admin-auth';

const scrypt = promisify(scryptCallback);

type UserRow = {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: SessionRole;
};

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export async function findUserByEmail(email: string) {
  const rows = await prisma.$queryRaw<UserRow[]>`
    SELECT
      id,
      name,
      email,
      "passwordHash",
      role::text AS role
    FROM "users"
    WHERE email = ${email}
    LIMIT 1
  `;

  return rows[0] ?? null;
}

export async function findUserById(id: string) {
  const rows = await prisma.$queryRaw<UserRow[]>`
    SELECT
      id,
      name,
      email,
      "passwordHash",
      role::text AS role
    FROM "users"
    WHERE id = ${id}
    LIMIT 1
  `;

  return rows[0] ?? null;
}

export async function createUserAccount(input: {
  name: string;
  email: string;
  passwordHash: string;
  role?: SessionRole;
}) {
  const rows = await prisma.$queryRaw<UserRow[]>`
    INSERT INTO "users" (
      id,
      name,
      email,
      "passwordHash",
      role,
      "createdAt",
      "updatedAt"
    ) VALUES (
      ${`usr_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 9)}`},
      ${input.name},
      ${input.email},
      ${input.passwordHash},
      ${(input.role ?? 'USER') as SessionRole}::"UserRole",
      NOW(),
      NOW()
    )
    RETURNING
      id,
      name,
      email,
      "passwordHash",
      role::text AS role
  `;

  return rows[0] ?? null;
}

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex');
  const derived = (await scrypt(password, salt, 64)) as Buffer;
  return `${salt}:${derived.toString('hex')}`;
}

export async function verifyPassword(password: string, passwordHash: string) {
  const [salt, storedHash] = passwordHash.split(':');

  if (!salt || !storedHash) {
    return false;
  }

  const derived = (await scrypt(password, salt, 64)) as Buffer;
  const stored = Buffer.from(storedHash, 'hex');

  if (derived.length !== stored.length) {
    return false;
  }

  return timingSafeEqual(derived, stored);
}

export async function getSessionFromCookieStore(
  cookieStore: { get(name: string): { value: string } | undefined },
  preferAdmin = false
) {
  const userToken = cookieStore.get(AUTH_SESSION_COOKIE)?.value;
  const adminToken = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;

  // 1. If we prefer admin (on admin path or with hint), check admin token first.
  if (preferAdmin) {
    if (adminToken) {
      const session = await verifySessionToken(adminToken);
      if (session && session.role === 'ADMIN') return session;
    }
    // If we preferred admin but didn't find one, we could fall back to user
    // but usually admin areas should be strictly admin.
    return null; 
  }

  // 2. On public paths:
  // First priority: User session
  if (userToken) {
    const session = await verifySessionToken(userToken);
    if (session && session.role === 'USER') return session;
  }

  // Second priority: Admin session (Fallback so admins don't appear as guests on public pages)
  if (adminToken) {
    const session = await verifySessionToken(adminToken);
    if (session && session.role === 'ADMIN') return session;
  }

  return null;
}

export async function getCurrentSession() {
  const [cookieStore, headerList] = await Promise.all([cookies(), headers()]);
  
  const pathname = headerList.get('x-pathname') || '';
  const urlStr = headerList.get('x-url') || '';
  const fromAdminHeader = headerList.get('x-from-admin') === 'true';
  const referer = headerList.get('referer') || '';
  
  // Determine actual path even if called from an API
  let activePath = pathname;
  let hasAdminHint = fromAdminHeader;

  // If this is an API call, try to get context from searchParams or referer
  if (pathname.startsWith('/api/')) {
    if (urlStr) {
      try {
        const url = new URL(urlStr);
        const pathParam = url.searchParams.get('path');
        if (pathParam) activePath = pathParam;
        if (url.searchParams.get('from') === 'admin' || url.searchParams.get('role') === 'admin') {
          hasAdminHint = true;
        }
      } catch {}
    }
    
    if ((!activePath || activePath.startsWith('/api/')) && referer) {
      try {
        const refUrl = new URL(referer);
        activePath = refUrl.pathname;
        if (refUrl.searchParams.get('from') === 'admin' || refUrl.searchParams.get('role') === 'admin') {
          hasAdminHint = true;
        }
      } catch {}
    }
  }
  
  const preferAdmin = activePath.startsWith('/admin') || 
                      activePath.startsWith('/api/admin') || 
                      hasAdminHint;
  
  return getSessionFromCookieStore(cookieStore, preferAdmin);
}

export async function getCurrentUser() {
  const session = await getCurrentSession();

  if (!session) {
    return null;
  }

  const user = await findUserById(session.userId);

  if (!user) {
    return {
      id: session.userId,
      name: session.name,
      email: session.email,
      role: session.role,
    };
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role as SessionRole,
  };
}

export async function requireAdminSession(cookieStore: { get(name: string): { value: string } | undefined }) {
  const session = await getSessionFromCookieStore(cookieStore, true);

  if (!session || session.role !== 'ADMIN') {
    return null;
  }

  return session;
}
