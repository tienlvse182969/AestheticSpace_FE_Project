import { useEffect, useRef, useState } from "react";
import { Droplet, Eye } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNotificationBanners } from "../../../../context/NotificationBannerContext";

interface ReminderTabProps {
  waterEnabled: boolean;
  waterIntervalMin: number;
  eyeRestEnabled: boolean;
  eyeRestIntervalMin: number;
  onWaterEnabled: (v: boolean) => void;
  onWaterIntervalMin: (v: number) => void;
  onEyeRestEnabled: (v: boolean) => void;
  onEyeRestIntervalMin: (v: number) => void;
}

function useReminderCountdown(enabled: boolean, intervalMin: number, onFire: () => void) {
  const [secondsLeft, setSecondsLeft] = useState(intervalMin * 60);

  useEffect(() => { setSecondsLeft(intervalMin * 60); }, [intervalMin, enabled]);

  useEffect(() => {
    if (!enabled) return;
    const tick = setInterval(() => {
      setSecondsLeft(s => {
        if (s > 1) return s - 1;
        onFire();
        return intervalMin * 60;
      });
    }, 1000);
    return () => clearInterval(tick);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, intervalMin]);

  return secondsLeft;
}

function formatMMSS(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function ReminderTab({
  waterEnabled, waterIntervalMin, eyeRestEnabled, eyeRestIntervalMin,
  onWaterEnabled, onWaterIntervalMin, onEyeRestEnabled, onEyeRestIntervalMin,
}: ReminderTabProps) {
  const { t } = useTranslation();
  const { pushBanner, addHistoryItem } = useNotificationBanners();
  const idRef = useRef(0);

  const fireWater = () => {
    const id = `wellness-water-${Date.now()}-${idRef.current++}`;
    const title = t("wellness.water");
    const message = t("wellness.waterReminderMessage");
    pushBanner({
      id,
      content: (
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.82rem", color: "rgba(255,255,255,0.9)" }}>
          <Droplet size={16} color="#60a5fa" /> {message}
        </div>
      ),
    });
    addHistoryItem({ id, title, message, kind: "notification", createdAt: new Date().toISOString() });
  };

  const fireEyeRest = () => {
    const id = `wellness-eye-${Date.now()}-${idRef.current++}`;
    const title = t("wellness.eyeRest");
    const message = t("wellness.eyeRestReminderMessage");
    pushBanner({
      id,
      content: (
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.82rem", color: "rgba(255,255,255,0.9)" }}>
          <Eye size={16} color="#67e8f9" /> {message}
        </div>
      ),
    });
    addHistoryItem({ id, title, message, kind: "notification", createdAt: new Date().toISOString() });
  };

  const waterLeft = useReminderCountdown(waterEnabled, waterIntervalMin, fireWater);
  const eyeLeft   = useReminderCountdown(eyeRestEnabled, eyeRestIntervalMin, fireEyeRest);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: "4px 0" }}>
      <ReminderRow
        icon={<Droplet size={14} color="#60a5fa" />}
        label={t("wellness.water")}
        enabled={waterEnabled}
        intervalMin={waterIntervalMin}
        secondsLeft={waterLeft}
        onToggle={onWaterEnabled}
        onIntervalChange={onWaterIntervalMin}
        color="#60a5fa"
      />
      <ReminderRow
        icon={<Eye size={14} color="#67e8f9" />}
        label={t("wellness.eyeRest")}
        enabled={eyeRestEnabled}
        intervalMin={eyeRestIntervalMin}
        secondsLeft={eyeLeft}
        onToggle={onEyeRestEnabled}
        onIntervalChange={onEyeRestIntervalMin}
        color="#67e8f9"
      />
    </div>
  );
}

function ReminderRow({ icon, label, enabled, intervalMin, secondsLeft, onToggle, onIntervalChange, color }: {
  icon: React.ReactNode; label: string; enabled: boolean; intervalMin: number; secondsLeft: number;
  onToggle: (v: boolean) => void; onIntervalChange: (v: number) => void; color: string;
}) {
  return (
    <div style={{
      padding: "8px 10px", borderRadius: 10, boxSizing: "border-box", width: "100%",
      background: enabled ? `${color}14` : "rgba(255,255,255,0.04)",
      border: enabled ? `1px solid ${color}35` : "1px solid rgba(255,255,255,0.08)",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: enabled ? 6 : 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {icon}
          <span style={{ fontSize: "0.76rem", color: "rgba(255,255,255,0.8)", fontFamily: "'HarmonyOS Sans', sans-serif" }}>{label}</span>
        </div>
        <button
          onClick={() => onToggle(!enabled)}
          style={{
            width: 32, height: 17, borderRadius: 9, border: "none", cursor: "pointer",
            background: enabled ? `${color}55` : "rgba(255,255,255,0.1)", padding: 2, display: "flex", alignItems: "center",
          }}
        >
          <div style={{
            width: 13, height: 13, borderRadius: "50%",
            background: enabled ? color : "rgba(255,255,255,0.38)",
            transform: enabled ? "translateX(15px)" : "translateX(0)",
            transition: "transform 0.2s",
          }} />
        </button>
      </div>
      {enabled && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
          <input
            type="range" min={5} max={90} step={5} value={intervalMin}
            onChange={e => onIntervalChange(Number(e.target.value))}
            onPointerDown={e => e.stopPropagation()}
            style={{ flex: 1, minWidth: 0 }}
          />
          <span style={{ fontSize: "0.64rem", color: "rgba(255,255,255,0.4)", fontFamily: "'HarmonyOS Sans', sans-serif", whiteSpace: "nowrap", flexShrink: 0 }}>
            {intervalMin}p · {formatMMSS(secondsLeft)}
          </span>
        </div>
      )}
    </div>
  );
}
