import { useState } from "react";
import { Box, Flex, Text } from "@chakra-ui/react";
import { motion } from "motion/react";
import { useTranslation } from "react-i18next";
import { Settings, Moon, Bell, BellOff, Globe, Check, Pipette, Info, Users, KeyRound, AtSign, Loader, CreditCard, Monitor } from "lucide-react";
import { PanelCloseBtn } from "../ui/PanelCloseBtn";
import { useCenteredPanel } from "../hooks/useCenteredPanel";
import { useAccent } from "../../../context/AccentContext";
import { useToolbarPosition } from "../../../context/ToolbarPositionContext";
import { useAuth } from "../../../../context/AuthContext";
import { AvatarCircle } from "./AccountPanel";
import { APP_VERSION } from "../../../../version";
import { authService } from "../../../../services/auth.service";

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

const FLAG_VN = (
  <svg viewBox="0 0 30 20" width="24" height="16" style={{ display: "block", borderRadius: 2 }}>
    <rect width="30" height="20" fill="#DA251D"/>
    <polygon fill="#FFFF00" points="15,4.5 16.2,8.3 20.2,8.3 17,10.6 18.2,14.5 15,12.1 11.8,14.5 13,10.6 9.8,8.3 13.8,8.3"/>
  </svg>
);

const FLAG_GB = (
  <svg viewBox="0 0 30 20" width="24" height="16" style={{ display: "block", borderRadius: 2 }}>
    <rect width="30" height="20" fill="#012169"/>
    <line x1="0" y1="0" x2="30" y2="20" stroke="white" strokeWidth="6"/>
    <line x1="30" y1="0" x2="0" y2="20" stroke="white" strokeWidth="6"/>
    <polygon fill="#C8102E" points="0,0 3,0 30,18 30,20 27,20 0,2"/>
    <polygon fill="#C8102E" points="30,0 27,0 0,18 0,20 3,20 30,2"/>
    <rect x="12" y="0" width="6" height="20" fill="white"/>
    <rect x="0" y="7" width="30" height="6" fill="white"/>
    <rect x="13" y="0" width="4" height="20" fill="#C8102E"/>
    <rect x="0" y="8" width="30" height="4" fill="#C8102E"/>
  </svg>
);

type NavKey = "display" | "language" | "notifications" | "about" | "account";

