import { useRef, useState } from "react";

export type BreathingPattern = "box" | "478" | "462";
export type WellnessTab = "breathing" | "reminders";

export function useWellnessSettings() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [activeTab, setActiveTab]       = useState<WellnessTab>("breathing");

  const [pattern, setPattern]       = useState<BreathingPattern>("box");
  const [cycleCount, setCycleCount] = useState(0); // 0 = unlimited

  const [waterEnabled, setWaterEnabled]           = useState(false);
  const [waterIntervalMin, setWaterIntervalMin]   = useState(45);
  const [eyeRestEnabled, setEyeRestEnabled]       = useState(false);
  const [eyeRestIntervalMin, setEyeRestIntervalMin] = useState(20);

  const containerRef = useRef<HTMLDivElement>(null);

  return {
    settingsOpen, setSettingsOpen,
    activeTab, setActiveTab,
    pattern, setPattern,
    cycleCount, setCycleCount,
    waterEnabled, setWaterEnabled,
    waterIntervalMin, setWaterIntervalMin,
    eyeRestEnabled, setEyeRestEnabled,
    eyeRestIntervalMin, setEyeRestIntervalMin,
    containerRef,
  };
}
