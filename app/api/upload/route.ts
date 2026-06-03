import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

function mask(value: string | undefined | null) {
  if (!value) return null;
  if (value.length <= 3) return value;
  return `${value.slice(0, 3)}***`;
}

function encodeS3Key(key: string) {
  return key.split('/').map((segment) => encodeURIComponent(segment)).join('/');
}

// Ensure this route runs in Node.js runtime (not Edge) so AWS SDK works correctly
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ success: false, error: 'Tidak ada file yang dikirim' }, { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ success: false, error: 'Hanya file gambar yang diperbolehkan' }, { status: 400 });
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ success: false, error: 'Ukuran file maksimal 5MB' }, { status: 400 });
    }

    // Generate unique filename/key for S3
    const ext = file.name.split('.').pop() ?? 'jpg';
    const key = `uploads/laporan_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;

    // Read file buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Configure S3 client (credentials are taken from env or IAM role)
    const region = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || '';
    const bucket = process.env.S3_BUCKET;
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

    // Configure S3 client; support custom S3-compatible endpoint (e.g. Supabase Storage)
    const s3Config: any = { region: region || undefined };
    if (s3Endpoint) {
      s3Config.endpoint = s3Endpoint;
      // Use path-style for many S3-compatible endpoints
      s3Config.forcePathStyle = true;
    }
    const s3 = new S3Client(s3Config);

    try {
      await s3.send(new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: buffer,
        ContentType: file.type,
      }));
    } catch (s3Error) {
      console.error('S3 upload error:', s3Error);
      return NextResponse.json({
        success: false,
        error: `Gagal mengunggah ke S3: ${s3Error instanceof Error ? s3Error.message : 'Unknown error'}`,
        s3BucketMasked: mask(bucket),
        s3BucketPresent: !!bucket,
        s3EndpointMasked: mask(s3Endpoint),
        region,
      }, { status: 500 });
    }

    // Construct object URL (best-effort; adjust for custom domains/CORS as needed)
    const encodedKey = encodeS3Key(key);
    let url;
    if (!region || region === 'us-east-1') {
      url = `https://${bucket}.s3.amazonaws.com/${encodedKey}`;
    } else {
      url = `https://${bucket}.s3.${region}.amazonaws.com/${encodedKey}`;
    }

    return NextResponse.json({ success: true, url });
  } catch (error) {
    console.error('Upload API general error:', error);
    return NextResponse.json({ 
      success: false, 
      error: `Kesalahan server upload: ${error instanceof Error ? error.message : 'Unknown error'}` 
    }, { status: 500 });
  }
}
