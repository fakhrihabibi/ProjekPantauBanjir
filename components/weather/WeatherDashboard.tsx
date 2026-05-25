'use client';

import React from 'react';
import { 
  Cloud, 
  Wind, 
  Thermometer, 
  Droplets, 
  AlertTriangle, 
  Navigation, 
  Clock,
  Calendar,
  Zap
} from 'lucide-react';

interface WeatherDashboardProps {
  data: any;
}

export function WeatherDashboard({ data }: WeatherDashboardProps) {
  if (!data || !data.success) {
    return (
      <div className="p-8 text-center surface-card">
        <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
        <p className="text-gray-600">Gagal memuat data cuaca. Silakan coba lagi nanti.</p>
      </div>
    );
  }

  const { current, ispu, forecast3h, daySummaries, extremeDetections, updatedAt } = data;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Kondisi Saat Ini</h2>
          <p className="text-xs sm:text-sm text-gray-500 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            Terakhir diperbarui: {new Date(updatedAt).toLocaleTimeString('id-ID')}
          </p>
        </div>
        {data.errors?.length > 0 && (
          <div className="text-[10px] sm:text-xs px-2 sm:px-3 py-0.5 sm:py-1 bg-yellow-100 text-yellow-800 rounded-full border border-yellow-200 w-fit">
            Menggunakan data cadangan
          </div>
        )}
      </div>

      {/* Extreme Alerts */}
      {extremeDetections.length > 0 && (
        <div className="space-y-2 sm:space-y-3">
          {extremeDetections.map((alert: any, idx: number) => (
            <div key={idx} className="p-3 sm:p-4 bg-red-50 border-l-4 border-red-500 rounded-r-xl flex items-start gap-3 sm:gap-4">
              <div className="p-1.5 sm:p-2 bg-red-100 rounded-full text-red-600 shrink-0">
                <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div>
                <h4 className="text-sm sm:text-base font-bold text-red-900">{alert.label}</h4>
                <p className="text-xs sm:text-sm text-red-700">{alert.advice}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Current Weather Main Card */}
        <div className="lg:col-span-2 surface-card p-6 sm:p-8 bg-gradient-to-br from-blue-600 to-blue-800 text-white border-none">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 sm:gap-8">
            <div className="space-y-1 sm:space-y-2">
              <p className="text-blue-100 text-xs sm:text-sm font-medium tracking-wide uppercase">Cuaca Terkini</p>
              <div className="flex items-center gap-3 sm:gap-4">
                <span className="text-4xl sm:text-6xl font-bold">{current.t ?? '--'}°C</span>
                <div className="h-10 sm:h-12 w-px bg-blue-400/50"></div>
                <div>
                  <p className="text-lg sm:text-xl font-semibold">{current.weather_desc ?? 'Berawan'}</p>
                  <p className="text-xs sm:text-sm text-blue-200">Bojongsoang, Bandung</p>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-x-4 sm:gap-x-8 gap-y-3 sm:gap-y-4 w-full md:w-auto pt-4 sm:pt-6 md:pt-0 border-t md:border-t-0 border-blue-400/30">
              <div className="flex items-center gap-2 sm:gap-3">
                <Droplets className="w-4 h-4 sm:w-5 sm:h-5 text-blue-300" />
                <div>
                  <p className="text-[10px] sm:text-xs text-blue-200">Kelembapan</p>
                  <p className="text-xs sm:text-sm font-semibold">{current.hu ?? '--'}%</p>
                </div>
              </div>
              <div className="flex items-center gap-2 sm:gap-3">
                <Wind className="w-4 h-4 sm:w-5 sm:h-5 text-blue-300" />
                <div>
                  <p className="text-[10px] sm:text-xs text-blue-200">Angin</p>
                  <p className="text-xs sm:text-sm font-semibold">{current.ws ?? '--'} km/j</p>
                </div>
              </div>
              <div className="flex items-center gap-2 sm:gap-3">
                <Navigation className="w-4 h-4 sm:w-5 sm:h-5 text-blue-300" />
                <div>
                  <p className="text-[10px] sm:text-xs text-blue-200">Arah</p>
                  <p className="text-xs sm:text-sm font-semibold">{current.wd ?? '--'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 sm:gap-3">
                <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-blue-300" />
                <div>
                  <p className="text-[10px] sm:text-xs text-blue-200">Terasa</p>
                  <p className="text-xs sm:text-sm font-semibold">{current.t ? current.t + 2 : '--'}°C</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Air Quality (ISPU) Card */}
        <div className="surface-card p-5 sm:p-6 flex flex-col justify-between border-l-4 border-emerald-500">
          <div>
            <div className="flex justify-between items-center mb-4 sm:mb-6">
              <h3 className="text-sm sm:text-base font-bold text-gray-900 flex items-center gap-2">
                <Wind className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />
                ISPU
              </h3>
              <span className={`px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-bold ${
                ispu.index <= 50 ? 'bg-emerald-100 text-emerald-700' :
                ispu.index <= 100 ? 'bg-yellow-100 text-yellow-700' : 'bg-orange-100 text-orange-700'
              }`}>
                {ispu.category.category}
              </span>
            </div>

            <div className="text-center py-2 sm:py-4">
              <div className="text-4xl sm:text-5xl font-black text-gray-900 mb-0.5 sm:mb-1">{ispu.index ?? '--'}</div>
              <p className="text-[10px] sm:text-sm text-gray-500 font-medium">Indeks Standar Pencemar</p>
            </div>
          </div>

          <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-gray-50 rounded-xl border border-gray-100">
            <p className="text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 sm:mb-2">Saran</p>
            <p className="text-xs sm:text-sm text-gray-700 italic line-clamp-3 sm:line-clamp-none">"{ispu.category.advice}"</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* 3-Hour Forecast Today */}
        <div className="surface-card p-5 sm:p-6">
          <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-brand-600" />
            Prakiraan 3 Jam
          </h3>
          <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-2 sm:pb-4 scrollbar-hide">
            {forecast3h.map((f: any, idx: number) => (
              <div key={idx} className="min-w-[90px] sm:min-w-[100px] flex flex-col items-center p-2.5 sm:p-3 bg-gray-50 rounded-2xl border border-gray-100">
                <p className="text-[10px] sm:text-xs font-bold text-gray-500 mb-1.5 sm:mb-2">
                  {new Date(f.datetime.replace(' ', 'T')).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                </p>
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mb-1.5 sm:mb-2">
                  <Cloud className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <p className="text-xs sm:text-sm font-bold text-gray-900">{f.t}°C</p>
                <p className="text-[9px] sm:text-[10px] text-gray-500 text-center leading-tight mt-1 truncate w-full">
                  {f.weather_desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Daily Summary Next 2 Days */}
        <div className="surface-card p-5 sm:p-6">
          <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
            <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-brand-600" />
            Hari Berikutnya
          </h3>
          <div className="space-y-3 sm:space-y-4">
            {daySummaries.map((day: any, idx: number) => (
              <div key={idx} className="p-3 sm:p-4 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-between">
                <div>
                  <p className="text-sm sm:text-base font-bold text-gray-900">
                    {new Date(day.date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short' })}
                  </p>
                  <p className="text-[10px] sm:text-xs text-gray-500">{day.day?.weather_desc ?? 'Berawan'}</p>
                </div>
                <div className="flex items-center gap-4 sm:gap-6">
                  <div className="text-center">
                    <p className="text-[9px] sm:text-[10px] text-gray-400 font-bold uppercase">Siang</p>
                    <p className="text-sm sm:text-base font-bold text-gray-900">{day.day?.t ?? '--'}°</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[9px] sm:text-[10px] text-gray-400 font-bold uppercase">Malam</p>
                    <p className="text-sm sm:text-base font-bold text-gray-900">{day.night?.t ?? '--'}°</p>
                  </div>
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white rounded-xl shadow-sm border border-gray-100 flex items-center justify-center text-brand-600 shrink-0">
                    <Cloud className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
