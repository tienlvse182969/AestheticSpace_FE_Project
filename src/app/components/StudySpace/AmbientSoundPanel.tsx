import { useState } from "react";
import { Box, Flex, Text } from "@chakra-ui/react";
import { motion, AnimatePresence } from "motion/react";
import { useTranslation } from "react-i18next";
import { Coffee, Waves, Wind, TreePine, Music2, CloudRain, Flame, Radio, Check, AudioWaveform } from "lucide-react";
import { PanelCloseBtn } from "./PanelCloseBtn";
import { useCenteredPanel } from "./useCenteredPanel";

const MotionBox  = motion.create(Box);
const MotionDiv  = motion.div;

const SOUNDS_BASE = [
  { icon: Coffee,    key: "cafe",       color: "#fb923c", vol: 65, active: true  },
  { icon: CloudRain, key: "rain",       color: "#60a5fa", vol: 80, active: true  },
  { icon: Waves,     key: "ocean",      color: "#38bdf8", vol: 40, active: false },
  { icon: TreePine,  key: "forest",     color: "#4ade80", vol: 55, active: true  },
  { icon: Wind,      key: "wind",       color: "#a3e635", vol: 20, active: false },
  { icon: Flame,     key: "fireplace",  color: "#f97316", vol: 50, active: false },
  { icon: Music2,    key: "lofi",       color: "#c084fc", vol: 85, active: false },
  { icon: Radio,     key: "whiteNoise", color: "#94a3b8", vol: 0,  active: false },
];

/* ── Animated mini waveform ── */
function WaveBar({ color, active }: { color: string; active: boolean }) {
  const heights = [4, 7, 5, 9, 6, 8, 4, 6];
  return (
    <Flex align="flex-end" gap="2px" style={{ height: 18 }}>
      {heights.map((h, i) =>
        active ? (
          <MotionDiv
            key={i}
            style={{ width: 3, borderRadius: 2, background: color }}
            animate={{ height: [h * 1.6, h * 2.8, h * 1.2, h * 2.2, h * 1.6] }}
            transition={{ repeat: Infinity, duration: 0.85 + i * 0.09, ease: "easeInOut" }}
          />
        ) : (
          <Box
            key={i}
            style={{ width: 3, height: `${30 + i * 7}%`, borderRadius: 2, background: "rgba(255,255,255,0.1)" }}
          />
        )
      )}
    </Flex>
  );
}

