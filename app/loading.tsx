import React from 'react';

export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 border-4 border-blue-200 rounded-full"></div>
        <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
      </div>
      <div className="text-center">
        <h2 className="text-xl font-semibold text-slate-800">Memuat Halaman...</h2>
        <p className="text-slate-500 text-sm mt-1">Mohon tunggu sebentar, data sedang disiapkan.</p>
      </div>
    </div>
  );
}
