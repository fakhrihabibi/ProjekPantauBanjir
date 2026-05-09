'use client';

import { MonthlyRainfallChart } from '@/components/MonthlyRainfallChart';
import { YearlyFloodFrequencyChart } from '@/components/YearlyFloodFrequencyChart';
import { WaterLevelGauge } from '@/components/WaterLevelGauge';

export default function DataPage() {
  const sampleData = [
    {
      location: 'Jl. Raya Bojongsoang - Simpang Tiga',
      incidents: 12,
      lastIncident: '2024-03-15',
      severity: 'Tinggi',
      color: 'text-danger',
    },
    {
      location: 'Kp. Ciliung - Dekat Jembatan',
      incidents: 8,
      lastIncident: '2024-02-28',
      severity: 'Sedang',
      color: 'text-warning',
    },
    {
      location: 'Pasar Bojongsoang',
      incidents: 5,
      lastIncident: '2024-01-10',
      severity: 'Rendah',
      color: 'text-success',
    },
    {
      location: 'Dekat Masjid Al-Mukhlisin',
      incidents: 3,
      lastIncident: '2023-12-20',
      severity: 'Rendah',
      color: 'text-success',
    },
  ];

  return (
    <div className="page-shell">
      <div className="page-header">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard Data Banjir</h1>
        <p className="text-gray-600 mt-2">
          Visualisasi data, statistik, dan monitoring real-time banjir di Bojongsoang
        </p>
      </div>

      {/* KPI Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="surface-card p-6 transition hover:-translate-y-0.5 hover:shadow-md">
          <p className="text-gray-600 text-sm mb-1">Total Kejadian</p>
          <p className="text-3xl font-bold text-primary">28</p>
          <p className="text-xs text-gray-500 mt-2">Tahun 2024</p>
        </div>
        <div className="surface-card p-6 transition hover:-translate-y-0.5 hover:shadow-md">
          <p className="text-gray-600 text-sm mb-1">Rata-rata/Bulan</p>
          <p className="text-3xl font-bold text-warning">2.3</p>
          <p className="text-xs text-gray-500 mt-2">Kejadian</p>
        </div>
        <div className="surface-card p-6 transition hover:-translate-y-0.5 hover:shadow-md">
          <p className="text-gray-600 text-sm mb-1">Tingkat Akurasi</p>
          <p className="text-3xl font-bold text-success">94.5%</p>
          <p className="text-xs text-gray-500 mt-2">Prediksi</p>
        </div>
        <div className="surface-card p-6 transition hover:-translate-y-0.5 hover:shadow-md">
          <p className="text-gray-600 text-sm mb-1">Area Terpantau</p>
          <p className="text-3xl font-bold text-primary">6</p>
          <p className="text-xs text-gray-500 mt-2">Titik Rawan</p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Monthly Rainfall Line Chart */}
        <div>
          <MonthlyRainfallChart />
        </div>

        {/* Water Level Gauge */}
        <div>
          <WaterLevelGauge currentLevel={45} warningLevel={70} dangerLevel={90} />
        </div>
      </div>

      {/* Yearly Flood Frequency Bar Chart - Full Width */}
      <div className="mb-8">
        <YearlyFloodFrequencyChart />
      </div>

      {/* Data Table */}
      <div className="surface-card overflow-hidden mb-8">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-900">
            Data Titik Rawan Banjir
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                  Lokasi
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                  Total Kejadian
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                  Kejadian Terakhir
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                  Tingkat Risiko
                </th>
              </tr>
            </thead>
            <tbody>
              {sampleData.map((item, index) => (
                <tr
                  key={index}
                  className="border-b border-gray-200 hover:bg-gray-50 transition"
                >
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {item.location}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {item.incidents}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {item.lastIncident}
                  </td>
                  <td className={`px-6 py-4 text-sm font-semibold ${item.color}`}>
                    {item.severity}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Info Box */}
      <div className="info-panel border-blue-200 bg-blue-50">
        <h3 className="font-semibold text-gray-900 mb-2">📊 Tentang Dashboard</h3>
        <div className="text-gray-700 text-sm space-y-2">
          <p>
            • <strong>Curah Hujan Bulanan:</strong> Menunjukkan pola curah hujan sepanjang tahun
          </p>
          <p>
            • <strong>Frekuensi Banjir:</strong> Data historis kejadian banjir 6 tahun terakhir
          </p>
          <p>
            • <strong>Tingkat Air Real-time:</strong> Monitoring ketinggian air sungai secara langsung
          </p>
          <p>
            • Data diperbarui secara otomatis setiap jam untuk memastikan akurasi informasi
          </p>
        </div>
      </div>
    </div>
  );
}
