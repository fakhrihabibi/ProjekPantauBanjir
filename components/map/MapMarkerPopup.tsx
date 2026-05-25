'use client';

import React from 'react';
import { getSeverityColor, formatDateTime } from '@/lib/utils';
import type { MapPoint } from '@/lib/types';
import { ShieldCheck } from 'lucide-react';

interface MapMarkerPopupProps {
  point: MapPoint;
}

export function MapMarkerPopup({ point }: MapMarkerPopupProps) {
  const severityColor = getSeverityColor(point.severity);
  
  // Parse source from description [Sumber: Name]
  const sourceMatch = point.description.match(/\[Sumber:\s*(.*?)\]/);
  const sourceName = sourceMatch ? sourceMatch[1] : null;
  const cleanedDescription = point.description.replace(/\[Sumber:\s*.*?\]/, '').trim();

  return (
    <div className="max-w-[280px] p-1">
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full" style={{ backgroundColor: severityColor }}></div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Titik Rawan</span>
        </div>
        {sourceName && (
          <div className="flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full border border-blue-100">
            <ShieldCheck className="w-2.5 h-2.5" />
            <span className="text-[8px] font-black uppercase tracking-tight">{sourceName}</span>
          </div>
        )}
      </div>
      
      <h3 className="mb-2 truncate text-base font-black text-slate-900 leading-tight">{point.name}</h3>

      <p className="mb-3 text-xs text-slate-600 leading-relaxed line-clamp-3 italic">
        {cleanedDescription || '-'}
      </p>

      <div className="mb-4 grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-slate-50 p-2 border border-slate-100">
          <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">Risiko</p>
          <p className="text-xs font-black" style={{ color: severityColor }}>{point.severity}</p>
        </div>
        <div className="rounded-lg bg-slate-50 p-2 border border-slate-100">
          <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">Laporan</p>
          <p className="text-xs font-black text-slate-900">{point.incidents} Kejadian</p>
        </div>
      </div>

      <div className="border-t border-slate-100 pt-3 space-y-1">
        <div className="flex items-center justify-between text-[10px]">
          <span className="text-slate-400">Update:</span>
          <span className="font-bold text-slate-600">{point.lastIncident ? formatDateTime(point.lastIncident) : '-'}</span>
        </div>
      </div>
    </div>
  );
}
