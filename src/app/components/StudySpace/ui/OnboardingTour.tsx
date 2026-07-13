import { useEffect, useRef, useState } from "react";
import { Box, Flex, Text } from "@chakra-ui/react";
import { motion } from "motion/react";
import { X } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { TourStep, TourStepId } from "../../../hooks/studyspace/useOnboardingTour";
import type { ToolbarPosition } from "../../../context/ToolbarPositionContext";

const MotionBox = motion.create(Box);

interface OnboardingTourProps {
  active: boolean;
  stepIndex: number;
  steps: TourStep[];
  getTarget: (id: TourStepId) => HTMLElement | null;
  toolbarPosition: ToolbarPosition;
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
}

const SPOTLIGHT_PADDING = 10;
const CARD_WIDTH = 280;
const CARD_MARGIN = 18;

export function OnboardingTour({
  active, stepIndex, steps, getTarget, toolbarPosition, onNext, onPrev, onSkip,
}: OnboardingTourProps) {
  const { t } = useTranslation();
  const [rect, setRect] = useState<DOMRect | null>(null);
  const rafRef = useRef<number | null>(null);
  const step = steps[stepIndex];

  useEffect(() => {
    if (!active || !step) { setRect(null); return; }

    const tick = () => {
      const el = getTarget(step.id);
      setRect(el ? el.getBoundingClientRect() : null);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [active, step, getTarget]);

  if (!active || !step) return null;

  let cardStyle: React.CSSProperties;
  if (!rect) {
    cardStyle = { top: "50%", left: "50%", transform: "translate(-50%, -50%)" };
  } else if (toolbarPosition === "bottom") {
    const left = Math.min(Math.max(rect.left + rect.width / 2, CARD_WIDTH / 2 + 12), window.innerWidth - CARD_WIDTH / 2 - 12);
    cardStyle = { left, bottom: window.innerHeight - rect.top + CARD_MARGIN, transform: "translateX(-50%)" };
  } else if (toolbarPosition === "left") {
    const top = Math.min(Math.max(rect.top + rect.height / 2, 120), window.innerHeight - 120);
    cardStyle = { left: rect.right + CARD_MARGIN, top, transform: "translateY(-50%)" };
  } else {
    const top = Math.min(Math.max(rect.top + rect.height / 2, 120), window.innerHeight - 120);
    cardStyle = { right: window.innerWidth - rect.left + CARD_MARGIN, top, transform: "translateY(-50%)" };
  }

  // Steps that auto-open a panel are meant to be actually used (drag a widget, pick a
  // background, click "add room") — so the cutout must let clicks/drags pass straight
  // through to the real element instead of only being decorative like the passive steps.
  const interactive = !!step.panel;
  // Fully-interactive steps (e.g. dragging a widget anywhere onto the canvas) can't be
  // bounded to the panel's rect, so nothing on screen should block clicks/drags at all —
  // the dimming there is purely decorative, not a real cutout.
  const stripPointerEvents: "none" | "auto" = step.fullyInteractive ? "none" : "auto";
  const backdropColor = "rgba(0,0,0,0.72)";

  return (
    <Box position="fixed" inset={0} zIndex={300} style={{ pointerEvents: interactive ? "none" : "auto" }}>
      {/* Backdrop, with a spotlight cutout around the active target (if any) */}
      {rect ? (
        interactive ? (
          <>
            {/* Four dimmed strips framing the hole — the hole itself has no covering element,
                so pointer/drag events fall straight through to the real target underneath. */}
            <Box position="fixed" pointerEvents={stripPointerEvents} style={{
              top: 0, left: 0, right: 0, height: Math.max(0, rect.top - SPOTLIGHT_PADDING), background: backdropColor,
            }} />
            <Box position="fixed" pointerEvents={stripPointerEvents} style={{
              top: rect.bottom + SPOTLIGHT_PADDING, left: 0, right: 0, bottom: 0, background: backdropColor,
            }} />
            <Box position="fixed" pointerEvents={stripPointerEvents} style={{
              top: rect.top - SPOTLIGHT_PADDING, left: 0, width: Math.max(0, rect.left - SPOTLIGHT_PADDING),
              height: rect.height + SPOTLIGHT_PADDING * 2, background: backdropColor,
            }} />
            <Box position="fixed" pointerEvents={stripPointerEvents} style={{
              top: rect.top - SPOTLIGHT_PADDING, left: rect.right + SPOTLIGHT_PADDING, right: 0,
              height: rect.height + SPOTLIGHT_PADDING * 2, background: backdropColor,
            }} />
            {/* Decorative glow ring around the hole — purely visual, never blocks clicks */}
            <Box position="fixed" pointerEvents="none" style={{
              top: rect.top - SPOTLIGHT_PADDING,
              left: rect.left - SPOTLIGHT_PADDING,
              width: rect.width + SPOTLIGHT_PADDING * 2,
              height: rect.height + SPOTLIGHT_PADDING * 2,
              borderRadius: "16px",
              border: "2px solid rgba(var(--accent-rgb), 0.85)",
              boxShadow: "0 0 24px rgba(var(--accent-rgb), 0.35)",
            }} />
          </>
        ) : (
          <Box
            position="fixed"
            pointerEvents="none"
            style={{
              top: rect.top - SPOTLIGHT_PADDING,
              left: rect.left - SPOTLIGHT_PADDING,
              width: rect.width + SPOTLIGHT_PADDING * 2,
              height: rect.height + SPOTLIGHT_PADDING * 2,
              borderRadius: `${Math.min(rect.width, rect.height) / 2 + SPOTLIGHT_PADDING}px`,
              boxShadow: "0 0 0 9999px rgba(0,0,0,0.72)",
              border: "2px solid rgba(var(--accent-rgb), 0.85)",
            }}
          />
        )
      ) : (
        <Box position="fixed" inset={0} pointerEvents="auto" style={{ background: backdropColor }} />
      )}

      {/* Tooltip card */}
      <MotionBox
        key={step.id}
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.18 } as any}
        position="fixed"
        style={{
          width: CARD_WIDTH,
          borderRadius: 16,
          background: "rgba(12,18,22,0.96)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          border: "1px solid rgba(255,255,255,0.12)",
          boxShadow: "0 24px 64px rgba(0,0,0,0.7)",
          padding: "18px 18px 16px",
          pointerEvents: "auto",
          ...cardStyle,
        }}
      >
        <Box
          as="button"
          onClick={onSkip}
          position="absolute" top="10px" right="10px"
          display="flex" alignItems="center" justifyContent="center"
          w="22px" h="22px" borderRadius="full"
          style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.5)", border: "none", cursor: "pointer" }}
        >
          <X size={12} />
        </Box>

        <Text style={{
          color: "rgba(255,255,255,0.94)", fontSize: "0.92rem", fontWeight: 700,
          fontFamily: "'HarmonyOS Sans', sans-serif", marginBottom: 6, paddingRight: 20,
        }}>
          {t(step.titleKey)}
        </Text>
        <Text style={{
          color: "rgba(255,255,255,0.55)", fontSize: "0.78rem", lineHeight: 1.55,
          fontFamily: "'HarmonyOS Sans', sans-serif", marginBottom: 14,
        }}>
          {t(step.descKey)}
        </Text>

        <Flex align="center" justify="space-between">
          <Flex align="center" gap="4px">
            {steps.map((s, i) => (
              <Box
                key={s.id}
                w="5px" h="5px" borderRadius="full"
                style={{ background: i === stepIndex ? "var(--accent)" : "rgba(255,255,255,0.18)" }}
              />
            ))}
          </Flex>
          <Flex align="center" gap="8px">
            {stepIndex > 0 && (
              <Box
                as="button"
                onClick={onPrev}
                style={{
                  fontSize: "0.74rem", color: "rgba(255,255,255,0.5)",
                  background: "transparent", border: "none", cursor: "pointer", padding: "6px 4px",
                  fontFamily: "'HarmonyOS Sans', sans-serif",
                }}
              >
                {t("tour.back")}
              </Box>
            )}
            <Box
              as="button"
              onClick={onNext}
              style={{
                fontSize: "0.78rem", fontWeight: 600, color: "#0c1216",
                background: "var(--accent)", border: "none", borderRadius: 8,
                padding: "7px 14px", cursor: "pointer",
                fontFamily: "'HarmonyOS Sans', sans-serif",
              }}
            >
              {stepIndex === steps.length - 1 ? t("tour.done") : t("tour.next")}
            </Box>
          </Flex>
        </Flex>
      </MotionBox>
    </Box>
  );
}
