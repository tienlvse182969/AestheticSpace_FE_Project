import { useEffect, useRef } from "react";
import { Flame } from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import { useAccent } from "../../context/AccentContext";
import { AvatarCircle } from "./panels/AccountPanel";
import { useWelcomeGreeting } from "../../hooks/studyspace/useWelcomeGreeting";
import { useNotificationBanners } from "../../context/NotificationBannerContext";

function hexToRgbStr(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r},${g},${b}`;
}

const SESSION_KEY_PREFIX = "asfe_welcome_shown_";

/**
 * Logic-only: decides when to show the welcome greeting and pushes it into the
 * shared notification banner queue (rendered by NotificationBannerStack) instead
 * of rendering its own fixed card, so it stacks together with real notifications.
 */
export function WelcomeGreeting() {
  const { user } = useAuth();
  const { accent } = useAccent();
  const greeting = useWelcomeGreeting();
  const { pushBanner } = useNotificationBanners();
  const prevUserIdRef = useRef<string | null>(null);

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
  }, [user?.userId]);

  useEffect(() => {
    if (!user || greeting.isLoading) return;

    const key = SESSION_KEY_PREFIX + user.userId;
    if (sessionStorage.getItem(key)) return;

    sessionStorage.setItem(key, "1");

    const { TimeIcon, PraiseIcon, ReturnIcon } = greeting;
    const accentRgb = hexToRgbStr(accent);

    pushBanner({
      id: `welcome_${user.userId}`,
      durationMs: 6000,
      content: (
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
              {TimeIcon && <TimeIcon size={14} style={{ color: accent, flexShrink: 0 }} />}
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
        </div>
      ),
    });
  }, [user?.userId, greeting.isLoading]);

  return null;
}
