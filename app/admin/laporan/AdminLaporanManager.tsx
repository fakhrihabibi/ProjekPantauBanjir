'use client';

import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Trash2, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import Image from 'next/image';

export type ReportRating = 'Parah' | 'Sedang' | 'Rendah';

export type AdminReportItem = {
  id: string;
  lokasi: string;
  pelapor: string;
  waktu: string;
  deskripsi: string;
  status: string;
  rating: ReportRating;
  fotoUrl: string | null;
};

type AdminLaporanManagerProps = {
  initialReports: AdminReportItem[];
  databaseAvailable: boolean;
};

const ratingOptions: ReportRating[] = ['Parah', 'Sedang', 'Rendah'];

const ratingClassMap: Record<ReportRating, string> = {
  Parah: 'border-red-200 bg-red-50 text-red-700',
  Sedang: 'border-amber-200 bg-amber-50 text-amber-700',
  Rendah: 'border-emerald-200 bg-emerald-50 text-emerald-700',
};

const statusBadgeClass = (status: string) => {
  if (status.toLowerCase().includes('verifikasi')) {
    return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  }

  if (status.toLowerCase().includes('tolak')) {
    return 'border-rose-200 bg-rose-50 text-rose-700';
  }

  return 'border-amber-200 bg-amber-50 text-amber-700';
};

export function AdminLaporanManager({ initialReports, databaseAvailable }: AdminLaporanManagerProps) {
  const [reports, setReports] = useState<AdminReportItem[]>(initialReports);
  const [selectedId, setSelectedId] = useState<string | null>(initialReports[0]?.id ?? null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const selectedReport = useMemo(
    () => reports.find((item) => item.id === selectedId) ?? null,
    [reports, selectedId]
  );

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
            setSelectedId(nextReports[0]?.id ?? null);
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
      <section className="surface-card rounded-2xl border border-red-200 bg-red-50 p-6">
        <p className="text-sm font-semibold text-red-700">Data laporan belum bisa dimuat</p>
        <p className="mt-1 text-sm text-red-600">
          Koneksi database tidak tersedia. Cek konfigurasi database lalu refresh halaman.
        </p>
      </section>
    );
  }

  if (reports.length === 0) {
    return (
      <section className="surface-card rounded-2xl p-6">
        <p className="text-sm font-semibold text-slate-900">Belum ada laporan warga</p>
        <p className="mt-1 text-sm text-slate-600">Saat laporan masuk, admin bisa melihat, ACC, dan memberi rating dari halaman ini.</p>
      </section>
    );
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
      <section className="surface-card overflow-hidden rounded-2xl">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px]">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">ID</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">Laporan</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">Pelapor</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">Waktu</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">Status</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">Rate</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((report) => {
                const isLoading = loadingId === report.id;
                return (
                  <tr key={report.id} className="border-b border-slate-100 align-top last:border-b-0">
                    <td className="px-4 py-4 text-xs font-semibold text-slate-800">{report.id}</td>
                    <td className="px-4 py-4 text-sm text-slate-700">
                      <p className="font-semibold text-slate-900">{report.lokasi}</p>
                      <p className="mt-1 line-clamp-2 text-xs text-slate-500">{report.deskripsi}</p>
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-700">{report.pelapor}</td>
                    <td className="px-4 py-4 text-sm text-slate-700">{report.waktu}</td>
                    <td className="px-4 py-4 text-sm">
                      <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${statusBadgeClass(report.status)}`}>
                        {report.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm">
                      <select
                        value={report.rating}
                        disabled={isLoading}
                        onChange={(event) => {
                          const newRating = event.target.value as ReportRating;
                          setReports((prev) =>
                            prev.map((item) => (item.id === report.id ? { ...item, rating: newRating } : item))
                          );
                        }}
                        className={`rounded-xl border px-3 py-2 text-xs font-semibold outline-none transition focus:ring-2 focus:ring-sky-100 ${ratingClassMap[report.rating]}`}
                        aria-label={`Rating prioritas untuk ${report.id}`}
                      >
                        {ratingOptions.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-4 text-sm">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedId(report.id)}
                          className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-sky-500 hover:text-sky-700"
                        >
                          Lihat
                        </button>
                        <button
                          type="button"
                          disabled={isLoading}
                          onClick={() =>
                            updateReport(report.id, { status: 'Terverifikasi' }, 'Laporan berhasil di-ACC')
                          }
                          className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
                        >
                          ACC
                        </button>
                        <button
                          type="button"
                          disabled={isLoading}
                          onClick={() =>
                            updateReport(report.id, { rating: report.rating }, 'Rating laporan berhasil disimpan')
                          }
                          className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
                        >
                          Simpan Rate
                        </button>
                        <button
                          type="button"
                          disabled={isDeleting === report.id}
                          onClick={() => handleDelete(report.id)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-100 disabled:opacity-60"
                        >
                          {isDeleting === report.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
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

      <aside className="surface-card rounded-2xl p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-600">Detail Laporan</p>
        {selectedReport ? (
          <div className="mt-3 space-y-4">
            <div>
              <p className="text-xs text-slate-500">ID</p>
              <p className="text-sm font-semibold text-slate-900">{selectedReport.id}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Lokasi</p>
              <p className="text-sm font-semibold text-slate-900">{selectedReport.lokasi}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Pelapor</p>
              <p className="text-sm font-semibold text-slate-900">{selectedReport.pelapor}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Waktu</p>
              <p className="text-sm font-semibold text-slate-900">{selectedReport.waktu}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Deskripsi</p>
              <p className="text-sm leading-6 text-slate-700">{selectedReport.deskripsi}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm">
              <p className="text-xs text-slate-500">Status Saat Ini</p>
              <p className="font-semibold text-slate-900">{selectedReport.status}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm">
              <p className="text-xs text-slate-500">Rating Saat Ini</p>
              <p className="font-semibold text-slate-900">{selectedReport.rating}</p>
            </div>
            {selectedReport.fotoUrl ? (
              <div className="space-y-2">
                <div className="relative w-full h-48 overflow-hidden rounded-xl border border-slate-200">
                  <Image
                    src={selectedReport.fotoUrl}
                    alt="Foto laporan"
                    fill
                    className="object-cover"
                    unoptimized={true} // Since it's from an external URL that might not be configured in next.config.js
                  />
                </div>
                <a
                  href={selectedReport.fotoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-xs font-semibold text-sky-700 hover:bg-sky-100"
                >
                  Buka Foto Ukuran Penuh ↗
                </a>
              </div>
            ) : (
              <p className="text-xs text-slate-500">Tidak ada foto terlampir</p>
            )}

            <div className="pt-4 border-t border-slate-100">
              <button
                type="button"
                disabled={isDeleting === selectedReport.id}
                onClick={() => handleDelete(selectedReport.id)}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-50 text-red-600 border border-red-100 rounded-xl text-sm font-bold hover:bg-red-600 hover:text-white transition active:scale-95 disabled:opacity-50"
              >
                {isDeleting === selectedReport.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                Hapus Laporan
              </button>
            </div>
          </div>
        ) : (
          <p className="mt-3 text-sm text-slate-600">Klik tombol Lihat di tabel untuk menampilkan detail laporan.</p>
        )}
      </aside>
    </div>
  );
}
