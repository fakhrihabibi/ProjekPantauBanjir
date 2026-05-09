import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { AUTH_SESSION_COOKIE, verifySessionToken } from '@/lib/session';
import { HOTSPOT_MATCH_RADIUS_METERS } from '@/lib/map-config';

export const runtime = 'nodejs';

const updateLaporanSchema = z
  .object({
    status: z.string().min(3).max(80).optional(),
    rating: z.enum(['Parah', 'Sedang', 'Rendah']).optional(),
  })
  .refine((value) => value.status || value.rating, {
    message: 'Payload update tidak boleh kosong.',
  });

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

const mapLaporanResponse = (row: {
  id: string;
  namaPelapor: string;
  deskripsiKejadian: string;
  status: string;
  tingkatKeparahan: string;
  fotoUrl: string | null;
  createdAt: Date;
  titikRawan: { nama: string } | null;
}) => {
  const rating = row.tingkatKeparahan.toLowerCase().includes('sedang')
    ? 'Sedang'
    : row.tingkatKeparahan.toLowerCase().includes('rendah')
      ? 'Rendah'
      : 'Parah';

  return {
    id: row.id,
    lokasi: row.titikRawan?.nama ?? 'Belum ditautkan ke titik rawan',
    pelapor: row.namaPelapor,
    waktu: new Intl.DateTimeFormat('id-ID', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(row.createdAt),
    deskripsi: row.deskripsiKejadian,
    status: row.status,
    rating,
    fotoUrl: row.fotoUrl,
  };
};

type ReportLinkingRow = {
  latitude: number | null;
  longitude: number | null;
  lokasi: string | null;
  deskripsiKejadian: string;
  tingkatKeparahan: string;
};

async function ensureHotspotLinkForVerifiedReport(reportId: string, adminUserId: string) {
  const reportRows = await prisma.$queryRaw<ReportLinkingRow[]>`
    SELECT
      ST_Y(lw.koordinat::geometry) AS latitude,
      ST_X(lw.koordinat::geometry) AS longitude,
      lw.lokasi,
      lw."deskripsiKejadian",
      lw."tingkatKeparahan"
    FROM "laporan_warga" lw
    WHERE lw.id = ${reportId}
      AND lw.koordinat IS NOT NULL
      AND lw."titikRawanId" IS NULL
    LIMIT 1
  `;

  const report = reportRows[0];

  if (!report || report.latitude === null || report.longitude === null) {
    return;
  }

  const nearestRows = await prisma.$queryRaw<{ id: string }[]>`
    SELECT tr.id
    FROM "titik_rawan" tr
    WHERE ST_DWithin(
      tr.koordinat::geography,
      ST_SetSRID(ST_Point(${report.longitude}, ${report.latitude}), 4326)::geography,
      ${HOTSPOT_MATCH_RADIUS_METERS}
    )
    ORDER BY ST_Distance(
      tr.koordinat::geography,
      ST_SetSRID(ST_Point(${report.longitude}, ${report.latitude}), 4326)::geography
    ) ASC
    LIMIT 1
  `;

  const nearest = nearestRows[0];

  if (nearest) {
    await prisma.$executeRaw`
      UPDATE "laporan_warga"
      SET "titikRawanId" = ${nearest.id},
          "verifiedAt" = COALESCE("verifiedAt", NOW()),
          "verifiedById" = COALESCE("verifiedById", ${adminUserId}),
          "updatedAt" = NOW()
      WHERE id = ${reportId}
    `;
    return;
  }

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
      ${report.deskripsiKejadian},
      ${normalizedSeverity},
      ${HOTSPOT_MATCH_RADIUS_METERS},
      ST_SetSRID(ST_Point(${report.longitude}, ${report.latitude}), 4326),
      NOW(),
      ${adminUserId},
      NOW(),
      NOW()
    )
    RETURNING id
  `;

  const hotspot = hotspotRows[0];

  if (!hotspot) {
    return;
  }

  await prisma.$executeRaw`
    UPDATE "laporan_warga"
    SET "titikRawanId" = ${hotspot.id},
        "verifiedAt" = COALESCE("verifiedAt", NOW()),
        "verifiedById" = COALESCE("verifiedById", ${adminUserId}),
        "updatedAt" = NOW()
    WHERE id = ${reportId}
  `;
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const sessionToken = request.cookies.get(AUTH_SESSION_COOKIE)?.value;
    const session = sessionToken ? await verifySessionToken(sessionToken) : null;

    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized.',
        },
        { status: 401 }
      );
    }

    const body = await request.json();
    const parsed = updateLaporanSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: parsed.error.issues[0]?.message ?? 'Payload tidak valid.',
        },
        { status: 400 }
      );
    }

    const updateData: {
      status?: string;
      tingkatKeparahan?: string;
    } = {};

    if (parsed.data.status) {
      updateData.status = parsed.data.status;
    }

    if (parsed.data.rating) {
      updateData.tingkatKeparahan = parsed.data.rating;
    }

    const reportId = id;

    // Use raw SQL because LaporanWarga has Unsupported PostGIS field
    // that causes Prisma ORM methods to fail
    if (updateData.status && updateData.tingkatKeparahan) {
      await prisma.$executeRaw`
        UPDATE "laporan_warga"
        SET status = ${updateData.status},
            "tingkatKeparahan" = ${updateData.tingkatKeparahan},
            "updatedAt" = NOW()
        WHERE id = ${reportId}
      `;
    } else if (updateData.status) {
      await prisma.$executeRaw`
        UPDATE "laporan_warga"
        SET status = ${updateData.status},
            "updatedAt" = NOW()
        WHERE id = ${reportId}
      `;
    } else {
      await prisma.$executeRaw`
        UPDATE "laporan_warga"
        SET "tingkatKeparahan" = ${updateData.tingkatKeparahan},
            "updatedAt" = NOW()
        WHERE id = ${reportId}
      `;
    }

    if (updateData.status === 'Terverifikasi') {
      await prisma.$executeRaw`
        UPDATE "laporan_warga"
        SET "verifiedAt" = COALESCE("verifiedAt", NOW()),
            "verifiedById" = COALESCE("verifiedById", ${session.userId}),
            "updatedAt" = NOW()
        WHERE id = ${reportId}
      `;

      await ensureHotspotLinkForVerifiedReport(reportId, session.userId);
    }

    // Fetch updated row with raw SQL to avoid Unsupported field in SELECT
    const rows = await prisma.$queryRaw<{
      id: string;
      namaPelapor: string;
      deskripsiKejadian: string;
      status: string;
      tingkatKeparahan: string;
      fotoUrl: string | null;
      createdAt: Date;
      titikNama: string | null;
    }[]>`
      SELECT
        lw.id,
        lw."namaPelapor",
        lw."deskripsiKejadian",
        lw.status,
        lw."tingkatKeparahan",
        lw."fotoUrl",
        lw."createdAt",
        tr.nama AS "titikNama"
      FROM "laporan_warga" lw
      LEFT JOIN "titik_rawan" tr ON tr.id = lw."titikRawanId"
      WHERE lw.id = ${reportId}
      LIMIT 1
    `;

    const row = rows[0];
    if (!row) {
      return NextResponse.json(
        { success: false, error: 'Laporan tidak ditemukan.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: mapLaporanResponse({
        id: row.id,
        namaPelapor: row.namaPelapor,
        deskripsiKejadian: row.deskripsiKejadian,
        status: row.status,
        tingkatKeparahan: row.tingkatKeparahan,
        fotoUrl: row.fotoUrl,
        createdAt: row.createdAt,
        titikRawan: row.titikNama ? { nama: row.titikNama } : null,
      }),
    });
  } catch (error) {
    console.error('Failed to update admin laporan:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Gagal memperbarui laporan.',
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const sessionToken = request.cookies.get(AUTH_SESSION_COOKIE)?.value;
    const session = sessionToken ? await verifySessionToken(sessionToken) : null;

    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized.',
        },
        { status: 401 }
      );
    }

    const reportId = id;

    // Use raw SQL because of Unsupported PostGIS field
    const deletedRows = await prisma.$queryRaw<{ id: string }[]>`
      DELETE FROM "laporan_warga"
      WHERE id = ${reportId}
      RETURNING id
    `;

    if (deletedRows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Laporan tidak ditemukan.',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Laporan berhasil dihapus.',
    });
  } catch (error) {
    console.error('Failed to delete admin laporan:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Gagal menghapus laporan.',
      },
      { status: 500 }
    );
  }
}
