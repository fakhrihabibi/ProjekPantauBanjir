'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface MonthlyRainfallData {
  bulan: string;
  curahHujan: number;
}

const rainfallData: MonthlyRainfallData[] = [
  { bulan: 'Jan', curahHujan: 145 },
  { bulan: 'Feb', curahHujan: 168 },
  { bulan: 'Mar', curahHujan: 205 },
  { bulan: 'Apr', curahHujan: 187 },
  { bulan: 'May', curahHujan: 156 },
  { bulan: 'Jun', curahHujan: 98 },
  { bulan: 'Jul', curahHujan: 76 },
  { bulan: 'Aug', curahHujan: 82 },
  { bulan: 'Sep', curahHujan: 115 },
  { bulan: 'Oct', curahHujan: 234 },
  { bulan: 'Nov', curahHujan: 289 },
  { bulan: 'Dec', curahHujan: 312 },
];

export function MonthlyRainfallChart() {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900">
          Curah Hujan Bulanan (mm)
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          Data curah hujan rata-rata per bulan tahun 2024
        </p>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart
          data={rainfallData}
          margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="bulan"
            stroke="#6b7280"
            style={{ fontSize: '12px' }}
          />
          <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
          <Tooltip
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
            }}
            cursor={{ stroke: '#0ea5e9', strokeWidth: 2 }}
          />
          <Legend
            wrapperStyle={{ paddingTop: '20px' }}
            iconType="line"
          />
          <Line
            type="monotone"
            dataKey="curahHujan"
            stroke="#0ea5e9"
            strokeWidth={3}
            dot={{ fill: '#0ea5e9', r: 5 }}
            activeDot={{ r: 7 }}
            name="Curah Hujan (mm)"
          />
        </LineChart>
      </ResponsiveContainer>

      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-gray-700">
          <span className="font-semibold">Catatan:</span> Curah hujan tertinggi
          terjadi pada bulan Oktober-Desember. Periode ini memerlukan
          kesiapsiagaan banjir yang lebih tinggi.
        </p>
      </div>
    </div>
  );
}
