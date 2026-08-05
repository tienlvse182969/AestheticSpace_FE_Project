import { useEffect, useRef, useState } from "react";
import { intervalToDuration, isPast } from "date-fns";
import { useTranslation } from "react-i18next";
import { useNotificationBanners } from "../../../../context/NotificationBannerContext";

interface DeadlineWidgetProps {
  id: string;
  title: string;
  targetAt: string;
  color?: string;
}

function formatRemaining(targetAt: string, now: Date) {
  const target = new Date(targetAt);
  if (isPast(target)) return null;
  const d = intervalToDuration({ start: now, end: target });
  return d;
}

export function DeadlineWidget({ id, title, targetAt, color = "#f87171" }: DeadlineWidgetProps) {
  const { t } = useTranslation();
  const [now, setNow] = useState(() => new Date());
  const { pushBanner, addHistoryItem } = useNotificationBanners();
  const firedRef = useRef(false);

  useEffect(() => {
    const tick = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(tick);
  }, []);

  const remaining = formatRemaining(targetAt, now);
  const overdue = !remaining;

  useEffect(() => {
    if (overdue && !firedRef.current) {
      firedRef.current = true;
      const bannerId = `deadline-due-${id}`;
      const message = t("deadline.dueMessage", { title });
      pushBanner({
        id: bannerId,
        content: (
          <div style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.9)" }}>
            {message}
          </div>
        ),
      });
      addHistoryItem({ id: bannerId, title, message, kind: "notification", createdAt: new Date().toISOString() });
    }
  }, [overdue, id, title, pushBanner, addHistoryItem, t]);

  return (
    <div style={{
      width: 176,
      padding: "12px 14px",
      borderRadius: 14,
      background: "rgba(12,18,22,0.72)",
      backdropFilter: "blur(18px)",
      WebkitBackdropFilter: "blur(18px)",
      border: `1px solid ${color}38`,
      boxShadow: "0 8px 28px rgba(0,0,0,0.4)",
      userSelect: "none",
    }}>
      <div style={{
        fontSize: "0.78rem", fontWeight: 600, color: "rgba(255,255,255,0.9)",
        fontFamily: "'HarmonyOS Sans', sans-serif", marginBottom: 6,
        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
      }}>
        {title}
      </div>
      {overdue ? (
        <div style={{ fontSize: "0.88rem", fontWeight: 700, color, fontFamily: "'HarmonyOS Sans', sans-serif" }}>
          {t("deadline.overdue")}
        </div>
      ) : (
        <div style={{ display: "flex", gap: 8 }}>
          {[
            { v: remaining!.days ?? 0, l: t("deadline.days") },
            { v: remaining!.hours ?? 0, l: t("deadline.hours") },
            { v: remaining!.minutes ?? 0, l: t("deadline.minutes") },
          ].map(seg => (
            <div key={seg.l} style={{ textAlign: "center" }}>
              <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "rgba(255,255,255,0.92)", fontFamily: "'HarmonyOS Sans', sans-serif" }}>
                {seg.v}
              </div>
              <div style={{ fontSize: "0.6rem", color: "rgba(255,255,255,0.35)", fontFamily: "'HarmonyOS Sans', sans-serif" }}>
                {seg.l}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
