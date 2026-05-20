import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

const DEFAULT_ACCENT = "#4e7c6a";

function hexToRgb(hex: string): [number, number, number] {
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ];
}

export function applyAccentToDOM(hex: string) {
  const [r, g, b] = hexToRgb(hex);
  // Light variant: mix 38% toward white (for secondary text/labels)
  const lr = Math.round(r + (255 - r) * 0.38);
  const lg = Math.round(g + (255 - g) * 0.38);
  const lb = Math.round(b + (255 - b) * 0.38);
  // Widget bg: blend 18% accent into dark base rgb(12,18,22)
  const dr = Math.round(12 + (r - 12) * 0.18);
  const dg = Math.round(18 + (g - 18) * 0.18);
  const db = Math.round(22 + (b - 22) * 0.18);
  const root = document.documentElement;
  root.style.setProperty("--accent",           hex);
  root.style.setProperty("--accent-rgb",       `${r}, ${g}, ${b}`);
  root.style.setProperty("--accent-light-rgb", `${lr}, ${lg}, ${lb}`);
  root.style.setProperty("--widget-bg-rgb",    `${dr}, ${dg}, ${db}`);
}

interface AccentCtx {
  accent: string;
  setAccent: (c: string) => void;
}

const Ctx = createContext<AccentCtx>({ accent: DEFAULT_ACCENT, setAccent: () => {} });

export function AccentProvider({ children }: { children: ReactNode }) {
  const [accent, _setAccent] = useState<string>(
    () => localStorage.getItem("accent") ?? DEFAULT_ACCENT,
  );

  // Apply on mount
  useEffect(() => { applyAccentToDOM(accent); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const setAccent = (color: string) => {
    _setAccent(color);
    localStorage.setItem("accent", color);
    applyAccentToDOM(color);
  };

  return <Ctx.Provider value={{ accent, setAccent }}>{children}</Ctx.Provider>;
}

export const useAccent = () => useContext(Ctx);
