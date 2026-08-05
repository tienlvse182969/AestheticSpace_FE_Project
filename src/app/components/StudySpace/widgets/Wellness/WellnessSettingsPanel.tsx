import { useLayoutEffect, useState } from "react";
import { Box, Flex, Text } from "@chakra-ui/react";
import { motion, AnimatePresence } from "motion/react";
import { X } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { BreathingPattern } from "../../../../hooks/studyspace/useWellnessSettings";

interface WellnessSettingsPanelProps {
  show: boolean;
  containerRef?: React.RefObject<HTMLDivElement | null>;
  pattern: BreathingPattern;
  cycleCount: number;
  onPattern: (v: BreathingPattern) => void;
  onCycleCount: (v: number) => void;
  onClose: () => void;
}

const PATTERN_KEYS: Record<BreathingPattern, string> = {
  box: "wellness.patternBox",
  "478": "wellness.pattern478",
  "462": "wellness.pattern462",
};

const PANEL_W = 196 + 10;
const PANEL_H = 220;
const MARGIN  = 12;

export function WellnessSettingsPanel({ show, containerRef, pattern, cycleCount, onPattern, onCycleCount, onClose }: WellnessSettingsPanelProps) {
  const { t } = useTranslation();
  const [hSide, setHSide] = useState<"right" | "left">("right");
  const [vSide, setVSide] = useState<"top" | "bottom">("top");

  useLayoutEffect(() => {
    if (!show || !containerRef?.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setHSide(rect.right + PANEL_W > window.innerWidth  - MARGIN ? "left" : "right");
    setVSide(rect.top   + PANEL_H > window.innerHeight - MARGIN ? "bottom" : "top");
  }, [show, containerRef]);

  const posStyle: React.CSSProperties =
    hSide === "right" ? { left: "calc(100% + 10px)", right: "auto" } : { right: "calc(100% + 10px)", left: "auto" };
  const vStyle: React.CSSProperties =
    vSide === "top" ? { top: "0px", bottom: "auto" } : { bottom: "0px", top: "auto" };
  const xInit  = hSide === "right" ? -10 : 10;
  const origin = hSide === "right" ? "left center" : "right center";

  return (
    <AnimatePresence>
      {show && (
        <div style={{ position: "absolute", ...posStyle, ...vStyle, zIndex: 20 }}>
          <motion.div
            key="wellness-settings-panel"
            initial={{ opacity: 0, scale: 0.92, x: xInit }}
            animate={{ opacity: 1, scale: 1,    x: 0    }}
            exit={{    opacity: 0, scale: 0.92, x: xInit }}
            transition={{ type: "spring", stiffness: 500, damping: 24, mass: 0.9 }}
            onPointerDown={e => e.stopPropagation()}
            style={{
              width: 196,
              background: "rgba(12,18,22,0.86)",
              backdropFilter: "blur(18px)",
              WebkitBackdropFilter: "blur(18px)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 14,
              padding: "12px 14px 14px",
              boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
              transformOrigin: origin,
            }}
          >
            <Flex align="center" justify="space-between" mb="10px">
              <Text style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.55)", fontFamily: "'HarmonyOS Sans', sans-serif", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                {t("wellness.settingsTitle")}
              </Text>
              <Box as="button" onClick={onClose} display="flex" alignItems="center" justifyContent="center"
                w="20px" h="20px" borderRadius="full" border="none" cursor="pointer"
                style={{ background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.4)" }}>
                <X size={11} />
              </Box>
            </Flex>

            <Text style={{ fontSize: "0.66rem", color: "rgba(255,255,255,0.32)", fontFamily: "'HarmonyOS Sans', sans-serif", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>
              {t("wellness.patternLabel")}
            </Text>
            <div style={{ display: "flex", flexDirection: "column", gap: 5, marginBottom: 10 }}>
              {(Object.keys(PATTERN_KEYS) as BreathingPattern[]).map(p => {
                const isActive = pattern === p;
                return (
                  <button
                    key={p}
                    onClick={() => onPattern(p)}
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "6px 9px", borderRadius: 8,
                      border: isActive ? "1px solid rgba(103,232,249,0.4)" : "1px solid transparent",
                      background: isActive ? "rgba(103,232,249,0.14)" : "rgba(255,255,255,0.03)",
                      cursor: "pointer",
                    }}
                  >
                    <span style={{ fontSize: "0.74rem", fontFamily: "'HarmonyOS Sans', sans-serif", color: isActive ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.5)" }}>
                      {t(PATTERN_KEYS[p])}
                    </span>
                    {isActive && <span style={{ fontSize: "0.65rem", color: "#67e8f9" }}>✓</span>}
                  </button>
                );
              })}
            </div>

            <Flex align="center" justify="space-between">
              <Text style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.42)", fontFamily: "'HarmonyOS Sans', sans-serif" }}>{t("wellness.cycles")}</Text>
              <Flex align="center" gap="6px">
                <input
                  type="range" min={0} max={10} value={cycleCount}
                  onChange={e => onCycleCount(Number(e.target.value))}
                  onPointerDown={e => e.stopPropagation()}
                  style={{ width: 80 }}
                />
                <Text style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.5)", width: 20 }}>{cycleCount === 0 ? "∞" : cycleCount}</Text>
              </Flex>
            </Flex>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
