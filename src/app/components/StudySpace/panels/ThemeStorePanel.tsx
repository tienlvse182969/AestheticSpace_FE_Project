import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Box, Flex, Text, Input } from "@chakra-ui/react";
import { motion, AnimatePresence } from "motion/react";
import {
  ShoppingBag, ChevronLeft, ChevronRight, Coins, Check, Clock,
  Sticker, Image as ImageIcon, Volume2, Wand2, Palette, LayoutGrid,
  Crown, Search, X, Heart, Package, Play, Pause, PlusCircle,
  Trash2, AlertCircle, Pencil, CheckCircle, Music, Brush, Upload, Plus,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { LoadingRing } from "../../ui/LoadingRing";
import { PanelCloseBtn } from "../ui/PanelCloseBtn";
import { PremiumGateModal } from "../ui/PremiumGateModal";
import { StorePaymentModal } from "../ui/StorePaymentModal";
import { CreateThemePanel } from "./CreateThemePanel";
import { useCenteredPanel } from "../hooks/useCenteredPanel";
import {
  aestheticStoreService,
  type StoreItem,
  type StoreCategory,
} from "../../../../services/aestheticStore.service";
import { useAuth } from "../../../../context/AuthContext";
import { useNotificationBanners } from "../../../context/NotificationBannerContext";
import { coinService } from "../../../../services/coin.service";
import {
  userThemeService,
  type UserThemeSubmission,
  type ThemeInlineComponent,
  type ThemeSubmissionStatus,
} from "../../../../services/userTheme.service";

const MotionBox = motion.create(Box);

const PUBLIC_BETA = import.meta.env.VITE_PUBLIC_BETA === "true";
const MY_THEMES_MAINTENANCE_MSG = "Tính năng đang trong quá trình phát triển và bảo trì";

const PANEL_W = 860;
const PANEL_H = 680;

const PLACEHOLDER_IMG = "https://placehold.co/400x240/1a1a2e/888888?text=No+Preview";

function getFirstPreviewImg(item: StoreItem): string {
  if (!item.previewUrl) return PLACEHOLDER_IMG;
  try {
    const parsed = JSON.parse(item.previewUrl);
    if (Array.isArray(parsed) && parsed[0]) return parsed[0];
  } catch {}
  return item.previewUrl;
}

export interface ThemeApplyExtras {
  bgId?: string;
  bgUrl?: string;
  stickerUrl?: string;
  ambientId?: string;
  ambientUrl?: string;
}

interface Props {
  onClose: () => void;
  coinBalance?: number;
  onCoinBalanceChange?: (newBalance: number) => void;
  onStartTrial?: (item: StoreItem, trialBgUrl?: string, trialStickerUrl?: string, trialAmbientUrl?: string) => void;
  onTrialEnd?: () => void;
  onApplyItem?: (item: StoreItem, extras?: ThemeApplyExtras) => void;
  trialItemId?: string;
  initialDetailItemId?: string;
  initialTab?: TabValue;
}

export type TabValue = "all" | "purchased" | "wishlist" | "my-themes" | StoreCategory;

const TABS: { value: TabValue; key: string }[] = [
  { value: "all",          key: "themeStore.tabDiscovery" },
  { value: "Theme",        key: "themeStore.tabThemes" },
  { value: "Background",   key: "themeStore.tabWallpapers" },
  { value: "Sticker",      key: "themeStore.tabStickers" },
  { value: "AmbientSound", key: "themeStore.tabSounds" },
  { value: "purchased",    key: "themeStore.tabPurchased" },
];

function tabTitleKey(tab: TabValue): string {
  if (tab === "wishlist") return "themeStore.tabWishlist";
  if (tab === "my-themes") return "themeStore.tabCreator";
  return TABS.find(tb => tb.value === tab)?.key ?? "themeStore.tabDiscovery";
}

function typeColor(category: StoreCategory): string {
  const map: Record<StoreCategory, string> = {
    Theme:        "#8b5cf6",
    Background:   "#3b82f6",
    Sticker:      "#ec4899",
    Effect:       "#22c55e",
    AmbientSound: "#6366f1",
  };
  return map[category] ?? "#8b5cf6";
}

function tabIcon(value: TabValue, size = 14): React.ReactNode {
  switch (value) {
    case "all":          return <LayoutGrid size={size} />;
    case "Theme":        return <Palette size={size} />;
    case "Background":   return <ImageIcon size={size} />;
    case "Sticker":      return <Sticker size={size} />;
    case "AmbientSound": return <Volume2 size={size} />;
    case "Effect":       return <Wand2 size={size} />;
    case "purchased":    return <Check size={size} />;
    case "wishlist":     return <Heart size={size} />;
    case "my-themes":    return <Brush size={size} />;
    default:             return null;
  }
}

function typeLabel(category: StoreCategory, t: (k: string) => string): string {
  const map: Record<StoreCategory, string> = {
    Theme:        t("themeStore.tabThemes"),
    Background:   t("themeStore.tabWallpapers"),
    Sticker:      t("themeStore.tabStickers"),
    Effect:       t("themeStore.tabEffects"),
    AmbientSound: t("themeStore.tabSounds"),
  };
  return map[category] ?? category;
}

// ── StoreCard ──────────────────────────────────────────────────────────────

function StoreCard({
  item,
  t,
  isTrialing,
  onClick,
}: {
  item: StoreItem;
  t: (k: string) => string;
  isTrialing?: boolean;
  onClick: () => void;
}) {
  const color = typeColor(item.category);
  const isOwned = item.isOwned === true;
  const price = item.coinPrice;

  return (
    <Box
      as="button"
      onClick={onClick}
      textAlign="left"
      borderRadius="12px"
      overflow="hidden"
      cursor="pointer"
      w="100%"
      style={{
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.07)",
        transition: "all 0.18s",
      }}
      _hover={{
        background: "rgba(255,255,255,0.08)",
        border: "1px solid rgba(255,255,255,0.18)",
        transform: "translateY(-2px)",
        boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
      }}
    >
      {/* Thumbnail */}
      <Box position="relative" overflow="hidden" style={{ aspectRatio: "5/3" }}>
        <img
          src={item.category === "AmbientSound" ? getFirstPreviewImg(item) : (item.assetUrl ?? PLACEHOLDER_IMG)}
          alt={item.name}
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          draggable={false}
          loading="lazy"
        />
        {/* Gradient overlay */}
        <Box
          position="absolute"
          bottom={0}
          left={0}
          right={0}
          h="40px"
          style={{ background: "linear-gradient(transparent, rgba(0,0,0,0.5))" }}
        />
        {/* Category badge */}
        <Box
          position="absolute"
          top="6px"
          left="6px"
          style={{
            padding: "2px 7px",
            borderRadius: "5px",
            fontSize: "0.58rem",
            fontFamily: "'HarmonyOS Sans', sans-serif",
            fontWeight: 700,
            letterSpacing: "0.07em",
            background: `${color}e0`,
            color: "#fff",
            backdropFilter: "blur(6px)",
          }}
        >
          {typeLabel(item.category, t)}
        </Box>
        {/* Source badge */}
        {item.themeSource && (
          <Box
            position="absolute"
            top="6px"
            right="6px"
            style={{
              padding: "2px 7px",
              borderRadius: "5px",
              fontSize: "0.58rem",
              fontFamily: "'HarmonyOS Sans', sans-serif",
              fontWeight: 700,
              letterSpacing: "0.06em",
              background: item.themeSource === "Official"
                ? "rgba(251,191,36,0.88)"
                : "rgba(20,184,166,0.78)",
              color: item.themeSource === "Official" ? "#1a1000" : "#fff",
              backdropFilter: "blur(6px)",
            }}
          >
            {item.themeSource === "Official" ? `✦ ${t("themeStore.filterOfficial")}` : t("themeStore.filterCommunity")}
          </Box>
        )}
        {/* Trialing overlay */}
        {isTrialing && !isOwned && (
          <Flex
            position="absolute"
            inset={0}
            align="flex-end"
            justify="flex-end"
            p="6px"
            style={{ background: "rgba(0,0,0,0.25)" }}
          >
            <Box
              style={{
                padding: "3px 8px",
                borderRadius: "6px",
                fontSize: "0.58rem",
                fontFamily: "'HarmonyOS Sans', sans-serif",
                fontWeight: 700,
                letterSpacing: "0.07em",
                background: `${color}cc`,
                color: "#fff",
                backdropFilter: "blur(6px)",
                animation: "pulse 2s ease-in-out infinite",
              }}
            >
              ● {t("themeStore.trial.trying")}
            </Box>
          </Flex>
        )}
      </Box>

      {/* Info */}
      <Box px="10px" py="8px">
        <Text
          style={{
            fontSize: "0.8rem",
            fontFamily: "'HarmonyOS Sans', sans-serif",
            fontWeight: 600,
            color: "rgba(255,255,255,0.92)",
            lineHeight: 1.25,
            marginBottom: "6px",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {item.name}
        </Text>
        <Flex align="center" gap="4px">
          {!isOwned && price != null && price > 0 && (
            <Coins size={11} color="#facc15" />
          )}
          <Text
            style={{
              fontSize: "0.76rem",
              fontFamily: "'HarmonyOS Sans', sans-serif",
              fontWeight: 700,
              color: isOwned
                ? "rgba(74,222,128,0.9)"
                : price == null || price === 0
                ? "rgba(94,234,212,0.9)"
                : "#facc15",
            }}
          >
            {isOwned
              ? t("themeStore.purchased")
              : price == null || price === 0
              ? t("themeStore.free")
              : price.toLocaleString("vi-VN")}
          </Text>
        </Flex>
      </Box>
    </Box>
  );
}

// ── ItemDetailView ─────────────────────────────────────────────────────────

function ItemDetailView({
  item,
  t,
  purchasing,
  purchaseError,
  onBack,
  onBuy,
  onOpenPaymentModal,
  onStartTrial,
  isTrialing,
  hasActiveTrial,
  canPurchase,
  onLockedBuy,
  isWishlisted,
  onToggleWishlist,
  onApplyItem,
  allItems,
}: {
  item: StoreItem;
  t: (k: string, opts?: Record<string, unknown>) => string;
  purchasing: boolean;
  purchaseError: string | null;
  onBack: () => void;
  onBuy: () => void;
  onOpenPaymentModal?: () => void;
  onStartTrial?: () => void;
  isTrialing?: boolean;
  hasActiveTrial?: boolean;
  canPurchase?: boolean;
  onLockedBuy?: () => void;
  isWishlisted?: boolean;
  allItems?: StoreItem[];
  onToggleWishlist?: () => void;
  onApplyItem?: (item: StoreItem, extras?: ThemeApplyExtras) => void;
}) {
  const color = typeColor(item.category);
  const isOwned = item.isOwned === true;
  const price = item.coinPrice;
  const isFree = price == null || price === 0;
  const canBuy = canPurchase !== false;

  const previewImgs: string[] = (() => {
    if (!item.previewUrl) return [];
    try {
      const p = JSON.parse(item.previewUrl);
      if (Array.isArray(p)) return p.filter(Boolean);
    } catch {}
    return [item.previewUrl];
  })();
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const [compLightboxUrl, setCompLightboxUrl] = useState<string | null>(null);

  useEffect(() => {
    if (lightboxIdx === null && !compLightboxUrl) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setLightboxIdx(null);
        setCompLightboxUrl(null);
      }
      if (lightboxIdx !== null) {
        if (e.key === "ArrowRight") setLightboxIdx(i => i !== null ? Math.min(i + 1, previewImgs.length - 1) : null);
        if (e.key === "ArrowLeft")  setLightboxIdx(i => i !== null ? Math.max(i - 1, 0) : null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightboxIdx, compLightboxUrl, previewImgs.length]);

  const PREVIEW_SEC = 10;
  const audioRef        = useRef<HTMLAudioElement | null>(null);
  const previewStartRef = useRef(0);
  const previewScrollRef = useRef<HTMLDivElement | null>(null);
  const [audioPlaying,  setAudioPlaying]  = useState(false);
  const [audioProgress, setAudioProgress] = useState(0); // 0..PREVIEW_SEC

  useEffect(() => {
    if (item.category !== "AmbientSound" || !item.assetUrl) return;
    const a = new Audio(item.assetUrl);
    audioRef.current = a;

    a.addEventListener("loadedmetadata", () => {
      const start = Math.max(0, a.duration / 2 - PREVIEW_SEC / 2);
      previewStartRef.current = start;
      a.currentTime = start;
    });

    a.addEventListener("timeupdate", () => {
      const elapsed = a.currentTime - previewStartRef.current;
      if (elapsed >= PREVIEW_SEC) {
        a.pause();
        a.currentTime = previewStartRef.current;
        setAudioPlaying(false);
        setAudioProgress(0);
      } else {
        setAudioProgress(Math.max(0, elapsed));
      }
    });

    return () => { a.pause(); a.src = ""; audioRef.current = null; };
  }, [item.id, item.category, item.assetUrl]);

  const toggleAudio = () => {
    const a = audioRef.current;
    if (!a) return;
    if (audioPlaying) {
      a.pause();
      setAudioPlaying(false);
    } else {
      const elapsed = a.currentTime - previewStartRef.current;
      if (elapsed >= PREVIEW_SEC || elapsed < 0) {
        a.currentTime = previewStartRef.current;
        setAudioProgress(0);
      }
      a.play().then(() => setAudioPlaying(true)).catch(() => {});
    }
  };

  const fmtTime = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

  const compAudioRef = useRef<HTMLAudioElement | null>(null);
  const [compAudioPlayingId, setCompAudioPlayingId] = useState<string | null>(null);
  useEffect(() => { return () => { compAudioRef.current?.pause(); }; }, []);

  const toggleCompAudio = (id: string, url: string) => {
    if (compAudioPlayingId === id) {
      compAudioRef.current?.pause();
      setCompAudioPlayingId(null);
      return;
    }
    compAudioRef.current?.pause();
    const a = new Audio(url);
    compAudioRef.current = a;
    a.play().catch(() => {});
    a.onended = () => setCompAudioPlayingId(null);
    setCompAudioPlayingId(id);
  };

  return (
    <MotionBox
      initial={{ x: "100%", opacity: 0 }}
      animate={{ x: 0, opacity: 1, transition: { type: "spring", stiffness: 380, damping: 32, mass: 0.9 } } as any}
      exit={{ x: "100%", opacity: 0, transition: { duration: 0.2, ease: [0.4, 0, 1, 1] } } as any}
      position="absolute"
      inset={0}
      overflow="hidden"
      style={{ background: "rgba(10,15,20,0.98)", zIndex: 20 }}
    >
      <Box h="100%" display="flex" flexDirection="column">
        {/* Main image */}
        <Box position="relative" flexShrink={0} style={{ aspectRatio: "16/7", overflow: "hidden" }}>
          <img
            src={item.category === "AmbientSound" ? getFirstPreviewImg(item) : (item.assetUrl ?? PLACEHOLDER_IMG)}
            alt={item.name}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
            draggable={false}
          />
          <Box
            position="absolute"
            bottom={0}
            left={0}
            right={0}
            h="80px"
            style={{ background: "linear-gradient(transparent, rgba(10,15,20,0.98))" }}
          />
          {/* Wishlist heart button */}
          {onToggleWishlist && (
            <Box
              as="button"
              onClick={(e: React.MouseEvent) => { e.stopPropagation(); onToggleWishlist(); }}
              position="absolute"
              top="10px"
              left="10px"
              w="30px"
              h="30px"
              borderRadius="full"
              display="flex"
              alignItems="center"
              justifyContent="center"
              border="none"
              cursor="pointer"
              style={{
                background: "rgba(10,15,22,0.65)",
                backdropFilter: "blur(10px)",
                color: isWishlisted ? "#f43f5e" : "rgba(255,255,255,0.6)",
                transition: "all 0.2s",
                boxShadow: isWishlisted ? "0 0 10px rgba(244,63,94,0.4)" : "none",
              }}
              _hover={{ color: "#f43f5e", background: "rgba(20,28,40,0.85)" } as any}
            >
              <Heart size={15} fill={isWishlisted ? "#f43f5e" : "none"} />
            </Box>
          )}
          {/* Back button */}
          <Box
            as="button"
            onClick={onBack}
            position="absolute"
            top="10px"
            left={onToggleWishlist ? "48px" : "10px"}
            display="flex"
            alignItems="center"
            gap={1}
            px="10px"
            py="5px"
            borderRadius="8px"
            border="none"
            cursor="pointer"
            style={{
              background: "rgba(10,15,22,0.72)",
              backdropFilter: "blur(10px)",
              color: "rgba(255,255,255,0.8)",
              fontSize: "0.72rem",
              fontFamily: "'HarmonyOS Sans', sans-serif",
              transition: "background 0.15s",
            }}
            _hover={{ background: "rgba(25,35,50,0.9)" } as any}
          >
            <ChevronLeft size={14} />
            {t("themeStore.detail.back")}
          </Box>
          {/* Badges */}
          <Flex position="absolute" top="10px" right="10px" gap="5px" align="center">
            {item.themeSource && (
              <Box
                style={{
                  padding: "3px 8px",
                  borderRadius: "6px",
                  fontSize: "0.6rem",
                  fontFamily: "'HarmonyOS Sans', sans-serif",
                  fontWeight: 700,
                  letterSpacing: "0.06em",
                  background: item.themeSource === "Official"
                    ? "rgba(251,191,36,0.88)"
                    : "rgba(20,184,166,0.78)",
                  color: item.themeSource === "Official" ? "#1a1000" : "#fff",
                  backdropFilter: "blur(6px)",
                }}
              >
                {item.themeSource === "Official" ? `✦ ${t("themeStore.filterOfficial")}` : t("themeStore.filterCommunity")}
              </Box>
            )}
            <Box
              style={{
                padding: "3px 8px",
                borderRadius: "6px",
                fontSize: "0.6rem",
                fontFamily: "'HarmonyOS Sans', sans-serif",
                fontWeight: 700,
                background: `${color}e0`,
                color: "#fff",
                backdropFilter: "blur(6px)",
              }}
            >
              {typeLabel(item.category, t)}
            </Box>
          </Flex>
        </Box>

        {/* Body (scrollable) */}
        <Box flex={1} overflowY="auto" px="20px" pt="16px" pb="16px">
          <Text
            mb="12px"
            style={{
              fontSize: "1.1rem",
              fontFamily: "'HarmonyOS Sans', sans-serif",
              fontWeight: 700,
              color: "rgba(255,255,255,0.95)",
              lineHeight: 1.3,
            }}
          >
            {item.name}
          </Text>
          {item.description && (
            <Text
              style={{
                fontSize: "0.78rem",
                fontFamily: "'HarmonyOS Sans', sans-serif",
                color: "rgba(255,255,255,0.55)",
                lineHeight: 1.65,
              }}
            >
              {item.description}
            </Text>
          )}

          {/* Preview images — horizontal strip with nav arrows */}
          {previewImgs.length > 0 && (
            <Box mt="16px" position="relative">
              {previewImgs.length > 1 && (
                <Box
                  as="button"
                  onClick={() => previewScrollRef.current?.scrollBy({ left: -230, behavior: "smooth" })}
                  position="absolute" left="-8px" top="50%"
                  w="28px" h="28px" borderRadius="full" border="none" cursor="pointer" zIndex={2}
                  display="flex" alignItems="center" justifyContent="center"
                  style={{
                    transform: "translateY(-50%)",
                    background: "rgba(10,15,22,0.72)",
                    backdropFilter: "blur(8px)",
                    color: "rgba(255,255,255,0.85)",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.5)",
                    transition: "background 0.15s",
                  }}
                  _hover={{ background: "rgba(30,40,55,0.9)" } as any}
                >
                  <ChevronLeft size={14} />
                </Box>
              )}
              <Box
                ref={previewScrollRef as any}
                overflowX="auto"
                pb="4px"
                style={{
                  scrollbarWidth: "none",
                  scrollSnapType: "x mandatory",
                  WebkitOverflowScrolling: "touch",
                  display: "flex",
                  gap: "10px",
                }}
              >
                {previewImgs.map((url, i) => (
                  <Box
                    key={i}
                    flexShrink={0}
                    borderRadius="12px"
                    overflow="hidden"
                    cursor="pointer"
                    onClick={() => setLightboxIdx(i)}
                    style={{
                      width: "220px",
                      height: "138px",
                      scrollSnapAlign: "start",
                      boxShadow: "0 4px 20px rgba(0,0,0,0.45)",
                      border: "1px solid rgba(255,255,255,0.07)",
                      background: "rgba(255,255,255,0.04)",
                      transition: "transform 0.15s, box-shadow 0.15s",
                    }}
                    _hover={{ transform: "scale(1.02)", boxShadow: "0 6px 28px rgba(0,0,0,0.6)" } as any}
                  >
                    <img
                      src={url}
                      alt={`preview-${i + 1}`}
                      style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                      draggable={false}
                    />
                  </Box>
                ))}
              </Box>
              {previewImgs.length > 1 && (
                <Box
                  as="button"
                  onClick={() => previewScrollRef.current?.scrollBy({ left: 230, behavior: "smooth" })}
                  position="absolute" right="-8px" top="50%"
                  w="28px" h="28px" borderRadius="full" border="none" cursor="pointer" zIndex={2}
                  display="flex" alignItems="center" justifyContent="center"
                  style={{
                    transform: "translateY(-50%)",
                    background: "rgba(10,15,22,0.72)",
                    backdropFilter: "blur(8px)",
                    color: "rgba(255,255,255,0.85)",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.5)",
                    transition: "background 0.15s",
                  }}
                  _hover={{ background: "rgba(30,40,55,0.9)" } as any}
                >
                  <ChevronRight size={14} />
                </Box>
              )}
            </Box>
          )}

          {/* Inline audio preview for AmbientSound */}
          {item.category === "AmbientSound" && item.assetUrl && (
            <Box mt="16px" px="4px">
              <Flex align="center" gap="12px">
                <Box
                  as="button"
                  onClick={toggleAudio}
                  w="38px" h="38px" borderRadius="full" border="none" cursor="pointer" flexShrink={0}
                  display="flex" alignItems="center" justifyContent="center"
                  style={{
                    background: audioPlaying ? `${color}30` : "rgba(255,255,255,0.08)",
                    outline: audioPlaying ? `1px solid ${color}60` : "1px solid rgba(255,255,255,0.14)",
                    color: audioPlaying ? color : "rgba(255,255,255,0.7)",
                    transition: "all 0.18s",
                  }}
                >
                  {audioPlaying ? <Pause size={15} /> : <Play size={15} />}
                </Box>
                <Box flex={1}>
                  <Box
                    h="3px" borderRadius="full" overflow="hidden" mb="5px"
                    style={{ background: "rgba(255,255,255,0.1)" }}
                  >
                    <Box h="full" borderRadius="full"
                      style={{ width: `${(audioProgress / PREVIEW_SEC) * 100}%`, background: color, transition: "width 0.1s" }} />
                  </Box>
                  <Flex justify="space-between">
                    <Text style={{ fontSize: "0.62rem", fontFamily: "'HarmonyOS Sans', sans-serif", color: "rgba(255,255,255,0.3)" }}>
                      {fmtTime(audioProgress)}
                    </Text>
                    <Text style={{ fontSize: "0.62rem", fontFamily: "'HarmonyOS Sans', sans-serif", color: "rgba(255,255,255,0.3)" }}>
                      {fmtTime(PREVIEW_SEC)}
                    </Text>
                  </Flex>
                </Box>
              </Flex>
            </Box>
          )}

          {/* Theme components — backgrounds, stickers, ambient sound */}
          {item.category === "Theme" && allItems && (() => {
            const bgItem      = item.themeBackgroundItemId   ? allItems.find(i => i.id === item.themeBackgroundItemId)   : null;
            const stickerItem = item.themeStickerItemId      ? allItems.find(i => i.id === item.themeStickerItemId)      : null;
            const soundItem   = item.themeAmbientSoundItemId ? allItems.find(i => i.id === item.themeAmbientSoundItemId) : null;
            if (!bgItem && !stickerItem && !soundItem) return null;
            return (
              <Box mt="20px">
                <Text mb="10px" style={{ fontSize: "0.58rem", color: "rgba(255,255,255,0.25)", letterSpacing: "0.1em", fontFamily: "'HarmonyOS Sans', sans-serif" }}>
                  INCLUDED
                </Text>

                {/* Background */}
                {bgItem && bgItem.assetUrl && (
                  <Box mb="12px">
                    <Flex align="center" gap="5px" mb="7px">
                      <ImageIcon size={9} color="rgba(96,165,250,0.65)" />
                      <Text style={{ fontSize: "0.56rem", color: "rgba(255,255,255,0.3)", fontFamily: "'HarmonyOS Sans', sans-serif", letterSpacing: "0.07em" }}>
                        BACKGROUND
                      </Text>
                    </Flex>
                    <Box w="140px" h="84px" borderRadius="8px" overflow="hidden" cursor="pointer"
                      onClick={() => setCompLightboxUrl(bgItem.assetUrl!)}
                      style={{ border: "1px solid rgba(96,165,250,0.2)", background: "rgba(96,165,250,0.05)", transition: "opacity 0.15s" }}
                      _hover={{ opacity: 0.82 } as any}
                    >
                      <img
                        src={bgItem.assetUrl}
                        alt="background"
                        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                        draggable={false}
                      />
                    </Box>
                  </Box>
                )}

                {/* Sticker */}
                {stickerItem && stickerItem.assetUrl && (
                  <Box mb="12px">
                    <Flex align="center" gap="5px" mb="7px">
                      <Sticker size={9} color="rgba(251,146,60,0.65)" />
                      <Text style={{ fontSize: "0.56rem", color: "rgba(255,255,255,0.3)", fontFamily: "'HarmonyOS Sans', sans-serif", letterSpacing: "0.07em" }}>
                        STICKER
                      </Text>
                    </Flex>
                    <Box w="72px" h="72px" borderRadius="10px" overflow="hidden" cursor="pointer"
                      onClick={() => setCompLightboxUrl(stickerItem.assetUrl!)}
                      style={{ border: "1px solid rgba(251,146,60,0.2)", background: "rgba(255,255,255,0.03)", transition: "opacity 0.15s" }}
                      _hover={{ opacity: 0.82 } as any}
                    >
                      <img
                        src={stickerItem.assetUrl}
                        alt="sticker"
                        style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
                        draggable={false}
                      />
                    </Box>
                  </Box>
                )}

                {/* Ambient sound */}
                {soundItem && soundItem.assetUrl && (
                  <Box mb="4px">
                    <Flex align="center" gap="5px" mb="7px">
                      <Music size={9} color="rgba(244,114,182,0.65)" />
                      <Text style={{ fontSize: "0.56rem", color: "rgba(255,255,255,0.3)", fontFamily: "'HarmonyOS Sans', sans-serif", letterSpacing: "0.07em" }}>
                        AMBIENT SOUND
                      </Text>
                    </Flex>
                    <Flex align="center" gap="10px" px="12px" py="10px" borderRadius="10px"
                      style={{ background: "rgba(244,114,182,0.06)", border: "1px solid rgba(244,114,182,0.18)" }}>
                      <Box
                        as="button" border="none" cursor="pointer" borderRadius="full" flexShrink={0}
                        w="30px" h="30px" display="flex" alignItems="center" justifyContent="center"
                        onClick={() => toggleCompAudio(soundItem.id, soundItem.assetUrl!)}
                        style={{
                          background: compAudioPlayingId === soundItem.id ? "rgba(244,114,182,0.22)" : "rgba(255,255,255,0.07)",
                          border: compAudioPlayingId === soundItem.id ? "1px solid rgba(244,114,182,0.45)" : "1px solid rgba(255,255,255,0.1)",
                          color: compAudioPlayingId === soundItem.id ? "rgba(249,168,212,0.95)" : "rgba(255,255,255,0.5)",
                          transition: "all 0.15s",
                        }}
                      >
                        {compAudioPlayingId === soundItem.id ? <Pause size={11} /> : <Play size={11} />}
                      </Box>
                      <Text flex={1} style={{
                        fontSize: "0.72rem", fontFamily: "'HarmonyOS Sans', sans-serif",
                        color: "rgba(255,255,255,0.65)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                      }}>
                        {soundItem.name ?? soundItem.assetUrl.split("/").pop()}
                      </Text>
                      <Music size={11} style={{ color: "rgba(244,114,182,0.3)", flexShrink: 0 }} />
                    </Flex>
                  </Box>
                )}
              </Box>
            );
          })()}
        </Box>

        {/* Footer */}
        <Box
          flexShrink={0}
          px="20px"
          py="14px"
          style={{
            borderTop: "1px solid rgba(255,255,255,0.07)",
            background: "rgba(10,15,20,0.95)",
          }}
        >
          {purchaseError && (
            <Text
              mb="8px"
              style={{
                fontSize: "0.72rem",
                fontFamily: "'HarmonyOS Sans', sans-serif",
                color: "#f87171",
                textAlign: "center",
              }}
            >
              {purchaseError}
            </Text>
          )}
          <Flex align="center" justify="flex-end" gap="8px">
            {isOwned ? (
              <Flex align="center" gap="8px">
                <Flex
                  align="center"
                  gap="6px"
                  px="12px"
                  py="9px"
                  borderRadius="10px"
                  style={{
                    background: "rgba(74,222,128,0.1)",
                    border: "1px solid rgba(74,222,128,0.3)",
                    color: "rgba(74,222,128,0.9)",
                    fontSize: "0.8rem",
                    fontFamily: "'HarmonyOS Sans', sans-serif",
                    fontWeight: 600,
                  }}
                >
                  <Check size={14} />
                  {t("themeStore.purchased")}
                </Flex>
                {item.category === "AmbientSound" ? (
                  <Flex
                    align="center"
                    gap="6px"
                    px="12px"
                    py="9px"
                    borderRadius="10px"
                    style={{
                      background: "rgba(99,102,241,0.1)",
                      border: "1px solid rgba(99,102,241,0.25)",
                      color: "rgba(165,180,252,0.85)",
                      fontSize: "0.75rem",
                      fontFamily: "'HarmonyOS Sans', sans-serif",
                      fontStyle: "italic",
                      whiteSpace: "nowrap",
                    }}
                  >
                    <Volume2 size={12} />
                    {t("themeStore.ambientSoundHint")}
                  </Flex>
                ) : onApplyItem && (
                  <Box
                    as="button"
                    onClick={() => {
                      if (item.category === "Theme" && allItems) {
                        const bgItem      = item.themeBackgroundItemId   ? allItems.find(i => i.id === item.themeBackgroundItemId)   : null;
                        const stickerItem = item.themeStickerItemId      ? allItems.find(i => i.id === item.themeStickerItemId)      : null;
                        const soundItem   = item.themeAmbientSoundItemId ? allItems.find(i => i.id === item.themeAmbientSoundItemId) : null;
                        onApplyItem(item, {
                          bgId:       bgItem?.id,
                          bgUrl:      bgItem?.assetUrl ?? undefined,
                          stickerUrl: stickerItem?.assetUrl ?? undefined,
                          ambientId:  soundItem?.id,
                          ambientUrl: soundItem?.assetUrl ?? undefined,
                        });
                      } else {
                        onApplyItem(item);
                      }
                    }}
                    px="16px"
                    py="9px"
                    borderRadius="10px"
                    border="none"
                    cursor="pointer"
                    display="flex"
                    alignItems="center"
                    gap="7px"
                    style={{
                      background: item.category === "Sticker"
                        ? "linear-gradient(135deg, rgba(236,72,153,0.9), rgba(168,85,247,0.85))"
                        : item.category === "Theme"
                        ? "linear-gradient(135deg, rgba(139,92,246,0.9), rgba(99,102,241,0.85))"
                        : "linear-gradient(135deg, rgba(59,130,246,0.9), rgba(6,182,212,0.85))",
                      color: "#fff",
                      fontSize: "0.8rem",
                      fontFamily: "'HarmonyOS Sans', sans-serif",
                      fontWeight: 600,
                      boxShadow: item.category === "Sticker"
                        ? "0 4px 14px rgba(236,72,153,0.3)"
                        : item.category === "Theme"
                        ? "0 4px 14px rgba(139,92,246,0.3)"
                        : "0 4px 14px rgba(59,130,246,0.3)",
                      transition: "filter 0.15s",
                      whiteSpace: "nowrap",
                    }}
                    _hover={{ filter: "brightness(1.1)" } as any}
                  >
                    {item.category === "Sticker" ? <PlusCircle size={13} /> : <Wand2 size={13} />}
                    {item.category === "Sticker" ? t("themeStore.addToSpace") : t("themeStore.apply")}
                  </Box>
                )}
              </Flex>
            ) : (
              <>
                {/* Try button */}
                {onStartTrial && !hasActiveTrial && (
                  <Box
                    as="button"
                    onClick={onStartTrial}
                    px="14px"
                    py="9px"
                    borderRadius="10px"
                    border="none"
                    cursor="pointer"
                    display="flex"
                    alignItems="center"
                    gap="6px"
                    style={{
                      background: "rgba(255,255,255,0.06)",
                      border: "1px solid rgba(255,255,255,0.14)",
                      color: "rgba(255,255,255,0.7)",
                      fontSize: "0.78rem",
                      fontFamily: "'HarmonyOS Sans', sans-serif",
                      fontWeight: 500,
                      transition: "all 0.15s",
                      whiteSpace: "nowrap",
                    }}
                    _hover={{ background: "rgba(255,255,255,0.1)", color: "#fff" } as any}
                  >
                    <Clock size={13} />
                    {t("themeStore.trial.button")}
                  </Box>
                )}
                {/* Trialing indicator */}
                {isTrialing && (
                  <Flex
                    align="center"
                    gap="6px"
                    px="14px"
                    py="9px"
                    borderRadius="10px"
                    style={{
                      background: `${color}18`,
                      border: `1px solid ${color}40`,
                      color: color,
                      fontSize: "0.78rem",
                      fontFamily: "'HarmonyOS Sans', sans-serif",
                      fontWeight: 500,
                      whiteSpace: "nowrap",
                    }}
                  >
                    <Box
                      w="6px"
                      h="6px"
                      borderRadius="full"
                      style={{ background: color, animation: "pulse 1.5s ease-in-out infinite" }}
                    />
                    {t("themeStore.trial.trying")}
                  </Flex>
                )}
                {/* Merged price + action button */}
                {canBuy ? (
                  <Box
                    as="button"
                    onClick={isFree ? onBuy : () => onOpenPaymentModal?.()}
                    px="16px"
                    py="9px"
                    borderRadius="10px"
                    border="none"
                    cursor={purchasing ? "not-allowed" : "pointer"}
                    display="flex"
                    alignItems="center"
                    gap="7px"
                    style={{
                      background: purchasing
                        ? "rgba(139,92,246,0.4)"
                        : isFree
                        ? "linear-gradient(135deg, rgba(20,184,166,0.9) 0%, rgba(6,182,212,0.9) 100%)"
                        : "linear-gradient(135deg, rgba(139,92,246,0.9) 0%, rgba(59,130,246,0.9) 100%)",
                      color: "#fff",
                      fontSize: "0.8rem",
                      fontFamily: "'HarmonyOS Sans', sans-serif",
                      fontWeight: 600,
                      transition: "all 0.18s",
                      boxShadow: !purchasing
                        ? isFree
                          ? "0 4px 14px rgba(20,184,166,0.35)"
                          : "0 4px 14px rgba(139,92,246,0.35)"
                        : "none",
                      opacity: purchasing ? 0.7 : 1,
                      whiteSpace: "nowrap",
                    }}
                    _hover={!purchasing ? { filter: "brightness(1.1)", transform: "translateY(-1px)" } as any : {}}
                  >
                    {purchasing ? "..." : isFree ? (
                      <>
                        <ShoppingBag size={13} />
                        {t("themeStore.detail.get")}
                      </>
                    ) : (
                      <>
                        <Coins size={13} color="rgba(250,204,21,0.9)" />
                        <Text style={{ fontSize: "0.88rem", fontFamily: "'HarmonyOS Sans', sans-serif", fontWeight: 700, color: "rgba(250,204,21,0.95)" }}>
                          {price.toLocaleString("vi-VN")}
                        </Text>
                      </>
                    )}
                  </Box>
                ) : (
                  <Box
                    as="button"
                    onClick={onLockedBuy}
                    px="16px"
                    py="9px"
                    borderRadius="10px"
                    border="none"
                    cursor="pointer"
                    display="flex"
                    alignItems="center"
                    gap="7px"
                    style={{
                      background: "linear-gradient(135deg, rgba(251,191,36,0.18) 0%, rgba(245,158,11,0.28) 100%)",
                      border: "1px solid rgba(251,191,36,0.45)",
                      color: "#fbbf24",
                      fontSize: "0.78rem",
                      fontFamily: "'HarmonyOS Sans', sans-serif",
                      fontWeight: 700,
                      whiteSpace: "nowrap",
                      transition: "all 0.15s",
                    }}
                    _hover={{ opacity: 0.85 } as any}
                  >
                    <Crown size={13} />
                    {t("premiumGate.upgrade")}
                  </Box>
                )}
              </>
            )}
          </Flex>
        </Box>
      </Box>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxIdx !== null && previewImgs[lightboxIdx] && (
          <>
            {/* Backdrop */}
            <MotionBox
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 } as any}
              position="fixed"
              inset={0}
              zIndex={200}
              onClick={() => setLightboxIdx(null)}
              style={{ background: "rgba(0,0,0,0.88)", backdropFilter: "blur(12px)", cursor: "zoom-out" }}
            />
            {/* Image container */}
            <MotionBox
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92 }}
              transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] } as any}
              position="fixed"
              inset={0}
              zIndex={201}
              display="flex"
              alignItems="center"
              justifyContent="center"
              style={{ pointerEvents: "none" }}
            >
              <Box style={{ maxWidth: "min(900px, 92vw)", maxHeight: "80vh", pointerEvents: "auto" }}>
                <img
                  src={previewImgs[lightboxIdx]}
                  alt={`preview-${lightboxIdx + 1}`}
                  style={{
                    display: "block",
                    maxWidth: "100%",
                    maxHeight: "80vh",
                    borderRadius: "14px",
                    boxShadow: "0 24px 80px rgba(0,0,0,0.7)",
                    objectFit: "contain",
                  }}
                  draggable={false}
                />
              </Box>
            </MotionBox>

            {/* Close — fixed top-right */}
            <Box
              as="button"
              onClick={() => setLightboxIdx(null)}
              position="fixed" top="16px" right="16px"
              w="36px" h="36px" borderRadius="full" border="none" cursor="pointer"
              display="flex" alignItems="center" justifyContent="center"
              zIndex={202}
              style={{ background: "rgba(20,20,20,0.9)", color: "rgba(255,255,255,0.85)", backdropFilter: "blur(8px)", boxShadow: "0 2px 12px rgba(0,0,0,0.5)" }}
            >
              <X size={16} />
            </Box>

            {/* Prev — fixed left-center */}
            {lightboxIdx > 0 && (
              <Box
                as="button"
                onClick={(e: React.MouseEvent) => { e.stopPropagation(); setLightboxIdx(i => i !== null ? i - 1 : null); }}
                position="fixed" left="16px" top="50%"
                w="44px" h="44px" borderRadius="full" border="none" cursor="pointer"
                display="flex" alignItems="center" justifyContent="center"
                zIndex={202}
                style={{ background: "rgba(20,20,20,0.85)", color: "rgba(255,255,255,0.85)", backdropFilter: "blur(8px)", transform: "translateY(-50%)", boxShadow: "0 2px 12px rgba(0,0,0,0.5)" }}
              >
                <ChevronLeft size={20} />
              </Box>
            )}

            {/* Next — fixed right-center */}
            {lightboxIdx < previewImgs.length - 1 && (
              <Box
                as="button"
                onClick={(e: React.MouseEvent) => { e.stopPropagation(); setLightboxIdx(i => i !== null ? i + 1 : null); }}
                position="fixed" right="16px" top="50%"
                w="44px" h="44px" borderRadius="full" border="none" cursor="pointer"
                display="flex" alignItems="center" justifyContent="center"
                zIndex={202}
                style={{ background: "rgba(20,20,20,0.85)", color: "rgba(255,255,255,0.85)", backdropFilter: "blur(8px)", transform: "translateY(-50%)", boxShadow: "0 2px 12px rgba(0,0,0,0.5)" }}
              >
                <ChevronRight size={20} />
              </Box>
            )}

            {/* Dots counter — fixed bottom-center */}
            {previewImgs.length > 1 && (
              <Flex
                position="fixed" bottom="24px" left="50%"
                gap="6px" zIndex={202}
                style={{ transform: "translateX(-50%)" }}
              >
                {previewImgs.map((_, i) => (
                  <Box
                    key={i}
                    as="button"
                    onClick={(e: React.MouseEvent) => { e.stopPropagation(); setLightboxIdx(i); }}
                    border="none" cursor="pointer" borderRadius="full"
                    style={{
                      width: i === lightboxIdx ? "20px" : "6px",
                      height: "6px",
                      background: i === lightboxIdx ? "#fff" : "rgba(255,255,255,0.35)",
                      transition: "all 0.2s",
                      padding: 0,
                    }}
                  />
                ))}
              </Flex>
            )}
          </>
        )}
      </AnimatePresence>

      {/* Component lightbox (bg / sticker) */}
      <AnimatePresence>
        {compLightboxUrl && (
          <>
            <MotionBox
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 } as any}
              position="fixed"
              inset={0}
              zIndex={200}
              onClick={() => setCompLightboxUrl(null)}
              style={{ background: "rgba(0,0,0,0.88)", backdropFilter: "blur(12px)", cursor: "zoom-out" }}
            />
            <MotionBox
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92 }}
              transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] } as any}
              position="fixed"
              inset={0}
              zIndex={201}
              display="flex"
              alignItems="center"
              justifyContent="center"
              style={{ pointerEvents: "none" }}
            >
              <Box style={{ maxWidth: "min(900px, 92vw)", maxHeight: "80vh", pointerEvents: "auto" }}>
                <img
                  src={compLightboxUrl}
                  alt="preview"
                  style={{ display: "block", maxWidth: "100%", maxHeight: "80vh", borderRadius: "14px", boxShadow: "0 24px 80px rgba(0,0,0,0.7)", objectFit: "contain" }}
                  draggable={false}
                />
              </Box>
            </MotionBox>
            {/* Fixed close button — always top-right of viewport */}
            <Box
              as="button"
              onClick={() => setCompLightboxUrl(null)}
              position="fixed" top="16px" right="16px"
              w="36px" h="36px" borderRadius="full" border="none" cursor="pointer"
              display="flex" alignItems="center" justifyContent="center"
              zIndex={202}
              style={{ background: "rgba(20,20,20,0.9)", color: "rgba(255,255,255,0.85)", backdropFilter: "blur(8px)", boxShadow: "0 2px 12px rgba(0,0,0,0.5)" }}
            >
              <X size={16} />
            </Box>
          </>
        )}
      </AnimatePresence>
    </MotionBox>
  );
}

