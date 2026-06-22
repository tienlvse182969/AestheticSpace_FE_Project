import { useState, useRef } from "react";
import type { PomodoroSounds } from "../../../types/workspace.types";

export const DEFAULT_POMODORO_SOUNDS: PomodoroSounds = {
  startFocus: "/assets/PomodoroChime/StartPomodoroChime.mp3",
  startBreak: "/assets/PomodoroChime/StartBreakTimeChime.mp3",
  complete:   "/assets/PomodoroChime/SuccessChime.mp3",
  pause:      "/assets/PomodoroChime/PauseChime.mp3",
  reset:      "/assets/PomodoroChime/ResetPomodoroChime.mp3",
};

export function usePomodoroSettings() {
  const [settingsOpen,  setSettingsOpen]  = useState(false);
  const [focusMin,      setFocusMin]      = useState(25);
  const [breakMin,      setBreakMin]      = useState(5);
  const [totalSes,      setTotalSes]      = useState(4);
  const [soundEnabled,  setSoundEnabled]  = useState(true);
  const [sounds,        setSounds]        = useState<PomodoroSounds>(DEFAULT_POMODORO_SOUNDS);
  const containerRef                      = useRef<HTMLDivElement>(null);

  return {
    settingsOpen, setSettingsOpen,
    focusMin, setFocusMin,
    breakMin, setBreakMin,
    totalSes, setTotalSes,
    soundEnabled, setSoundEnabled,
    sounds, setSounds,
    containerRef,
  };
}
