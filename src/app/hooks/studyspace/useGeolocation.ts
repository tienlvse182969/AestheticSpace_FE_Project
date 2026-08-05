import { useCallback } from "react";

export type GeolocationErrorType = "denied" | "unavailable" | "unsupported";

export class GeolocationError extends Error {
  type: GeolocationErrorType;
  constructor(type: GeolocationErrorType) {
    super(`Geolocation error: ${type}`);
    this.type = type;
  }
}

const POSITION_OPTIONS: PositionOptions = {
  enableHighAccuracy: false,
  timeout: 10000,
  maximumAge: 5 * 60 * 1000,
};

export function useGeolocation() {
  const getPosition = useCallback((): Promise<{ lat: number; lon: number }> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new GeolocationError("unsupported"));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        pos => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
        err => {
          if (err.code === err.PERMISSION_DENIED) reject(new GeolocationError("denied"));
          else reject(new GeolocationError("unavailable"));
        },
        POSITION_OPTIONS,
      );
    });
  }, []);

  return { getPosition };
}
