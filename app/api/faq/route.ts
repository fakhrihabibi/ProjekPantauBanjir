import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type FAQItem = { q: string; a: string; keywords: string[] };

const FAQ: FAQItem[] = [
  {
    q: 'Apa yang harus disiapkan untuk 72 jam pertama?',
    a: 'Siapkan air minum, makanan siap saji, obat rutin, dokumen penting dalam wadah tahan air, powerbank, dan daftar kontak darurat.',
    keywords: ['72', '72 jam', 'siaga', 'persiapan', 'tas']
  },
  {
    q: 'Bagaimana mencegah penyakit setelah banjir?',
    a: 'Gunakan air bersih untuk konsumsi, jaga kebersihan luka, hindari kontak dengan air genangan jika memungkinkan, dan segera ke fasilitas kesehatan bila ada gejala.',
    keywords: ['penyakit', 'sehat', 'pasca banjir', 'diare', 'leptospirosis']
  },
  {
    q: 'Apa rute evakuasi aman?',
    a: 'Kenali titik kumpul terdekat, pilih jalur yang lebih tinggi dan jauh dari aliran utama, dan selalu ikuti instruksi otoritas lokal.',
    keywords: ['evakuasi', 'rute', 'jalur', 'titik kumpul']
  },
  {
    q: 'Bagaimana melindungi rumah dari banjir?',
    a: 'Pindahkan barang berharga ke tempat tinggi, pasang penghalang sementara, bersihkan saluran air, dan matikan listrik jika perlu.',
    keywords: ['rumah', 'perlindungan', 'angkat', 'saluran']
  }
];

function normalize(text: string) {
  return text.trim().toLowerCase();
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const question = normalize((body.question || body.topic || '') as string);

    if (!question) {
      return NextResponse.json({ success: false, error: 'question or topic required' }, { status: 400 });
    }

    // Simple keyword scoring
    const tokens = question.split(/\W+/).filter(Boolean);

    let best: { item?: FAQItem; score: number } = { score: 0 };

    for (const item of FAQ) {
      let score = 0;
      for (const k of item.keywords) {
        if (question.includes(k)) score += 2;
      }
      for (const t of tokens) {
        if (item.q.toLowerCase().includes(t)) score += 1;
      }

      if (score > best.score) best = { item, score };
    }

    if (best.item && best.score > 0) {
      return NextResponse.json({ success: true, answer: best.item.a, source: 'faq' });
    }

    return NextResponse.json({ success: true, answer: null, source: 'faq' });
  } catch (err) {
    console.error('FAQ route error', err);
    return NextResponse.json({ success: true, answer: null, source: 'faq' });
  }
}
