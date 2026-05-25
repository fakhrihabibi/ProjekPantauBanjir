"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface MitigasiCard {
  title: string;
  description: string;
  icon: string;
  accent: string;
  fallbackResponse: string;
}

export default function EdukasiPage() {
  const [activeAiCard, setActiveAiCard] = useState<string | null>(null);
  const [loadingCard, setLoadingCard] = useState<string | null>(null);
  const [aiResponses, setAiResponses] = useState<Record<string, string>>({});
  const [aiErrors, setAiErrors] = useState<Record<string, string>>({});
  const [showEmergencyGuide, setShowEmergencyGuide] = useState(false);

  const mitigasiCards: MitigasiCard[] = [
    {
      title: 'Persiapan Bencana',
      description:
        'Siapkan tas siaga, dokumen penting, obat-obatan, dan rute evakuasi sebelum air naik.',
      icon: '🧰',
      accent: 'from-amber-500 to-orange-500',
      fallbackResponse:
        'Prioritaskan 72 jam pertama: simpan air minum, makanan siap saji, obat rutin, dokumen penting dalam map tahan air, serta daftar kontak keluarga darurat.',
    },
    {
      title: 'Penyakit Pasca Banjir',
      description:
        'Waspadai diare, leptospirosis, infeksi kulit, dan penyakit akibat air tercemar setelah banjir.',
      icon: '🩺',
      accent: 'from-sky-500 to-cyan-500',
      fallbackResponse:
        'Gunakan air bersih untuk minum dan cuci luka, hindari genangan tanpa alas kaki, serta segera periksa ke faskes jika demam tinggi, muntah, atau diare berlanjut.',
    },
    {
      title: 'Evakuasi Aman',
      description:
        'Pahami titik kumpul, jalur aman, dan cara evakuasi keluarga termasuk lansia, anak, dan balita.',
      icon: '🧭',
      accent: 'from-emerald-500 to-green-500',
      fallbackResponse:
        'Susun rencana evakuasi keluarga: satu titik kumpul utama, satu alternatif, dan pembagian peran siapa mendampingi anak, lansia, serta membawa perlengkapan darurat.',
    },
    {
      title: 'Perlindungan Rumah',
      description:
        'Terapkan langkah sederhana seperti meninggikan barang penting, membersihkan saluran air, dan memutus listrik.',
      icon: '🏠',
      accent: 'from-rose-500 to-red-500',
      fallbackResponse:
        'Sebelum hujan lebat, pindahkan perangkat listrik ke tempat tinggi, pasang karung pasir di akses masuk air, dan matikan MCB jika air mulai masuk ke dalam rumah.',
    },
  ];

  const handleAskAi = async (card: MitigasiCard) => {
    if (activeAiCard === card.title) {
      setActiveAiCard(null);
      return;
    }

    setActiveAiCard(card.title);

    if (aiResponses[card.title] || loadingCard === card.title) {
      return;
    }

    setLoadingCard(card.title);
    setAiErrors((prev) => {
      const next = { ...prev };
      delete next[card.title];
      return next;
    });

    try {
      // Call local FAQ matcher first
      const response = await fetch('/api/faq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: `${card.title} ${card.description}` }),
      });

      const result = await response.json();

      if (response.ok && result?.success && result.answer) {
        setAiResponses((prev) => ({ ...prev, [card.title]: result.answer }));
      } else {
        // No good FAQ match — use fallbackResponse
        setAiResponses((prev) => ({ ...prev, [card.title]: card.fallbackResponse }));
        if (!result?.success) {
          setAiErrors((prev) => ({ ...prev, [card.title]: result?.error ?? 'FAQ service error' }));
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Terjadi kesalahan saat menghubungi layanan FAQ.';
      setAiErrors((prev) => ({ ...prev, [card.title]: message }));
      setAiResponses((prev) => ({ ...prev, [card.title]: card.fallbackResponse }));
    } finally {
      setLoadingCard(null);
    }
  };

  const citarumFacts = [
    'Sungai Citarum merupakan salah satu sungai terpenting di Jawa Barat dan menjadi penopang kebutuhan air, pertanian, serta aktivitas ekonomi masyarakat.',
    'Pada sejumlah titik, aliran Citarum dipengaruhi sedimentasi, penyempitan bantaran, dan sampah yang dapat memperparah genangan saat hujan lebat.',
    'Bojongsoang berada di wilayah yang terdampak dinamika DAS Citarum, sehingga pemantauan curah hujan dan muka air sangat penting untuk peringatan dini.',
    'Upaya pengurangan risiko banjir harus berjalan bersama: penertiban bantaran, pengelolaan sampah, normalisasi drainase, dan edukasi warga.',
  ];

  // Emergency status state
  const [emergency, setEmergency] = useState<{ level: string; totalCount: number; nearbyCount: number; reports: any[] } | null>(null);
  const [emergencyLoading, setEmergencyLoading] = useState(false);
  const [emergencyError, setEmergencyError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const fetchStatus = async () => {
      setEmergencyLoading(true);
      setEmergencyError(null);
      try {
        // Default center Bojongsoang
        const lat = -6.9740;
        const lng = 107.6303;
        const res = await fetch(`/api/emergency-status?lat=${lat}&lng=${lng}&radius=3000`);
        const json = await res.json();
        if (!res.ok || !json.success) {
          throw new Error(json.error || 'Gagal mengambil status darurat');
        }

        if (mounted) {
          setEmergency({ level: json.level, totalCount: json.totalCount ?? 0, nearbyCount: json.nearbyCount ?? 0, reports: json.reports ?? [] });
        }
      } catch (err) {
        if (!(err instanceof Error)) {
          setEmergencyError('Terjadi kesalahan saat memuat status darurat.');
        } else {
          setEmergencyError(err.message);
        }
      } finally {
        if (mounted) setEmergencyLoading(false);
      }
    };

    fetchStatus();

    return () => {
      mounted = false;
    };
  }, []);

  const emergencyContacts = [
    { label: 'BPBD Kabupaten Bandung - Posko Utama', phone: '(022) 1234 5678', tel: '+622212345678' },
    { label: 'Pusat Layanan Darurat Bojongsoang', phone: '0812 3456 7890', tel: '+6281234567890' },
    { label: 'Koordinasi Relawan Siaga Banjir', phone: '0813 9876 5432', tel: '+6281398765432' },
  ];

  return (
    <div className="page-shell space-y-6 sm:space-y-8 bg-gradient-to-b from-white via-slate-50 to-amber-50">
      <header className="space-y-2 sm:space-y-3">
        <p className="inline-flex items-center rounded-full bg-slate-900 px-2 sm:px-3 py-0.5 sm:py-1 text-[10px] sm:text-xs font-semibold tracking-wide text-white w-fit">
          EDUKASI BANJIR BOJONGSOANG
        </p>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900">
          Pusat Informasi & Mitigasi
        </h1>
        <p className="max-w-3xl text-xs sm:text-sm md:text-base text-slate-600 leading-relaxed">
          Hub informasi cepat untuk membantu warga memahami risiko,
          mengambil tindakan preventif, dan menjangkau bantuan saat kondisi darurat.
        </p>
      </header>

      <section className="surface-card rounded-2xl border border-amber-200 bg-white/95 p-4 sm:p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.22em] text-amber-700">
              Emergency Status
            </p>
            <h2 className="mt-1 text-xl sm:text-2xl md:text-3xl font-black text-slate-950">
              {emergencyLoading ? 'Memuat status...' : emergency ? `Status: ${emergency.level}` : 'Status: Normal'}
            </h2>
            <p className="mt-2 text-xs sm:text-sm md:text-base leading-relaxed text-slate-600">
              Status siaga dihitung dari laporan <span className="font-semibold text-slate-900">terverifikasi</span> di radius 3 km.
            </p>
            <p className="mt-2 text-xs sm:text-sm md:text-base text-slate-600">
              {emergencyLoading ? (
                'Menampilkan data laporan warga...'
              ) : emergency ? (
                <>
                  <span className="font-medium text-slate-900">
                    {emergency.totalCount} laporan masuk · {emergency.nearbyCount} terverifikasi
                  </span>{' '}
                  <Link href="/peta" className="font-semibold text-amber-800 underline decoration-amber-300 underline-offset-2">
                    Pantau peta untuk detail.
                  </Link>
                </>
              ) : emergencyError ? (
                `Tidak dapat memuat status: ${emergencyError}`
              ) : (
                'Warga diimbau meningkatkan kewaspadaan dan memantau informasi resmi.'
              )}
            </p>
          </div>

          <div className="min-w-[140px] sm:min-w-[180px] rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 sm:px-4 sm:py-3 shadow-sm">
            <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wide text-amber-700">Tingkat Risiko</p>
            <p className="mt-0.5 sm:mt-1 text-lg sm:text-xl font-extrabold text-amber-800">{emergency ? emergency.level : 'Normal'}</p>
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 sm:px-4 sm:py-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs sm:text-sm text-slate-700">
              <span className="font-semibold text-slate-950">Panduan Siaga:</span> status berdasarkan verifikasi laporan.
            </p>
            <button
              type="button"
              onClick={() => setShowEmergencyGuide((value) => !value)}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-semibold text-slate-700 transition hover:border-amber-400 hover:text-amber-800 w-full sm:w-auto"
            >
              {showEmergencyGuide ? 'Sembunyikan' : 'Lihat Detail'}
              <span aria-hidden="true">{showEmergencyGuide ? '−' : '+'}</span>
            </button>
          </div>

          {showEmergencyGuide ? (
            <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-4">
              <div className="rounded-xl border border-emerald-100 bg-white p-2 sm:p-3">
                <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wide text-emerald-700">Normal</p>
                <p className="mt-0.5 text-[10px] sm:text-sm text-slate-700">0 laporan.</p>
              </div>
              <div className="rounded-xl border border-sky-100 bg-white p-2 sm:p-3">
                <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wide text-sky-700">Siaga 1</p>
                <p className="mt-0.5 text-[10px] sm:text-sm text-slate-700">1-4 laporan.</p>
              </div>
              <div className="rounded-xl border border-amber-100 bg-white p-2 sm:p-3">
                <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wide text-amber-700">Siaga 2</p>
                <p className="mt-0.5 text-[10px] sm:text-sm text-slate-700">5-9 laporan.</p>
              </div>
              <div className="rounded-xl border border-red-100 bg-white p-2 sm:p-3">
                <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wide text-red-700">Siaga 3</p>
                <p className="mt-0.5 text-[10px] sm:text-sm text-slate-700">10+ laporan.</p>
              </div>
            </div>
          ) : null}
        </div>
      </section>

      <section>
        <div className="mb-4">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Mitigasi</h2>
          <p className="text-xs sm:text-sm text-slate-600">
            Langkah penting mengurangi dampak banjir.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-2 xl:grid-cols-4">
          {mitigasiCards.map((card) => (
            <article
              key={card.title}
              className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md"
            >
              <div className={`h-1.5 sm:h-2 bg-gradient-to-r ${card.accent}`} />
              <div className="flex h-full flex-col p-4 sm:p-5">
                <div className="mb-3 sm:mb-4 flex items-start justify-between gap-3">
                  <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl sm:rounded-2xl bg-slate-100 text-xl sm:text-2xl">
                    {card.icon}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleAskAi(card)}
                    disabled={loadingCard === card.title}
                    className="rounded-full border border-slate-300 px-3 py-1 text-[10px] sm:text-xs font-semibold text-slate-700 transition hover:border-sky-500 hover:text-sky-700"
                  >
                    {loadingCard === card.title ? '...' : 'Tanya AI'}
                  </button>
                </div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900">{card.title}</h3>
                <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm leading-relaxed text-slate-600">{card.description}</p>
                
                {activeAiCard === card.title ? (
                  <div className="mt-3 rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 sm:px-4 sm:py-3 text-[10px] sm:text-xs leading-relaxed text-sky-900 animate-in fade-in slide-in-from-top-2">
                    <p className="font-semibold">Respon AI:</p>
                    {loadingCard === card.title ? (
                      <p className="mt-1 italic">AI sedang menyusun jawaban...</p>
                    ) : (
                      <p className="mt-1">{aiResponses[card.title] ?? card.fallbackResponse}</p>
                    )}
                    {aiErrors[card.title] && (
                      <p className="mt-1 text-[9px] sm:text-[11px] text-red-700">{aiErrors[card.title]}</p>
                    )}
                  </div>
                ) : (
                  <div className="mt-4 sm:mt-5 rounded-xl bg-slate-50 px-3 py-2 sm:px-4 sm:py-3 text-[10px] sm:text-xs text-slate-400">
                    Klik Tanya AI untuk info cepat.
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-4 sm:gap-6 lg:grid-cols-[1.5fr_1fr]">
        <article className="surface-card rounded-2xl p-4 sm:p-6">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-xl bg-sky-100 text-lg sm:text-xl">
              🌊
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Fakta Citarum</h2>
              <p className="text-xs sm:text-sm text-slate-600">Info relevan Bojongsoang.</p>
            </div>
          </div>

          <div className="space-y-3 sm:space-y-4 text-xs sm:text-sm md:text-base leading-relaxed text-slate-700">
            {citarumFacts.map((fact) => (
              <p key={fact} className="rounded-xl bg-slate-50 p-3 sm:p-4 ring-1 ring-slate-100">
                {fact}
              </p>
            ))}
          </div>
        </article>

        <aside className="surface-card rounded-2xl border-2 border-red-300 bg-red-50 p-4 sm:p-6">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-xl bg-red-600 text-white text-lg sm:text-xl">
              📞
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-red-800">Darurat BPBD</h2>
              <p className="text-xs sm:text-sm text-red-700">Hubungi nomor darurat.</p>
            </div>
          </div>

          <div className="space-y-2 sm:space-y-3">
            {emergencyContacts.map((contact) => (
              <a
                key={contact.tel}
                href={`tel:${contact.tel}`}
                className="block rounded-xl border border-red-200 bg-white px-3 py-3 sm:px-4 sm:py-4 shadow-sm transition hover:border-red-400 hover:shadow-md"
              >
                <p className="text-xs sm:text-sm font-semibold text-slate-900">{contact.label}</p>
                <p className="mt-0.5 sm:mt-1 text-base sm:text-lg font-bold text-red-700">{contact.phone}</p>
                <p className="mt-0.5 text-[10px] text-slate-400">Klik untuk menelepon</p>
              </a>
            ))}
          </div>

          <div className="mt-4 sm:mt-5 rounded-xl bg-red-100 p-3 sm:p-4 text-[11px] sm:text-sm text-red-900 leading-relaxed">
            Simpan nomor darurat ini di ponsel Anda sekarang.
          </div>
        </aside>
      </section>
    </div>
  );
}
