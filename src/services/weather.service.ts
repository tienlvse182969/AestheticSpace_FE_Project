import type { EffectType } from "../app/components/StudySpace/panels/EffectsPanel";

const OPENWEATHER_BASE_URL = "https://api.openweathermap.org/data/2.5/weather";
const REVERSE_GEOCODE_BASE_URL = "https://api.bigdatacloud.net/data/reverse-geocode-client";

const OPENWEATHER_API_KEY =
  (import.meta as ImportMeta & { env?: { VITE_OPENWEATHER_API_KEY?: string } }).env
    ?.VITE_OPENWEATHER_API_KEY ?? "";

export interface WeatherSnapshot {
  weatherCode: number;
  isDay: boolean;
  temperature: number;
}

export async function getCurrentWeather(lat: number, lon: number): Promise<WeatherSnapshot> {
  const res = await fetch(
    `${OPENWEATHER_BASE_URL}?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API_KEY}&units=metric`,
  );
  if (!res.ok) throw new Error(`${res.status}`);
  const data = await res.json();
  const condition = data.weather[0];
  return {
    weatherCode: condition.id as number,
    isDay: (condition.icon as string).endsWith("d"),
    temperature: data.main.temp as number,
  };
}

/** Best-effort reverse geocoding (free, no key — BigDataCloud's client-side endpoint). Returns null on failure. */
export async function reverseGeocode(lat: number, lon: number, lang = "vi"): Promise<string | null> {
  try {
    const res = await fetch(
      `${REVERSE_GEOCODE_BASE_URL}?latitude=${lat}&longitude=${lon}&localityLanguage=${lang}`,
    );
    if (!res.ok) return null;
    const data = await res.json();
    const place = data.city || data.locality || data.principalSubdivision;
    if (!place) return null;
    return data.countryName ? `${place}, ${data.countryName}` : place;
  } catch {
    return null;
  }
}

/** Maps an OpenWeatherMap condition code (weather[0].id) + day/night flag to one of the existing effects. */
export function mapWeatherCodeToEffect(code: number, isDay: boolean): EffectType {
  if (code === 800 || code === 801) return isDay ? null : "stars";
  if (code >= 802 && code <= 804) return "fog";
  if (code >= 701 && code <= 762) return "fog";
  if (code === 771 || code === 781) return "lightning";
  if (code >= 300 && code <= 321) return "rain";
  if (code >= 500 && code <= 531) return "rain";
  if (code >= 600 && code <= 622) return "snow";
  if (code >= 200 && code <= 232) return "lightning";
  console.warn(`[weather.service] Unmapped OpenWeatherMap condition code: ${code}`);
  return null;
}
