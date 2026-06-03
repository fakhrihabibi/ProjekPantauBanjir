export type FloodSeverity = 'Rendah' | 'Sedang' | 'Tinggi';

export function classifyFloodSeverityByHeight(heightCm: number): FloodSeverity {
  if (heightCm <= 30) {
    return 'Rendah';
  }

  if (heightCm <= 70) {
    return 'Sedang';
  }

  return 'Tinggi';
}

export function getFloodSeverityLabel(heightCm: number): string {
  const severity = classifyFloodSeverityByHeight(heightCm);

  if (severity === 'Rendah') {
    return 'Rendah - setinggi mata kaki (~10–30 cm)';
  }

  if (severity === 'Sedang') {
    return 'Sedang - setinggi lutut (~31–70 cm)';
  }

  return 'Tinggi - di atas lutut (>70 cm)';
}