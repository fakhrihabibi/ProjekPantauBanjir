import nextDynamic from 'next/dynamic';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const MapComponent = nextDynamic(() => import('@/components/MapComponent').then(mod => mod.MapComponent), {
  ssr: false,
  loading: () => (
    <div className="h-96 bg-gray-100 rounded-lg flex items-center justify-center">
      <p className="text-gray-500">Memuat peta...</p>
    </div>
  ),
});

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

export default async function PetaPage() {
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
    console.error('Failed to load map page stats:', error);
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

  return (
    <div className="page-shell">
      <div className="page-header">
        <h1 className="text-3xl font-bold text-gray-900">Peta Titik Rawan Banjir</h1>
        <p className="text-gray-600 mt-2">
          Visualisasi interaktif area rawan banjir di Bojongsoang dengan filter tingkat risiko, cluster marker, dan detail lokasi.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4 mb-6">
        <div className="surface-card p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Total Titik</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{stats.total_points}</p>
          <p className="mt-1 text-sm text-gray-600">Titik rawan yang terdaftar</p>
        </div>
        <div className="surface-card p-4 border border-red-100 bg-red-50/60">
          <p className="text-xs font-semibold uppercase tracking-wide text-red-500">Risiko Tinggi</p>
          <p className="mt-2 text-3xl font-bold text-red-700">{stats.tinggi_points}</p>
          <p className="mt-1 text-sm text-red-700/80">Prioritas penanganan</p>
        </div>
        <div className="surface-card p-4 border border-amber-100 bg-amber-50/60">
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-500">Risiko Sedang</p>
          <p className="mt-2 text-3xl font-bold text-amber-700">{stats.sedang_points}</p>
          <p className="mt-1 text-sm text-amber-700/80">Perlu pemantauan</p>
        </div>
        <div className="surface-card p-4 border border-emerald-100 bg-emerald-50/60">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-500">Risiko Rendah</p>
          <p className="mt-2 text-3xl font-bold text-emerald-700">{stats.rendah_points}</p>
          <p className="mt-1 text-sm text-emerald-700/80">Relatif lebih aman</p>
        </div>
      </div>

      {/* Legend */}
      <div className="surface-card p-4 mb-6">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h3 className="font-semibold text-gray-900">Legenda Tingkat Risiko</h3>
          <p className="text-xs text-gray-500">
            Dominan saat ini: <span className="font-semibold text-gray-800">{dominantSeverity}</span>
          </p>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="flex items-center gap-3 rounded-xl border border-red-100 bg-red-50 px-4 py-3">
            <div className="h-4 w-4 rounded-full bg-red-500 shadow-sm"></div>
            <div>
              <p className="text-sm font-semibold text-red-700">Risiko Tinggi</p>
              <p className="text-xs text-red-600">Jumlah: {stats.tinggi_points}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3">
            <div className="h-4 w-4 rounded-full bg-amber-500 shadow-sm"></div>
            <div>
              <p className="text-sm font-semibold text-amber-700">Risiko Sedang</p>
              <p className="text-xs text-amber-600">Jumlah: {stats.sedang_points}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3">
            <div className="h-4 w-4 rounded-full bg-emerald-500 shadow-sm"></div>
            <div>
              <p className="text-sm font-semibold text-emerald-700">Risiko Rendah</p>
              <p className="text-xs text-emerald-600">Jumlah: {stats.rendah_points}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Map */}
      <div className="surface-card overflow-hidden mb-8">
        <div className="relative h-[420px] md:h-[520px]">
          <MapComponent />
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
