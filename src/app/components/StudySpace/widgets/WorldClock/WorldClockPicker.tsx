import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { useTranslation } from "react-i18next";
import { WORLD_CLOCK_CITIES, type WorldClockCity } from "../../utils/timezone";

interface WorldClockPickerProps {
  currentTimezone?: string;
  onSelect: (city: WorldClockCity) => void;
}

export function WorldClockPicker({ currentTimezone, onSelect }: WorldClockPickerProps) {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return WORLD_CLOCK_CITIES;
    return WORLD_CLOCK_CITIES.filter(c => c.label.toLowerCase().includes(q));
  }, [query]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{
        display: "flex", alignItems: "center", gap: 6,
        background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 8, padding: "5px 8px",
      }}>
        <Search size={12} color="rgba(255,255,255,0.35)" />
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder={t("worldClock.searchPlaceholder")}
          onPointerDown={e => e.stopPropagation()}
          style={{
            flex: 1, background: "transparent", border: "none", outline: "none",
            color: "rgba(255,255,255,0.85)", fontSize: "0.74rem",
            fontFamily: "'HarmonyOS Sans', sans-serif",
          }}
        />
      </div>
      <div style={{ maxHeight: 180, overflowY: "auto", display: "flex", flexDirection: "column", gap: 3 }}>
        {filtered.map(city => {
          const isActive = city.timezone === currentTimezone;
          return (
            <button
              key={city.label}
              onClick={() => onSelect(city)}
              style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                width: "100%", padding: "6px 8px", borderRadius: 7,
                border: isActive ? "1px solid rgba(129,140,248,0.4)" : "1px solid transparent",
                background: isActive ? "rgba(129,140,248,0.14)" : "rgba(255,255,255,0.03)",
                cursor: "pointer", transition: "all 0.15s",
              }}
            >
              <span style={{
                fontSize: "0.76rem", fontFamily: "'HarmonyOS Sans', sans-serif",
                color: isActive ? "rgba(255,255,255,0.92)" : "rgba(255,255,255,0.55)",
              }}>
                {city.label}
              </span>
              {isActive && <span style={{ fontSize: "0.65rem", color: "#818cf8" }}>✓</span>}
            </button>
          );
        })}
        {filtered.length === 0 && (
          <div style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.3)", padding: "8px 4px", textAlign: "center" }}>
            {t("worldClock.noMatch")}
          </div>
        )}
      </div>
    </div>
  );
}
