import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getCurrentSession } from '@/lib/auth';
import { AdminLaporanManager, type AdminReportItem } from './AdminLaporanManager';
import Link from 'next/link';

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

export default async function AdminLaporanPage({ searchParams }: { searchParams?: { [key: string]: string | string[] } }) {
  const session = await getCurrentSession();

  if (!session || session.role !== 'ADMIN') {
    redirect('/admin/login?next=/admin/laporan');
  }

  const showBackToAdmin = searchParams?.from === 'admin' && session && session.role === 'ADMIN';

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

    reports = rows.map((row: any) => ({
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
    console.warn('Admin reports not available (database unreachable).');
  }

  return (
    <div className="page-shell space-y-6 py-8">
      <section className="surface-card rounded-3xl p-8 shadow-sm ring-1 ring-slate-200">
        {showBackToAdmin ? (
          <div className="mb-3">
            <Link href="/laporan" className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              ← Kembali ke Kelola Laporan
            </Link>
          </div>
        ) : null}
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-600">Kelola Laporan</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-900">Kelola Laporan & Tetapkan Prioritas</h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600 md:text-base">
          Halaman ini digunakan untuk meninjau laporan warga, memverifikasi kebenaran lapangan, dan menetapkan prioritas penanganan.
          Setiap perubahan tercatat untuk keperluan audit. Gunakan tombol di samping untuk melihat detail, menyetujui, atau memberi peringkat prioritas.
        </p>
      </section>

      <AdminLaporanManager initialReports={reports} databaseAvailable={databaseAvailable} />
    </div>
  );
}
