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
    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900">
          Tingkat Air Real-time
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          Monitoring ketinggian air Sungai Bojongsoang
        </p>
      </div>

      <div className="flex flex-col items-center justify-center py-8">
        {/* Gauge Circle */}
        <div className="relative w-48 h-48 mb-8">
          {/* Background Circle */}
          <svg className="w-full h-full" viewBox="0 0 200 200">
            {/* Background arc */}
            <circle
              cx="100"
              cy="100"
              r="90"
              fill="none"
              stroke="#e5e7eb"
              strokeWidth="20"
            />

            {/* Safe zone (green) */}
            <circle
              cx="100"
              cy="100"
              r="90"
              fill="none"
              stroke="#10b981"
              strokeWidth="20"
              strokeDasharray="141.3 565.2"
              strokeDashoffset="0"
              opacity="0.3"
            />

            {/* Warning zone (yellow) */}
            <circle
              cx="100"
              cy="100"
              r="90"
              fill="none"
              stroke="#f59e0b"
              strokeWidth="20"
              strokeDasharray="141.3 565.2"
              strokeDashoffset="-141.3"
              opacity="0.3"
            />

            {/* Danger zone (red) */}
            <circle
              cx="100"
              cy="100"
              r="90"
              fill="none"
              stroke="#ef4444"
              strokeWidth="20"
              strokeDasharray="141.3 565.2"
              strokeDashoffset="-282.6"
              opacity="0.3"
            />

            {/* Current level fill */}
            <circle
              cx="100"
              cy="100"
              r="90"
              fill="none"
              stroke={getStatusHexColor(displayLevel)}
              strokeWidth="20"
              strokeDasharray={`${(displayLevel / 100) * 565.2} 565.2`}
              strokeLinecap="round"
              strokeDashoffset="0"
              opacity="1"
              style={{
                transition: 'stroke-dasharray 0.3s ease, stroke 0.3s ease',
              }}
            />

            {/* Center text background */}
            <circle cx="100" cy="100" r="50" fill="white" />
          </svg>

          {/* Center content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <p className={`text-4xl font-bold ${getStatusColor(displayLevel)}`}>
              {displayLevel}%
            </p>
            <p className="text-sm text-gray-600 mt-1">dari maksimal</p>
          </div>
        </div>

        {/* Status Badge */}
        <div
          className={`inline-block px-4 py-2 rounded-full font-semibold text-lg border-2 ${getStatusBg(
            displayLevel
          )} ${getStatusColor(displayLevel)}`}
        >
          {getStatusLabel(displayLevel)}
        </div>
      </div>

      {/* Level Indicators */}
      <div className="mt-8 space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-700 font-medium">
            Tingkat Bahaya
          </span>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-600 rounded-full"></div>
            <span className="text-sm font-semibold text-gray-900">
              {dangerLevel}%
            </span>
          </div>
        </div>

        <div
          className="w-full bg-gradient-to-r from-green-500 via-yellow-500 to-red-600 h-3 rounded-full"
          style={{
            background:
              'linear-gradient(to right, #10b981 0%, #f59e0b 50%, #ef4444 100%)',
          }}
        ></div>

        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-700 font-medium">
            Tingkat Normal
          </span>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-600 rounded-full"></div>
            <span className="text-sm font-semibold text-gray-900">0%</span>
          </div>
        </div>
      </div>

      {/* Additional Info */}
      <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-gray-600">Pembacaan Terakhir</p>
            <p className="text-sm font-semibold text-gray-900">
              {lastReadingTime ?? '--:--:--'}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-600">Tinggi Optimal</p>
            <p className="text-sm font-semibold text-gray-900">20-30 cm</p>
          </div>
          <div>
            <p className="text-xs text-gray-600">Tren</p>
            <p className="text-sm font-semibold text-green-600">↓ Menurun</p>
          </div>
        </div>
      </div>
    </div>
  );
}
