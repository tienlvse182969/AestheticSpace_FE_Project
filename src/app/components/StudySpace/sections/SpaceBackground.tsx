import { useState, useEffect, useRef } from "react";
import { Box } from "@chakra-ui/react";
import { motion, AnimatePresence } from "motion/react";
import { useTranslation } from "react-i18next";
import { RainEffect } from "../effects/RainEffect";
import { SnowEffect } from "../effects/SnowEffect";
import type { StudySpaceCtx } from "../../../hooks/studyspace/useStudySpace";

const MotionBox = motion.create(Box);

interface Props { ctx: StudySpaceCtx; }

export function SpaceBackground({ ctx }: Props) {
  const { currentBg, isRestoring, activeEffect } = ctx;
  const { t } = useTranslation();

  const [loadedUrl,   setLoadedUrl]   = useState(currentBg.url);
  const [loadedBgId,  setLoadedBgId]  = useState(currentBg.id);
  const [isBgLoading, setIsBgLoading] = useState(false);
  const isFirstRender = useRef(true);

  useEffect(() => {
    // Skip preloading on initial mount — isRestoring handles that case
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    if (!currentBg.url) {
      setLoadedUrl("");
      setLoadedBgId(currentBg.id);
      return;
    }

    setIsBgLoading(true);
    const img = new window.Image();

    img.onload = () => {
      setLoadedUrl(currentBg.url);
      setLoadedBgId(currentBg.id);
      setIsBgLoading(false);
    };
    img.onerror = () => {
      setLoadedUrl(currentBg.url);
      setLoadedBgId(currentBg.id);
      setIsBgLoading(false);
    };
    img.src = currentBg.url;

    return () => { img.onload = null; img.onerror = null; };
  }, [currentBg.url, currentBg.id]);

  return (
    <>
      {/* Background image — only swapped after preload finishes */}
      <MotionBox
        key={loadedBgId}
        position="absolute"
        inset={0}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.7 } as any}
        style={{
          backgroundImage: loadedUrl ? `url(${loadedUrl})` : "none",
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

      {/* Background download progress bar */}
      <AnimatePresence>
        {isBgLoading && (
          <MotionBox
            key="bg-loading-bar"
            position="fixed"
            bottom={0}
            left={0}
            right={0}
            height="2px"
            overflow="hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.4 } as any }}
            transition={{ duration: 0.2 } as any}
            style={{ zIndex: 190, background: "rgba(255,255,255,0.08)" }}
          >
            <Box
              position="absolute"
              inset={0}
              style={{
                background: "linear-gradient(to right, transparent 0%, rgba(255,255,255,0.7) 50%, transparent 100%)",
                animation: "bgShimmer 1.1s ease-in-out infinite",
              }}
            />
            <style>{`@keyframes bgShimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }`}</style>
          </MotionBox>
        )}
      </AnimatePresence>

      {/* Session restore overlay */}
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
            onContextMenu={e => e.stopPropagation()}
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
              {t("space.loading")}
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
