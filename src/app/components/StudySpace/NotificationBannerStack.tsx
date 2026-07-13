import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";
import { useAccent } from "../../context/AccentContext";
import { useNotificationBanners, type BannerItem } from "../../context/NotificationBannerContext";

const MotionDiv = motion.div;

function BannerCard({ banner, onClose }: { banner: BannerItem; onClose: () => void }) {
  const { accent } = useAccent();
  const [barWidth, setBarWidth] = useState("100%");
  const dismissTimer = useRef<number | null>(null);

  useEffect(() => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setBarWidth("0%"));
    });
    dismissTimer.current = window.setTimeout(onClose, banner.durationMs);
    return () => { if (dismissTimer.current) clearTimeout(dismissTimer.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [banner.id]);

  return (
    <MotionDiv
      layout
      initial={{ opacity: 0, x: 60 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 40 }}
      transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
      style={{
        width: 310,
        background: "rgba(12,18,22,0.92)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        border: "1px solid rgba(255,255,255,0.12)",
        borderRadius: 16,
        boxShadow: "0 16px 48px rgba(0,0,0,0.6)",
        overflow: "hidden",
        fontFamily: "'HarmonyOS Sans', sans-serif",
        pointerEvents: "auto",
      }}
    >
      <div style={{ padding: "14px 14px 12px 14px", display: "flex", alignItems: "flex-start", gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>{banner.content}</div>

        <button
          onClick={onClose}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 24,
            height: 24,
            borderRadius: 6,
            background: "transparent",
            border: "none",
            cursor: "pointer",
            color: "rgba(255,255,255,0.32)",
            flexShrink: 0,
            padding: 0,
            transition: "color 0.15s, background 0.15s",
          }}
          onMouseEnter={(e) => {
            const btn = e.currentTarget;
            btn.style.color = "rgba(255,255,255,0.7)";
            btn.style.background = "rgba(255,255,255,0.08)";
          }}
          onMouseLeave={(e) => {
            const btn = e.currentTarget;
            btn.style.color = "rgba(255,255,255,0.32)";
            btn.style.background = "transparent";
          }}
        >
          <X size={13} />
        </button>
      </div>

      <div style={{ height: 2, background: "rgba(255,255,255,0.06)" }}>
        <div
          style={{
            height: "100%",
            width: barWidth,
            background: accent,
            transition: `width ${banner.durationMs}ms linear`,
          }}
        />
      </div>
    </MotionDiv>
  );
}

export function NotificationBannerStack() {
  const { banners, dismissBanner } = useNotificationBanners();

  return (
    <div
      style={{
        position: "fixed",
        top: 24,
        right: 24,
        zIndex: 200,
        display: "flex",
        flexDirection: "column",
        gap: 12,
        pointerEvents: "none",
      }}
    >
      <AnimatePresence initial={false}>
        {banners.map((banner) => (
          <BannerCard key={banner.id} banner={banner} onClose={() => dismissBanner(banner.id)} />
        ))}
      </AnimatePresence>
    </div>
  );
}
