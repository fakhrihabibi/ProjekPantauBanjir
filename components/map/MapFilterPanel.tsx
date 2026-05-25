'use client';

import React from 'react';
import type { SeverityLevel } from '@/lib/types';

interface MapFilterPanelProps {
  selectedFilter: SeverityLevel;
  onFilterChange: (filter: SeverityLevel) => void;
  severityCounts: Record<string, number>;
  totalPoints: number;
}

const filterOptions: SeverityLevel[] = ['Semua', 'Tinggi', 'Sedang', 'Rendah'];

export function MapFilterPanel({
  selectedFilter,
  onFilterChange,
  severityCounts,
  totalPoints,
}: MapFilterPanelProps) {
  return (
    <div className="w-full border-b border-slate-200 bg-white/95 p-2 sm:p-4 backdrop-blur-sm">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 md:gap-4">
        <div className="flex flex-wrap gap-1.5 sm:gap-2">
          {filterOptions.map((option) => {
            if (option === 'Parah') return null; // Not used in filter
            const isActive = selectedFilter === option;

            return (
              <button
                key={option}
                type="button"
                onClick={() => onFilterChange(option)}
                aria-pressed={isActive}
                className={`rounded-full border px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium transition-colors ${
                  isActive
                    ? 'border-brand-600 bg-brand-600 text-white'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-brand-600 hover:text-brand-600'
                }`}
              >
                {option}
                <span className={`ml-1.5 sm:ml-2 text-[10px] sm:text-xs ${isActive ? 'text-white/80' : 'text-slate-400'}`}>
                  {option !== 'Semua' ? (severityCounts[option] || 0) : totalPoints}
                </span>
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-4 md:flex gap-2 sm:gap-3">
          <div className="px-2 py-1 sm:px-3 sm:py-2 bg-slate-100 rounded-lg text-center md:min-w-[60px]">
            <p className="text-[9px] sm:text-[10px] uppercase font-bold text-slate-500">Total</p>
            <p className="text-xs sm:text-sm font-bold text-slate-900">{totalPoints}</p>
          </div>
          <div className="px-2 py-1 sm:px-3 sm:py-2 bg-red-50 rounded-lg text-center md:min-w-[60px]">
            <p className="text-[9px] sm:text-[10px] uppercase font-bold text-red-500">Tinggi</p>
            <p className="text-xs sm:text-sm font-bold text-red-700">{severityCounts.Tinggi || 0}</p>
          </div>
          <div className="px-2 py-1 sm:px-3 sm:py-2 bg-amber-50 rounded-lg text-center md:min-w-[60px]">
            <p className="text-[9px] sm:text-[10px] uppercase font-bold text-amber-500">Sedang</p>
            <p className="text-xs sm:text-sm font-bold text-amber-700">{severityCounts.Sedang || 0}</p>
          </div>
          <div className="px-2 py-1 sm:px-3 sm:py-2 bg-emerald-50 rounded-lg text-center md:min-w-[60px]">
            <p className="text-[9px] sm:text-[10px] uppercase font-bold text-emerald-500">Rendah</p>
            <p className="text-xs sm:text-sm font-bold text-emerald-700">{severityCounts.Rendah || 0}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
