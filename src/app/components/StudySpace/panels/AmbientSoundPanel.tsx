import { useState, useEffect, useRef, useCallback } from "react";
import { Box, Flex, Text, Spinner } from "@chakra-ui/react";
import { motion, AnimatePresence } from "motion/react";
import { useTranslation } from "react-i18next";
import { Music2, AudioWaveform, Music } from "lucide-react";
import { PanelCloseBtn } from "../ui/PanelCloseBtn";
import { useCenteredPanel } from "../hooks/useCenteredPanel";
import {
  adminAssetsService,
  type AssetDto,
} from "../../../../services/admin/assets.admin.service";

const MotionBox = motion.create(Box);
const MotionDiv = motion.div;

/* ── Color helpers ─────────────────────────────────────────────────────────── */
const CATEGORY_COLOR_MAP: Record<string, string> = {
  cafe: "#fb923c",
  coffee: "#fb923c",
  rain: "#60a5fa",
  nature: "#4ade80",
  forest: "#22c55e",
  rainforest: "#22c55e",
  ocean: "#38bdf8",
  beach: "#fbbf24",
  fire: "#f97316",
  fireplace: "#f97316",
  wind: "#a3e635",
  thunder: "#818cf8",
  storm: "#818cf8",
  city: "#a78bfa",
  street: "#a78bfa",
  birds: "#4ade80",
  lofi: "#c084fc",
  study: "#c084fc",
  white: "#94a3b8",
  noise: "#94a3b8",
  water: "#22d3ee",
  waterfall: "#22d3ee",
  creek: "#34d399",
  underwater: "#38bdf8",
};
const FALLBACK_COLORS = [
  "#60a5fa", "#4ade80", "#fb923c", "#a78bfa",
  "#fbbf24", "#22d3ee", "#f87171", "#34d399",
];

function resolveColor(category: string | null, idx: number): string {
  if (category) {
    const lower = category.toLowerCase();
    for (const [key, color] of Object.entries(CATEGORY_COLOR_MAP)) {
      if (lower.includes(key)) return color;
    }
  }
  return FALLBACK_COLORS[idx % FALLBACK_COLORS.length];
}

/* ── Animated waveform indicator ─────────────────────────────────────────── */
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

