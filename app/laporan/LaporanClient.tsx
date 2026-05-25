'use client';

import { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { ReportForm } from '@/components/forms/ReportForm';
import { AdminLaporanManager } from '@/app/admin/laporan/AdminLaporanManager';
import { getStatusColorClasses } from '@/lib/utils';
import type { LaporanItem, AdminReportItem } from '@/lib/types';

interface LaporanClientProps {
  initialReports: LaporanItem[];
  databaseAvailable: boolean;
  isAdmin?: boolean;
  adminReports?: AdminReportItem[];
}

export function LaporanClient({
  initialReports,
  databaseAvailable,
  isAdmin = false,
  adminReports = [],
}: LaporanClientProps) {
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="page-shell space-y-4 sm:space-y-6 py-6 sm:py-8">
      <div className="page-header flex flex-col gap-3 sm:gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Laporan Banjir</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">
            Pantau dan buat laporan kejadian real-time.
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="w-full rounded-xl bg-primary px-6 py-2.5 sm:py-2 text-sm font-bold text-white shadow-sm transition hover:bg-blue-600 active:scale-95 md:w-auto"
        >
          {showForm ? 'Tutup Form' : 'Buat Laporan Baru'}
        </button>
      </div>

      {/* Form Section */}
      {showForm && (
        <div className="surface-card mb-6 sm:mb-8 p-5 sm:p-8 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="mb-4 sm:mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Form Pelaporan</h2>
            <p className="text-gray-500 text-xs sm:text-sm mt-1">Lengkapi detail kejadian untuk membantu pemetaan.</p>
          </div>
          <ReportForm />
        </div>
      )}

      {/* Reports List */}
      <div className="surface-card overflow-hidden">
        <div className="px-5 sm:px-6 py-3 sm:py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <h2 className="text-sm sm:text-lg font-bold text-slate-900 uppercase tracking-tight">Laporan Terbaru</h2>
          <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-slate-400">Update Terkini</span>
        </div>
        {!databaseAvailable && (
          <div className="border-b border-amber-200 bg-amber-50 px-5 sm:px-6 py-2.5 sm:py-4 text-[10px] sm:text-sm text-amber-900 italic">
            Database tidak terjangkau. Daftar laporan sementara tidak tersedia.
          </div>
        )}
        <div className="divide-y divide-slate-100">
          {initialReports.length === 0 ? (
            <div className="p-8 sm:p-12 text-center text-slate-500">
              <div className="mx-auto w-12 h-12 sm:w-16 sm:h-16 bg-slate-50 rounded-full flex items-center justify-center mb-3 sm:mb-4">
                <AlertCircle className="w-6 h-6 sm:w-8 sm:h-8 text-slate-300" />
              </div>
              <p className="text-sm sm:text-base font-bold text-slate-900">
                {databaseAvailable ? 'Belum Ada Laporan' : 'Data Tidak Tersedia'}
              </p>
              <p className="text-xs sm:text-sm mt-1 text-slate-500 max-w-xs mx-auto leading-relaxed">
                {databaseAvailable
                  ? 'Gunakan tombol di atas untuk mengirim laporan terbaru.'
                  : 'Sistem sedang mengalami kendala koneksi data.'}
              </p>
            </div>
          ) : (
            initialReports.map((report) => (
              <div key={report.id} className="p-5 sm:p-6 hover:bg-slate-50/50 transition-all group">
                <div className="flex flex-col sm:flex-row justify-between items-start gap-3 sm:gap-4 mb-3 sm:mb-4">
                  <div className="space-y-1">
                    <h3 className="text-sm sm:text-base font-black text-slate-900 leading-tight group-hover:text-brand-700 transition-colors">{report.location}</h3>
                    <div className="flex flex-wrap items-center gap-2 text-[9px] sm:text-xs font-bold uppercase tracking-wider text-slate-400">
                      <span className="truncate max-w-[120px]">{report.reporter}</span>
                      <span className="h-1 w-1 rounded-full bg-slate-300" />
                      <span>{report.date}</span>
                    </div>
                  </div>
                  <span
                    className={`shrink-0 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[8px] sm:text-[10px] font-bold uppercase tracking-widest border ${getStatusColorClasses(
                      report.status
                    )}`}
                  >
                    {report.status}
                  </span>
                </div>
                <div className="relative pl-3 sm:pl-4 border-l-2 border-slate-100">
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed italic">"{report.description}"</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {isAdmin ? (
        <section className="mt-6 sm:mt-8 space-y-4">
          <div className="surface-card p-5 sm:p-6 border-l-4 border-brand-600">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900">Panel Verifikasi Admin</h2>
            <p className="mt-1 text-xs sm:text-sm text-slate-600">
              Verifikasi, rating, dan tindak lanjut laporan dapat dikelola langsung di sini.
            </p>
          </div>
          <AdminLaporanManager initialReports={adminReports} databaseAvailable={databaseAvailable} />
        </section>
      ) : null}

      {/* Info Box */}
      <div className="info-panel mt-6 sm:mt-8 border-yellow-200 bg-yellow-50 p-4 sm:p-5">
        <h3 className="text-sm sm:text-base font-bold text-gray-900 mb-2">Panduan Pelaporan</h3>
        <ul className="text-gray-700 text-xs sm:text-sm space-y-1.5">
          <li className="flex gap-2"><span>✓</span> <span>Sampaikan lokasi banjir sedetail mungkin.</span></li>
          <li className="flex gap-2"><span>✓</span> <span>Sertakan tinggi genangan jika memungkinkan.</span></li>
          <li className="flex gap-2"><span>✓</span> <span>Laporan diverifikasi tim sebelum dipublikasikan.</span></li>
        </ul>
      </div>
    </div>
  );
}
