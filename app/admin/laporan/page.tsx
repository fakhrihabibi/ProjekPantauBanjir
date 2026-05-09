import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { verifyAdminSessionToken, ADMIN_SESSION_COOKIE } from '@/lib/admin-auth';
import { AdminLaporanManager, type AdminReportItem } from './AdminLaporanManager';

const normalizeRating = (value: string): AdminReportItem['rating'] => {
  const lowered = value.toLowerCase();

  if (lowered.includes('parah') || lowered.includes('tinggi') || lowered.includes('darurat')) {
    return 'Parah';
  }

  if (lowered.includes('sedang')) {
    return 'Sedang';
  }

  return 'Rendah';
};

export default async function AdminLaporanPage() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;

  if (!sessionToken || !(await verifyAdminSessionToken(sessionToken))) {
    redirect('/admin/login?next=/admin/laporan');
  }

  let reports: AdminReportItem[] = [];
  let databaseAvailable = true;

  try {
    const rows = await prisma.laporanWarga.findMany({
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

    reports = rows.map((row) => ({
      id: row.id,
      lokasi: row.titikRawan?.nama ?? 'Belum ditautkan ke titik rawan',
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
  } catch (error) {
    databaseAvailable = false;
    console.error('Failed to load admin reports:', error);
  }

  return (
    <div className="page-shell space-y-6 py-8">
      <section className="surface-card rounded-3xl p-8 shadow-sm ring-1 ring-slate-200">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-600">Admin Laporan</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-900">Penilaian Prioritas Laporan</h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600 md:text-base">
          Admin dapat melihat detail laporan, melakukan ACC verifikasi, dan memberi rating prioritas sebelum tindak lanjut lapangan.
        </p>
      </section>

      <AdminLaporanManager initialReports={reports} databaseAvailable={databaseAvailable} />
    </div>
  );
}
