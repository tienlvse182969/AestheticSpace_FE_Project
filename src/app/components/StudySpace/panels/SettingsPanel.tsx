import React, { useState, useEffect } from "react";
import { Box, Flex, Text } from "@chakra-ui/react";
import { motion } from "motion/react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { Settings, Bell, BellOff, Globe, Check, Pipette, Info, Users, KeyRound, AtSign, CreditCard, Monitor, Volume2, VolumeX, Play, Upload, Wallet, Coins, Zap } from "lucide-react";
import { LoadingRing } from "../../ui/LoadingRing";
import { PanelCloseBtn } from "../ui/PanelCloseBtn";
import { useCenteredPanel } from "../hooks/useCenteredPanel";
import { useAccent } from "../../../context/AccentContext";
import { useToolbarPosition } from "../../../context/ToolbarPositionContext";
import { useNotificationBanners, BANNER_SOUND_OPTIONS } from "../../../context/NotificationBannerContext";
import { useAuth } from "../../../../context/AuthContext";
import { AvatarCircle } from "./AccountPanel";
import { FLAG_VN, FLAG_GB } from "../../ui/FlagIcons";
import { APP_VERSION } from "../../../../version";
import { authService } from "../../../../services/auth.service";
import { paymentService } from "../../../../services/payment.service";
import { coinService } from "../../../../services/coin.service";
import type { PomodoroSounds } from "../../../../types/workspace.types";

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

export type NavKey = "display" | "language" | "notifications" | "sounds" | "wallet" | "about" | "account";

