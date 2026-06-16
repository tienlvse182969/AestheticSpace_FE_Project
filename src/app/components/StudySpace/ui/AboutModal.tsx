import { Box, Flex, Text } from "@chakra-ui/react";
import { motion } from "motion/react";
import { Info, Users } from "lucide-react";
import { useTranslation } from "react-i18next";
import { PanelCloseBtn } from "./PanelCloseBtn";
import { useCenteredPanel } from "../hooks/useCenteredPanel";
import { APP_VERSION } from "../../../../version";

const MotionBox = motion.create(Box);

const CONTRIBUTORS = [
  "Phạm Thu Hiền",
  "Nguyễn Hồng Ngọc",
  "Trần Hoàng Duy",
  "Lê Văn Tiến",
  "Trần Quốc Nam",
];

export function AboutModal({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation();
  const { x, y, ref } = useCenteredPanel(380);

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
        width: 380,
        borderRadius: "16px",
        background: "rgba(12,18,22,0.75)",
        backdropFilter: "blur(18px)",
        WebkitBackdropFilter: "blur(18px)",
        border: "1px solid rgba(255,255,255,0.1)",
        boxShadow: "0 24px 80px rgba(0,0,0,0.75), 0 0 0 1px rgba(255,255,255,0.08)",
        cursor: "grab",
      }}
    >
      <Box position="relative" style={{ padding: "18px" }}>
        <PanelCloseBtn onClose={onClose} />

        {/* Header */}
        <Flex align="center" gap={2} mb={4}>
          <Info size={15} style={{ color: "rgba(255,255,255,0.5)" }} />
          <Text style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.35)", letterSpacing: "0.1em", fontFamily: "'HarmonyOS Sans', sans-serif" }}>
            {t("about.label")}
          </Text>
        </Flex>

        {/* Title block */}
        <Box mb={4} style={{ borderBottom: "1px solid rgba(255,255,255,0.07)", paddingBottom: "16px" }}>
          <Text
            mb={1}
            style={{
              fontSize: "1.25rem",
              color: "rgba(255,255,255,0.92)",
              letterSpacing: "-0.01em",
            }}
          >
            <span style={{ fontFamily: "'Manrope', sans-serif" }}>Aēsthetic</span>
            <span style={{ fontFamily: "'HarmonyOS Sans', sans-serif" }}> Space</span>
          </Text>
          <Text
            style={{
              fontSize: "0.78rem",
              color: "rgba(255,255,255,0.38)",
              lineHeight: 1.65,
              fontFamily: "'HarmonyOS Sans', sans-serif",
            }}
          >
            {t("about.desc")}
          </Text>
        </Box>

        {/* Contributors */}
        <Box mb={4} p="12px 14px" borderRadius="12px"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
        >
          <Flex align="center" gap={2} mb={3}>
            <Users size={13} style={{ color: "rgba(94,234,212,0.6)" }} />
            <Text style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em", fontFamily: "'HarmonyOS Sans', sans-serif" }}>
              {t("about.contributors")}
            </Text>
          </Flex>
          <Flex wrap="wrap" gap="6px">
            {CONTRIBUTORS.map((name) => (
              <Box
                key={name}
                style={{
                  fontSize: "0.76rem",
                  color: "rgba(255,255,255,0.65)",
                  fontFamily: "'HarmonyOS Sans', sans-serif",
                  background: "rgba(94,234,212,0.07)",
                  border: "1px solid rgba(94,234,212,0.15)",
                  borderRadius: "20px",
                  padding: "3px 10px",
                }}
              >
                {name}
              </Box>
            ))}
          </Flex>
        </Box>

        {/* Footer */}
        <Flex align="center" justify="space-between">
          <Text style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.2)", fontFamily: "'HarmonyOS Sans', sans-serif", letterSpacing: "0.06em" }}>
            {t("about.copyright")}
          </Text>
          <Box
            style={{
              fontSize: "0.68rem",
              color: "rgba(94,234,212,0.45)",
              fontFamily: "'HarmonyOS Sans', sans-serif",
              letterSpacing: "0.08em",
              background: "rgba(94,234,212,0.07)",
              border: "1px solid rgba(94,234,212,0.15)",
              borderRadius: "6px",
              padding: "3px 8px",
            }}
          >
            v{APP_VERSION}
          </Box>
        </Flex>
      </Box>
    </MotionBox>
  );
}