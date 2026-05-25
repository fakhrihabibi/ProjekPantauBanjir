import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function toNumber(value: string | null, fallback = 0) {
  if (!value) return fallback;
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export async function GET(req: Request) {
  try {
    // If no DB configured, return safe default so frontend doesn't break
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ success: true, level: 'Normal', totalCount: 0, nearbyCount: 0, reports: [] });
    }
    const url = new URL(req.url);
    const lat = toNumber(url.searchParams.get('lat'));
    const lng = toNumber(url.searchParams.get('lng'));
    const radius = toNumber(url.searchParams.get('radius'), 1000); // meters
    if (!lat || !lng) {
      return NextResponse.json({ success: false, error: 'lat and lng query parameters are required' }, { status: 400 });
    }

    // Count all nearby reports regardless of verification status.
    const totalResult: Array<{ count: number }> = await prisma.$queryRaw`
      SELECT COUNT(*)::int AS count
      FROM "laporan_warga" lw
      WHERE lw.koordinat IS NOT NULL
        AND ST_DWithin(lw.koordinat::geography, ST_SetSRID(ST_Point(${lng}, ${lat}),4326)::geography, ${radius})
    `;

    const totalCount = totalResult?.[0]?.count ?? 0;

    // Count nearby verified reports with coordinates within radius
    const nearbyResult: Array<{ count: number }> = await prisma.$queryRaw`
      SELECT COUNT(*)::int AS count
      FROM "laporan_warga" lw
      WHERE lw.status = 'Terverifikasi'
        AND lw.koordinat IS NOT NULL
        AND ST_DWithin(lw.koordinat::geography, ST_SetSRID(ST_Point(${lng}, ${lat}),4326)::geography, ${radius})
    `;

    const nearbyCount = nearbyResult?.[0]?.count ?? 0;

    // Sample recent nearby reports (limit 10)
    const reports: Array<any> = await prisma.$queryRaw`
      SELECT lw.id, lw.status, lw."createdAt", lw."tingkatKeparahan" AS "severity", ST_Y(lw.koordinat::geometry) AS latitude, ST_X(lw.koordinat::geometry) AS longitude, lw."fotoUrl"
      FROM "laporan_warga" lw
      WHERE lw.status = 'Terverifikasi'
        AND lw.koordinat IS NOT NULL
        AND ST_DWithin(lw.koordinat::geography, ST_SetSRID(ST_Point(${lng}, ${lat}),4326)::geography, ${radius})
      ORDER BY lw."createdAt" DESC
      LIMIT 10
    `;

    // Simple level rules (tunable) based on verified nearby reports
    let level = 'Normal';
    if (nearbyCount >= 10) level = 'Siaga 3';
    else if (nearbyCount >= 5) level = 'Siaga 2';
    else if (nearbyCount >= 1) level = 'Siaga 1';

    return NextResponse.json({ success: true, level, totalCount, nearbyCount, reports });
  } catch (error) {
    console.error('Error in emergency-status route:', error);
    // Return safe default (consistent shape) instead of HTTP 500 so frontend banner doesn't show an error
    return NextResponse.json({ success: true, level: 'Normal', totalCount: 0, nearbyCount: 0, reports: [] });
  }
}
