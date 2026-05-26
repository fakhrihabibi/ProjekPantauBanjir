import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

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

    // Generate unique filename
    const ext = file.name.split('.').pop() ?? 'jpg';
    const filename = `laporan_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;

    // Ensure upload directory exists
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    await mkdir(uploadDir, { recursive: true });

    // Write file to disk
    const buffer = Buffer.from(await file.arrayBuffer());
    const filePath = path.join(uploadDir, filename);
    
    try {
      await writeFile(filePath, buffer);
    } catch (writeError) {
      console.error('File write error:', writeError);
      return NextResponse.json({ 
        success: false, 
        error: `Gagal menulis file ke disk: ${writeError instanceof Error ? writeError.message : 'Unknown error'}` 
      }, { status: 500 });
    }

    const url = `/uploads/${filename}`;
    return NextResponse.json({ success: true, url });
  } catch (error) {
    console.error('Upload API general error:', error);
    return NextResponse.json({ 
      success: false, 
      error: `Kesalahan server upload: ${error instanceof Error ? error.message : 'Unknown error'}` 
    }, { status: 500 });
  }
}
