import { Box, Flex, Text } from "@chakra-ui/react";
import { motion, AnimatePresence } from "motion/react";
import { Crown, Zap, Sparkles, AudioWaveform, Wand2, ShoppingBag } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";

const MotionBox = motion.create(Box);

export type LockedFeature = "sticker" | "ambient" | "effects" | "store";

const FEATURE_ICONS: Record<LockedFeature, React.ReactNode> = {
  sticker:  <Sparkles size={22} style={{ color: "#a78bfa" }} />,
  ambient:  <AudioWaveform size={22} style={{ color: "#60a5fa" }} />,
  effects:  <Wand2 size={22} style={{ color: "#f472b6" }} />,
  store:    <ShoppingBag size={22} style={{ color: "#34d399" }} />,
};

interface Props {
  feature: LockedFeature | null;
  onClose: () => void;
}

export function PremiumGateModal({ feature, onClose }: Props) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleUpgrade = () => {
    onClose();
    navigate("/pricing");
  };

  return (
    <AnimatePresence>
      {feature && (
        <>
          {/* Backdrop */}
          <MotionBox
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 } as any}
            position="fixed"
            inset={0}
            zIndex={110}
            onClick={onClose}
            style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(2px)" }}
          />

          {/* Centering wrapper */}
          <Box
            position="fixed"
            inset={0}
            zIndex={111}
            display="flex"
            alignItems="center"
            justifyContent="center"
            pointerEvents="none"
          >
          {/* Modal card */}
          <MotionBox
            key="modal"
            initial={{ opacity: 0, scale: 0.88, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 8 }}
            transition={{ duration: 0.22, ease: [0.34, 1.56, 0.64, 1] } as any}
            style={{
              pointerEvents: "auto",
              width: 320,
              borderRadius: "20px",
              background: "rgba(12,18,22,0.96)",
              backdropFilter: "blur(24px)",
              WebkitBackdropFilter: "blur(24px)",
              border: "1px solid rgba(251,191,36,0.2)",
              boxShadow: "0 32px 80px rgba(0,0,0,0.8), 0 0 0 1px rgba(251,191,36,0.08)",
              padding: "28px 24px 22px",
              textAlign: "center",
            }}
          >
            {/* Crown glow */}
            <Flex justify="center" mb={3}>
              <Box
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: "16px",
                  background: "linear-gradient(135deg, rgba(251,191,36,0.18) 0%, rgba(245,158,11,0.1) 100%)",
                  border: "1px solid rgba(251,191,36,0.3)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Crown size={24} style={{ color: "#fbbf24" }} />
              </Box>
            </Flex>

            {/* Title */}
            <Text
              mb={1}
              style={{
                fontSize: "1rem",
                fontFamily: "'HarmonyOS Sans', sans-serif",
                fontWeight: 700,
                color: "rgba(255,255,255,0.95)",
                letterSpacing: "0.01em",
              }}
            >
              {t("premiumGate.title")}
            </Text>

            {/* Feature name row */}
            <Flex align="center" justify="center" gap={2} mb="10px">
              {FEATURE_ICONS[feature]}
              <Text
                style={{
                  fontSize: "0.82rem",
                  fontFamily: "'HarmonyOS Sans', sans-serif",
                  color: "rgba(255,255,255,0.55)",
                }}
              >
                {t(`premiumGate.${feature}`)}
              </Text>
            </Flex>

            {/* Description */}
            <Text
              mb={5}
              style={{
                fontSize: "0.78rem",
                fontFamily: "'HarmonyOS Sans', sans-serif",
                color: "rgba(255,255,255,0.4)",
                lineHeight: 1.55,
              }}
            >
              {t("premiumGate.desc")}
            </Text>

            {/* Upgrade button */}
            <Box
              as="button"
              onClick={handleUpgrade}
              w="100%"
              h="42px"
              borderRadius="12px"
              display="flex"
              alignItems="center"
              justifyContent="center"
              gap={2}
              mb={2}
              style={{
                background: "linear-gradient(135deg, rgba(251,191,36,0.22) 0%, rgba(245,158,11,0.32) 100%)",
                border: "1px solid rgba(251,191,36,0.5)",
                color: "#fbbf24",
                fontSize: "0.84rem",
                fontFamily: "'HarmonyOS Sans', sans-serif",
                fontWeight: 700,
                cursor: "pointer",
                letterSpacing: "0.02em",
                transition: "opacity 0.15s",
              }}
              _hover={{ opacity: 0.82 } as any}
            >
              <Zap size={14} />
              {t("premiumGate.upgrade")}
            </Box>

            {/* Dismiss */}
            <Box
              as="button"
              onClick={onClose}
              w="100%"
              h="34px"
              borderRadius="10px"
              display="flex"
              alignItems="center"
              justifyContent="center"
              style={{
                background: "transparent",
                border: "none",
                color: "rgba(255,255,255,0.3)",
                fontSize: "0.78rem",
                fontFamily: "'HarmonyOS Sans', sans-serif",
                cursor: "pointer",
                transition: "color 0.15s",
              }}
              _hover={{ color: "rgba(255,255,255,0.55)" } as any}
            >
              {t("premiumGate.later")}
            </Box>
          </MotionBox>
          </Box>
        </>
      )}
    </AnimatePresence>
  );
}
