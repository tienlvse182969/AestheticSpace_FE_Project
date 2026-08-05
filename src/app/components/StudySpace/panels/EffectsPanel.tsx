import { useEffect, useRef } from "react";
import { Box, Flex, Text } from "@chakra-ui/react";
import { motion } from "motion/react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  AlertTriangle, Cloud, CloudLightning, CloudRain, CloudSnow,
  Droplets, Flame, Flower2, Leaf, Loader2, MapPin,
  Sparkle, Sparkles, Star, Wand2, Wind, X,
} from "lucide-react";
import { PanelCloseBtn } from "../ui/PanelCloseBtn";
import { useCenteredPanel } from "../hooks/useCenteredPanel";
import type { WeatherSyncError } from "../../../hooks/studyspace/useWeatherEffect";

const MotionBox = motion.create(Box);

export type EffectType =
  | "rain" | "snow" | "fog" | "stars"
  | "fireflies" | "autumn-leaves" | "cherry-blossom" | "lightning"
  | "bubbles" | "meteor-shower" | "confetti"
  | null;

interface EffectsConfig {
  key: EffectType;
  icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>;
  color: string;
}

const EFFECTS: EffectsConfig[] = [
  { key: "rain",          icon: CloudRain,      color: "#60a5fa" },
  { key: "snow",          icon: CloudSnow,      color: "#e2e8f0" },
  { key: "fog",           icon: Wind,           color: "#a0aec0" },
  { key: "stars",         icon: Star,           color: "#fde68a" },
  { key: "fireflies",     icon: Sparkles,       color: "#86efac" },
  { key: "autumn-leaves", icon: Leaf,           color: "#fb923c" },
  { key: "cherry-blossom",icon: Flower2,        color: "#f9a8d4" },
  { key: "lightning",     icon: CloudLightning, color: "#c4b5fd" },
  { key: "bubbles",       icon: Droplets,       color: "#93c5fd" },
  { key: "meteor-shower", icon: Flame,          color: "#fbbf24" },
  { key: "confetti",      icon: Sparkle,        color: "#f472b6" },
];

interface EffectsPanelProps {
  activeEffect: EffectType;
  onSelect: (e: EffectType) => void;
  onClose: () => void;
  weatherSyncEnabled: boolean;
  onToggleWeatherSync: () => void;
  weatherLoading: boolean;
  weatherError: WeatherSyncError;
  weatherLocation: string | null;
}

const LEAF_COLORS_PREVIEW = ["#fb923c", "#ef4444", "#facc15", "#f97316", "#dc2626"];

