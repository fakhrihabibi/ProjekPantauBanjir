'use client';

import React from 'react';
import { getSeverityColor } from '@/lib/utils';
import type { MapPoint, SeverityLevel } from '@/lib/types';
import { ShieldCheck, Info } from 'lucide-react';

interface MapDetailPanelProps {
  point: MapPoint;
  selectedFilter: SeverityLevel;
  filteredCounts: Record<string, number>;
  onClose: () => void;
}

export function MapDetailPanel({
  point,
  selectedFilter,
  filteredCounts,
  onClose,
}: MapDetailPanelProps) {
  const severityColor = getSeverityColor(point.severity);

  // Parse source from description [Sumber: Name]
  const sourceMatch = point.description.match(/\[Sumber:\s*(.*?)\]/);
  const sourceName = sourceMatch ? sourceMatch[1] : null;
  const cleanedDescription = point.description.replace(/\[Sumber:\s*.*?\]/, '').trim();

  return (
    <div className="absolute bottom-2 left-2 right-2 sm:bottom-4 sm:left-4 sm:right-4 z-20 rounded-2xl border border-white/70 bg-white/95 p-3 sm:p-4 shadow-xl backdrop-blur lg:left-auto lg:top-24 lg:right-4 lg:bottom-4 lg:w-80 lg:overflow-auto animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="mb-2 sm:mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-0.5 sm:mb-1">Detail Marker</p>
          <h3 className="text-base sm:text-lg font-black text-slate-900 leading-tight">{point.name}</h3>
        </div>
        <span
          className="rounded-full px-2 py-0.5 sm:px-3 sm:py-1 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider whitespace-nowrap"
          style={{
            backgroundColor: `${severityColor}20`,
            color: severityColor,
            border: `1px solid ${severityColor}40`,
          }}
        >
          {point.severity}
        </span>
      </div>

      {sourceName && (
        <div className="mb-3 sm:mb-4 flex items-center gap-2 px-2 py-1.5 sm:px-3 sm:py-2 bg-blue-50 text-blue-700 rounded-xl border border-blue-100">
          <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <div>
            <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-tight">Sumber Terverifikasi</p>
            <p className="text-xs font-bold leading-tight">{sourceName}</p>
          </div>
        </div>
      )}

      <p className="mb-3 sm:mb-4 text-xs sm:text-sm leading-relaxed text-slate-600 italic line-clamp-4 sm:line-clamp-none">"{cleanedDescription || 'Tidak ada deskripsi tambahan untuk lokasi ini.'}"</p>

      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        <div className="rounded-xl bg-slate-50 border border-slate-100 p-2 sm:p-3">
          <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5 sm:mb-1">Kejadian</p>
          <p className="text-lg sm:text-xl font-black text-slate-900">{point.incidents}</p>
        </div>
        <div className="rounded-xl bg-slate-50 border border-slate-100 p-2 sm:p-3">
          <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5 sm:mb-1">Aktif</p>
          <p className="text-lg sm:text-xl font-black text-slate-900">{filteredCounts[point.severity] || 0}</p>
        </div>
      </div>

      <div className="mt-3 sm:mt-4 rounded-xl border border-slate-100 bg-slate-50 p-2 sm:p-3 text-xs sm:text-sm">
        <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5 sm:mb-1">Terakhir Terpantau</p>
        <p className="font-semibold text-slate-700">{point.lastIncident ? new Date(point.lastIncident).toLocaleDateString('id-ID', { dateStyle: 'long' }) : '-'}</p>
      </div>

      <div className="mt-4 sm:mt-6 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onClose}
          className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 sm:px-4 sm:py-2 text-[10px] sm:text-xs font-bold text-slate-600 transition-all hover:bg-slate-50 hover:border-slate-300"
        >
          Tutup
        </button>
        <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          {selectedFilter === 'Semua' ? 'Mode: Semua' : `Filter: ${selectedFilter}`}
        </span>
      </div>
    </div>
  );
}
