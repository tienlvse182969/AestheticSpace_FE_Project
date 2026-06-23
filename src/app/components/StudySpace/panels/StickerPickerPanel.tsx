import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { Box, Flex, Text, Spinner } from "@chakra-ui/react";
import { motion, useDragControls } from "motion/react";
import { ShoppingBag, Sticker, Palette, AlertCircle, RefreshCw } from "lucide-react";
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
  type StoreItem,
} from "../../../../services/aestheticStore.service";

const MotionBox = motion.create(Box);

const PANEL_W = 604;
const PANEL_H = 520;
const STICKER_SIZE = 140;

interface StickerPickerPanelProps {
  onPlace: (src: string) => void;
  onDropSticker?: (src: string, x: number, y: number) => void;
  onClose: () => void;
}

type TabValue = "default" | "purchased";
type PurchasedFilter = "store" | "theme";

type ThemeGroup = {
  themeId: string;
  themeName: string;
  themeSource: string | null;
  sticker: { id: string; url: string; name: string } | null;
};

function StickerCard({
  url,
  name,
  onClick,
  onPointerDown,
}: {
  url: string;
  name: string;
  onClick: () => void;
  onPointerDown?: (e: React.PointerEvent) => void;
}) {
  const FONT = "'HarmonyOS Sans', sans-serif";
  return (
    <Box
      as="button"
      onClick={onClick}
      onPointerDown={onPointerDown}
      display="flex"
      flexDirection="column"
      alignItems="center"
      gap={2}
      p={3}
      borderRadius="12px"
      border="none"
      cursor="grab"
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
        src={url}
        alt={name}
        style={{ width: 90, height: 90, objectFit: "contain", filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.3))", pointerEvents: "none" }}
        draggable={false}
      />
      <Text style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.45)", fontFamily: FONT, textAlign: "center" }}>
        {name}
      </Text>
    </Box>
  );
}