/* ── Individual sound card ───────────────────────────────────────────────── */
function SoundCard({
  label, color, isOn, volume, onToggle, onVolume,
}: {
  label: string; color: string;
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
        background: isOn
          ? `linear-gradient(145deg, ${color}38 0%, rgba(8,18,14,0.96) 65%)`
          : `linear-gradient(145deg, ${color}14 0%, rgba(8,18,14,0.92) 65%)`,
      }}
      _hover={{ transform: "scale(1.03)" } as any}
    >
      {/* Dot-grid texture */}
      <Box
        position="absolute"
        inset={0}
        style={{
          backgroundImage: `radial-gradient(circle, ${color}22 1px, transparent 1px)`,
          backgroundSize: "18px 18px",
          opacity: isOn ? 0.9 : 0.45,
          transition: "opacity 0.25s",
        }}
      />

      {/* Decorative music icon top-right */}
      <Box
        position="absolute"
        top="10px"
        right="10px"
        style={{ opacity: isOn ? 0.6 : 0.2, transition: "opacity 0.2s" }}
      >
        <Music size={18} style={{ color }} />
      </Box>

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
                onChange={(e) => {
                  e.stopPropagation();
                  onVolume(Number(e.target.value));
                }}
                style={{
                  width: "100%", height: 3, borderRadius: 4,
                  appearance: "none", WebkitAppearance: "none",
                  background: `linear-gradient(to right, ${color} ${volume}%, rgba(255,255,255,0.22) ${volume}%)`,
                  outline: "none", cursor: "pointer", display: "block",
                }}
              />
            </MotionBox>
          )}
        </AnimatePresence>

        <Flex align="center" justify="space-between">
          <Text style={{
            fontSize: "0.78rem", fontWeight: 500,
            color: isOn ? "white" : "rgba(255,255,255,0.72)",
            fontFamily: "'HarmonyOS Sans', sans-serif",
            textShadow: "0 1px 6px rgba(0,0,0,0.7)",
            letterSpacing: "0.01em",
            maxWidth: "70%", overflow: "hidden",
            textOverflow: "ellipsis", whiteSpace: "nowrap",
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

/* ── Main panel ─────────────────────────────────────────────────────────── */
export function AmbientSoundPanel({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation();
  const { x, y, ref } = useCenteredPanel(548, 560);

  const [sounds,  setSounds]  = useState<AssetDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);
  const [active,  setActive]  = useState<boolean[]>([]);
  const [volumes, setVolumes] = useState<number[]>([]);

  const audioMapRef = useRef<Map<string, HTMLAudioElement>>(new Map());

  /* ── Fetch audio assets ── */
  const fetchSounds = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await adminAssetsService.getAssets("Audio");
      setSounds(result);
      setActive(result.map(() => false));
      setVolumes(result.map((s) => s.defaultVolume ?? 50));
    } catch {
      setError(t("ambient.loadError", "Failed to load sounds"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => { fetchSounds(); }, [fetchSounds]);

  /* ── Cleanup audio on unmount ── */
  useEffect(() => {
    return () => {
      audioMapRef.current.forEach((audio) => {
        audio.pause();
        audio.src = "";
      });
      audioMapRef.current.clear();
    };
  }, []);

  /* ── Sync audio play/pause with active state ── */
  useEffect(() => {
    sounds.forEach((sound, i) => {
      if (!sound.url) return;
      let audio = audioMapRef.current.get(sound.id);
      if (active[i]) {
        if (!audio) {
          audio = new Audio(sound.url);
          audio.loop = true;
          audioMapRef.current.set(sound.id, audio);
        }
        audio.volume = (volumes[i] ?? 50) / 100;
        audio.play().catch(() => {/* autoplay blocked */});
      } else if (audio) {
        audio.pause();
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, sounds]);

  /* ── Sync volume ── */
  useEffect(() => {
    sounds.forEach((sound, i) => {
      const audio = audioMapRef.current.get(sound.id);
      if (audio) audio.volume = (volumes[i] ?? 50) / 100;
    });
  }, [volumes, sounds]);

  /* ── Handlers ── */
  const toggle = (i: number) =>
    setActive((a) => a.map((v, j) => (j === i ? !v : v)));

  const setVol = (i: number, val: number) =>
    setVolumes((v) => v.map((n, j) => (j === i ? val : n)));

  /* ── Derived ── */
  const activeSounds  = sounds.filter((_, i) => active[i]);
  const activeCount   = activeSounds.length;
  const mixLabel      = activeSounds.slice(0, 3).map((s) => s.name ?? "").join(" · ");

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
            fontSize: "0.7rem", color: "rgba(255,255,255,0.32)",
            letterSpacing: "0.1em", fontFamily: "'HarmonyOS Sans', sans-serif",
          }}>
            {t("ambient.title")}
          </Text>
          {activeCount > 0 && (
            <Box ml="auto" style={{
              fontSize: "0.62rem", color: "rgba(74,222,128,0.75)",
              background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.2)",
              borderRadius: "20px", padding: "2px 9px",
              fontFamily: "'HarmonyOS Sans', sans-serif", letterSpacing: "0.06em",
            }}>
              {activeCount} {activeCount === 1 ? "layer" : "layers"}
            </Box>
          )}
        </Flex>

        {/* ── Content ── */}
        <Box style={{ flex: 1, overflowY: "auto", overflowX: "hidden", marginRight: -4, paddingRight: 4 }}>
          {loading ? (
            <Flex align="center" justify="center" style={{ height: "100%" }} gap={3}>
              <Spinner size="sm" style={{ color: "#4ade80" }} />
              <Text style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.35)", fontFamily: "'HarmonyOS Sans', sans-serif" }}>
                Loading sounds…
              </Text>
            </Flex>
          ) : error ? (
            <Flex direction="column" align="center" justify="center" style={{ height: "100%" }} gap={3}>
              <Text style={{ fontSize: "0.82rem", color: "rgba(248,113,113,0.8)", fontFamily: "'HarmonyOS Sans', sans-serif" }}>
                {error}
              </Text>
              <Box
                as="button"
                onClick={fetchSounds}
                style={{
                  background: "transparent", border: "1px solid rgba(78,124,106,0.4)",
                  borderRadius: 8, padding: "6px 16px", cursor: "pointer",
                  fontSize: "0.78rem", color: "#4ade80", fontFamily: "'HarmonyOS Sans', sans-serif",
                }}
              >
                Retry
              </Box>
            </Flex>
          ) : sounds.length === 0 ? (
            <Flex align="center" justify="center" style={{ height: "100%" }}>
              <Text style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.28)", fontFamily: "'HarmonyOS Sans', sans-serif" }}>
                No audio assets found
              </Text>
            </Flex>
          ) : (
            <Box display="grid" style={{ gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
              {sounds.map((s, i) => (
                <SoundCard
                  key={s.id}
                  label={s.name ?? ""}
                  color={resolveColor(s.category, i)}
                  isOn={active[i] ?? false}
                  volume={volumes[i] ?? 50}
                  onToggle={() => toggle(i)}
                  onVolume={(v) => setVol(i, v)}
                />
              ))}
            </Box>
          )}
        </Box>

        {/* ── Now mixing footer ── */}
        <Box
          mt={3} flexShrink={0} borderRadius="12px" px="14px" py="10px"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
        >
          {activeCount > 0 ? (
            <Flex align="center" gap={3}>
              <Flex borderRadius="full" align="center" justify="center" flexShrink={0}
                style={{ width: 30, height: 30, background: "linear-gradient(135deg,#4ade80,#38bdf8)" }}>
                <Music2 size={13} style={{ color: "#0a0f14" }} />
              </Flex>
              <Box flex={1} minW={0}>
                <Text style={{
                  fontSize: "0.77rem", color: "rgba(255,255,255,0.82)",
                  fontFamily: "'HarmonyOS Sans', sans-serif",
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
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
              <Flex borderRadius="full" align="center" justify="center" flexShrink={0}
                style={{ width: 30, height: 30, background: "rgba(255,255,255,0.05)" }}>
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
