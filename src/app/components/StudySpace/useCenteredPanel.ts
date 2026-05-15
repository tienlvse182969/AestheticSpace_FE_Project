import { useRef, useLayoutEffect } from "react";
import { useMotionValue } from "motion/react";

/**
 * Returns { x, y, ref } so that a draggable panel of the given `width`
 * opens perfectly centred on the viewport.
 *
 * x  → horizontally centred using the known width
 * y  → vertically centred by measuring the actual rendered height via `ref`
 *       (measured in useLayoutEffect so it's synchronous before first paint)
 */
export function useCenteredPanel(width: number) {
  const sw = typeof window !== "undefined" ? window.innerWidth  : 1440;
  const sh = typeof window !== "undefined" ? window.innerHeight : 900;

  const x = useMotionValue(Math.round(sw / 2 - width / 2));
  // Start at visual-centre guess; corrected synchronously after first paint
  const y = useMotionValue(Math.round(sh / 2 - 200));

  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (ref.current) {
      const h = ref.current.offsetHeight;
      y.set(Math.max(16, Math.round(sh / 2 - h / 2)));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { x, y, ref };
}
