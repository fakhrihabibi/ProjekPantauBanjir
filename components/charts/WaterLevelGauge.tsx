'use client';

import { useEffect, useState } from 'react';

interface WaterLevelGaugeProps {
  currentLevel?: number;
  warningLevel?: number;
  dangerLevel?: number;
}

export function WaterLevelGauge({
  currentLevel = 45,
  warningLevel = 70,
  dangerLevel = 90,
}: WaterLevelGaugeProps) {
  const [displayLevel, setDisplayLevel] = useState(0);
  const [lastReadingTime, setLastReadingTime] = useState<string | null>(null);

  useEffect(() => {
    // Animate the gauge fill
    const interval = setInterval(() => {
      setDisplayLevel((prev) => {
        if (prev < currentLevel) {
          return Math.min(prev + 2, currentLevel);
        }
        return currentLevel;
      });
    }, 30);

    return () => clearInterval(interval);
  }, [currentLevel]);

  useEffect(() => {
    setLastReadingTime(new Date().toLocaleTimeString('id-ID'));
  }, []);

  const getStatusColor = (level: number) => {
    if (level <= warningLevel - 20) return 'text-green-600';
    if (level <= warningLevel) return 'text-yellow-600';
    if (level <= dangerLevel) return 'text-orange-600';
    return 'text-red-600';
  };

  const getStatusHexColor = (level: number) => {
    if (level <= warningLevel - 20) return '#16a34a';
    if (level <= warningLevel) return '#ca8a04';
    if (level <= dangerLevel) return '#ea580c';
    return '#dc2626';
  };

  const getStatusBg = (level: number) => {
    if (level <= warningLevel - 20) return 'bg-green-100 border-green-300';
    if (level <= warningLevel) return 'bg-yellow-100 border-yellow-300';
    if (level <= dangerLevel) return 'bg-orange-100 border-orange-300';
    return 'bg-red-100 border-red-300';
  };

  const getStatusLabel = (level: number) => {
    if (level <= warningLevel - 20) return 'NORMAL';
    if (level <= warningLevel) return 'WASPADA';
    if (level <= dangerLevel) return 'SIAGA';
    return 'BAHAYA';
  };

  return (
    <div className="flex flex-col items-center justify-center w-full">
      <div className="flex flex-col items-center justify-center py-4">
        {/* Gauge Circle */}
        <div className="relative w-48 h-48 mb-6">
          {/* Background Circle */}
          <svg className="w-full h-full" viewBox="0 0 200 200">
            {/* Background arc */}
            <circle
              cx="100"
              cy="100"
              r="90"
              fill="none"
              stroke="#f1f5f9"
              strokeWidth="16"
            />

            {/* Safe zone (green) */}
            <circle
              cx="100"
              cy="100"
              r="90"
              fill="none"
              stroke="#10b981"
              strokeWidth="16"
              strokeDasharray="141.3 565.2"
              strokeDashoffset="0"
              opacity="0.1"
            />

            {/* Warning zone (yellow) */}
            <circle
              cx="100"
              cy="100"
              r="90"
              fill="none"
              stroke="#f59e0b"
              strokeWidth="16"
              strokeDasharray="141.3 565.2"
              strokeDashoffset="-141.3"
              opacity="0.1"
            />

            {/* Danger zone (red) */}
            <circle
              cx="100"
              cy="100"
              r="90"
              fill="none"
              stroke="#ef4444"
              strokeWidth="16"
              strokeDasharray="141.3 565.2"
              strokeDashoffset="-282.6"
              opacity="0.1"
            />

            {/* Current level fill */}
            <circle
              cx="100"
              cy="100"
              r="90"
              fill="none"
              stroke={getStatusHexColor(displayLevel)}
              strokeWidth="16"
              strokeDasharray={`${(displayLevel / 100) * 565.2} 565.2`}
              strokeLinecap="round"
              strokeDashoffset="0"
              opacity="1"
              style={{
                transition: 'stroke-dasharray 1s cubic-bezier(0.4, 0, 0.2, 1), stroke 0.5s ease',
              }}
            />

            {/* Center text background */}
            <circle cx="100" cy="100" r="60" fill="white" />
          </svg>

          {/* Center content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <p className={`text-5xl font-black ${getStatusColor(displayLevel)}`}>
              {displayLevel}%
            </p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-1">Sungai Bojong</p>
          </div>
        </div>

        {/* Status Badge */}
        <div
          className={`inline-block px-6 py-2 rounded-2xl font-black text-sm border-2 ${getStatusBg(
            displayLevel
          )} ${getStatusColor(displayLevel)} shadow-sm`}
        >
          {getStatusLabel(displayLevel)}
        </div>
      </div>

      {/* Level Indicators */}
      <div className="mt-8 space-y-4 w-full px-4">
        <div className="flex justify-between items-center">
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
            Titik Bahaya
          </span>
          <span className="text-xs font-black text-red-600">
            {dangerLevel}%
          </span>
        </div>

        <div
          className="w-full bg-slate-100 h-2 rounded-full overflow-hidden flex"
        >
           <div className="h-full bg-emerald-500 w-1/3 opacity-30" />
           <div className="h-full bg-amber-500 w-1/3 opacity-30" />
           <div className="h-full bg-red-500 w-1/3 opacity-30" />
        </div>

        <div className="flex justify-between items-center">
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
            Titik Aman
          </span>
          <span className="text-xs font-black text-emerald-600">0%</span>
        </div>
      </div>
    </div>
  );
}
