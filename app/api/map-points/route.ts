import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export interface MapPoint {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  severity: 'Tinggi' | 'Sedang' | 'Rendah';
  description: string;
  incidents: number;
  lastIncident: string | null;
}

type RawMapPointRow = {
  id: string;
  name: string;
  description: string | null;
  severity: 'Tinggi' | 'Sedang' | 'Rendah';
  latitude: number | null;
  longitude: number | null;
  incidents: number;
  lastIncident: Date | null;
};

const toFiniteNumber = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
};

const toIsoDateOrNull = (value: unknown): string | null => {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value.toISOString();
  }

  if (typeof value === 'string') {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
  }

  return null;
};

export async function GET() {
  try {
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({
        success: true,
        data: [],
        totalPoints: 0,
      });
    }

    const rows: RawMapPointRow[] = await prisma.$queryRaw<RawMapPointRow[]>`
      SELECT
        tr.id,
        tr.nama AS name,
        tr.deskripsi AS description,
        tr."tingkatRisiko" AS severity,
        ST_Y(tr.koordinat::geometry) AS latitude,
        ST_X(tr.koordinat::geometry) AS longitude,
        COUNT(lw.id)::int AS incidents,
        MAX(lw."createdAt") AS "lastIncident"
      FROM "titik_rawan" tr
      LEFT JOIN "laporan_warga" lw
        ON lw."titikRawanId" = tr.id
       AND lw.status = 'Terverifikasi'
      WHERE tr.koordinat IS NOT NULL
      GROUP BY tr.id, tr.nama, tr.deskripsi, tr."tingkatRisiko", tr.koordinat, tr."createdAt"
      ORDER BY tr."createdAt" DESC
    `;

    const data: MapPoint[] = [
      ...rows
        .map((row: RawMapPointRow) => {
          const latitude = toFiniteNumber(row.latitude);
          const longitude = toFiniteNumber(row.longitude);

          if (latitude === null || longitude === null) {
            return null;
          }

          return {
            id: row.id,
            name: row.name,
            latitude,
            longitude,
            severity: row.severity,
            description: row.description ?? '',
            incidents: row.incidents,
            lastIncident: toIsoDateOrNull(row.lastIncident),
          } satisfies MapPoint;
        })
        .filter((point): point is MapPoint => point !== null),
    ];

    return NextResponse.json({
      success: true,
      data,
      totalPoints: data.length,
    });
  } catch (error) {
    console.error('Failed to fetch map points:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch map points',
      },
      { status: 500 }
    );
  }
}
