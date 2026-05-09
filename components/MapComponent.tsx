'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState, useRef, useCallback } from 'react';
import type { MapPoint } from '@/app/api/map-points/route';

type LeafletModule = typeof import('leaflet');
type ReactLeafletModule = typeof import('react-leaflet');
type LeafletMap = import('leaflet').Map;

const MarkerClusterGroup = dynamic(() => import('react-leaflet-cluster'), {
  ssr: false,
});

const getSeverityColor = (severity: string) => {
  switch (severity) {
    case 'Tinggi':
      return '#ef4444';
    case 'Sedang':
      return '#f59e0b';
    case 'Rendah':
      return '#10b981';
    default:
      return '#0ea5e9';
  }
};

const getSeverityIcon = (severity: string) => {
  const baseUrl = 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-';

  switch (severity) {
    case 'Tinggi':
      return `${baseUrl}red.png`;
    case 'Sedang':
      return `${baseUrl}orange.png`;
    case 'Rendah':
      return `${baseUrl}green.png`;
    default:
      return `${baseUrl}blue.png`;
  }
};

interface MapComponentProps {
  className?: string;
}

type SeverityFilter = 'Semua' | 'Tinggi' | 'Sedang' | 'Rendah';

const filterOptions: SeverityFilter[] = ['Semua', 'Tinggi', 'Sedang', 'Rendah'];

