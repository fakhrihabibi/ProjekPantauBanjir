'use client';

import { MapComponent } from '@/components/map/MapComponent';

interface MapWrapperProps {
  data?: any;
  stats?: any;
  severityBreakdown?: any;
}

export function MapWrapper({ data, stats, severityBreakdown }: MapWrapperProps) {
  return <MapComponent />;
}