// ── FeaturedCarousel ──────────────────────────────────────────────────────

const slideVariants = {
  enter: (dir: number) => ({ x: `${dir * 100}%`, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: `${dir * -100}%`, opacity: 0 }),
};

const slideTransition = { type: "spring", stiffness: 320, damping: 30, mass: 0.85 };

function FeaturedCarousel({
  items,
  t,
  onItemClick,
}: {
  items: StoreItem[];
  t: (k: string) => string;
  onItemClick: (item: StoreItem) => void;
}) {
  const [idx, setIdx] = useState(0);
  const [direction, setDirection] = useState(1);

  const goTo = useCallback((newIdx: number, dir: number) => {
    setDirection(dir);
    setIdx(newIdx);
  }, []);

  useEffect(() => {
    if (items.length <= 1) return;
    const timer = setTimeout(() => goTo((idx + 1) % items.length, 1), 5000);
    return () => clearTimeout(timer);
  }, [idx, items.length, goTo]);

  const item = items[idx];
  if (!item) return null;

  const price = item.coinPrice;

  return (
    <Box mb="10px">
      <Box position="relative" borderRadius="12px" overflow="hidden" style={{ height: 150 }}>
        <AnimatePresence initial={false} custom={direction} mode="popLayout">
          <MotionBox
            key={item.id}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={slideTransition as any}
            position="absolute"
            inset={0}
            cursor="pointer"
            onClick={() => onItemClick(item)}
          >
            <img
              src={item.assetUrl ?? PLACEHOLDER_IMG}
              alt={item.name}
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
              draggable={false}
            />
            <Box position="absolute" inset={0} style={{ background: "linear-gradient(90deg, rgba(5,8,14,0.92) 0%, rgba(5,8,14,0.55) 55%, rgba(5,8,14,0.1) 100%)" }} />
            <Box position="absolute" bottom={0} left={0} right={0} h="50px" style={{ background: "linear-gradient(transparent, rgba(5,8,14,0.75))" }} />

            <Flex position="absolute" inset={0} px="14px" py="11px" direction="column" justify="space-between">
              <Flex align="center" justify="flex-end" />
              <Box>
                <Text style={{ fontSize: "0.98rem", fontFamily: "'HarmonyOS Sans', sans-serif", fontWeight: 700, color: "#fff", lineHeight: 1.2, marginBottom: "2px" }}>
                  {item.name}
                </Text>
                <Flex align="center" justify="space-between">
                  <Text style={{ fontSize: "0.67rem", fontFamily: "'HarmonyOS Sans', sans-serif", color: "rgba(255,255,255,0.4)" }}>
                    {typeLabel(item.category, t)}
                  </Text>
                  <Flex align="center" gap="4px">
                    <Coins size={11} color="#facc15" />
                    <Text style={{ fontSize: "0.8rem", fontFamily: "'HarmonyOS Sans', sans-serif", fontWeight: 700, color: "#facc15" }}>
                      {price == null || price === 0 ? t("themeStore.free") : price.toLocaleString("vi-VN")}
                    </Text>
                  </Flex>
                </Flex>
              </Box>
            </Flex>
          </MotionBox>
        </AnimatePresence>

        {items.length > 1 && (
          <>
            <Box
              as="button"
              onClick={(e: React.MouseEvent) => { e.stopPropagation(); goTo((idx - 1 + items.length) % items.length, -1); }}
              position="absolute" left="8px" top="50%"
              w="22px" h="22px" borderRadius="full"
              display="flex" alignItems="center" justifyContent="center"
              border="none" cursor="pointer" zIndex={10}
              style={{ transform: "translateY(-50%)", background: "rgba(0,0,0,0.45)", backdropFilter: "blur(6px)", color: "rgba(255,255,255,0.85)", transition: "background 0.15s" }}
              _hover={{ background: "rgba(0,0,0,0.7)" } as any}
            >
              <ChevronLeft size={13} />
            </Box>
            <Box
              as="button"
              onClick={(e: React.MouseEvent) => { e.stopPropagation(); goTo((idx + 1) % items.length, 1); }}
              position="absolute" right="8px" top="50%"
              w="22px" h="22px" borderRadius="full"
              display="flex" alignItems="center" justifyContent="center"
              border="none" cursor="pointer" zIndex={10}
              style={{ transform: "translateY(-50%)", background: "rgba(0,0,0,0.45)", backdropFilter: "blur(6px)", color: "rgba(255,255,255,0.85)", transition: "background 0.15s" }}
              _hover={{ background: "rgba(0,0,0,0.7)" } as any}
            >
              <ChevronRight size={13} />
            </Box>
          </>
        )}

        <Flex position="absolute" bottom="7px" left="50%" gap="4px" zIndex={10} style={{ transform: "translateX(-50%)" }}>
          {items.map((_, i) => (
            <Box
              key={i}
              as="button"
              onClick={(e: React.MouseEvent) => { e.stopPropagation(); goTo(i, i > idx ? 1 : -1); }}
              h="5px"
              borderRadius="full"
              border="none"
              cursor="pointer"
              style={{
                width: i === idx ? "14px" : "5px",
                background: i === idx ? "#fff" : "rgba(255,255,255,0.35)",
                transition: "all 0.3s",
              }}
            />
          ))}
        </Flex>
      </Box>
    </Box>
  );
}

