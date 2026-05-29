import { useState } from "react";
import { Box, Flex, Text } from "@chakra-ui/react";
import { motion, AnimatePresence } from "motion/react";
import { useTranslation } from "react-i18next";
import { Music2, AudioWaveform } from "lucide-react";
import { PanelCloseBtn } from "../ui/PanelCloseBtn";
import { useCenteredPanel } from "../hooks/useCenteredPanel";

const MotionBox = motion.create(Box);
const MotionDiv = motion.div;

/* ── Sound definitions ──────────────────────────────────────────────────────── */
const SOUNDS_DATA = [
  { key: "underwater", color: "#38bdf8", imgId: "1559827260-dc66d52bef19", vol: 0,  on: false },
  { key: "fireplace",  color: "#f97316", imgId: "1481671836-1eb03bae46ea", vol: 50, on: false },
  { key: "birds",      color: "#4ade80", imgId: "1444464666168-49d633b86797", vol: 55, on: false },
  { key: "rain",       color: "#60a5fa", imgId: "1428592953211-077101b2021b", vol: 80, on: true  },
  { key: "creek",      color: "#34d399", imgId: "1506905925346-21bda4d32df4", vol: 0,  on: false },
  { key: "rainforest", color: "#22c55e", imgId: "1766910095060-03115e07bbc7", vol: 55, on: true  },
  { key: "cityStreet", color: "#a78bfa", imgId: "1477959858617-67f85cf4f1df", vol: 0,  on: false },
  { key: "wind",       color: "#a3e635", imgId: "1500382017468-9049fed747ef", vol: 20, on: false },
  { key: "whiteNoise", color: "#94a3b8", imgId: "1558591710-4b4a1ae0f04d", vol: 0,  on: false },
  { key: "beach",      color: "#fbbf24", imgId: "1599514724006-daebc8dca239", vol: 0,  on: false },
  { key: "cafe",       color: "#fb923c", imgId: "1495474472287-4d71bcdd2085", vol: 65, on: true  },
  { key: "thunder",    color: "#818cf8", imgId: "1516912481808-3406841bd33c", vol: 0,  on: false },
  { key: "waterfall",  color: "#22d3ee", imgId: "1497290756760-23ac55edf36f", vol: 0,  on: false },
  { key: "ocean",      color: "#38bdf8", imgId: "1505118380757-91f5f5632de0", vol: 40, on: false },
];

const thumb = (id: string) =>
  `https://images.unsplash.com/photo-${id}?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=75&w=280&h=210`;

/* ── Animated waveform indicator ─────────────────────────────────────────────── */
function WaveIndicator({ color }: { color: string }) {
  return (
    <Flex align="flex-end" gap="2px" style={{ height: 14 }}>
      {[3, 5, 4, 7, 4, 5, 3].map((h, i) => (
        <MotionDiv
          key={i}
          style={{ width: 2.5, borderRadius: 1.5, background: color }}
          animate={{ height: [h * 1.4, h * 2.6, h * 1.2, h * 2.2, h * 1.4] }}
          transition={{ repeat: Infinity, duration: 0.78 + i * 0.09, ease: "easeInOut" }}
        />
      ))}
    </Flex>
  );
}

/* ── Individual sound card ───────────────────────────────────────────────────── */
function SoundCard({
  label, color, imgId, isOn, volume, onToggle, onVolume,
}: {
  label: string; color: string; imgId: string;
  isOn: boolean; volume: number;
  onToggle: () => void; onVolume: (v: number) => void;
}) {
  return (
    <Box
      as="button"
      onClick={onToggle}
      position="relative"
      overflow="hidden"
      borderRadius="12px"
      style={{
        height: 165,
        cursor: "pointer",
        border: `2px solid ${isOn ? color : "transparent"}`,
        boxShadow: isOn ? `0 0 18px ${color}55` : "none",
        outline: "none",
        transition: "border-color 0.2s, box-shadow 0.2s, transform 0.15s",
        display: "block",
        width: "100%",
        padding: 0,
        background: "#0a1410",
      }}
      _hover={{ transform: "scale(1.03)" } as any}
    >
      {/* Background image */}
      <Box
        as="img"
        src={thumb(imgId)}
        alt={label}
        position="absolute"
        inset={0}
        w="100%"
        h="100%"
        style={{
          objectFit: "cover",
          transition: "filter 0.25s",
          filter: isOn ? "brightness(0.9) saturate(1.1)" : "brightness(0.62) saturate(0.85)",
        }}
      />

      {/* Gradient overlay — bottom-heavy */}
      <Box
        position="absolute"
        inset={0}
        style={{
          background: isOn
            ? "linear-gradient(to top, rgba(0,0,0,0.82) 40%, rgba(0,0,0,0.1) 100%)"
            : "linear-gradient(to top, rgba(0,0,0,0.72) 40%, rgba(0,0,0,0.18) 100%)",
        }}
      />

      {/* Bottom content */}
      <Flex
        position="absolute"
        bottom={0}
        left={0}
        right={0}
        direction="column"
        px="10px"
        pb="10px"
        gap="6px"
      >
        {/* Volume slider — visible only when active */}
        <AnimatePresence>
          {isOn && (
            <MotionBox
              key="slider"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              transition={{ duration: 0.16 } as any}
            >
              <input
                type="range"
                min={0}
                max={100}
                value={volume}
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => { e.stopPropagation(); onVolume(Number(e.target.value)); }}
                style={{
                  width: "100%",
                  height: 3,
                  borderRadius: 4,
                  appearance: "none",
                  WebkitAppearance: "none",
                  background: `linear-gradient(to right, ${color} ${volume}%, rgba(255,255,255,0.22) ${volume}%)`,
                  outline: "none",
                  cursor: "pointer",
                  display: "block",
                }}
              />
            </MotionBox>
          )}
        </AnimatePresence>

        {/* Label row */}
        <Flex align="center" justify="space-between">
          <Text style={{
            fontSize: "0.78rem",
            fontWeight: 500,
            color: isOn ? "white" : "rgba(255,255,255,0.72)",
            fontFamily: "'HarmonyOS Sans', sans-serif",
            textShadow: "0 1px 6px rgba(0,0,0,0.7)",
            letterSpacing: "0.01em",
          }}>
            {label}
          </Text>
          <AnimatePresence>
            {isOn && (
              <MotionBox
                key="wave"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.15 } as any}
              >
                <WaveIndicator color={color} />
              </MotionBox>
            )}
          </AnimatePresence>
        </Flex>
      </Flex>
    </Box>
  );
}

