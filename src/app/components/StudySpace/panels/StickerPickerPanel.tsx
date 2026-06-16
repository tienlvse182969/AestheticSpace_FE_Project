import { useState, useEffect, useCallback } from "react";
import { Box, Flex, Text, Spinner } from "@chakra-ui/react";
import { motion } from "motion/react";
import { ShoppingBag, Sparkles, Construction } from "lucide-react";
import { useTranslation } from "react-i18next";
import { PanelCloseBtn } from "../ui/PanelCloseBtn";
import { useCenteredPanel } from "../hooks/useCenteredPanel";
import {
  adminAssetsService,
  type AssetDto,
} from "../../../../services/admin/assets.admin.service";
import {
  aestheticStoreService,
  type InventoryItem,
} from "../../../../services/aestheticStore.service";

const MotionBox = motion.create(Box);

const PANEL_W = 604;
const PANEL_H = 520;

interface StickerPickerPanelProps {
  onPlace: (src: string) => void;
  onClose: () => void;
}

type TabValue = "default" | "purchased";

export function StickerPickerPanel({ onPlace, onClose }: StickerPickerPanelProps) {
  const { t } = useTranslation();
  const { x, y, ref } = useCenteredPanel(PANEL_W, PANEL_H);

  const [tab, setTab] = useState<TabValue>("default");

  // Default stickers (from assets)
  const [stickers, setStickers] = useState<AssetDto[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState<string | null>(null);

  // Purchased stickers (from store inventory)
  const [purchased,        setPurchased]        = useState<InventoryItem[]>([]);
  const [purchasedLoading, setPurchasedLoading] = useState(false);
  const [purchasedError,   setPurchasedError]   = useState<string | null>(null);

  const fetchStickers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await adminAssetsService.getAssets("Sticker");
      setStickers(result);
    } catch {
      setError("Failed to load stickers");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPurchased = useCallback(async () => {
    setPurchasedLoading(true);
    setPurchasedError(null);
    try {
      const items = await aestheticStoreService.getInventory();
      setPurchased(items.filter(i => i.category === "Sticker"));
    } catch {
      setPurchasedError("Failed to load purchased stickers");
    } finally {
      setPurchasedLoading(false);
    }
  }, []);

  useEffect(() => { fetchStickers(); }, [fetchStickers]);

  useEffect(() => {
    if (tab === "purchased") fetchPurchased();
  }, [tab, fetchPurchased]);

  const FONT = "'HarmonyOS Sans', sans-serif";

  const tabStyle = (active: boolean) => ({
    padding: "6px 14px",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "0.76rem",
    fontFamily: FONT,
    fontWeight: active ? 600 : 400,
    color: active ? "#fff" : "rgba(255,255,255,0.45)",
    background: active ? "rgba(255,255,255,0.1)" : "transparent",
    border: "none",
    transition: "all 0.15s",
    display: "flex",
    alignItems: "center",
    gap: "6px",
  } as React.CSSProperties);

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
        borderRadius: "14px",
        background: "rgba(12,18,22,0.75)",
        backdropFilter: "blur(18px)",
        WebkitBackdropFilter: "blur(18px)",
        border: "1px solid rgba(255,255,255,0.1)",
        boxShadow: "0 24px 80px rgba(0,0,0,0.75), 0 0 0 1px rgba(255,255,255,0.08)",
        overflow: "hidden",
      }}
    >
      <Box position="relative" style={{ padding: "20px 20px 18px", height: "100%", display: "flex", flexDirection: "column" }}>
        <PanelCloseBtn onClose={onClose} />

        {/* Header */}
        <Text mb={3} style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.35)", letterSpacing: "0.1em", fontFamily: FONT }}>
          {t("stickerPicker.title")}
        </Text>

        {/* Tabs */}
        <Flex mb={3} gap={1} style={{ borderBottom: "1px solid rgba(255,255,255,0.07)", paddingBottom: "10px" }}>
          <Box
            as="button"
            style={tabStyle(tab === "default")}
            onClick={() => setTab("default")}
          >
            <Sparkles size={13} />
            {t("stickerPicker.tabDefault")}
          </Box>
          <Box
            as="button"
            style={tabStyle(tab === "purchased")}
            onClick={() => setTab("purchased")}
          >
            <ShoppingBag size={13} />
            {t("stickerPicker.tabPurchased")}
          </Box>
        </Flex>

        {/* Hint */}
        {tab === "default" && (
          <Text mb={2} style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.4)", fontFamily: FONT }}>
            {t("stickerPicker.hint")}
          </Text>
        )}

        {/* Content */}
        <Box style={{ flex: 1, overflowY: "auto", overflowX: "hidden", marginRight: -4, paddingRight: 4 }}>
          {tab === "default" && (
            <>
              {loading ? (
                <Flex align="center" justify="center" style={{ height: "100%" }} gap={3}>
                  <Spinner size="sm" style={{ color: "rgba(255,255,255,0.4)" }} />
                  <Text style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.3)", fontFamily: FONT }}>
                    Loading…
                  </Text>
                </Flex>
              ) : error ? (
                <Flex direction="column" align="center" justify="center" style={{ height: "100%" }} gap={3}>
                  <Text style={{ fontSize: "0.78rem", color: "rgba(248,113,113,0.75)", fontFamily: FONT }}>
                    {error}
                  </Text>
                  <Box
                    as="button"
                    onClick={fetchStickers}
                    style={{
                      background: "transparent",
                      border: "1px solid rgba(255,255,255,0.15)",
                      borderRadius: 8, padding: "5px 14px",
                      cursor: "pointer", fontSize: "0.75rem",
                      color: "rgba(255,255,255,0.5)",
                      fontFamily: FONT,
                    }}
                  >
                    Retry
                  </Box>
                </Flex>
              ) : stickers.length === 0 ? (
                <Flex align="center" justify="center" style={{ height: "100%" }}>
                  <Text style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.28)", fontFamily: FONT }}>
                    No stickers found
                  </Text>
                </Flex>
              ) : (
                <Box display="grid" style={{ gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" }}>
                  {stickers.map((s) => (
                    <Box
                      key={s.id}
                      as="button"
                      onClick={() => s.url && onPlace(s.url)}
                      display="flex"
                      flexDirection="column"
                      alignItems="center"
                      gap={2}
                      p={3}
                      borderRadius="12px"
                      border="none"
                      cursor="pointer"
                      style={{
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        transition: "all 0.18s",
                      }}
                      _hover={{
                        background: "rgba(255,255,255,0.09)",
                        border: "1px solid rgba(255,255,255,0.2)",
                        transform: "scale(1.04)",
                      }}
                    >
                      <img
                        src={s.url ?? ""}
                        alt={s.name ?? ""}
                        style={{ width: 90, height: 90, objectFit: "contain", filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.3))" }}
                        draggable={false}
                      />
                      <Text style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.45)", fontFamily: FONT, textAlign: "center" }}>
                        {s.name ?? ""}
                      </Text>
                    </Box>
                  ))}
                </Box>
              )}
            </>
          )}

          {tab === "purchased" && (
            <>
              {purchasedLoading ? (
                <Flex align="center" justify="center" style={{ height: "100%" }} gap={3}>
                  <Spinner size="sm" style={{ color: "rgba(255,255,255,0.4)" }} />
                  <Text style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.3)", fontFamily: FONT }}>
                    Loading…
                  </Text>
                </Flex>
              ) : purchasedError ? (
                <Flex direction="column" align="center" justify="center" style={{ height: "100%" }} gap={3}>
                  <Text style={{ fontSize: "0.78rem", color: "rgba(248,113,113,0.75)", fontFamily: FONT }}>
                    {purchasedError}
                  </Text>
                  <Box
                    as="button"
                    onClick={fetchPurchased}
                    style={{
                      background: "transparent",
                      border: "1px solid rgba(255,255,255,0.15)",
                      borderRadius: 8, padding: "5px 14px",
                      cursor: "pointer", fontSize: "0.75rem",
                      color: "rgba(255,255,255,0.5)",
                      fontFamily: FONT,
                    }}
                  >
                    Retry
                  </Box>
                </Flex>
              ) : purchased.length === 0 ? (
                <Flex direction="column" align="center" justify="center" style={{ height: "100%" }} gap={3}>
                  <Construction size={32} style={{ color: "rgba(255,255,255,0.2)" }} />
                  <Text style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.35)", fontFamily: FONT, fontWeight: 500 }}>
                    {t("stickerPicker.noPurchased")}
                  </Text>
                  <Text style={{ fontSize: "0.74rem", color: "rgba(255,255,255,0.22)", fontFamily: FONT }}>
                    {t("stickerPicker.noPurchasedHint")}
                  </Text>
                </Flex>
              ) : (
                <Box display="grid" style={{ gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" }}>
                  {purchased.map((item) => (
                    <Box
                      key={item.inventoryId}
                      as="button"
                      onClick={() => item.assetUrl && onPlace(item.assetUrl)}
                      display="flex"
                      flexDirection="column"
                      alignItems="center"
                      gap={2}
                      p={3}
                      borderRadius="12px"
                      border="none"
                      cursor="pointer"
                      style={{
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        transition: "all 0.18s",
                      }}
                      _hover={{
                        background: "rgba(255,255,255,0.09)",
                        border: "1px solid rgba(255,255,255,0.2)",
                        transform: "scale(1.04)",
                      }}
                    >
                      <img
                        src={item.assetUrl ?? ""}
                        alt={item.name}
                        style={{ width: 90, height: 90, objectFit: "contain", filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.3))" }}
                        draggable={false}
                      />
                      <Text style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.45)", fontFamily: FONT, textAlign: "center" }}>
                        {item.name}
                      </Text>
                    </Box>
                  ))}
                </Box>
              )}
            </>
          )}
        </Box>
      </Box>
    </MotionBox>
  );
}
