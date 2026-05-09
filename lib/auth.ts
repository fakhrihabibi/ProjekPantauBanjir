import { cookies } from 'next/headers';
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

export async function getSessionFromCookieStore(cookieStore: { get(name: string): { value: string } | undefined }) {
  const token = cookieStore.get(AUTH_SESSION_COOKIE)?.value;

  if (!token) {
    return null;
  }

  return verifySessionToken(token);
}

export async function getCurrentSession() {
  const cookieStore = await cookies();
  return getSessionFromCookieStore(cookieStore);
}

export async function getCurrentUser() {
  const session = await getCurrentSession();

  if (!session) {
    return null;
  }

  const user = await findUserById(session.userId);

  if (!user) {
    return null;
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role as SessionRole,
  };
}

export async function requireAdminSession(cookieStore: { get(name: string): { value: string } | undefined }) {
  const session = await getSessionFromCookieStore(cookieStore);

  if (!session || session.role !== 'ADMIN') {
    return null;
  }

  return session;
}
