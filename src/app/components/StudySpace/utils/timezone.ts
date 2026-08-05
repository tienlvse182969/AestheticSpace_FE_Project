export interface WorldClockCity {
  label: string;
  timezone: string;
}

export const WORLD_CLOCK_CITIES: WorldClockCity[] = [
  { label: "New York",     timezone: "America/New_York" },
  { label: "Los Angeles",  timezone: "America/Los_Angeles" },
  { label: "Chicago",      timezone: "America/Chicago" },
  { label: "Toronto",      timezone: "America/Toronto" },
  { label: "Mexico City",  timezone: "America/Mexico_City" },
  { label: "Sao Paulo",    timezone: "America/Sao_Paulo" },
  { label: "London",       timezone: "Europe/London" },
  { label: "Paris",        timezone: "Europe/Paris" },
  { label: "Berlin",       timezone: "Europe/Berlin" },
  { label: "Madrid",       timezone: "Europe/Madrid" },
  { label: "Rome",         timezone: "Europe/Rome" },
  { label: "Moscow",       timezone: "Europe/Moscow" },
  { label: "Istanbul",     timezone: "Europe/Istanbul" },
  { label: "Dubai",        timezone: "Asia/Dubai" },
  { label: "Mumbai",       timezone: "Asia/Kolkata" },
  { label: "Bangkok",      timezone: "Asia/Bangkok" },
  { label: "Ho Chi Minh",  timezone: "Asia/Ho_Chi_Minh" },
  { label: "Hanoi",        timezone: "Asia/Bangkok" },
  { label: "Singapore",    timezone: "Asia/Singapore" },
  { label: "Hong Kong",    timezone: "Asia/Hong_Kong" },
  { label: "Shanghai",     timezone: "Asia/Shanghai" },
  { label: "Taipei",       timezone: "Asia/Taipei" },
  { label: "Seoul",        timezone: "Asia/Seoul" },
  { label: "Tokyo",        timezone: "Asia/Tokyo" },
  { label: "Manila",       timezone: "Asia/Manila" },
  { label: "Jakarta",      timezone: "Asia/Jakarta" },
  { label: "Sydney",       timezone: "Australia/Sydney" },
  { label: "Melbourne",    timezone: "Australia/Melbourne" },
  { label: "Auckland",     timezone: "Pacific/Auckland" },
  { label: "Cairo",        timezone: "Africa/Cairo" },
  { label: "Johannesburg", timezone: "Africa/Johannesburg" },
  { label: "Honolulu",     timezone: "Pacific/Honolulu" },
];

export const DEFAULT_WORLD_CLOCK_CITY = WORLD_CLOCK_CITIES[0];

export function getZonedTimeParts(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    weekday: "short",
    day: "2-digit",
    month: "short",
  }).formatToParts(date);

  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find(p => p.type === type)?.value ?? "";

  return {
    hour: get("hour"),
    minute: get("minute"),
    second: get("second"),
    weekday: get("weekday"),
    day: get("day"),
    month: get("month"),
  };
}

export function getUtcOffsetLabel(timeZone: string, date: Date = new Date()): string {
  const dtf = new Intl.DateTimeFormat("en-US", { timeZone, timeZoneName: "shortOffset" });
  const part = dtf.formatToParts(date).find(p => p.type === "timeZoneName");
  return part?.value?.replace("GMT", "UTC") ?? "";
}
