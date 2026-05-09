"use client";

import { useState } from 'react';

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
      const response = await fetch('/api/ai/mitigasi', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic: card.title,
          context: card.description,
          location: 'Bojongsoang',
        }),
      });

      const result = await response.json();

      if (!response.ok || !result?.success || !result?.answer) {
        throw new Error(result?.error ?? 'Gagal mendapatkan respon AI.');
      }

      setAiResponses((prev) => ({
        ...prev,
        [card.title]: result.answer,
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Terjadi kesalahan saat menghubungi AI.';
      setAiErrors((prev) => ({
        ...prev,
        [card.title]: message,
      }));
      setAiResponses((prev) => ({
        ...prev,
        [card.title]: card.fallbackResponse,
      }));
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

  const emergencyContacts = [
    { label: 'BPBD Kabupaten Bandung - Posko Utama', phone: '(022) 1234 5678', tel: '+622212345678' },
    { label: 'Pusat Layanan Darurat Bojongsoang', phone: '0812 3456 7890', tel: '+6281234567890' },
    { label: 'Koordinasi Relawan Siaga Banjir', phone: '0813 9876 5432', tel: '+6281398765432' },
  ];

  return (
    <div className="page-shell space-y-8 bg-gradient-to-b from-white via-slate-50 to-amber-50">
      <header className="space-y-3">
        <p className="inline-flex items-center rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold tracking-wide text-white">
          EDUKASI BANJIR BOJONGSOANG
        </p>
        <h1 className="text-3xl font-bold text-slate-900 md:text-4xl">
          Pusat Informasi, Mitigasi, dan Kontak Darurat
        </h1>
        <p className="max-w-3xl text-sm text-slate-600 md:text-base">
          Halaman ini dirancang sebagai hub informasi cepat untuk membantu warga memahami risiko,
          mengambil tindakan preventif, dan menjangkau bantuan saat kondisi darurat.
        </p>
      </header>

      <section className="surface-card rounded-2xl border-amber-300 bg-amber-100 p-5 md:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-700">
              Emergency Status Banner
            </p>
            <h2 className="mt-1 text-2xl font-black text-amber-950 md:text-3xl">
              Status: Siaga 2
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-amber-900/80 md:text-base">
              Warga diimbau meningkatkan kewaspadaan, memantau informasi resmi, dan menyiapkan
              perlengkapan evakuasi. Hindari aktivitas di area bantaran saat hujan intens.
            </p>
          </div>
          <div className="rounded-xl border border-amber-300 bg-white px-4 py-3 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Tingkat Risiko</p>
            <p className="mt-1 text-lg font-bold text-amber-700">Waspada Tinggi</p>
          </div>
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Mitigasi</h2>
            <p className="text-sm text-slate-600">
              Ringkasan langkah penting untuk mengurangi dampak banjir.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
          {mitigasiCards.map((card) => (
            <article
              key={card.title}
              className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md"
            >
              <div className={`h-2 bg-gradient-to-r ${card.accent}`} />
              <div className="flex h-full flex-col p-5">
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-2xl">
                    {card.icon}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleAskAi(card)}
                    disabled={loadingCard === card.title}
                    className="rounded-full border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-sky-500 hover:text-sky-700"
                  >
                    {loadingCard === card.title ? 'Memproses...' : 'Tanya AI'}
                  </button>
                </div>
                <h3 className="text-lg font-bold text-slate-900">{card.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{card.description}</p>
                <div className="mt-5 rounded-xl bg-slate-50 px-4 py-3 text-xs text-slate-500">
                  Klik tombol Tanya AI untuk simulasi bantuan informasi cepat.
                </div>
                {activeAiCard === card.title && (
                  <div className="mt-3 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-xs leading-6 text-sky-900">
                    <p className="font-semibold">Respon AI:</p>
                    {loadingCard === card.title ? (
                      <p className="mt-1">AI sedang menyusun jawaban...</p>
                    ) : (
                      <p className="mt-1">{aiResponses[card.title] ?? card.fallbackResponse}</p>
                    )}
                    {aiErrors[card.title] && (
                      <p className="mt-2 text-[11px] text-red-700">{aiErrors[card.title]}</p>
                    )}
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <article className="surface-card rounded-2xl p-6">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-100 text-xl">
              🌊
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Fakta Sungai Citarum</h2>
              <p className="text-sm text-slate-600">Informasi singkat yang relevan untuk kesiapsiagaan banjir.</p>
            </div>
          </div>

          <div className="space-y-4 text-sm leading-7 text-slate-700 md:text-base">
            {citarumFacts.map((fact) => (
              <p key={fact} className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-100">
                {fact}
              </p>
            ))}
          </div>
        </article>

        <aside className="surface-card rounded-2xl border-2 border-red-300 bg-red-50 p-6">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-600 text-white text-xl">
              📞
            </div>
            <div>
              <h2 className="text-2xl font-black text-red-800">Kontak Darurat BPBD</h2>
              <p className="text-sm text-red-700">
                Hubungi nomor di bawah ini jika terjadi kondisi darurat banjir.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {emergencyContacts.map((contact) => (
              <a
                key={contact.tel}
                href={`tel:${contact.tel}`}
                className="block rounded-xl border border-red-200 bg-white px-4 py-4 shadow-sm transition hover:border-red-400 hover:shadow-md"
              >
                <p className="text-sm font-semibold text-slate-900">{contact.label}</p>
                <p className="mt-1 text-lg font-bold text-red-700">{contact.phone}</p>
                <p className="mt-1 text-xs text-slate-500">Klik untuk menelepon</p>
              </a>
            ))}
          </div>

          <div className="mt-5 rounded-xl bg-red-100 p-4 text-sm text-red-900">
            Simpan nomor darurat ini di ponsel dan pastikan keluarga mengetahui titik kumpul terdekat.
          </div>
        </aside>
      </section>
    </div>
  );
}
