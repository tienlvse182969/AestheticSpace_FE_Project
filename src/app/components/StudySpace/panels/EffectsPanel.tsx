import { Box, Flex, Text } from "@chakra-ui/react";
import { motion } from "motion/react";
import { useTranslation } from "react-i18next";
import { CloudRain, CloudSnow, Wand2, X } from "lucide-react";
import { PanelCloseBtn } from "../ui/PanelCloseBtn";
import { useCenteredPanel } from "../hooks/useCenteredPanel";

const MotionBox = motion.create(Box);

export type EffectType = "rain" | "snow" | null;

interface EffectsConfig {
  key: EffectType;
  icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>;
  color: string;
}

const EFFECTS: EffectsConfig[] = [
  { key: "rain", icon: CloudRain,  color: "#60a5fa" },
  { key: "snow", icon: CloudSnow,  color: "#e2e8f0" },
];

interface EffectsPanelProps {
  activeEffect: EffectType;
  onSelect: (e: EffectType) => void;
  onClose: () => void;
}

/* ── Mini animated preview for each effect ── */
function EffectPreview({ effectKey, color, active }: { effectKey: EffectType; color: string; active: boolean }) {
  if (effectKey === "rain") {
    return (
      <Box position="relative" style={{ width: 48, height: 36, overflow: "hidden" }}>
        {[...Array(6)].map((_, i) => (
          <Box
            key={i}
            position="absolute"
            style={{
              width: 1,
              height: 10,
              borderRadius: 1,
              background: active ? color : "rgba(255,255,255,0.12)",
              top: `${(i * 18) % 36}px`,
              left: `${i * 8}px`,
              animation: active ? `rainFall ${0.5 + i * 0.08}s linear infinite` : "none",
              animationDelay: `${i * 0.07}s`,
            }}
          />
        ))}
        <style>{`
          @keyframes rainFall {
            from { transform: translateY(-10px) translateX(-2px); opacity: 0.8; }
            to   { transform: translateY(36px)  translateX(-5px); opacity: 0; }
          }
        `}</style>
      </Box>
    );
  }

  // snow
  return (
    <Box position="relative" style={{ width: 48, height: 36, overflow: "hidden" }}>
      {[...Array(8)].map((_, i) => (
        <Box
          key={i}
          position="absolute"
          borderRadius="full"
          style={{
            width: 3, height: 3,
            background: active ? color : "rgba(255,255,255,0.1)",
            top: `${(i * 13) % 36}px`,
            left: `${i * 6}px`,
            animation: active ? `snowFall ${1.2 + i * 0.15}s linear infinite` : "none",
            animationDelay: `${i * 0.1}s`,
          }}
        />
      ))}
      <style>{`
        @keyframes snowFall {
          0%   { transform: translateY(-4px) translateX(0px);   opacity: 0.9; }
          50%  { transform: translateY(18px) translateX(3px);  opacity: 0.7; }
          100% { transform: translateY(38px) translateX(-2px); opacity: 0; }
        }
      `}</style>
    </Box>
  );
}

export function EffectsPanel({ activeEffect, onSelect, onClose }: EffectsPanelProps) {
  const { t } = useTranslation();
  const { x, y, ref } = useCenteredPanel(360);

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
        width: 360,
        borderRadius: "16px",
        background: "rgba(12,18,22,0.75)",
        backdropFilter: "blur(18px)",
        WebkitBackdropFilter: "blur(18px)",
        border: "1px solid rgba(255,255,255,0.1)",
        boxShadow: "0 24px 80px rgba(0,0,0,0.75), 0 0 0 1px rgba(255,255,255,0.08)",
        cursor: "grab",
      }}
    >
      <Box position="relative" style={{ padding: "18px 18px 20px" }}>
        <PanelCloseBtn onClose={onClose} />

        {/* Header */}
        <Flex align="center" gap={2} mb={4}>
          <Wand2 size={15} style={{ color: "rgba(255,255,255,0.5)" }} />
          <Text style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.35)", letterSpacing: "0.1em", fontFamily: "'HarmonyOS Sans', sans-serif" }}>
            {t("effects.title")}
          </Text>
        </Flex>

        {/* Effect cards */}
        <Box display="grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {EFFECTS.map(({ key, icon: Icon, color }) => {
            const isOn = activeEffect === key;
            return (
              <Box
                key={key!}
                as="button"
                onClick={() => onSelect(isOn ? null : key)}
                borderRadius="12px"
                p="14px 10px 12px"
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
                  gap: 8,
                }}
                _hover={{ transform: "scale(1.03)" } as any}
              >
                <Icon size={22} style={{ color: isOn ? color : "rgba(255,255,255,0.28)" }} />
                <Text style={{
                  fontSize: "0.72rem",
                  color: isOn ? "rgba(255,255,255,0.88)" : "rgba(255,255,255,0.38)",
                  fontFamily: "'HarmonyOS Sans', sans-serif",
                  lineHeight: 1.3,
                }}>
                  {t(`effects.${key!.replace("-", "_")}`)}
                </Text>
                <EffectPreview effectKey={key} color={color} active={isOn} />
              </Box>
            );
          })}
        </Box>

        {/* Clear button */}
        {activeEffect && (
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
        <Box mt={activeEffect ? 2 : 3} borderRadius="10px" px={3} py="10px"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
        >
          {activeEffect ? (
            <Flex align="center" gap={2}>
              <Box borderRadius="full" style={{ width: 6, height: 6, background: "#4ade80", boxShadow: "0 0 6px #4ade80", flexShrink: 0 }} />
              <Text style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.55)", fontFamily: "'HarmonyOS Sans', sans-serif" }}>
                {t(`effects.${activeEffect.replace("-", "_")}`)} {t("effects.active")}
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