// ── CompBadge ─────────────────────────────────────────────────────────────

function CompBadge({ icon, label, active, color }: {
  icon: React.ReactNode; label: string; active: boolean; color: string;
}) {
  return (
    <Flex align="center" gap="5px" px="9px" py="5px" borderRadius="7px"
      style={{
        background: active ? `rgba(${color},0.1)` : "rgba(255,255,255,0.03)",
        border: active ? `1px solid rgba(${color},0.28)` : "1px solid rgba(255,255,255,0.07)",
        color: active ? `rgba(${color},0.85)` : "rgba(255,255,255,0.2)",
      }}>
      {icon}
      <Text style={{ fontSize: "0.65rem", fontFamily: "'HarmonyOS Sans', sans-serif", fontWeight: active ? 600 : 400 }}>
        {label}
      </Text>
      {active && <Check size={9} />}
    </Flex>
  );
}

// ── MyThemeCard ───────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<ThemeSubmissionStatus, { labelKey: string; color: string; bg: string; border: string; icon: React.ElementType }> = {
  PendingReview:           { labelKey: "themeStore.creator.status.pendingReview",           color: "#facc15", bg: "rgba(250,204,21,0.1)",  border: "rgba(250,204,21,0.28)",  icon: Clock },
  PendingTransaction:      { labelKey: "themeStore.creator.status.pendingTransaction",       color: "#38bdf8", bg: "rgba(56,189,248,0.1)",  border: "rgba(56,189,248,0.28)",  icon: Clock },
  PurchasedPendingPricing: { labelKey: "themeStore.creator.status.purchasedPendingPricing",  color: "#c084fc", bg: "rgba(192,132,252,0.1)", border: "rgba(192,132,252,0.28)", icon: Coins },
  Approved:                { labelKey: "themeStore.creator.status.approved",                 color: "#4ade80", bg: "rgba(74,222,128,0.1)",  border: "rgba(74,222,128,0.28)",  icon: Check },
  Rejected:                { labelKey: "themeStore.creator.status.rejected",                 color: "#f87171", bg: "rgba(248,113,113,0.1)", border: "rgba(248,113,113,0.28)", icon: X },
  AdminCreated:            { labelKey: "themeStore.creator.status.adminCreated",             color: "#a78bfa", bg: "rgba(167,139,250,0.1)", border: "rgba(167,139,250,0.28)", icon: Check },
};

