const BASE = process.env.TWC_BASE_URL!;
const KEY = process.env.TWC_API_KEY!;

function url(path: string, params: Record<string, string> = {}) {
  const q = new URLSearchParams({ ...params, format: "json", apiKey: KEY });
  return `${BASE}${path}?${q}`;
}

export interface CurrentObs {
  temperature: number | null;
  relativeHumidity: number | null;
  pressureAltimeter: number | null;
  pressureChange: number | null;
  windSpeed: number | null;
  uvIndex: number | null;
  wxPhraseLong: string | null;
  iconCode: number | null;
}

export interface DailyForecast {
  dayOfWeek: string[];
  temperatureMax: (number | null)[];
  temperatureMin: (number | null)[];
  precipChance: (number | null)[];
  narrative: (string | null)[];
  uvIndex: (number | null)[];
}

export interface BodyIndex {
  daypartName: (string | null)[];
  index: (number | null)[];
  category: (string | null)[];
}

export async function getCurrentObs(lat: number, lon: number): Promise<CurrentObs> {
  const res = await fetch(
    url("/v3/wx/observations/current", {
      geocode: `${lat},${lon}`,
      language: "en-US",
      units: "e",
    }),
    { next: { revalidate: 900 } }
  );
  if (!res.ok) throw new Error(`TWC current obs failed: ${res.status}`);
  const obs = await res.json();
  return {
    temperature: obs.temperature ?? null,
    relativeHumidity: obs.relativeHumidity ?? null,
    pressureAltimeter: obs.pressureAltimeter ?? null,
    pressureChange: obs.pressureChange ?? null,
    windSpeed: obs.windSpeed ?? null,
    uvIndex: obs.uvIndex ?? null,
    wxPhraseLong: obs.wxPhraseLong ?? null,
    iconCode: obs.iconCode ?? null,
  };
}

export async function getDailyForecast(lat: number, lon: number): Promise<DailyForecast> {
  const res = await fetch(
    url("/v3/wx/forecast/daily/7day", {
      geocode: `${lat},${lon}`,
      language: "en-US",
      units: "e",
    }),
    { next: { revalidate: 3600 } }
  );
  if (!res.ok) throw new Error(`TWC daily forecast failed: ${res.status}`);
  const data = await res.json();
  return {
    dayOfWeek: data.dayOfWeek ?? [],
    temperatureMax: data.temperatureMax ?? [],
    temperatureMin: data.temperatureMin ?? [],
    precipChance: data.daypart?.precipChance?.[0] ?? [],
    narrative: data.narrative ?? [],
    uvIndex: data.daypart?.uvIndex?.[0] ?? [],
  };
}

export async function getAchePainIndex(lat: number, lon: number): Promise<BodyIndex> {
  const res = await fetch(
    url("/v2/indices/achePain/daypart/7day", {
      geocode: `${lat},${lon}`,
      language: "en-US",
    }),
    { next: { revalidate: 3600 } }
  );
  if (!res.ok) throw new Error(`TWC achePain index failed: ${res.status}`);
  const data = await res.json();
  const idx = data.achesPainsIndex12hour ?? {};
  return {
    daypartName: idx.daypartName ?? [],
    index: idx.achesPainsIndex ?? [],
    category: idx.achesPainsCategory ?? [],
  };
}

export async function getBreathingIndex(lat: number, lon: number): Promise<BodyIndex> {
  const res = await fetch(
    url("/v2/indices/breathing/daypart/7day", {
      geocode: `${lat},${lon}`,
      language: "en-US",
    }),
    { next: { revalidate: 3600 } }
  );
  if (!res.ok) throw new Error(`TWC breathing index failed: ${res.status}`);
  const data = await res.json();
  const idx = data.breathingIndex12hour ?? {};
  return {
    daypartName: idx.daypartName ?? [],
    index: idx.breathingIndex ?? [],
    category: idx.breathingCategory ?? [],
  };
}

