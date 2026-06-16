import { useState } from "react";
import { Box, Flex, Text } from "@chakra-ui/react";
import { motion } from "motion/react";
import { useTranslation } from "react-i18next";
import { Settings, Moon, Bell, BellOff, Globe, Check, Pipette, Info, Users } from "lucide-react";
import { PanelCloseBtn } from "../ui/PanelCloseBtn";
import { useCenteredPanel } from "../hooks/useCenteredPanel";
import { useAccent } from "../../../context/AccentContext";
import { useAuth } from "../../../../context/AuthContext";
import { AvatarCircle } from "./AccountPanel";
import { APP_VERSION } from "../../../../version";

const MotionBox = motion.create(Box);

const ACCENT_PRESETS = [
  { hex: "#4e7c6a", label: "Sage"   },
  { hex: "#3b82f6", label: "Blue"   },
  { hex: "#8b5cf6", label: "Violet" },
  { hex: "#ec4899", label: "Pink"   },
  { hex: "#ef4444", label: "Red"    },
  { hex: "#f59e0b", label: "Amber"  },
  { hex: "#14b8a6", label: "Teal"   },
];
const PRESET_HEXES = ACCENT_PRESETS.map(p => p.hex);

type NavKey = "appearance" | "language" | "accent" | "notifications" | "about";

const NAV_ITEMS: {
  key: NavKey;
  icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>;
  color: string;
}[] = [
  { key: "appearance",    icon: Moon,    color: "#6366f1" },
  { key: "language",      icon: Globe,   color: "#0ea5e9" },
  { key: "accent",        icon: Pipette, color: "#8b5cf6" },
  { key: "notifications", icon: Bell,    color: "#f59e0b" },
  { key: "about",         icon: Info,    color: "#14b8a6" },
];

function Toggle({ on, onChange, disabled, accentColor }: {
  on: boolean; onChange: () => void; disabled?: boolean; accentColor?: string;
}) {
  return (
    <Box
      as="button"
      onClick={disabled ? undefined : onChange}
      border="none"
      flexShrink={0}
      style={{
        width: 40, height: 22,
        borderRadius: 11,
        background: on ? (accentColor || "#4e7c6a") : "rgba(255,255,255,0.12)",
        position: "relative",
        transition: "background 0.22s",
        padding: 0,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.4 : 1,
      }}
    >
      <Box style={{
        position: "absolute",
        top: 3,
        left: on ? 21 : 3,
        width: 16, height: 16,
        borderRadius: "50%",
        background: "white",
        transition: "left 0.22s",
        boxShadow: "0 1px 4px rgba(0,0,0,0.35)",
      }} />
    </Box>
  );
}