function MyThemeCard({
  theme,
  withdrawing,
  onWithdraw,
  onEdit,
  onClick,
}: {
  theme: UserThemeSubmission;
  withdrawing: boolean;
  onWithdraw: (id: string) => void;
  onEdit?: (theme: UserThemeSubmission) => void;
  onClick?: () => void;
}) {
  const { t } = useTranslation();
  const cfg = STATUS_CONFIG[theme.status];
  const StatusIcon = cfg.icon;
  // Withdrawable while admin hasn't responded yet (PendingReview/PendingTransaction),
  // or after a rejection. Once admin has bought it (PurchasedPendingPricing) or
  // published it (Approved), it's no longer withdrawable.
  const canWithdraw = theme.status === "PendingReview" || theme.status === "PendingTransaction" || theme.status === "Rejected";
  const dateStr = new Date(theme.submittedAt).toLocaleDateString("vi-VN");

  return (
    <Box
      borderRadius="10px"
      overflow="hidden"
      cursor={onClick ? "pointer" : "default"}
      onClick={onClick}
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.07)",
        transition: "border-color 0.15s, background 0.15s",
      }}
      _hover={onClick ? { background: "rgba(255,255,255,0.06) !important", border: "1px solid rgba(255,255,255,0.14) !important" } as any : undefined}
    >
      <Flex gap="10px" p="10px">
        {/* Thumbnail */}
        <Box
          flexShrink={0}
          borderRadius="7px"
          overflow="hidden"
          style={{
            width: 72, height: 48,
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          {theme.assetUrl ? (
            <img
              src={theme.assetUrl}
              alt={theme.name}
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
              draggable={false}
            />
          ) : (
            <Flex w="100%" h="100%" align="center" justify="center">
              <Palette size={16} color="rgba(255,255,255,0.15)" />
            </Flex>
          )}
        </Box>

        {/* Info */}
        <Box flex={1} minW={0}>
          <Text style={{
            fontSize: "0.8rem",
            fontFamily: "'HarmonyOS Sans', sans-serif",
            fontWeight: 600,
            color: "rgba(255,255,255,0.88)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            marginBottom: "4px",
          }}>
            {theme.name}
          </Text>
          <Flex align="center" gap="6px" wrap="wrap">
            {/* Status badge */}
            <Flex
              align="center"
              gap="4px"
              px="6px"
              py="2px"
              borderRadius="5px"
              style={{
                background: cfg.bg,
                border: `1px solid ${cfg.border}`,
                color: cfg.color,
                fontSize: "0.6rem",
                fontFamily: "'HarmonyOS Sans', sans-serif",
                fontWeight: 600,
                letterSpacing: "0.04em",
                whiteSpace: "nowrap",
              }}
            >
              <StatusIcon size={9} />
              {t(cfg.labelKey)}
            </Flex>
            <Text style={{
              fontSize: "0.62rem",
              fontFamily: "'HarmonyOS Sans', sans-serif",
              color: "rgba(255,255,255,0.22)",
            }}>
              {dateStr}
            </Text>
          </Flex>
        </Box>

        {/* Action buttons */}
        {canWithdraw && (
          <Flex gap="4px" flexShrink={0}>
            {onEdit && (
              <Box
                as="button"
                onClick={(e: React.MouseEvent) => { e.stopPropagation(); onEdit(theme); }}
                border="none"
                cursor="pointer"
                borderRadius="6px"
                display="flex"
                alignItems="center"
                justifyContent="center"
                style={{
                  width: 28, height: 28,
                  background: "transparent",
                  color: "rgba(255,255,255,0.22)",
                  transition: "all 0.15s",
                }}
                _hover={{ background: "rgba(99,102,241,0.15) !important", color: "rgba(129,140,248,0.8) !important" }}
                title={t("themeStore.creator.editTooltip")}
              >
                <Pencil size={12} />
              </Box>
            )}
            <Box
              as="button"
              onClick={(e: React.MouseEvent) => { e.stopPropagation(); onWithdraw(theme.id); }}
              border="none"
              cursor={withdrawing ? "not-allowed" : "pointer"}
              borderRadius="6px"
              display="flex"
              alignItems="center"
              justifyContent="center"
              style={{
                width: 28, height: 28,
                background: "transparent",
                color: "rgba(255,255,255,0.22)",
                transition: "all 0.15s",
                opacity: withdrawing ? 0.5 : 1,
              }}
              _hover={{ background: "rgba(248,113,113,0.15) !important", color: "rgba(248,113,113,0.8) !important" }}
              title={t("themeStore.creator.withdrawTooltip")}
            >
              {withdrawing ? <LoadingRing size={12} /> : <Trash2 size={12} />}
            </Box>
          </Flex>
        )}
      </Flex>

      {/* Rejection note */}
      {theme.status === "Rejected" && theme.rejectionNote && (
        <Flex
          align="flex-start"
          gap="6px"
          px="10px"
          py="8px"
          style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
        >
          <AlertCircle size={11} color="rgba(248,113,113,0.6)" style={{ flexShrink: 0, marginTop: 1 }} />
          <Text style={{
            fontSize: "0.68rem",
            fontFamily: "'HarmonyOS Sans', sans-serif",
            color: "rgba(248,113,113,0.7)",
            lineHeight: 1.5,
          }}>
            {theme.rejectionNote}
          </Text>
        </Flex>
      )}
    </Box>
  );
}

