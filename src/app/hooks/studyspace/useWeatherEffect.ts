import { useEffect, useRef, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useGeolocation, GeolocationError } from "./useGeolocation";
import { getCurrentWeather, mapWeatherCodeToEffect, reverseGeocode } from "../../../services/weather.service";
import type { EffectType } from "../../components/StudySpace/panels/EffectsPanel";

export type WeatherSyncError = "location-denied" | "location-unavailable" | "fetch-failed" | null;

const REFRESH_INTERVAL_MS = 30 * 60 * 1000;

interface UseWeatherEffectParams {
  enabled: boolean;
  onResolve: (effect: EffectType) => void;
}

export function useWeatherEffect({ enabled, onResolve }: UseWeatherEffectParams) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<WeatherSyncError>(null);
  const [location, setLocation] = useState<string | null>(null);
  const { getPosition } = useGeolocation();
  const { i18n } = useTranslation();
  const isFetchingRef = useRef(false);
  const onResolveRef = useRef(onResolve);
  useEffect(() => { onResolveRef.current = onResolve; });

  const fetchCycle = useCallback(async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    setLoading(true);
    setError(null);
    try {
      const { lat, lon } = await getPosition();
      // Location display is best-effort — never block/fail the effect resolution on it
      reverseGeocode(lat, lon, i18n.language?.slice(0, 2) || "vi").then(setLocation);
      try {
        const weather = await getCurrentWeather(lat, lon);
        const effect = mapWeatherCodeToEffect(weather.weatherCode, weather.isDay);
        onResolveRef.current(effect);
        setError(null);
      } catch {
        setError("fetch-failed");
      }
    } catch (err) {
      if (err instanceof GeolocationError && err.type === "denied") setError("location-denied");
      else setError("location-unavailable");
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, [getPosition, i18n.language]);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      setError(null);
      setLocation(null);
      return;
    }
    fetchCycle();
    const id = setInterval(fetchCycle, REFRESH_INTERVAL_MS);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  return { loading, error, location };
}
