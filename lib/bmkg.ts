// lib/bmkg.ts

const FORECAST_URL = 'https://api.bmkg.go.id/publik/prakiraan-cuaca?adm4=32.04.08.2002';
const PERINGATAN_URL = 'https://api.bmkg.go.id/publik/peringatan-dini-cuaca?adm1=32';
const PERINGATAN_XML_FALLBACK = 'https://data.bmkg.go.id/DataMKG/MEWS/CAP/WERAID_32.xml';
const ISPU_URL = 'https://api.bmkg.go.id/publik/ispu?adm2=32.04';
const ISPU_FALLBACK = 'https://data.bmkg.go.id/DataMKG/MEWS/ISPU/ispu_jabar.json';

import fs from 'fs/promises';
import path from 'path';

async function fetchJson(url: string) {
  const res = await fetch(url, { cache: 'no-store' } as RequestInit);
  if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
  return res.json();
}

async function fetchText(url: string) {
  const res = await fetch(url, { cache: 'no-store' } as RequestInit);
  if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
  return res.text();
}

export async function fetchBMKGAll() {
  const result: any = {
    forecast: null,
    peringatan: null,
    ispu: null,
    errors: [],
  };

  // Forecast
  try {
    result.forecast = await fetchJson(FORECAST_URL);
  } catch (err) {
    result.errors.push({ source: 'forecast', message: String(err) });
  }

  // Peringatan dini (try JSON endpoint, fallback to XML)
  try {
    result.peringatan = await fetchJson(PERINGATAN_URL);
  } catch (err) {
    try {
      const xml = await fetchText(PERINGATAN_XML_FALLBACK);
      // dynamic import of fast-xml-parser so build won't fail if dependency missing
      let parsed: any = { rawXml: xml };
      try {
        // Use indirect dynamic import to avoid bundler static resolution (Turbopack)
        // The bundler won't analyze the string inside Function, preventing a build-time error
        const importer = new Function('return import("fast-xml-parser")');
        const mod = await importer();
        const parse = (mod && (mod.parse ?? mod.default?.parse)) as any;
        if (typeof parse === 'function') {
          parsed = parse(xml, { ignoreAttributes: false, attributeNamePrefix: '@_' });
        }
      } catch (dynErr) {
        // parser not available or dynamic import failed — keep raw XML under parsed.rawXml
      }

      result.peringatan = { fromXml: true, parsed };
    } catch (err2) {
      result.errors.push({ source: 'peringatan', message: String(err2) });
    }
  }

  // ISPU
  try {
    result.ispu = await fetchJson(ISPU_URL);
  } catch (err) {
    try {
      result.ispu = await fetchJson(ISPU_FALLBACK);
    } catch (err2) {
      result.errors.push({ source: 'ispu', message: String(err2) });
    }
  }

  // try local mock if external sources failed
  return tryLocalMock(result);
}

// If no external data available, try local mock in public/mock/bmkg-sample.json
async function tryLocalMock(result: any) {
  try {
    const mockPath = path.join(process.cwd(), 'public', 'mock', 'bmkg-sample.json');
    const content = await fs.readFile(mockPath, 'utf-8');
    const parsed = JSON.parse(content);
    
    // Fill in missing parts from mock if they failed
    if (!result.forecast && parsed.forecast) {
      result.forecast = parsed.forecast;
      result.mockedForecast = true;
    }
    
    if (!result.peringatan && parsed.peringatan) {
      result.peringatan = parsed.peringatan;
      result.mockedPeringatan = true;
    }
    
    if (!result.ispu && parsed.ispu) {
      result.ispu = parsed.ispu;
      result.mockedIspu = true;
    }

    if (result.mockedForecast || result.mockedPeringatan || result.mockedIspu) {
      result.mock = true;
      result.errors.push({ source: 'mock', message: 'Some data provided by local mock sources' });
    }
  } catch (e) {
    // ignore if mock missing
  }

  return result;
}

