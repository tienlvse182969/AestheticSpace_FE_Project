import { useState, useRef } from "react";
import type { ClockMode, DigitalLayout } from "../../components/StudySpace/types";

export function useClockSettings() {
  const [settingsOpen, setSettingsOpen]   = useState(false);
  const [mode, setMode]                   = useState<ClockMode>("digital");
  const [layout, setLayout]               = useState<DigitalLayout>("horizontal");
  const [showSeconds, setShowSeconds]     = useState(true);
  const [showLunar, setShowLunar]         = useState(false);
  const [showDate, setShowDate]           = useState(true);
  const containerRef                      = useRef<HTMLDivElement>(null);

  return {
    settingsOpen, setSettingsOpen,
    mode, setMode,
    layout, setLayout,
    showSeconds, setShowSeconds,
    showLunar, setShowLunar,
    showDate, setShowDate,
    containerRef,
  };
}