/* ── Mini animated preview for each effect (36 × 28 px) ── */
function EffectPreview({ effectKey, color, active }: { effectKey: EffectType; color: string; active: boolean }) {
  const W = 36, H = 28;
  const dim = active ? color : "rgba(255,255,255,0.1)";

  /* ------- RAIN ------- */
  if (effectKey === "rain") return (
    <Box position="relative" style={{ width: W, height: H, overflow: "hidden" }}>
      {[...Array(6)].map((_, i) => (
        <Box key={i} position="absolute" style={{
          width: 1, height: 8, borderRadius: 1,
          background: dim,
          top: `${(i * 14) % H}px`, left: `${i * 6}px`,
          animation: active ? `rfPreview ${0.5 + i * 0.08}s linear infinite` : "none",
          animationDelay: `${i * 0.07}s`,
        }} />
      ))}
      <style>{`@keyframes rfPreview{from{transform:translateY(-8px) translateX(-2px);opacity:.8}to{transform:translateY(${H}px) translateX(-4px);opacity:0}}`}</style>
    </Box>
  );

  /* ------- SNOW ------- */
  if (effectKey === "snow") return (
    <Box position="relative" style={{ width: W, height: H, overflow: "hidden" }}>
      {[...Array(8)].map((_, i) => (
        <Box key={i} position="absolute" borderRadius="full" style={{
          width: 2.5, height: 2.5, background: dim,
          top: `${(i * 10) % H}px`, left: `${i * 5}px`,
          animation: active ? `sfPreview ${1.2 + i * 0.15}s linear infinite` : "none",
          animationDelay: `${i * 0.1}s`,
        }} />
      ))}
      <style>{`@keyframes sfPreview{0%{transform:translateY(-3px) translateX(0);opacity:.9}50%{transform:translateY(14px) translateX(2px);opacity:.7}100%{transform:translateY(${H + 2}px) translateX(-2px);opacity:0}}`}</style>
    </Box>
  );

  /* ------- FOG ------- */
  if (effectKey === "fog") return (
    <Box position="relative" style={{ width: W, height: H, overflow: "hidden" }}>
      {[...Array(3)].map((_, i) => (
        <Box key={i} position="absolute" borderRadius="full" style={{
          width: 28, height: 7, filter: "blur(4px)",
          background: active ? `rgba(160,174,192,${0.18 - i * 0.04})` : "rgba(255,255,255,0.04)",
          top: `${5 + i * 8}px`, left: "-6px",
          animation: active ? `fogP ${2.5 + i * 0.8}s linear infinite` : "none",
          animationDelay: `${i * 0.7}s`,
        }} />
      ))}
      <style>{`@keyframes fogP{from{transform:translateX(-10px)}to{transform:translateX(${W + 10}px)}}`}</style>
    </Box>
  );

  /* ------- STARS ------- */
  if (effectKey === "stars") return (
    <Box position="relative" style={{ width: W, height: H, overflow: "hidden" }}>
      {[...Array(8)].map((_, i) => (
        <Box key={i} position="absolute" borderRadius="full" style={{
          width: i % 3 === 0 ? 2.5 : 1.5, height: i % 3 === 0 ? 2.5 : 1.5,
          background: dim,
          top: `${(i * 7 + 3) % H}px`, left: `${(i * 5 + 2) % W}px`,
          animation: active ? `stP ${0.8 + i * 0.3}s ease-in-out infinite alternate` : "none",
          animationDelay: `${i * 0.15}s`,
        }} />
      ))}
      <style>{`@keyframes stP{from{opacity:.1}to{opacity:.95}}`}</style>
    </Box>
  );

  /* ------- FIREFLIES ------- */
  if (effectKey === "fireflies") return (
    <Box position="relative" style={{ width: W, height: H, overflow: "hidden" }}>
      {[...Array(5)].map((_, i) => (
        <Box key={i} position="absolute" borderRadius="full" style={{
          width: 3, height: 3, background: dim,
          boxShadow: active ? `0 0 5px ${color}` : "none",
          top: `${(i * 6 + 4) % (H - 4)}px`, left: `${(i * 7 + 2) % (W - 4)}px`,
          animation: active ? `ffP ${0.9 + i * 0.35}s ease-in-out infinite alternate` : "none",
          animationDelay: `${i * 0.2}s`,
        }} />
      ))}
      <style>{`@keyframes ffP{from{opacity:.1;transform:translate(0,0)}to{opacity:.95;transform:translate(2px,-2px)}}`}</style>
    </Box>
  );

  /* ------- AUTUMN LEAVES ------- */
  if (effectKey === "autumn-leaves") return (
    <Box position="relative" style={{ width: W, height: H, overflow: "hidden" }}>
      {[...Array(5)].map((_, i) => (
        <Box key={i} position="absolute" style={{
          width: 7, height: 10,
          background: active ? LEAF_COLORS_PREVIEW[i] : "rgba(255,255,255,0.08)",
          // Leaf shape: pointed top & bottom, curved sides via border-radius
          borderRadius: "50% 50% 50% 50% / 60% 60% 40% 40%",
          transform: `rotate(${i * 18 - 20}deg)`,
          top: `${(i * 6 + 1) % (H - 10)}px`, left: `${i * 7 + 2}px`,
          animation: active ? `lfP ${1.0 + i * 0.22}s linear infinite` : "none",
          animationDelay: `${i * 0.2}s`,
        }} />
      ))}
      <style>{`@keyframes lfP{0%{transform:translateY(-4px) rotate(0deg);opacity:.9}100%{transform:translateY(${H + 4}px) rotate(160deg);opacity:0}}`}</style>
    </Box>
  );

  /* ------- CHERRY BLOSSOM ------- */
  if (effectKey === "cherry-blossom") return (
    <Box position="relative" style={{ width: W, height: H, overflow: "hidden" }}>
      {[...Array(6)].map((_, i) => (
        <Box key={i} position="absolute" style={{
          width: 5, height: 7,
          background: dim,
          // Petal: wider at top, slight point at bottom, rounded top
          borderRadius: "50% 50% 35% 35% / 55% 55% 45% 45%",
          top: `${(i * 5 + 1) % H}px`, left: `${i * 6 + 1}px`,
          animation: active ? `pbP ${1.3 + i * 0.18}s linear infinite` : "none",
          animationDelay: `${i * 0.15}s`,
        }} />
      ))}
      <style>{`@keyframes pbP{0%{transform:translateY(-3px) rotate(0deg);opacity:.9}50%{transform:translateY(14px) translateX(3px) rotate(18deg);opacity:.7}100%{transform:translateY(${H + 3}px) translateX(-2px) rotate(-8deg);opacity:0}}`}</style>
    </Box>
  );

  /* ------- LIGHTNING ------- */
  if (effectKey === "lightning") return (
    <Box position="relative" style={{ width: W, height: H, overflow: "hidden" }}>
      <Box position="absolute" style={{
        left: "38%", top: 0,
        width: 0, height: 0,
        borderLeft: "5px solid transparent",
        borderRight: "3px solid transparent",
        borderBottom: active ? `${H}px solid ${color}88` : `${H}px solid rgba(255,255,255,0.06)`,
        clipPath: "polygon(40% 0%,100% 42%,55% 42%,60% 100%,0% 55%,45% 55%)",
        animation: active ? "ltP 3s ease-in-out infinite" : "none",
      }} />
      <style>{`@keyframes ltP{0%,82%{opacity:0}86%{opacity:1}90%{opacity:.25}94%{opacity:.9}100%{opacity:0}}`}</style>
    </Box>
  );

  /* ------- BUBBLES ------- */
  if (effectKey === "bubbles") return (
    <Box position="relative" style={{ width: W, height: H, overflow: "hidden" }}>
      {[...Array(5)].map((_, i) => {
        const sz = [5, 7, 4, 6, 5][i];
        return (
          <Box key={i} position="absolute" borderRadius="full" style={{
            width: sz, height: sz,
            border: active ? `1px solid ${color}90` : "1px solid rgba(255,255,255,0.1)",
            background: active ? `rgba(147,197,253,0.12)` : "transparent",
            bottom: `${(i * 7) % (H - sz)}px`, left: `${i * 7 + 1}px`,
            animation: active ? `bbP ${1.2 + i * 0.3}s linear infinite` : "none",
            animationDelay: `${i * 0.25}s`,
          }} />
        );
      })}
      <style>{`@keyframes bbP{from{transform:translateY(0) translateX(0)}to{transform:translateY(-${H + 6}px) translateX(2px);opacity:0}}`}</style>
    </Box>
  );

  /* ------- METEOR SHOWER ------- */
  if (effectKey === "meteor-shower") return (
    <Box position="relative" style={{ width: W, height: H, overflow: "hidden" }}>
      {[...Array(3)].map((_, i) => (
        <Box key={i} position="absolute" style={{
          width: 14 - i * 2, height: 1.5,
          background: active
            ? `linear-gradient(90deg, transparent, ${color})`
            : "rgba(255,255,255,0.08)",
          borderRadius: 2,
          top: `${i * 9 + 3}px`, left: `${i * 4}px`,
          transform: "rotate(30deg)",
          animation: active ? `mtP ${0.8 + i * 0.25}s linear infinite` : "none",
          animationDelay: `${i * 0.35}s`,
        }} />
      ))}
      <style>{`@keyframes mtP{from{transform:rotate(30deg) translateX(-10px);opacity:0}50%{opacity:1}to{transform:rotate(30deg) translateX(${W + 10}px);opacity:0}}`}</style>
    </Box>
  );

  /* ------- CONFETTI ------- */
  const confettiColors = ["#f87171", "#fbbf24", "#4ade80", "#60a5fa", "#f472b6", "#a78bfa"];
  return (
    <Box position="relative" style={{ width: W, height: H, overflow: "hidden" }}>
      {[...Array(6)].map((_, i) => (
        <Box key={i} position="absolute" style={{
          width: 5, height: 4,
          background: active ? confettiColors[i] : "rgba(255,255,255,0.08)",
          borderRadius: i % 2 === 0 ? "50%" : "2px",
          top: `${(i * 6) % (H - 4)}px`, left: `${i * 5 + 2}px`,
          animation: active ? `cfP ${0.9 + i * 0.15}s linear infinite` : "none",
          animationDelay: `${i * 0.12}s`,
        }} />
      ))}
      <style>{`@keyframes cfP{0%{transform:translateY(-4px) rotate(0deg);opacity:.9}100%{transform:translateY(${H + 4}px) rotate(180deg);opacity:0}}`}</style>
    </Box>
  );
}