// ── MyThemeDetailView ─────────────────────────────────────────────────────

function MyThemeDetailView({
  theme,
  withdrawing,
  onBack,
  onWithdraw,
  onEdit,
}: {
  theme: UserThemeSubmission;
  withdrawing: boolean;
  onBack: () => void;
  onWithdraw: (id: string) => void;
  onEdit?: (theme: UserThemeSubmission) => void;
}) {
  const { t } = useTranslation();
  const cfg = STATUS_CONFIG[theme.status];
  const StatusIcon = cfg.icon;
  // Withdrawable while admin hasn't responded yet (PendingReview/PendingTransaction),
  // or after a rejection. Once admin has bought it (PurchasedPendingPricing) or
  // published it (Approved), it's no longer withdrawable.
  const canWithdraw = theme.status === "PendingReview" || theme.status === "PendingTransaction" || theme.status === "Rejected";
  const canEdit    = theme.status === "PendingReview" || theme.status === "Rejected";

  // Pull components directly from the embedded inlineComponents array
  const components = theme.inlineComponents ?? [];
  const bgItems      = components.filter(c => c.category === "Background");
  const stickerItems = components.filter(c => c.category === "Sticker");
  const soundItems   = components.filter(c => c.category === "AmbientSound");

  // Audio — one playing at a time
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => { return () => { audioRef.current?.pause(); }; }, []);

  const toggleSound = (item: ThemeInlineComponent) => {
    if (!item.assetUrl) return;
    if (playingId === item.id) {
      audioRef.current?.pause();
      setPlayingId(null);
      return;
    }
    audioRef.current?.pause();
    const audio = new Audio(item.assetUrl);
    audioRef.current = audio;
    audio.play().catch(() => {});
    audio.onended = () => setPlayingId(null);
    setPlayingId(item.id);
  };

  const submittedDate = new Date(theme.submittedAt).toLocaleDateString("vi-VN", {
    year: "numeric", month: "long", day: "numeric",
  });
  const reviewedDate = theme.reviewedAt
    ? new Date(theme.reviewedAt).toLocaleDateString("vi-VN", { year: "numeric", month: "long", day: "numeric" })
    : null;

  const showFinalPrice = theme.status === "Approved" || theme.status === "AdminCreated";
  const displayCoinPrice = showFinalPrice ? theme.coinPrice : theme.requestedCoinPrice;
  const displayVndPrice  = showFinalPrice ? theme.realMoneyPriceVnd : theme.requestedRealMoneyPriceVnd;
  const priceLabel = showFinalPrice ? t("themeStore.creator.finalPriceLabel") : t("themeStore.creator.priceLabel");

  return (
    <MotionBox
      initial={{ x: "100%", opacity: 0 }}
      animate={{ x: 0, opacity: 1, transition: { type: "spring", stiffness: 380, damping: 32, mass: 0.9 } } as any}
      exit={{ x: "100%", opacity: 0, transition: { duration: 0.2, ease: [0.4, 0, 1, 1] } } as any}
      position="absolute" inset={0} overflow="hidden"
      style={{ background: "rgba(10,15,20,0.98)", zIndex: 20 }}
    >
      <Box h="100%" display="flex" flexDirection="column">

        {/* Hero */}
        <Box flexShrink={0} position="relative" style={{ height: 160, overflow: "hidden" }}>
          {(theme.previewUrl || theme.assetUrl) ? (
            <img
              src={theme.previewUrl ?? theme.assetUrl ?? ""}
              alt={theme.name}
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
              draggable={false}
            />
          ) : (
            <Flex w="100%" h="100%" align="center" justify="center"
              style={{ background: "linear-gradient(135deg, #080d12 0%, #0f1820 60%, #0a1520 100%)" }}>
              <Palette size={44} color="rgba(255,255,255,0.07)" />
            </Flex>
          )}
          <Box position="absolute" bottom={0} left={0} right={0} h="80px"
            style={{ background: "linear-gradient(transparent, rgba(10,15,20,0.98))" }} />

          {/* Back */}
          <Box as="button" onClick={onBack}
            position="absolute" top="10px" left="10px"
            display="flex" alignItems="center" gap="4px"
            px="10px" py="5px" borderRadius="8px" border="none" cursor="pointer"
            style={{
              background: "rgba(10,15,22,0.72)", backdropFilter: "blur(10px)",
              color: "rgba(255,255,255,0.8)", fontSize: "0.72rem", fontFamily: "'HarmonyOS Sans', sans-serif",
              transition: "background 0.15s",
            }}
            _hover={{ background: "rgba(25,35,50,0.9)" } as any}>
            <ChevronLeft size={14} />
            {t("themeStore.creator.back")}
          </Box>

          {/* Status badge */}
          <Flex position="absolute" top="10px" right="10px"
            align="center" gap="5px" px="9px" py="4px" borderRadius="7px"
            style={{ background: cfg.bg, border: `1px solid ${cfg.border}`, backdropFilter: "blur(6px)" }}>
            <StatusIcon size={10} style={{ color: cfg.color }} />
            <Text style={{ fontSize: "0.62rem", fontFamily: "'HarmonyOS Sans', sans-serif", fontWeight: 600, color: cfg.color, letterSpacing: "0.04em" }}>
              {t(cfg.labelKey)}
            </Text>
          </Flex>
        </Box>

        {/* Scrollable body */}
        <Box flex={1} overflowY="auto" px="20px" pt="14px" pb="8px" style={{ scrollbarWidth: "none" }}>

          {/* Name */}
          <Text mb={theme.description ? "6px" : "14px"} style={{
            fontSize: "1.08rem", fontFamily: "'HarmonyOS Sans', sans-serif", fontWeight: 700,
            color: "rgba(255,255,255,0.95)", lineHeight: 1.3,
          }}>
            {theme.name}
          </Text>

          {/* Description */}
          {theme.description && (
            <Text mb="16px" style={{
              fontSize: "0.78rem", fontFamily: "'HarmonyOS Sans', sans-serif",
              color: "rgba(255,255,255,0.5)", lineHeight: 1.65,
            }}>
              {theme.description}
            </Text>
          )}

          {/* Dates */}
          <Flex align="flex-start" gap="24px" mb="16px">
            <Box>
              <Text mb="3px" style={{ fontSize: "0.58rem", color: "rgba(255,255,255,0.25)", fontFamily: "'HarmonyOS Sans', sans-serif", letterSpacing: "0.1em" }}>
                {t("themeStore.creator.submittedDateLabel")}
              </Text>
              <Text style={{ fontSize: "0.74rem", color: "rgba(255,255,255,0.6)", fontFamily: "'HarmonyOS Sans', sans-serif" }}>
                {submittedDate}
              </Text>
            </Box>
            {reviewedDate && (
              <Box>
                <Text mb="3px" style={{ fontSize: "0.58rem", color: "rgba(255,255,255,0.25)", fontFamily: "'HarmonyOS Sans', sans-serif", letterSpacing: "0.1em" }}>
                  {theme.status === "Approved" ? t("themeStore.creator.approvedDateLabel") : t("themeStore.creator.reviewedDateLabel")}
                </Text>
                <Text style={{ fontSize: "0.74rem", color: "rgba(255,255,255,0.6)", fontFamily: "'HarmonyOS Sans', sans-serif" }}>
                  {reviewedDate}
                </Text>
              </Box>
            )}
          </Flex>

          {/* Components */}
          {components.length > 0 && (
            <Box mb="16px">
              <Text mb="10px" style={{ fontSize: "0.58rem", color: "rgba(255,255,255,0.25)", letterSpacing: "0.1em", fontFamily: "'HarmonyOS Sans', sans-serif" }}>
                {t("themeStore.creator.componentsSectionLabel")}
              </Text>

              {/* Background gallery */}
              {bgItems.length > 0 && (
                <Box mb={(stickerItems.length > 0 || soundItems.length > 0) ? "12px" : "0"}>
                  <Flex align="center" gap="5px" mb="7px">
                    <ImageIcon size={9} color="rgba(96,165,250,0.65)" />
                    <Text style={{ fontSize: "0.56rem", color: "rgba(255,255,255,0.3)", fontFamily: "'HarmonyOS Sans', sans-serif", letterSpacing: "0.07em" }}>
                      {bgItems.length > 1
                        ? t("themeStore.creator.backgroundsLabelCount", { count: bgItems.length })
                        : t("themeStore.creator.backgroundsLabel")}
                    </Text>
                  </Flex>
                  <Box mx="-20px" px="20px" style={{ overflowX: "auto", scrollbarWidth: "none", display: "flex", gap: "8px", paddingRight: bgItems.length > 1 ? "44px" : "20px" }}>
                    {bgItems.map((item, i) => (
                      <Box key={item.id} flexShrink={0} borderRadius="8px" overflow="hidden" position="relative"
                        style={{
                          width: bgItems.length === 1 ? "100%" : 140,
                          height: 84,
                          border: "1px solid rgba(96,165,250,0.3)",
                          background: "rgba(96,165,250,0.05)",
                        }}>
                        {item.assetUrl
                          ? <img src={item.assetUrl} alt="" draggable={false} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                          : <Flex w="100%" h="100%" align="center" justify="center"><ImageIcon size={16} color="rgba(96,165,250,0.3)" /></Flex>
                        }
                        {bgItems.length > 1 && (
                          <Box position="absolute" bottom="3px" right="5px"
                            style={{ fontSize: "0.5rem", color: "rgba(255,255,255,0.55)", fontFamily: "'HarmonyOS Sans', sans-serif", background: "rgba(0,0,0,0.55)", borderRadius: "3px", padding: "1px 4px" }}>
                            {i + 1}/{bgItems.length}
                          </Box>
                        )}
                      </Box>
                    ))}
                  </Box>
                </Box>
              )}

              {/* Sticker gallery */}
              {stickerItems.length > 0 && (
                <Box mb={soundItems.length > 0 ? "12px" : "0"}>
                  <Flex align="center" gap="5px" mb="7px">
                    <Sticker size={9} color="rgba(251,146,60,0.65)" />
                    <Text style={{ fontSize: "0.56rem", color: "rgba(255,255,255,0.3)", fontFamily: "'HarmonyOS Sans', sans-serif", letterSpacing: "0.07em" }}>
                      {stickerItems.length > 1
                        ? t("themeStore.creator.stickersLabelCount", { count: stickerItems.length })
                        : t("themeStore.creator.stickersLabel")}
                    </Text>
                  </Flex>
                  <Flex gap="8px" wrap="wrap">
                    {stickerItems.map(item => (
                      <Box key={item.id} borderRadius="8px" overflow="hidden" flexShrink={0}
                        style={{ width: 72, height: 72, border: "1px solid rgba(251,146,60,0.3)", background: "rgba(255,255,255,0.03)" }}>
                        {item.assetUrl
                          ? <img src={item.assetUrl} alt="" draggable={false} style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }} />
                          : <Flex w="100%" h="100%" align="center" justify="center"><Sticker size={16} color="rgba(251,146,60,0.3)" /></Flex>
                        }
                      </Box>
                    ))}
                  </Flex>
                </Box>
              )}

              {/* Ambient sound list */}
              {soundItems.length > 0 && (
                <Box>
                  <Flex align="center" gap="5px" mb="7px">
                    <Music size={9} color="rgba(244,114,182,0.65)" />
                    <Text style={{ fontSize: "0.56rem", color: "rgba(255,255,255,0.3)", fontFamily: "'HarmonyOS Sans', sans-serif", letterSpacing: "0.07em" }}>
                      {soundItems.length > 1
                        ? t("themeStore.creator.soundsLabelCount", { count: soundItems.length })
                        : t("themeStore.creator.soundsLabel")}
                    </Text>
                  </Flex>
                  <Box borderRadius="9px" overflow="hidden"
                    style={{ border: "1px solid rgba(244,114,182,0.22)", background: "rgba(244,114,182,0.04)" }}>
                    {soundItems.map((item, i) => (
                      <Flex key={item.id} align="center" gap="10px" px="12px" py="9px"
                        style={{ borderTop: i > 0 ? "1px solid rgba(244,114,182,0.1)" : "none" }}>
                        <Box as="button" border="none" cursor="pointer" borderRadius="full" flexShrink={0}
                          w="28px" h="28px" display="flex" alignItems="center" justifyContent="center"
                          onClick={() => toggleSound(item)}
                          style={{
                            background: playingId === item.id ? "rgba(244,114,182,0.25)" : "rgba(255,255,255,0.07)",
                            border: playingId === item.id ? "1px solid rgba(244,114,182,0.5)" : "1px solid rgba(255,255,255,0.1)",
                            color: playingId === item.id ? "rgba(249,168,212,0.95)" : "rgba(255,255,255,0.5)",
                            transition: "all 0.15s",
                          }}>
                          {playingId === item.id ? <Pause size={10} /> : <Play size={10} />}
                        </Box>
                        <Text flex={1} minW={0} style={{
                          fontSize: "0.72rem", color: "rgba(255,255,255,0.75)",
                          fontFamily: "'HarmonyOS Sans', sans-serif",
                          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                        }}>
                          {item.name}
                        </Text>
                        <Music size={11} style={{ color: "rgba(244,114,182,0.35)", flexShrink: 0 }} />
                      </Flex>
                    ))}
                  </Box>
                </Box>
              )}
            </Box>
          )}

          {/* Pricing */}
          {(displayCoinPrice || displayVndPrice) && (
            <Box mb="16px">
              <Text mb="9px" style={{ fontSize: "0.58rem", color: "rgba(255,255,255,0.25)", letterSpacing: "0.1em", fontFamily: "'HarmonyOS Sans', sans-serif" }}>
                {priceLabel}
              </Text>
              <Flex gap="10px">
                {displayCoinPrice != null && (
                  <Flex align="center" gap="5px" px="10px" py="6px" borderRadius="8px"
                    style={{ background: "rgba(250,204,21,0.08)", border: "1px solid rgba(250,204,21,0.2)" }}>
                    <Coins size={14} color="#facc15" />
                    <Text style={{ fontSize: "0.78rem", fontFamily: "'HarmonyOS Sans', sans-serif", fontWeight: 600, color: "#facc15" }}>
                      {displayCoinPrice.toLocaleString("vi-VN")}
                    </Text>
                  </Flex>
                )}
                {displayVndPrice != null && (
                  <Flex align="center" gap="5px" px="10px" py="6px" borderRadius="8px"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
                    <Text style={{ fontSize: "0.78rem", fontFamily: "'HarmonyOS Sans', sans-serif", fontWeight: 600, color: "rgba(255,255,255,0.72)" }}>
                      {displayVndPrice.toLocaleString("vi-VN")}đ
                    </Text>
                  </Flex>
                )}
              </Flex>
            </Box>
          )}

          {/* Status info box */}
          {theme.status === "Rejected" && theme.rejectionNote && (
            <Box mb="8px" px="14px" py="12px" borderRadius="10px"
              style={{ background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.22)" }}>
              <Flex align="center" gap="6px" mb="7px">
                <AlertCircle size={12} color="rgba(248,113,113,0.8)" />
                <Text style={{ fontSize: "0.6rem", fontFamily: "'HarmonyOS Sans', sans-serif", fontWeight: 700, color: "rgba(248,113,113,0.75)", letterSpacing: "0.08em" }}>
                  {t("themeStore.creator.rejectionReasonLabel")}
                </Text>
              </Flex>
              <Text style={{ fontSize: "0.76rem", fontFamily: "'HarmonyOS Sans', sans-serif", color: "rgba(248,113,113,0.7)", lineHeight: 1.6 }}>
                {theme.rejectionNote}
              </Text>
            </Box>
          )}
          {theme.status === "Approved" && (
            <Box mb="8px" px="14px" py="11px" borderRadius="10px"
              style={{ background: "rgba(74,222,128,0.07)", border: "1px solid rgba(74,222,128,0.2)" }}>
              <Flex align="center" gap="7px">
                <CheckCircle size={12} color="rgba(74,222,128,0.8)" />
                <Text style={{ fontSize: "0.74rem", fontFamily: "'HarmonyOS Sans', sans-serif", color: "rgba(74,222,128,0.72)", lineHeight: 1.55 }}>
                  {t("themeStore.creator.statusMsgApproved")}
                </Text>
              </Flex>
            </Box>
          )}
          {theme.status === "PendingReview" && (
            <Box mb="8px" px="14px" py="11px" borderRadius="10px"
              style={{ background: "rgba(250,204,21,0.07)", border: "1px solid rgba(250,204,21,0.2)" }}>
              <Flex align="center" gap="7px">
                <Clock size={12} color="rgba(250,204,21,0.7)" />
                <Text style={{ fontSize: "0.74rem", fontFamily: "'HarmonyOS Sans', sans-serif", color: "rgba(250,204,21,0.62)", lineHeight: 1.55 }}>
                  {t("themeStore.creator.statusMsgPendingReview")}
                </Text>
              </Flex>
            </Box>
          )}
          {theme.status === "PendingTransaction" && (
            <Box mb="8px" px="14px" py="11px" borderRadius="10px"
              style={{ background: "rgba(56,189,248,0.07)", border: "1px solid rgba(56,189,248,0.2)" }}>
              <Flex align="center" gap="7px">
                <Clock size={12} color="rgba(56,189,248,0.75)" />
                <Text style={{ fontSize: "0.74rem", fontFamily: "'HarmonyOS Sans', sans-serif", color: "rgba(56,189,248,0.68)", lineHeight: 1.55 }}>
                  {t("themeStore.creator.statusMsgPendingTransaction")}
                </Text>
              </Flex>
            </Box>
          )}
          {theme.status === "PurchasedPendingPricing" && (
            <Box mb="8px" px="14px" py="11px" borderRadius="10px"
              style={{ background: "rgba(192,132,252,0.07)", border: "1px solid rgba(192,132,252,0.2)" }}>
              <Flex align="center" gap="7px">
                <Coins size={12} color="rgba(192,132,252,0.75)" />
                <Text style={{ fontSize: "0.74rem", fontFamily: "'HarmonyOS Sans', sans-serif", color: "rgba(192,132,252,0.68)", lineHeight: 1.55 }}>
                  {t("themeStore.creator.statusMsgPurchasedPendingPricing")}
                </Text>
              </Flex>
            </Box>
          )}
        </Box>

        {/* Footer actions */}
        {(canEdit || canWithdraw) && (
          <Box px="20px" py="14px"
            style={{ borderTop: "1px solid rgba(255,255,255,0.07)", background: "rgba(10,15,20,0.95)" }}>
            <Flex gap="8px" justify="flex-end">
              {canEdit && onEdit && (
                <Box as="button" onClick={() => onEdit(theme)} border="none" cursor="pointer"
                  display="flex" alignItems="center" gap="6px" px="14px" py="8px" borderRadius="9px"
                  style={{
                    background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.28)",
                    color: "rgba(129,140,248,0.85)", fontSize: "0.78rem",
                    fontFamily: "'HarmonyOS Sans', sans-serif", fontWeight: 500, transition: "all 0.15s",
                  }}
                  _hover={{ background: "rgba(99,102,241,0.2) !important" } as any}>
                  <Pencil size={12} />{t("themeStore.creator.editBtn")}
                </Box>
              )}
              {canWithdraw && (
                <Box as="button" onClick={() => onWithdraw(theme.id)} border="none"
                  cursor={withdrawing ? "not-allowed" : "pointer"}
                  display="flex" alignItems="center" gap="6px" px="14px" py="8px" borderRadius="9px"
                  style={{
                    background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.22)",
                    color: "rgba(248,113,113,0.75)", fontSize: "0.78rem",
                    fontFamily: "'HarmonyOS Sans', sans-serif", fontWeight: 500,
                    opacity: withdrawing ? 0.6 : 1, transition: "all 0.15s",
                  }}
                  _hover={!withdrawing ? { background: "rgba(248,113,113,0.15) !important" } as any : undefined}>
                  {withdrawing
                    ? <LoadingRing size={12} />
                    : <Trash2 size={12} />}
                  {withdrawing ? t("themeStore.creator.withdrawing") : t("themeStore.creator.withdraw")}
                </Box>
              )}
            </Flex>
          </Box>
        )}
      </Box>
    </MotionBox>
  );
}

