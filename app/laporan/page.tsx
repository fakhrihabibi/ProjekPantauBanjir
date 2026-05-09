import { prisma } from '@/lib/prisma';
import { LaporanClient, type LaporanItem } from './LaporanClient';

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

export default async function LaporanPage() {
  let reports: LaporanItem[] = [];

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

    reports = rows.map((row) => ({
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
  } catch (error) {
    console.error('Failed to fetch reports:', error);
  }

  return <LaporanClient initialReports={reports} />;
}