export function normalizeCurrentFromForecast(raw: any) {
  // Best-effort extraction from different possible BMKG formats.
  const out: any = {
    weather_desc: null,
    t: null,
    hu: null,
    ws: null,
    wd: null,
    wd_to: null,
    local_datetime: null,
  };

  // common shapes
  if (!raw) return out;

  // Try: raw?.data?.current
  let c = raw?.data?.current ?? raw?.current ?? raw?.cuaca ?? raw;

  // BMKG public forecast uses structure: raw.data[0].cuaca -> array of arrays of entries
  if (!c || (typeof c === 'object' && Object.keys(c).length === 0)) {
    try {
      if (Array.isArray(raw?.data) && raw.data.length > 0) {
        const firstBlock = raw.data[0];
        const cuaca = firstBlock?.cuaca;
        if (Array.isArray(cuaca)) {
          // flatten first inner array to get first entry
          let firstEntry: any = null;
          for (const group of cuaca) {
            if (Array.isArray(group) && group.length > 0) {
              firstEntry = group[0];
              break;
            }
            if (group && typeof group === 'object') {
              firstEntry = group;
              break;
            }
          }

          if (firstEntry) {
            c = firstEntry;
          }
        }
      }
    } catch (e) {
      // ignore
    }
  }

  if (c) {
    out.weather_desc = c.weather_desc ?? c.keterangan ?? c.description ?? c.nama ?? null;
    out.t = toNumber(c.t ?? c.temperature ?? c.suhu);
    out.hu = toNumber(c.hu ?? c.humidity ?? c.kelembapan);
    out.ws = toNumber(c.ws ?? c.wind_speed ?? c.kecepatan_angin);
    out.wd = c.wd ?? c.wind_direction ?? null;
    out.wd_to = c.wd_to ?? c.wind_to ?? null;
    out.local_datetime = c.local_datetime ?? c.waktu ?? c.datetime ?? null;
  }

  return out;
}