// ── ThemeCreatorNavButton ────────────────────────────────────────────────
// The colorful glow on the Brush icon plays both when this tab is active and
// on hover, so the sidebar entry always feels inviting, not just after it's selected.

function ThemeCreatorNavButton({ active, onClick }: { active: boolean; onClick: () => void }) {
  const { t } = useTranslation();
  const [hovered, setHovered] = useState(false);
  const glowing = active || hovered;

  return (
    <Box position="relative" title={PUBLIC_BETA ? MY_THEMES_MAINTENANCE_MSG : undefined}>
      <Box
        as="button"
        w="100%"
        textAlign="left"
        display="flex"
        alignItems="center"
        gap="8px"
        px="8px"
        py="6px"
        borderRadius="7px"
        border="none"
        cursor={PUBLIC_BETA ? "not-allowed" : "pointer"}
        onClick={() => !PUBLIC_BETA && onClick()}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          background: active ? "rgba(78,124,106,0.18)" : "transparent",
          color: active ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.45)",
          fontSize: "0.82rem",
          fontFamily: "'HarmonyOS Sans', sans-serif",
          fontWeight: active ? 600 : 400,
          transition: "all 0.15s",
          filter: PUBLIC_BETA ? "blur(2.5px)" : "none",
          opacity: PUBLIC_BETA ? 0.55 : 1,
          userSelect: PUBLIC_BETA ? "none" : "auto",
        }}
        _hover={!PUBLIC_BETA ? { background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.8)" } as any : {}}
      >
        <Box position="relative" flexShrink={0} w="18px" h="18px" display="flex" alignItems="center" justifyContent="center">
          {/* Glow ring stays mounted and always animating — only its opacity toggles via
              plain CSS, so rapid hover in/out never restarts or flickers the animation. */}
          <Box
            position="absolute" inset="-5px" borderRadius="full"
            style={{ opacity: glowing ? 1 : 0, transition: "opacity 0.25s ease", pointerEvents: "none" }}
          >
            <MotionBox
              w="100%" h="100%" borderRadius="full"
              animate={{ opacity: [0.55, 0.95, 0.55], scale: [1, 1.18, 1], rotate: [0, 360] }}
              transition={{
                opacity: { duration: 2.2, repeat: Infinity, ease: "easeInOut" },
                scale:   { duration: 2.2, repeat: Infinity, ease: "easeInOut" },
                rotate:  { duration: 5,   repeat: Infinity, ease: "linear" },
              } as any}
              style={{
                background: "conic-gradient(from 0deg, #f472b6, #fbbf24, #4ade80, #38bdf8, #a78bfa, #f472b6)",
                filter: "blur(5px)",
              }}
            />
          </Box>
          <Box
            style={{
              position: "relative",
              display: "flex",
              color: glowing ? "#fff" : "rgba(255,255,255,0.28)",
              filter: glowing ? "drop-shadow(0 0 5px rgba(250,204,21,0.85))" : "none",
              transition: "color 0.2s ease, filter 0.2s ease",
              pointerEvents: "none",
            }}
          >
            <Brush size={14} />
          </Box>
        </Box>
        <Box flex={1}>{t("themeStore.tabCreator")}</Box>
        <Box
          flexShrink={0}
          px="4px"
          py="1px"
          borderRadius="3px"
          style={{
            background: "rgba(78,124,106,0.2)",
            border: "1px solid rgba(78,124,106,0.38)",
          }}
        >
          <Text style={{
            fontSize: "0.5rem",
            fontFamily: "'HarmonyOS Sans', sans-serif",
            fontWeight: 700,
            color: "rgba(78,124,106,0.9)",
            letterSpacing: "0.07em",
          }}>
            BETA
          </Text>
        </Box>
      </Box>
      {PUBLIC_BETA && (
        <Text
          mt="3px"
          px="8px"
          style={{
            fontSize: "0.56rem",
            fontFamily: "'HarmonyOS Sans', sans-serif",
            fontWeight: 600,
            color: "rgba(251,191,36,0.75)",
            lineHeight: 1.4,
          }}
        >
          {MY_THEMES_MAINTENANCE_MSG}
        </Text>
      )}
    </Box>
  );
}

// ── ThemeStorePanel (main) ─────────────────────────────────────────────────

