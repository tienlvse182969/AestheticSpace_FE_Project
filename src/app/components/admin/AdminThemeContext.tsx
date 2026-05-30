import { createContext, useContext, useState, type ReactNode } from "react";

export const DARK = {
  bg:              "linear-gradient(135deg, #060b0f 0%, #0b1a18 55%, #07101c 100%)",
  dot:             "radial-gradient(rgba(78,124,106,0.07) 1px, transparent 1px)",
  sidebar:         "rgba(6,10,14,0.88)",
  sidebarBorder:   "rgba(255,255,255,0.06)",
  topbar:          "rgba(6,10,14,0.6)",
  border:          "rgba(255,255,255,0.05)",
  text:            "rgba(255,255,255,0.88)",
  textSub:         "rgba(255,255,255,0.18)",
  textMuted:       "rgba(255,255,255,0.42)",
  textDim:         "rgba(255,255,255,0.25)",
  accent:          "#4e7c6a",
  navActive:       "rgba(78,124,106,0.16)",
  navActiveBorder: "rgba(78,124,106,0.3)",
  navHover:        "rgba(255,255,255,0.04)",
  badgeBg:         "rgba(255,255,255,0.06)",
  badgeText:       "rgba(255,255,255,0.22)",
  chipBg:          "rgba(255,255,255,0.04)",
  chipBorder:      "rgba(255,255,255,0.07)",
  panelBg:         "rgba(8,12,18,0.98)",
  panelBorder:     "rgba(255,255,255,0.1)",
  panelShadow:     "0 20px 60px rgba(0,0,0,0.6)",
  cardBg:          "rgba(255,255,255,0.04)",
  cardBorder:      "rgba(255,255,255,0.08)",
  cardText:        "rgba(255,255,255,0.92)",
  cardTextSub:     "rgba(255,255,255,0.5)",
  cardTextMuted:   "rgba(255,255,255,0.35)",
  rowDivider:      "rgba(255,255,255,0.05)",
} as const;

export const LIGHT = {
  bg:              "linear-gradient(135deg, #f4f6f9 0%, #eef2f0 55%, #f0f4f8 100%)",
  dot:             "radial-gradient(rgba(78,124,106,0.12) 1px, transparent 1px)",
  sidebar:         "rgba(252,253,255,0.97)",
  sidebarBorder:   "rgba(0,0,0,0.07)",
  topbar:          "rgba(250,251,254,0.88)",
  border:          "rgba(0,0,0,0.06)",
  text:            "rgba(15,23,42,0.9)",
  textSub:         "rgba(15,23,42,0.28)",
  textMuted:       "rgba(15,23,42,0.5)",
  textDim:         "rgba(15,23,42,0.35)",
  accent:          "#4e7c6a",
  navActive:       "rgba(78,124,106,0.1)",
  navActiveBorder: "rgba(78,124,106,0.25)",
  navHover:        "rgba(0,0,0,0.04)",
  badgeBg:         "rgba(0,0,0,0.05)",
  badgeText:       "rgba(15,23,42,0.35)",
  chipBg:          "rgba(0,0,0,0.04)",
  chipBorder:      "rgba(0,0,0,0.08)",
  panelBg:         "rgba(252,253,255,0.99)",
  panelBorder:     "rgba(0,0,0,0.1)",
  panelShadow:     "0 16px 48px rgba(0,0,0,0.14)",
  cardBg:          "rgba(255,255,255,0.85)",
  cardBorder:      "rgba(0,0,0,0.08)",
  cardText:        "rgba(15,23,42,0.9)",
  cardTextSub:     "rgba(15,23,42,0.5)",
  cardTextMuted:   "rgba(15,23,42,0.45)",
  rowDivider:      "rgba(0,0,0,0.05)",
} as const;

export type AdminColors = typeof DARK;

interface AdminThemeValue {
  isDark: boolean;
  toggle: () => void;
  c: AdminColors;
}

const AdminThemeContext = createContext<AdminThemeValue | null>(null);

export function AdminThemeProvider({ children }: { children: ReactNode }) {
  const [isDark, setIsDark] = useState(() =>
    localStorage.getItem("admin-theme") !== "light"
  );

  const toggle = () =>
    setIsDark(prev => {
      const next = !prev;
      localStorage.setItem("admin-theme", next ? "dark" : "light");
      return next;
    });

  return (
    <AdminThemeContext.Provider value={{ isDark, toggle, c: isDark ? DARK : LIGHT }}>
      {children}
    </AdminThemeContext.Provider>
  );
}

export function useAdminTheme() {
  const ctx = useContext(AdminThemeContext);
  if (!ctx) throw new Error("useAdminTheme must be used inside AdminThemeProvider");
  return ctx;
}
