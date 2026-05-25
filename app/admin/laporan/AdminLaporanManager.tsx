'use client';

import { useMemo, useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Trash2, Loader2, CheckCircle2, AlertCircle, Eye, ExternalLink, Link as LinkIcon } from 'lucide-react';
import Image from 'next/image';
import { getStatusColorClasses, getSeverityColor } from '@/lib/utils';
import type { AdminReportItem, SeverityLevel } from '@/lib/types';

type AdminLaporanManagerProps = {
  initialReports: AdminReportItem[];
  databaseAvailable: boolean;
};

const ratingOptions: AdminReportItem['rating'][] = ['Parah', 'Sedang', 'Rendah'];

export function AdminLaporanManager({ initialReports, databaseAvailable }: AdminLaporanManagerProps) {
  const [reports, setReports] = useState<AdminReportItem[]>(initialReports);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const selectedReport = useMemo(
    () => reports.find((item) => item.id === selectedId) ?? null,
    [reports, selectedId]
  );

  // control modal open animation visibility
  useEffect(() => {
    if (isModalOpen) {
      const t = setTimeout(() => setModalVisible(true), 10);
      return () => clearTimeout(t);
    }
    setModalVisible(false);
  }, [isModalOpen]);

  const updateReport = async (
    reportId: string,
    payload: Partial<Pick<AdminReportItem, 'status' | 'rating'>>,
    successMessage: string
  ) => {
    try {
      setLoadingId(reportId);

      const response = await fetch(`/api/admin/laporan/${reportId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error ?? 'Gagal memperbarui laporan.');
      }

      const updated = result.data as AdminReportItem;

      setReports((prev) => prev.map((item) => (item.id === reportId ? updated : item)));
      toast.success(successMessage);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Terjadi kesalahan.';
      toast.error(message);
    } finally {
      setLoadingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus laporan ini? Tindakan ini tidak dapat dibatalkan.')) {
      return;
    }

    try {
      setIsDeleting(id);
      const response = await fetch(`/api/admin/laporan/${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        setReports((prev) => {
          const nextReports = prev.filter((r) => r.id !== id);

          if (selectedId === id) {
            setSelectedId(null);
          }

          return nextReports;
        });
        toast.success('Laporan berhasil dihapus');
      } else {
        toast.error(result.error || 'Gagal menghapus laporan');
      }
    } catch (err) {
      console.error('Delete error:', err);
      toast.error('Terjadi kesalahan koneksi');
    } finally {
      setIsDeleting(null);
    }
  };

  if (!databaseAvailable) {
    return (
      <section className="info-panel border-red-200 bg-red-50 p-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-red-700 uppercase tracking-wide text-xs">Error Koneksi</p>
            <p className="mt-1 text-sm text-red-600 leading-relaxed">
              Database sedang tidak dapat dijangkau. Silakan cek konfigurasi database atau hubungi administrator sistem.
            </p>
          </div>
        </div>
      </section>
    );
  }

  if (reports.length === 0) {
    return (
      <section className="surface-card p-12 text-center">
        <div className="mx-auto w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8 text-slate-300" />
        </div>
        <p className="text-lg font-bold text-slate-900">Belum Ada Laporan</p>
        <p className="mt-2 text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">
          Saat laporan masuk dari warga, admin dapat meninjau, melakukan verifikasi, dan memberikan rating prioritas dari sini.
        </p>
      </section>
    );
  }

  return (
    <div className="grid gap-6">
      <section className="surface-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-slate-200 bg-slate-50/50">
              <tr>
                <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500">Info Laporan</th>
                <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500">Pelapor</th>
                <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500">Status & Prioritas</th>
                <th className="px-6 py-4 text-right text-[10px] font-bold uppercase tracking-wider text-slate-500">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {reports.map((report) => {
                const isLoading = loadingId === report.id;
                return (
                  <tr key={report.id} className="hover:bg-slate-50/30 transition-colors align-top">
                    <td className="px-6 py-5">
                      <div className="max-w-[18rem]">
                        <p className="text-xs font-mono text-slate-400 mb-1">#{report.id.substring(0, 8)}...</p>
                        <p className="font-bold text-slate-900 leading-tight mb-1">{report.lokasi}</p>
                        <p className="text-xs text-slate-500 line-clamp-2">{report.deskripsi}</p>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <p className="text-sm font-semibold text-slate-800">{report.pelapor}</p>
                      <p className="text-[10px] text-slate-400 mt-1">{report.waktu}</p>
                    </td>
                    <td className="px-6 py-5">
                      <div className="space-y-3">
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${getStatusColorClasses(report.status)}`}>
                          {report.status}
                        </span>
                        <div>
                          <select
                            value={report.rating}
                            disabled={isLoading}
                            onChange={(event) => {
                              const newRating = event.target.value as AdminReportItem['rating'];
                              updateReport(report.id, { rating: newRating }, 'Prioritas laporan diperbarui');
                            }}
                            className="w-full max-w-[120px] rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-bold text-slate-700 outline-none transition hover:border-brand-500 focus:ring-2 focus:ring-brand-100"
                            aria-label={`Rating prioritas untuk ${report.id}`}
                          >
                            {ratingOptions.map((option) => (
                              <option key={option} value={option}>
                                Prioritas: {option}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-wrap justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedId(report.id);
                            setIsModalOpen(true);
                          }}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50 hover:text-brand-700"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Lihat
                        </button>
                        {report.status !== 'Terverifikasi' && (
                          <button
                            type="button"
                            disabled={isLoading}
                            onClick={() =>
                              updateReport(report.id, { status: 'Terverifikasi' }, 'Laporan berhasil di-ACC')
                            }
                            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-emerald-700 disabled:opacity-50"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            ACC
                          </button>
                        )}
                        <button
                          type="button"
                          disabled={isDeleting === report.id}
                          onClick={() => handleDelete(report.id)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-xs font-bold text-red-700 transition hover:bg-red-100 disabled:opacity-50"
                        >
                          {isDeleting === report.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                          Hapus
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Details are shown in a modal when user clicks "Lihat" */}
      {isModalOpen && selectedReport && (
        <div
          className={`fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm transition-opacity duration-200 ${modalVisible ? 'opacity-100' : 'opacity-0'}`}
          onClick={() => {
            setModalVisible(false);
            setTimeout(() => setIsModalOpen(false), 200);
          }}
        >
          <div
            className={`w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl transform transition-all duration-300 ${modalVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-95'}`}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            {/* Modal Header */}
            <div className="relative border-b border-slate-100 bg-slate-50/50 p-6 sm:p-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${getStatusColorClasses(selectedReport.status)}`}>
                      {selectedReport.status}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">#{selectedReport.id.substring(0, 12)}...</span>
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 leading-tight">{selectedReport.lokasi}</h3>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-full bg-white border border-slate-200 p-2.5 text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition shadow-sm"
                  aria-label="Tutup detail laporan"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="max-h-[70vh] overflow-y-auto p-6 sm:p-8 space-y-8">
              {/* Photo Section */}
              {selectedReport.fotoUrl ? (
                <div className="space-y-3">
                  <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 shadow-inner">
                    <Image
                      src={selectedReport.fotoUrl}
                      alt="Foto laporan"
                      fill
                      className="object-cover"
                      unoptimized={true}
                    />
                  </div>
                  <a
                    href={selectedReport.fotoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-xl border border-brand-200 bg-brand-50 px-4 py-2.5 text-xs font-bold text-brand-700 hover:bg-brand-100 transition shadow-sm"
                  >
                    Buka Foto Ukuran Penuh
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <AlertCircle className="w-8 h-8 text-slate-300 mb-2" />
                  <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Tidak Ada Foto</p>
                </div>
              )}

              {/* Grid Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5 block">Informasi Pelapor</label>
                    <p className="text-sm font-bold text-slate-900">{selectedReport.pelapor}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{selectedReport.waktu}</p>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5 block">Tingkat Prioritas</label>
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full" style={{ backgroundColor: getSeverityColor(selectedReport.rating) }}></div>
                      <p className="text-sm font-bold text-slate-900">{selectedReport.rating}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5 block">Deskripsi Kejadian</label>
                  <p className="text-sm leading-relaxed text-slate-700 italic">"{selectedReport.deskripsi}"</p>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="border-t border-slate-100 bg-slate-50/50 p-6 sm:px-8 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={async () => {
                  if (!selectedReport) return;
                  try {
                    const res = await fetch(`/api/admin/laporan/${selectedReport.id}/link`, {
                      method: 'POST',
                    });
                    const json = await res.json();
                    if (!res.ok || !json.success) {
                      throw new Error(json.error || 'Gagal menautkan laporan.');
                    }
                    setReports((prev) => prev.map((r) => (r.id === selectedReport.id ? { ...r, lokasi: 'Tertaut ke peta' } : r)));
                    toast.success('Laporan berhasil ditautkan ke peta.');
                    setModalVisible(false);
                    setTimeout(() => setIsModalOpen(false), 200);
                  } catch (err) {
                    const message = err instanceof Error ? err.message : 'Terjadi kesalahan.';
                    toast.error(message);
                  }
                }}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-brand-600 text-white text-sm font-bold hover:bg-brand-700 transition shadow-md shadow-brand-200"
              >
                <LinkIcon className="w-4 h-4" />
                Tautkan ke Peta
              </button>
              
              {selectedReport.status !== 'Terverifikasi' && (
                <button
                  type="button"
                  onClick={() => updateReport(selectedReport.id, { status: 'Terverifikasi' }, 'Laporan disetujui')}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 transition shadow-md shadow-emerald-200"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Setujui Laporan
                </button>
              )}

              <button
                type="button"
                disabled={isDeleting === selectedReport.id}
                onClick={() => handleDelete(selectedReport.id)}
                className="inline-flex items-center gap-2 px-5 py-3 bg-white text-red-600 border border-red-100 rounded-xl text-sm font-bold hover:bg-red-50 transition"
              >
                <Trash2 className="w-4 h-4" />
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