export function ThemeStorePanel({
  onClose,
  coinBalance: coinBalanceProp,
  onCoinBalanceChange,
  onStartTrial,
  onTrialEnd,
  onApplyItem,
  trialItemId,
  initialDetailItemId,
  initialTab,
}: Props) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { markCreatorReviewNotificationsRead } = useNotificationBanners();
  const { x, y, ref } = useCenteredPanel(PANEL_W, PANEL_H, 64);

  const canBuyItems = true;
  const canCreateThemes = user?.accountTier !== "Free";

  const [items, setItems]               = useState<StoreItem[]>([]);
  const [gateOpen, setGateOpen]         = useState(false);
  const [itemsLoading, setItemsLoading] = useState(true);
  const [activeTab, setActiveTab]       = useState<TabValue>(initialTab ?? "all");
  const [searchQuery, setSearchQuery]   = useState("");
  const [sourceFilter, setSourceFilter] = useState<"all" | "Official" | "Community">("all");
  const [wishlistIds, setWishlistIds]   = useState<Set<string>>(() => {
    try { return new Set<string>(JSON.parse(localStorage.getItem("theme_wishlist") ?? "[]")); }
    catch { return new Set<string>(); }
  });
  const [selectedItem, setSelectedItem] = useState<StoreItem | null>(null);
  const [purchasing, setPurchasing]     = useState(false);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [localCoinBalance, setLocalCoinBalance] = useState<number>(coinBalanceProp ?? 0);

  const [myThemes, setMyThemes]           = useState<UserThemeSubmission[]>([]);
  const [myThemesLoading, setMyThemesLoading] = useState(false);
  const [myThemesError, setMyThemesError] = useState<string | null>(null);
  const [withdrawingId, setWithdrawingId] = useState<string | null>(null);
  const [selectedMyTheme, setSelectedMyTheme] = useState<UserThemeSubmission | null>(null);
  const [createEditTarget, setCreateEditTarget] = useState<"new" | UserThemeSubmission | null>(null);

  const myThemeChildIds = useMemo(() => {
    const ids = new Set<string>();
    myThemes.forEach(t => {
      // Use embedded inlineComponents (covers all component types)
      t.inlineComponents?.forEach(c => ids.add(c.id));
      // Fallback to singular ID fields for safety
      if (t.themeBackgroundItemId)  ids.add(t.themeBackgroundItemId);
      if (t.themeStickerItemId)     ids.add(t.themeStickerItemId);
      if (t.themeAmbientSoundItemId) ids.add(t.themeAmbientSoundItemId);
    });
    return ids;
  }, [myThemes]);

  const loading = itemsLoading;

  // Sync coinBalance prop
  useEffect(() => {
    if (coinBalanceProp != null) setLocalCoinBalance(coinBalanceProp);
  }, [coinBalanceProp]);

  // Fetch coin balance if not provided
  useEffect(() => {
    if (coinBalanceProp == null && user) {
      coinService.getBalance().then((d) => setLocalCoinBalance(d.balance));
    }
  }, [coinBalanceProp, user]);

  useEffect(() => { setSourceFilter("all"); }, [activeTab]);

  const handleSidebarTabSelect = useCallback((tab: TabValue) => {
    setSelectedItem(null);
    setCreateEditTarget(null);
    setSelectedMyTheme(null);
    setActiveTab(tab);
  }, []);

  // Fetch all store items on mount
  useEffect(() => {
    setItemsLoading(true);
    aestheticStoreService.getItems(undefined, 1, 200)
      .then((data) => setItems(data))
      .catch(() => {})
      .finally(() => setItemsLoading(false));
  }, []);


  // Fetch my submitted themes when switching to "my-themes" tab
  const refreshMyThemes = useCallback(() => {
    setMyThemesLoading(true);
    setMyThemesError(null);
    userThemeService.getMyThemes()
      .then((data) => setMyThemes(data))
      .catch(() => setMyThemesError("Không thể tải danh sách theme. Vui lòng thử lại."))
      .finally(() => setMyThemesLoading(false));
  }, []);

  useEffect(() => {
    if (activeTab !== "my-themes") return;
    refreshMyThemes();
    markCreatorReviewNotificationsRead();
  }, [activeTab, refreshMyThemes, markCreatorReviewNotificationsRead]);

  const handleWithdraw = useCallback(async (id: string) => {
    setWithdrawingId(id);
    try {
      await userThemeService.withdraw(id);
      setMyThemes((prev) => prev.filter((t) => t.id !== id));
    } catch {
      // silently ignore — could show a toast here
    } finally {
      setWithdrawingId(null);
    }
  }, []);

  // Auto-close my-theme detail when the theme is withdrawn
  useEffect(() => {
    if (selectedMyTheme && !myThemes.some(t => t.id === selectedMyTheme.id)) {
      setSelectedMyTheme(null);
    }
  }, [myThemes, selectedMyTheme]);

  // Auto-open detail view from trial banner "Buy now"
  useEffect(() => {
    if (!initialDetailItemId || items.length === 0) return;
    const item = items.find((i) => i.id === initialDetailItemId);
    if (item) setSelectedItem(item);
  }, [initialDetailItemId, items]);


  const featuredItems = useMemo(() =>
    items.filter((i) => i.category === "Theme" && i.themeSource !== null).slice(0, 3),
  [items]);

  const filteredItems = useMemo(() => {
    // Search: scan toàn bộ catalog có giá, bỏ Effect và sub-component free
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return items.filter(
        (i) => i.category !== "Effect"
          && (i.coinPrice != null || i.realMoneyPriceVnd != null)
          && i.name.toLowerCase().includes(q)
      );
    }

    let source: StoreItem[];
    if (activeTab === "purchased") source = items.filter((i) => i.isOwned);
    else if (activeTab === "wishlist") source = items.filter((i) => wishlistIds.has(i.id));
    else if (activeTab === "all") source = items.filter((i) => i.category !== "Effect" && (i.coinPrice != null || i.realMoneyPriceVnd != null));
    else source = items.filter((i) => i.category === activeTab && (i.coinPrice != null || i.realMoneyPriceVnd != null));

    if (sourceFilter !== "all" && (activeTab === "all" || activeTab === "Theme")) {
      source = source.filter((i) => i.themeSource === sourceFilter);
    }

    return source;
  }, [activeTab, items, wishlistIds, searchQuery, sourceFilter]);

  const toggleWishlist = useCallback((itemId: string) => {
    setWishlistIds((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) next.delete(itemId);
      else next.add(itemId);
      localStorage.setItem("theme_wishlist", JSON.stringify([...next]));
      return next;
    });
  }, []);

  const handleBuy = useCallback(async () => {
    if (!selectedItem) return;
    setPurchaseError(null);
    setPurchasing(true);
    try {
      const result = await aestheticStoreService.purchase(selectedItem.id);
      setLocalCoinBalance(result.remainingCoins);
      onCoinBalanceChange?.(result.remainingCoins);
      setItems((prev) =>
        prev.map((i) => (i.id === selectedItem.id ? { ...i, isOwned: true } : i))
      );
      setSelectedItem((prev) => (prev ? { ...prev, isOwned: true } : null));
      if (selectedItem.id === trialItemId) onTrialEnd?.();
    } catch (err) {
      const msg = err instanceof Error ? err.message : t("themeStore.detail.purchaseFailed");
      setPurchaseError(msg);
    } finally {
      setPurchasing(false);
    }
  }, [selectedItem, onCoinBalanceChange, t, trialItemId, onTrialEnd]);

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
        width: PANEL_W,
        height: PANEL_H,
        maxHeight: "calc(100vh - 88px)",
        borderRadius: "16px",
        background: "rgba(12,18,22,0.75)",
        backdropFilter: "blur(18px)",
        WebkitBackdropFilter: "blur(18px)",
        border: "1px solid rgba(255,255,255,0.1)",
        boxShadow: "0 24px 80px rgba(0,0,0,0.75), 0 0 0 1px rgba(255,255,255,0.06)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* ── Header ── */}
      <Box
        flexShrink={0}
        style={{ padding: "18px 18px 14px", paddingRight: "52px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}
      >
        <PanelCloseBtn onClose={onClose} />
        <Flex align="center" justify="space-between">
          <Flex align="center" gap="7px">
            <ShoppingBag size={13} style={{ color: "rgba(167,139,250,0.45)", flexShrink: 0 }} />
            <Flex align="center" gap="6px">
              <Text style={{ fontSize: "0.95rem", color: "rgba(255,255,255,0.65)", letterSpacing: "-0.01em" }}>
                <span style={{ fontFamily: "'Manrope', sans-serif" }}>Aēsthetic</span>
                <span style={{ fontFamily: "'HarmonyOS Sans', sans-serif" }}> Store</span>
              </Text>
              <Box px="4px" py="1px" borderRadius="3px"
                style={{ background: "rgba(139,92,246,0.12)", border: "1px solid rgba(139,92,246,0.22)" }}
              >
                <Text style={{ fontSize: "0.52rem", fontFamily: "'HarmonyOS Sans', sans-serif", fontWeight: 700, color: "rgba(167,139,250,0.55)", letterSpacing: "0.07em" }}>
                  BETA
                </Text>
              </Box>
            </Flex>
          </Flex>
          <Flex align="center" gap="4px" px="8px" py="3px" borderRadius="16px"
            style={{ background: "rgba(250,204,21,0.07)", border: "1px solid rgba(250,204,21,0.15)" }}
          >
            <Coins size={10} color="rgba(250,204,21,0.65)" />
            <Text style={{ fontSize: "0.68rem", fontFamily: "'HarmonyOS Sans', sans-serif", fontWeight: 600, color: "rgba(250,204,21,0.65)" }}>
              {localCoinBalance.toLocaleString("vi-VN")}
            </Text>
          </Flex>
        </Flex>
      </Box>

      {/* ── Body: sidebar + content ── */}
      <Flex flex={1} style={{ minHeight: 0 }}>

        {/* ── Left sidebar ── */}
        <Box
          flexShrink={0}
          py="10px"
          px="8px"
          style={{
            width: 155,
            borderRight: "1px solid rgba(255,255,255,0.07)",
            overflowY: "auto",
            scrollbarWidth: "none",
          }}
        >
          {/* Search */}
          <Flex
            align="center"
            gap="6px"
            px="8px"
            mb="10px"
            borderRadius="8px"
            style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.09)" }}
          >
            <Search size={12} color="rgba(255,255,255,0.3)" flexShrink={0} />
            <Input
              flex={1}
              value={searchQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
              placeholder={t("themeStore.searchPlaceholder")}
              variant="unstyled"
              _focusVisible={{ boxShadow: "none" }}
              style={{
                background: "transparent",
                border: "none",
                outline: "none",
                color: "rgba(255,255,255,0.85)",
                fontSize: "0.72rem",
                fontFamily: "'HarmonyOS Sans', sans-serif",
                padding: "7px 0",
                width: "100%",
                minWidth: 0,
              }}
            />
            {searchQuery && (
              <Box as="button" onClick={() => setSearchQuery("")} display="flex" alignItems="center" border="none" bg="transparent" cursor="pointer" flexShrink={0}
                style={{ color: "rgba(255,255,255,0.3)", padding: "2px", transition: "color 0.15s" }}
                _hover={{ color: "rgba(255,255,255,0.7)" } as any}
              >
                <X size={11} />
              </Box>
            )}
          </Flex>

          {/* Browse section */}
          <Text px="8px" mb="4px" style={{ fontSize: "0.58rem", fontFamily: "'HarmonyOS Sans', sans-serif", fontWeight: 700, color: "rgba(255,255,255,0.22)", letterSpacing: "0.1em" }}>
            {t("themeStore.sidebarBrowse")}
          </Text>
          {TABS.filter((tab) => tab.value !== "purchased" && tab.value !== "wishlist").map((tab) => {
            const active = activeTab === tab.value;
            const color = tab.value !== "all" ? typeColor(tab.value as StoreCategory) : undefined;
            return (
              <Box
                key={tab.value}
                as="button"
                w="100%"
                textAlign="left"
                display="flex"
                alignItems="center"
                gap="8px"
                px="8px"
                py="6px"
                mb="1px"
                borderRadius="7px"
                border="none"
                cursor="pointer"
                onClick={() => handleSidebarTabSelect(tab.value)}
                style={{
                  background: active ? "rgba(255,255,255,0.1)" : "transparent",
                  color: active ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.45)",
                  fontSize: "0.82rem",
                  fontFamily: "'HarmonyOS Sans', sans-serif",
                  fontWeight: active ? 600 : 400,
                  transition: "all 0.15s",
                }}
                _hover={{ background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.8)" } as any}
              >
                <Box flexShrink={0} style={{ color: active && color ? color : active ? "rgba(255,255,255,0.65)" : "rgba(255,255,255,0.28)", display: "flex" }}>
                  {tabIcon(tab.value)}
                </Box>
                {t(tab.key)}
              </Box>
            );
          })}

          {/* Library section */}
          <Box my="8px" mx="4px" style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }} />
          <Text px="8px" mb="4px" style={{ fontSize: "0.58rem", fontFamily: "'HarmonyOS Sans', sans-serif", fontWeight: 700, color: "rgba(255,255,255,0.22)", letterSpacing: "0.1em" }}>
            {t("themeStore.sidebarLibrary")}
          </Text>
          {(["purchased"] as const).map((val) => {
            const tab = TABS.find((tb) => tb.value === val)!;
            const active = activeTab === val;
            const isPurchased = val === "purchased";
            const activeColor = isPurchased ? "rgba(74,222,128,0.85)" : "rgba(251,113,133,0.9)";
            const count = undefined;
            return (
              <Box
                key={val}
                as="button"
                w="100%"
                textAlign="left"
                display="flex"
                alignItems="center"
                gap="8px"
                px="8px"
                py="6px"
                mb="1px"
                borderRadius="7px"
                border="none"
                cursor="pointer"
                onClick={() => handleSidebarTabSelect(val)}
                style={{
                  background: active ? "rgba(255,255,255,0.1)" : "transparent",
                  color: active ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.45)",
                  fontSize: "0.82rem",
                  fontFamily: "'HarmonyOS Sans', sans-serif",
                  fontWeight: active ? 600 : 400,
                  transition: "all 0.15s",
                }}
                _hover={{ background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.8)" } as any}
              >
                <Box flexShrink={0} style={{ color: active ? activeColor : "rgba(255,255,255,0.28)", display: "flex" }}>
                  {isPurchased ? <Check size={14} /> : <Heart size={14} fill={active ? "rgba(251,113,133,0.9)" : "none"} />}
                </Box>
                <Box flex={1}>{t(tab.key)}</Box>
                {count !== undefined && count > 0 && (
                  <Box
                    flexShrink={0}
                    style={{
                      fontSize: "0.62rem",
                      fontFamily: "'HarmonyOS Sans', sans-serif",
                      fontWeight: 700,
                      color: active ? "rgba(251,113,133,0.9)" : "rgba(255,255,255,0.3)",
                      background: active ? "rgba(251,113,133,0.12)" : "rgba(255,255,255,0.06)",
                      borderRadius: "10px",
                      padding: "1px 6px",
                      transition: "all 0.15s",
                    }}
                  >
                    {count}
                  </Box>
                )}
              </Box>
            );
          })}

          {/* Create section */}
          <Box my="8px" mx="4px" style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }} />
          <Text px="8px" mb="4px" style={{ fontSize: "0.58rem", fontFamily: "'HarmonyOS Sans', sans-serif", fontWeight: 700, color: "rgba(255,255,255,0.22)", letterSpacing: "0.1em" }}>
            SÁNG TẠO
          </Text>
          <ThemeCreatorNavButton
            active={activeTab === "my-themes"}
            onClick={() => handleSidebarTabSelect("my-themes")}
          />
        </Box>

        {/* ── Right content ── */}
        <Box flex={1} display="flex" flexDirection="column" position="relative" style={{ minWidth: 0 }}>
          <AnimatePresence>
            {createEditTarget && (
              <CreateThemePanel
                key={createEditTarget === "new" ? "create-theme-new" : createEditTarget.id}
                initialTheme={createEditTarget === "new" ? undefined : createEditTarget}
                onClose={() => { setCreateEditTarget(null); refreshMyThemes(); }}
              />
            )}
          </AnimatePresence>
          <AnimatePresence>
            {selectedMyTheme && (
              <MyThemeDetailView
                key={selectedMyTheme.id}
                theme={selectedMyTheme}
                withdrawing={withdrawingId === selectedMyTheme.id}
                onBack={() => setSelectedMyTheme(null)}
                onWithdraw={handleWithdraw}
                onEdit={(theme) => { setSelectedMyTheme(null); setCreateEditTarget(theme); }}
              />
            )}
          </AnimatePresence>
          <AnimatePresence>
            {selectedItem && (
              <ItemDetailView
                key={selectedItem.id}
                item={selectedItem}
                t={t}
                purchasing={purchasing}
                purchaseError={purchaseError}
                onBack={() => { setSelectedItem(null); setPurchaseError(null); }}
                onBuy={handleBuy}
                onOpenPaymentModal={() => { setPurchaseError(null); setPaymentModalOpen(true); }}
                onStartTrial={
                  onStartTrial && !selectedItem.isOwned
                    && selectedItem.category !== "Sticker"
                    && selectedItem.category !== "AmbientSound"
                    ? () => {
                        let trialBgUrl: string | undefined;
                        let trialStickerUrl: string | undefined;
                        let trialAmbientUrl: string | undefined;
                        if (selectedItem.category === "Theme") {
                          const foundBg = selectedItem.themeBackgroundItemId
                            ? items.find(i => i.id === selectedItem.themeBackgroundItemId)?.assetUrl
                            : undefined;
                          trialBgUrl = foundBg ?? selectedItem.assetUrl ?? undefined;
                          trialStickerUrl = selectedItem.themeStickerItemId
                            ? items.find(i => i.id === selectedItem.themeStickerItemId)?.assetUrl ?? undefined
                            : undefined;
                          trialAmbientUrl = selectedItem.themeAmbientSoundItemId
                            ? items.find(i => i.id === selectedItem.themeAmbientSoundItemId)?.assetUrl ?? undefined
                            : undefined;
                        }
                        onStartTrial(selectedItem, trialBgUrl, trialStickerUrl, trialAmbientUrl);
                        onClose();
                      }
                    : undefined
                }
                isTrialing={selectedItem.id === trialItemId}
                hasActiveTrial={!!trialItemId}
                canPurchase={canBuyItems}
                onLockedBuy={() => setGateOpen(true)}
                isWishlisted={wishlistIds.has(selectedItem.id)}
                onToggleWishlist={() => toggleWishlist(selectedItem.id)}
                onApplyItem={onApplyItem}
                allItems={items}
              />
            )}
          </AnimatePresence>
          <Box
            flex={1}
            overflowY="auto"
            px="12px"
            pt="12px"
            pb="12px"
            style={{ minHeight: 0, scrollbarWidth: "thin", scrollbarColor: "rgba(255,255,255,0.12) transparent" }}
          >
            {/* ── Title bar ── */}
            <Flex align="center" justify="space-between" mb="16px" gap="12px">
              <Text style={{
                fontSize: "1.3rem",
                fontWeight: 700,
                color: "rgba(255,255,255,0.9)",
                letterSpacing: "-0.01em",
                fontFamily: "'HarmonyOS Sans', sans-serif",
              }}>
                {t(tabTitleKey(activeTab))}
              </Text>
              {activeTab === "my-themes" && (
                <Box
                  as="button"
                  flexShrink={0}
                  onClick={canCreateThemes ? () => { setSelectedMyTheme(null); setCreateEditTarget("new"); } : undefined}
                  title={!canCreateThemes ? t("themeStore.creator.upgradeToCreate") : undefined}
                  display="flex" alignItems="center" gap="6px"
                  px="12px" py="7px" borderRadius="20px" border="none"
                  cursor={canCreateThemes ? "pointer" : "not-allowed"}
                  style={{
                    background: canCreateThemes
                      ? "linear-gradient(135deg, rgba(78,124,106,0.9) 0%, rgba(16,185,129,0.8) 100%)"
                      : "rgba(255,255,255,0.05)",
                    color: canCreateThemes ? "#fff" : "rgba(255,255,255,0.32)",
                    fontSize: "0.74rem",
                    fontWeight: 600,
                    fontFamily: "'HarmonyOS Sans', sans-serif",
                    boxShadow: canCreateThemes ? "0 2px 10px rgba(16,185,129,0.25)" : "none",
                    transition: "all 0.15s",
                  }}
                  _hover={canCreateThemes ? { filter: "brightness(1.1)" } as any : undefined}
                >
                  {canCreateThemes ? <Plus size={14} /> : <Crown size={13} color="#fbbf24" />}
                  {t("themeStore.creator.createTitle")}
                </Box>
              )}
            </Flex>

            {/* ── My Themes tab ── */}
            {activeTab === "my-themes" && (
              <Box>
                {/* My themes list */}
                {myThemesLoading ? (
                  <Flex h="100px" align="center" justify="center" gap="8px">
                    <LoadingRing size={14} />
                    <Text style={{ fontSize: "0.75rem", fontFamily: "'HarmonyOS Sans', sans-serif", color: "rgba(255,255,255,0.28)" }}>
                      {t("themeStore.creator.loadingList")}
                    </Text>
                  </Flex>
                ) : myThemesError ? (
                  <Flex h="80px" align="center" justify="center" gap="6px">
                    <AlertCircle size={14} color="rgba(248,113,113,0.6)" />
                    <Text style={{ fontSize: "0.72rem", fontFamily: "'HarmonyOS Sans', sans-serif", color: "rgba(248,113,113,0.6)" }}>
                      {myThemesError}
                    </Text>
                  </Flex>
                ) : myThemes.length === 0 ? (
                  <Flex direction="column" align="center" py="8px" gap="16px">
                    <Box position="relative" w="56px" h="56px">
                      <MotionBox
                        position="absolute" inset="-9px" borderRadius="22px"
                        animate={{ opacity: [0.5, 0.9, 0.5], scale: [1, 1.08, 1], rotate: [0, 360] }}
                        transition={{
                          opacity: { duration: 2.4, repeat: Infinity, ease: "easeInOut" },
                          scale:   { duration: 2.4, repeat: Infinity, ease: "easeInOut" },
                          rotate:  { duration: 6,   repeat: Infinity, ease: "linear" },
                        } as any}
                        style={{
                          background: "conic-gradient(from 0deg, #f472b6, #fbbf24, #4ade80, #38bdf8, #a78bfa, #f472b6)",
                          filter: "blur(10px)",
                          pointerEvents: "none",
                        }}
                      />
                      <Box position="relative" w="56px" h="56px" style={{
                        borderRadius: "16px",
                        background: "linear-gradient(135deg, rgba(78,124,106,0.22) 0%, rgba(20,184,166,0.14) 100%)",
                        border: "1px solid rgba(78,124,106,0.35)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        <Brush size={24} color="#fff" style={{ filter: "drop-shadow(0 0 6px rgba(250,204,21,0.85))" }} />
                      </Box>
                    </Box>
                    <Box textAlign="center" px="8px">
                      <Text style={{ fontSize: "0.9rem", fontFamily: "'HarmonyOS Sans', sans-serif", fontWeight: 700, color: "rgba(255,255,255,0.88)", marginBottom: "5px" }}>
                        {t("themeStore.tabCreator")}
                      </Text>
                      <Text style={{ fontSize: "0.72rem", fontFamily: "'HarmonyOS Sans', sans-serif", color: "rgba(255,255,255,0.35)", lineHeight: 1.6 }}>
                        {t("themeStore.creator.introDesc")}
                      </Text>
                    </Box>
                    <Flex direction="column" gap="8px" w="100%">
                      {[
                        { icon: <Upload size={13} />, text: t("themeStore.creator.introStep1") },
                        { icon: <Clock size={13} />, text: t("themeStore.creator.introStep2") },
                        { icon: <Coins size={13} />, text: t("themeStore.creator.introStep3") },
                      ].map((step, i) => (
                        <Flex key={i} align="center" gap="10px" px="12px" py="9px" borderRadius="10px"
                          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                          <Flex align="center" justify="center" flexShrink={0} w="26px" h="26px" borderRadius="8px"
                            style={{ background: "rgba(78,124,106,0.15)", color: "rgba(129,190,163,0.9)" }}>
                            {step.icon}
                          </Flex>
                          <Text style={{ fontSize: "0.7rem", fontFamily: "'HarmonyOS Sans', sans-serif", color: "rgba(255,255,255,0.55)", lineHeight: 1.5 }}>
                            {step.text}
                          </Text>
                        </Flex>
                      ))}
                    </Flex>
                  </Flex>
                ) : (
                  <Box display="flex" flexDirection="column" gap="8px">
                    {myThemes.filter(t => !myThemeChildIds.has(t.id)).map((theme) => (
                      <MyThemeCard
                        key={theme.id}
                        theme={theme}
                        withdrawing={withdrawingId === theme.id}
                        onWithdraw={handleWithdraw}
                        onEdit={(theme) => { setSelectedMyTheme(null); setCreateEditTarget(theme); }}
                        onClick={() => setSelectedMyTheme(theme)}
                      />
                    ))}
                  </Box>
                )}
              </Box>
            )}

            {/* Featured carousel — only on Explore (all) tab, no active search */}
            {activeTab === "all" && featuredItems.length > 0 && !loading && !searchQuery && (
              <FeaturedCarousel
                items={featuredItems}
                t={t}
                onItemClick={(item) => { setSelectedItem(item); setPurchaseError(null); }}
              />
            )}

            {/* Source filter chips — only on tabs that show Theme items */}
            {(activeTab === "all" || activeTab === "Theme") && !loading && (
              <Flex gap="6px" mb="10px" flexWrap="wrap">
                {(["all", "Official", "Community"] as const).map((s) => {
                  const active = sourceFilter === s;
                  return (
                    <Box
                      key={s}
                      as="button"
                      border="none"
                      cursor="pointer"
                      borderRadius="20px"
                      px="10px"
                      py="4px"
                      onClick={() => setSourceFilter(s)}
                      style={{
                        background: active
                          ? s === "Official"
                            ? "rgba(251,191,36,0.2)"
                            : s === "Community"
                            ? "rgba(20,184,166,0.2)"
                            : "rgba(255,255,255,0.12)"
                          : "rgba(255,255,255,0.05)",
                        border: active
                          ? s === "Official"
                            ? "1px solid rgba(251,191,36,0.5)"
                            : s === "Community"
                            ? "1px solid rgba(20,184,166,0.45)"
                            : "1px solid rgba(255,255,255,0.2)"
                          : "1px solid rgba(255,255,255,0.08)",
                        color: active
                          ? s === "Official"
                            ? "rgba(251,191,36,0.95)"
                            : s === "Community"
                            ? "rgba(20,184,166,0.95)"
                            : "rgba(255,255,255,0.9)"
                          : "rgba(255,255,255,0.38)",
                        fontSize: "0.68rem",
                        fontFamily: "'HarmonyOS Sans', sans-serif",
                        fontWeight: active ? 700 : 400,
                        letterSpacing: "0.04em",
                        transition: "all 0.15s",
                      }}
                    >
                      {s === "all" ? t("themeStore.filterAll") : s === "Official" ? `✦ ${t("themeStore.filterOfficial")}` : `⬡ ${t("themeStore.filterCommunity")}`}
                    </Box>
                  );
                })}
              </Flex>
            )}

            {activeTab !== "my-themes" && (
              loading ? (
                <Flex h="200px" align="center" justify="center" direction="column" gap="12px">
                  <LoadingRing size={28} />
                  <Text style={{ fontSize: "0.78rem", fontFamily: "'HarmonyOS Sans', sans-serif", color: "rgba(255,255,255,0.3)", letterSpacing: "0.04em" }}>
                    {t("themeStore.loading")}
                  </Text>
                </Flex>
              ) : filteredItems.length === 0 ? (
                <Flex h="200px" align="center" justify="center" direction="column" gap={2}>
                  <Package size={28} color="rgba(255,255,255,0.15)" />
                  <Text style={{ fontSize: "0.78rem", fontFamily: "'HarmonyOS Sans', sans-serif", color: "rgba(255,255,255,0.3)" }}>
                    {t("themeStore.empty")}
                  </Text>
                </Flex>
              ) : (
                <Box display="grid" style={{ gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
                  {filteredItems.map((item) => (
                    <StoreCard
                      key={item.id}
                      item={item}
                      t={t}
                      isTrialing={item.id === trialItemId}
                      onClick={() => { setSelectedItem(item); setPurchaseError(null); }}
                    />
                  ))}
                </Box>
              )
            )}
          </Box>
        </Box>
      </Flex>

      {/* Store payment modal */}
      {paymentModalOpen && selectedItem && (
        <StorePaymentModal
          item={selectedItem}
          coinBalance={localCoinBalance}
          onClose={() => { setPaymentModalOpen(false); setPurchaseError(null); }}
          onPayWithCoins={() => { setPaymentModalOpen(false); handleBuy(); }}
          isPayingWithCoins={purchasing}
          purchaseError={purchaseError}
        />
      )}

      {/* Premium gate modal */}
      <PremiumGateModal feature={gateOpen ? "store" : null} onClose={() => setGateOpen(false)} />
    </MotionBox>
  );
}
