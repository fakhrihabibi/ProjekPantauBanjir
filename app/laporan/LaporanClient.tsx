'use client';

import { useState } from 'react';
import { ReportForm } from '@/components/ReportForm';

export interface LaporanItem {
  id: string;
  location: string;
  date: string;
  reporter: string;
  status: string;
  description: string;
}

interface LaporanClientProps {
  initialReports: LaporanItem[];
}

export function LaporanClient({ initialReports }: LaporanClientProps) {
  const [showForm, setShowForm] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Terverifikasi':
        return 'bg-green-100 text-green-800';
      case 'Menunggu Verifikasi':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="page-shell">
      <div className="page-header flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Laporan Banjir</h1>
          <p className="text-gray-600 mt-2">
            Lihat dan buat laporan kejadian banjir real-time
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="w-full rounded-lg bg-primary px-6 py-2 font-medium text-white transition hover:bg-blue-600 md:w-auto"
        >
          {showForm ? 'Tutup Form' : 'Buat Laporan'}
        </button>
      </div>

      {/* Form Section */}
      {showForm && (
        <div className="surface-card mb-8 p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Form Laporan Banjir</h2>
            <p className="text-gray-600 text-sm mt-1">Laporkan kejadian banjir dengan detail untuk membantu sistem peringatan dini</p>
          </div>
          <ReportForm />
        </div>
      )}

      {/* Reports List */}
      <div className="surface-card overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Laporan Terbaru</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {initialReports.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              <p className="font-medium">Belum ada laporan</p>
              <p className="text-sm mt-1">Klik &quot;Buat Laporan&quot; untuk mengirim laporan banjir pertama.</p>
            </div>
          ) : (
            initialReports.map((report) => (
              <div key={report.id} className="p-6 hover:bg-gray-50 transition">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">{report.location}</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Pelapor: {report.reporter} | {report.date}
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                      report.status
                    )}`}
                  >
                    {report.status}
                  </span>
                </div>
                <p className="text-gray-700">{report.description}</p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Info Box */}
      <div className="info-panel mt-8 border-yellow-200 bg-yellow-50">
        <h3 className="font-semibold text-gray-900 mb-2">Panduan Pelaporan</h3>
        <ul className="text-gray-700 text-sm space-y-1">
          <li>✓ Sampaikan lokasi banjir sedetail mungkin</li>
          <li>✓ Sertakan waktu terjadinya dan tinggi genangan jika memungkinkan</li>
          <li>✓ Laporan akan diverifikasi oleh tim kami sebelum ditampilkan</li>
          <li>✓ Terima kasih atas kontribusi Anda dalam sistem peringatan dini ini</li>
        </ul>
      </div>
    </div>
  );
}