export function MapComponent({ className = '' }: MapComponentProps) {
  const [mapPoints, setMapPoints] = useState<MapPoint[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<SeverityFilter>('Semua');
  const [selectedPointId, setSelectedPointId] = useState<string | null>(null);
  const [openPopupId, setOpenPopupId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mapInstanceRef = useRef<LeafletMap | null>(null);
  const popupRefsMap = useRef<Map<string, any>>(new Map());
  const [leaflet, setLeaflet] = useState<LeafletModule | null>(null);
  const [leafletComponents, setLeafletComponents] = useState<ReactLeafletModule | null>(null);
  const hasInitializedRef = useRef(false);

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
    if (instance && !hasInitializedRef.current) {
      mapInstanceRef.current = instance;
      hasInitializedRef.current = true;
    }
  }, []);

  useEffect(() => {
    return () => {
      // Cleanup: unmount map instance to prevent double initialization
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
        } catch (err) {
          // Silently ignore errors during cleanup
        }
        mapInstanceRef.current = null;
      }
      hasInitializedRef.current = false;
    };
  }, []);

  const filteredMapPoints =
    selectedFilter === 'Semua'
      ? mapPoints
      : mapPoints.filter((point) => point.severity === selectedFilter);

  const selectedPoint = filteredMapPoints.find((point) => point.id === selectedPointId) ?? null;

  const severityCounts = mapPoints.reduce(
    (counts, point) => {
      counts[point.severity] += 1;
      return counts;
    },
    { Tinggi: 0, Sedang: 0, Rendah: 0 }
  );

  const filteredCounts = filteredMapPoints.reduce(
    (counts, point) => {
      counts[point.severity] += 1;
      return counts;
    },
    { Tinggi: 0, Sedang: 0, Rendah: 0 }
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
        
        // Debug: Log pertama data point untuk verify koordinat
        if (result.data && result.data.length > 0) {
          console.log('Map points loaded:', result.data.length);
          console.log('First point:', result.data[0]);
        }
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
      setOpenPopupId(null);
      return;
    }

    if (!selectedPointId) {
      return;
    }

    const stillVisible = filteredMapPoints.some((point) => point.id === selectedPointId);

    if (!stillVisible) {
      setSelectedPointId(null);
      setOpenPopupId(null);
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

  // Trigger popup open saat selectedPointId berubah
  useEffect(() => {
    if (openPopupId && popupRefsMap.current.has(openPopupId)) {
      const popupRef = popupRefsMap.current.get(openPopupId);
      if (popupRef && popupRef.openPopup) {
        try {
          popupRef.openPopup();
        } catch (err) {
          console.log('Popup already open or error:', err);
        }
      }
    }
  }, [openPopupId]);

  const createCustomIcon = (severity: string) => {
    if (!leaflet) {
      return undefined;
    }

    return leaflet.icon({
      iconUrl: getSeverityIcon(severity),
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41],
    });
  };

  if (!leaflet || !leafletComponents) {
    return (
      <div className={`relative w-full h-full ${className}`}>
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-gray-100">
          <div className="text-center">
            <div className="mb-4 inline-block h-12 w-12 animate-spin rounded-full border-b-2 border-primary" />
            <p className="text-gray-600">Memuat peta...</p>
          </div>
        </div>
      </div>
    );
  }

  const { MapContainer, TileLayer, Marker, Popup } = leafletComponents;

  return (
    <div className={`flex flex-col gap-4 w-full h-full ${className}`}>
      {/* Filter and Stats Panel (Stateless/Permanent) */}
      <div className="surface-card p-4 shadow-sm border border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            {filterOptions.map((option) => {
              const isActive = selectedFilter === option;

              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => setSelectedFilter(option)}
                  className={`rounded-full border px-4 py-2 text-sm font-medium transition-all ${
                    isActive
                      ? 'border-primary bg-primary text-white shadow-md scale-105'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-primary hover:text-primary'
                  }`}
                >
                  {option}
                  <span className={`ml-2 text-xs ${isActive ? 'text-white/80' : 'text-slate-400'}`}>
                    {option !== 'Semua' ? severityCounts[option] : mapPoints.length}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="px-3 py-2 bg-slate-100 rounded-lg text-center">
              <p className="text-[10px] uppercase font-bold text-slate-500">Total</p>
              <p className="text-sm font-bold text-slate-900">{mapPoints.length}</p>
            </div>
            <div className="px-3 py-2 bg-red-50 rounded-lg text-center">
              <p className="text-[10px] uppercase font-bold text-red-500">Tinggi</p>
              <p className="text-sm font-bold text-red-700">{severityCounts.Tinggi}</p>
            </div>
            <div className="px-3 py-2 bg-amber-50 rounded-lg text-center">
              <p className="text-[10px] uppercase font-bold text-amber-500">Sedang</p>
              <p className="text-sm font-bold text-amber-700">{severityCounts.Sedang}</p>
            </div>
            <div className="px-3 py-2 bg-emerald-50 rounded-lg text-center">
              <p className="text-[10px] uppercase font-bold text-emerald-500">Rendah</p>
              <p className="text-sm font-bold text-emerald-700">{severityCounts.Rendah}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="relative flex-1 rounded-2xl overflow-hidden border border-slate-200 shadow-inner min-h-[500px]">

      {loading ? (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-gray-100">
          <div className="text-center">
            <div className="mb-4 inline-block h-12 w-12 animate-spin rounded-full border-b-2 border-primary" />
            <p className="text-gray-600">Memuat data titik rawan...</p>
          </div>
        </div>
      ) : null}

      {error ? (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-red-50">
          <div className="p-6 text-center">
            <p className="mb-2 font-semibold text-red-600">Gagal Memuat Peta</p>
            <p className="text-sm text-red-500">{error}</p>
          </div>
        </div>
      ) : null}

      <MapContainer
        center={[centerLat, centerLng]}
        zoom={15}
        className="h-full w-full"
        style={{ minHeight: '500px' }}
        ref={handleMapRef}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {!loading && !error ? (
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
                      console.log('Marker clicked:', point.id, point.name, `[${point.latitude}, ${point.longitude}]`);
                      setSelectedPointId(point.id);
                      setOpenPopupId(point.id);
                    },
                  }}
                >
                  <Popup 
                    ref={(ref) => {
                      if (ref) {
                        popupRefsMap.current.set(point.id, ref);
                      }
                    }}
                    autoClose={false} 
                    closeOnClick={true} 
                    keepInView
                  >
                    <div className="w-64">
                      <h3 className="mb-2 font-bold text-gray-900">{point.name}</h3>
                      <p className="mb-3 text-sm text-gray-700">{point.description}</p>

                      <div className="mb-3 grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-gray-600">Tingkat Risiko</p>
                          <p
                            className="font-semibold"
                            style={{ color: getSeverityColor(point.severity) }}
                          >
                            {point.severity}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600">Total Kejadian</p>
                          <p className="font-semibold text-gray-900">{point.incidents}</p>
                        </div>
                      </div>

                      <div className="border-t border-gray-200 pt-2 text-xs text-gray-600">
                        <p>Kejadian terakhir: {point.lastIncident ?? '-'}</p>
                        <p className="text-[10px] mt-1 text-gray-400">
                          Koordinat: {point.latitude.toFixed(6)}, {point.longitude.toFixed(6)}
                        </p>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MarkerClusterGroup>
        ) : null}
      </MapContainer>

      {!loading && !error && filteredMapPoints.length === 0 ? (
        <div className="absolute inset-x-4 bottom-4 z-20 rounded-2xl border border-dashed border-gray-300 bg-white/95 px-4 py-3 text-sm text-gray-600 shadow-sm backdrop-blur md:left-4 md:right-auto md:w-[22rem]">
          Tidak ada titik dengan filter {selectedFilter.toLowerCase()}.
        </div>
      ) : null}

      {!loading && !error && selectedPoint ? (
        <div className="absolute bottom-4 left-4 right-4 z-20 rounded-2xl border border-white/70 bg-white/95 p-4 shadow-xl backdrop-blur lg:left-auto lg:top-24 lg:right-4 lg:bottom-4 lg:w-80 lg:overflow-auto">
          <div className="mb-3 flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Detail Marker</p>
              <h3 className="text-lg font-bold text-gray-900">{selectedPoint.name}</h3>
            </div>
            <span
              className="rounded-full px-3 py-1 text-xs font-semibold"
              style={{
                backgroundColor: `${getSeverityColor(selectedPoint.severity)}20`,
                color: getSeverityColor(selectedPoint.severity),
              }}
            >
              {selectedPoint.severity}
            </span>
          </div>

          <p className="mb-4 text-sm leading-6 text-gray-600">{selectedPoint.description}</p>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-gray-50 p-3">
              <p className="text-xs text-gray-500">Total Kejadian</p>
              <p className="mt-1 text-xl font-bold text-gray-900">{selectedPoint.incidents}</p>
            </div>
            <div className="rounded-xl bg-gray-50 p-3">
              <p className="text-xs text-gray-500">Tampil di Filter</p>
              <p className="mt-1 text-xl font-bold text-gray-900">{filteredCounts[selectedPoint.severity]}</p>
            </div>
          </div>

          <div className="mt-4 rounded-xl border border-gray-100 bg-gray-50 p-3 text-sm text-gray-700">
            <p className="font-medium text-gray-900">Kejadian terakhir</p>
            <p className="mt-1">{selectedPoint.lastIncident ?? '-'}</p>
          </div>

          <div className="mt-4 text-xs text-gray-500 bg-gray-50 p-2 rounded">
            <p>📍 {selectedPoint.latitude.toFixed(6)}, {selectedPoint.longitude.toFixed(6)}</p>
          </div>

          <div className="mt-4 flex items-center justify-between gap-3 text-xs text-gray-500">
            <button
              type="button"
              onClick={() => {
                setSelectedPointId(null);
                setOpenPopupId(null);
              }}
              className="rounded-full border border-gray-200 px-3 py-1.5 font-medium text-gray-700 transition-colors hover:border-primary hover:text-primary"
            >
              Tutup detail
            </button>
            <span>{selectedFilter === 'Semua' ? 'Semua marker aktif' : `Filter ${selectedFilter} aktif`}</span>
          </div>
        </div>
      ) : null}
    </div>
  </div>
  );
}