export function EffectsPanel({
  activeEffect, onSelect, onClose,
  weatherSyncEnabled, onToggleWeatherSync, weatherLoading, weatherError, weatherLocation,
}: EffectsPanelProps) {
  const { t } = useTranslation();
  const { x, y, ref } = useCenteredPanel(520, 520);

  const lastError = useRef<WeatherSyncError>(null);
  useEffect(() => {
    if (weatherError && weatherError !== lastError.current) {
      toast.error(t(`effects.${weatherError === "location-denied" ? "weatherLocationDenied"
        : weatherError === "location-unavailable" ? "weatherLocationUnavailable"
        : "weatherFetchFailed"}`));
    }
    lastError.current = weatherError;
  }, [weatherError, t]);

  const resolvedColor = EFFECTS.find(e => e.key === activeEffect)?.color ?? "#7dd3fc";

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
        width: 520,
        height: 520,
        borderRadius: "16px",
        background: "rgba(12,18,22,0.75)",
        backdropFilter: "blur(18px)",
        WebkitBackdropFilter: "blur(18px)",
        border: "1px solid rgba(255,255,255,0.1)",
        boxShadow: "0 24px 80px rgba(0,0,0,0.75), 0 0 0 1px rgba(255,255,255,0.08)",
        cursor: "grab",
        overflow: "hidden",
      }}
    >
      <Box position="relative" style={{ padding: "18px 18px 20px", height: "100%", overflowY: "auto" }}>
        <PanelCloseBtn onClose={onClose} />

        {/* Header */}
        <Flex align="center" gap={2} mb={4}>
          <Wand2 size={15} style={{ color: "rgba(255,255,255,0.5)" }} />
          <Text style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.35)", letterSpacing: "0.1em", fontFamily: "'HarmonyOS Sans', sans-serif", textTransform: "uppercase" }}>
            {t("effects.title")}
          </Text>
        </Flex>

        {/* Weather-synced effect (auto, standalone) */}
        <Box
          as="button"
          onClick={onToggleWeatherSync}
          w="full"
          mb={3}
          borderRadius="12px"
          p="10px 12px"
          textAlign="left"
          style={{
            background: weatherSyncEnabled
              ? `linear-gradient(135deg, ${resolvedColor}1f, ${resolvedColor}0a)`
              : "rgba(255,255,255,0.03)",
            border: `1px solid ${weatherSyncEnabled ? resolvedColor + "50" : "rgba(255,255,255,0.07)"}`,
            cursor: "pointer",
            transition: "all 0.2s",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
          _hover={{ background: weatherSyncEnabled ? undefined : "rgba(255,255,255,0.05)" } as any}
        >
          <Flex align="center" justify="center" borderRadius="10px" style={{
            width: 34, height: 34, flexShrink: 0,
            background: weatherSyncEnabled ? `${resolvedColor}22` : "rgba(255,255,255,0.05)",
          }}>
            {weatherLoading ? (
              <Loader2 size={17} style={{ color: resolvedColor, animation: "weatherSpin 0.8s linear infinite" }} />
            ) : weatherError ? (
              <AlertTriangle size={17} style={{ color: "#f87171" }} />
            ) : (
              <Cloud size={17} style={{ color: weatherSyncEnabled ? resolvedColor : "rgba(255,255,255,0.35)" }} />
            )}
          </Flex>
          <Box flex={1} minW={0}>
            <Text style={{
              fontSize: "0.74rem",
              color: weatherSyncEnabled ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.5)",
              fontFamily: "'HarmonyOS Sans', sans-serif",
              fontWeight: 500,
            }}>
              {t("effects.weather")}
            </Text>
            <Flex align="center" gap={1} style={{ marginTop: 2 }}>
              {weatherSyncEnabled && !weatherError && weatherLocation && (
                <MapPin size={10} style={{ color: "rgba(255,255,255,0.3)", flexShrink: 0 }} />
              )}
              <Text style={{
                fontSize: "0.66rem",
                color: weatherError ? "#f87171" : "rgba(255,255,255,0.3)",
                fontFamily: "'HarmonyOS Sans', sans-serif",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}>
                {weatherError
                  ? t(`effects.${weatherError === "location-denied" ? "weatherLocationDenied"
                      : weatherError === "location-unavailable" ? "weatherLocationUnavailable"
                      : "weatherFetchFailed"}`)
                  : weatherSyncEnabled
                    ? (weatherLocation ?? t("effects.weatherLocating"))
                    : t("effects.weatherDescription")}
              </Text>
            </Flex>
          </Box>

          {/* Toggle switch */}
          <Box role="switch" aria-checked={weatherSyncEnabled} borderRadius="full" style={{
            width: 36, height: 20, flexShrink: 0, position: "relative",
            background: weatherSyncEnabled ? resolvedColor : "rgba(255,255,255,0.12)",
            transition: "background 0.2s",
          }}>
            <Box borderRadius="full" style={{
              position: "absolute", top: 2, left: weatherSyncEnabled ? 18 : 2,
              width: 16, height: 16, background: "#fff",
              boxShadow: "0 1px 3px rgba(0,0,0,0.4)",
              transition: "left 0.2s",
            }} />
          </Box>
          <style>{`@keyframes weatherSpin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
        </Box>

        {/* Effect cards — 4 columns × 3 rows */}
        <Box display="grid" style={{ gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10 }}>
          {EFFECTS.map(({ key, icon: Icon, color }) => {
            const isOn = activeEffect === key;
            return (
              <Box
                key={key!}
                as="button"
                onClick={() => onSelect(isOn ? null : key)}
                borderRadius="12px"
                p="12px 8px 10px"
                textAlign="center"
                style={{
                  background: isOn
                    ? `linear-gradient(135deg, ${color}1f, ${color}0a)`
                    : "rgba(255,255,255,0.03)",
                  border: `1px solid ${isOn ? color + "50" : "rgba(255,255,255,0.07)"}`,
                  cursor: "pointer",
                  transition: "all 0.2s",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 7,
                }}
                _hover={{ transform: "scale(1.03)" } as any}
              >
                <Icon size={20} style={{ color: isOn ? color : "rgba(255,255,255,0.28)" }} />
                <Text style={{
                  fontSize: "0.67rem",
                  color: isOn ? "rgba(255,255,255,0.88)" : "rgba(255,255,255,0.38)",
                  fontFamily: "'HarmonyOS Sans', sans-serif",
                  lineHeight: 1.3,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  maxWidth: "100%",
                }}>
                  {t(`effects.${key!.replace(/-/g, "_")}`)}
                </Text>
                <EffectPreview effectKey={key} color={color} active={isOn} />
              </Box>
            );
          })}
        </Box>

        {/* Clear button */}
        {(activeEffect || weatherSyncEnabled) && (
          <Box
            as="button"
            w="full"
            mt={3}
            py="8px"
            borderRadius="10px"
            onClick={() => onSelect(null)}
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "rgba(255,255,255,0.38)",
              fontSize: "0.72rem",
              fontFamily: "'HarmonyOS Sans', sans-serif",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              transition: "all 0.18s",
            }}
            _hover={{ background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.6)" } as any}
          >
            <X size={11} />
            {t("effects.clearEffect")}
          </Box>
        )}

        {/* Status footer */}
        <Box mt={(activeEffect || weatherSyncEnabled) ? 2 : 3} borderRadius="10px" px={3} py="10px"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
        >
          {weatherSyncEnabled ? (
            <Flex align="center" gap={2}>
              <Box borderRadius="full" style={{ width: 6, height: 6, background: "#4ade80", boxShadow: "0 0 6px #4ade80", flexShrink: 0 }} />
              <Text style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.55)", fontFamily: "'HarmonyOS Sans', sans-serif" }}>
                {t("effects.weather")}: {activeEffect ? t(`effects.${activeEffect.replace(/-/g, "_")}`) : t("effects.noEffect")}
              </Text>
            </Flex>
          ) : activeEffect ? (
            <Flex align="center" gap={2}>
              <Box borderRadius="full" style={{ width: 6, height: 6, background: "#4ade80", boxShadow: "0 0 6px #4ade80", flexShrink: 0 }} />
              <Text style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.55)", fontFamily: "'HarmonyOS Sans', sans-serif" }}>
                {t(`effects.${activeEffect.replace(/-/g, "_")}`)} {t("effects.active")}
              </Text>
            </Flex>
          ) : (
            <Text style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.22)", fontFamily: "'HarmonyOS Sans', sans-serif" }}>
              {t("effects.noEffect")}
            </Text>
          )}
        </Box>
      </Box>
    </MotionBox>
  );
}
