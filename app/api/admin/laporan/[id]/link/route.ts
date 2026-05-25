import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifySessionToken } from '@/lib/session';
import { ADMIN_SESSION_COOKIE } from '@/lib/admin-auth';

export const runtime = 'nodejs';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const sessionToken = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
    const session = sessionToken ? await verifySessionToken(sessionToken) : null;

    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
    }

    const reportId = id;

    // Get report coordinates
    const rows = await prisma.$queryRaw<{ latitude: number | null; longitude: number | null; lokasi: string | null; deskripsi: string; tingkatKeparahan: string }[]>`
      SELECT
        ST_Y(lw.koordinat::geometry) AS latitude,
        ST_X(lw.koordinat::geometry) AS longitude,
        lw.lokasi,
        lw."deskripsiKejadian",
        lw."tingkatKeparahan"
      FROM "laporan_warga" lw
      WHERE lw.id = ${reportId}
      LIMIT 1
    `;

    const report = rows[0];

    if (!report) {
      return NextResponse.json({ success: false, error: 'Laporan tidak ditemukan.' }, { status: 404 });
    }

    if (report.latitude === null || report.longitude === null) {
      return NextResponse.json({ success: false, error: 'Laporan tidak memiliki koordinat.' }, { status: 400 });
    }

    // Create titik_rawan entry
    const normalizedSeverity = report.tingkatKeparahan.toLowerCase().includes('parah')
      ? 'Tinggi'
      : report.tingkatKeparahan.toLowerCase().includes('sedang')
      ? 'Sedang'
      : 'Rendah';

    const hotspotRows = await prisma.$queryRaw<{ id: string }[]>`
      INSERT INTO "titik_rawan" (
        id,
        nama,
        deskripsi,
        "tingkatRisiko",
        "radiusMeter",
        koordinat,
        "verifiedAt",
        "verifiedById",
        "createdAt",
        "updatedAt"
      ) VALUES (
        ${`tr_${reportId}`},
        ${report.lokasi ?? 'Titik Rawan Baru'},
        ${report.deskripsi},
        ${normalizedSeverity},
        ${100},
        ST_SetSRID(ST_Point(${report.longitude}, ${report.latitude}), 4326),
        NOW(),
        ${session.userId},
        NOW(),
        NOW()
      )
      RETURNING id
    `;

    const hotspot = hotspotRows[0];

    if (!hotspot) {
      return NextResponse.json({ success: false, error: 'Gagal membuat titik rawan.' }, { status: 500 });
    }

    await prisma.$executeRaw`
      UPDATE "laporan_warga"
      SET "titikRawanId" = ${hotspot.id},
          "verifiedAt" = COALESCE("verifiedAt", NOW()),
          "verifiedById" = COALESCE("verifiedById", ${session.userId}),
          "updatedAt" = NOW()
      WHERE id = ${reportId}
    `;

    return NextResponse.json({ success: true, hotspotId: hotspot.id });
  } catch (error) {
    console.error('Failed to link report to hotspot:', error);
    const message = error instanceof Error ? error.message : 'Gagal menautkan laporan.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
