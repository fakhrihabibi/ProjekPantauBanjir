'use client';

import { MapComponent } from '@/components/MapComponent';

interface MapWrapperProps {
  data?: any;
  stats?: any;
  severityBreakdown?: any;
}

export function MapWrapper({ data, stats, severityBreakdown }: MapWrapperProps) {
  return <MapComponent />;
}
