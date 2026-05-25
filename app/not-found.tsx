import Link from 'next/link';
import { FileQuestion, Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 text-center">
      <div className="relative mb-8">
        <div className="bg-brand-50 w-32 h-32 rounded-full flex items-center justify-center animate-pulse">
          <FileQuestion className="w-16 h-16 text-brand-500" />
        </div>
        <div className="absolute -top-2 -right-2 bg-rose-500 text-white text-xs font-black px-3 py-1 rounded-full shadow-lg rotate-12">
          404 ERROR
        </div>
      </div>
      
      <h1 className="text-4xl font-black text-slate-950 tracking-tight mb-4">
        Halaman Tidak Ditemukan
      </h1>
      <p className="text-lg font-medium text-slate-500 max-w-md mb-10 leading-relaxed">
        Maaf, rute yang Anda cari tidak tersedia atau telah dipindahkan. 
        Pastikan URL sudah benar atau kembali ke pusat informasi.
      </p>

      <div className="flex flex-col sm:flex-row gap-4">
        <Link
          href="/"
          className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-brand-600 text-white rounded-2xl font-bold shadow-lg shadow-brand-200 hover:bg-brand-700 hover:-translate-y-1 transition-all active:scale-95"
        >
          <Home className="w-5 h-5" />
          Beranda Utama
        </Link>
        
        <button
          onClick={() => window.history.back()}
          className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white border border-slate-200 text-slate-700 rounded-2xl font-bold hover:bg-slate-50 transition-all active:scale-95"
        >
          <ArrowLeft className="w-5 h-5" />
          Kembali
        </button>
      </div>

      <div className="mt-16 pt-8 border-t border-slate-100 w-full max-w-xs">
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-300">
          PantauBanjir © 2026
        </p>
      </div>
    </div>
  );
}
