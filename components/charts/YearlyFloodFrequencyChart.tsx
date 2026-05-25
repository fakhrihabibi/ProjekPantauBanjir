'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface YearlyFloodData {
  tahun: string;
  jumlahBanjir: number;
  kerugianMaterial: number;
}

const floodData: YearlyFloodData[] = [
  { tahun: '2019', jumlahBanjir: 8, kerugianMaterial: 45 },
  { tahun: '2020', jumlahBanjir: 12, kerugianMaterial: 68 },
  { tahun: '2021', jumlahBanjir: 10, kerugianMaterial: 55 },
  { tahun: '2022', jumlahBanjir: 15, kerugianMaterial: 82 },
  { tahun: '2023', jumlahBanjir: 14, kerugianMaterial: 78 },
  { tahun: '2024', jumlahBanjir: 9, kerugianMaterial: 52 },
];

export function YearlyFloodFrequencyChart() {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900">
          Ilustrasi Frekuensi Banjir per Tahun
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          Data contoh untuk membantu visualisasi tren historis (bukan data resmi)
        </p>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={floodData}
          margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="tahun"
            stroke="#6b7280"
            style={{ fontSize: '12px' }}
          />
          <YAxis
            yAxisId="left"
            stroke="#6b7280"
            style={{ fontSize: '12px' }}
            label={{ value: 'Jumlah Kejadian', angle: -90, position: 'insideLeft' }}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            stroke="#6b7280"
            style={{ fontSize: '12px' }}
            label={{ value: 'Kerugian (Juta Rp)', angle: 90, position: 'insideRight' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
            }}
            cursor={{ fill: '#f3f4f6' }}
          />
          <Legend wrapperStyle={{ paddingTop: '20px' }} />
          <Bar
            yAxisId="left"
            dataKey="jumlahBanjir"
            fill="#0ea5e9"
            name="Jumlah Banjir"
            radius={[8, 8, 0, 0]}
          />
          <Bar
            yAxisId="right"
            dataKey="kerugianMaterial"
            fill="#ef4444"
            name="Kerugian (Juta Rp)"
            radius={[8, 8, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>

      <div className="mt-6 grid grid-cols-2 gap-4">
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-gray-700">
            <span className="font-semibold">Catatan:</span> Data 2024 pada grafik ini lebih rendah daripada 2023,
            sehingga tampil sebagai penurunan pada data contoh.
          </p>
        </div>
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-gray-700">
            <span className="font-semibold">Perhatian:</span> Angka 2022 pada grafik ini adalah titik tertinggi
            di dataset contoh yang ditampilkan.
          </p>
        </div>
      </div>
    </div>
  );
}