export async function getPollenIndex(lat: number, lon: number): Promise<BodyIndex> {
  const res = await fetch(
    url("/v2/indices/pollen/daypart/7day", {
      geocode: `${lat},${lon}`,
      language: "en-US",
    }),
    { next: { revalidate: 3600 } }
  );
  if (!res.ok) throw new Error(`TWC pollen index failed: ${res.status}`);
  const data = await res.json();
  const idx = data.pollenForecast12hour ?? {};
  const treeIdx = idx.treePollenIndex ?? [];
  const grassIdx = idx.grassPollenIndex ?? [];
  const treeCategory = idx.treePollenCategory ?? [];
  const grassCategory = idx.grassPollenCategory ?? [];
  return {
    daypartName: idx.daypartName ?? [],
    index: treeIdx.map((v: number, i: number) => Math.max(v ?? 0, grassIdx[i] ?? 0)),
    category: treeIdx.map((_: number, i: number) => {
      const cats = [treeCategory[i], grassCategory[i]].filter(Boolean);
      return worstCategory(cats);
    }),
  };
}

function worstCategory(cats: string[]): string {
  const order = ["Minimal", "Low", "Moderate", "High", "Very High", "Extremely High"];
  let best = "Minimal";
  for (const c of cats) {
    if (order.indexOf(c) > order.indexOf(best)) best = c;
  }
  return best;
}

export interface HourlyForecast {
  validTimeLocal: string[];
  temperature: (number | null)[];
  uvIndex: (number | null)[];
  precipChance: (number | null)[];
  wxPhraseLong: (string | null)[];
  iconCode: (number | null)[];
  relativeHumidity: (number | null)[];
}

export interface AirQuality {
  airQualityIndex: number | null;
  category: string | null;
  primaryPollutant: string | null;
}

export async function getHourlyForecast(lat: number, lon: number): Promise<HourlyForecast> {
  const res = await fetch(
    url("/v3/wx/forecast/hourly/24hour", {
      geocode: `${lat},${lon}`,
      language: "en-US",
      units: "e",
    }),
    { next: { revalidate: 1800 } }
  );
  if (!res.ok) throw new Error(`TWC hourly forecast failed: ${res.status}`);
  const data = await res.json();
  return {
    validTimeLocal: data.validTimeLocal ?? [],
    temperature: data.temperature ?? [],
    uvIndex: data.uvIndex ?? [],
    precipChance: data.precipChance ?? [],
    wxPhraseLong: data.wxPhraseLong ?? [],
    iconCode: data.iconCode ?? [],
    relativeHumidity: data.relativeHumidity ?? [],
  };
}

export async function getAirQuality(lat: number, lon: number): Promise<AirQuality> {
  const res = await fetch(
    url("/v3/wx/airquality", {
      geocode: `${lat},${lon}`,
      language: "en-US",
    }),
    { next: { revalidate: 3600 } }
  );
  if (!res.ok) throw new Error(`TWC air quality failed: ${res.status}`);
  const data = await res.json();
  const aq = data.globalAirQuality ?? data;
  return {
    airQualityIndex: aq.airQualityIndex ?? null,
    category: aq.airQualityCategory ?? aq.category ?? null,
    primaryPollutant: aq.dominantPollutant ?? aq.primaryPollutant ?? null,
  };
}

export interface LocationResult {
  city: string;
  adminDistrictCode: string;
  country: string;
  postalKey: string;
  latitude: number;
  longitude: number;
  displayName: string;
}

export async function searchLocation(query: string): Promise<LocationResult[]> {
  const res = await fetch(
    url("/v3/location/search", { query, language: "en-US" })
  );
  if (!res.ok) return [];
  const data = await res.json();
  const locs = data.location ?? {};
  const count = locs.city?.length ?? 0;
  return Array.from({ length: count }, (_, i) => ({
    city: locs.city?.[i] ?? "",
    adminDistrictCode: locs.adminDistrictCode?.[i] ?? "",
    country: locs.countryCode?.[i] ?? "",
    postalKey: locs.postalKey?.[i] ?? "",
    latitude: locs.latitude?.[i] ?? 0,
    longitude: locs.longitude?.[i] ?? 0,
    displayName: `${locs.city?.[i]}, ${locs.adminDistrictCode?.[i]}`,
  }));
}
