import { useLayoutEffect, useRef, useState } from "react";
import { Box, Flex, Text } from "@chakra-ui/react";
import { motion, AnimatePresence } from "motion/react";
import { Settings, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { DraggableWidget } from "../../ui/DraggableWidget";
import { DeadlineWidget } from "./DeadlineWidget";
import type { DeadlineItem } from "../../types";

const PANEL_W = 210 + 10;
const PANEL_H = 190;
const MARGIN  = 12;

interface DeadlineInstanceProps {
  item: DeadlineItem;
  onRemove: () => void;
  onUpdate: (patch: Partial<Pick<DeadlineItem, "title" | "targetAt" | "color" | "x" | "y">>) => void;
  locked?: boolean;
}

function toLocalInputValue(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function DeadlineInstance({ item, onRemove, onUpdate, locked }: DeadlineInstanceProps) {
  const { t } = useTranslation();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [hSide, setHSide] = useState<"right" | "left">("right");
  const [vSide, setVSide] = useState<"top" | "bottom">("top");

  useLayoutEffect(() => {
    if (!settingsOpen || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setHSide(rect.right + PANEL_W > window.innerWidth  - MARGIN ? "left" : "right");
    setVSide(rect.top   + PANEL_H > window.innerHeight - MARGIN ? "bottom" : "top");
  }, [settingsOpen]);

  const posStyle: React.CSSProperties =
    hSide === "right" ? { left: "calc(100% + 10px)", right: "auto" } : { right: "calc(100% + 10px)", left: "auto" };
  const vStyle: React.CSSProperties =
    vSide === "top" ? { top: "0px", bottom: "auto" } : { bottom: "0px", top: "auto" };
  const xInit  = hSide === "right" ? -10 : 10;
  const origin = hSide === "right" ? "left center" : "right center";

  return (
    <DraggableWidget
      containerRef={containerRef}
      initialX={item.x}
      initialY={item.y}
      onRemove={onRemove}
      onDragEnd={(x, y) => onUpdate({ x, y })}
      locked={locked}
      width={176}
      extraControls={
        <Box
          as="button"
          onClick={(e: React.MouseEvent) => { e.stopPropagation(); setSettingsOpen(v => !v); }}
          display="flex" alignItems="center" justifyContent="center"
          w="18px" h="18px" borderRadius="full" border="none" cursor="pointer"
          style={{
            background: settingsOpen ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.07)",
            color:      settingsOpen ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.45)",
            transition: "all 0.15s",
          }}
          title={t("deadline.settingsTitle")}
        >
          <Settings size={10} />
        </Box>
      }
      floatingPanel={
        <AnimatePresence>
          {settingsOpen && (
            <div style={{ position: "absolute", ...posStyle, ...vStyle, zIndex: 20 }}>
              <motion.div
                key="deadline-settings"
                initial={{ opacity: 0, scale: 0.92, x: xInit }}
                animate={{ opacity: 1, scale: 1,    x: 0    }}
                exit={{    opacity: 0, scale: 0.92, x: xInit }}
                transition={{ type: "spring", stiffness: 500, damping: 24, mass: 0.9 }}
                onPointerDown={e => e.stopPropagation()}
                style={{
                  width: 210,
                  background: "rgba(12,18,22,0.82)",
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
                  <Text style={{
                    fontSize: "0.7rem", color: "rgba(255,255,255,0.55)",
                    fontFamily: "'HarmonyOS Sans', sans-serif", letterSpacing: "0.1em", textTransform: "uppercase",
                  }}>
                    {t("deadline.settingsTitle")}
                  </Text>
                  <Box
                    as="button"
                    onClick={() => setSettingsOpen(false)}
                    display="flex" alignItems="center" justifyContent="center"
                    w="20px" h="20px" borderRadius="full" border="none" cursor="pointer"
                    style={{ background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.4)" }}
                  >
                    <X size={11} />
                  </Box>
                </Flex>

                <input
                  value={item.title}
                  onChange={e => onUpdate({ title: e.target.value })}
                  placeholder={t("deadline.titlePlaceholder")}
                  onPointerDown={e => e.stopPropagation()}
                  style={{
                    width: "100%", marginBottom: 8, padding: "6px 8px", borderRadius: 8,
                    background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
                    outline: "none", color: "rgba(255,255,255,0.85)", fontSize: "0.76rem",
                    fontFamily: "'HarmonyOS Sans', sans-serif",
                  }}
                />

                <input
                  type="datetime-local"
                  value={toLocalInputValue(item.targetAt)}
                  onChange={e => {
                    const v = e.target.value;
                    if (!v) return;
                    onUpdate({ targetAt: new Date(v).toISOString() });
                  }}
                  onPointerDown={e => e.stopPropagation()}
                  style={{
                    width: "100%", padding: "6px 8px", borderRadius: 8,
                    background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
                    outline: "none", color: "rgba(255,255,255,0.85)", fontSize: "0.76rem",
                    fontFamily: "'HarmonyOS Sans', sans-serif", colorScheme: "dark",
                  }}
                />
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      }
    >
      <DeadlineWidget id={item.id} title={item.title} targetAt={item.targetAt} color={item.color} />
    </DraggableWidget>
  );
}
