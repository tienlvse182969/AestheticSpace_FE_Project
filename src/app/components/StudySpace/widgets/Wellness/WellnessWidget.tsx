import { Wind, Bell } from "lucide-react";
import { useTranslation } from "react-i18next";
import { BreathingCircle } from "./BreathingCircle";
import { ReminderTab } from "./ReminderTab";
import type { BreathingPattern, WellnessTab } from "../../../../hooks/studyspace/useWellnessSettings";

interface WellnessWidgetProps {
  activeTab: WellnessTab;
  onActiveTab: (t: WellnessTab) => void;
  pattern: BreathingPattern;
  cycleCount: number;
  waterEnabled: boolean;
  waterIntervalMin: number;
  eyeRestEnabled: boolean;
  eyeRestIntervalMin: number;
  onWaterEnabled: (v: boolean) => void;
  onWaterIntervalMin: (v: number) => void;
  onEyeRestEnabled: (v: boolean) => void;
  onEyeRestIntervalMin: (v: number) => void;
}

export function WellnessWidget({
  activeTab, onActiveTab, pattern, cycleCount,
  waterEnabled, waterIntervalMin, eyeRestEnabled, eyeRestIntervalMin,
  onWaterEnabled, onWaterIntervalMin, onEyeRestEnabled, onEyeRestIntervalMin,
}: WellnessWidgetProps) {
  const { t } = useTranslation();
  return (
    <div style={{
      width: 200,
      padding: "10px 12px 12px",
      borderRadius: 14,
      background: "rgba(12,18,22,0.72)",
      backdropFilter: "blur(18px)",
      WebkitBackdropFilter: "blur(18px)",
      border: "1px solid rgba(103,232,249,0.22)",
      boxShadow: "0 8px 28px rgba(0,0,0,0.4)",
      overflow: "hidden",
      boxSizing: "border-box",
    }}>
      <div style={{ display: "flex", gap: 4, background: "rgba(255,255,255,0.05)", borderRadius: 9, padding: 3, marginBottom: 8 }}>
        <TabBtn active={activeTab === "breathing"} onClick={() => onActiveTab("breathing")} icon={<Wind size={12} />} label={t("wellness.breathingTab")} />
        <TabBtn active={activeTab === "reminders"} onClick={() => onActiveTab("reminders")} icon={<Bell size={12} />} label={t("wellness.remindersTab")} />
      </div>

      <div style={{ display: activeTab === "breathing" ? "block" : "none" }}>
        <BreathingCircle pattern={pattern} cycleCount={cycleCount} />
      </div>
      <div style={{ display: activeTab === "reminders" ? "block" : "none" }}>
        <ReminderTab
          waterEnabled={waterEnabled}
          waterIntervalMin={waterIntervalMin}
          eyeRestEnabled={eyeRestEnabled}
          eyeRestIntervalMin={eyeRestIntervalMin}
          onWaterEnabled={onWaterEnabled}
          onWaterIntervalMin={onWaterIntervalMin}
          onEyeRestEnabled={onEyeRestEnabled}
          onEyeRestIntervalMin={onEyeRestIntervalMin}
        />
      </div>
    </div>
  );
}

function TabBtn({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
        padding: "5px 0", borderRadius: 7, border: "none", cursor: "pointer",
        background: active ? "rgba(103,232,249,0.16)" : "transparent",
        color: active ? "#67e8f9" : "rgba(255,255,255,0.4)",
        fontSize: "0.7rem", fontFamily: "'HarmonyOS Sans', sans-serif",
        transition: "all 0.18s",
      }}
    >
      {icon} {label}
    </button>
  );
}
