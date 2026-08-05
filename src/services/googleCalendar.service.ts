export interface GCalEvent {
  id: string;
  summary: string;
  start: string; // ISO datetime or date
  isAllDay: boolean;
  htmlLink?: string;
}

interface GCalApiEvent {
  id: string;
  summary?: string;
  htmlLink?: string;
  start?: { dateTime?: string; date?: string };
}

export async function fetchUpcomingEvents(accessToken: string, maxResults: number): Promise<GCalEvent[]> {
  const params = new URLSearchParams({
    timeMin: new Date().toISOString(),
    maxResults: String(maxResults),
    singleEvents: "true",
    orderBy: "startTime",
  });

  const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events?${params.toString()}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    const err = new Error(`Google Calendar request failed (${res.status})`);
    (err as any).status = res.status;
    throw err;
  }

  const data = await res.json();
  const items: GCalApiEvent[] = data.items ?? [];

  return items.map(item => ({
    id: item.id,
    summary: item.summary ?? "",
    start: item.start?.dateTime ?? item.start?.date ?? "",
    isAllDay: !item.start?.dateTime,
    htmlLink: item.htmlLink,
  }));
}