export function StickerPickerPanel({ onPlace, onDropSticker, onClose }: StickerPickerPanelProps) {
  const { t } = useTranslation();
  const { x, y, ref } = useCenteredPanel(PANEL_W, PANEL_H);
  const dragControls = useDragControls();
  const FONT = "'HarmonyOS Sans', sans-serif";

  const [tab, setTab] = useState<TabValue>("default");

  /* ── Default stickers ── */
  const [stickers, setStickers] = useState<AssetDto[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState<string | null>(null);

  /* ── Purchased: store-bought ── */
  const [purchasedFilter,  setPurchasedFilter]  = useState<PurchasedFilter>("store");
  const [purchased,        setPurchased]        = useState<InventoryItem[]>([]);
  const [purchasedLoading, setPurchasedLoading] = useState(false);
  const [purchasedError,   setPurchasedError]   = useState<string | null>(null);

  /* ── Purchased: theme-bundled ── */
  const [themeGroups,         setThemeGroups]         = useState<ThemeGroup[]>([]);
  const [themeStickerLoading, setThemeStickerLoading] = useState(false);
  const [themeStickerError,   setThemeStickerError]   = useState(false);

  /* ── Drag-to-drop state ── */
  const [draggingSrc, setDraggingSrc] = useState<string | null>(null);
  const [ghostPos,    setGhostPos]    = useState({ x: 0, y: 0 });
  const isDragging = useRef(false);

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

  const fetchThemeStickers = useCallback(async () => {
    setThemeStickerLoading(true);
    setThemeStickerError(false);
    try {
      const allItems = await aestheticStoreService.getItems(undefined, 1, 200);
      const ownedThemes = allItems.filter((i: StoreItem) => i.category === "Theme" && i.isOwned);
      const groups: ThemeGroup[] = ownedThemes.map((theme: StoreItem) => {
        const stickerItem = theme.themeStickerItemId
          ? allItems.find((i: StoreItem) => i.id === theme.themeStickerItemId)
          : null;
        return {
          themeId: theme.id,
          themeName: theme.name,
          themeSource: theme.themeSource ?? null,
          sticker: stickerItem?.assetUrl
            ? { id: stickerItem.id, url: stickerItem.assetUrl, name: stickerItem.name }
            : null,
        };
      });
      setThemeGroups(groups);
    } catch {
      setThemeStickerError(true);
    } finally {
      setThemeStickerLoading(false);
    }
  }, []);

  useEffect(() => { fetchStickers(); }, [fetchStickers]);

  useEffect(() => {
    if (tab !== "purchased") return;
    if (purchasedFilter === "store") fetchPurchased();
    else fetchThemeStickers();
  }, [tab, purchasedFilter, fetchPurchased, fetchThemeStickers]);

  /* ── Drag-to-drop pointer tracking ── */
  useEffect(() => {
    if (!draggingSrc) return;
    document.body.style.cursor = "grabbing";

    const onMove = (e: PointerEvent) => setGhostPos({ x: e.clientX, y: e.clientY });

    const onUp = (e: PointerEvent) => {
      isDragging.current = false;
      if (ref.current && onDropSticker) {
        const rect = ref.current.getBoundingClientRect();
        const outside =
          e.clientX < rect.left || e.clientX > rect.right ||
          e.clientY < rect.top  || e.clientY > rect.bottom;
        if (outside) {
          onDropSticker(
            draggingSrc,
            Math.round(e.clientX - STICKER_SIZE / 2),
            Math.round(e.clientY - STICKER_SIZE / 2),
          );
        }
      }
      setDraggingSrc(null);
      document.body.style.cursor = "";
    };

    document.addEventListener("pointermove", onMove);
    document.addEventListener("pointerup", onUp);
    return () => {
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerup", onUp);
      document.body.style.cursor = "";
    };
  }, [draggingSrc, ref, onDropSticker]);

  const handleCardPointerDown = useCallback((e: React.PointerEvent, src: string) => {
    e.preventDefault();
    isDragging.current = true;
    setDraggingSrc(src);
    setGhostPos({ x: e.clientX, y: e.clientY });
  }, []);

  const handleCardClick = useCallback((src: string) => {
    if (!isDragging.current) {
      onPlace(src);
      onClose();
    }
  }, [onPlace, onClose]);

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

  const pillStyle = (active: boolean) => ({
    background: active ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.06)",
    border: active ? "1px solid rgba(255,255,255,0.32)" : "1px solid rgba(255,255,255,0.1)",
    borderRadius: "20px",
    color: active ? "#fff" : "rgba(255,255,255,0.45)",
    fontSize: "0.74rem",
    padding: "4px 14px",
    cursor: "pointer",
    fontFamily: FONT,
    fontWeight: active ? 600 : 400,
    transition: "all 0.15s",
    whiteSpace: "nowrap",
  } as React.CSSProperties);

  return (
    <>
    <MotionBox
      ref={ref as any}
      drag
      dragControls={dragControls}
      dragListener={false}
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
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header — drag handle */}
      <Box
        position="relative"
        style={{ padding: "20px 20px 0", flexShrink: 0, cursor: "grab" }}
        onPointerDown={(e) => dragControls.start(e)}
      >
        <PanelCloseBtn onClose={onClose} />

        <Flex align="center" gap={2} mb={3}>
          <Sticker size={13} style={{ color: "rgba(255,255,255,0.32)", flexShrink: 0 }} />
          <Text style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.35)", letterSpacing: "0.1em", fontFamily: FONT }}>
            {t("stickerPicker.title")}
          </Text>
        </Flex>

        {/* Tabs */}
        <Flex mb={0} gap={1} style={{ borderBottom: "1px solid rgba(255,255,255,0.07)", paddingBottom: "10px" }}>
          <Box as="button" style={tabStyle(tab === "default")} onClick={() => setTab("default")}>
            <Sticker size={13} />
            {t("stickerPicker.tabDefault")}
          </Box>
          <Box as="button" style={tabStyle(tab === "purchased")} onClick={() => setTab("purchased")}>
            <ShoppingBag size={13} />
            {t("stickerPicker.tabPurchased")}
          </Box>
        </Flex>
      </Box>

      {/* Scrollable content — stop propagation so cards don't trigger panel drag */}
      <Box
        style={{ flex: 1, padding: "14px 20px 18px", overflowY: "auto", overflowX: "hidden" }}
        onPointerDown={(e) => e.stopPropagation()}
      >
        {/* Hint */}
        {tab === "default" && (
          <Text mb={2} style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.4)", fontFamily: FONT }}>
            {t("stickerPicker.hint")}
          </Text>
        )}

        {/* Sub-filter pills — purchased tab only */}
        {tab === "purchased" && (
          <Flex gap={2} mb={3}>
            {(["store", "theme"] as const).map(f => (
              <Box key={f} as="button" onClick={() => setPurchasedFilter(f)} style={pillStyle(purchasedFilter === f)}>
                {f === "store" ? "Mua lẻ" : "Kèm giao diện"}
              </Box>
            ))}
          </Flex>
        )}

        {/* ── Default tab ── */}
        {tab === "default" && (
          loading ? (
            <Flex align="center" justify="center" style={{ height: "100%" }} gap={3}>
              <Spinner size="sm" style={{ color: "rgba(255,255,255,0.4)" }} />
              <Text style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.3)", fontFamily: FONT }}>Loading…</Text>
            </Flex>
          ) : error ? (
            <Flex direction="column" align="center" justify="center" style={{ height: "100%" }} gap={3}>
              <Text style={{ fontSize: "0.78rem", color: "rgba(248,113,113,0.75)", fontFamily: FONT }}>{error}</Text>
              <Box as="button" onClick={fetchStickers}
                style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 8, padding: "5px 14px", cursor: "pointer", fontSize: "0.75rem", color: "rgba(255,255,255,0.5)", fontFamily: FONT }}>
                Retry
              </Box>
            </Flex>
          ) : stickers.length === 0 ? (
            <Flex align="center" justify="center" style={{ height: "100%" }}>
              <Text style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.28)", fontFamily: FONT }}>No stickers found</Text>
            </Flex>
          ) : (
            <Box display="grid" style={{ gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" }}>
              {stickers.map((s) => (
                <StickerCard
                  key={s.id}
                  url={s.url ?? ""}
                  name={s.name ?? ""}
                  onClick={() => s.url && handleCardClick(s.url)}
                  onPointerDown={s.url ? (e) => handleCardPointerDown(e, s.url!) : undefined}
                />
              ))}
            </Box>
          )
        )}

        {/* ── Purchased: store-bought ── */}
        {tab === "purchased" && purchasedFilter === "store" && (
          purchasedLoading ? (
            <Flex align="center" justify="center" style={{ height: "100%" }} gap={3}>
              <Spinner size="sm" style={{ color: "rgba(255,255,255,0.4)" }} />
              <Text style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.3)", fontFamily: FONT }}>Loading…</Text>
            </Flex>
          ) : purchasedError ? (
            <Flex direction="column" align="center" justify="center" style={{ height: "100%" }} gap={3}>
              <AlertCircle size={24} color="rgba(248,113,113,0.55)" />
              <Text style={{ fontSize: "0.78rem", color: "rgba(248,113,113,0.75)", fontFamily: FONT }}>{purchasedError}</Text>
              <Box as="button" onClick={fetchPurchased}
                display="flex" alignItems="center" gap={2}
                style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.16)", borderRadius: 7, color: "rgba(255,255,255,0.6)", fontSize: "0.76rem", padding: "5px 14px", cursor: "pointer", fontFamily: FONT }}>
                <RefreshCw size={12} /> Retry
              </Box>
            </Flex>
          ) : purchased.length === 0 ? (
            <Flex direction="column" align="center" justify="center" style={{ height: "100%" }} gap={3}>
              <ShoppingBag size={28} color="rgba(255,255,255,0.15)" />
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
                <StickerCard
                  key={item.inventoryId}
                  url={item.assetUrl ?? ""}
                  name={item.name}
                  onClick={() => item.assetUrl && handleCardClick(item.assetUrl)}
                  onPointerDown={item.assetUrl ? (e) => handleCardPointerDown(e, item.assetUrl!) : undefined}
                />
              ))}
            </Box>
          )
        )}

        {/* ── Purchased: theme-bundled ── */}
        {tab === "purchased" && purchasedFilter === "theme" && (
          themeStickerLoading ? (
            <Box display="flex" flexDirection="column" gap="16px">
              {Array.from({ length: 3 }).map((_, i) => (
                <Box key={i}>
                  <Box mb="6px" h="12px" w="100px" borderRadius="4px"
                    className="animate-pulse" style={{ background: "rgba(255,255,255,0.07)" }} />
                  <Box display="grid" style={{ gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" }}>
                    <Box borderRadius="12px" className="animate-pulse"
                      style={{ aspectRatio: "1", background: "rgba(255,255,255,0.07)" }} />
                  </Box>
                </Box>
              ))}
            </Box>
          ) : themeStickerError ? (
            <Flex direction="column" align="center" justify="center" style={{ height: "100%" }} gap={3}>
              <AlertCircle size={24} color="rgba(248,113,113,0.55)" />
              <Text style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.35)", fontFamily: FONT }}>
                Không tải được dữ liệu
              </Text>
              <Box as="button" onClick={fetchThemeStickers}
                display="flex" alignItems="center" gap={2}
                style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.16)", borderRadius: 7, color: "rgba(255,255,255,0.6)", fontSize: "0.76rem", padding: "5px 14px", cursor: "pointer", fontFamily: FONT }}>
                <RefreshCw size={12} /> Retry
              </Box>
            </Flex>
          ) : themeGroups.length === 0 ? (
            <Flex direction="column" align="center" justify="center" style={{ height: "100%" }} gap={3}>
              <Palette size={28} color="rgba(255,255,255,0.15)" />
              <Text style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.35)", fontFamily: FONT, fontWeight: 500 }}>
                {t("stickerPicker.noPurchased")}
              </Text>
              <Text style={{ fontSize: "0.74rem", color: "rgba(255,255,255,0.22)", fontFamily: FONT }}>
                Mua theme để sticker xuất hiện ở đây
              </Text>
            </Flex>
          ) : (
            <Box display="flex" flexDirection="column" gap="16px">
              {themeGroups.map(group => (
                <Box key={group.themeId}>
                  <Flex align="center" gap="7px" mb="7px"
                    style={{ borderLeft: "2px solid rgba(167,139,250,0.45)", paddingLeft: "8px" }}
                  >
                    <Palette size={11} color="rgba(167,139,250,0.65)" />
                    <Text style={{
                      fontSize: "0.68rem", fontFamily: FONT, fontWeight: 600,
                      color: "rgba(255,255,255,0.55)", letterSpacing: "0.05em",
                      flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}>
                      {group.themeName}
                    </Text>
                    {group.themeSource && (
                      <Box style={{
                        padding: "1px 6px", borderRadius: "4px",
                        fontSize: "0.55rem", fontFamily: FONT, fontWeight: 700,
                        letterSpacing: "0.06em", flexShrink: 0,
                        background: group.themeSource === "Official"
                          ? "rgba(251,191,36,0.18)" : "rgba(20,184,166,0.15)",
                        color: group.themeSource === "Official"
                          ? "rgba(251,191,36,0.9)" : "rgba(20,184,166,0.9)",
                      }}>
                        {group.themeSource === "Official" ? "✦ Official" : "Community"}
                      </Box>
                    )}
                  </Flex>

                  {group.sticker ? (
                    <Box display="grid" style={{ gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" }}>
                      <StickerCard
                        url={group.sticker.url}
                        name={group.sticker.name}
                        onClick={() => handleCardClick(group.sticker!.url)}
                        onPointerDown={(e) => handleCardPointerDown(e, group.sticker!.url)}
                      />
                    </Box>
                  ) : (
                    <Text style={{ fontSize: "0.7rem", fontFamily: FONT, color: "rgba(255,255,255,0.2)", paddingLeft: "10px" }}>
                      Không có sticker kèm theo
                    </Text>
                  )}
                </Box>
              ))}
            </Box>
          )
        )}
      </Box>
    </MotionBox>

    {/* ── Drag ghost (portal) ── */}
    {draggingSrc && typeof document !== "undefined" && createPortal(
      <div style={{
        position: "fixed",
        left: ghostPos.x - STICKER_SIZE / 2,
        top: ghostPos.y - STICKER_SIZE / 2,
        width: STICKER_SIZE,
        height: STICKER_SIZE,
        pointerEvents: "none",
        zIndex: 9999,
        transform: "rotate(-3deg) scale(1.06)",
        filter: "drop-shadow(0 8px 24px rgba(0,0,0,0.6))",
      }}>
        <img
          src={draggingSrc}
          alt=""
          style={{ width: "100%", height: "100%", objectFit: "contain" }}
          draggable={false}
        />
      </div>,
      document.body,
    )}
    </>
  );
}
