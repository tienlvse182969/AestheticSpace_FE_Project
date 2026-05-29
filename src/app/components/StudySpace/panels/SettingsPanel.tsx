import { useState } from "react";
import { Box, Flex, Text } from "@chakra-ui/react";
import { motion } from "motion/react";
import { useTranslation } from "react-i18next";
import { Settings, Moon, Sun, Bell, BellOff, Globe, Check, Pipette } from "lucide-react";
import { PanelCloseBtn } from "../ui/PanelCloseBtn";
import { useCenteredPanel } from "../hooks/useCenteredPanel";
import { useAccent } from "../../../context/AccentContext";

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

// ── Toggle switch ──────────────────────────────────────────────────────────────
function Toggle({ on, onChange, disabled }: { on: boolean; onChange: () => void; disabled?: boolean }) {
  return (
    <Box
      as="button"
      onClick={disabled ? undefined : onChange}
      border="none"
      flexShrink={0}
      style={{
        width: 40,
        height: 22,
        borderRadius: 11,
        background: on ? "#4e7c6a" : "rgba(255,255,255,0.12)",
        position: "relative",
        transition: "background 0.22s",
        padding: 0,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.4 : 1,
      }}
    >
      <Box
        style={{
          position: "absolute",
          top: 3,
          left: on ? 21 : 3,
          width: 16,
          height: 16,
          borderRadius: "50%",
          background: "white",
          transition: "left 0.22s",
          boxShadow: "0 1px 4px rgba(0,0,0,0.35)",
        }}
      />
    </Box>
  );
}

// ── Section label ──────────────────────────────────────────────────────────────
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <Text mb="8px" style={{
      fontSize: "0.6rem",
      color: "rgba(255,255,255,0.22)",
      letterSpacing: "0.14em",
      fontFamily: "'HarmonyOS Sans', sans-serif",
    }}>
      {children}
    </Text>
  );
}

