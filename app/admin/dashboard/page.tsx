import Link from 'next/link';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyAdminSessionToken, ADMIN_SESSION_COOKIE } from '@/lib/admin-auth';

export default async function AdminDashboardPage() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;

  if (!sessionToken || !(await verifyAdminSessionToken(sessionToken))) {
    redirect('/admin/login?next=/admin/dashboard');
  }

  const summaryCards = [
    {
      title: 'Verifikasi Laporan',
      description: 'Cek laporan warga dan tentukan status valid atau perlu ditinjau ulang.',
      href: '/admin/laporan',
    },
    {
      title: 'Rating Laporan',
      description: 'Beri skor prioritas pada laporan untuk menentukan tindak lanjut cepat.',
      href: '/admin/laporan',
    },
    {
      title: 'Kelola Peta',
      description: 'Tinjau titik rawan dan pembaruan lokasi banjir yang tampil di peta publik.',
      href: '/peta',
    },
    {
      title: 'Buka Data',
      description: 'Lihat statistik dan data historis sebagai bahan keputusan operasional.',
      href: '/data',
    },
  ];

  return (
    <div className="page-shell space-y-8 py-8">
      <section className="surface-card rounded-3xl p-8 shadow-sm ring-1 ring-slate-200">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-sky-600">Admin Dashboard</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-900">Panel Admin PantauBanjir</h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600 md:text-base">
          Area ini khusus untuk admin yang memverifikasi laporan, mengelola data, dan menjaga kualitas informasi yang dilihat publik.
        </p>
        <form action="/api/admin/logout" method="post" className="mt-6">
          <button
            type="submit"
            className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-sky-500 hover:text-sky-700"
          >
            Logout Admin
          </button>
        </form>
      </section>

      <section className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
        {summaryCards.map((card) => (
          <Link
            key={card.title}
            href={card.href}
            className="surface-card rounded-2xl p-6 transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <h2 className="text-lg font-bold text-slate-900">{card.title}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">{card.description}</p>
          </Link>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <article className="surface-card rounded-2xl p-6">
          <h2 className="text-xl font-bold text-slate-900">Catatan Operasional</h2>
          <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
            <li>• Verifikasi laporan sebelum dipublikasikan sebagai status resmi.</li>
            <li>• Gunakan data peta dan data historis untuk prioritas penanganan.</li>
            <li>• Simpan audit perubahan agar alur admin tetap transparan.</li>
          </ul>
        </article>

        <article className="surface-card rounded-2xl p-6">
          <h2 className="text-xl font-bold text-slate-900">Akses Cepat</h2>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link href="/admin/laporan" className="rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-700">
              Nilai Laporan
            </Link>
            <Link href="/peta" className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-sky-500 hover:text-sky-700">
              Buka Peta
            </Link>
          </div>
        </article>
      </section>
    </div>
  );
}
