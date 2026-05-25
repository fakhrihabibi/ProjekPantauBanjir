import { createSessionToken, verifySessionToken } from '@/lib/session';

export const ADMIN_SESSION_COOKIE = 'pantaubanjir_admin_session';

export async function createAdminSessionToken(user: {
  id: string;
  email: string;
  name: string;
}) {
  return createSessionToken({
    id: user.id,
    email: user.email,
    name: user.name,
    role: 'ADMIN',
  });
}

export async function verifyAdminSessionToken(token: string) {
  const session = await verifySessionToken(token);
  return session?.role === 'ADMIN';
}