/* ── Main panel ─────────────────────────────────────────────────────────────── */
export function AmbientSoundPanel({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation();
  const { x, y, ref } = useCenteredPanel(548, 560);

  const [active,  setActive]  = useState(SOUNDS_DATA.map((s) => s.on));
  const [volumes, setVolumes] = useState(SOUNDS_DATA.map((s) => s.vol));

  const toggle  = (i: number) => setActive((a) => a.map((v, j) => j === i ? !v : v));
  const setVol  = (i: number, val: number) => setVolumes((v) => v.map((n, j) => j === i ? val : n));

  const activeList  = SOUNDS_DATA.filter((_, i) => active[i]);
  const activeCount = activeList.length;
  const mixLabel    = activeList.slice(0, 3).map((s) => t(`ambient.${s.key}`)).join(" · ");

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
        width: 548,
        height: 560,
        borderRadius: "18px",
        background: "rgba(10,16,14,0.88)",
        backdropFilter: "blur(22px)",
        WebkitBackdropFilter: "blur(22px)",
        border: "1px solid rgba(255,255,255,0.09)",
        boxShadow: "0 28px 90px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.06)",
        cursor: "grab",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <Box position="relative" style={{ padding: "18px 18px 16px", display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
        <PanelCloseBtn onClose={onClose} />

        {/* ── Header ── */}
        <Flex align="center" gap={2} mb={4} pr="50px">
          <AudioWaveform size={15} style={{ color: "rgba(255,255,255,0.45)" }} />
          <Text style={{
            fontSize: "0.7rem",
            color: "rgba(255,255,255,0.32)",
            letterSpacing: "0.1em",
            fontFamily: "'HarmonyOS Sans', sans-serif",
          }}>
            {t("ambient.title")}
          </Text>
          {activeCount > 0 && (
            <Box
              ml="auto"
              style={{
                fontSize: "0.62rem",
                color: "rgba(74,222,128,0.75)",
                background: "rgba(74,222,128,0.1)",
                border: "1px solid rgba(74,222,128,0.2)",
                borderRadius: "20px",
                padding: "2px 9px",
                fontFamily: "'HarmonyOS Sans', sans-serif",
                letterSpacing: "0.06em",
              }}
            >
              {activeCount} {activeCount === 1 ? "layer" : "layers"}
            </Box>
          )}
        </Flex>

        {/* ── Image card grid — 3 columns, scrollable ── */}
        <Box
          style={{
            flex: 1,
            overflowY: "auto",
            overflowX: "hidden",
            marginRight: -4,
            paddingRight: 4,
          }}
        >
          <Box
            display="grid"
            style={{ gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}
          >
            {SOUNDS_DATA.map((s, i) => (
              <SoundCard
                key={s.key}
                label={t(`ambient.${s.key}`)}
                color={s.color}
                imgId={s.imgId}
                isOn={active[i]}
                volume={volumes[i]}
                onToggle={() => toggle(i)}
                onVolume={(v) => setVol(i, v)}
              />
            ))}
          </Box>
        </Box>

        {/* ── Now mixing footer ── */}
        <Box
          mt={3}
          flexShrink={0}
          borderRadius="12px"
          px="14px"
          py="10px"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.07)",
          }}
        >
          {activeCount > 0 ? (
            <Flex align="center" gap={3}>
              <Flex
                borderRadius="full"
                align="center"
                justify="center"
                flexShrink={0}
                style={{ width: 30, height: 30, background: "linear-gradient(135deg,#4ade80,#38bdf8)" }}
              >
                <Music2 size={13} style={{ color: "#0a0f14" }} />
              </Flex>
              <Box flex={1} minW={0}>
                <Text style={{
                  fontSize: "0.77rem",
                  color: "rgba(255,255,255,0.82)",
                  fontFamily: "'HarmonyOS Sans', sans-serif",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}>
                  {mixLabel}{activeCount > 3 ? ` +${activeCount - 3}` : ""}
                </Text>
                <Text style={{ fontSize: "0.68rem", color: "rgba(74,222,128,0.5)", fontFamily: "'HarmonyOS Sans', sans-serif" }}>
                  {t("ambient.layersActive", { count: activeCount })}
                </Text>
              </Box>
              <WaveIndicator color="#4ade80" />
            </Flex>
          ) : (
            <Flex align="center" gap={3}>
              <Flex
                borderRadius="full" align="center" justify="center" flexShrink={0}
                style={{ width: 30, height: 30, background: "rgba(255,255,255,0.05)" }}
              >
                <Music2 size={13} style={{ color: "rgba(255,255,255,0.2)" }} />
              </Flex>
              <Text style={{ fontSize: "0.77rem", color: "rgba(255,255,255,0.28)", fontFamily: "'HarmonyOS Sans', sans-serif" }}>
                {t("ambient.noSounds")}
              </Text>
            </Flex>
          )}
        </Box>
      </Box>
    </MotionBox>
  );
}