const NAV_ITEMS: {
  key: NavKey;
  icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>;
  color: string;
}[] = [
  { key: "display",       icon: Monitor, color: "#6366f1" },
  { key: "language",      icon: Globe,   color: "#0ea5e9" },
  { key: "notifications", icon: Bell,    color: "#f59e0b" },
  { key: "sounds",        icon: Volume2, color: "#ec4899" },
  { key: "wallet",        icon: Wallet,  color: "#facc15" },
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

/* ── Shared volume slider (banner + Pomodoro use the exact same markup) ── */
function VolumeSlider({
  value, onChange, onRelease, accentColor, mutedLabel,
}: {
  value: number;
  onChange: (v: number) => void;
  onRelease: () => void;
  accentColor: string;
  mutedLabel: string;
}) {
  return (
    <Flex align="center" gap="12px">
      {value > 0
        ? <Volume2 size={14} style={{ color: "rgba(255,255,255,0.35)", flexShrink: 0 }} />
        : <VolumeX size={14} style={{ color: "rgba(255,255,255,0.35)", flexShrink: 0 }} />
      }
      <input
        className="settings-volume-slider"
        type="range" min={0} max={100} value={value}
        onPointerDown={(e) => e.stopPropagation()}
        onChange={(e) => onChange(Number(e.target.value))}
        onMouseUp={onRelease}
        onTouchEnd={onRelease}
        onKeyUp={onRelease}
        style={{
          flex: 1, height: 3, borderRadius: 4,
          appearance: "none", WebkitAppearance: "none",
          background: `linear-gradient(to right, ${accentColor} ${value}%, rgba(255,255,255,0.15) ${value}%)`,
          outline: "none", cursor: "pointer",
          ["--thumb-color" as string]: accentColor,
        } as React.CSSProperties}
      />
      <Text style={{
        fontSize: "0.72rem", color: "rgba(255,255,255,0.4)",
        fontFamily: "'HarmonyOS Sans', sans-serif", minWidth: 34, textAlign: "right", flexShrink: 0, whiteSpace: "nowrap",
      }}>
        {value === 0 ? mutedLabel : `${value}%`}
      </Text>
    </Flex>
  );
}

/* ── Pomodoro chime options (moved in from the widget's own settings panel) ── */
const POMODORO_SOUND_OPTIONS = [
  { label: "Start Focus",  value: "/assets/PomodoroChime/StartPomodoroChime.mp3"  },
  { label: "Start Break",  value: "/assets/PomodoroChime/StartBreakTimeChime.mp3" },
  { label: "Pause",        value: "/assets/PomodoroChime/PauseChime.mp3"           },
  { label: "Reset",        value: "/assets/PomodoroChime/ResetPomodoroChime.mp3"  },
  { label: "Success",      value: "/assets/PomodoroChime/SuccessChime.mp3"        },
  { label: "None",         value: ""                                               },
];

function PomodoroSoundRow({
  label, value, volume, onChange,
}: {
  label: string;
  value: string;
  volume: number;
  onChange: (v: string) => void;
}) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const safeValue = value ?? "";
  const isCustom = safeValue.startsWith("data:");

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => { if (reader.result) onChange(reader.result as string); };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const previewSound = () => {
    if (!safeValue) return;
    const audio = new Audio(safeValue);
    audio.volume = volume / 100;
    audio.play().catch(() => {});
  };

  return (
    <Flex align="center" gap="6px" py="6px">
      <Text style={{
        fontSize: "0.72rem", color: "rgba(255,255,255,0.5)",
        fontFamily: "'HarmonyOS Sans', sans-serif",
        flexShrink: 0, width: 84,
        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
      }}>
        {label}
      </Text>

      <select
        value={isCustom ? "__custom__" : safeValue}
        onChange={(e) => { if (e.target.value !== "__custom__") onChange(e.target.value); }}
        onPointerDown={(e) => e.stopPropagation()}
        style={{
          flex: 1, minWidth: 0,
          background: "rgba(20,28,34,0.9)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 7, color: "#e0f5ee",
          fontSize: "0.72rem", fontFamily: "'HarmonyOS Sans', sans-serif",
          padding: "5px 6px", cursor: "pointer", outline: "none",
        }}
      >
        {isCustom && (
          <option value="__custom__" disabled style={{ background: "#0c1216" }}>
            Custom
          </option>
        )}
        {POMODORO_SOUND_OPTIONS.map(opt => (
          <option key={opt.value} value={opt.value} style={{ background: "#0c1216" }}>
            {opt.label}
          </option>
        ))}
      </select>

      <Box
        as="button"
        onClick={() => fileInputRef.current?.click()}
        onPointerDown={(e: React.PointerEvent) => e.stopPropagation()}
        display="flex" alignItems="center" justifyContent="center"
        w="26px" h="26px" borderRadius="6px"
        style={{
          flexShrink: 0,
          background: "rgba(255,255,255,0.06)",
          border: "1px solid rgba(255,255,255,0.1)",
          cursor: "pointer",
        }}
        title="Upload audio file"
      >
        <Upload size={11} color="rgba(255,255,255,0.5)" />
      </Box>
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*"
        style={{ display: "none" }}
        onChange={handleUpload}
      />

      <Box
        as="button"
        onClick={previewSound}
        onPointerDown={(e: React.PointerEvent) => e.stopPropagation()}
        display="flex" alignItems="center" justifyContent="center"
        w="26px" h="26px" borderRadius="6px"
        style={{
          flexShrink: 0,
          background: "rgba(255,255,255,0.06)",
          border: "1px solid rgba(255,255,255,0.1)",
          cursor: safeValue ? "pointer" : "default",
          opacity: safeValue ? 1 : 0.3,
          transition: "opacity 0.15s",
        }}
        title="Preview"
      >
        <Play size={11} color="rgba(255,255,255,0.5)" fill="rgba(255,255,255,0.5)" />
      </Box>
    </Flex>
  );
}

interface SettingsPanelProps {
  onClose: () => void;
  initialNav?: NavKey;
  pomodoroSoundEnabled: boolean;
  pomodoroSounds: PomodoroSounds;
  pomodoroVolume: number;
  onPomodoroSoundEnabled: (v: boolean) => void;
  onPomodoroSounds: (v: PomodoroSounds) => void;
  onPomodoroVolume: (v: number) => void;
  coinBalance?: number;
  onCoinBalanceChange?: (v: number) => void;
}

