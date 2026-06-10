import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Box, Flex, Text } from "@chakra-ui/react";
import { motion, AnimatePresence } from "motion/react";
import {
  ShoppingBag, ChevronLeft, ChevronRight, Coins, Check, Clock,
  Sparkles, Image as ImageIcon, Volume2, Wand2, Palette, LayoutGrid,
  Crown, Search, X, Heart, Package, Play, Pause, PlusCircle,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { PanelCloseBtn } from "../ui/PanelCloseBtn";
import { PremiumGateModal } from "../ui/PremiumGateModal";
import { useCenteredPanel } from "../hooks/useCenteredPanel";
import {
  aestheticStoreService,
  type StoreItem,
  type StoreCategory,
} from "../../../../services/aestheticStore.service";
import { useAuth } from "../../../../context/AuthContext";
import { coinService } from "../../../../services/coin.service";

const MotionBox = motion.create(Box);

const PANEL_W = 740;
const PANEL_H = 680;

const PLACEHOLDER_IMG = "https://placehold.co/400x240/1a1a2e/888888?text=No+Preview";

interface Props {
  onClose: () => void;
  coinBalance?: number;
  onCoinBalanceChange?: (newBalance: number) => void;
  onStartTrial?: (item: StoreItem) => void;
  onTrialEnd?: () => void;
  onApplyItem?: (item: StoreItem) => void;
  trialItemId?: string;
  initialDetailItemId?: string;
}

type TabValue = "all" | "purchased" | "wishlist" | StoreCategory;

const TABS: { value: TabValue; key: string }[] = [
  { value: "all",          key: "themeStore.tabDiscovery" },
  { value: "Theme",        key: "themeStore.tabThemes" },
  { value: "Background",   key: "themeStore.tabWallpapers" },
  { value: "Sticker",      key: "themeStore.tabStickers" },
  { value: "Effect",       key: "themeStore.tabEffects" },
  { value: "AmbientSound", key: "themeStore.tabSounds" },
  { value: "purchased",    key: "themeStore.tabPurchased" },
  { value: "wishlist",     key: "themeStore.tabWishlist" },
];

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
    case "Sticker":      return <Sparkles size={size} />;
    case "AmbientSound": return <Volume2 size={size} />;
    case "Effect":       return <Wand2 size={size} />;
    case "purchased":    return <Check size={size} />;
    case "wishlist":     return <Heart size={size} />;
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
          src={item.assetUrl ?? PLACEHOLDER_IMG}
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
        {/* Premium badge */}
        {item.isPremium && (
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
              letterSpacing: "0.04em",
              background: "rgba(251,191,36,0.88)",
              color: "#1a1200",
              backdropFilter: "blur(6px)",
            }}
          >
            ✦ Premium
          </Box>
        )}
        {/* Purchased overlay */}
        {isOwned && (
          <Flex
            position="absolute"
            inset={0}
            align="center"
            justify="center"
            style={{ background: "rgba(0,0,0,0.4)" }}
          >
            <Box
              style={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                background: "rgba(74,222,128,0.95)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 0 12px rgba(74,222,128,0.4)",
              }}
            >
              <Check size={14} color="#fff" />
            </Box>
          </Flex>
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
  coinBalance,
  purchasing,
  purchaseError,
  onBack,
  onBuy,
  onStartTrial,
  isTrialing,
  hasActiveTrial,
  canPurchase,
  onLockedBuy,
  isWishlisted,
  onToggleWishlist,
  onApplyItem,
}: {
  item: StoreItem;
  t: (k: string, opts?: Record<string, unknown>) => string;
  coinBalance: number;
  purchasing: boolean;
  purchaseError: string | null;
  onBack: () => void;
  onBuy: () => void;
  onStartTrial?: () => void;
  isTrialing?: boolean;
  hasActiveTrial?: boolean;
  canPurchase?: boolean;
  onLockedBuy?: () => void;
  isWishlisted?: boolean;
  onToggleWishlist?: () => void;
  onApplyItem?: (item: StoreItem) => void;
}) {
  const color = typeColor(item.category);
  const isOwned = item.isOwned === true;
  const price = item.coinPrice;
  const canAfford = price == null || price === 0 || coinBalance >= price;
  const canBuy = canPurchase !== false;

  const PREVIEW_SEC = 10;
  const audioRef        = useRef<HTMLAudioElement | null>(null);
  const previewStartRef = useRef(0);
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

  return (
    <MotionBox
      initial={{ x: "100%", opacity: 0 }}
      animate={{ x: 0, opacity: 1, transition: { type: "spring", stiffness: 380, damping: 32, mass: 0.9 } } as any}
      exit={{ x: "100%", opacity: 0, transition: { duration: 0.2, ease: [0.4, 0, 1, 1] } } as any}
      position="absolute"
      inset={0}
      borderRadius="16px"
      overflow="hidden"
      style={{ background: "rgba(10,15,20,0.98)", zIndex: 10 }}
    >
      <Box h="100%" display="flex" flexDirection="column">
        {/* Main image */}
        <Box position="relative" flexShrink={0} style={{ aspectRatio: "16/7", overflow: "hidden" }}>
          {item.category === "AmbientSound" ? (
            <Flex w="100%" h="100%" align="center" justify="center"
              style={{ background: "linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)" }}>
              <Volume2 size={52} color="rgba(255,255,255,0.12)" />
            </Flex>
          ) : (
            <img
              src={item.assetUrl ?? PLACEHOLDER_IMG}
              alt={item.name}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
              draggable={false}
            />
          )}
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
          <Flex position="absolute" top="10px" right="10px" gap={1}>
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
            {item.isPremium && (
              <Box
                style={{
                  padding: "3px 8px",
                  borderRadius: "6px",
                  fontSize: "0.6rem",
                  fontFamily: "'HarmonyOS Sans', sans-serif",
                  fontWeight: 700,
                  background: "rgba(251,191,36,0.9)",
                  color: "#1a1200",
                }}
              >
                ✦ Premium
              </Box>
            )}
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
        </Box>

        {/* Footer: price + buy */}
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
          <Flex align="center" justify="space-between" gap="10px">
            {/* Price */}
            <Flex direction="column" gap="2px" flexShrink={0}>
              <Text style={{ fontSize: "0.65rem", fontFamily: "'HarmonyOS Sans', sans-serif", color: "rgba(255,255,255,0.35)" }}>
                {t("themeStore.coins")}
              </Text>
              <Flex align="center" gap="5px">
                <Coins size={14} color={price == null || price === 0 ? "rgba(94,234,212,0.8)" : "#facc15"} />
                <Text
                  style={{
                    fontSize: "1.1rem",
                    fontFamily: "'HarmonyOS Sans', sans-serif",
                    fontWeight: 700,
                    color: price == null || price === 0 ? "rgba(94,234,212,0.9)" : "#facc15",
                  }}
                >
                  {price == null || price === 0 ? t("themeStore.free") : price.toLocaleString("vi-VN")}
                </Text>
              </Flex>
            </Flex>

            {/* Action buttons */}
            <Flex align="center" gap="8px" flexShrink={0}>
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
                      onClick={() => onApplyItem(item)}
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
                          : "linear-gradient(135deg, rgba(59,130,246,0.9), rgba(6,182,212,0.85))",
                        color: "#fff",
                        fontSize: "0.8rem",
                        fontFamily: "'HarmonyOS Sans', sans-serif",
                        fontWeight: 600,
                        boxShadow: item.category === "Sticker"
                          ? "0 4px 14px rgba(236,72,153,0.3)"
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
                  {/* Buy button */}
                  {canBuy ? (
                    <Box
                      as="button"
                      onClick={onBuy}
                      disabled={purchasing || !canAfford}
                      px="16px"
                      py="9px"
                      borderRadius="10px"
                      border="none"
                      cursor={purchasing || !canAfford ? "not-allowed" : "pointer"}
                      display="flex"
                      alignItems="center"
                      gap="7px"
                      style={{
                        background: !canAfford
                          ? "rgba(255,255,255,0.06)"
                          : purchasing
                          ? "rgba(139,92,246,0.4)"
                          : "linear-gradient(135deg, rgba(139,92,246,0.9) 0%, rgba(59,130,246,0.9) 100%)",
                        color: !canAfford ? "rgba(255,255,255,0.3)" : "#fff",
                        fontSize: "0.8rem",
                        fontFamily: "'HarmonyOS Sans', sans-serif",
                        fontWeight: 600,
                        transition: "all 0.18s",
                        boxShadow: canAfford && !purchasing ? "0 4px 14px rgba(139,92,246,0.35)" : "none",
                        opacity: purchasing ? 0.7 : 1,
                        whiteSpace: "nowrap",
                      }}
                      _hover={canAfford && !purchasing ? { filter: "brightness(1.1)", transform: "translateY(-1px)" } as any : {}}
                    >
                      <ShoppingBag size={13} />
                      {!canAfford
                        ? t("themeStore.detail.notEnoughCoins")
                        : purchasing
                        ? "..."
                        : t("themeStore.detail.buyNow")}
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
          </Flex>
        </Box>
      </Box>
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
              <Flex align="center" justify="flex-end">
                {item.isPremium && (
                  <Box style={{ padding: "2px 7px", borderRadius: "5px", fontSize: "0.55rem", fontFamily: "'HarmonyOS Sans', sans-serif", fontWeight: 700, letterSpacing: "0.06em", background: "rgba(251,191,36,0.92)", color: "#1a1200" }}>
                    ✦ Premium
                  </Box>
                )}
              </Flex>
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
}: Props) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { x, y, ref } = useCenteredPanel(PANEL_W, PANEL_H);

  const canPurchase = user?.accountTier !== "Free";

  const [items, setItems]               = useState<StoreItem[]>([]);
  const [inventoryItems, setInventoryItems] = useState<StoreItem[]>([]);
  const [gateOpen, setGateOpen]         = useState(false);
  const [itemsLoading, setItemsLoading] = useState(true);
  const [inventoryLoading, setInventoryLoading] = useState(false);
  const [activeTab, setActiveTab]       = useState<TabValue>("all");
  const [searchQuery, setSearchQuery]   = useState("");
  const [wishlistIds, setWishlistIds]   = useState<Set<string>>(new Set());
  const [selectedItem, setSelectedItem] = useState<StoreItem | null>(null);
  const [purchasing, setPurchasing]     = useState(false);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);
  const [localCoinBalance, setLocalCoinBalance] = useState<number>(coinBalanceProp ?? 0);

  const loading = itemsLoading || inventoryLoading;

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

  // Fetch all store items on mount
  useEffect(() => {
    setItemsLoading(true);
    aestheticStoreService.getItems()
      .then((data) => setItems(data))
      .catch(() => {})
      .finally(() => setItemsLoading(false));
  }, []);

  // Fetch inventory when switching to purchased tab
  useEffect(() => {
    if (activeTab !== "purchased") return;
    setInventoryLoading(true);
    aestheticStoreService.getInventory()
      .then((inv) => {
        setInventoryItems(inv.map((i) => ({
          id: i.storeItemId,
          category: i.category,
          name: i.name,
          description: i.description,
          assetUrl: i.assetUrl,
          isPremium: i.isPremium,
          coinPrice: null,
          realMoneyPriceVnd: null,
          isActive: true,
          isOwned: true,
          canBuyWithCoins: false,
          canBuyWithMoney: false,
        })));
      })
      .catch(() => {})
      .finally(() => setInventoryLoading(false));
  }, [activeTab]);

  // Auto-open detail view from trial banner "Buy now"
  useEffect(() => {
    if (!initialDetailItemId || items.length === 0) return;
    const item = items.find((i) => i.id === initialDetailItemId);
    if (item) setSelectedItem(item);
  }, [initialDetailItemId, items]);

  const featuredItems = useMemo(() =>
    items.filter((i) => i.category === "Theme").slice(0, 3),
  [items]);

  const filteredItems = useMemo(() => {
    let source: StoreItem[];
    if (activeTab === "purchased") source = inventoryItems;
    else if (activeTab === "wishlist") source = items.filter((i) => wishlistIds.has(i.id));
    else if (activeTab === "all") source = items;
    else source = items.filter((i) => i.category === activeTab);

    if (!searchQuery) return source;
    return source.filter((i) => i.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [activeTab, items, inventoryItems, wishlistIds, searchQuery]);

  const toggleWishlist = useCallback((itemId: string) => {
    setWishlistIds((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) next.delete(itemId);
      else next.add(itemId);
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
        borderRadius: "16px",
        background: "rgba(10,15,20,0.82)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
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
        px="16px"
        py="12px"
        style={{ paddingRight: "52px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}
      >
        <PanelCloseBtn onClose={onClose} />
        <Flex align="center" justify="space-between">
          <Flex align="center" gap="8px">
            <Box w="28px" h="28px" borderRadius="8px" display="flex" alignItems="center" justifyContent="center"
              style={{ background: "linear-gradient(135deg, rgba(139,92,246,0.25) 0%, rgba(59,130,246,0.25) 100%)", border: "1px solid rgba(139,92,246,0.3)" }}
            >
              <ShoppingBag size={14} color="rgba(167,139,250,0.9)" />
            </Box>
            <Text style={{ fontSize: "1.25rem", color: "rgba(255,255,255,0.92)", letterSpacing: "-0.01em" }}>
              <span style={{ fontFamily: "'Manrope', sans-serif" }}>Aēsthetic</span>
              <span style={{ fontFamily: "'HarmonyOS Sans', sans-serif" }}> Store</span>
            </Text>
          </Flex>
          {canPurchase ? (
            <Flex align="center" gap="5px" px="10px" py="4px" borderRadius="20px"
              style={{ background: "rgba(250,204,21,0.1)", border: "1px solid rgba(250,204,21,0.22)" }}
            >
              <Coins size={12} color="#facc15" />
              <Text style={{ fontSize: "0.72rem", fontFamily: "'HarmonyOS Sans', sans-serif", fontWeight: 700, color: "#facc15" }}>
                {localCoinBalance.toLocaleString("vi-VN")}
              </Text>
            </Flex>
          ) : (
            <Flex align="center" gap="5px" px="10px" py="4px" borderRadius="20px"
              style={{ background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.25)" }}
            >
              <Crown size={11} color="#fbbf24" />
              <Text style={{ fontSize: "0.68rem", fontFamily: "'HarmonyOS Sans', sans-serif", fontWeight: 600, color: "#fbbf24" }}>
                Premium
              </Text>
            </Flex>
          )}
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
            <Box
              as="input"
              flex={1}
              value={searchQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
              placeholder={t("themeStore.searchPlaceholder")}
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
                onClick={() => setActiveTab(tab.value)}
                style={{
                  background: active ? "rgba(255,255,255,0.1)" : "transparent",
                  color: active ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.45)",
                  fontSize: "0.76rem",
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
          {(["purchased", "wishlist"] as const).map((val) => {
            const tab = TABS.find((tb) => tb.value === val)!;
            const active = activeTab === val;
            const isPurchased = val === "purchased";
            const activeColor = isPurchased ? "rgba(74,222,128,0.85)" : "rgba(251,113,133,0.9)";
            const count = val === "wishlist" ? wishlistIds.size : undefined;
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
                onClick={() => setActiveTab(val)}
                style={{
                  background: active ? "rgba(255,255,255,0.1)" : "transparent",
                  color: active ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.45)",
                  fontSize: "0.76rem",
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
        </Box>

        {/* ── Right content ── */}
        <Box flex={1} display="flex" flexDirection="column" style={{ minWidth: 0 }}>
          <Box
            flex={1}
            overflowY="auto"
            px="12px"
            pt="12px"
            pb="12px"
            style={{ minHeight: 0, scrollbarWidth: "thin", scrollbarColor: "rgba(255,255,255,0.12) transparent" }}
          >
            {/* Featured carousel — only on Explore (all) tab, no active search */}
            {activeTab === "all" && featuredItems.length > 0 && !loading && !searchQuery && (
              <FeaturedCarousel
                items={featuredItems}
                t={t}
                onItemClick={(item) => { setSelectedItem(item); setPurchaseError(null); }}
              />
            )}

            {loading ? (
              <Flex h="200px" align="center" justify="center">
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
            )}
          </Box>
        </Box>
      </Flex>

      {/* ── Detail view overlay ── */}
      <AnimatePresence>
        {selectedItem && (
          <ItemDetailView
            key={selectedItem.id}
            item={selectedItem}
            t={t}
            coinBalance={localCoinBalance}
            purchasing={purchasing}
            purchaseError={purchaseError}
            onBack={() => { setSelectedItem(null); setPurchaseError(null); }}
            onBuy={handleBuy}
            onStartTrial={
              onStartTrial && !selectedItem.isOwned
                && selectedItem.category !== "Sticker"
                && selectedItem.category !== "AmbientSound"
                ? () => { onStartTrial(selectedItem); onClose(); }
                : undefined
            }
            isTrialing={selectedItem.id === trialItemId}
            hasActiveTrial={!!trialItemId}
            canPurchase={canPurchase}
            onLockedBuy={() => setGateOpen(true)}
            isWishlisted={wishlistIds.has(selectedItem.id)}
            onToggleWishlist={() => toggleWishlist(selectedItem.id)}
            onApplyItem={onApplyItem}
          />
        )}
      </AnimatePresence>

      {/* Premium gate modal */}
      <PremiumGateModal feature={gateOpen ? "store" : null} onClose={() => setGateOpen(false)} />
    </MotionBox>
  );
}
