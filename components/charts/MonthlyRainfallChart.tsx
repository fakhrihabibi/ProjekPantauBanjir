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

interface MonthlyRainfallChartProps {
  data?: MonthlyRainfallData[];
}

const defaultRainfallData: MonthlyRainfallData[] = [
  { bulan: 'Jan', curahHujan: 145 },
  { bulan: 'Feb', curahHujan: 168 },
  { bulan: 'Mar', curahHujan: 205 },
  { bulan: 'Apr', curahHujan: 187 },
  { bulan: 'Mei', curahHujan: 156 },
  { bulan: 'Jun', curahHujan: 98 },
  { bulan: 'Jul', curahHujan: 76 },
  { bulan: 'Agu', curahHujan: 82 },
  { bulan: 'Sep', curahHujan: 115 },
  { bulan: 'Okt', curahHujan: 234 },
  { bulan: 'Nov', curahHujan: 289 },
  { bulan: 'Des', curahHujan: 312 },
];

export function MonthlyRainfallChart({ data = defaultRainfallData }: MonthlyRainfallChartProps) {
  return (
    <div className="flex-1 w-full">
      <ResponsiveContainer width="100%" height={300}>
        <LineChart
          data={data}
          margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
          <XAxis
            dataKey="bulan"
            stroke="#6b7280"
            style={{ fontSize: '10px', fontWeight: 'bold' }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis 
            stroke="#6b7280" 
            style={{ fontSize: '10px', fontWeight: 'bold' }} 
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '12px',
              boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
              fontSize: '12px',
              fontWeight: 'bold'
            }}
            cursor={{ stroke: '#1ea6ff', strokeWidth: 2, strokeDasharray: '5 5' }}
          />
          <Line
            type="monotone"
            dataKey="curahHujan"
            stroke="#1ea6ff"
            strokeWidth={4}
            dot={{ fill: '#1ea6ff', r: 4, strokeWidth: 2, stroke: '#fff' }}
            activeDot={{ r: 6, strokeWidth: 0 }}
            name="Curah Hujan"
            animationDuration={1500}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