export function SettingsPanel({
  onClose, initialNav,
  pomodoroSoundEnabled, pomodoroSounds, pomodoroVolume,
  onPomodoroSoundEnabled, onPomodoroSounds, onPomodoroVolume,
  coinBalance, onCoinBalanceChange,
}: SettingsPanelProps) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { x, y, ref } = useCenteredPanel(760, 540);
  const { accent, setAccent } = useAccent();
  const { position: toolbarPos, setPosition: setToolbarPos } = useToolbarPosition();
  const { bannerVolume, setBannerVolume, bannerSound, setBannerSound, previewBannerSound } = useNotificationBanners();
  const { user, updateUsername } = useAuth();
  const isCustomAccent = !PRESET_HEXES.includes(accent);
  const [activeNav, setActiveNav] = useState<NavKey>(initialNav ?? "display");

  useEffect(() => {
    if (activeNav === "wallet" && user) {
      coinService.getBalance().then(data => onCoinBalanceChange?.(data.balance));
    }
  }, [activeNav, user]); // eslint-disable-line react-hooks/exhaustive-deps

  const previewPomodoroVolume = () => {
    if (!pomodoroSounds.startFocus) return;
    const audio = new Audio(pomodoroSounds.startFocus);
    audio.volume = pomodoroVolume / 100;
    audio.play().catch(() => {});
  };

  const [newUsername, setNewUsername] = useState("");
  const [usernameStatus, setUsernameStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const [resetStatus, setResetStatus] = useState<"idle" | "loading" | "sent" | "error">("idle");

  const [topUpLoading, setTopUpLoading] = useState<number | null>(null);
  const [topUpError, setTopUpError] = useState(false);

  const handleTopUp = async (coins: number, amountVnd: number) => {
    setTopUpLoading(coins);
    setTopUpError(false);
    try {
      const { transactionCode, checkoutUrl } = await paymentService.createPayOsPayment({
        amountVnd: amountVnd,
        coinsAmount: coins,
        purpose: "BuyCoins",
        returnUrl: `${window.location.origin}/payment/result`,
        cancelUrl: `${window.location.origin}/payment/result?status=cancelled`,
        description: null,
        storeItemId: null,
      });
      sessionStorage.setItem("payos_transaction_code", transactionCode);
      sessionStorage.setItem("payos_purpose", "BuyCoins");
      sessionStorage.setItem("payos_coins_amount", String(coins));
      window.location.href = checkoutUrl;
    } catch {
      setTopUpError(true);
      setTopUpLoading(null);
      setTimeout(() => setTopUpError(false), 4000);
    }
  };

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
    sounds:        t("settings.sounds"),
    wallet:        t("settings.walletSection"),
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
                    ? <LoadingRing size={13} />
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
                    ? <LoadingRing size={13} />
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

          </Box>
        );

      case "wallet":
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

            {/* Current balance */}
            <Box p="16px" borderRadius="12px"
              style={{
                background: "linear-gradient(135deg, rgba(250,204,21,0.1) 0%, rgba(245,158,11,0.16) 100%)",
                border: "1px solid rgba(250,204,21,0.3)",
              }}
            >
              <Text style={{ fontSize: "0.68rem", color: "rgba(250,204,21,0.75)", letterSpacing: "0.1em", fontFamily: "'HarmonyOS Sans', sans-serif" }}>
                {t("settings.walletBalance").toUpperCase()}
              </Text>
              <Flex align="center" gap="8px" mt="6px">
                <Coins size={20} style={{ color: "#facc15", flexShrink: 0 }} />
                <Text style={{ fontSize: "1.7rem", fontWeight: 700, color: "#facc15", fontFamily: "'HarmonyOS Sans', sans-serif", lineHeight: 1 }}>
                  {(coinBalance ?? 0).toLocaleString()}
                </Text>
                <Text style={{ fontSize: "0.78rem", color: "rgba(250,204,21,0.65)", fontFamily: "'HarmonyOS Sans', sans-serif" }}>
                  {t("settings.coins")}
                </Text>
              </Flex>
            </Box>

            {/* Top up coins via PAYOS — premium only */}
            <Box p="14px" borderRadius="12px"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              <Flex align="center" gap={2} mb="10px">
                <CreditCard size={13} style={{ color: "rgba(255,255,255,0.35)" }} />
                <Text style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.35)", letterSpacing: "0.1em", fontFamily: "'HarmonyOS Sans', sans-serif" }}>
                  {t("settings.topUpCoins").toUpperCase()}
                </Text>
              </Flex>

              {user.accountTier?.toLowerCase() === "premium" ? (
                <>
                  <Text style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.35)", fontFamily: "'HarmonyOS Sans', sans-serif", marginBottom: 12 }}>
                    {t("settings.topUpCoinsDesc")}
                  </Text>
                  <Flex wrap="wrap" gap="8px">
                    {[
                      { coins: 10,  vnd: "10.000",  amountVnd: 10000  },
                      { coins: 20,  vnd: "20.000",  amountVnd: 20000  },
                      { coins: 50,  vnd: "50.000",  amountVnd: 50000  },
                      { coins: 100, vnd: "100.000", amountVnd: 100000 },
                    ].map(({ coins, vnd, amountVnd }) => {
                      const isLoading = topUpLoading === coins;
                      const isDisabled = topUpLoading !== null;
                      return (
                        <Box
                          key={coins}
                          as="button"
                          onClick={isDisabled ? undefined : () => handleTopUp(coins, amountVnd)}
                          style={{
                            flex: "1 1 calc(50% - 4px)",
                            minWidth: 0,
                            padding: "10px 12px",
                            borderRadius: 10,
                            background: isLoading ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.03)",
                            border: `1px solid ${isLoading ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.08)"}`,
                            cursor: isDisabled ? "not-allowed" : "pointer",
                            opacity: isDisabled && !isLoading ? 0.5 : 1,
                            textAlign: "left",
                            transition: "background 0.15s, border-color 0.15s",
                          }}
                        >
                          <Flex align="center" gap={2}>
                            {isLoading && <LoadingRing size={13} />}
                            <Box>
                              <Text style={{ fontSize: "1rem", fontWeight: 700, color: "rgba(255,255,255,0.8)", fontFamily: "'HarmonyOS Sans', sans-serif", lineHeight: 1.2 }}>
                                {coins.toLocaleString()} <span style={{ fontSize: "0.65rem", fontWeight: 400, color: "rgba(255,255,255,0.4)" }}>{t("settings.coins")}</span>
                              </Text>
                              <Text style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.35)", fontFamily: "'HarmonyOS Sans', sans-serif", marginTop: 2 }}>
                                {vnd}{t("settings.vnd")}
                              </Text>
                            </Box>
                          </Flex>
                        </Box>
                      );
                    })}
                  </Flex>
                  {topUpError && (
                    <Text style={{ fontSize: "0.7rem", color: "rgba(248,113,113,0.8)", fontFamily: "'HarmonyOS Sans', sans-serif", marginTop: 8 }}>
                      {t("settings.topUpError")}
                    </Text>
                  )}
                </>
              ) : (
                <>
                  <Text style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.45)", fontFamily: "'HarmonyOS Sans', sans-serif", marginBottom: 12 }}>
                    {t("settings.topUpPremiumRequired")}
                  </Text>
                  <Box
                    as="button"
                    onClick={() => { onClose(); navigate("/pricing"); }}
                    display="flex" alignItems="center" justifyContent="center" gap={2}
                    style={{
                      padding: "9px 16px",
                      borderRadius: 10,
                      background: "linear-gradient(135deg, rgba(251,191,36,0.18) 0%, rgba(245,158,11,0.28) 100%)",
                      border: "1px solid rgba(251,191,36,0.45)",
                      color: "#fbbf24",
                      fontSize: "0.82rem",
                      fontFamily: "'HarmonyOS Sans', sans-serif",
                      fontWeight: 600,
                      cursor: "pointer",
                      letterSpacing: "0.02em",
                    }}
                  >
                    <Zap size={13} style={{ flexShrink: 0 }} />
                    {t("account.upgradeToPremium")}
                  </Box>
                </>
              )}
            </Box>

          </Box>
        );

      case "display":
        return (
          <Box style={{ display: "flex", flexDirection: "column", gap: 16 }}>

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

      case "sounds":
        return (
          <Box style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <Box px="14px" py="12px" borderRadius="10px"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
            >
              <Box mb="12px">
                <Text style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.82)", fontFamily: "'HarmonyOS Sans', sans-serif" }}>
                  {t("settings.bannerSound")}
                </Text>
                <Text style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.3)", fontFamily: "'HarmonyOS Sans', sans-serif", marginTop: 2, lineHeight: 1.4 }}>
                  {t("settings.bannerSoundDesc")}
                </Text>
              </Box>

              <VolumeSlider
                value={bannerVolume}
                onChange={setBannerVolume}
                onRelease={previewBannerSound}
                accentColor={accent}
                mutedLabel={t("settings.bannerSoundMuted")}
              />

              <Box mt="12px" style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 10 }}>
                <Text style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.3)", fontFamily: "'HarmonyOS Sans', sans-serif", letterSpacing: "0.06em", marginBottom: 8 }}>
                  {t("settings.bannerSoundChoice").toUpperCase()}
                </Text>
                <Flex gap="8px" wrap="wrap">
                  {BANNER_SOUND_OPTIONS.map((opt) => {
                    const isOn = bannerSound === opt.value;
                    return (
                      <Box
                        key={opt.key}
                        as="button"
                        flex="1 1 calc(33.333% - 6px)"
                        minW="90px"
                        onClick={() => setBannerSound(opt.value)}
                        onPointerDown={(e: React.PointerEvent) => e.stopPropagation()}
                        borderRadius="8px"
                        cursor="pointer"
                        style={{
                          padding: "8px 0",
                          background: isOn ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.04)",
                          border: isOn ? `1px solid ${accent}` : "1px solid rgba(255,255,255,0.08)",
                          color: isOn ? "rgba(255,255,255,0.92)" : "rgba(255,255,255,0.45)",
                          fontSize: "0.76rem",
                          fontFamily: "'HarmonyOS Sans', sans-serif",
                          fontWeight: isOn ? 600 : 400,
                          transition: "all 0.15s",
                          display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
                        }}
                      >
                        {isOn && <Check size={11} style={{ color: accent, flexShrink: 0 }} />}
                        {opt.label}
                      </Box>
                    );
                  })}
                </Flex>
              </Box>
            </Box>

            <Box px="14px" py="12px" borderRadius="10px"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
            >
              <Flex align="center" justify="space-between" mb="4px">
                <Text style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.82)", fontFamily: "'HarmonyOS Sans', sans-serif" }}>
                  {t("pomodoroSettings.soundSettingsTitle")}
                </Text>
                <Toggle
                  on={pomodoroSoundEnabled}
                  onChange={() => onPomodoroSoundEnabled(!pomodoroSoundEnabled)}
                  accentColor={accent}
                />
              </Flex>

              {pomodoroSoundEnabled && (
                <Box mt="10px" style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 10 }}>
                  <Box mb="8px">
                    <VolumeSlider
                      value={pomodoroVolume}
                      onChange={onPomodoroVolume}
                      onRelease={previewPomodoroVolume}
                      accentColor={accent}
                      mutedLabel={t("settings.bannerSoundMuted")}
                    />
                  </Box>

                  <PomodoroSoundRow
                    label={t("pomodoroSettings.soundStartFocus")}
                    value={pomodoroSounds.startFocus}
                    volume={pomodoroVolume}
                    onChange={v => onPomodoroSounds({ ...pomodoroSounds, startFocus: v })}
                  />
                  <PomodoroSoundRow
                    label={t("pomodoroSettings.soundStartBreak")}
                    value={pomodoroSounds.startBreak}
                    volume={pomodoroVolume}
                    onChange={v => onPomodoroSounds({ ...pomodoroSounds, startBreak: v })}
                  />
                  <PomodoroSoundRow
                    label={t("pomodoroSettings.soundComplete")}
                    value={pomodoroSounds.complete}
                    volume={pomodoroVolume}
                    onChange={v => onPomodoroSounds({ ...pomodoroSounds, complete: v })}
                  />
                  <PomodoroSoundRow
                    label={t("pomodoroSettings.soundPause")}
                    value={pomodoroSounds.pause}
                    volume={pomodoroVolume}
                    onChange={v => onPomodoroSounds({ ...pomodoroSounds, pause: v })}
                  />
                  <PomodoroSoundRow
                    label={t("pomodoroSettings.soundReset")}
                    value={pomodoroSounds.reset}
                    volume={pomodoroVolume}
                    onChange={v => onPomodoroSounds({ ...pomodoroSounds, reset: v })}
                  />
                </Box>
              )}
            </Box>
          </Box>
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
                    color: "white",
                    fontFamily: "'HarmonyOS Sans', sans-serif",
                    fontWeight: 600,
                    letterSpacing: "0.03em",
                    background: "rgba(20,20,20,0.72)",
                    backdropFilter: "blur(8px)",
                    WebkitBackdropFilter: "blur(8px)",
                    border: "1px solid rgba(255,255,255,0.15)",
                    borderRadius: "100px",
                    padding: "3px 10px",
                    lineHeight: 1,
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
              <Flex gap="28px" wrap="wrap" align="flex-start">
                {[
                  {
                    roleKey: "about.roleThemeCreator",
                    members: [
                      { name: "Phạm Thu Hiền",    avatar: "/assets/ContributorAvatar/PhamThuHien.jpg" },
                      { name: "Nguyễn Hồng Ngọc", avatar: "/assets/ContributorAvatar/NguyenHongNgoc.jpg" },
                      { name: "Trần Hoàng Duy",   avatar: "/assets/ContributorAvatar/TranHoangDuy.jpg" },
                    ],
                  },
                  {
                    roleKey: "about.roleDeveloper",
                    members: [
                      { name: "Lê Văn Tiến",  avatar: "/assets/ContributorAvatar/LeVanTien.jpg" },
                      { name: "Trần Quốc Nam", avatar: "/assets/ContributorAvatar/TranQuocNam.jpg" },
                    ],
                  },
                ].map(({ roleKey, members }, idx, arr) => (
                  <React.Fragment key={roleKey}>
                    <Box>
                      <Text mb={2} style={{
                        fontSize: "0.57rem",
                        color: "rgba(94,234,212,0.55)",
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                        fontFamily: "'HarmonyOS Sans', sans-serif",
                      }}>
                        {t(roleKey)}
                      </Text>
                      <Flex wrap="wrap" gap="12px">
                        {members.map(({ name, avatar }) => (
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
                    {idx < arr.length - 1 && (
                      <Box key={`sep-${roleKey}`} style={{ width: 1, background: "rgba(255,255,255,0.1)", alignSelf: "stretch", minHeight: 60 }} />
                    )}
                  </React.Fragment>
                ))}
              </Flex>
            </Box>
          </Box>
        );
    }
  };

  return (
    <>
    <style>{`
      .settings-volume-slider {
        -webkit-appearance: none;
        -moz-appearance: none;
        appearance: none;
        display: block;
        margin: 0;
        padding: 0;
        border: none;
        background-clip: padding-box;
      }
      .settings-volume-slider::-webkit-slider-runnable-track {
        height: 3px;
        border-radius: 4px;
        background: transparent;
      }
      .settings-volume-slider::-moz-range-track {
        height: 3px;
        border-radius: 4px;
        background: transparent;
        border: none;
      }
      .settings-volume-slider::-moz-range-progress {
        height: 3px;
        border-radius: 4px;
        background: transparent;
      }
      .settings-volume-slider::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: 12px; height: 12px;
        margin-top: -4.5px;
        border-radius: 50%;
        background: var(--thumb-color);
        box-shadow: 0 0 4px var(--thumb-color);
        cursor: pointer;
      }
      .settings-volume-slider::-moz-range-thumb {
        width: 12px; height: 12px;
        border-radius: 50%;
        border: none;
        background: var(--thumb-color);
        box-shadow: 0 0 4px var(--thumb-color);
        cursor: pointer;
      }
    `}</style>
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
      <Box style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, position: "relative" }}>
        <PanelCloseBtn onClose={onClose} />

        <Box style={{ flex: 1, padding: "20px 18px", overflowY: "auto" }}>
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
      </Box>
    </MotionBox>
    </>
  );
}