function toNumber(v: any): number | null {
  if (v === null || v === undefined) return null;
  const n = Number(String(v).replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

export function detectExtremes(current: ReturnType<typeof normalizeCurrentFromForecast>) {
  const detections: Array<{ code: string; label: string; advice: string }> = [];
  if (!current) return detections;

  const t = current.t;
  const hu = current.hu;
  const ws = current.ws;
  const desc = (current.weather_desc || '').toLowerCase();

  if (typeof t === 'number') {
    if (t > 38) detections.push({ code: 'heatwave', label: '🔥 Gelombang Panas', advice: 'Perbanyak minum air dan hindari aktivitas luar siang hari.' });
    if (t < 16) detections.push({ code: 'cold', label: '🧊 Suhu Dingin Ekstrem', advice: 'Kenakan pakaian hangat dan batasi aktivitas luar.' });
  }

  if (typeof ws === 'number') {
    if (ws > 45) detections.push({ code: 'strong_wind', label: '🌪️ Angin Kencang', advice: 'Amankan benda ringan di luar rumah.' });
  }

  if (typeof hu === 'number') {
    if (hu > 95) detections.push({ code: 'fog', label: '🌫️ Potensi Kabut Tebal', advice: 'Waspada jarak pandang rendah terutama pagi hari.' });
  }

  if (desc.includes('hujan lebat')) detections.push({ code: 'heavy_rain', label: '🌧️ Hujan Lebat', advice: 'Waspada banjir dan pohon tumbang.' });
  if (desc.includes('hujan badai') || desc.includes('badai')) detections.push({ code: 'storm', label: '⛈️ Badai', advice: 'Tidak keluar rumah dan jauhi pohon & tiang listrik.' });
  if (desc.includes('hujan lokal')) detections.push({ code: 'local_shower', label: '🌦️ Hujan Lokal Tiba-tiba', advice: 'Bawa payung atau jas hujan.' });

  // combination rule
  if (desc.includes('hujan lebat') && typeof ws === 'number' && ws > 40) {
    detections.push({ code: 'high_alert', label: '🚨 WASPADA TINGGI', advice: 'Siagakan perlengkapan darurat dan pantau kondisi sungai.' });
  }

  return detections;
}

export function ispuCategory(value: number | null) {
  if (value === null) return { category: 'Tidak tersedia', emoji: 'ℹ️', advice: 'Data ISPU tidak tersedia' };
  if (value <= 50) return { category: 'Baik', emoji: '🟢', advice: 'Udara bersih, aktivitas aman di luar ruangan' };
  if (value <= 100) return { category: 'Sedang', emoji: '🟡', advice: 'Kelompok sensitif sebaiknya kurangi aktivitas luar' };
  if (value <= 199) return { category: 'Tidak Sehat', emoji: '🟠', advice: 'Gunakan masker, batasi aktivitas luar ruangan' };
  if (value <= 299) return { category: 'Sangat Tidak Sehat', emoji: '🔴', advice: 'Hindari aktivitas luar, tutup jendela' };
  return { category: 'Berbahaya', emoji: '⛔', advice: 'DARURAT — Tetap di dalam, gunakan N95, hubungi pihak berwenang' };
}

export default {} as any;

export function processForecast(forecast: any) {
  // returns { threeHourToday: [], daySummaries: { [date]: { morning, afternoon, night } } }
  if (!forecast) return { threeHourToday: [], daySummaries: {} };

  // flatten forecast entries
  const entries: any[] = [];
  try {
    if (Array.isArray(forecast?.data) && forecast.data.length > 0) {
      for (const block of forecast.data) {
        const cuaca = block?.cuaca;
        if (Array.isArray(cuaca)) {
          for (const group of cuaca) {
            if (Array.isArray(group)) {
              for (const e of group) entries.push(e);
            } else if (group && typeof group === 'object') {
              entries.push(group);
            }
          }
        }
      }
    }
  } catch (e) {
    // ignore
  }

  // convert local_datetime to Date objects (prefer local_datetime, fallback utc_datetime/datetime)
  const parsed = entries
    .map((e) => {
      const dt = e.local_datetime ?? e.utc_datetime ?? e.datetime ?? null;
      const dateObj = dt ? new Date(String(dt).replace(' ', 'T')) : null;
      return { raw: e, dateObj };
    })
    .filter((x): x is { raw: any; dateObj: Date } => x.dateObj instanceof Date && !isNaN(x.dateObj.getTime()))
    .sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());

  if (parsed.length === 0) return { threeHourToday: [], daySummaries: {} };

  const firstDate = parsed[0].dateObj;
  const localDateStr = (d: Date) => d.toISOString().slice(0, 10);
  const todayKey = localDateStr(parsed[0].dateObj);

  // three-hour entries for today
  const threeHourToday = parsed.filter((p) => localDateStr(p.dateObj) === todayKey).map((p) => p.raw);

  // build summaries for next 2 days (+1, +2)
  const daySummaries: Record<string, any> = {};
  const groupsByDate: Record<string, any[]> = {};
  for (const p of parsed) {
    const key = localDateStr(p.dateObj);
    groupsByDate[key] = groupsByDate[key] || [];
    groupsByDate[key].push(p.raw);
  }

  const getPeriod = (d: Date) => {
    const h = d.getHours();
    if (h >= 6 && h < 12) return 'morning';
    if (h >= 12 && h < 18) return 'afternoon';
    return 'night';
  };

  const dateKeys = Object.keys(groupsByDate).sort();
  for (const key of dateKeys) {
    if (key === todayKey) continue;
    // limit to next 2 days
    const dayIndex = (new Date(key).getTime() - new Date(todayKey).getTime()) / (24 * 3600 * 1000);
    if (dayIndex < 1 || dayIndex > 2) continue;

    const entriesForDay = groupsByDate[key];
    const periods: any = { morning: null, afternoon: null, night: null };
    // for each period, choose most frequent weather_desc and average t
    const byPeriod: Record<string, any[]> = { morning: [], afternoon: [], night: [] };
    for (const e of entriesForDay) {
      const dt = e.local_datetime ?? e.utc_datetime ?? e.datetime;
      const dobj = dt ? new Date(String(dt).replace(' ', 'T')) : null;
      const period = dobj ? getPeriod(dobj) : 'night';
      byPeriod[period].push(e);
    }

    for (const period of ['morning', 'afternoon', 'night']) {
      const list = byPeriod[period];
      if (!list || list.length === 0) continue;
      // most frequent weather_desc
      const freq: Record<string, number> = {};
      let tSum = 0;
      for (const it of list) {
        const wd = it.weather_desc ?? it.weather_desc_en ?? '—';
        freq[wd] = (freq[wd] || 0) + 1;
        if (typeof it.t === 'number') tSum += it.t;
      }
      const most = Object.keys(freq).sort((a, b) => freq[b] - freq[a])[0];
      periods[period] = {
        summary: most,
        avgTemp: list.length ? Math.round((tSum / list.length) * 10) / 10 : null,
      };
    }

    daySummaries[key] = periods;
  }

  return { threeHourToday, daySummaries };
}

// --- Forecast processing helpers ---
function parseLocalDatetime(s: string | null) {
  if (!s) return null;
  // BMKG local_datetime may be 'YYYY-MM-DD HH:mm:SS' — convert to ISO-like 'YYYY-MM-DDTHH:mm:SS'
  try {
    const t = s.includes('T') ? s : s.replace(' ', 'T');
    const d = new Date(t);
    if (isNaN(d.getTime())) return null;
    return d;
  } catch (e) {
    return null;
  }
}

export function getThreeHourForecastToday(forecast: any) {
  if (!forecast) return [];
  const entries: any[] = [];
  try {
    const blocks = forecast?.data ?? [];
    for (const block of blocks) {
      const cuaca = block?.cuaca;
      if (!Array.isArray(cuaca)) continue;
      for (const group of cuaca) {
        if (!Array.isArray(group)) continue;
        for (const e of group) {
          const dt = parseLocalDatetime(e.local_datetime ?? e.utc_datetime ?? e.datetime);
          if (!dt) continue;
          entries.push({ ...e, _date: dt });
        }
      }
    }
    // filter for today (local date)
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const todayEntries = entries.filter((it) => {
      const d = it._date;
      if (!d) return false;
      const ymd = d.toISOString().split('T')[0];
      return ymd === todayStr;
    });
    // sort by datetime
    todayEntries.sort((a, b) => a._date.getTime() - b._date.getTime());
    return todayEntries.map((it) => ({ datetime: it.local_datetime ?? it.utc_datetime ?? it.datetime, t: it.t, hu: it.hu, ws: it.ws, weather_desc: it.weather_desc }));
  } catch (e) {
    return [];
  }
}

function summarizeGroup(items: any[]) {
  if (!items || items.length === 0) return null;
  // choose worst weather by precedence: Badai > Hujan Lebat > Hujan Ringan > Berawan > Cerah
  const priority = ['hujan badai', 'hujan lebat', 'hujan', 'hujan ringan', 'badai', 'cerah berawan', 'berawan', 'cerah'];
  const descs = items.map((i) => (String(i.weather_desc || '').toLowerCase()));
  let chosen = items[0];
  for (const p of priority) {
    for (const d of descs) {
      if (d.includes(p)) {
        const idx = descs.indexOf(d);
        chosen = items[idx];
        break;
      }
    }
    if (chosen && String(chosen.weather_desc || '').toLowerCase().includes(p)) break;
  }
  // average temperature
  const temps = items.map((i) => Number(i.t)).filter((n) => !Number.isNaN(n));
  const avgT = temps.length ? Math.round((temps.reduce((a, b) => a + b, 0) / temps.length) * 10) / 10 : null;
  return { weather_desc: chosen.weather_desc, t: avgT };
}

export function getDaySummaries(forecast: any, days = 2) {
  if (!forecast) return [];
  const entries: any[] = [];
  try {
    const blocks = forecast?.data ?? [];
    for (const block of blocks) {
      const cuaca = block?.cuaca;
      if (!Array.isArray(cuaca)) continue;
      for (const group of cuaca) {
        if (!Array.isArray(group)) continue;
        for (const e of group) {
          const dt = parseLocalDatetime(e.local_datetime ?? e.utc_datetime ?? e.datetime);
          if (!dt) continue;
          entries.push({ ...e, _date: dt });
        }
      }
    }
    // group by date
    const now = new Date();
    const results: any[] = [];
    for (let i = 1; i <= days; i++) {
      const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
      const ymd = day.toISOString().split('T')[0];
      const dayItems = entries.filter((it) => it._date.toISOString().split('T')[0] === ymd);
      // morning 06-12, day 12-18, night 18-24
      const morning = dayItems.filter((it) => { const h = it._date.getHours(); return h >= 6 && h < 12; });
      const dayPart = dayItems.filter((it) => { const h = it._date.getHours(); return h >= 12 && h < 18; });
      const night = dayItems.filter((it) => { const h = it._date.getHours(); return h >= 18 && h < 24; });
      results.push({
        date: ymd,
        morning: summarizeGroup(morning),
        day: summarizeGroup(dayPart),
        night: summarizeGroup(night),
      });
    }
    return results;
  } catch (e) {
    return [];
  }
}
