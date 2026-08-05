import { useLayoutEffect, useState } from "react";
import { Box, Flex, Text } from "@chakra-ui/react";
import { motion, AnimatePresence } from "motion/react";
import { X } from "lucide-react";
import { useTranslation } from "react-i18next";

interface GoogleCalendarSettingsPanelProps {
  show: boolean;
  containerRef?: React.RefObject<HTMLDivElement | null>;
  maxEvents: number;
  showAllDay: boolean;
  onMaxEvents: (v: number) => void;
  onShowAllDay: (v: boolean) => void;
  onClose: () => void;
}

const PANEL_W = 196 + 10;
const PANEL_H = 160;
const MARGIN  = 12;

export function GoogleCalendarSettingsPanel({ show, containerRef, maxEvents, showAllDay, onMaxEvents, onShowAllDay, onClose }: GoogleCalendarSettingsPanelProps) {
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
            key="gcal-settings-panel"
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
                {t("googleCalendar.settingsTitle")}
              </Text>
              <Box as="button" onClick={onClose} display="flex" alignItems="center" justifyContent="center"
                w="20px" h="20px" borderRadius="full" border="none" cursor="pointer"
                style={{ background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.4)" }}>
                <X size={11} />
              </Box>
            </Flex>

            <Flex align="center" justify="space-between" mb="10px">
              <Text style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.42)", fontFamily: "'HarmonyOS Sans', sans-serif" }}>{t("googleCalendar.maxEvents")}</Text>
              <Flex align="center" gap="6px">
                <input
                  type="range" min={3} max={10} value={maxEvents}
                  onChange={e => onMaxEvents(Number(e.target.value))}
                  onPointerDown={e => e.stopPropagation()}
                  style={{ width: 80 }}
                />
                <Text style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.5)", width: 16 }}>{maxEvents}</Text>
              </Flex>
            </Flex>

            <Flex align="center" justify="space-between">
              <Text style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.42)", fontFamily: "'HarmonyOS Sans', sans-serif" }}>{t("googleCalendar.showAllDay")}</Text>
              <Box as="button" onClick={() => onShowAllDay(!showAllDay)}
                style={{
                  width: 34, height: 18, borderRadius: 9, border: "none", cursor: "pointer",
                  background: showAllDay ? "rgba(129,140,248,0.5)" : "rgba(255,255,255,0.1)", padding: 2,
                  display: "flex", alignItems: "center",
                }}
              >
                <Box style={{
                  width: 14, height: 14, borderRadius: "50%",
                  background: showAllDay ? "#818cf8" : "rgba(255,255,255,0.38)",
                  transform: showAllDay ? "translateX(16px)" : "translateX(0)",
                  transition: "transform 0.22s",
                }} />
              </Box>
            </Flex>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
