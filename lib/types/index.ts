/**
 * Common TypeScript interfaces and types for the application.
 */

export interface LaporanItem {
  id: string;
  location: string;
  date: string;
  reporter: string;
  status: string;
  description: string;
}

export type SeverityLevel = 'Tinggi' | 'Sedang' | 'Rendah' | 'Semua' | 'Parah';

export interface AdminReportItem {
  id: string;
  lokasi: string;
  pelapor: string;
  waktu: string;
  deskripsi: string;
  status: string;
  rating: 'Parah' | 'Sedang' | 'Rendah';
  fotoUrl?: string | null;
}

export interface MapPoint {
  id: string;
  name: string;
  description: string | null;
  latitude: number;
  longitude: number;
  severity: 'Tinggi' | 'Sedang' | 'Rendah';
  incidents: number;
  lastIncident: string | null;
}
