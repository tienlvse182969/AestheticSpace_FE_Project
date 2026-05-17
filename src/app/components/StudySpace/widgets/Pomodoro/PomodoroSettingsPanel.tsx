import { useLayoutEffect, useRef, useState } from "react";
import { Box, Flex, Text } from "@chakra-ui/react";
import { motion, AnimatePresence } from "motion/react";
import { X, Plus, Minus } from "lucide-react";
import { useTranslation } from "react-i18next";

/* ── Panel geometry ─────────────────────────────────────────────────────────── */
const PANEL_W = 226 + 10;
const PANEL_H = 320;
const MARGIN  = 12;

/* ── Props ──────────────────────────────────────────────────────────────────── */
interface PomodoroSettingsPanelProps {
  show: boolean;
  containerRef?: React.RefObject<HTMLDivElement | null>;
  focusMinutes: number;
  breakMinutes: number;
  totalSessions: number;
  onFocusMinutes: (v: number) => void;
  onBreakMinutes: (v: number) => void;
  onTotalSessions: (v: number) => void;
  onClose: () => void;
}

/* ── Stepper row ────────────────────────────────────────────────────────────── */
function StepperRow({
  label, sublabel, value, min, max, unit, onChange,
}: {
  label: string; sublabel?: string;
  value: number; min: number; max: number; unit: string;
  onChange: (v: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [raw, setRaw]         = useState(String(value));
  const inputRef = useRef<HTMLInputElement>(null);

  useLayoutEffect(() => { if (editing && inputRef.current) inputRef.current.focus(); }, [editing]);
  useLayoutEffect(() => { if (!editing) setRaw(String(value)); }, [value, editing]);

  const commit = () => {
    const v = parseInt(raw, 10);
    if (!isNaN(v) && v >= min && v <= max) onChange(v);
    else setRaw(String(value));
    setEditing(false);
  };

  return (
    <Flex align="center" justify="space-between" py="10px"
      style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
      <Box>
        <Text style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.7)", fontFamily: "'HarmonyOS Sans', sans-serif" }}>
          {label}
        </Text>
        {sublabel && (
          <Text style={{ fontSize: "0.6rem", color: "rgba(255,255,255,0.28)", fontFamily: "'HarmonyOS Sans', sans-serif", marginTop: 1 }}>
            {sublabel}
          </Text>
        )}
      </Box>

      <Flex align="center" gap="4px">
        {/* Decrement */}
        <Box as="button"
          onClick={() => onChange(Math.max(min, value - 1))}
          display="flex" alignItems="center" justifyContent="center"
          w="24px" h="24px" borderRadius="7px"
          style={{
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.1)",
            cursor: value <= min ? "default" : "pointer",
            opacity: value <= min ? 0.3 : 1,
            transition: "opacity 0.15s",
          }}>
          <Minus size={10} color="rgba(255,255,255,0.65)" />
        </Box>

        {/* Value display / input */}
        {editing ? (
          <input
            ref={inputRef}
            value={raw}
            onChange={(e) => setRaw(e.target.value.replace(/\D/g, "").slice(0, 3))}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === "Enter") commit();
              if (e.key === "Escape") { setEditing(false); setRaw(String(value)); }
            }}
            style={{
              width: 40, textAlign: "center",
              background: "rgba(74,166,134,0.12)",
              border: "1px solid rgba(74,222,128,0.45)",
              borderRadius: 7, color: "#e0f5ee",
              fontSize: "0.8rem", fontFamily: "'HarmonyOS Sans', sans-serif",
              padding: "2px 4px", outline: "none",
            }}
          />
        ) : (
          <Box as="button" onClick={() => setEditing(true)}
            display="flex" alignItems="center" justifyContent="center" gap="3px"
            style={{
              minWidth: 46, padding: "2px 6px", borderRadius: 7, cursor: "pointer",
              background: "rgba(74,166,134,0.1)",
              border: "1px solid rgba(74,166,134,0.22)",
              transition: "all 0.15s",
            }}>
            <Text style={{ fontSize: "0.82rem", color: "#e0f5ee", fontFamily: "'HarmonyOS Sans', sans-serif", fontWeight: 600 }}>
              {value}
            </Text>
            <Text style={{ fontSize: "0.6rem", color: "#7aab97", fontFamily: "'HarmonyOS Sans', sans-serif" }}>
              {unit}
            </Text>
          </Box>
        )}

        {/* Increment */}
        <Box as="button"
          onClick={() => onChange(Math.min(max, value + 1))}
          display="flex" alignItems="center" justifyContent="center"
          w="24px" h="24px" borderRadius="7px"
          style={{
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.1)",
            cursor: value >= max ? "default" : "pointer",
            opacity: value >= max ? 0.3 : 1,
            transition: "opacity 0.15s",
          }}>
          <Plus size={10} color="rgba(255,255,255,0.65)" />
        </Box>
      </Flex>
    </Flex>
  );
}

