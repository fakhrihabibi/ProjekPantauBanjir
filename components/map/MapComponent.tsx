'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState, useRef, useCallback } from 'react';
import { getSeverityColor } from '@/lib/utils';
import type { MapPoint, SeverityLevel } from '@/lib/types';

// Sub-components
import { MapFilterPanel } from './MapFilterPanel';
import { MapDetailPanel } from './MapDetailPanel';

type LeafletModule = typeof import('leaflet');
type ReactLeafletModule = typeof import('react-leaflet');
type LeafletMap = import('leaflet').Map;

const MarkerClusterGroup = dynamic(() => import('react-leaflet-cluster'), {
  ssr: false,
});

interface MapComponentProps {
  className?: string;
}

export function MapComponent({ className = '' }: MapComponentProps) {
  const [mapPoints, setMapPoints] = useState<MapPoint[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<SeverityLevel>('Semua');
  const [selectedPointId, setSelectedPointId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mapInstanceRef = useRef<LeafletMap | null>(null);
  const [leaflet, setLeaflet] = useState<LeafletModule | null>(null);
  const [leafletComponents, setLeafletComponents] = useState<ReactLeafletModule | null>(null);

  const centerLat = -6.9740;
  const centerLng = 107.6303;

  useEffect(() => {
    let active = true;

    const loadLeafletLibraries = async () => {
      const [leafletModule, reactLeafletModule] = await Promise.all([
        import('leaflet'),
        import('react-leaflet'),
      ]);

      if (active) {
        setLeaflet(leafletModule);
        setLeafletComponents(reactLeafletModule);
      }
    };

    loadLeafletLibraries();

    return () => {
      active = false;
    };
  }, []);

  const handleMapRef = useCallback((instance: LeafletMap | null) => {
    mapInstanceRef.current = instance;
  }, []);

  const filteredMapPoints =
    selectedFilter === 'Semua'
      ? mapPoints
      : mapPoints.filter((point) => point.severity === selectedFilter);

  const selectedPoint = mapPoints.find((point) => point.id === selectedPointId) ?? null;

  const severityCounts = mapPoints.reduce(
    (counts, point) => {
      if (point.severity) {
        counts[point.severity] = (counts[point.severity] || 0) + 1;
      }
      return counts;
    },
    { Tinggi: 0, Sedang: 0, Rendah: 0 } as Record<string, number>
  );

  const filteredCounts = filteredMapPoints.reduce(
    (counts, point) => {
      if (point.severity) {
        counts[point.severity] = (counts[point.severity] || 0) + 1;
      }
      return counts;
    },
    { Tinggi: 0, Sedang: 0, Rendah: 0 } as Record<string, number>
  );

  useEffect(() => {
    const fetchMapPoints = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/map-points');

        if (!response.ok) {
          throw new Error('Failed to fetch map data');
        }

        const result = await response.json();
        setMapPoints(result.data ?? []);
        setError(null);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMessage);
        console.error('Error fetching map points:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMapPoints();
  }, []);

  useEffect(() => {
    if (!filteredMapPoints.length) {
      setSelectedPointId(null);
      return;
    }

    if (!selectedPointId) {
      return;
    }

    const stillVisible = filteredMapPoints.some((point) => point.id === selectedPointId);

    if (!stillVisible) {
      setSelectedPointId(null);
    }
  }, [filteredMapPoints, selectedPointId]);

  useEffect(() => {
    if (!mapInstanceRef.current || !leaflet || filteredMapPoints.length === 0) {
      return;
    }

    const bounds = leaflet.latLngBounds(filteredMapPoints.map((point) => [point.latitude, point.longitude]));

    if (bounds.isValid()) {
      mapInstanceRef.current.fitBounds(bounds.pad(0.18), { animate: true });
    }
  }, [filteredMapPoints, leaflet]);

  // Listen for external requests to focus the map on specific coordinates
  useEffect(() => {
    const handler = (e: Event) => {
      try {
        // @ts-ignore
        const detail = (e as CustomEvent).detail || {};
        const lat = Number(detail.lat);
        const lng = Number(detail.lng);
        const zoom = detail.zoom ? Number(detail.zoom) : undefined;

        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
        if (!mapInstanceRef.current) return;

        const targetZoom = zoom ?? Math.max(mapInstanceRef.current.getZoom(), 15);
        mapInstanceRef.current.setView([lat, lng], targetZoom, { animate: true });
      } catch (err) {
        // ignore
      }
    };

    window.addEventListener('focusMapTo', handler as EventListener);
    return () => window.removeEventListener('focusMapTo', handler as EventListener);
  }, []);

  const createCustomIcon = (severity: string) => {
    if (!leaflet) {
      return undefined;
    }

    const color = getSeverityColor(severity);
    const svg = `
      <svg width="34" height="42" viewBox="0 0 34 42" xmlns="http://www.w3.org/2000/svg">
        <path d="M17 0C10.37 0 5 5.37 5 12c0 8.25 12 24 12 24s12-15.75 12-24C29 5.37 23.63 0 17 0z" fill="${color}" stroke="#fff" stroke-width="2"/>
        <circle cx="17" cy="12" r="5" fill="#fff" />
      </svg>
    `;

    return leaflet.divIcon({
      html: svg,
      className: '',
      iconSize: [34, 42],
      iconAnchor: [17, 42],
      popupAnchor: [0, -36],
    });
  };

  if (!leaflet || !leafletComponents) {
    return (
      <div className={`relative w-full h-full ${className}`}>
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-slate-50">
          <div className="text-center">
            <div className="mb-4 inline-block h-12 w-12 animate-spin rounded-full border-b-2 border-brand-600" />
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Memuat peta...</p>
          </div>
        </div>
      </div>
    );
  }

  const { MapContainer, TileLayer, Marker } = leafletComponents;

  return (
    <div className={`flex h-full w-full flex-col overflow-hidden rounded-3xl border border-slate-200 shadow-inner bg-slate-50 ${className}`}>
      <MapFilterPanel
        selectedFilter={selectedFilter}
        onFilterChange={setSelectedFilter}
        severityCounts={severityCounts}
        totalPoints={mapPoints.length}
      />

      <div className="relative min-h-[420px] flex-1 overflow-hidden">
        {loading && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-slate-50/80 backdrop-blur-sm">
            <div className="text-center">
              <div className="mb-4 inline-block h-12 w-12 animate-spin rounded-full border-b-2 border-brand-600" />
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Sinkronisasi data...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-red-50/90 backdrop-blur-sm">
            <div className="p-8 text-center max-w-sm">
              <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                {error.includes('database') ? '!' : '!'}
              </div>
              <p className="mb-2 font-black text-red-700 uppercase tracking-wider">Gagal Memuat Data</p>
              <p className="text-sm text-red-600 leading-relaxed">{error}</p>
            </div>
          </div>
        )}

        <MapContainer
          center={[centerLat, centerLng]}
          zoom={15}
          className="h-full w-full z-10"
          ref={handleMapRef}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {!loading && !error && (
            <MarkerClusterGroup
              chunkedLoading
              showCoverageOnHover={false}
              spiderfyOnMaxZoom
              disableClusteringAtZoom={17}
            >
              {filteredMapPoints.map((point) => {
                const icon = createCustomIcon(point.severity);

                return (
                  <Marker
                    key={point.id}
                    position={[point.latitude, point.longitude]}
                    icon={icon}
                    eventHandlers={{
                      click: () => {
                        setSelectedPointId(point.id);
                        try {
                          if (mapInstanceRef.current) {
                            mapInstanceRef.current.setView([point.latitude, point.longitude], Math.max(mapInstanceRef.current.getZoom(), 15), { animate: true });
                          }
                        } catch (e) {}
                      },
                    }}
                  />
                );
              })}
            </MarkerClusterGroup>
          )}
        </MapContainer>

        {!loading && !error && filteredMapPoints.length === 0 && (
          <div className="absolute inset-x-4 bottom-4 z-20 rounded-2xl border border-dashed border-slate-300 bg-white/95 px-4 py-3 text-xs font-bold uppercase tracking-widest text-slate-400 shadow-sm backdrop-blur md:left-4 md:right-auto">
            Tidak ada marker ditemukan
          </div>
        )}

        {!loading && !error && selectedPoint && (
          <MapDetailPanel
            point={selectedPoint}
            selectedFilter={selectedFilter}
            filteredCounts={filteredCounts}
            onClose={() => setSelectedPointId(null)}
          />
        )}
      </div>
    </div>
  );
}
