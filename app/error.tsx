'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCcw, Home } from 'lucide-react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center">
      <div className="bg-red-50 p-4 rounded-full mb-6">
        <AlertTriangle className="w-12 h-12 text-red-500" />
      </div>
      
      <h1 className="text-2xl font-bold text-slate-900 mb-2">Terjadi Kesalahan!</h1>
      <p className="text-slate-600 max-w-md mb-8">
        Maaf, sistem mengalami kendala saat memproses permintaan Anda. 
        Hal ini mungkin karena masalah koneksi database atau gangguan teknis lainnya.
      </p>

      <div className="flex flex-col sm:flex-row gap-4">
        <button
          onClick={() => reset()}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition active:scale-95"
        >
          <RefreshCcw className="w-4 h-4" />
          Coba Lagi
        </button>
        
        <Link
          href="/"
          className="flex items-center justify-center gap-2 px-6 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 transition active:scale-95"
        >
          <Home className="w-4 h-4" />
          Kembali ke Beranda
        </Link>
      </div>

      {process.env.NODE_ENV === 'development' && (
        <div className="mt-12 p-4 bg-slate-800 rounded-lg text-left overflow-auto max-w-2xl w-full">
          <p className="text-red-400 font-mono text-xs mb-2">Error Digest: {error.digest}</p>
          <pre className="text-slate-300 font-mono text-xs whitespace-pre-wrap">
            {error.message}
          </pre>
        </div>
      )}
    </div>
  );
}