/* ── Main panel ─────────────────────────────────────────────────────────────── */
export function PomodoroSettingsPanel({
  show, containerRef,
  focusMinutes, breakMinutes, totalSessions,
  onFocusMinutes, onBreakMinutes, onTotalSessions,
  onClose,
}: PomodoroSettingsPanelProps) {
  const { t } = useTranslation();
  const [hSide, setHSide] = useState<"right" | "left">("right");
  const [vSide, setVSide] = useState<"top" | "bottom">("top");

  useLayoutEffect(() => {
    if (!show || !containerRef?.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setHSide(rect.right + PANEL_W > window.innerWidth  - MARGIN ? "left"   : "right");
    setVSide(rect.top  + PANEL_H > window.innerHeight - MARGIN ? "bottom" : "top");
  }, [show, containerRef]);

  const posStyle: React.CSSProperties = hSide === "right"
    ? { left: "calc(100% + 10px)", right: "auto" }
    : { right: "calc(100% + 10px)", left: "auto" };

  const vStyle: React.CSSProperties = vSide === "top"
    ? { top: "0px",    bottom: "auto" }
    : { bottom: "0px", top: "auto"    };

  const xInit  = hSide === "right" ? -10 : 10;
  const origin = hSide === "right" ? "left center" : "right center";

  const totalMins = focusMinutes * totalSessions + breakMinutes * (totalSessions - 1);
  const totalTimeStr = totalMins >= 60
    ? `${Math.floor(totalMins / 60)}h ${totalMins % 60 > 0 ? `${totalMins % 60}m` : ""}`.trim()
    : `${totalMins}m`;

  return (
    <AnimatePresence>
      {show && (
        <div style={{ position: "absolute", ...posStyle, ...vStyle, zIndex: 20 }}>
          <motion.div
            key="pomodoro-settings-panel"
            initial={{ opacity: 0, scale: 0.92, x: xInit }}
            animate={{ opacity: 1, scale: 1,    x: 0    }}
            exit={{    opacity: 0, scale: 0.92, x: xInit }}
            transition={{ type: "spring", stiffness: 500, damping: 24, mass: 0.9 }}
            style={{
              width: 226,
              background: "rgba(12,18,22,0.82)",
              backdropFilter: "blur(18px)",
              WebkitBackdropFilter: "blur(18px)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "14px",
              padding: "12px 14px 14px",
              boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
              transformOrigin: origin,
            }}
            onPointerDown={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <Flex align="center" justify="space-between" mb="10px">
              <Text style={{
                fontSize: "0.7rem",
                color: "rgba(255,255,255,0.5)",
                fontFamily: "'HarmonyOS Sans', sans-serif",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
              }}>
                {t("pomodoroSettings.title")}
              </Text>
              <Box as="button" onClick={onClose}
                display="flex" alignItems="center" justifyContent="center"
                w="20px" h="20px" borderRadius="full"
                style={{
                  background: "rgba(255,255,255,0.07)",
                  border: "none", cursor: "pointer",
                  color: "rgba(255,255,255,0.4)", transition: "all 0.15s",
                }}>
                <X size={11} />
              </Box>
            </Flex>

            <Box style={{ height: 1, background: "rgba(255,255,255,0.07)", marginBottom: 2 }} />

            {/* Stepper rows */}
            <StepperRow
              label={t("pomodoroSettings.focusTime")} sublabel={t("pomodoroSettings.focusTimeSub")}
              value={focusMinutes} min={1} max={180} unit="min"
              onChange={onFocusMinutes}
            />
            <StepperRow
              label={t("pomodoroSettings.breakTime")} sublabel={t("pomodoroSettings.breakTimeSub")}
              value={breakMinutes} min={1} max={60} unit="min"
              onChange={onBreakMinutes}
            />
            <StepperRow
              label={t("pomodoroSettings.totalSessions")} sublabel={t("pomodoroSettings.totalSessionsSub")}
              value={totalSessions} min={1} max={12} unit="ses"
              onChange={onTotalSessions}
            />

            {/* Summary */}
            <Box mt="12px" style={{
              background: "rgba(74,166,134,0.07)",
              border: "1px solid rgba(74,166,134,0.15)",
              borderRadius: "9px",
              padding: "9px 12px",
            }}>
              <Text style={{ fontSize: "0.62rem", color: "rgba(255,255,255,0.3)", fontFamily: "'HarmonyOS Sans', sans-serif", letterSpacing: "0.06em", marginBottom: 4 }}>
                {t("pomodoroSettings.summary")}
              </Text>
              <Text style={{ fontSize: "0.72rem", color: "#7aab97", fontFamily: "'HarmonyOS Sans', sans-serif", lineHeight: 1.65 }}>
                {totalSessions > 1
                  ? t("pomodoroSettings.breakdown", { sessions: totalSessions, focus: focusMinutes, breaks: totalSessions - 1, break: breakMinutes })
                  : `${totalSessions} × ${focusMinutes}m`}
              </Text>
              <Text style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.28)", fontFamily: "'HarmonyOS Sans', sans-serif" }}>
                {t("pomodoroSettings.totalTime", { time: totalTimeStr })}
              </Text>
            </Box>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
