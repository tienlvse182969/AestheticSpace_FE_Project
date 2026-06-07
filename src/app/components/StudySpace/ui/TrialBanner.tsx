import { Box, Flex, Text } from "@chakra-ui/react";
import { motion } from "motion/react";
import { Clock, ShoppingBag, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { StoreItem, StoreCategory } from "../../../../services/aestheticStore.service";

const CATEGORY_COLORS: Record<StoreCategory, string> = {
  Theme:        "#8b5cf6",
  Background:   "#3b82f6",
  Sticker:      "#ec4899",
  Effect:       "#22c55e",
  AmbientSound: "#6366f1",
};

const MotionBox = motion.create(Box);

const TRIAL_SECONDS = 600;

interface TrialBannerProps {
  item: StoreItem;
  secondsLeft: number;
  onBuy: () => void;
  onDiscard: () => void;
}

export function TrialBanner({ item, secondsLeft, onBuy, onDiscard }: TrialBannerProps) {
  const { t } = useTranslation();
  const mm = Math.floor(secondsLeft / 60).toString().padStart(2, "0");
  const ss = (secondsLeft % 60).toString().padStart(2, "0");
  const urgent = secondsLeft <= 60;
  const pct = Math.max(0, (secondsLeft / TRIAL_SECONDS) * 100);
  const accentColor = CATEGORY_COLORS[item.category] ?? "#8b5cf6";

  return (
    <MotionBox
      initial={{ opacity: 0, y: -20, scale: 0.96, x: "-50%" }}
      animate={{ opacity: 1, y: 0, scale: 1, x: "-50%", transition: { type: "spring", stiffness: 420, damping: 30 } } as any}
      exit={{ opacity: 0, y: -20, scale: 0.96, x: "-50%", transition: { duration: 0.18, ease: [0.4, 0, 1, 1] } } as any}
      position="fixed"
      top="12px"
      left="50%"
      zIndex={180}
      style={{ pointerEvents: "auto" }}
    >
      <Box
        position="relative"
        overflow="hidden"
        borderRadius="14px"
        style={{
          background: "rgba(10,15,22,0.88)",
          backdropFilter: "blur(18px)",
          WebkitBackdropFilter: "blur(18px)",
          border: urgent
            ? "1px solid rgba(251,113,133,0.45)"
            : "1px solid rgba(255,255,255,0.13)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.55)",
          transition: "border-color 0.4s",
        }}
      >
        {/* Progress bar (depletes with time) */}
        <Box
          position="absolute"
          bottom={0}
          left={0}
          h="2px"
          style={{
            width: `${pct}%`,
            background: urgent
              ? "linear-gradient(90deg, #f87171, #fb923c)"
              : "linear-gradient(90deg, #8b5cf6, #06b6d4)",
            transition: "width 1s linear, background 0.4s",
          }}
        />

        <Flex align="center" gap="10px" px="14px" py="9px" flexWrap="nowrap">
          {/* Accent dot (pulsing) */}
          <Box
            flexShrink={0}
            w="8px"
            h="8px"
            borderRadius="full"
            style={{
              background: accentColor,
              boxShadow: `0 0 8px ${accentColor}80`,
              animation: "pulse 2s ease-in-out infinite",
            }}
          />

          {/* Label + name */}
          <Text
            flexShrink={0}
            style={{
              fontSize: "0.74rem",
              fontFamily: "'HarmonyOS Sans', sans-serif",
              color: "rgba(255,255,255,0.5)",
              whiteSpace: "nowrap",
            }}
          >
            {t("themeStore.trial.banner")}
          </Text>
          <Text
            flexShrink={0}
            style={{
              fontSize: "0.74rem",
              fontFamily: "'HarmonyOS Sans', sans-serif",
              fontWeight: 600,
              color: "rgba(255,255,255,0.92)",
              whiteSpace: "nowrap",
              maxWidth: 140,
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            "{item.name}"
          </Text>

          {/* Timer chip */}
          <Flex
            align="center"
            gap="4px"
            flexShrink={0}
            px="8px"
            py="3px"
            borderRadius="7px"
            style={{
              background: urgent ? "rgba(248,113,113,0.12)" : "rgba(255,255,255,0.07)",
              border: urgent ? "1px solid rgba(248,113,113,0.3)" : "1px solid rgba(255,255,255,0.1)",
              transition: "all 0.4s",
            }}
          >
            <Clock size={10} color={urgent ? "#f87171" : "rgba(255,255,255,0.45)"} />
            <Text
              style={{
                fontSize: "0.74rem",
                fontFamily: "'HarmonyOS Sans', sans-serif",
                fontWeight: 700,
                color: urgent ? "#f87171" : "rgba(255,255,255,0.75)",
                fontVariantNumeric: "tabular-nums",
                letterSpacing: "0.04em",
                transition: "color 0.4s",
              }}
            >
              {mm}:{ss}
            </Text>
          </Flex>

          {/* Actions */}
          <Flex gap="6px" flexShrink={0}>
            <Box
              as="button"
              onClick={onBuy}
              display="flex"
              alignItems="center"
              gap="5px"
              px="10px"
              py="5px"
              borderRadius="8px"
              border="none"
              cursor="pointer"
              style={{
                background: "linear-gradient(135deg, rgba(139,92,246,0.9), rgba(59,130,246,0.9))",
                color: "#fff",
                fontSize: "0.72rem",
                fontFamily: "'HarmonyOS Sans', sans-serif",
                fontWeight: 600,
                whiteSpace: "nowrap",
                transition: "filter 0.15s",
              }}
              _hover={{ filter: "brightness(1.12)" } as any}
            >
              <ShoppingBag size={11} />
              {t("themeStore.trial.buyNow")}
            </Box>

            <Box
              as="button"
              onClick={onDiscard}
              display="flex"
              alignItems="center"
              gap="4px"
              px="10px"
              py="5px"
              borderRadius="8px"
              border="none"
              cursor="pointer"
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "rgba(255,255,255,0.45)",
                fontSize: "0.72rem",
                fontFamily: "'HarmonyOS Sans', sans-serif",
                fontWeight: 500,
                whiteSpace: "nowrap",
                transition: "all 0.15s",
              }}
              _hover={{ background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.8)" } as any}
            >
              <X size={11} />
              {t("themeStore.trial.discard")}
            </Box>
          </Flex>
        </Flex>
      </Box>
    </MotionBox>
  );
}
