import { useLayoutEffect, useRef, useState } from "react";
import { Box, Flex, Text } from "@chakra-ui/react";
import { motion, AnimatePresence } from "motion/react";
import { X } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { ClockMode, DigitalLayout } from "./types";

interface ClockSettingsPanelProps {
  show: boolean;
  containerRef?: React.RefObject<HTMLDivElement>;
  mode: ClockMode;
  layout: DigitalLayout;
  showSeconds: boolean;
  showLunar: boolean;
  showDate: boolean;
  onMode: (v: ClockMode) => void;
  onLayout: (v: DigitalLayout) => void;
  onShowSeconds: (v: boolean) => void;
  onShowLunar: (v: boolean) => void;
  onShowDate: (v: boolean) => void;
  onClose: () => void;
}

// Approximate panel dimensions used for predictive placement
const PANEL_W = 216 + 10; // width + gap
const PANEL_H = 290;      // approximate height
const MARGIN  = 12;       // keep-away distance from screen edge

export function ClockSettingsPanel({
  show,
  containerRef,
  mode, layout, showSeconds, showLunar, showDate,
  onMode, onLayout, onShowSeconds, onShowLunar, onShowDate,
  onClose,
}: ClockSettingsPanelProps) {
  const { t } = useTranslation();
  const [hSide, setHSide] = useState<"right" | "left">("right");
  const [vSide, setVSide] = useState<"top" | "bottom">("top");

  // Runs synchronously before paint — measures the WIDGET (always in DOM),
  // predicts panel placement so the first painted frame is already correct.
  useLayoutEffect(() => {
    if (!show) return;
    if (!containerRef?.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const W = window.innerWidth;
    const H = window.innerHeight;

    // Horizontal: prefer right, fall back to left when not enough space
    setHSide(rect.right + PANEL_W > W - MARGIN ? "left" : "right");
    // Vertical: anchor to top, fall back to bottom when panel would overflow
    setVSide(rect.top  + PANEL_H > H - MARGIN ? "bottom" : "top");
  }, [show, containerRef]);

  const posStyle: React.CSSProperties =
    hSide === "right"
      ? { left: "calc(100% + 10px)", right: "auto" }
      : { right: "calc(100% + 10px)", left: "auto" };

  const vStyle: React.CSSProperties =
    vSide === "top"
      ? { top: "0px",    bottom: "auto" }
      : { bottom: "0px", top: "auto"    };

  const xInit  = hSide === "right" ? -10 : 10;
  const origin = hSide === "right" ? "left center" : "right center";

  return (
    <AnimatePresence>
      {show && (
        <div
          style={{
            position: "absolute",
            ...posStyle,
            ...vStyle,
            zIndex: 20,
          }}
        >
          <motion.div
            key="clock-settings-panel"
            initial={{ opacity: 0, scale: 0.92, x: xInit }}
            animate={{ opacity: 1, scale: 1,    x: 0    }}
            exit={{    opacity: 0, scale: 0.92, x: xInit }}
            transition={{ type: "spring", stiffness: 500, damping: 24, mass: 0.9 }}
            style={{
              width: 216,
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
            <Flex align="center" justify="space-between" mb="12px">
              <Text style={{
                fontSize: "0.72rem",
                color: "rgba(255,255,255,0.55)",
                fontFamily: "'HarmonyOS Sans', sans-serif",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
              }}>
                {t("clockSettings.title")}
              </Text>
              <Box
                as="button"
                onClick={onClose}
                display="flex" alignItems="center" justifyContent="center"
                w="20px" h="20px" borderRadius="full"
                style={{
                  background: "rgba(255,255,255,0.07)",
                  border: "none",
                  cursor: "pointer",
                  color: "rgba(255,255,255,0.4)",
                  transition: "all 0.15s",
                }}
                _hover={{ background: "rgba(255,255,255,0.14)", color: "rgba(255,255,255,0.8)" }}
              >
                <X size={11} />
              </Box>
            </Flex>

            <Box style={{ height: 1, background: "rgba(255,255,255,0.07)", marginBottom: 12 }} />

            <SettingRow label={t("clockSettings.clockType")}>
              <SegControl
                options={[
                  { value: "digital", label: t("clockSettings.digital") },
                  { value: "analog",  label: t("clockSettings.analog") },
                ]}
                value={mode}
                onChange={v => onMode(v as ClockMode)}
              />
            </SettingRow>

            {mode === "digital" && (
              <SettingRow label={t("clockSettings.layout")}>
                <SegControl
                  options={[
                    { value: "horizontal", label: t("clockSettings.horizontal") },
                    { value: "vertical",   label: t("clockSettings.vertical") },
                  ]}
                  value={layout}
                  onChange={v => onLayout(v as DigitalLayout)}
                />
              </SettingRow>
            )}

            <SettingRow label={t("clockSettings.showSeconds")}>
              <Toggle value={showSeconds} onChange={onShowSeconds} />
            </SettingRow>

            <SettingRow label={t("clockSettings.showDate")}>
              <Toggle value={showDate} onChange={(v) => {
                onShowDate(v);
                if (!v) onShowLunar(false);
              }} />
            </SettingRow>

            <SettingRow label={t("clockSettings.lunarCalendar")} last>
              <Box style={{
                opacity: showDate ? 1 : 0.3,
                transition: "opacity 0.2s",
                pointerEvents: showDate ? "auto" : "none",
              }}>
                <Toggle value={showLunar} onChange={onShowLunar} />
              </Box>
            </SettingRow>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SettingRow({ label, children, last }: {
  label: string; children: React.ReactNode; last?: boolean;
}) {
  return (
    <Flex align="center" justify="space-between" mb={last ? 0 : "10px"}>
      <Text style={{
        fontSize: "0.7rem",
        color: "rgba(255,255,255,0.42)",
        fontFamily: "'HarmonyOS Sans', sans-serif",
      }}>
        {label}
      </Text>
      {children}
    </Flex>
  );
}

function SegControl({ options, value, onChange }: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <Flex style={{
      background: "rgba(255,255,255,0.05)",
      border: "1px solid rgba(255,255,255,0.09)",
      borderRadius: "8px",
      padding: "2px",
      gap: "2px",
    }}>
      {options.map(opt => (
        <Box
          key={opt.value}
          as="button"
          onClick={() => onChange(opt.value)}
          style={{
            padding: "3px 9px",
            borderRadius: "6px",
            fontSize: "0.67rem",
            fontFamily: "'HarmonyOS Sans', sans-serif",
            cursor: "pointer",
            border: "none",
            whiteSpace: "nowrap",
            transition: "all 0.18s",
            background: value === opt.value ? "rgba(255,255,255,0.13)" : "transparent",
            color:      value === opt.value ? "rgba(255,255,255,0.9)"  : "rgba(255,255,255,0.32)",
            boxShadow:  value === opt.value ? "inset 0 1px 0 rgba(255,255,255,0.08)" : "none",
          }}
        >
          {opt.label}
        </Box>
      ))}
    </Flex>
  );
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <Box
      as="button"
      onClick={() => onChange(!value)}
      style={{
        width: 34, height: 18,
        borderRadius: 9,
        border: "none",
        cursor: "pointer",
        background: value ? "rgba(74,222,128,0.45)" : "rgba(255,255,255,0.1)",
        padding: "2px",
        transition: "background 0.22s",
        display: "flex",
        alignItems: "center",
        flexShrink: 0,
      }}
    >
      <Box style={{
        width: 14, height: 14,
        borderRadius: "50%",
        background: value ? "#4ade80" : "rgba(255,255,255,0.38)",
        transform: value ? "translateX(16px)" : "translateX(0)",
        transition: "transform 0.22s cubic-bezier(0.4,0,0.2,1), background 0.22s",
        boxShadow: value ? "0 0 6px rgba(74,222,128,0.7)" : "none",
      }} />
    </Box>
  );
}