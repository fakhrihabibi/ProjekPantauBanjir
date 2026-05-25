'use client';

import React, { useEffect, useState } from 'react';
import { WeatherDashboard } from '@/components/weather/WeatherDashboard';
import { Cloud, RefreshCw, ChevronLeft } from 'lucide-react';
import Link from 'next/link';

export default function CuacaPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/bmkg');
      const json = await res.json();
      setData(json);
    } catch (error) {
      console.error('Failed to fetch weather data', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  return (
    <div className="page-shell space-y-8 py-8">
      <section className="page-header">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 sm:gap-6">
          <div className="space-y-1 sm:space-y-2">
            <Link 
              href="/" 
              className="inline-flex items-center gap-1.5 text-[10px] sm:text-xs font-bold uppercase tracking-widest text-brand-600 hover:text-brand-700 mb-1 sm:mb-2 transition-colors"
            >
              <ChevronLeft className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
              Kembali ke Beranda
            </Link>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-950 tracking-tight flex items-center gap-2 sm:gap-3">
              <Cloud className="w-7 h-7 sm:w-10 sm:h-10 text-brand-600" />
              Cuaca & Kualitas Udara
            </h1>
            <p className="text-sm sm:text-base md:text-lg font-medium text-slate-500 max-w-3xl leading-relaxed">
              Informasi real-time prakiraan cuaca dan indeks standar pencemar udara (ISPU) untuk wilayah Bojongsoang, Kab. Bandung.
            </p>
          </div>
          
          <button 
            onClick={handleRefresh}
            disabled={loading || refreshing}
            className="flex items-center justify-center gap-2 px-4 py-2 sm:px-5 sm:py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-50 hover:border-brand-300 transition-all disabled:opacity-50 active:scale-95 w-full sm:w-auto mt-2 sm:mt-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 sm:w-4 sm:h-4 text-brand-600 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh Data
          </button>
        </div>
      </section>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 sm:py-32 space-y-4 sm:space-y-6 surface-card border-none bg-slate-50/50">
          <div className="relative">
            <div className="w-12 h-12 sm:w-16 sm:h-16 border-4 border-brand-100 border-t-brand-600 rounded-full animate-spin"></div>
            <Cloud className="w-4 h-4 sm:w-6 sm:h-6 text-brand-400 absolute inset-0 m-auto animate-pulse" />
          </div>
          <p className="text-[10px] sm:text-sm font-bold text-slate-400 uppercase tracking-[0.2em]">Sinkronisasi BMKG...</p>
        </div>
      ) : (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <WeatherDashboard data={data} />
        </div>
      )}

      <footer className="mt-8 sm:mt-12 p-6 sm:p-8 bg-slate-900 rounded-[1.5rem] sm:rounded-[2rem] text-center text-white shadow-xl">
        <div className="flex flex-col items-center gap-3 sm:gap-4">
          <div className="px-3 py-1 bg-white/10 rounded-full text-[8px] sm:text-[10px] font-bold uppercase tracking-[0.15em] sm:tracking-[0.2em] text-brand-300">
            Sumber Data Terpercaya
          </div>
          <p className="text-xs sm:text-sm font-medium text-slate-300 leading-relaxed">
            Seluruh informasi cuaca dan kualitas udara bersumber langsung dari <br className="hidden sm:block" />
            <span className="font-black text-white uppercase tracking-tight">Badan Meteorologi, Klimatologi, dan Geofisika (BMKG)</span>
          </p>
          <div className="h-px w-10 sm:w-12 bg-white/20 my-1 sm:my-2" />
          <p className="text-[8px] sm:text-[10px] text-slate-500 uppercase tracking-widest leading-relaxed">
            Data diperbarui secara otomatis setiap kali halaman dimuat <br className="hidden sm:block" /> atau dengan menekan tombol refresh di atas.
          </p>
        </div>
      </footer>
    </div>
  );
}
