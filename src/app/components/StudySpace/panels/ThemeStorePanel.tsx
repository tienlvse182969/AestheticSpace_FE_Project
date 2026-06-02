import { useState, useEffect, useCallback, useMemo } from "react";
import { Box, Flex, Text } from "@chakra-ui/react";
import { motion, AnimatePresence } from "motion/react";
import {
  ShoppingBag, Star, ChevronLeft, ChevronRight, Coins, Check, Clock,
  Sparkles, Image as ImageIcon, Volume2, Wand2, Palette, LayoutGrid,
  BadgeCheck, Users, Download, Package, Crown, Zap, Search, X, Heart,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { PanelCloseBtn } from "../ui/PanelCloseBtn";
import { PremiumGateModal } from "../ui/PremiumGateModal";
import { useCenteredPanel } from "../hooks/useCenteredPanel";
import {
  aestheticStoreService,
  type StoreItem,
  type StoreItemType,
  type StoreItemSource,
  type StoreIncludes,
} from "../../../../services/aestheticStore.service";
import { useAuth } from "../../../../context/AuthContext";
import { coinService } from "../../../../services/coin.service";

const MotionBox = motion.create(Box);

const PANEL_W = 740;
const PANEL_H = 680;

interface Props {
  onClose: () => void;
  coinBalance?: number;
  onCoinBalanceChange?: (newBalance: number) => void;
  onStartTrial?: (item: StoreItem) => void;
  onTrialEnd?: () => void;
  trialItemId?: string;
  initialDetailItemId?: string;
}

type TabValue = "all" | "purchased" | "wishlist" | StoreItemType;
type SourceFilter = "all" | StoreItemSource;

const TABS: { value: TabValue; key: string }[] = [
  { value: "all",          key: "themeStore.tabDiscovery" },
  { value: "theme",        key: "themeStore.tabThemes" },
  { value: "sticker-pack", key: "themeStore.tabStickers" },
  { value: "wallpaper",    key: "themeStore.tabWallpapers" },
  { value: "sound-pack",   key: "themeStore.tabSounds" },
  { value: "effect-pack",  key: "themeStore.tabEffects" },
  { value: "purchased",    key: "themeStore.tabPurchased" },
  { value: "wishlist",     key: "themeStore.tabWishlist" },
];

function typeColor(type: StoreItemType): string {
  const map: Record<StoreItemType, string> = {
    "theme":        "#8b5cf6",
    "sticker-pack": "#ec4899",
    "wallpaper":    "#3b82f6",
    "sound-pack":   "#6366f1",
    "effect-pack":  "#22c55e",
  };
  return map[type];
}

function tabIcon(value: TabValue, size = 14): React.ReactNode {
  switch (value) {
    case "all":          return <LayoutGrid size={size} />;
    case "theme":        return <Palette size={size} />;
    case "sticker-pack": return <Sparkles size={size} />;
    case "wallpaper":    return <ImageIcon size={size} />;
    case "sound-pack":   return <Volume2 size={size} />;
    case "effect-pack":  return <Wand2 size={size} />;
    case "purchased":    return <Check size={size} />;
    case "wishlist":     return <Heart size={size} />;
    default:             return null;
  }
}

function typeLabel(type: StoreItemType, t: (k: string) => string): string {
  const map: Record<StoreItemType, string> = {
    "theme":        t("themeStore.tabThemes"),
    "sticker-pack": t("themeStore.tabStickers"),
    "wallpaper":    t("themeStore.tabWallpapers"),
    "sound-pack":   t("themeStore.tabSounds"),
    "effect-pack":  t("themeStore.tabEffects"),
  };
  return map[type];
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
  const color = typeColor(item.type);
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
          src={item.thumbnail}
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
        {/* Type badge */}
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
          {typeLabel(item.type, t)}
        </Box>
        {/* Source badge */}
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
            background: item.source === "official" ? "rgba(234,179,8,0.88)" : "rgba(20,184,166,0.88)",
            color: item.source === "official" ? "#1a1200" : "#fff",
            backdropFilter: "blur(6px)",
          }}
        >
          {item.source === "official" ? "✦ Official" : "Community"}
        </Box>
        {/* Featured badge */}
        {item.isFeatured && (
          <Box
            position="absolute"
            bottom="6px"
            left="6px"
            style={{
              padding: "2px 7px",
              borderRadius: "5px",
              fontSize: "0.55rem",
              fontFamily: "'HarmonyOS Sans', sans-serif",
              fontWeight: 700,
              letterSpacing: "0.06em",
              background: "rgba(251,191,36,0.92)",
              color: "#1a1200",
            }}
          >
            ★ FEATURED
          </Box>
        )}
        {/* Purchased overlay */}
        {item.isPurchased && (
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
        {isTrialing && !item.isPurchased && (
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
                background: `${item.accentColor ?? "#8b5cf6"}cc`,
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
            marginBottom: "2px",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {item.name}
        </Text>
        <Text
          style={{
            fontSize: "0.66rem",
            fontFamily: "'HarmonyOS Sans', sans-serif",
            color: "rgba(255,255,255,0.38)",
            marginBottom: "7px",
          }}
        >
          by {item.creatorName}
        </Text>
        <Flex align="center" justify="space-between">
          <Flex align="center" gap="4px">
            {!item.isPurchased && item.price > 0 && (
              <Coins size={11} color="#facc15" />
            )}
            <Text
              style={{
                fontSize: "0.76rem",
                fontFamily: "'HarmonyOS Sans', sans-serif",
                fontWeight: 700,
                color: item.isPurchased
                  ? "rgba(74,222,128,0.9)"
                  : item.price === 0
                  ? "rgba(94,234,212,0.9)"
                  : "#facc15",
              }}
            >
              {item.isPurchased
                ? t("themeStore.purchased")
                : item.price === 0
                ? t("themeStore.free")
                : item.price.toLocaleString("vi-VN")}
            </Text>
          </Flex>
          <Flex align="center" gap="3px">
            <Star size={9} color="rgba(251,191,36,0.7)" fill="rgba(251,191,36,0.7)" />
            <Text
              style={{
                fontSize: "0.63rem",
                fontFamily: "'HarmonyOS Sans', sans-serif",
                color: "rgba(255,255,255,0.38)",
              }}
            >
              {item.rating.toFixed(1)}
            </Text>
          </Flex>
        </Flex>
      </Box>
    </Box>
  );
}

// ── IncludeRow ─────────────────────────────────────────────────────────────

function IncludeRow({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <Flex align="center" gap="8px">
      <Box
        w="20px"
        h="20px"
        borderRadius="6px"
        display="flex"
        alignItems="center"
        justifyContent="center"
        flexShrink={0}
        style={{ background: "rgba(94,234,212,0.1)", border: "1px solid rgba(94,234,212,0.2)" }}
      >
        <Box color="rgba(94,234,212,0.8)">{icon}</Box>
      </Box>
      <Text
        style={{
          fontSize: "0.76rem",
          fontFamily: "'HarmonyOS Sans', sans-serif",
          color: "rgba(255,255,255,0.7)",
        }}
      >
        {label}
      </Text>
    </Flex>
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
}) {
  const color = typeColor(item.type);
  const canAfford = coinBalance >= item.price;
  const canBuy = canPurchase !== false;
  const inc = item.includes ?? ({} as StoreIncludes);

  const allImages = [item.thumbnail, ...(item.previewImages ?? [])];
  const [selectedImg, setSelectedImg] = useState(0);

  return (
    <MotionBox
      initial={{ x: "100%", opacity: 0 }}
      animate={{ x: 0, opacity: 1, transition: { type: "spring", stiffness: 380, damping: 32, mass: 0.9 } } as any}
      exit={{ x: "100%", opacity: 0, transition: { duration: 0.2, ease: [0.4, 0, 1, 1] } } as any}
      position="absolute"
      inset={0}
      borderRadius="16px"
      overflow="hidden"
      style={{
        background: "rgba(10,15,20,0.98)",
        zIndex: 10,
      }}
    >
      <Box h="100%" display="flex" flexDirection="column">
        {/* Main image with fade animation */}
        <Box position="relative" flexShrink={0} style={{ aspectRatio: "16/7", overflow: "hidden" }}>
          <AnimatePresence initial={false} mode="crossfade">
            <MotionBox
              key={allImages[selectedImg]}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 } as any}
              position="absolute"
              inset={0}
            >
              <img
                src={allImages[selectedImg]}
                alt={item.name}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                draggable={false}
              />
            </MotionBox>
          </AnimatePresence>
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
              {typeLabel(item.type, t)}
            </Box>
            <Box
              style={{
                padding: "3px 8px",
                borderRadius: "6px",
                fontSize: "0.6rem",
                fontFamily: "'HarmonyOS Sans', sans-serif",
                fontWeight: 700,
                background: item.source === "official" ? "rgba(234,179,8,0.9)" : "rgba(20,184,166,0.9)",
                color: item.source === "official" ? "#1a1200" : "#fff",
              }}
            >
              {item.source === "official" ? "✦ Official" : "Community"}
            </Box>
          </Flex>
        </Box>

        {/* Preview thumbnail strip */}
        {allImages.length > 1 && (
          <Flex
            flexShrink={0}
            gap="6px"
            px="16px"
            py="10px"
            style={{
              overflowX: "auto",
              scrollbarWidth: "none",
              borderBottom: "1px solid rgba(255,255,255,0.07)",
            }}
          >
            {allImages.map((img, i) => (
              <Box
                key={i}
                as="button"
                onClick={() => setSelectedImg(i)}
                flexShrink={0}
                borderRadius="7px"
                overflow="hidden"
                border="none"
                cursor="pointer"
                style={{
                  width: 88,
                  height: 54,
                  outline: selectedImg === i
                    ? `2px solid ${item.accentColor ?? "#8b5cf6"}`
                    : "2px solid transparent",
                  outlineOffset: "1px",
                  opacity: selectedImg === i ? 1 : 0.5,
                  transition: "opacity 0.15s, outline-color 0.15s",
                }}
                _hover={{ opacity: 1 } as any}
              >
                <img
                  src={img}
                  alt={`Preview ${i + 1}`}
                  style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                  draggable={false}
                />
              </Box>
            ))}
          </Flex>
        )}

        {/* Body (scrollable) */}
        <Box flex={1} overflowY="auto" px="20px" pt="4px" pb="16px">
          {/* Title + rating */}
          <Flex align="flex-start" justify="space-between" mb="4px">
            <Text
              style={{
                fontSize: "1.1rem",
                fontFamily: "'HarmonyOS Sans', sans-serif",
                fontWeight: 700,
                color: "rgba(255,255,255,0.95)",
                lineHeight: 1.3,
                flex: 1,
                paddingRight: "8px",
              }}
            >
              {item.name}
            </Text>
            <Flex align="center" gap="4px" flexShrink={0} mt="3px">
              <Star size={12} color="#fbbf24" fill="#fbbf24" />
              <Text style={{ fontSize: "0.8rem", fontFamily: "'HarmonyOS Sans', sans-serif", color: "rgba(255,255,255,0.7)", fontWeight: 600 }}>
                {item.rating.toFixed(1)}
              </Text>
            </Flex>
          </Flex>

          {/* Creator + downloads */}
          <Flex align="center" gap="12px" mb="12px">
            <Flex align="center" gap="5px">
              {item.source === "official" ? (
                <BadgeCheck size={12} color="rgba(234,179,8,0.8)" />
              ) : (
                <Users size={12} color="rgba(20,184,166,0.8)" />
              )}
              <Text style={{ fontSize: "0.72rem", fontFamily: "'HarmonyOS Sans', sans-serif", color: "rgba(255,255,255,0.45)" }}>
                {item.creatorName}
              </Text>
            </Flex>
            <Flex align="center" gap="4px">
              <Download size={11} color="rgba(255,255,255,0.3)" />
              <Text style={{ fontSize: "0.68rem", fontFamily: "'HarmonyOS Sans', sans-serif", color: "rgba(255,255,255,0.35)" }}>
                {item.downloads.toLocaleString("vi-VN")}
              </Text>
            </Flex>
          </Flex>

          {/* Description */}
          <Text
            mb="16px"
            style={{
              fontSize: "0.78rem",
              fontFamily: "'HarmonyOS Sans', sans-serif",
              color: "rgba(255,255,255,0.55)",
              lineHeight: 1.65,
            }}
          >
            {item.description}
          </Text>

          {/* Includes */}
          {item.includes && (
            <Box mb="16px">
              <Text
                mb="8px"
                style={{
                  fontSize: "0.7rem",
                  fontFamily: "'HarmonyOS Sans', sans-serif",
                  fontWeight: 700,
                  color: "rgba(255,255,255,0.4)",
                  letterSpacing: "0.08em",
                }}
              >
                {t("themeStore.detail.includes").toUpperCase()}
              </Text>
              <Flex direction="column" gap="6px">
                {inc.wallpaper && (
                  <IncludeRow icon={<ImageIcon size={11} />} label={t("themeStore.detail.wallpaper")} />
                )}
                {inc.stickerCount != null && (
                  <IncludeRow
                    icon={<Sparkles size={11} />}
                    label={t("themeStore.detail.stickers", { count: inc.stickerCount })}
                  />
                )}
                {inc.soundCount != null && (
                  <IncludeRow
                    icon={<Volume2 size={11} />}
                    label={t("themeStore.detail.sounds", { count: inc.soundCount })}
                  />
                )}
                {inc.hasEffect && (
                  <IncludeRow icon={<Wand2 size={11} />} label={t("themeStore.detail.effect")} />
                )}
                {inc.widgetStyle && (
                  <IncludeRow icon={<Package size={11} />} label={t("themeStore.detail.widgetStyle")} />
                )}
              </Flex>
            </Box>
          )}

          {/* Tags */}
          {item.tags.length > 0 && (
            <Flex flexWrap="wrap" gap="5px" mb="16px">
              {item.tags.map((tag) => (
                <Box
                  key={tag}
                  style={{
                    padding: "2px 9px",
                    borderRadius: "20px",
                    fontSize: "0.64rem",
                    fontFamily: "'HarmonyOS Sans', sans-serif",
                    color: "rgba(255,255,255,0.45)",
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.1)",
                  }}
                >
                  #{tag}
                </Box>
              ))}
            </Flex>
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
                <Coins size={14} color={item.price === 0 ? "rgba(94,234,212,0.8)" : "#facc15"} />
                <Text
                  style={{
                    fontSize: "1.1rem",
                    fontFamily: "'HarmonyOS Sans', sans-serif",
                    fontWeight: 700,
                    color: item.price === 0 ? "rgba(94,234,212,0.9)" : "#facc15",
                  }}
                >
                  {item.price === 0 ? t("themeStore.free") : item.price.toLocaleString("vi-VN")}
                </Text>
              </Flex>
            </Flex>

            {/* Action buttons */}
            <Flex align="center" gap="8px" flexShrink={0}>
              {item.isPurchased ? (
                <Flex
                  align="center"
                  gap="6px"
                  px="18px"
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
              ) : (
                <>
                  {/* Try button — show when no active trial; show disabled state when trialing this item */}
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
                        background: `${item.accentColor ?? "#8b5cf6"}18`,
                        border: `1px solid ${item.accentColor ?? "#8b5cf6"}40`,
                        color: item.accentColor ?? "#a78bfa",
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
                        style={{
                          background: item.accentColor ?? "#8b5cf6",
                          animation: "pulse 1.5s ease-in-out infinite",
                        }}
                      />
                      {t("themeStore.trial.trying")}
                    </Flex>
                  )}
                  {/* Buy button — premium users; freemium gets upgrade CTA */}
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
  onItemClick,
}: {
  items: StoreItem[];
  t: (k: string, opts?: Record<string, unknown>) => string;
  onItemClick: (item: StoreItem) => void;
}) {
  const [idx, setIdx] = useState(0);
  const [direction, setDirection] = useState(1);

  const goTo = useCallback((newIdx: number, dir: number) => {
    setDirection(dir);
    setIdx(newIdx);
  }, []);

  // Auto-advance forward every 5 s
  useEffect(() => {
    if (items.length <= 1) return;
    const timer = setTimeout(() => goTo((idx + 1) % items.length, 1), 5000);
    return () => clearTimeout(timer);
  }, [idx, items.length, goTo]);

  const item = items[idx];
  if (!item) return null;

  return (
    <Box mb="10px">
      <Box
        position="relative"
        borderRadius="12px"
        overflow="hidden"
        style={{ height: 150 }}
      >
        {/* ── Animated slide (content only) ── */}
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
            {/* Thumbnail */}
            <img
              src={item.thumbnail}
              alt={item.name}
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
              draggable={false}
            />
            {/* Gradient overlays */}
            <Box position="absolute" inset={0} style={{ background: "linear-gradient(90deg, rgba(5,8,14,0.92) 0%, rgba(5,8,14,0.55) 55%, rgba(5,8,14,0.1) 100%)" }} />
            <Box position="absolute" bottom={0} left={0} right={0} h="50px" style={{ background: "linear-gradient(transparent, rgba(5,8,14,0.75))" }} />

            {/* Info */}
            <Flex position="absolute" inset={0} px="14px" py="11px" direction="column" justify="space-between">
              {/* Top: badges + stats */}
              <Flex align="center" justify="space-between">
                <Flex gap="5px">
                  {item.isFeatured && (
                    <Box style={{ padding: "2px 7px", borderRadius: "5px", fontSize: "0.55rem", fontFamily: "'HarmonyOS Sans', sans-serif", fontWeight: 700, letterSpacing: "0.06em", background: "rgba(251,191,36,0.92)", color: "#1a1200" }}>
                      ★ FEATURED
                    </Box>
                  )}
                  <Box style={{ padding: "2px 7px", borderRadius: "5px", fontSize: "0.55rem", fontFamily: "'HarmonyOS Sans', sans-serif", fontWeight: 700, background: item.source === "official" ? "rgba(234,179,8,0.88)" : "rgba(20,184,166,0.88)", color: item.source === "official" ? "#1a1200" : "#fff" }}>
                    {item.source === "official" ? "✦ Official" : "Community"}
                  </Box>
                </Flex>
                <Flex align="center" gap="10px">
                  <Flex align="center" gap="3px">
                    <Star size={10} color="#fbbf24" fill="#fbbf24" />
                    <Text style={{ fontSize: "0.7rem", fontFamily: "'HarmonyOS Sans', sans-serif", fontWeight: 700, color: "#fbbf24" }}>{item.rating.toFixed(1)}</Text>
                  </Flex>
                  <Flex align="center" gap="3px">
                    <Download size={10} color="rgba(255,255,255,0.4)" />
                    <Text style={{ fontSize: "0.68rem", fontFamily: "'HarmonyOS Sans', sans-serif", color: "rgba(255,255,255,0.4)" }}>{item.downloads.toLocaleString("vi-VN")}</Text>
                  </Flex>
                </Flex>
              </Flex>

              {/* Bottom: name + creator + price */}
              <Box>
                <Text style={{ fontSize: "0.98rem", fontFamily: "'HarmonyOS Sans', sans-serif", fontWeight: 700, color: "#fff", lineHeight: 1.2, marginBottom: "2px" }}>
                  {item.name}
                </Text>
                <Flex align="center" justify="space-between">
                  <Text style={{ fontSize: "0.67rem", fontFamily: "'HarmonyOS Sans', sans-serif", color: "rgba(255,255,255,0.4)" }}>
                    by {item.creatorName}
                  </Text>
                  <Flex align="center" gap="4px">
                    <Coins size={11} color="#facc15" />
                    <Text style={{ fontSize: "0.8rem", fontFamily: "'HarmonyOS Sans', sans-serif", fontWeight: 700, color: "#facc15" }}>
                      {item.price.toLocaleString("vi-VN")}
                    </Text>
                  </Flex>
                </Flex>
              </Box>
            </Flex>
          </MotionBox>
        </AnimatePresence>

        {/* ── Static controls (stay on top, don't animate) ── */}
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

        {/* Dot indicators */}
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
  trialItemId,
  initialDetailItemId,
}: Props) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { x, y, ref } = useCenteredPanel(PANEL_W, PANEL_H);

  const canPurchase = user?.accountTier !== "Free";

  const [items, setItems]               = useState<StoreItem[]>([]);
  const [gateOpen, setGateOpen]         = useState(false);
  const [loading, setLoading]           = useState(true);
  const [activeTab, setActiveTab]             = useState<TabValue>("all");
  const [sourceFilter, setSourceFilter]       = useState<SourceFilter>("all");
  const [purchasedTypeFilter, setPurchasedTypeFilter] = useState<"all" | StoreItemType>("all");
  const [searchQuery, setSearchQuery]               = useState("");
  const [wishlistIds, setWishlistIds]               = useState<Set<string>>(new Set());
  const [selectedItem, setSelectedItem] = useState<StoreItem | null>(null);
  const [purchasing, setPurchasing]     = useState(false);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);
  const [localCoinBalance, setLocalCoinBalance] = useState<number>(coinBalanceProp ?? 0);

  // Sync coinBalance prop
  useEffect(() => {
    if (coinBalanceProp != null) setLocalCoinBalance(coinBalanceProp);
  }, [coinBalanceProp]);

  // Fetch coin balance if not provided
  useEffect(() => {
    if (coinBalanceProp == null && user) {
      coinService.getBalance(user.email).then((d) => setLocalCoinBalance(d.balance));
    }
  }, [coinBalanceProp, user]);

  // Fetch store items
  useEffect(() => {
    setLoading(true);
    aestheticStoreService.getItems().then((data) => {
      setItems(data);
      setLoading(false);
    });
  }, []);

  // Auto-open detail view when coming from trial banner "Buy now"
  useEffect(() => {
    if (!initialDetailItemId || items.length === 0) return;
    const item = items.find((i) => i.id === initialDetailItemId);
    if (item) setSelectedItem(item);
  }, [initialDetailItemId, items]);

  const featuredItems = useMemo(() =>
    [...items]
      .filter((i) => i.type === "theme")
      .sort((a, b) => {
        const scoreA = a.rating * 1000 + a.downloads / 100;
        const scoreB = b.rating * 1000 + b.downloads / 100;
        return scoreB - scoreA;
      })
      .slice(0, 3),
  [items]);

  const filteredItems = items.filter((item) => {
    if (searchQuery && !item.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (activeTab === "wishlist") return wishlistIds.has(item.id);
    if (activeTab === "purchased") {
      if (!item.isPurchased) return false;
      if (purchasedTypeFilter !== "all" && item.type !== purchasedTypeFilter) return false;
      if (sourceFilter !== "all" && item.source !== sourceFilter) return false;
      return true;
    }
    if (activeTab !== "all" && item.type !== activeTab) return false;
    if (sourceFilter !== "all" && item.source !== sourceFilter) return false;
    return true;
  });

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
      const result = await aestheticStoreService.purchase(selectedItem.id, localCoinBalance);
      setLocalCoinBalance(result.newBalance);
      onCoinBalanceChange?.(result.newBalance);
      // Update item in list
      setItems((prev) =>
        prev.map((i) => (i.id === selectedItem.id ? { ...i, isPurchased: true } : i))
      );
      setSelectedItem((prev) => (prev ? { ...prev, isPurchased: true } : null));
      // If this item was being trialed, end the trial
      if (selectedItem.id === trialItemId) onTrialEnd?.();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Purchase failed";
      setPurchaseError(
        msg === "Insufficient coins"
          ? t("themeStore.detail.notEnoughCoins")
          : msg
      );
    } finally {
      setPurchasing(false);
    }
  }, [selectedItem, localCoinBalance, onCoinBalanceChange, t]);

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

          {/* Browse */}
          <Text px="8px" mb="4px" style={{ fontSize: "0.58rem", fontFamily: "'HarmonyOS Sans', sans-serif", fontWeight: 700, color: "rgba(255,255,255,0.22)", letterSpacing: "0.1em" }}>
            {t("themeStore.sidebarBrowse")}
          </Text>
          {TABS.filter((tab) => tab.value !== "purchased" && tab.value !== "wishlist").map((tab) => {
            const active = activeTab === tab.value;
            const color = tab.value !== "all" ? typeColor(tab.value as StoreItemType) : undefined;
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
                onClick={() => { setActiveTab(tab.value); setPurchasedTypeFilter("all"); }}
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

          {/* Library */}
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

          {/* Filter bar — hidden on wishlist tab */}
          {activeTab !== "wishlist" && (
          <Box px="12px" pt="10px" pb="8px" flexShrink={0} style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            {/* Filter pills */}
            <Flex gap="5px" style={{ overflowX: "auto", scrollbarWidth: "none" }}>
              {activeTab !== "purchased"
                ? (["all", "official", "community"] as SourceFilter[]).map((src) => {
                    const active = sourceFilter === src;
                    const label = src === "all" ? t("themeStore.filterAll") : src === "official" ? t("themeStore.filterOfficial") : t("themeStore.filterCommunity");
                    return (
                      <Box
                        key={src}
                        as="button"
                        onClick={() => setSourceFilter(src)}
                        display="flex"
                        alignItems="center"
                        gap="4px"
                        px="10px"
                        py="4px"
                        borderRadius="20px"
                        border="none"
                        cursor="pointer"
                        flexShrink={0}
                        style={{
                          fontFamily: "'HarmonyOS Sans', sans-serif",
                          fontSize: "0.68rem",
                          fontWeight: active ? 600 : 400,
                          color: active ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.4)",
                          background: active
                            ? src === "official" ? "rgba(234,179,8,0.18)" : src === "community" ? "rgba(20,184,166,0.18)" : "rgba(255,255,255,0.1)"
                            : "rgba(255,255,255,0.04)",
                          border: active
                            ? src === "official" ? "1px solid rgba(234,179,8,0.35)" : src === "community" ? "1px solid rgba(20,184,166,0.35)" : "1px solid rgba(255,255,255,0.18)"
                            : "1px solid rgba(255,255,255,0.08)",
                          transition: "all 0.15s",
                        }}
                      >
                        {src === "official" && <BadgeCheck size={10} />}
                        {src === "community" && <Users size={10} />}
                        {label}
                      </Box>
                    );
                  })
                : (["all", "theme", "sticker-pack", "wallpaper", "sound-pack", "effect-pack"] as const).map((type) => {
                    const active = purchasedTypeFilter === type;
                    const color = type !== "all" ? typeColor(type as StoreItemType) : undefined;
                    const label = type === "all" ? t("themeStore.tabAll") : typeLabel(type as StoreItemType, t);
                    return (
                      <Box
                        key={type}
                        as="button"
                        onClick={() => setPurchasedTypeFilter(type)}
                        px="10px"
                        py="4px"
                        borderRadius="20px"
                        border="none"
                        cursor="pointer"
                        flexShrink={0}
                        style={{
                          fontFamily: "'HarmonyOS Sans', sans-serif",
                          fontSize: "0.68rem",
                          fontWeight: active ? 700 : 400,
                          color: active ? "#fff" : "rgba(255,255,255,0.4)",
                          background: active && color ? `${color}22` : active ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.04)",
                          border: active && color ? `1px solid ${color}55` : active ? "1px solid rgba(255,255,255,0.2)" : "1px solid rgba(255,255,255,0.08)",
                          transition: "all 0.15s",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {label}
                      </Box>
                    );
                  })}
            </Flex>
          </Box>
          )}

          {/* Scrollable grid */}
          <Box
            flex={1}
            overflowY="auto"
            px="12px"
            pt="12px"
            pb="12px"
            style={{ minHeight: 0, scrollbarWidth: "thin", scrollbarColor: "rgba(255,255,255,0.12) transparent" }}
          >
          {/* Featured carousel — only on Discovery tab with All Sources filter */}
          {activeTab === "all" && sourceFilter === "all" && featuredItems.length > 0 && !loading && !searchQuery && (
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
              onStartTrial && !selectedItem.isPurchased
                ? () => { onStartTrial(selectedItem); onClose(); }
                : undefined
            }
            isTrialing={selectedItem.id === trialItemId}
            hasActiveTrial={!!trialItemId}
            canPurchase={canPurchase}
            onLockedBuy={() => setGateOpen(true)}
            isWishlisted={wishlistIds.has(selectedItem.id)}
            onToggleWishlist={() => toggleWishlist(selectedItem.id)}
          />
        )}
      </AnimatePresence>

      {/* Premium gate modal — fixed position, escapes overflow:hidden */}
      <PremiumGateModal feature={gateOpen ? "store" : null} onClose={() => setGateOpen(false)} />
    </MotionBox>
  );
}
