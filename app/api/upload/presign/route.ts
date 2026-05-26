import { NextRequest, NextResponse } from 'next/server';

// Ensure Node runtime
export const runtime = 'nodejs';

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
    if (!bucket) {
      return NextResponse.json({ success: false, error: 'S3_BUCKET belum dikonfigurasi' }, { status: 500 });
    }

    const key = `uploads/${Date.now()}_${Math.random().toString(36).slice(2, 8)}_${filename}`;

    // Dynamic import to avoid bundling issues
    const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3');
    const { getSignedUrl } = await import('@aws-sdk/s3-request-presigner');

    const s3 = new S3Client({ region: region || undefined });
    const command = new PutObjectCommand({ Bucket: bucket, Key: key, ContentType: contentType });

    const signedUrl = await getSignedUrl(s3, command, { expiresIn: 3600 });

    return NextResponse.json({ success: true, url: signedUrl, key, bucket, region }, { status: 200 });
  } catch (err) {
    console.error('Presign error:', err);
    return NextResponse.json({ success: false, error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 });
  }
}
