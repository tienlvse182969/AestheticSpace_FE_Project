import { useState, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "motion/react";
import { X, Flame } from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import { useAccent } from "../../context/AccentContext";
import { AvatarCircle } from "./panels/AccountPanel";
import { useWelcomeGreeting } from "../../hooks/studyspace/useWelcomeGreeting";

function hexToRgbStr(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r},${g},${b}`;
}

const SESSION_KEY_PREFIX = "asfe_welcome_shown_";

export function WelcomeGreeting() {
  const { user } = useAuth();
  const { accent } = useAccent();
  const greeting = useWelcomeGreeting();
  const [visible, setVisible] = useState(false);
  const [barWidth, setBarWidth] = useState("100%");
  const dismissTimer = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const prevUserIdRef = useRef<string | null>(null);

  // Preload audio when user is available
  useEffect(() => {
    if (!user) {
      // User logged out — clear their session key so banner shows on next login
      if (prevUserIdRef.current) {
        sessionStorage.removeItem(SESSION_KEY_PREFIX + prevUserIdRef.current);
      }
      prevUserIdRef.current = null;
      return;
    }
    prevUserIdRef.current = user.userId;
    audioRef.current = new Audio("/assets/BannerSound/BannerSound.mp3");
    audioRef.current.load();
  }, [user?.userId]);

  useEffect(() => {
    if (!user || greeting.isLoading) return;

    const key = SESSION_KEY_PREFIX + user.userId;
    if (sessionStorage.getItem(key)) return;

    sessionStorage.setItem(key, "1");
    setVisible(true);
    audioRef.current?.play().catch(() => {});

    // Start the progress bar shrink via CSS transition
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setBarWidth("0%"));
    });

    dismissTimer.current = window.setTimeout(() => setVisible(false), 6000);
    return () => { if (dismissTimer.current) clearTimeout(dismissTimer.current); };
  }, [user?.userId, greeting.isLoading]);

  if (!user) return null;

  const { TimeIcon, PraiseIcon, ReturnIcon } = greeting;
  const accentRgb = hexToRgbStr(accent);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, x: 60 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 40 }}
          transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
          style={{
            position: "fixed",
            top: 24,
            right: 24,
            zIndex: 200,
            width: 310,
            background: "rgba(12,18,22,0.92)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: 16,
            boxShadow: "0 16px 48px rgba(0,0,0,0.6)",
            overflow: "hidden",
            fontFamily: "'HarmonyOS Sans', sans-serif",
          }}
        >
          <div style={{ padding: "14px 14px 12px 14px" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
              <AvatarCircle
                user={{
                  name: user.name,
                  email: user.email,
                  avatarUrl: user.avatarUrl ?? undefined,
                  accountTier: user.accountTier,
                }}
                size={38}
                fontSize="0.88rem"
              />

              <div style={{ flex: 1, minWidth: 0 }}>
                {/* Time greeting */}
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                  {TimeIcon && (
                    <TimeIcon size={14} style={{ color: accent, flexShrink: 0 }} />
                  )}
                  <span
                    style={{
                      color: "rgba(255,255,255,0.92)",
                      fontSize: "0.87rem",
                      fontWeight: 600,
                      lineHeight: 1.3,
                    }}
                  >
                    {greeting.timeGreeting}
                  </span>
                </div>

                {/* Return message (priority) or praise message */}
                {greeting.returnMessage && ReturnIcon ? (
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 5, marginTop: 5 }}>
                    <ReturnIcon
                      size={12}
                      style={{ color: "rgba(255,255,255,0.4)", flexShrink: 0, marginTop: 1 }}
                    />
                    <span style={{ color: "rgba(255,255,255,0.48)", fontSize: "0.75rem", lineHeight: 1.45 }}>
                      {greeting.returnMessage}
                    </span>
                  </div>
                ) : greeting.praiseMessage ? (
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 5, marginTop: 5 }}>
                    {PraiseIcon && (
                      <PraiseIcon
                        size={12}
                        style={{ color: accent, opacity: 0.7, flexShrink: 0, marginTop: 1 }}
                      />
                    )}
                    <span style={{ color: "rgba(255,255,255,0.48)", fontSize: "0.75rem", lineHeight: 1.45 }}>
                      {greeting.praiseMessage}
                    </span>
                  </div>
                ) : null}

                {/* Streak badge */}
                {greeting.streakDays >= 3 && (
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      marginTop: 8,
                      padding: "2px 8px 2px 6px",
                      borderRadius: 20,
                      background: `rgba(${accentRgb},0.14)`,
                      border: `1px solid rgba(${accentRgb},0.32)`,
                    }}
                  >
                    <Flame size={10} style={{ color: accent, flexShrink: 0 }} />
                    <span
                      style={{
                        color: accent,
                        fontSize: "0.7rem",
                        fontWeight: 600,
                        letterSpacing: "0.03em",
                      }}
                    >
                      {greeting.streakDays >= 7
                        ? `${greeting.streakDays} ngày! Bạn thật kiên trì`
                        : `${greeting.streakDays} ngày liên tiếp`}
                    </span>
                  </div>
                )}
              </div>

              {/* Close button */}
              <button
                onClick={() => setVisible(false)}
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
          </div>

          {/* Auto-dismiss progress bar */}
          <div style={{ height: 2, background: "rgba(255,255,255,0.06)" }}>
            <div
              style={{
                height: "100%",
                width: barWidth,
                background: accent,
                transition: "width 6s linear",
              }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
