import { MonthlyRainfallChart } from '@/components/charts/MonthlyRainfallChart';
import { YearlyFloodFrequencyChart } from '@/components/charts/YearlyFloodFrequencyChart';
import { WaterLevelGauge } from '@/components/charts/WaterLevelGauge';
import { getCurrentSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { fetchBMKGAll, normalizeCurrentFromForecast, getThreeHourForecastToday } from '@/lib/bmkg';
import Link from 'next/link';
import { ChevronLeft, BarChart3, Droplets, MapPin, Info, CloudRain, Thermometer, ShieldAlert } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const revalidate = 3600; // Cache for 1 hour

export default async function DataPage({ searchParams }: { searchParams?: { [key: string]: string | string[] } }) {
  const session = await getCurrentSession();
  const sp = await (searchParams as any);
  const showBackToAdmin = sp?.from === 'admin' && session && session.role === 'ADMIN';

  // --- Real-time Data Fetching ---
  let dbStats = { totalIncidents: 0, totalHotspots: 0, hotspots: [] as any[] };
  let weatherData = null;
  let errorState = false;

  try {
    const [verifiedCount, hotspotCount, hotspots, bmkg] = await Promise.all([
      prisma.laporanWarga.count({ where: { status: 'Terverifikasi' } }),
      prisma.titikRawan.count(),
      prisma.$queryRaw<any[]>`
        SELECT 
          tr.nama as location, 
          tr."tingkatRisiko" as severity,
          COUNT(lw.id)::int as incidents,
          MAX(lw."createdAt") as last_incident
        FROM "titik_rawan" tr
        LEFT JOIN "laporan_warga" lw ON lw."titikRawanId" = tr.id AND lw.status = 'Terverifikasi'
        GROUP BY tr.id, tr.nama, tr."tingkatRisiko"
        ORDER BY incidents DESC
        LIMIT 5
      `,
      fetchBMKGAll()
    ]);

    dbStats = { totalIncidents: verifiedCount, totalHotspots: hotspotCount, hotspots };
    weatherData = bmkg;
  } catch (e) {
    console.error('Data Dashboard Fetch Error:', e);
    errorState = true;
  }

  // --- Process Derived Data using existing normalization logic ---
  const current = normalizeCurrentFromForecast(weatherData?.forecast);
  const forecastToday = getThreeHourForecastToday(weatherData?.forecast);
  
  const currentTemp = current.t ?? 27;
  const weatherDesc = current.weather_desc ?? 'Berawan';
  const humidity = current.hu ?? 80;
  
  // Simulated Water Level logic: Base 40% + humidity factor + warning factor
  const hasWarning = weatherData?.peringatan?.available || (weatherData?.peringatan?.data?.length ?? 0) > 0;
  const simulatedWaterLevel = Math.min(95, 35 + (humidity * 0.15) + (hasWarning ? 25 : 0));

  // --- Historical Rainfall Data (Last 5 Years) ---
  const historicalRainfall = [
    { bulan: '2020', curahHujan: 1850 },
    { bulan: '2021', curahHujan: 2100 },
    { bulan: '2022', curahHujan: 1950 },
    { bulan: '2023', curahHujan: 1780 },
    { bulan: '2024', curahHujan: 2240 },
  ];

  const stats = [
    { label: 'Total Kejadian', value: dbStats.totalIncidents.toString(), trend: 'Laporan Terverifikasi', icon: BarChart3, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Suhu Udara', value: `${currentTemp}°C`, trend: weatherDesc, icon: Thermometer, color: 'text-orange-600', bg: 'bg-orange-50' },
    { label: 'Kelembapan', value: `${humidity}%`, trend: 'Live BMKG', icon: Droplets, color: 'text-cyan-600', bg: 'bg-cyan-50' },
    { label: 'Titik Terpantau', value: dbStats.totalHotspots.toString(), trend: 'Lokasi Rawan', icon: MapPin, color: 'text-rose-600', bg: 'bg-rose-50' },
  ];

  return (
    <div className="page-shell space-y-6 sm:space-y-8 py-6 sm:py-8">
      <div className="page-header">
        {showBackToAdmin && (
          <div className="mb-4">
            <Link href="/laporan" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 sm:px-4 py-1.5 sm:py-2 text-[10px] sm:text-sm font-bold text-slate-700 transition hover:bg-slate-50 hover:text-brand-600">
              <ChevronLeft className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
              Kembali ke Kelola Laporan
            </Link>
          </div>
        )}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-950 tracking-tight">Dashboard Data</h1>
            <p className="text-sm sm:text-base md:text-lg font-medium text-slate-500 mt-1">
              Analisis statistik dan monitoring Bojongsoang.
            </p>
          </div>
          <div className="flex flex-row md:flex-col items-center md:items-end gap-2">
            <div className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-brand-50 rounded-2xl border border-brand-100">
               <div className="w-1.5 sm:w-2 h-1.5 sm:h-2 rounded-full bg-brand-500 animate-pulse" />
              <span className="text-[9px] sm:text-xs font-bold uppercase tracking-widest text-brand-700">Data BMKG</span>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 bg-slate-50 rounded-xl border border-slate-100">
               <ShieldAlert className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-slate-400" />
              <span className="text-[8px] sm:text-[10px] font-bold uppercase tracking-widest text-slate-500">Status Laporan</span>
            </div>
          </div>
        </div>
      </div>

      {errorState && (
        <div className="p-3 sm:p-4 bg-amber-50 border border-amber-200 rounded-2xl text-amber-800 text-[10px] sm:text-sm flex items-center gap-2 sm:gap-3">
          <Info className="w-4 sm:w-5 h-4 sm:h-5 shrink-0" />
          Data mungkin kurang akurat karena kendala koneksi API.
        </div>
      )}

      {/* KPI Statistics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx} className="surface-card p-4 sm:p-6 transition-all duration-300 hover:shadow-lg hover:shadow-slate-200/50">
              <div className="flex items-center gap-2 sm:gap-4 mb-2 sm:mb-4">
                <div className={`w-8 h-8 sm:w-10 sm:h-10 ${stat.bg} ${stat.color} rounded-lg sm:rounded-xl flex items-center justify-center shrink-0`}>
                  <Icon className="w-4 sm:w-5 h-4 sm:h-5" />
                </div>
                <p className="text-[9px] sm:text-xs font-bold uppercase tracking-widest text-slate-400 truncate">{stat.label}</p>
              </div>
              <p className="text-xl sm:text-3xl font-black text-slate-900">{stat.value}</p>
              <p className="text-[8px] sm:text-[10px] font-bold text-slate-400 mt-1 sm:mt-2 uppercase tracking-tight truncate">{stat.trend}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        {/* Historical Rainfall Chart */}
        <div className="lg:col-span-2 surface-card p-4 sm:p-6 flex flex-col">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <div>
              <h2 className="text-sm sm:text-lg font-black text-slate-900 uppercase tracking-tight">Curah Hujan 5 Tahun</h2>
              <p className="text-[9px] sm:text-xs text-slate-400 font-bold uppercase mt-0.5 sm:mt-1">Akumulasi tahunan (mm)</p>
            </div>
            <BarChart3 className="w-5 sm:w-6 h-5 sm:h-6 text-brand-500" />
          </div>
          <div className="flex-1 min-h-[250px] sm:min-h-[300px]">
            <MonthlyRainfallChart data={historicalRainfall} />
          </div>
        </div>

        {/* Water Level Gauge */}
        <div className="surface-card p-4 sm:p-6 flex flex-col">
          <h2 className="text-sm sm:text-lg font-black text-slate-900 uppercase tracking-tight mb-4 sm:mb-6 text-center">Indikator Tinggi Air (Simulasi)</h2>
          <div className="flex-1 flex items-center justify-center min-h-[200px]">
            <WaterLevelGauge currentLevel={Math.round(simulatedWaterLevel)} warningLevel={70} dangerLevel={90} />
          </div>
          <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-slate-50 rounded-2xl border border-slate-100">
             <div className="flex items-start gap-2 sm:gap-3">
                <Info className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-slate-400 shrink-0 mt-0.5" />
                <p className="text-[10px] sm:text-xs text-slate-500 leading-relaxed italic">
                  Nilai ilustratif berdasarkan kelembapan dan peringatan <span className="font-bold">BMKG</span>, bukan sensor muka air langsung.
                </p>
             </div>
          </div>
        </div>
      </div>

      {/* Yearly Flood Frequency */}
      <div className="surface-card p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <div>
            <h2 className="text-sm sm:text-lg font-black text-slate-900 uppercase tracking-tight">Historis Bencana</h2>
            <p className="text-[9px] sm:text-xs text-slate-400 font-bold uppercase mt-0.5 sm:mt-1">Data contoh internal untuk ilustrasi visual</p>
          </div>
          <div className="px-2 py-0.5 sm:px-3 sm:py-1 bg-slate-100 rounded-full text-[8px] sm:text-[10px] font-bold text-slate-500 uppercase">Beta</div>
        </div>
        <div className="w-full min-h-[250px] sm:min-h-[350px]">
          <YearlyFloodFrequencyChart />
        </div>
      </div>

      {/* Data Table */}
      <div className="surface-card overflow-hidden">
        <div className="px-4 sm:px-8 py-3 sm:py-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <h2 className="text-sm sm:text-lg font-black text-slate-900 uppercase tracking-tight">
            Titik Rawan (Teratas)
          </h2>
          <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-slate-400">Total: {dbStats.totalHotspots}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead className="bg-slate-50/50 border-b border-slate-100">
              <tr>
                <th className="px-4 sm:px-8 py-3 sm:py-4 text-left text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-slate-400">Lokasi</th>
                <th className="px-4 sm:px-8 py-3 sm:py-4 text-left text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-slate-400">Kejadian</th>
                <th className="hidden sm:table-cell px-8 py-4 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">Update</th>
                <th className="px-4 sm:px-8 py-3 sm:py-4 text-right text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-slate-400">Risiko</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {dbStats.hotspots.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 sm:px-8 py-8 sm:py-12 text-center text-slate-400 text-xs font-bold uppercase tracking-widest">
                    Belum ada data
                  </td>
                </tr>
              ) : (
                dbStats.hotspots.map((item, index) => (
                  <tr key={index} className="hover:bg-slate-50/30 transition-colors">
                    <td className="px-4 sm:px-8 py-4 sm:py-5 text-xs sm:text-sm font-bold text-slate-900">{item.location}</td>
                    <td className="px-4 sm:px-8 py-4 sm:py-5 text-xs sm:text-sm text-slate-600 font-medium">{item.incidents}x</td>
                    <td className="hidden sm:table-cell px-8 py-5 text-sm text-slate-500">
                      {item.last_incident ? new Date(item.last_incident).toLocaleDateString('id-ID') : '-'}
                    </td>
                    <td className="px-4 sm:px-8 py-4 sm:py-5 text-right">
                      <span className={`inline-flex items-center px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[8px] sm:text-[10px] font-bold uppercase tracking-wider border ${
                        item.severity === 'Tinggi' ? 'text-red-600 bg-red-50 border-red-100' :
                        item.severity === 'Sedang' ? 'text-amber-600 bg-amber-50 border-amber-100' :
                        'text-emerald-600 bg-emerald-50 border-emerald-100'
                      }`}>
                        {item.severity}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
