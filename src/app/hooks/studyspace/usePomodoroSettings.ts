import { useState, useRef } from "react";

export function usePomodoroSettings() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [focusMin, setFocusMin]         = useState(25);
  const [breakMin, setBreakMin]         = useState(5);
  const [totalSes, setTotalSes]         = useState(4);
  const containerRef                    = useRef<HTMLDivElement>(null);

  return {
    settingsOpen, setSettingsOpen,
    focusMin, setFocusMin,
    breakMin, setBreakMin,
    totalSes, setTotalSes,
    containerRef,
  };
}
