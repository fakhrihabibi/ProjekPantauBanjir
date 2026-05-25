import { MapWrapper } from '@/components/map/MapWrapper';
import { prisma } from '@/lib/prisma';
import { getCurrentSession } from '@/lib/auth';
import Link from 'next/link';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type SeverityCount = {
  tingkatRisiko: string;
  _count: {
    _all: number;
  };
};

type MapPageStatsRow = {
  total_points: number;
  tinggi_points: number;
  sedang_points: number;
  rendah_points: number;
};

export default async function PetaPage({ searchParams }: { searchParams?: { [key: string]: string | string[] } }) {
  const fallbackStats = {
    total_points: 0,
    tinggi_points: 0,
    sedang_points: 0,
    rendah_points: 0,
  };

  let stats = fallbackStats;
  let severityBreakdown: SeverityCount[] = [];

  try {
    const [statsRows, severityRows] = await Promise.all([
      prisma.$queryRaw<MapPageStatsRow[]>`
        SELECT
          COUNT(*)::int AS total_points,
          COUNT(*) FILTER (WHERE LOWER("tingkatRisiko") LIKE '%tinggi%')::int AS tinggi_points,
          COUNT(*) FILTER (WHERE LOWER("tingkatRisiko") LIKE '%sedang%')::int AS sedang_points,
          COUNT(*) FILTER (WHERE LOWER("tingkatRisiko") LIKE '%rendah%')::int AS rendah_points
        FROM "titik_rawan"
        WHERE koordinat IS NOT NULL
      `,
      prisma.titikRawan.groupBy({
        by: ['tingkatRisiko'],
        _count: {
          _all: true,
        },
      }),
    ]);

    stats = statsRows[0] ?? fallbackStats;
    severityBreakdown = severityRows;
  } catch (error) {
    console.warn('Map stats not available (database unreachable).');
  }

  const severityCounts = severityBreakdown.reduce(
    (counts, item: SeverityCount) => {
      const severity = item.tingkatRisiko.toLowerCase();

      if (severity.includes('tinggi')) {
        counts.tinggi += item._count._all;
      } else if (severity.includes('sedang')) {
        counts.sedang += item._count._all;
      } else if (severity.includes('rendah')) {
        counts.rendah += item._count._all;
      }

      return counts;
    },
    { tinggi: 0, sedang: 0, rendah: 0 }
  );

  const dominantSeverity =
    stats.tinggi_points >= stats.sedang_points && stats.tinggi_points >= stats.rendah_points
      ? 'Tinggi'
      : stats.sedang_points >= stats.rendah_points
        ? 'Sedang'
        : 'Rendah';

  // Determine if we should show back-to-dashboard for admin
  const session = await getCurrentSession();
  const showBackToAdmin = searchParams?.from === 'admin' && session && session.role === 'ADMIN';

  return (
    <div className="page-shell">
      <div className="page-header">
        {/* Show back to admin dashboard if navigated from admin and user is admin */}
        {searchParams?.from === 'admin' ? (
          (() => {
            // server-side check for session role
          })()
        ) : null}
        <h1 className="text-3xl font-bold text-gray-900">Peta Titik Rawan Banjir</h1>
        {showBackToAdmin ? (
          <div className="mb-3">
            <Link href="/laporan" className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              ← Kembali ke Kelola Laporan
            </Link>
          </div>
        ) : null}
        <p className="text-gray-600 mt-2">
          Visualisasi interaktif area rawan banjir di Bojongsoang dengan filter tingkat risiko, cluster marker, dan detail lokasi.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 mb-6">
        <div className="surface-card p-3 sm:p-4">
          <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wide text-gray-500">Total Titik</p>
          <p className="mt-1 sm:mt-2 text-2xl sm:text-3xl font-bold text-slate-900">{stats.total_points}</p>
          <p className="mt-0.5 sm:mt-1 text-[10px] sm:text-sm text-gray-600">Titik terdaftar</p>
        </div>
        <div className="surface-card p-3 sm:p-4 border border-red-100 bg-red-50/60">
          <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wide text-red-500">Tinggi</p>
          <p className="mt-1 sm:mt-2 text-2xl sm:text-3xl font-bold text-red-700">{stats.tinggi_points}</p>
          <p className="mt-0.5 sm:mt-1 text-[10px] sm:text-sm text-red-700/80">Prioritas</p>
        </div>
        <div className="surface-card p-3 sm:p-4 border border-amber-100 bg-amber-50/60">
          <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wide text-amber-500">Sedang</p>
          <p className="mt-1 sm:mt-2 text-2xl sm:text-3xl font-bold text-amber-700">{stats.sedang_points}</p>
          <p className="mt-0.5 sm:mt-1 text-[10px] sm:text-sm text-amber-700/80">Pemantauan</p>
        </div>
        <div className="surface-card p-3 sm:p-4 border border-emerald-100 bg-emerald-50/60">
          <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wide text-emerald-500">Rendah</p>
          <p className="mt-1 sm:mt-2 text-2xl sm:text-3xl font-bold text-emerald-700">{stats.rendah_points}</p>
          <p className="mt-0.5 sm:mt-1 text-[10px] sm:text-sm text-emerald-700/80">Aman</p>
        </div>
      </div>

      {/* Legend */}
      <div className="surface-card p-3 sm:p-4 mb-6">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h3 className="font-semibold text-gray-900 text-sm sm:text-base">Legenda Tingkat Risiko</h3>
          <p className="text-[10px] sm:text-xs text-gray-500">
            Dominan: <span className="font-semibold text-gray-800">{dominantSeverity}</span>
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
          <div className="flex items-center gap-2 sm:gap-3 rounded-xl border border-red-100 bg-red-50 px-3 py-2 sm:px-4 sm:py-3">
            <div className="h-3 w-3 sm:h-4 sm:w-4 rounded-full bg-red-500 shadow-sm"></div>
            <div>
              <p className="text-xs sm:text-sm font-semibold text-red-700">Risiko Tinggi</p>
              <p className="text-[10px] sm:text-xs text-red-600">Jumlah: {stats.tinggi_points}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 rounded-xl border border-amber-100 bg-amber-50 px-3 py-2 sm:px-4 sm:py-3">
            <div className="h-3 w-3 sm:h-4 sm:w-4 rounded-full bg-amber-500 shadow-sm"></div>
            <div>
              <p className="text-xs sm:text-sm font-semibold text-amber-700">Risiko Sedang</p>
              <p className="text-[10px] sm:text-xs text-amber-600">Jumlah: {stats.sedang_points}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 sm:px-4 sm:py-3">
            <div className="h-3 w-3 sm:h-4 sm:w-4 rounded-full bg-emerald-500 shadow-sm"></div>
            <div>
              <p className="text-xs sm:text-sm font-semibold text-emerald-700">Risiko Rendah</p>
              <p className="text-[10px] sm:text-xs text-emerald-600">Jumlah: {stats.rendah_points}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Map */}
      <div className="surface-card mb-8 overflow-hidden">
        <div className="relative h-[500px] sm:h-[560px] md:h-[680px]">
          <MapWrapper stats={stats} severityBreakdown={severityBreakdown} />
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="surface-card p-6">
          <h3 className="font-semibold text-gray-900 mb-2">Saran Penggunaan</h3>
          <p className="text-sm text-gray-600 leading-6">
            Gunakan filter di peta untuk fokus pada wilayah risiko tertentu. Cluster akan membantu saat titik berdekatan, dan panel detail menampilkan informasi marker yang dipilih.
          </p>
        </div>
        <div className="surface-card p-6">
          <h3 className="font-semibold text-gray-900 mb-2">Fokus Utama</h3>
          <p className="text-sm text-gray-600 leading-6">
            Prioritaskan titik dengan risiko tinggi, lalu bandingkan dengan kejadian yang tercatat agar pemantauan lebih cepat dan terarah.
          </p>
        </div>
        <div className="surface-card p-6">
          <h3 className="font-semibold text-gray-900 mb-2">Navigasi Peta</h3>
          <p className="text-sm text-gray-600 leading-6">
            Klik marker untuk melihat detail, gunakan filter untuk menyederhanakan tampilan, dan zoom otomatis akan menyesuaikan titik yang sedang aktif.
          </p>
        </div>
      </div>

      {/* Info Box */}
      <div className="info-panel mt-8 border-blue-200 bg-blue-50">
        <h3 className="font-semibold text-gray-900 mb-2">Cara Menggunakan Peta</h3>
        <ul className="text-sm text-gray-700 space-y-1">
          <li>🖱️ Klik dan tarik untuk memindahkan peta</li>
          <li>🔍 Scroll atau gunakan zoom untuk memperbesar area tertentu</li>
          <li>🎯 Gunakan filter Tinggi, Sedang, atau Rendah untuk menyaring marker</li>
          <li>📍 Klik marker untuk melihat detail lengkap titik rawan</li>
          <li>📊 Marker yang berdekatan akan digabung otomatis agar peta lebih jelas</li>
        </ul>
      </div>
    </div>
  );
}
