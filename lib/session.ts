export const AUTH_SESSION_COOKIE = 'pantaubanjir_session';

export type SessionRole = 'ADMIN' | 'USER';

export type SessionPayload = {
  userId: string;
  role: SessionRole;
  email: string;
  name: string;
  issuedAt: number;
  expiresAt: number;
};

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: SessionRole;
};

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function getSessionSecret() {
  const secret = process.env.AUTH_SESSION_SECRET ?? process.env.ADMIN_SESSION_SECRET;

  if (!secret) {
    throw new Error('AUTH_SESSION_SECRET is not configured.');
  }

  return secret;
}

function toBase64Url(bytes: Uint8Array) {
  let binary = '';
  for (let index = 0; index < bytes.length; index += 1) {
    binary += String.fromCharCode(bytes[index]);
  }

  return globalThis.btoa(binary)
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function fromBase64Url(value: string) {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
  const binary = globalThis.atob(padded);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}

async function signMessage(message: string, secret: string) {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(message));
  return new Uint8Array(signature);
}

async function verifyMessage(message: string, signature: Uint8Array, secret: string) {
  const expected = await signMessage(message, secret);

  if (expected.length !== signature.length) {
    return false;
  }

  let mismatch = 0;
  for (let index = 0; index < expected.length; index += 1) {
    mismatch |= expected[index] ^ signature[index];
  }

  return mismatch === 0;
}

export async function createSessionToken(user: SessionUser, maxAgeSeconds = 60 * 60 * 8) {
  const secret = getSessionSecret();
  const issuedAt = Date.now();
  const payload = JSON.stringify({
    userId: user.id,
    role: user.role,
    email: user.email,
    name: user.name,
    issuedAt,
    expiresAt: issuedAt + maxAgeSeconds * 1000,
  } satisfies SessionPayload);
  const signature = await signMessage(payload, secret);

  return `${toBase64Url(encoder.encode(payload))}.${toBase64Url(signature)}`;
}

export async function verifySessionToken(token: string) {
  try {
    const secret = getSessionSecret();
    const [payloadPart, signaturePart] = token.split('.');

    if (!payloadPart || !signaturePart) {
      return null;
    }

    const payloadBytes = fromBase64Url(payloadPart);
    const signatureBytes = fromBase64Url(signaturePart);
    const payload = decoder.decode(payloadBytes);

    if (!(await verifyMessage(payload, signatureBytes, secret))) {
      return null;
    }

    const parsed = JSON.parse(payload) as Partial<SessionPayload>;

    if (
      !parsed.userId ||
      !parsed.name ||
      !parsed.email ||
      (parsed.role !== 'ADMIN' && parsed.role !== 'USER') ||
      typeof parsed.issuedAt !== 'number' ||
      typeof parsed.expiresAt !== 'number'
    ) {
      return null;
    }

    if (Date.now() > parsed.expiresAt) {
      return null;
    }

    return parsed as SessionPayload;
  } catch {
    return null;
  }
}
