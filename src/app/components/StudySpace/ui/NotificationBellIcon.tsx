import { useEffect, useRef } from "react";
import { motion, useAnimation } from "motion/react";
import { Bell } from "lucide-react";

const MotionBell = motion.create(Bell);

// Swings like a rung bell, pivoting from the top instead of the center.
const RING_KEYFRAMES = [0, -16, 13, -10, 7, -4, 2, 0];
const RING_TRANSITION = { duration: 0.6, ease: "easeInOut" as const };

interface Props {
  size?: number;
  color?: string;
  /** Unread history count — an increase (a new banner just landed) triggers a ring. */
  unreadCount: number;
}

export function NotificationBellIcon({ size = 22, color, unreadCount }: Props) {
  const controls = useAnimation();
  const prevUnreadRef = useRef(unreadCount);
  const mountedRef = useRef(false);

  // Ring once on mount — the user just walked into the Study Space.
  useEffect(() => {
    controls.start({ rotate: RING_KEYFRAMES, transition: RING_TRANSITION });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Ring again whenever a new banner bumps the unread badge.
  useEffect(() => {
    if (mountedRef.current && unreadCount > prevUnreadRef.current) {
      controls.start({ rotate: RING_KEYFRAMES, transition: RING_TRANSITION });
    }
    prevUnreadRef.current = unreadCount;
    mountedRef.current = true;
  }, [unreadCount, controls]);

  return (
    <MotionBell
      size={size}
      color={color}
      animate={controls}
      // Hover only rings the bell when there's actually something unread to draw attention to.
      whileHover={unreadCount > 0 ? { rotate: RING_KEYFRAMES, transition: RING_TRANSITION } : undefined}
      style={{ transformOrigin: "50% 0%" }}
    />
  );
}
