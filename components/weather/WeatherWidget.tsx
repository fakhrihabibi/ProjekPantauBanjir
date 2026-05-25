'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Cloud, Wind, Thermometer, Droplets, AlertTriangle, ArrowRight } from 'lucide-react';

interface WeatherData {
  success: boolean;
  current: {
    weather_desc: string | null;
    t: number | null;
    hu: number | null;
    ws: number | null;
  };
  ispu: {
    index: number | null;
    category: {
      category: string;
      emoji: string;
      advice: string;
    };
  };
  extremeDetections: Array<{ code: string; label: string; advice: string }>;
}

export function WeatherWidget() {
  const [data, setData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/bmkg')
      .then((res) => res.json())
      .then((json) => {
        setData(json);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="surface-card p-6 animate-pulse">
        <div className="h-6 w-32 bg-gray-200 rounded mb-4"></div>
        <div className="flex gap-4">
          <div className="h-12 w-12 bg-gray-200 rounded-full"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 w-24 bg-gray-200 rounded"></div>
            <div className="h-4 w-full bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!data || !data.success) return null;

  const { current, ispu, extremeDetections } = data;

  return (
    <div className="surface-card p-6 transition-all hover:shadow-md border-l-4 border-brand-500">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Cloud className="w-5 h-5 text-brand-600" />
            Cuaca & Udara
          </h3>
          <p className="text-sm text-gray-500">Bojongsoang, Kab. Bandung</p>
        </div>
        <Link 
          href="/cuaca" 
          className="text-xs font-semibold text-brand-700 hover:text-brand-900 flex items-center gap-1 group"
        >
          Detail Selengkapnya
          <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 rounded-xl text-blue-600">
            <Thermometer className="w-6 h-6" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{current.t ?? '--'}°C</p>
            <p className="text-xs text-gray-600 truncate">{current.weather_desc ?? 'Berawan'}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl ${
            ispu.index && ispu.index <= 50 ? 'bg-green-50 text-green-600' : 
            ispu.index && ispu.index <= 100 ? 'bg-yellow-50 text-yellow-600' : 'bg-orange-50 text-orange-600'
          }`}>
            <Wind className="w-6 h-6" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{ispu.index ?? '--'}</p>
            <p className="text-xs text-gray-600">{ispu.category.category}</p>
          </div>
        </div>
      </div>

      {extremeDetections.length > 0 && (
        <div className="mt-4 p-3 bg-red-50 rounded-lg border border-red-100 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <div className="text-xs">
            <p className="font-bold text-red-700">{extremeDetections[0].label}</p>
            <p className="text-red-600">{extremeDetections[0].advice}</p>
          </div>
        </div>
      )}
    </div>
  );
}
