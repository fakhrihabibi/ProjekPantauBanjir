'use client';

import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 text-center">
      <h1 className="text-4xl font-black text-slate-950 tracking-tight mb-4">
        404 - Halaman Tidak Ditemukan
      </h1>
      <p className="text-lg font-medium text-slate-500 max-w-md mb-10 leading-relaxed">
        Maaf, rute yang Anda cari tidak tersedia.
      </p>
      <Link
        href="/"
        className="px-8 py-4 bg-blue-600 text-white rounded-2xl font-bold shadow-lg"
      >
        Kembali ke Beranda
      </Link>
    </div>
  );
}