// ── Setting row ────────────────────────────────────────────────────────────────
function SettingRow({
  icon: Icon, label, desc, right, warn,
}: {
  icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>;
  label: string;
  desc?: string;
  right: React.ReactNode;
  warn?: boolean;
}) {
  return (
    <Flex
      align="center"
      justify="space-between"
      px="12px"
      py="10px"
      borderRadius="10px"
      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
    >
      <Flex align="center" gap={3} flex={1} minW={0} pr={3}>
        <Icon size={15} style={{ color: "rgba(255,255,255,0.4)", flexShrink: 0 }} />
        <Box>
          <Text style={{
            fontSize: "0.82rem",
            color: "rgba(255,255,255,0.82)",
            fontFamily: "'HarmonyOS Sans', sans-serif",
          }}>
            {label}
          </Text>
          {desc && (
            <Text style={{
              fontSize: "0.7rem",
              color: warn ? "rgba(251,191,36,0.65)" : "rgba(255,255,255,0.3)",
              fontFamily: "'HarmonyOS Sans', sans-serif",
              marginTop: 2,
              lineHeight: 1.4,
            }}>
              {desc}
            </Text>
          )}
        </Box>
      </Flex>
      <Box flexShrink={0}>{right}</Box>
    </Flex>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export function SettingsPanel({ onClose }: { onClose: () => void }) {
  const { t, i18n } = useTranslation();
  const { x, y, ref } = useCenteredPanel(380, 500);
  const { accent, setAccent } = useAccent();
  const isCustomAccent = !PRESET_HEXES.includes(accent);

  const [isDark, setIsDark] = useState<boolean>(
    () => (localStorage.getItem("theme") ?? "dark") !== "light",
  );
  const [notifEnabled, setNotifEnabled] = useState<boolean>(
    () => localStorage.getItem("notifications") === "enabled",
  );
  const [notifDenied, setNotifDenied] = useState(
    () => typeof window !== "undefined" && (window as any).Notification?.permission === "denied",
  );

  const notifSupported = typeof window !== "undefined" && "Notification" in window;

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    const val = next ? "dark" : "light";
    localStorage.setItem("theme", val);
    document.documentElement.setAttribute("data-theme", val);
  };

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
        width: 380,
        height: 500,
        borderRadius: "16px",
        background: "rgba(12,18,22,0.75)",
        backdropFilter: "blur(18px)",
        WebkitBackdropFilter: "blur(18px)",
        border: "1px solid rgba(255,255,255,0.1)",
        boxShadow: "0 24px 80px rgba(0,0,0,0.75), 0 0 0 1px rgba(255,255,255,0.08)",
        cursor: "grab",
        overflow: "hidden",
      }}
    >
      <Box position="relative" style={{ padding: "18px 18px 20px", height: "100%", overflowY: "auto" }}>
        <PanelCloseBtn onClose={onClose} />

        {/* Header */}
        <Flex align="center" gap={2} mb={5}>
          <Settings size={15} style={{ color: "rgba(255,255,255,0.5)" }} />
          <Text style={{
            fontSize: "0.7rem",
            color: "rgba(255,255,255,0.35)",
            letterSpacing: "0.1em",
            fontFamily: "'HarmonyOS Sans', sans-serif",
          }}>
            {t("settings.title").toUpperCase()}
          </Text>
        </Flex>

        {/* ── Appearance ── */}
        <SectionLabel>{t("settings.appearance").toUpperCase()}</SectionLabel>
        <Box style={{ opacity: 0.38, pointerEvents: "none", userSelect: "none" }}>
          <SettingRow
            icon={Moon}
            label={t("settings.darkMode")}
            desc={t("settings.comingSoon")}
            warn
            right={<Toggle on={false} onChange={() => {}} disabled />}
          />
        </Box>

        {/* ── Language ── */}
        <Box mt={4}>
          <SectionLabel>{t("settings.language").toUpperCase()}</SectionLabel>
          <Flex
            align="center"
            justify="space-between"
            px="12px"
            py="10px"
            borderRadius="10px"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
          >
            <Flex align="center" gap={3}>
              <Globe size={15} style={{ color: "rgba(255,255,255,0.4)", flexShrink: 0 }} />
              <Text style={{
                fontSize: "0.82rem",
                color: "rgba(255,255,255,0.82)",
                fontFamily: "'HarmonyOS Sans', sans-serif",
              }}>
                {t("settings.language")}
              </Text>
            </Flex>
            <Flex
              align="center"
              gap={0}
              borderRadius="8px"
              overflow="hidden"
              style={{ border: "1px solid rgba(255,255,255,0.12)" }}
            >
              {["vi", "en"].map((lang) => (
                <Box
                  as="button"
                  key={lang}
                  onClick={() => changeLang(lang)}
                  px="10px"
                  py="5px"
                  border="none"
                  cursor="pointer"
                  transition="all 0.18s"
                  style={{
                    background: i18n.language === lang ? "rgba(255,255,255,0.18)" : "transparent",
                    color: i18n.language === lang ? "white" : "rgba(255,255,255,0.38)",
                    fontSize: "0.72rem",
                    fontWeight: 600,
                    letterSpacing: "0.05em",
                    fontFamily: "'HarmonyOS Sans', sans-serif",
                  }}
                >
                  {lang.toUpperCase()}
                </Box>
              ))}
            </Flex>
          </Flex>
        </Box>

        {/* ── Accent Color ── */}
        <Box mt={4}>
          <SectionLabel>{t("settings.accentColor").toUpperCase()}</SectionLabel>
          <Box
            px="14px" py="14px" borderRadius="10px"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
          >
            <Flex wrap="wrap" gap="10px" mb="12px">
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
                      width: 28, height: 28,
                      borderRadius: "50%",
                      background: hex,
                      outline: isOn ? `2px solid white` : "2px solid rgba(255,255,255,0.15)",
                      outlineOffset: isOn ? 2 : 0,
                      transform: isOn ? "scale(1.18)" : "scale(1)",
                      transition: "transform 0.15s, outline 0.15s",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {isOn && <Check size={12} strokeWidth={3} style={{ color: "white" }} />}
                  </Box>
                );
              })}

              {/* Custom color picker */}
              <Box position="relative" style={{ width: 28, height: 28 }}>
                <Box
                  as="label"
                  htmlFor="accent-custom-picker"
                  title={t("settings.custom")}
                  style={{
                    width: 28, height: 28,
                    borderRadius: "50%",
                    background: isCustomAccent ? accent : "rgba(255,255,255,0.07)",
                    outline: isCustomAccent ? "2px solid white" : "2px dashed rgba(255,255,255,0.22)",
                    outlineOffset: isCustomAccent ? 2 : 0,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transform: isCustomAccent ? "scale(1.18)" : "scale(1)",
                    transition: "transform 0.15s",
                  }}
                >
                  <Pipette size={11} style={{ color: isCustomAccent ? "white" : "rgba(255,255,255,0.45)" }} />
                </Box>
                <Box
                  as="input"
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
            <Box
              borderRadius="6px"
              style={{
                height: 4,
                background: `linear-gradient(to right, var(--accent), rgba(var(--accent-rgb), 0.25))`,
              }}
            />
          </Box>
        </Box>

        {/* ── Notifications ── */}
        <Box mt={4}>
          <SectionLabel>{t("settings.notifications").toUpperCase()}</SectionLabel>
          <SettingRow
            icon={notifEnabled ? Bell : BellOff}
            label={t("settings.browserNotif")}
            desc={
              !notifSupported
                ? t("settings.notifUnsupported")
                : notifDenied
                ? t("settings.notifDenied")
                : t("settings.browserNotifDesc")
            }
            warn={notifDenied}
            right={
              <Toggle
                on={notifEnabled}
                onChange={toggleNotifications}
                disabled={!notifSupported || notifDenied}
              />
            }
          />
        </Box>
      </Box>
    </MotionBox>
  );
}
