import { useEffect, useState } from "react";
import { getZonedTimeParts, getUtcOffsetLabel } from "../../utils/timezone";

interface WorldClockWidgetProps {
  label: string;
  timezone: string;
}

export function WorldClockWidget({ label, timezone }: WorldClockWidgetProps) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const parts = getZonedTimeParts(now, timezone);
  const offset = getUtcOffsetLabel(timezone, now);

  return (
    <div
      style={{
        width: 170,
        padding: "12px 14px",
        borderRadius: 14,
        background: "rgba(12,18,22,0.72)",
        backdropFilter: "blur(18px)",
        WebkitBackdropFilter: "blur(18px)",
        border: "1px solid rgba(129,140,248,0.22)",
        boxShadow: "0 8px 28px rgba(0,0,0,0.4)",
        userSelect: "none",
      }}
    >
      <div style={{
        fontSize: "0.68rem", color: "rgba(255,255,255,0.5)",
        fontFamily: "'HarmonyOS Sans', sans-serif", letterSpacing: "0.04em",
        display: "flex", justifyContent: "space-between", marginBottom: 4,
      }}>
        <span>{label}</span>
        <span style={{ color: "rgba(129,140,248,0.75)" }}>{offset}</span>
      </div>
      <div style={{
        fontSize: "1.5rem", fontWeight: 600, color: "rgba(255,255,255,0.92)",
        fontFamily: "'HarmonyOS Sans', sans-serif", letterSpacing: "0.02em", lineHeight: 1.1,
      }}>
        {parts.hour}:{parts.minute}<span style={{ fontSize: "0.9rem", color: "rgba(255,255,255,0.4)" }}>:{parts.second}</span>
      </div>
      <div style={{
        fontSize: "0.66rem", color: "rgba(255,255,255,0.35)",
        fontFamily: "'HarmonyOS Sans', sans-serif", marginTop: 2,
      }}>
        {parts.weekday}, {parts.day} {parts.month}
      </div>
    </div>
  );
}
