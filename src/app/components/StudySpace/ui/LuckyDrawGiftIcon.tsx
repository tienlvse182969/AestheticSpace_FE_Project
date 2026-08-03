import { useEffect, useRef } from "react";
import { motion, useAnimation } from "motion/react";
import { Gift } from "lucide-react";

const MotionGift = motion.create(Gift);

// Same swinging shake used by the notification bell, pivoting from the top.
const SHAKE_KEYFRAMES = [0, -16, 13, -10, 7, -4, 2, 0];
const SHAKE_TRANSITION = { duration: 0.6, ease: "easeInOut" as const };

interface Props {
  size?: number;
  color?: string;
  /** Remaining spins today — an increase (e.g. spins refreshed) triggers a shake. */
  remainingDraws: number;
}

export function LuckyDrawGiftIcon({ size = 22, color, remainingDraws }: Props) {
  const controls = useAnimation();
  const prevRef = useRef(remainingDraws);
  const mountedRef = useRef(false);

  // Shake again whenever the remaining-spins count goes up (e.g. status just loaded, or a new day's spins refreshed).
  useEffect(() => {
    if (mountedRef.current && remainingDraws > prevRef.current) {
      controls.start({ rotate: SHAKE_KEYFRAMES, transition: SHAKE_TRANSITION });
    }
    prevRef.current = remainingDraws;
    mountedRef.current = true;
  }, [remainingDraws, controls]);

  return (
    <MotionGift
      size={size}
      color={color}
      animate={controls}
      // Hover only shakes the gift when there's actually a spin available.
      whileHover={remainingDraws > 0 ? { rotate: SHAKE_KEYFRAMES, transition: SHAKE_TRANSITION } : undefined}
      style={{ transformOrigin: "50% 0%" }}
    />
  );
}
