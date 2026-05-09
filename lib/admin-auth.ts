const encoder = new TextEncoder();
const decoder = new TextDecoder();

export const ADMIN_SESSION_COOKIE = 'pantaubanjir_admin_session';

function getSessionSecret() {
  const secret = process.env.ADMIN_SESSION_SECRET;

  if (!secret) {
    throw new Error('ADMIN_SESSION_SECRET is not configured.');
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

export async function createAdminSessionToken() {
  const secret = getSessionSecret();
  const payload = JSON.stringify({ role: 'admin', issuedAt: Date.now() });
  const signature = await signMessage(payload, secret);

  return `${toBase64Url(encoder.encode(payload))}.${toBase64Url(signature)}`;
}

export async function verifyAdminSessionToken(token: string) {
  try {
    const secret = getSessionSecret();
    const [payloadPart, signaturePart] = token.split('.');

    if (!payloadPart || !signaturePart) {
      return false;
    }

    const payloadBytes = fromBase64Url(payloadPart);
    const signatureBytes = fromBase64Url(signaturePart);
    const payload = decoder.decode(payloadBytes);

    if (!(await verifyMessage(payload, signatureBytes, secret))) {
      return false;
    }

    const parsed = JSON.parse(payload) as { role?: string; issuedAt?: number };
    return parsed.role === 'admin' && typeof parsed.issuedAt === 'number';
  } catch {
    return false;
  }
}