const NAV_ITEMS: {
  key: NavKey;
  icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>;
  color: string;
}[] = [
  { key: "display",       icon: Monitor, color: "#6366f1" },
  { key: "language",      icon: Globe,   color: "#0ea5e9" },
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
  const { position: toolbarPos, setPosition: setToolbarPos } = useToolbarPosition();
  const { user, updateUsername } = useAuth();
  const isCustomAccent = !PRESET_HEXES.includes(accent);
  const [activeNav, setActiveNav] = useState<NavKey>("display");

  const [newUsername, setNewUsername] = useState("");
  const [usernameStatus, setUsernameStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const [resetStatus, setResetStatus] = useState<"idle" | "loading" | "sent" | "error">("idle");

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
    account:       t("settings.accountSection"),
    display:       t("settings.display"),
    language:      t("settings.language"),
    notifications: t("settings.notifications"),
    about:         t("about.label"),
  };

  const handleUsernameSubmit = async () => {
    if (!newUsername.trim() || newUsername.trim().length < 3) return;
    setUsernameStatus("loading");
    try {
      await updateUsername(newUsername.trim());
      setUsernameStatus("success");
      setNewUsername("");
      setTimeout(() => setUsernameStatus("idle"), 3000);
    } catch {
      setUsernameStatus("error");
      setTimeout(() => setUsernameStatus("idle"), 3000);
    }
  };

  const handleResetPassword = async () => {
    if (!user?.email) return;
    setResetStatus("loading");
    try {
      await authService.forgotPassword(user.email);
      setResetStatus("sent");
      setTimeout(() => setResetStatus("idle"), 5000);
    } catch {
      setResetStatus("error");
      setTimeout(() => setResetStatus("idle"), 3000);
    }
  };

  const renderContent = () => {
    switch (activeNav) {
      case "account":
        if (!user) {
          return (
            <Flex direction="column" align="center" justify="center" style={{ height: 200, gap: 8 }}>
              <Text style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.45)", fontFamily: "'HarmonyOS Sans', sans-serif" }}>
                {t("account.signInPrompt")}
              </Text>
            </Flex>
          );
        }
        return (
          <Box style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* Change username */}
            <Box p="14px" borderRadius="12px"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              <Flex align="center" gap={2} mb="10px">
                <AtSign size={13} style={{ color: "rgba(232,121,249,0.7)" }} />
                <Text style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.35)", letterSpacing: "0.1em", fontFamily: "'HarmonyOS Sans', sans-serif" }}>
                  {t("settings.changeUsername").toUpperCase()}
                </Text>
              </Flex>
              <Text style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.35)", fontFamily: "'HarmonyOS Sans', sans-serif", marginBottom: 10 }}>
                {t("account.guest") === user.name ? "" : `@${user.name}`}
              </Text>
              <Flex gap={8} align="center">
                <input
                  value={newUsername}
                  onChange={e => setNewUsername(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleUsernameSubmit()}
                  placeholder={t("settings.changeUsernamePlaceholder")}
                  maxLength={32}
                  style={{
                    flex: 1,
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.12)",
                    borderRadius: 8,
                    padding: "8px 12px",
                    fontSize: "0.82rem",
                    color: "rgba(255,255,255,0.85)",
                    fontFamily: "'HarmonyOS Sans', sans-serif",
                    outline: "none",
                  }}
                />
                <Box
                  as="button"
                  onClick={(!newUsername.trim() || newUsername.trim().length < 3 || usernameStatus === "loading") ? undefined : handleUsernameSubmit}
                  style={{
                    padding: "8px 16px",
                    borderRadius: 8,
                    background: usernameStatus === "success" ? "rgba(34,197,94,0.2)" : "rgba(232,121,249,0.18)",
                    border: `1px solid ${usernameStatus === "success" ? "rgba(34,197,94,0.35)" : "rgba(232,121,249,0.3)"}`,
                    color: usernameStatus === "success" ? "rgba(134,239,172,0.9)" : "rgba(232,121,249,0.9)",
                    fontSize: "0.78rem",
                    fontFamily: "'HarmonyOS Sans', sans-serif",
                    cursor: (!newUsername.trim() || newUsername.trim().length < 3) ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    whiteSpace: "nowrap",
                    flexShrink: 0,
                    opacity: (!newUsername.trim() || newUsername.trim().length < 3) ? 0.4 : 1,
                  }}
                >
                  {usernameStatus === "loading"
                    ? <Loader size={13} style={{ animation: "spin 1s linear infinite" }} />
                    : usernameStatus === "success"
                    ? <Check size={13} />
                    : null}
                  {usernameStatus === "success" ? t("settings.changeUsernameSuccess") : t("settings.changeUsernameSave")}
                </Box>
              </Flex>
              {usernameStatus === "error" && (
                <Text style={{ fontSize: "0.7rem", color: "rgba(248,113,113,0.8)", fontFamily: "'HarmonyOS Sans', sans-serif", marginTop: 6 }}>
                  {t("settings.changeUsernameError")}
                </Text>
              )}
            </Box>

            {/* Reset password */}
            <Box p="14px" borderRadius="12px"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              <Flex align="center" gap={2} mb="10px">
                <KeyRound size={13} style={{ color: "rgba(251,191,36,0.7)" }} />
                <Text style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.35)", letterSpacing: "0.1em", fontFamily: "'HarmonyOS Sans', sans-serif" }}>
                  {t("settings.resetPassword").toUpperCase()}
                </Text>
              </Flex>
              <Text style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.45)", fontFamily: "'HarmonyOS Sans', sans-serif", marginBottom: 10 }}>
                {t("settings.resetPasswordDesc")}
              </Text>
              <Flex align="center" justify="space-between">
                <Text style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.28)", fontFamily: "'HarmonyOS Sans', sans-serif" }}>
                  {user.email}
                </Text>
                <Box
                  as="button"
                  onClick={(resetStatus === "loading" || resetStatus === "sent") ? undefined : handleResetPassword}
                  style={{
                    padding: "7px 14px",
                    borderRadius: 8,
                    background: resetStatus === "sent" ? "rgba(34,197,94,0.15)" : "rgba(251,191,36,0.12)",
                    border: `1px solid ${resetStatus === "sent" ? "rgba(34,197,94,0.3)" : "rgba(251,191,36,0.25)"}`,
                    color: resetStatus === "sent" ? "rgba(134,239,172,0.9)" : "rgba(251,191,36,0.85)",
                    fontSize: "0.78rem",
                    fontFamily: "'HarmonyOS Sans', sans-serif",
                    cursor: resetStatus === "sent" ? "default" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    flexShrink: 0,
                  }}
                >
                  {resetStatus === "loading"
                    ? <Loader size={13} style={{ animation: "spin 1s linear infinite" }} />
                    : resetStatus === "sent"
                    ? <Check size={13} />
                    : null}
                  {resetStatus === "sent" ? t("settings.resetPasswordSent") : t("settings.resetPasswordSend")}
                </Box>
              </Flex>
              {resetStatus === "error" && (
                <Text style={{ fontSize: "0.7rem", color: "rgba(248,113,113,0.8)", fontFamily: "'HarmonyOS Sans', sans-serif", marginTop: 6 }}>
                  {t("settings.resetPasswordError")}
                </Text>
              )}
            </Box>

            {/* Top up coins via VNPAY */}
            <Box p="14px" borderRadius="12px"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              <Flex align="center" justify="space-between" mb="10px">
                <Flex align="center" gap={2}>
                  <CreditCard size={13} style={{ color: "rgba(255,255,255,0.35)" }} />
                  <Text style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.35)", letterSpacing: "0.1em", fontFamily: "'HarmonyOS Sans', sans-serif" }}>
                    {t("settings.topUpCoins").toUpperCase()}
                  </Text>
                </Flex>
                <Box style={{
                  fontSize: "0.6rem",
                  color: "rgba(94,234,212,0.7)",
                  fontFamily: "'HarmonyOS Sans', sans-serif",
                  letterSpacing: "0.08em",
                  background: "rgba(94,234,212,0.1)",
                  border: "1px solid rgba(94,234,212,0.2)",
                  borderRadius: 5,
                  padding: "2px 7px",
                }}>
                  {t("settings.topUpComingSoon").toUpperCase()}
                </Box>
              </Flex>
              <Text style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.35)", fontFamily: "'HarmonyOS Sans', sans-serif", marginBottom: 12 }}>
                {t("settings.topUpCoinsDesc")}
              </Text>
              <Flex wrap="wrap" gap="8px">
                {[
                  { coins: 10, vnd: "10.000" },
                  { coins: 20, vnd: "20.000" },
                  { coins: 50, vnd: "50.000" },
                  { coins: 100, vnd: "100.000" },
                ].map(({ coins, vnd }) => (
                  <Box
                    key={coins}
                    as="button"
                    style={{
                      flex: "1 1 calc(50% - 4px)",
                      minWidth: 0,
                      padding: "10px 12px",
                      borderRadius: 10,
                      background: "rgba(255,255,255,0.03)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      cursor: "not-allowed",
                      opacity: 0.55,
                      textAlign: "left",
                      pointerEvents: "none",
                    }}
                  >
                    <Text style={{ fontSize: "1rem", fontWeight: 700, color: "rgba(255,255,255,0.8)", fontFamily: "'HarmonyOS Sans', sans-serif", lineHeight: 1.2 }}>
                      {coins.toLocaleString()} <span style={{ fontSize: "0.65rem", fontWeight: 400, color: "rgba(255,255,255,0.4)" }}>{t("settings.coins")}</span>
                    </Text>
                    <Text style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.35)", fontFamily: "'HarmonyOS Sans', sans-serif", marginTop: 2 }}>
                      {vnd}{t("settings.vnd")}
                    </Text>
                  </Box>
                ))}
              </Flex>
            </Box>

          </Box>
        );

      case "display":
        return (
          <Box style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* Dark mode */}
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

            {/* Accent color */}
            <Box px="14px" py="12px" borderRadius="10px"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
            >
              <Flex align="center" gap={2} mb="12px">
                <Pipette size={13} style={{ color: "rgba(255,255,255,0.3)" }} />
                <Text style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em", fontFamily: "'HarmonyOS Sans', sans-serif" }}>
                  {t("settings.accentColor").toUpperCase()}
                </Text>
              </Flex>
              <Flex wrap="wrap" gap="12px" mb="12px">
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
                        outline: isOn ? "2.5px solid white" : "2px solid rgba(255,255,255,0.15)",
                        outlineOffset: isOn ? 3 : 0,
                        transform: isOn ? "scale(1.18)" : "scale(1)",
                        transition: "transform 0.15s, outline 0.15s",
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}
                    >
                      {isOn && <Check size={12} strokeWidth={3} style={{ color: "white" }} />}
                    </Box>
                  );
                })}
                <Box position="relative" style={{ width: 28, height: 28 }}>
                  <label
                    htmlFor="accent-custom-picker"
                    title={t("settings.custom")}
                    style={{
                      width: 28, height: 28,
                      borderRadius: "50%",
                      background: isCustomAccent ? accent : "rgba(255,255,255,0.07)",
                      outline: isCustomAccent ? "2.5px solid white" : "2px dashed rgba(255,255,255,0.22)",
                      outlineOffset: isCustomAccent ? 3 : 0,
                      cursor: "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      transform: isCustomAccent ? "scale(1.18)" : "scale(1)",
                      transition: "transform 0.15s",
                    }}
                  >
                    <Pipette size={11} style={{ color: isCustomAccent ? "white" : "rgba(255,255,255,0.45)" }} />
                  </label>
                  <input
                    id="accent-custom-picker"
                    type="color"
                    value={accent}
                    onPointerDown={(e: React.PointerEvent) => e.stopPropagation()}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAccent(e.target.value)}
                    style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer", width: "100%", height: "100%" }}
                  />
                </Box>
              </Flex>
              <Box borderRadius="8px" style={{ height: 4, background: `linear-gradient(to right, ${accent}, ${accent}44)` }} />
            </Box>

            {/* Toolbar position */}
            <Box px="14px" py="12px" borderRadius="10px"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
            >
              <Flex align="center" gap={2} mb="12px">
                <Monitor size={13} style={{ color: "rgba(255,255,255,0.3)" }} />
                <Text style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em", fontFamily: "'HarmonyOS Sans', sans-serif" }}>
                  {t("settings.toolbarPosition").toUpperCase()}
                </Text>
              </Flex>
              <Flex gap="8px">
                {(["bottom", "left", "right"] as const).map((pos) => {
                  const isOn = toolbarPos === pos;
                  return (
                    <Box
                      key={pos}
                      as="button"
                      flex={1}
                      onClick={() => setToolbarPos(pos)}
                      borderRadius="8px"
                      cursor="pointer"
                      style={{
                        padding: "8px 0",
                        background: isOn ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.04)",
                        border: isOn ? "1px solid rgba(255,255,255,0.3)" : "1px solid rgba(255,255,255,0.08)",
                        color: isOn ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.45)",
                        fontSize: "0.78rem",
                        fontFamily: "'HarmonyOS Sans', sans-serif",
                        transition: "all 0.2s",
                        display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                      }}
                    >
                      {pos === "bottom" && (
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                          <rect x="1" y="1" width="12" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
                          <rect x="1" y="11" width="12" height="2" rx="1" fill="currentColor" />
                        </svg>
                      )}
                      {pos === "left" && (
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                          <rect x="4" y="1" width="9" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
                          <rect x="1" y="1" width="2" height="12" rx="1" fill="currentColor" />
                        </svg>
                      )}
                      {pos === "right" && (
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                          <rect x="1" y="1" width="9" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
                          <rect x="11" y="1" width="2" height="12" rx="1" fill="currentColor" />
                        </svg>
                      )}
                      {t(`settings.toolbar${pos.charAt(0).toUpperCase() + pos.slice(1)}`)}
                    </Box>
                  );
                })}
              </Flex>
            </Box>

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
                  <Box style={{ borderRadius: 3, overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.5)", flexShrink: 0 }}>
                    {lang === "vi" ? FLAG_VN : FLAG_GB}
                  </Box>
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
                    {APP_VERSION}
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
              <Flex wrap="wrap" gap="12px">
                {[
                  { name: "Phạm Thu Hiền",    avatar: "/assets/ContributorAvatar/PhamThuHien.jpg" },
                  { name: "Nguyễn Hồng Ngọc", avatar: "/assets/ContributorAvatar/NguyenHongNgoc.jpg" },
                  { name: "Trần Hoàng Duy",   avatar: "/assets/ContributorAvatar/TranHoangDuy.jpg" },
                  { name: "Lê Văn Tiến",      avatar: "/assets/ContributorAvatar/LeVanTien.jpg" },
                  { name: "Trần Quốc Nam",    avatar: "/assets/ContributorAvatar/TranQuocNam.jpg" },
                ].map(({ name, avatar }) => (
                  <Flex key={name} direction="column" align="center" gap="6px" style={{ width: 60 }}>
                    <Box style={{
                      width: 46,
                      height: 46,
                      borderRadius: "50%",
                      overflow: "hidden",
                      border: "1.5px solid rgba(94,234,212,0.3)",
                      flexShrink: 0,
                    }}>
                      <img src={avatar} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    </Box>
                    <Text style={{
                      fontSize: "0.6rem",
                      color: "rgba(255,255,255,0.5)",
                      fontFamily: "'HarmonyOS Sans', sans-serif",
                      textAlign: "center",
                      lineHeight: 1.3,
                    }}>
                      {name}
                    </Text>
                  </Flex>
                ))}
              </Flex>
            </Box>
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
          as="button"
          mb="16px"
          px="10px" py="12px"
          borderRadius="10px"
          onClick={() => setActiveNav("account")}
          style={{
            background: activeNav === "account" ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.05)",
            border: `1px solid ${activeNav === "account" ? "rgba(255,255,255,0.22)" : "rgba(255,255,255,0.08)"}`,
            cursor: "pointer",
            width: "100%",
            textAlign: "left",
            transition: "background 0.15s, border-color 0.15s",
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
                transition: "color 0.15s",
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
          fontSize: "1.35rem",
          fontWeight: 700,
          color: "rgba(255,255,255,0.88)",
          letterSpacing: "-0.01em",
          fontFamily: "'HarmonyOS Sans', sans-serif",
        }}>
          {NAV_LABELS[activeNav]}
        </Text>

        {renderContent()}
      </Box>
    </MotionBox>
  );
}
