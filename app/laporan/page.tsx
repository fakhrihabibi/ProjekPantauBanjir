import { prisma } from '@/lib/prisma';
import { LaporanClient } from './LaporanClient';
import { getCurrentSession } from '@/lib/auth';
import type { LaporanItem, AdminReportItem } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type LaporanRow = {
  id: string;
  namaPelapor: string;
  nomorTelepon: string | null;
  lokasi: string | null;
  tingkatKeparahan: string;
  deskripsiKejadian: string;
  status: string;
  createdAt: Date;
};

const normalizeRating = (value: string): AdminReportItem['rating'] => {
  const lowered = value.toLowerCase();

  if (lowered.includes('tinggi') || lowered.includes('parah') || lowered.includes('darurat')) {
    return 'Tinggi';
  }

  if (lowered.includes('sedang')) {
    return 'Sedang';
  }

  return 'Rendah';
};

const isDatabaseReachabilityError = (error: unknown) => {
  if (!(error instanceof Error)) {
    return false;
  }

  return (
    error.message.includes("Can't reach database server") ||
    error.message.includes('PrismaClientInitializationError')
  );
};

export default async function LaporanPage() {
  const session = await getCurrentSession();
  const isAdmin = session?.role === 'ADMIN';

  let reports: LaporanItem[] = [];
  let adminReports: AdminReportItem[] = [];
  let databaseAvailable = true;

  try {
    const rows = await prisma.$queryRaw<LaporanRow[]>`
      SELECT
        id,
        "namaPelapor",
        "nomorTelepon",
        lokasi,
        "tingkatKeparahan",
        "deskripsiKejadian",
        status,
        "createdAt"
      FROM "laporan_warga"
      ORDER BY "createdAt" DESC
      LIMIT 50
    `;

    reports = rows.map((row: any) => ({
      id: row.id,
      location: row.lokasi ?? 'Lokasi tidak diketahui',
      date: new Intl.DateTimeFormat('id-ID', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(row.createdAt),
      reporter: row.namaPelapor,
      status: row.status,
      description: row.deskripsiKejadian,
    }));

    if (isAdmin) {
      const adminRows = await prisma.laporanWarga.findMany({
        include: {
          titikRawan: {
            select: {
              nama: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 100,
      });

      adminReports = adminRows.map((row: any) => ({
        id: row.id,
        lokasi: row.titikRawan?.nama ?? row.lokasi ?? 'Belum ditautkan ke titik rawan',
        pelapor: row.namaPelapor,
        waktu: new Intl.DateTimeFormat('id-ID', {
          dateStyle: 'medium',
          timeStyle: 'short',
        }).format(row.createdAt),
        deskripsi: row.deskripsiKejadian,
        status: row.status,
        rating: normalizeRating(row.tingkatKeparahan),
        fotoUrl: row.fotoUrl,
      }));
    }
  } catch (error) {
    if (isDatabaseReachabilityError(error)) {
      databaseAvailable = false;
    } else {
      console.error('Failed to fetch reports:', error);
    }
  }

  return (
    <LaporanClient
      initialReports={reports}
      databaseAvailable={databaseAvailable}
      isAdmin={isAdmin}
      adminReports={adminReports}
    />
  );
}