export function SettingsPanel({ onClose }: { onClose: () => void }) {
  const { t, i18n } = useTranslation();
  const { x, y, ref } = useCenteredPanel(760, 540);
  const { accent, setAccent } = useAccent();
  const { user } = useAuth();
  const isCustomAccent = !PRESET_HEXES.includes(accent);
  const [activeNav, setActiveNav] = useState<NavKey>("appearance");

  const [notifEnabled, setNotifEnabled] = useState<boolean>(
    () => localStorage.getItem("notifications") === "enabled",
  );
  const [notifDenied, setNotifDenied] = useState(
    () => typeof window !== "undefined" && (window as any).Notification?.permission === "denied",
  );
  const notifSupported = typeof window !== "undefined" && "Notification" in window;

  const toggleNotifications = async () => {
    if (notifEnabled) {
      setNotifEnabled(false);
      localStorage.setItem("notifications", "disabled");
      return;
    }
    if (Notification.permission === "granted") {
      setNotifEnabled(true);
      localStorage.setItem("notifications", "enabled");
    } else if (Notification.permission === "default") {
      const perm = await Notification.requestPermission();
      if (perm === "granted") {
        setNotifEnabled(true);
        setNotifDenied(false);
        localStorage.setItem("notifications", "enabled");
      } else {
        setNotifDenied(true);
      }
    } else {
      setNotifDenied(true);
    }
  };

  const changeLang = (lang: string) => {
    i18n.changeLanguage(lang);
    localStorage.setItem("lang", lang);
  };

  const NAV_LABELS: Record<NavKey, string> = {
    appearance:    t("settings.appearance"),
    language:      t("settings.language"),
    accent:        t("settings.accentColor"),
    notifications: t("settings.notifications"),
    about:         t("about.label"),
  };

  const renderContent = () => {
    switch (activeNav) {
      case "appearance":
        return (
          <Box style={{ opacity: 0.38, pointerEvents: "none", userSelect: "none" }}>
            <Flex
              align="center" justify="space-between"
              px="14px" py="12px" borderRadius="10px"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
            >
              <Flex align="center" gap={3}>
                <Moon size={15} style={{ color: "rgba(255,255,255,0.4)" }} />
                <Box>
                  <Text style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.82)", fontFamily: "'HarmonyOS Sans', sans-serif" }}>
                    {t("settings.darkMode")}
                  </Text>
                  <Text style={{ fontSize: "0.7rem", color: "rgba(251,191,36,0.65)", fontFamily: "'HarmonyOS Sans', sans-serif", marginTop: 2 }}>
                    {t("settings.comingSoon")}
                  </Text>
                </Box>
              </Flex>
              <Toggle on={false} onChange={() => {}} disabled />
            </Flex>
          </Box>
        );

      case "language":
        return (
          <Box style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {["vi", "en"].map((lang) => (
              <Box
                key={lang}
                as="button"
                border="none"
                cursor="pointer"
                onClick={() => changeLang(lang)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px 14px",
                  borderRadius: 10,
                  background: i18n.language === lang ? "rgba(255,255,255,0.09)" : "rgba(255,255,255,0.03)",
                  border: `1px solid ${i18n.language === lang ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.06)"}`,
                  width: "100%",
                }}
              >
                <Flex align="center" gap={3}>
                  <Globe size={15} style={{ color: i18n.language === lang ? "white" : "rgba(255,255,255,0.4)" }} />
                  <Text style={{
                    fontSize: "0.85rem",
                    color: i18n.language === lang ? "rgba(255,255,255,0.92)" : "rgba(255,255,255,0.55)",
                    fontFamily: "'HarmonyOS Sans', sans-serif",
                    fontWeight: i18n.language === lang ? 600 : 400,
                  }}>
                    {lang === "vi" ? "Tiếng Việt" : "English"}
                  </Text>
                </Flex>
                {i18n.language === lang && <Check size={14} style={{ color: accent }} />}
              </Box>
            ))}
          </Box>
        );

      case "accent":
        return (
          <Box>
            <Flex wrap="wrap" gap="12px" mb="16px">
              {ACCENT_PRESETS.map(({ hex, label }) => {
                const isOn = accent === hex;
                return (
                  <Box
                    key={hex}
                    as="button"
                    onClick={() => setAccent(hex)}
                    title={label}
                    border="none"
                    cursor="pointer"
                    position="relative"
                    style={{
                      width: 32, height: 32,
                      borderRadius: "50%",
                      background: hex,
                      outline: isOn ? "2.5px solid white" : "2px solid rgba(255,255,255,0.15)",
                      outlineOffset: isOn ? 3 : 0,
                      transform: isOn ? "scale(1.18)" : "scale(1)",
                      transition: "transform 0.15s, outline 0.15s",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {isOn && <Check size={13} strokeWidth={3} style={{ color: "white" }} />}
                  </Box>
                );
              })}

              {/* Custom color picker */}
              <Box position="relative" style={{ width: 32, height: 32 }}>
                <label
                  htmlFor="accent-custom-picker"
                  title={t("settings.custom")}
                  style={{
                    width: 32, height: 32,
                    borderRadius: "50%",
                    background: isCustomAccent ? accent : "rgba(255,255,255,0.07)",
                    outline: isCustomAccent ? "2.5px solid white" : "2px dashed rgba(255,255,255,0.22)",
                    outlineOffset: isCustomAccent ? 3 : 0,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transform: isCustomAccent ? "scale(1.18)" : "scale(1)",
                    transition: "transform 0.15s",
                  }}
                >
                  <Pipette size={12} style={{ color: isCustomAccent ? "white" : "rgba(255,255,255,0.45)" }} />
                </label>
                <input
                  id="accent-custom-picker"
                  type="color"
                  value={accent}
                  onPointerDown={(e: React.PointerEvent) => e.stopPropagation()}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAccent(e.target.value)}
                  style={{
                    position: "absolute", inset: 0,
                    opacity: 0, cursor: "pointer",
                    width: "100%", height: "100%",
                  }}
                />
              </Box>
            </Flex>

            {/* Preview bar */}
            <Box borderRadius="8px" style={{ height: 5, background: `linear-gradient(to right, ${accent}, ${accent}44)` }} />
          </Box>
        );

      case "notifications":
        return (
          <Flex
            align="center" justify="space-between"
            px="14px" py="12px" borderRadius="10px"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
          >
            <Flex align="center" gap={3} flex={1} minW={0} pr={3}>
              {notifEnabled
                ? <Bell    size={15} style={{ color: "rgba(255,255,255,0.4)" }} />
                : <BellOff size={15} style={{ color: "rgba(255,255,255,0.4)" }} />
              }
              <Box>
                <Text style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.82)", fontFamily: "'HarmonyOS Sans', sans-serif" }}>
                  {t("settings.browserNotif")}
                </Text>
                <Text style={{
                  fontSize: "0.7rem",
                  color: notifDenied ? "rgba(251,191,36,0.65)" : "rgba(255,255,255,0.3)",
                  fontFamily: "'HarmonyOS Sans', sans-serif",
                  marginTop: 2, lineHeight: 1.4,
                }}>
                  {!notifSupported
                    ? t("settings.notifUnsupported")
                    : notifDenied
                    ? t("settings.notifDenied")
                    : t("settings.browserNotifDesc")}
                </Text>
              </Box>
            </Flex>
            <Toggle
              on={notifEnabled}
              onChange={toggleNotifications}
              disabled={!notifSupported || notifDenied}
              accentColor={accent}
            />
          </Flex>
        );

      case "about":
        return (
          <Box>
            {/* Title block — hero image */}
            <Box mb={4} position="relative" style={{
              borderRadius: 12,
              overflow: "hidden",
              height: 120,
              border: "1px solid rgba(255,255,255,0.08)",
            }}>
              <img
                src="/assets/AboutWallpaper/dan-otis-OYFHT4X5isg-unsplash.jpg"
                alt=""
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
              />
              {/* gradient overlay */}
              <Box position="absolute" style={{
                inset: 0,
                background: "linear-gradient(to top, rgba(8,14,18,0.85) 0%, rgba(8,14,18,0.2) 55%, transparent 100%)",
              }} />
              {/* logo text */}
              <Box position="absolute" style={{ bottom: 12, left: 14 }}>
                <Flex align="center" gap="8px" mb="4px">
                  <Text style={{ fontSize: "1.2rem", color: "rgba(255,255,255,0.95)", letterSpacing: "-0.01em", lineHeight: 1 }}>
                    <span style={{ fontFamily: "'Manrope', sans-serif" }}>Aēsthetic</span>
                    <span style={{ fontFamily: "'HarmonyOS Sans', sans-serif" }}> Space</span>
                  </Text>
                  <Box style={{
                    fontSize: "0.62rem",
                    color: "rgba(94,234,212,0.8)",
                    fontFamily: "'HarmonyOS Sans', sans-serif",
                    letterSpacing: "0.08em",
                    background: "rgba(94,234,212,0.12)",
                    border: "1px solid rgba(94,234,212,0.25)",
                    borderRadius: "5px",
                    padding: "2px 7px",
                    lineHeight: 1.4,
                  }}>
                    v{APP_VERSION}
                  </Box>
                </Flex>
                <Text style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.5)", fontFamily: "'HarmonyOS Sans', sans-serif" }}>
                  {t("about.desc")}
                </Text>
              </Box>
            </Box>

            {/* Contributors */}
            <Box mb={4} p="12px 14px" borderRadius="12px"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
            >
              <Flex align="center" gap={2} mb={3}>
                <Users size={13} style={{ color: "rgba(94,234,212,0.6)" }} />
                <Text style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em", fontFamily: "'HarmonyOS Sans', sans-serif" }}>
                  {t("about.contributors")}
                </Text>
              </Flex>
              <Flex wrap="wrap" gap="6px">
                {["Phạm Thu Hiền", "Nguyễn Hồng Ngọc", "Trần Hoàng Duy", "Lê Văn Tiến", "Trần Quốc Nam"].map((name) => (
                  <Box key={name} style={{
                    fontSize: "0.76rem",
                    color: "rgba(255,255,255,0.65)",
                    fontFamily: "'HarmonyOS Sans', sans-serif",
                    background: "rgba(94,234,212,0.07)",
                    border: "1px solid rgba(94,234,212,0.15)",
                    borderRadius: "20px",
                    padding: "3px 10px",
                  }}>
                    {name}
                  </Box>
                ))}
              </Flex>
            </Box>

            {/* Footer */}
            <Text style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.2)", fontFamily: "'HarmonyOS Sans', sans-serif", letterSpacing: "0.06em" }}>
              {t("about.copyright")}
            </Text>
          </Box>
        );
    }
  };

  return (
    <MotionBox
      ref={ref as any}
      drag
      dragMomentum={false}
      dragElastic={0}
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1, transition: { type: "spring", stiffness: 500, damping: 24, mass: 0.9 } } as any}
      exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.14, ease: [0.4, 0, 1, 1] } } as any}
      position="fixed"
      top={0}
      left={0}
      zIndex={50}
      style={{
        x, y,
        width: 760,
        height: 540,
        borderRadius: "16px",
        background: "rgba(12,18,22,0.75)",
        backdropFilter: "blur(18px)",
        WebkitBackdropFilter: "blur(18px)",
        border: "1px solid rgba(255,255,255,0.1)",
        boxShadow: "0 24px 80px rgba(0,0,0,0.75), 0 0 0 1px rgba(255,255,255,0.08)",
        cursor: "grab",
        overflow: "hidden",
        display: "flex",
      }}
    >
      {/* ── Left sidebar ── */}
      <Box style={{
        width: 220,
        flexShrink: 0,
        background: "rgba(0,0,0,0.28)",
        borderRight: "1px solid rgba(255,255,255,0.07)",
        padding: "20px 10px",
        display: "flex",
        flexDirection: "column",
      }}>
        {/* ── Account card ── */}
        <Box
          mb="16px"
          px="10px" py="12px"
          borderRadius="10px"
          style={{
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <Flex align="center" gap={3}>
            <AvatarCircle user={user ? { ...user, avatarUrl: user.avatarUrl ?? undefined } : null} size={38} fontSize="0.85rem" />
            <Box minW={0} flex={1}>
              <Text style={{
                fontSize: "0.82rem", fontWeight: 600,
                color: "rgba(255,255,255,0.88)",
                fontFamily: "'HarmonyOS Sans', sans-serif",
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>
                {user?.name ?? t("account.guest")}
              </Text>
              <Text style={{
                fontSize: "0.66rem",
                color: "rgba(255,255,255,0.35)",
                fontFamily: "'HarmonyOS Sans', sans-serif",
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                marginTop: 1,
              }}>
                {user?.email ?? t("account.demoMode")}
              </Text>
            </Box>
          </Flex>
        </Box>

        {/* ── Nav header ── */}
        <Flex align="center" gap={2} mb="12px" px="8px">
          <Settings size={13} style={{ color: "rgba(255,255,255,0.3)" }} />
          <Text style={{
            fontSize: "0.6rem",
            color: "rgba(255,255,255,0.25)",
            letterSpacing: "0.12em",
            fontFamily: "'HarmonyOS Sans', sans-serif",
          }}>
            {t("settings.title").toUpperCase()}
          </Text>
        </Flex>

        <Box style={{ display: "flex", flexDirection: "column", gap: 3 }}>
          {NAV_ITEMS.map(({ key, icon: Icon, color }) => {
            const isActive = activeNav === key;
            return (
              <Box
                key={key}
                as="button"
                border="none"
                cursor="pointer"
                onClick={() => setActiveNav(key)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "8px 10px",
                  borderRadius: 9,
                  background: isActive ? "rgba(255,255,255,0.1)" : "transparent",
                  transition: "background 0.15s",
                  textAlign: "left",
                  width: "100%",
                }}
              >
                <Box style={{
                  width: 26, height: 26,
                  borderRadius: 6,
                  background: isActive ? color : "rgba(255,255,255,0.07)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  transition: "background 0.15s",
                }}>
                  <Icon size={13} style={{ color: isActive ? "white" : "rgba(255,255,255,0.38)" }} />
                </Box>
                <Text style={{
                  fontSize: "0.82rem",
                  color: isActive ? "rgba(255,255,255,0.92)" : "rgba(255,255,255,0.48)",
                  fontFamily: "'HarmonyOS Sans', sans-serif",
                  fontWeight: isActive ? 600 : 400,
                  transition: "color 0.15s",
                }}>
                  {NAV_LABELS[key]}
                </Text>
              </Box>
            );
          })}
        </Box>
      </Box>

      {/* ── Right content ── */}
      <Box style={{ flex: 1, padding: "20px 18px", overflowY: "auto", position: "relative" }}>
        <PanelCloseBtn onClose={onClose} />

        <Text mb="16px" style={{
          fontSize: "0.6rem",
          color: "rgba(255,255,255,0.22)",
          letterSpacing: "0.14em",
          fontFamily: "'HarmonyOS Sans', sans-serif",
        }}>
          {NAV_LABELS[activeNav].toUpperCase()}
        </Text>

        {renderContent()}
      </Box>
    </MotionBox>
  );
}
