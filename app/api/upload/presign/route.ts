import { NextRequest, NextResponse } from 'next/server';

// Ensure Node runtime
export const runtime = 'nodejs';

function mask(value: string | undefined | null) {
  if (!value) return null;
  if (value.length <= 3) return value;
  return `${value.slice(0, 3)}***`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const filename = body?.filename as string | undefined;
    const contentType = body?.contentType as string | undefined;

    if (!filename || !contentType) {
      return NextResponse.json({ success: false, error: 'filename and contentType required' }, { status: 400 });
    }

    const bucket = process.env.S3_BUCKET;
    const region = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || '';
    const s3Endpoint = process.env.S3_ENDPOINT || process.env.S3Endpoint || '';
    if (!bucket) {
      return NextResponse.json({
        success: false,
        error: 'S3_BUCKET belum dikonfigurasi',
        s3BucketMasked: mask(bucket),
        s3BucketPresent: !!bucket,
        s3EndpointMasked: mask(s3Endpoint),
        region,
      }, { status: 500 });
    }

    const key = `uploads/${Date.now()}_${Math.random().toString(36).slice(2, 8)}_${filename}`;

    // Dynamic import to avoid bundling issues
    const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3');
    const { getSignedUrl } = await import('@aws-sdk/s3-request-presigner');

    // Configure S3 client to support S3-compatible endpoints (e.g. Supabase Storage)
    const s3Config: any = { region: region || undefined };
    if (s3Endpoint) {
      s3Config.endpoint = s3Endpoint;
      s3Config.forcePathStyle = true;
    }
    const s3 = new S3Client(s3Config);
    const command = new PutObjectCommand({ Bucket: bucket, Key: key, ContentType: contentType });

    const signedUrl = await getSignedUrl(s3, command, { expiresIn: 3600 });

    return NextResponse.json({ success: true, url: signedUrl, key, bucket, region }, { status: 200 });
  } catch (err) {
    console.error('Presign error:', err);
    const s3Endpoint = process.env.S3_ENDPOINT || process.env.S3Endpoint || '';
    const region = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || '';
    const bucket = process.env.S3_BUCKET;
    return NextResponse.json({
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
      s3BucketMasked: mask(bucket),
      s3BucketPresent: !!bucket,
      s3EndpointMasked: mask(s3Endpoint),
      region,
    }, { status: 500 });
  }
}
