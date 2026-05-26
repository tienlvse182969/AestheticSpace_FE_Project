import { Box } from "@chakra-ui/react";
import { motion, AnimatePresence } from "motion/react";
import { RainEffect } from "../effects/RainEffect";
import { SnowEffect } from "../effects/SnowEffect";
import type { StudySpaceCtx } from "../../../hooks/studyspace/useStudySpace";

const MotionBox = motion.create(Box);

interface Props { ctx: StudySpaceCtx; }

export function SpaceBackground({ ctx }: Props) {
  const { currentBg, isRestoring, activeEffect } = ctx;

  return (
    <>
      {/* Background image with fade on change */}
      <MotionBox
        key={currentBg.id}
        position="absolute"
        inset={0}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.7 } as any}
        style={{
          backgroundImage: `url(${currentBg.url})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      />

      {/* Vignette */}
      <Box
        position="absolute"
        inset={0}
        style={{
          background: "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.45) 100%)",
          pointerEvents: "none",
          zIndex: 1,
        }}
      />

      {/* Loading overlay */}
      <AnimatePresence>
        {isRestoring && (
          <MotionBox
            key="loading-overlay"
            position="fixed"
            inset={0}
            display="flex"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            gap="16px"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 } as any}
            style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)", zIndex: 200 }}
          >
            <Box
              style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                border: "3px solid rgba(255,255,255,0.15)",
                borderTopColor: "rgba(255,255,255,0.85)",
                animation: "spin 0.8s linear infinite",
              }}
            />
            <Box
              style={{
                color: "rgba(255,255,255,0.85)",
                fontSize: "0.95rem",
                fontFamily: "'HarmonyOS Sans', sans-serif",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              Loading your space…
            </Box>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </MotionBox>
        )}
      </AnimatePresence>

      {/* Effect overlays */}
      {activeEffect === "rain" && <RainEffect />}
      {activeEffect === "snow" && <SnowEffect />}
    </>
  );
}
