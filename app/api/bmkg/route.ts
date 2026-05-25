// app/api/bmkg/route.ts
import { NextResponse } from 'next/server';
import { fetchBMKGAll, normalizeCurrentFromForecast, detectExtremes, ispuCategory, processForecast, getThreeHourForecastToday, getDaySummaries } from '@/lib/bmkg';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function extractIspuIndex(raw: any): number | null {
  if (!raw) return null;

  // common shapes: { data: [{ nilai: X, parameter: 'PM2.5', waktu: '...' }] }
  try {
    const candidate = raw?.data ?? raw?.items ?? raw?.ispu ?? raw;
    if (Array.isArray(candidate) && candidate.length > 0) {
      const first = candidate[0];
      const v = first.nilai ?? first.index ?? first.value ?? first.kategori ?? null;
      return typeof v === 'number' ? v : v ? Number(String(v).replace(',', '.')) : null;
    }

    // fallback: try find any numeric property
    for (const k of Object.keys(raw)) {
      const val = raw[k];
      if (typeof val === 'number') return val;
      if (typeof val === 'string' && /\d/.test(val)) {
        const n = Number(String(val).replace(',', '.'));
        if (!Number.isNaN(n)) return n;
      }
    }
  } catch (e) {
    // ignore
  }

  return null;
}

export async function GET() {
  try {
    const raw = await fetchBMKGAll();

    // Normalize current from forecast (best-effort)
    let current = normalizeCurrentFromForecast(raw.forecast);

    // If normalization failed to produce current, try extracting first forecast entry directly
    const extractCurrentFromForecast = (forecast: any) => {
      try {
        if (!forecast) return null;
        if (Array.isArray(forecast?.data) && forecast.data.length > 0) {
          const firstBlock = forecast.data[0];
          const cuaca = firstBlock?.cuaca;
          if (Array.isArray(cuaca)) {
            for (const group of cuaca) {
              if (Array.isArray(group) && group.length > 0) {
                const e = group[0];
                return {
                  weather_desc: e.weather_desc ?? e.weather_desc_en ?? null,
                  t: typeof e.t === 'number' ? e.t : (e.t ? Number(String(e.t).replace(',', '.')) : null),
                  hu: typeof e.hu === 'number' ? e.hu : (e.hu ? Number(String(e.hu).replace(',', '.')) : null),
                  ws: typeof e.ws === 'number' ? e.ws : (e.ws ? Number(String(e.ws).replace(',', '.')) : null),
                  wd: e.wd ?? null,
                  wd_to: e.wd_to ?? null,
                  local_datetime: e.local_datetime ?? e.utc_datetime ?? null,
                };
              }
            }
          }
        }
      } catch (e) {
        // ignore
      }
      return null;
    };

    const fallbackCurrent = extractCurrentFromForecast(raw.forecast);
    if ((current == null || Object.values(current).every((v) => v === null)) && fallbackCurrent) {
      current = fallbackCurrent;
    }

    const extremes = detectExtremes(current);

    const ispuIndex = extractIspuIndex(raw.ispu);
    // try to extract parameter and timestamp from common shapes
    let ispuParameter: string | null = null;
    let ispuUpdatedAt: string | null = null;
    try {
      const cand = raw.ispu?.data ?? raw.ispu?.items ?? raw.ispu ?? null;
      if (Array.isArray(cand) && cand.length > 0) {
        const first = cand[0];
        ispuParameter = first.parameter ?? first.nama ?? first.param ?? null;
        ispuUpdatedAt = first.waktu ?? first.time ?? first.timestamp ?? null;
      } else if (cand && typeof cand === 'object') {
        ispuParameter = cand.parameter ?? cand.nama ?? null;
        ispuUpdatedAt = cand.waktu ?? cand.time ?? null;
      }
    } catch (e) {
      // ignore
    }

    const ispuInfo = {
      index: ispuIndex,
      category: ispuCategory(ispuIndex),
      parameter: ispuParameter,
      updatedAt: ispuUpdatedAt,
      raw: raw.ispu,
      available: raw.ispu != null,
    };

    const peringatanInfo = {
      raw: raw.peringatan,
      available: raw.peringatan != null,
    };

    return NextResponse.json({
      success: true,
      location: 'Desa Bojongsoang / Cikoneng, Kec. Bojongsoang',
      updatedAt: new Date().toISOString(),
      current,
      usedForecastCurrent: !!fallbackCurrent,
      forecastRaw: raw.forecast,
      forecast3h: getThreeHourForecastToday(raw.forecast),
      daySummaries: getDaySummaries(raw.forecast, 2),
      peringatan: peringatanInfo,
      ispu: ispuInfo,
      extremeDetections: extremes,
      errors: raw.errors,
      source: 'BMKG',
          forecastSummary: processForecast(raw.forecast),
    });
  } catch (error) {
    console.error('BMKG route error', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch BMKG data' }, { status: 500 });
  }
}