export function AmbientSoundPanel({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation();
  const sw = typeof window !== "undefined" ? window.innerWidth  : 1440;
  const sh = typeof window !== "undefined" ? window.innerHeight : 900;
  const { x, y, ref } = useCenteredPanel(390);

  const SOUNDS = SOUNDS_BASE.map(s => ({ ...s, label: t(`ambient.${s.key}`) }));
  const [active,  setActive]  = useState(SOUNDS_BASE.map((s) => s.active));
  const [volumes, setVolumes] = useState(SOUNDS_BASE.map((s) => s.vol));

  const toggle = (i: number) =>
    setActive((a) => a.map((v, j) => (j === i ? !v : v)));

  const setVol = (i: number, val: number) =>
    setVolumes((v) => v.map((n, j) => (j === i ? val : n)));

  const activeList = SOUNDS.filter((_, i) => active[i]);
  const activeCount = activeList.length;
  const mixLabel = activeList.slice(0, 3).map((s) => s.label).join(" + ");

  return (
    <MotionBox
      ref={ref as any}
      drag
      dragMomentum={false}
      dragElastic={0}
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1, transition: { type: "spring", stiffness: 500, damping: 24, mass: 0.9 } } as any}
      exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.14, ease: [0.4, 0, 1, 1] } } as any}
      position="fixed"
      top={0}
      left={0}
      zIndex={50}
      style={{
        x, y,
        width: 390,
        borderRadius: "16px",
        background: "rgba(12,18,22,0.75)",
        backdropFilter: "blur(18px)",
        WebkitBackdropFilter: "blur(18px)",
        border: "1px solid rgba(255,255,255,0.1)",
        boxShadow: "0 24px 80px rgba(0,0,0,0.75), 0 0 0 1px rgba(255,255,255,0.08)",
        cursor: "grab",
      }}
    >
      <Box position="relative" style={{ padding: "18px 18px 18px" }}>
        <PanelCloseBtn onClose={onClose} />

        {/* ── Header ── */}
        <Flex align="center" gap={2} mb={4}>
          <AudioWaveform size={15} style={{ color: "rgba(255,255,255,0.5)" }} />
          <Text style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.35)", letterSpacing: "0.1em", fontFamily: "'HarmonyOS Sans', sans-serif" }}>
            {t("ambient.title")}
          </Text>
        </Flex>

        <Text mb={3} style={{ fontSize: "0.72rem", color: "rgba(94,234,212,0.6)", letterSpacing: "0.09em", fontFamily: "'HarmonyOS Sans', sans-serif", textAlign: "center" }}>
          {t("ambient.subtitle")}
        </Text>

        {/* ── Sound cards grid ── */}
        <Box display="grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {SOUNDS.map((s, i) => {
            const Icon = s.icon;
            const isOn = active[i];
            return (
              <Box
                key={s.label}
                as="button"
                onClick={() => toggle(i)}
                borderRadius="12px"
                p="10px 12px 10px"
                textAlign="left"
                style={{
                  background: isOn
                    ? `linear-gradient(135deg, ${s.color}1a, ${s.color}0a)`
                    : "rgba(255,255,255,0.03)",
                  border: `1px solid ${isOn ? s.color + "45" : "rgba(255,255,255,0.07)"}`,
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
                _hover={{ transform: "scale(1.02)" } as any}
              >
                {/* Row: icon + label + check */}
                <Flex align="center" justify="space-between" mb="8px">
                  <Flex align="center" gap={2}>
                    <Icon size={13} style={{ color: isOn ? s.color : "rgba(255,255,255,0.3)" }} />
                    <Text style={{ fontSize: "0.78rem", color: isOn ? "rgba(255,255,255,0.88)" : "rgba(255,255,255,0.35)", fontFamily: "'HarmonyOS Sans', sans-serif" }}>
                      {s.label}
                    </Text>
                  </Flex>
                  <Flex
                    borderRadius="full"
                    align="center"
                    justify="center"
                    flexShrink={0}
                    style={{
                      width: 16, height: 16,
                      background: isOn ? s.color : "rgba(255,255,255,0.08)",
                      transition: "background 0.2s",
                    }}
                  >
                    <AnimatePresence>
                      {isOn && (
                        <MotionBox
                          initial={{ opacity: 0, scale: 0.6 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.6 }}
                          transition={{ duration: 0.15 } as any}
                          display="flex" alignItems="center" justifyContent="center"
                        >
                          <Check size={9} style={{ color: "#0a0f14" }} strokeWidth={3} />
                        </MotionBox>
                      )}
                    </AnimatePresence>
                  </Flex>
                </Flex>

                {/* Volume bar */}
                <WaveBar color={s.color} active={isOn} />

                {/* Volume slider (only when active) */}
                <AnimatePresence>
                  {isOn && (
                    <MotionBox
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.18 } as any}
                      overflow="hidden"
                    >
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={volumes[i]}
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => { e.stopPropagation(); setVol(i, Number(e.target.value)); }}
                        style={{
                          marginTop: 8,
                          width: "100%",
                          height: 3,
                          borderRadius: 4,
                          appearance: "none",
                          WebkitAppearance: "none",
                          background: `linear-gradient(to right, ${s.color} ${volumes[i]}%, rgba(255,255,255,0.1) ${volumes[i]}%)`,
                          outline: "none",
                          cursor: "pointer",
                        }}
                      />
                    </MotionBox>
                  )}
                </AnimatePresence>
              </Box>
            );
          })}
        </Box>

        {/* ── Now mixing footer ── */}
        <Box mt={3} borderRadius="12px" p="10px 12px"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
        >
          {activeCount > 0 ? (
            <Flex align="center" gap={2}>
              <Flex
                borderRadius="full"
                align="center"
                justify="center"
                flexShrink={0}
                style={{ width: 30, height: 30, background: "linear-gradient(135deg, #4ade80, #38bdf8)" }}
              >
                <Music2 size={13} style={{ color: "#0a0f14" }} />
              </Flex>
              <Box flex={1} minW={0}>
                <Text style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.82)", fontFamily: "'HarmonyOS Sans', sans-serif", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {t("ambient.nowMixing", { label: mixLabel + (activeCount > 3 ? ` +${activeCount - 3}` : "") })}
                </Text>
                <Text style={{ fontSize: "0.7rem", color: "rgba(94,234,212,0.5)", fontFamily: "'HarmonyOS Sans', sans-serif" }}>
                  {t("ambient.layersActive", { count: activeCount })}
                </Text>
              </Box>
              {/* Animated bars */}
              <Flex align="flex-end" gap="2px" style={{ height: 20 }}>
                {[4, 7, 5, 9, 6, 8, 4, 7].map((h, i) => (
                  <MotionDiv
                    key={i}
                    style={{ width: 3, borderRadius: 2, background: "#4ade80" }}
                    animate={{ height: [h * 1.6, h * 2.8, h * 1.2, h * 2.4, h * 1.6] }}
                    transition={{ repeat: Infinity, duration: 0.8 + i * 0.1, ease: "easeInOut" }}
                  />
                ))}
              </Flex>
            </Flex>
          ) : (
            <Flex align="center" gap={2}>
              <Flex
                borderRadius="full" align="center" justify="center" flexShrink={0}
                style={{ width: 30, height: 30, background: "rgba(255,255,255,0.06)" }}
              >
                <Music2 size={13} style={{ color: "rgba(255,255,255,0.25)" }} />
              </Flex>
              <Text style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.3)", fontFamily: "'HarmonyOS Sans', sans-serif" }}>
                {t("ambient.noSounds")}
              </Text>
            </Flex>
          )}
        </Box>
      </Box>
    </MotionBox>
  );
}