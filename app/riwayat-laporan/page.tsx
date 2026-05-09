import { redirect } from 'next/navigation';
import { getCurrentSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

type HistoryRow = {
  id: string;
  lokasi: string | null;
  tingkatKeparahan: string;
  status: string;
  createdAt: Date;
};

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export default async function RiwayatLaporanPage() {
  const session = await getCurrentSession();

  if (!session || session.role !== 'USER') {
    redirect('/login?next=/riwayat-laporan');
  }

  const reports = await prisma.$queryRaw<HistoryRow[]>`
    SELECT
      id,
      lokasi,
      "tingkatKeparahan",
      status,
      "createdAt"
    FROM "laporan_warga"
    WHERE "userId" = ${session.userId}
    ORDER BY "createdAt" DESC
    LIMIT 50
  `;

  return (
    <div className="page-shell space-y-6 py-8">
      <section className="surface-card rounded-3xl p-8 shadow-sm ring-1 ring-slate-200">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-sky-600">Akun Saya</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-900">Riwayat Laporan</h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600 md:text-base">
          Daftar laporan yang dikirim dari akun Anda beserta status verifikasinya.
        </p>
      </section>

      <section className="surface-card overflow-hidden rounded-2xl">
        {reports.length === 0 ? (
          <div className="p-6 text-sm text-slate-600">
            Belum ada laporan yang terhubung ke akun ini.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px]">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">ID</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">Lokasi</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">Keparahan</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">Waktu</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((report) => (
                  <tr key={report.id} className="border-b border-slate-100 last:border-b-0">
                    <td className="px-4 py-4 text-xs font-semibold text-slate-800">{report.id}</td>
                    <td className="px-4 py-4 text-sm text-slate-700">{report.lokasi ?? 'Lokasi tidak diketahui'}</td>
                    <td className="px-4 py-4 text-sm text-slate-700">{report.tingkatKeparahan}</td>
                    <td className="px-4 py-4 text-sm text-slate-700">{report.status}</td>
                    <td className="px-4 py-4 text-sm text-slate-700">
                      {new Intl.DateTimeFormat('id-ID', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      }).format(report.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
