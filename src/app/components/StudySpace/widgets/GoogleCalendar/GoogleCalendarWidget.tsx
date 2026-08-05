import { useCallback, useEffect, useRef, useState } from "react";
import { useGoogleLogin } from "@react-oauth/google";
import { CalendarDays, RefreshCw, ExternalLink } from "lucide-react";
import { useTranslation } from "react-i18next";
import { fetchUpcomingEvents, type GCalEvent } from "../../../../../services/googleCalendar.service";

const CALENDAR_SCOPE = "https://www.googleapis.com/auth/calendar.readonly";
const POLL_INTERVAL_MS = 5 * 60 * 1000;

type ErrorKind = "sessionExpired" | "loadError" | "connectionFailed";

interface GoogleCalendarWidgetProps {
  maxEvents: number;
  showAllDay: boolean;
}

function formatEventTime(iso: string, isAllDay: boolean) {
  if (!iso) return "";
  const d = new Date(iso);
  if (isAllDay) return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  return d.toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function GoogleCalendarWidget({ maxEvents, showAllDay }: GoogleCalendarWidgetProps) {
  const { t } = useTranslation();
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [events, setEvents]           = useState<GCalEvent[]>([]);
  const [loading, setLoading]         = useState(false);
  const [errorKind, setErrorKind]     = useState<ErrorKind | null>(null);
  const tokenExpiresAtRef = useRef<number | null>(null);

  const loadEvents = useCallback(async (token: string) => {
    setLoading(true);
    setErrorKind(null);
    try {
      const items = await fetchUpcomingEvents(token, maxEvents);
      setEvents(items);
    } catch (e: any) {
      if (e?.status === 401) {
        setAccessToken(null);
        setErrorKind("sessionExpired");
      } else {
        setErrorKind("loadError");
      }
    } finally {
      setLoading(false);
    }
  }, [maxEvents]);

  const login = useGoogleLogin({
    scope: CALENDAR_SCOPE,
    onSuccess: (tokenResponse) => {
      tokenExpiresAtRef.current = Date.now() + (tokenResponse.expires_in ?? 3600) * 1000;
      setAccessToken(tokenResponse.access_token);
      void loadEvents(tokenResponse.access_token);
    },
    onError: () => setErrorKind("connectionFailed"),
  });

  useEffect(() => {
    if (!accessToken) return;
    const id = setInterval(() => {
      if (tokenExpiresAtRef.current && Date.now() > tokenExpiresAtRef.current) {
        setAccessToken(null);
        return;
      }
      void loadEvents(accessToken);
    }, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [accessToken, loadEvents]);

  const visibleEvents = showAllDay ? events : events.filter(e => !e.isAllDay);

  return (
    <div style={{
      width: 210,
      padding: "12px 14px",
      borderRadius: 14,
      background: "rgba(12,18,22,0.72)",
      backdropFilter: "blur(18px)",
      WebkitBackdropFilter: "blur(18px)",
      border: "1px solid rgba(129,140,248,0.22)",
      boxShadow: "0 8px 28px rgba(0,0,0,0.4)",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.72rem", color: "rgba(255,255,255,0.55)", fontFamily: "'HarmonyOS Sans', sans-serif" }}>
          <CalendarDays size={13} color="#818cf8" /> {t("googleCalendar.label")}
        </div>
        {accessToken && (
          <button
            onClick={() => void loadEvents(accessToken)}
            onPointerDown={e => e.stopPropagation()}
            style={{ background: "none", border: "none", color: "rgba(255,255,255,0.35)", cursor: "pointer", display: "flex", opacity: loading ? 0.5 : 1 }}
            title={t("googleCalendar.refresh")}
          >
            <RefreshCw size={12} />
          </button>
        )}
      </div>

      {!accessToken ? (
        <button
          onClick={() => login()}
          onPointerDown={e => e.stopPropagation()}
          style={{
            width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            padding: "8px 0", borderRadius: 9,
            background: "rgba(129,140,248,0.14)", border: "1px solid rgba(129,140,248,0.4)",
            color: "#818cf8", fontSize: "0.76rem", fontFamily: "'HarmonyOS Sans', sans-serif", cursor: "pointer",
          }}
        >
          {t("googleCalendar.connect")}
        </button>
      ) : errorKind ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "center" }}>
          <span style={{ fontSize: "0.7rem", color: "rgba(248,113,113,0.85)", fontFamily: "'HarmonyOS Sans', sans-serif", textAlign: "center" }}>{t(`googleCalendar.${errorKind}`)}</span>
          <button
            onClick={() => login()}
            onPointerDown={e => e.stopPropagation()}
            style={{
              padding: "5px 12px", borderRadius: 8, background: "rgba(129,140,248,0.14)",
              border: "1px solid rgba(129,140,248,0.4)", color: "#818cf8",
              fontSize: "0.7rem", fontFamily: "'HarmonyOS Sans', sans-serif", cursor: "pointer",
            }}
          >
            {t("googleCalendar.reconnect")}
          </button>
        </div>
      ) : visibleEvents.length === 0 ? (
        <div style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.3)", fontFamily: "'HarmonyOS Sans', sans-serif", textAlign: "center", padding: "6px 0" }}>
          {loading ? t("googleCalendar.loading") : t("googleCalendar.noEvents")}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {visibleEvents.map(ev => (
            <a
              key={ev.id}
              href={ev.htmlLink}
              target="_blank"
              rel="noreferrer"
              onPointerDown={e => e.stopPropagation()}
              style={{
                display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6,
                padding: "6px 8px", borderRadius: 8,
                background: "rgba(255,255,255,0.04)", textDecoration: "none",
              }}
            >
              <div style={{ minWidth: 0 }}>
                <div style={{
                  fontSize: "0.74rem", color: "rgba(255,255,255,0.85)", fontFamily: "'HarmonyOS Sans', sans-serif",
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                }}>
                  {ev.summary || t("googleCalendar.noTitle")}
                </div>
                <div style={{ fontSize: "0.62rem", color: "rgba(129,140,248,0.75)", fontFamily: "'HarmonyOS Sans', sans-serif" }}>
                  {formatEventTime(ev.start, ev.isAllDay)}
                </div>
              </div>
              <ExternalLink size={10} color="rgba(255,255,255,0.25)" style={{ flexShrink: 0 }} />
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
