import { Box, Flex, Text } from "@chakra-ui/react";
import { motion } from "motion/react";
import { Palette } from "lucide-react";
import { useTranslation } from "react-i18next";
import { PanelCloseBtn } from "../ui/PanelCloseBtn";
import { useCenteredPanel } from "../hooks/useCenteredPanel";

const MotionBox = motion.create(Box);

interface ThemeStorePanelProps {
  onClose: () => void;
}

export function ThemeStorePanel({ onClose }: ThemeStorePanelProps) {
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
      }}
    >
      <Box position="relative" style={{ padding: "20px 20px 24px" }}>
        <PanelCloseBtn onClose={onClose} />

        {/* Header */}
        <Text mb={1} style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.35)", letterSpacing: "0.1em", fontFamily: "'HarmonyOS Sans', sans-serif" }}>
          {t("themeStore.title")}
        </Text>

        {/* Coming soon content */}
        <Flex direction="column" align="center" justify="center" gap={3} pt={6} pb={4}>
          <Box
            w="56px"
            h="56px"
            borderRadius="16px"
            display="flex"
            alignItems="center"
            justifyContent="center"
            style={{
              background: "linear-gradient(135deg, rgba(94,234,212,0.15) 0%, rgba(139,92,246,0.15) 100%)",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            <Palette size={26} color="rgba(94,234,212,0.7)" />
          </Box>

          <Text style={{ fontSize: "0.95rem", color: "rgba(255,255,255,0.85)", fontFamily: "'HarmonyOS Sans', sans-serif", textAlign: "center" }}>
            {t("themeStore.comingSoon")}
          </Text>

          <Text style={{ fontSize: "0.76rem", color: "rgba(255,255,255,0.35)", fontFamily: "'HarmonyOS Sans', sans-serif", textAlign: "center", lineHeight: 1.6 }}>
            {t("themeStore.subtitle")}
          </Text>
        </Flex>
      </Box>
    </MotionBox>
  );
}