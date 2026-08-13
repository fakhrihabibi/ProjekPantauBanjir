import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth';

// Ensure Node runtime so process.env is available
export const runtime = 'nodejs';

function mask(value: string | undefined | null) {
  if (!value) return null;
  if (value.length <= 3) return value;
  return `${value.slice(0, 3)}***`;
}

export async function GET(_request: NextRequest) {
  try {
    const session = await getCurrentSession();

    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const s3Bucket = process.env.S3_BUCKET ?? null;
    const s3Endpoint = process.env.S3_ENDPOINT ?? process.env.S3Endpoint ?? null;
    const region = process.env.AWS_REGION ?? process.env.AWS_DEFAULT_REGION ?? null;
    const nodeEnv = process.env.NODE_ENV ?? null;
    const adminUser = process.env.ADMIN_USERNAME ?? null;
    const adminPass = process.env.ADMIN_PASSWORD ?? null;
    const adminSessionSecret = process.env.ADMIN_SESSION_SECRET ?? null;

    return NextResponse.json({
      success: true,
      s3BucketMasked: mask(s3Bucket),
      s3BucketPresent: !!s3Bucket,
      s3EndpointMasked: mask(s3Endpoint),
      region,
      nodeEnv,
      adminUserMasked: mask(adminUser),
      adminUserPresent: !!adminUser,
      adminPasswordPresent: !!adminPass,
      adminSessionSecretPresent: !!adminSessionSecret,
    });
  } catch (err) {
    return NextResponse.json({ success: false, error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
