import { useRef, useLayoutEffect } from "react";
import { useMotionValue } from "motion/react";

/**
 * Returns { x, y, ref } so that a draggable panel of the given `width`
 * opens perfectly centred on the viewport.
 *
 * x            → horizontally centred using the known width
 * y            → vertically centred, clamped so the panel bottom stays above
 *                any fixed chrome at the bottom (e.g. toolbar)
 * bottomPadding → height of fixed chrome at the bottom of the viewport (e.g. 64 for toolbar)
 */
export function useCenteredPanel(width: number, height?: number, bottomPadding = 0) {
  const sw = typeof window !== "undefined" ? window.innerWidth  : 1440;
  const sh = typeof window !== "undefined" ? window.innerHeight : 900;

  const clampY = (h: number) =>
    Math.max(16, Math.min(Math.round(sh / 2 - h / 2), sh - h - bottomPadding - 8));

  const x = useMotionValue(Math.round(sw / 2 - width / 2));
  const y = useMotionValue(
    height
      ? clampY(height)
      : Math.round(sh / 2 - 200),
  );

  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (ref.current) {
      const h = height ?? ref.current.offsetHeight;
      y.set(clampY(h));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { x, y, ref };
}
