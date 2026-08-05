import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Image as ImageIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { PhotoFrameTransition } from "../../../../hooks/studyspace/usePhotoFrameSettings";

interface PhotoFrameWidgetProps {
  images: string[];
  intervalSec: number;
  transition: PhotoFrameTransition;
  shuffle?: boolean;
}

const VARIANTS: Record<PhotoFrameTransition, { initial: any; animate: any; exit: any }> = {
  fade:  { initial: { opacity: 0 },              animate: { opacity: 1 },            exit: { opacity: 0 } },
  slide: { initial: { opacity: 0, x: 24 },        animate: { opacity: 1, x: 0 },       exit: { opacity: 0, x: -24 } },
  none:  { initial: { opacity: 1 },               animate: { opacity: 1 },            exit: { opacity: 1 } },
};

export function PhotoFrameWidget({ images, intervalSec, transition, shuffle }: PhotoFrameWidgetProps) {
  const { t } = useTranslation();
  const [index, setIndex] = useState(0);
  const order = useMemo(() => {
    if (!shuffle) return images.map((_, i) => i);
    const arr = images.map((_, i) => i);
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }, [images.length, shuffle]); // eslint-disable-line react-hooks/exhaustive-deps

  const orderRef = useRef(order);
  orderRef.current = order;

  useEffect(() => {
    if (images.length <= 1) return;
    const id = setInterval(() => {
      setIndex(i => (i + 1) % orderRef.current.length);
    }, Math.max(3, intervalSec) * 1000);
    return () => clearInterval(id);
  }, [images.length, intervalSec]);

  useEffect(() => { setIndex(0); }, [images.length]);

  const currentUrl = images.length ? images[order[index % order.length]] : null;
  const v = VARIANTS[transition];

  return (
    <div style={{
      width: 220,
      height: 160,
      borderRadius: 14,
      overflow: "hidden",
      position: "relative",
      background: "rgba(12,18,22,0.72)",
      border: "1px solid rgba(251,146,60,0.25)",
      boxShadow: "0 8px 28px rgba(0,0,0,0.4)",
    }}>
      {currentUrl ? (
        <AnimatePresence mode="wait">
          <motion.img
            key={currentUrl}
            src={currentUrl}
            initial={v.initial}
            animate={v.animate}
            exit={v.exit}
            transition={{ duration: 0.5 }}
            style={{ width: "100%", height: "100%", objectFit: "cover", position: "absolute", inset: 0 }}
            draggable={false}
          />
        </AnimatePresence>
      ) : (
        <div style={{
          width: "100%", height: "100%", display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", gap: 6,
          color: "rgba(255,255,255,0.3)",
        }}>
          <ImageIcon size={22} />
          <span style={{ fontSize: "0.68rem", fontFamily: "'HarmonyOS Sans', sans-serif" }}>{t("photoFrame.emptyState")}</span>
        </div>
      )}
    </div>
  );
}
