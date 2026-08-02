import { useState, useEffect, useMemo, useRef } from "react";
import { Box, Flex, Text } from "@chakra-ui/react";
import { motion, AnimatePresence } from "motion/react";
import {
  Check, X, ChevronLeft, ChevronRight, Image, Volume2, Sparkles,
  Palette, ClipboardList, Play, Pause, Coins, Landmark, Tag,
} from "lucide-react";
import { useTranslation, type TFunction } from "react-i18next";
import {
  adminStoreService,
  AdminStoreItemDto,
  StoreCategory,
  ApproveTransactionBody,
  RejectTransactionBody,
  PricePublishBody,
} from "../../../services/admin/store.admin.service";
import { useAdminTheme } from "./AdminThemeContext";

const MotionBox = motion.create(Box);

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// Plain-text price summary (no icon) — for inline mentions within a sentence.
function fmtPriceText(item: AdminStoreItemDto, t: TFunction): string {
  const coin = item.requestedCoinPrice;
  const vnd = item.requestedRealMoneyPriceVnd;
  if (coin == null && vnd == null) return t("admin.moderation.free");
  const parts: string[] = [];
  if (coin != null) parts.push(`${coin.toLocaleString("vi-VN")} coin`);
  if (vnd != null) parts.push(`${vnd.toLocaleString("vi-VN")}đ`);
  return parts.join(" / ");
}

// Icon-based price display — for dedicated price cells/fields (table column, detail meta).
function PriceDisplay({ item, fontSize, color }: { item: AdminStoreItemDto; fontSize: string; color?: string }) {
  const { t } = useTranslation();
  const coin = item.requestedCoinPrice;
  const vnd = item.requestedRealMoneyPriceVnd;
  if (coin == null && vnd == null) {
    return <Text style={{ fontSize, color, fontFamily: "'HarmonyOS Sans', sans-serif" }}>{t("admin.moderation.free")}</Text>;
  }
  return (
    <Flex align="center" gap="8px">
      {coin != null && (
        <Flex align="center" gap="3px">
          <Text style={{ fontSize, color, fontFamily: "'HarmonyOS Sans', sans-serif" }}>{coin.toLocaleString("vi-VN")}</Text>
          <Coins size={11} color="#facc15" />
        </Flex>
      )}
      {vnd != null && (
        <Text style={{ fontSize, color, fontFamily: "'HarmonyOS Sans', sans-serif" }}>{vnd.toLocaleString("vi-VN")}đ</Text>
      )}
    </Flex>
  );
}

// 3-line bank info display — for dedicated bank-detail sections (detail meta, approve modal).
function BankInfoDisplay({ item, fontSize, color }: { item: AdminStoreItemDto; fontSize: string; color?: string }) {
  const { t } = useTranslation();
  if (!item.bankAccountNumber && !item.bankName && !item.bankAccountOwnerName) {
    return <Text style={{ fontSize, color, fontFamily: "'HarmonyOS Sans', sans-serif" }}>{t("admin.moderation.bankInfoSaved")}</Text>;
  }
  const rows: [string, string | null | undefined][] = [
    [t("admin.moderation.bankOwner"), item.bankAccountOwnerName],
    [t("admin.moderation.bankName"), item.bankName],
    [t("admin.moderation.bankNumber"), item.bankAccountNumber],
  ];
  return (
    <Flex direction="column" gap="2px">
      {rows.map(([label, value]) => value ? (
        <Flex key={label} align="baseline" gap="6px">
          <Text style={{ fontSize: "0.68rem", color: color ?? "inherit", opacity: 0.6, fontFamily: "'HarmonyOS Sans', sans-serif", minWidth: "52px" }}>
            {label}:
          </Text>
          <Text style={{ fontSize, color, fontFamily: "'HarmonyOS Sans', sans-serif" }}>{value}</Text>
        </Flex>
      ) : null)}
    </Flex>
  );
}

// Payout method is chosen by the creator at submission time (which price field they
// filled in), not by the admin — admin only confirms and pays out accordingly.
function wantsPayInCoins(item: AdminStoreItemDto): boolean {
  return item.requestedCoinPrice != null;
}

const CAT_META: Record<StoreCategory, { labelKey: string; color: string; icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }> }> = {
  Theme:        { labelKey: "admin.moderation.categoryTheme",        color: "#a78bfa", icon: Palette  },
  Background:   { labelKey: "admin.moderation.categoryBackground",   color: "#60a5fa", icon: Image    },
  Sticker:      { labelKey: "admin.moderation.categorySticker",      color: "#fb923c", icon: Sparkles },
  Effect:       { labelKey: "admin.moderation.categoryEffect",       color: "#34d399", icon: Palette  },
  AmbientSound: { labelKey: "admin.moderation.categoryAmbientSound", color: "#f472b6", icon: Volume2  },
};

type QueueType = "pendingTx" | "pricingPool";
const QUEUE_TABS: { key: QueueType; labelKey: string }[] = [
  { key: "pendingTx",   labelKey: "admin.moderation.queuePendingTx"   },
  { key: "pricingPool", labelKey: "admin.moderation.queuePricingPool" },
];

type FilterTab = "all" | StoreCategory;
const CATEGORY_TABS: { key: FilterTab; labelKey: string }[] = [
  { key: "all",          labelKey: "admin.moderation.tabAll"          },
  { key: "Theme",        labelKey: "admin.moderation.tabThemes"       },
  { key: "Background",   labelKey: "admin.moderation.tabBackgrounds"  },
  { key: "Sticker",      labelKey: "admin.moderation.tabStickers"     },
  { key: "AmbientSound", labelKey: "admin.moderation.tabAmbient"      },
];

function ModalBackdrop({ onClose, loading }: { onClose: () => void; loading: boolean }) {
  return (
    <MotionBox position="fixed" inset={0} zIndex={300}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.15 } as any}
      onClick={() => !loading && onClose()}
      style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(6px)" }} />
  );
}

function ModalCenter({ children, zIndex = 310 }: { children: React.ReactNode; zIndex?: number }) {
  return (
    <Box position="fixed" inset={0} display="flex" alignItems="center" justifyContent="center"
      zIndex={zIndex} style={{ pointerEvents: "none" }}>
      <Box style={{ pointerEvents: "auto" }}>{children}</Box>
    </Box>
  );
}

export function ThemeModerationSection() {
  const { t } = useTranslation();
  const { c, isDark } = useAdminTheme();

  const inputSt: React.CSSProperties = {
    background:   isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)",
    border:       `1px solid ${c.cardBorder}`,
    borderRadius: "8px",
    color:        c.cardText,
    fontSize:     "0.85rem",
    height:       "38px",
    outline:      "none",
    width:        "100%",
    fontFamily:   "'HarmonyOS Sans', sans-serif",
    paddingLeft:  12,
    paddingRight: 12,
  };
  const labelSt: React.CSSProperties = {
    fontSize:      "0.7rem",
    color:         c.cardTextMuted,
    letterSpacing: "0.08em",
    fontFamily:    "'HarmonyOS Sans', sans-serif",
    marginBottom:  6,
    display:       "block",
  };
  const cancelBtnSt: React.CSSProperties = {
    background:   isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)",
    color:        c.textMuted,
    fontSize:     "0.82rem",
    fontFamily:   "'HarmonyOS Sans', sans-serif",
    border:       `1px solid ${c.cardBorder}`,
    borderRadius: "8px",
    cursor:       "pointer",
    padding:      "8px 16px",
  };
  const closeBtnSt: React.CSSProperties = {
    background:   isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)",
    color:        c.textMuted,
    width: 28, height: 28, borderRadius: "7px",
    border: "none", cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center",
  };
  const modalBoxSt: React.CSSProperties = {
    background:     c.panelBg,
    backdropFilter: "blur(20px)",
    border:         `1px solid ${c.panelBorder}`,
    boxShadow:      c.panelShadow,
    borderRadius:   "16px",
    padding:        24,
  };

  /* ── State ─────────────────────────────────────────────────────────── */
  const [items,      setItems]      = useState<AdminStoreItemDto[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [page,       setPage]       = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [queue,          setQueue]          = useState<QueueType>("pendingTx");
  const [categoryFilter, setCategoryFilter] = useState<FilterTab>("all");

  /* ── Detail modal ──────────────────────────────────────────────────── */
  const [detailItem,    setDetailItem]    = useState<AdminStoreItemDto | null>(null);
  const [childItems,    setChildItems]    = useState<AdminStoreItemDto[]>([]);
  const [childLoading,  setChildLoading]  = useState(false);

  /* ── Approve transaction (buyout) ─────────────────────────────────── */
  const [approveTxTarget,  setApproveTxTarget]  = useState<AdminStoreItemDto | null>(null);
  const [transactionNote,  setTransactionNote]  = useState("");
  const [approveTxLoading, setApproveTxLoading] = useState(false);

  /* ── Reject transaction ───────────────────────────────────────────── */
  const [rejectTxTarget,  setRejectTxTarget]  = useState<AdminStoreItemDto | null>(null);
  const [rejectTxLoading, setRejectTxLoading] = useState(false);
  const [rejectNote,      setRejectNote]      = useState("");

  /* ── Price & publish ──────────────────────────────────────────────── */
  const [priceTarget,     setPriceTarget]     = useState<AdminStoreItemDto | null>(null);
  const [finalCoinPrice,  setFinalCoinPrice]  = useState("");
  const [priceLoading,    setPriceLoading]    = useState(false);

  /* ── Audio ─────────────────────────────────────────────────────────── */
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  /* ── Child-item IDs (components belonging to a parent theme) ─────────── */
  const themeChildIds = useMemo(() => {
    const ids = new Set<string>();
    items.forEach(item => {
      if (item.category === "Theme") {
        if (item.themeBackgroundItemId)   ids.add(item.themeBackgroundItemId);
        if (item.themeStickerItemId)       ids.add(item.themeStickerItemId);
        if (item.themeAmbientSoundItemId)  ids.add(item.themeAmbientSoundItemId);
      }
    });
    return ids;
  }, [items]);

  const displayItems = useMemo(() => items.filter(i => !themeChildIds.has(i.id)), [items, themeChildIds]);

  const stopAudio = () => { audioRef.current?.pause(); audioRef.current = null; setPlayingId(null); };
  const toggleSound = (item: AdminStoreItemDto) => {
    if (!item.assetUrl) return;
    if (playingId === item.id) { stopAudio(); return; }
    stopAudio();
    const audio = new Audio(item.assetUrl);
    audioRef.current = audio;
    audio.play().catch(() => {});
    audio.onended = () => setPlayingId(null);
    setPlayingId(item.id);
  };
  const closeDetail = () => { stopAudio(); setDetailItem(null); };

  /* ── Load queue ────────────────────────────────────────────────────── */
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const fetcher = queue === "pendingTx"
      ? adminStoreService.getPendingTransactions
      : adminStoreService.getPurchasedPendingPricing;
    fetcher({
      category: categoryFilter !== "all" ? (categoryFilter as StoreCategory) : undefined,
      page,
      pageSize: 15,
    }).then(r => {
      if (cancelled) return;
      setItems(r.items);
      setTotalCount(r.totalCount);
      setTotalPages(r.totalPages);
    }).catch(() => {}).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [queue, categoryFilter, page]);

  const changeQueue = (q: QueueType) => { setQueue(q); setPage(1); };
  const changeCategory = (t: FilterTab) => { setCategoryFilter(t); setPage(1); };

  /* ── Detail open ───────────────────────────────────────────────────── */
  const openDetail = async (item: AdminStoreItemDto) => {
    setDetailItem(item);
    setChildItems([]);
    if (item.category !== "Theme") return;
    const queries: Promise<AdminStoreItemDto | null>[] = [];
    if (item.themeBackgroundItemId) {
      const id = item.themeBackgroundItemId;
      queries.push(
        adminStoreService.getItems({ category: "Background", page: 1, pageSize: 100 })
          .then(r => r.items.find(i => i.id === id) ?? null)
          .catch(() => null)
      );
    }
    if (item.themeStickerItemId) {
      const id = item.themeStickerItemId;
      queries.push(
        adminStoreService.getItems({ category: "Sticker", page: 1, pageSize: 100 })
          .then(r => r.items.find(i => i.id === id) ?? null)
          .catch(() => null)
      );
    }
    if (item.themeAmbientSoundItemId) {
      const id = item.themeAmbientSoundItemId;
      queries.push(
        adminStoreService.getItems({ category: "AmbientSound", page: 1, pageSize: 100 })
          .then(r => r.items.find(i => i.id === id) ?? null)
          .catch(() => null)
      );
    }
    if (queries.length === 0) return;
    setChildLoading(true);
    try {
      const results = await Promise.all(queries);
      setChildItems(results.filter((i): i is AdminStoreItemDto => i !== null));
    } catch {} finally { setChildLoading(false); }
  };

  const openApproveTx = (item: AdminStoreItemDto) => {
    setApproveTxTarget(item);
    setTransactionNote("");
  };

  const openRejectTx = (item: AdminStoreItemDto) => {
    setRejectTxTarget(item);
    setRejectNote("");
  };

  const openPricePublish = (item: AdminStoreItemDto) => {
    setPriceTarget(item);
    setFinalCoinPrice(item.coinPrice != null ? String(item.coinPrice) : "");
  };

  /* ── Approve transaction handler ──────────────────────────────────── */
  const handleApproveTx = async () => {
    if (!approveTxTarget) return;
    setApproveTxLoading(true);
    const body: ApproveTransactionBody = {
      payInCoins: wantsPayInCoins(approveTxTarget),
      transactionNote: transactionNote.trim() || undefined,
    };
    try {
      await adminStoreService.approveTransaction(approveTxTarget.id, body);
      const id = approveTxTarget.id;
      setItems(prev => prev.filter(i => i.id !== id));
      setTotalCount(n => n - 1);
      setChildItems(prev => prev.filter(i => i.id !== id));
      if (detailItem?.id === id) setDetailItem(null);
      setApproveTxTarget(null);
    } catch {} finally { setApproveTxLoading(false); }
  };

  /* ── Reject transaction handler ───────────────────────────────────── */
  const handleRejectTx = async () => {
    if (!rejectTxTarget || !rejectNote.trim()) return;
    setRejectTxLoading(true);
    const body: RejectTransactionBody = { rejectionNote: rejectNote.trim() };
    try {
      await adminStoreService.rejectTransaction(rejectTxTarget.id, body);
      const id = rejectTxTarget.id;
      setItems(prev => prev.filter(i => i.id !== id));
      setTotalCount(n => n - 1);
      setChildItems(prev => prev.filter(i => i.id !== id));
      if (detailItem?.id === id) setDetailItem(null);
      setRejectTxTarget(null);
      setRejectNote("");
    } catch {} finally { setRejectTxLoading(false); }
  };

  /* ── Price & publish handler ──────────────────────────────────────── */
  const canConfirmPrice = finalCoinPrice.trim() !== "" && Number(finalCoinPrice) > 0;
  const handlePricePublish = async () => {
    if (!priceTarget || !canConfirmPrice) return;
    setPriceLoading(true);
    const body: PricePublishBody = { coinPrice: Number(finalCoinPrice), isPremium: true };
    try {
      await adminStoreService.pricePublish(priceTarget.id, body);
      const id = priceTarget.id;
      setItems(prev => prev.filter(i => i.id !== id));
      setTotalCount(n => n - 1);
      setChildItems(prev => prev.filter(i => i.id !== id));
      if (detailItem?.id === id) setDetailItem(null);
      setPriceTarget(null);
    } catch {} finally { setPriceLoading(false); }
  };

  /* ── Table column config ──────────────────────────────────────────── */
  const columns = queue === "pendingTx"
    ? [
        { label: t("admin.moderation.colItem"),           flex: 2.3 },
        { label: t("admin.moderation.colCategory"),       flex: 0.9 },
        { label: t("admin.moderation.colCreator"),        flex: 0.9 },
        { label: t("admin.moderation.colPaymentMethod"),  flex: 1.5 },
        { label: t("admin.moderation.colRequestedPrice"), flex: 1.1 },
      ]
    : [
        { label: t("admin.moderation.colItem"),      flex: 3   },
        { label: t("admin.moderation.colCategory"),  flex: 1   },
        { label: t("admin.moderation.colCreator"),   flex: 1   },
        { label: t("admin.moderation.colSubmitted"), flex: 1.5 },
      ];

  /* ── Render ────────────────────────────────────────────────────────── */
  return (
    <Box>
      {/* Stats */}
      <Flex align="center" mb={5}>
        <Box borderRadius="9px" px={4} py="10px"
          style={{ background: c.cardBg, border: `1px solid ${c.cardBorder}` }}>
          <Text style={{ fontSize: "1.1rem", color: "#fbbf24", fontWeight: 600, fontFamily: "'HarmonyOS Sans', sans-serif" }}>
            {totalCount}
          </Text>
          <Text style={{ fontSize: "0.68rem", color: c.textMuted, fontFamily: "'HarmonyOS Sans', sans-serif" }}>
            {queue === "pendingTx" ? t("admin.moderation.queuePendingTx") : t("admin.moderation.queuePricingPool")}
          </Text>
        </Box>
      </Flex>

      {/* Queue tabs */}
      <Flex gap="2px" mb={3} p="3px" borderRadius="10px" flexWrap="wrap"
        style={{ background: c.chipBg, border: `1px solid ${c.chipBorder}`, width: "fit-content" }}>
        {QUEUE_TABS.map(q => (
          <Box key={q.key} as="button" onClick={() => changeQueue(q.key)}
            px={3} py="6px" borderRadius="7px" border="none" cursor="pointer" transition="all 0.15s"
            style={{
              background: queue === q.key ? c.navActive : "transparent",
              outline:    queue === q.key ? `1px solid ${c.navActiveBorder}` : "1px solid transparent",
            }}>
            <Text style={{
              fontSize:   "0.78rem",
              color:      queue === q.key ? c.accent : c.textMuted,
              fontFamily: "'HarmonyOS Sans', sans-serif",
              fontWeight: 600,
            }}>
              {t(q.labelKey)}
            </Text>
          </Box>
        ))}
      </Flex>

      {/* Category tabs */}
      <Flex gap="2px" mb={5} p="3px" borderRadius="10px" flexWrap="wrap"
        style={{ background: c.chipBg, border: `1px solid ${c.chipBorder}`, width: "fit-content" }}>
        {CATEGORY_TABS.map(tab => (
          <Box key={tab.key} as="button" onClick={() => changeCategory(tab.key)}
            px={3} py="6px" borderRadius="7px" border="none" cursor="pointer" transition="all 0.15s"
            style={{
              background: categoryFilter === tab.key ? c.navActive : "transparent",
              outline:    categoryFilter === tab.key ? `1px solid ${c.navActiveBorder}` : "1px solid transparent",
            }}>
            <Text style={{
              fontSize:   "0.78rem",
              color:      categoryFilter === tab.key ? c.accent : c.textMuted,
              fontFamily: "'HarmonyOS Sans', sans-serif",
            }}>
              {t(tab.labelKey)}
            </Text>
          </Box>
        ))}
      </Flex>

      {/* Table */}
      {loading ? (
        <Flex justify="center" py={14}>
          <Text style={{ color: c.textMuted, fontSize: "0.85rem", fontFamily: "'HarmonyOS Sans', sans-serif" }}>{t("admin.moderation.loading")}</Text>
        </Flex>
      ) : displayItems.length === 0 ? (
        <Flex justify="center" py={14} direction="column" align="center" gap={3}>
          <ClipboardList size={32} style={{ color: c.textDim }} />
          <Text style={{ color: c.textDim, fontSize: "0.85rem", fontFamily: "'HarmonyOS Sans', sans-serif" }}>
            {queue === "pendingTx" ? t("admin.moderation.noPendingTx") : t("admin.moderation.noPricingItems")}
          </Text>
        </Flex>
      ) : (
        <Box borderRadius="12px" overflow="hidden"
          style={{ border: `1px solid ${c.cardBorder}`, background: c.cardBg }}>
          {/* Header */}
          <Flex px={4} py={3} style={{ borderBottom: `1px solid ${c.rowDivider}` }}>
            {columns.map(col => (
              <Box key={col.label} flex={col.flex}>
                <Text style={{ fontSize: "0.65rem", color: c.textDim, letterSpacing: "0.1em", fontFamily: "'HarmonyOS Sans', sans-serif" }}>
                  {col.label.toUpperCase()}
                </Text>
              </Box>
            ))}
            <Box w="80px" />
          </Flex>

          {/* Rows */}
          {displayItems.map((item, idx) => {
            const catMeta = CAT_META[item.category];
            const CatIcon = catMeta.icon;
            return (
              <Flex key={item.id} align="center" px={4} py="12px" transition="background 0.15s" cursor="pointer"
                onClick={() => openDetail(item)}
                style={{ borderBottom: idx < displayItems.length - 1 ? `1px solid ${c.rowDivider}` : "none" }}
                _hover={{ background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)" } as any}>

                {/* Thumbnail + name */}
                <Flex flex={columns[0].flex} align="center" gap={3} minW={0}>
                  <Box w="40px" h="40px" borderRadius="9px" flexShrink={0} overflow="hidden"
                    style={{ background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)", border: `1px solid ${c.cardBorder}` }}>
                    {item.assetUrl && item.category !== "AmbientSound" ? (
                      <Box as="img" src={item.assetUrl}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <Flex w="full" h="full" align="center" justify="center">
                        <CatIcon size={16} style={{ color: catMeta.color }} />
                      </Flex>
                    )}
                  </Box>
                  <Box minW={0}>
                    <Text style={{
                      fontSize: "0.83rem", color: c.cardText,
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                      fontFamily: "'HarmonyOS Sans', sans-serif",
                    }}>
                      {item.name ?? "—"}
                    </Text>
                    {item.description && (
                      <Text style={{
                        fontSize: "0.7rem", color: c.textDim,
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                        fontFamily: "'HarmonyOS Sans', sans-serif", maxWidth: 220,
                      }}>
                        {item.description}
                      </Text>
                    )}
                  </Box>
                </Flex>

                {/* Category */}
                <Box flex={columns[1].flex}>
                  <Box display="inline-flex" borderRadius="full" px="8px" py="2px"
                    style={{ background: `${catMeta.color}18`, border: `1px solid ${catMeta.color}35` }}>
                    <Text style={{ fontSize: "0.65rem", color: catMeta.color, fontFamily: "'HarmonyOS Sans', sans-serif" }}>
                      {t(catMeta.labelKey)}
                    </Text>
                  </Box>
                </Box>

                {/* Creator */}
                <Box flex={columns[2].flex}>
                  <Text style={{ fontSize: "0.78rem", color: c.textMuted, fontFamily: "'HarmonyOS Sans', sans-serif" }}>
                    {item.creatorUsername ?? "—"}
                  </Text>
                </Box>

                {queue === "pendingTx" ? (
                  <>
                    {/* Payment method */}
                    <Box flex={columns[3].flex} pr={2}>
                      {wantsPayInCoins(item) ? (
                        <Flex align="center" gap="4px">
                          <Coins size={12} color="#facc15" />
                          <Text style={{ fontSize: "0.72rem", color: c.textMuted, fontFamily: "'HarmonyOS Sans', sans-serif" }}>
                            {t("admin.moderation.coinMethod")}
                          </Text>
                        </Flex>
                      ) : (
                        <Flex align="center" gap="4px">
                          <Landmark size={12} color="#4e7c6a" />
                          <Text style={{ fontSize: "0.72rem", color: c.textMuted, fontFamily: "'HarmonyOS Sans', sans-serif" }}>
                            {t("admin.moderation.bankTransferMethod")}
                          </Text>
                        </Flex>
                      )}
                    </Box>
                    {/* Requested price */}
                    <Box flex={columns[4].flex}>
                      <PriceDisplay item={item} fontSize="0.78rem" color={c.textMuted} />
                    </Box>
                  </>
                ) : (
                  <Box flex={columns[3].flex}>
                    <Text style={{ fontSize: "0.78rem", color: c.textMuted, fontFamily: "'HarmonyOS Sans', sans-serif" }}>
                      {fmtDate(item.createdAt)}
                    </Text>
                  </Box>
                )}

                {/* Actions */}
                <Flex w="80px" justify="flex-end" gap="4px">
                  {queue === "pendingTx" ? (
                    <>
                      <Box as="button"
                        onClick={(e: React.MouseEvent) => { e.stopPropagation(); openApproveTx(item); }}
                        display="flex" alignItems="center" justifyContent="center"
                        w="28px" h="28px" borderRadius="7px" border="none" cursor="pointer" title={t("admin.moderation.approveTooltip")}
                        style={{ background: "rgba(74,222,128,0.12)", color: "#16a34a" }}>
                        <Check size={13} />
                      </Box>
                      <Box as="button"
                        onClick={(e: React.MouseEvent) => { e.stopPropagation(); openRejectTx(item); }}
                        display="flex" alignItems="center" justifyContent="center"
                        w="28px" h="28px" borderRadius="7px" border="none" cursor="pointer" title={t("admin.moderation.rejectTooltip")}
                        style={{ background: "rgba(248,113,113,0.12)", color: "#dc2626" }}>
                        <X size={13} />
                      </Box>
                    </>
                  ) : (
                    <Box as="button"
                      onClick={(e: React.MouseEvent) => { e.stopPropagation(); openPricePublish(item); }}
                      display="flex" alignItems="center" justifyContent="center"
                      w="28px" h="28px" borderRadius="7px" border="none" cursor="pointer" title={t("admin.moderation.priceAndPublishTooltip")}
                      style={{ background: "rgba(192,132,252,0.12)", color: "#a855f7" }}>
                      <Coins size={13} />
                    </Box>
                  )}
                </Flex>
              </Flex>
            );
          })}
        </Box>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <Flex align="center" justify="center" gap={3} mt={5}>
          <Box as="button" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
            display="flex" alignItems="center" justifyContent="center"
            w="32px" h="32px" borderRadius="8px" border={`1px solid ${c.cardBorder}`} cursor="pointer"
            style={{ background: c.cardBg, color: c.textMuted, opacity: page <= 1 ? 0.3 : 1 }}>
            <ChevronLeft size={15} />
          </Box>
          <Text style={{ fontSize: "0.8rem", color: c.textMuted, fontFamily: "'HarmonyOS Sans', sans-serif" }}>
            {page} / {totalPages}
          </Text>
          <Box as="button" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
            display="flex" alignItems="center" justifyContent="center"
            w="32px" h="32px" borderRadius="8px" border={`1px solid ${c.cardBorder}`} cursor="pointer"
            style={{ background: c.cardBg, color: c.textMuted, opacity: page >= totalPages ? 0.3 : 1 }}>
            <ChevronRight size={15} />
          </Box>
        </Flex>
      )}

      {/* ═══ Detail Modal ════════════════════════════════════════════════ */}
      <AnimatePresence>
        {detailItem && (
          <>
            <ModalBackdrop onClose={closeDetail} loading={false} />
            <ModalCenter zIndex={310}>
              <MotionBox
                style={{ width: "640px", maxHeight: "88vh", overflowY: "auto" }}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2, ease: [0.4,0,0.2,1] } as any}>
                <Box style={modalBoxSt}>
                  {/* Header */}
                  <Flex align="center" justify="space-between" mb={4}>
                    <Text style={{ fontSize: "0.9rem", color: c.text, fontWeight: 600, fontFamily: "'HarmonyOS Sans', sans-serif" }}>
                      {queue === "pendingTx" ? t("admin.moderation.buyoutRequest") : t("admin.moderation.pricingPoolItem")}
                    </Text>
                    <Box as="button" onClick={closeDetail} style={closeBtnSt}>
                      <X size={13} />
                    </Box>
                  </Flex>

                  {/* Hero preview */}
                  <Box mb={4} borderRadius="10px" overflow="hidden" h="180px"
                    style={{ background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)", border: `1px solid ${c.cardBorder}` }}>
                    {(detailItem.previewUrl || detailItem.assetUrl) ? (
                      <Box as="img" src={detailItem.previewUrl || detailItem.assetUrl || ""}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <Flex w="full" h="full" align="center" justify="center" direction="column" gap={2}>
                        <Palette size={32} style={{ color: c.textDim }} />
                        <Text style={{ fontSize: "0.75rem", color: c.textDim, fontFamily: "'HarmonyOS Sans', sans-serif" }}>{t("admin.moderation.noPreview")}</Text>
                      </Flex>
                    )}
                  </Box>

                  {/* Name + description */}
                  <Text mb="4px" style={{ fontSize: "1.05rem", color: c.text, fontWeight: 600, fontFamily: "'HarmonyOS Sans', sans-serif" }}>
                    {detailItem.name ?? "—"}
                  </Text>
                  {detailItem.description && (
                    <Text mb={3} style={{ fontSize: "0.8rem", color: c.textMuted, fontFamily: "'HarmonyOS Sans', sans-serif", lineHeight: 1.55 }}>
                      {detailItem.description}
                    </Text>
                  )}

                  {/* Meta */}
                  <Flex gap={6} mb={5} flexWrap="wrap">
                    <Box>
                      <Text style={{ fontSize: "0.6rem", color: c.textDim, letterSpacing: "0.08em", fontFamily: "'HarmonyOS Sans', sans-serif", marginBottom: 2 }}>{t("admin.moderation.creator")}</Text>
                      <Text style={{ fontSize: "0.82rem", color: c.textMuted, fontFamily: "'HarmonyOS Sans', sans-serif" }}>{detailItem.creatorUsername ?? "—"}</Text>
                    </Box>
                    <Box>
                      <Text style={{ fontSize: "0.6rem", color: c.textDim, letterSpacing: "0.08em", fontFamily: "'HarmonyOS Sans', sans-serif", marginBottom: 2 }}>{t("admin.moderation.submitted")}</Text>
                      <Text style={{ fontSize: "0.82rem", color: c.textMuted, fontFamily: "'HarmonyOS Sans', sans-serif" }}>{fmtDate(detailItem.createdAt)}</Text>
                    </Box>
                    {queue === "pendingTx" && (
                      <>
                        <Box>
                          <Text style={{ fontSize: "0.6rem", color: c.textDim, letterSpacing: "0.08em", fontFamily: "'HarmonyOS Sans', sans-serif", marginBottom: 2 }}>{t("admin.moderation.requestedPrice")}</Text>
                          <PriceDisplay item={detailItem} fontSize="0.82rem" color={c.textMuted} />
                        </Box>
                        {!wantsPayInCoins(detailItem) && (
                          <Box>
                            <Flex align="center" gap="4px" mb="2px">
                              <Landmark size={10} style={{ color: c.textDim }} />
                              <Text style={{ fontSize: "0.6rem", color: c.textDim, letterSpacing: "0.08em", fontFamily: "'HarmonyOS Sans', sans-serif" }}>{t("admin.moderation.bankLabel")}</Text>
                            </Flex>
                            <BankInfoDisplay item={detailItem} fontSize="0.82rem" color={c.textMuted} />
                          </Box>
                        )}
                      </>
                    )}
                  </Flex>

                  {/* Components */}
                  {childLoading ? (
                    <Flex py={6} mb={4} borderRadius="9px" align="center" justify="center"
                      style={{ background: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)", border: `1px solid ${c.cardBorder}` }}>
                      <Text style={{ fontSize: "0.8rem", color: c.textMuted, fontFamily: "'HarmonyOS Sans', sans-serif" }}>{t("admin.moderation.loadingComponents")}</Text>
                    </Flex>
                  ) : childItems.length > 0 ? (() => {
                    const bgs      = childItems.filter(comp => comp.category === "Background");
                    const stickers = childItems.filter(comp => comp.category === "Sticker");
                    const sounds   = childItems.filter(comp => comp.category === "AmbientSound");
                    return (
                      <Box mb={4}>
                        {/* Backgrounds */}
                        {bgs.length > 0 && (
                          <Box mb={4}>
                            <Flex align="center" gap={2} mb={2}>
                              <Text style={{ fontSize: "0.6rem", color: c.textDim, letterSpacing: "0.08em", fontFamily: "'HarmonyOS Sans', sans-serif" }}>{t("admin.moderation.backgroundsLabel")}</Text>
                              <Box px="6px" py="1px" borderRadius="full"
                                style={{ background: "rgba(96,165,250,0.12)", border: "1px solid rgba(96,165,250,0.3)" }}>
                                <Text style={{ fontSize: "0.6rem", color: "#60a5fa", fontFamily: "'HarmonyOS Sans', sans-serif" }}>{bgs.length}</Text>
                              </Box>
                            </Flex>
                            <Box overflowX="auto" pb="8px">
                              <Flex gap={2} style={{ width: "max-content" }}>
                                {bgs.map(bg => (
                                  <Box key={bg.id} borderRadius="9px" overflow="hidden"
                                    style={{ border: `1px solid ${c.cardBorder}`, background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)" }}>
                                    <Box w="140px" h="84px">
                                      {bg.assetUrl ? (
                                        <Box as="img" src={bg.assetUrl}
                                          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                                      ) : (
                                        <Flex w="full" h="full" align="center" justify="center">
                                          <Image size={20} style={{ color: "#60a5fa" }} />
                                        </Flex>
                                      )}
                                    </Box>
                                  </Box>
                                ))}
                              </Flex>
                            </Box>
                          </Box>
                        )}

                        {/* Stickers */}
                        {stickers.length > 0 && (
                          <Box mb={4}>
                            <Flex align="center" gap={2} mb={2}>
                              <Text style={{ fontSize: "0.6rem", color: c.textDim, letterSpacing: "0.08em", fontFamily: "'HarmonyOS Sans', sans-serif" }}>{t("admin.moderation.stickersLabel")}</Text>
                              <Box px="6px" py="1px" borderRadius="full"
                                style={{ background: "rgba(251,146,60,0.12)", border: "1px solid rgba(251,146,60,0.3)" }}>
                                <Text style={{ fontSize: "0.6rem", color: "#fb923c", fontFamily: "'HarmonyOS Sans', sans-serif" }}>{stickers.length}</Text>
                              </Box>
                            </Flex>
                            <Flex gap={2} flexWrap="wrap">
                              {stickers.map(sticker => (
                                <Box key={sticker.id} borderRadius="9px" overflow="hidden"
                                  style={{ border: `1px solid ${c.cardBorder}`, background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)" }}>
                                  <Box w="80px" h="80px">
                                    {sticker.assetUrl ? (
                                      <Box as="img" src={sticker.assetUrl}
                                        style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }} />
                                    ) : (
                                      <Flex w="full" h="full" align="center" justify="center">
                                        <Sparkles size={18} style={{ color: "#fb923c" }} />
                                      </Flex>
                                    )}
                                  </Box>
                                </Box>
                              ))}
                            </Flex>
                          </Box>
                        )}

                        {/* Ambient Sounds */}
                        {sounds.length > 0 && (
                          <Box mb={2}>
                            <Flex align="center" gap={2} mb={2}>
                              <Text style={{ fontSize: "0.6rem", color: c.textDim, letterSpacing: "0.08em", fontFamily: "'HarmonyOS Sans', sans-serif" }}>{t("admin.moderation.ambientSoundsLabel")}</Text>
                              <Box px="6px" py="1px" borderRadius="full"
                                style={{ background: "rgba(244,114,182,0.12)", border: "1px solid rgba(244,114,182,0.3)" }}>
                                <Text style={{ fontSize: "0.6rem", color: "#f472b6", fontFamily: "'HarmonyOS Sans', sans-serif" }}>{sounds.length}</Text>
                              </Box>
                            </Flex>
                            <Flex direction="column" gap={2}>
                              {sounds.map(sound => (
                                <Flex key={sound.id} align="center" gap={3} px={3} py="10px" borderRadius="9px"
                                  style={{ background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)", border: `1px solid ${c.cardBorder}` }}>
                                  <Box as="button" onClick={() => toggleSound(sound)}
                                    display="flex" alignItems="center" justifyContent="center" flexShrink={0}
                                    w="32px" h="32px" borderRadius="50%" border="none"
                                    cursor={sound.assetUrl ? "pointer" : "default"}
                                    style={{ background: "rgba(244,114,182,0.12)", color: "#f472b6" }}>
                                    {playingId === sound.id ? <Pause size={14} /> : <Play size={14} />}
                                  </Box>
                                  <Box flex={1} minW={0}>
                                    <Text style={{ fontSize: "0.8rem", color: c.text, fontFamily: "'HarmonyOS Sans', sans-serif", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                      {sound.name ?? sound.assetUrl?.split("/").pop() ?? t("admin.storeItems.unnamedSound")}
                                    </Text>
                                    {sound.assetUrl && (
                                      <Text style={{ fontSize: "0.65rem", color: c.textDim, fontFamily: "'HarmonyOS Sans', sans-serif", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                        {sound.assetUrl.split("/").pop()}
                                      </Text>
                                    )}
                                  </Box>
                                </Flex>
                              ))}
                            </Flex>
                          </Box>
                        )}
                      </Box>
                    );
                  })() : null}

                  {/* Decision */}
                  <Box mb={3} h="1px" style={{ background: c.border }} />
                  <Text mb={3} style={{ fontSize: "0.62rem", color: c.textDim, letterSpacing: "0.08em", fontFamily: "'HarmonyOS Sans', sans-serif" }}>
                    {queue === "pendingTx" ? t("admin.moderation.transactionDecision") : t("admin.moderation.pricingDecision")}
                  </Text>
                  {queue === "pendingTx" ? (
                    <Flex gap={2}>
                      <Box as="button" onClick={() => openApproveTx(detailItem)}
                        display="flex" alignItems="center" justifyContent="center" gap={2}
                        flex={1} py="9px" borderRadius="9px" border="none" cursor="pointer"
                        style={{ background: "rgba(74,222,128,0.12)", outline: "1px solid rgba(74,222,128,0.3)", color: "#16a34a", fontSize: "0.82rem", fontFamily: "'HarmonyOS Sans', sans-serif" }}>
                        <Check size={14} />
                        {t("admin.moderation.approveTransaction")}
                      </Box>
                      <Box as="button" onClick={() => openRejectTx(detailItem)}
                        display="flex" alignItems="center" justifyContent="center" gap={2}
                        flex={1} py="9px" borderRadius="9px" border="none" cursor="pointer"
                        style={{ background: "rgba(248,113,113,0.12)", outline: "1px solid rgba(248,113,113,0.3)", color: "#dc2626", fontSize: "0.82rem", fontFamily: "'HarmonyOS Sans', sans-serif" }}>
                        <X size={14} />
                        {t("admin.moderation.rejectTransaction")}
                      </Box>
                    </Flex>
                  ) : (
                    <Box as="button" onClick={() => openPricePublish(detailItem)}
                      display="flex" alignItems="center" justifyContent="center" gap={2}
                      w="100%" py="9px" borderRadius="9px" border="none" cursor="pointer"
                      style={{ background: "rgba(192,132,252,0.12)", outline: "1px solid rgba(192,132,252,0.3)", color: "#a855f7", fontSize: "0.82rem", fontFamily: "'HarmonyOS Sans', sans-serif" }}>
                      <Tag size={14} />
                      {t("admin.moderation.priceAndPublish")}
                    </Box>
                  )}
                </Box>
              </MotionBox>
            </ModalCenter>
          </>
        )}
      </AnimatePresence>

      {/* ═══ Approve Transaction Modal ═══════════════════════════════════ */}
      <AnimatePresence>
        {approveTxTarget && (
          <>
            <ModalBackdrop onClose={() => setApproveTxTarget(null)} loading={approveTxLoading} />
            <ModalCenter zIndex={320}>
              <MotionBox style={{ width: "400px" }}
                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.18, ease: [0.4,0,0.2,1] } as any}>
                <Box style={modalBoxSt}>
                  <Flex align="center" justify="space-between" mb={4}>
                    <Text style={{ fontSize: "0.9rem", color: "#16a34a", fontWeight: 600, fontFamily: "'HarmonyOS Sans', sans-serif" }}>
                      {t("admin.moderation.approveTransaction")}
                    </Text>
                    <Box as="button" onClick={() => !approveTxLoading && setApproveTxTarget(null)} style={closeBtnSt}>
                      <X size={13} />
                    </Box>
                  </Flex>
                  <Text mb={4} style={{ fontSize: "0.82rem", color: c.textMuted, fontFamily: "'HarmonyOS Sans', sans-serif" }}>
                    {t("admin.moderation.transferringLabel")} <span style={{ color: c.text }}>{approveTxTarget.name}</span>
                    {" "}({fmtPriceText(approveTxTarget, t)})
                  </Text>
                  <Box mb={4} px={3} py="10px" borderRadius="9px"
                    style={{ background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)", border: `1px solid ${c.cardBorder}` }}>
                    <Text style={{ fontSize: "0.62rem", color: c.textDim, letterSpacing: "0.08em", fontFamily: "'HarmonyOS Sans', sans-serif", marginBottom: 6 }}>
                      {t("admin.moderation.requestedMethodLabel")}
                    </Text>
                    <Flex align="center" gap="6px">
                      {wantsPayInCoins(approveTxTarget) ? <Coins size={13} color="#facc15" /> : <Landmark size={13} color="#4e7c6a" />}
                      <Text style={{ fontSize: "0.8rem", color: c.text, fontWeight: 600, fontFamily: "'HarmonyOS Sans', sans-serif" }}>
                        {wantsPayInCoins(approveTxTarget) ? t("admin.moderation.coinMethodDesc") : t("admin.moderation.bankTransferDesc")}
                      </Text>
                    </Flex>
                    {!wantsPayInCoins(approveTxTarget) && (
                      <Box mt="6px">
                        <BankInfoDisplay item={approveTxTarget} fontSize="0.72rem" color={c.textMuted} />
                      </Box>
                    )}
                  </Box>
                  <Box mb={5}>
                    <Text as="label" style={labelSt}>{t("admin.moderation.transactionNoteLabel")}</Text>
                    <Box as="textarea" value={transactionNote} rows={3}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setTransactionNote(e.target.value)}
                      placeholder={t("admin.moderation.transactionNotePlaceholder")}
                      style={{ ...inputSt, height: "auto", padding: "8px 12px", resize: "vertical" }} />
                  </Box>
                  <Flex justify="flex-end" gap={2}>
                    <Box as="button" onClick={() => !approveTxLoading && setApproveTxTarget(null)} style={cancelBtnSt}>{t("admin.moderation.cancel")}</Box>
                    <Box as="button" onClick={handleApproveTx} disabled={approveTxLoading}
                      display="flex" alignItems="center" gap={2}
                      px={4} py="8px" borderRadius="8px" border="none" cursor="pointer"
                      style={{ background: "rgba(74,222,128,0.15)", outline: "1px solid rgba(74,222,128,0.4)", color: "#16a34a", fontSize: "0.82rem", fontFamily: "'HarmonyOS Sans', sans-serif", opacity: approveTxLoading ? 0.6 : 1 }}>
                      <Check size={13} />
                      {approveTxLoading ? t("admin.moderation.processing") : t("admin.moderation.approve")}
                    </Box>
                  </Flex>
                </Box>
              </MotionBox>
            </ModalCenter>
          </>
        )}
      </AnimatePresence>

      {/* ═══ Reject Transaction Modal ════════════════════════════════════ */}
      <AnimatePresence>
        {rejectTxTarget && (
          <>
            <ModalBackdrop onClose={() => setRejectTxTarget(null)} loading={rejectTxLoading} />
            <ModalCenter zIndex={320}>
              <MotionBox style={{ width: "400px" }}
                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.18, ease: [0.4,0,0.2,1] } as any}>
                <Box style={modalBoxSt}>
                  <Flex align="center" justify="space-between" mb={4}>
                    <Text style={{ fontSize: "0.9rem", color: "#dc2626", fontWeight: 600, fontFamily: "'HarmonyOS Sans', sans-serif" }}>
                      {t("admin.moderation.rejectModalTitle")}
                    </Text>
                    <Box as="button" onClick={() => !rejectTxLoading && setRejectTxTarget(null)} style={closeBtnSt}>
                      <X size={13} />
                    </Box>
                  </Flex>
                  <Text mb={4} style={{ fontSize: "0.82rem", color: c.textMuted, fontFamily: "'HarmonyOS Sans', sans-serif" }}>
                    {t("admin.moderation.rejectingLabel")} <span style={{ color: c.text }}>{rejectTxTarget.name}</span>
                  </Text>
                  <Box mb={5}>
                    <Text as="label" style={labelSt}>{t("admin.moderation.rejectionReasonLabel")}</Text>
                    <Box as="textarea" value={rejectNote} rows={3}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setRejectNote(e.target.value)}
                      placeholder={t("admin.moderation.rejectionReasonPlaceholder")}
                      style={{ ...inputSt, height: "auto", padding: "8px 12px", resize: "vertical" }} />
                  </Box>
                  <Flex justify="flex-end" gap={2}>
                    <Box as="button" onClick={() => !rejectTxLoading && setRejectTxTarget(null)} style={cancelBtnSt}>{t("admin.moderation.cancel")}</Box>
                    <Box as="button" onClick={handleRejectTx} disabled={rejectTxLoading || !rejectNote.trim()}
                      display="flex" alignItems="center" gap={2}
                      px={4} py="8px" borderRadius="8px" border="none" cursor="pointer"
                      style={{ background: "rgba(248,113,113,0.15)", outline: "1px solid rgba(248,113,113,0.4)", color: "#dc2626", fontSize: "0.82rem", fontFamily: "'HarmonyOS Sans', sans-serif", opacity: (rejectTxLoading || !rejectNote.trim()) ? 0.45 : 1 }}>
                      <X size={13} />
                      {rejectTxLoading ? t("admin.moderation.rejecting") : t("admin.moderation.reject")}
                    </Box>
                  </Flex>
                </Box>
              </MotionBox>
            </ModalCenter>
          </>
        )}
      </AnimatePresence>

      {/* ═══ Price & Publish Modal ═══════════════════════════════════════ */}
      <AnimatePresence>
        {priceTarget && (
          <>
            <ModalBackdrop onClose={() => setPriceTarget(null)} loading={priceLoading} />
            <ModalCenter zIndex={320}>
              <MotionBox style={{ width: "400px" }}
                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.18, ease: [0.4,0,0.2,1] } as any}>
                <Box style={modalBoxSt}>
                  <Flex align="center" justify="space-between" mb={4}>
                    <Text style={{ fontSize: "0.9rem", color: "#a855f7", fontWeight: 600, fontFamily: "'HarmonyOS Sans', sans-serif" }}>
                      {t("admin.moderation.priceModalTitle")}
                    </Text>
                    <Box as="button" onClick={() => !priceLoading && setPriceTarget(null)} style={closeBtnSt}>
                      <X size={13} />
                    </Box>
                  </Flex>
                  <Text mb={4} style={{ fontSize: "0.82rem", color: c.textMuted, fontFamily: "'HarmonyOS Sans', sans-serif" }}>
                    {t("admin.moderation.publishingLabel")} <span style={{ color: c.text }}>{priceTarget.name}</span>
                  </Text>
                  <Box mb={4}>
                    <Text as="label" style={labelSt}>{t("admin.moderation.salePriceLabel")}</Text>
                    <Box as="input" value={finalCoinPrice}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFinalCoinPrice(e.target.value.replace(/[^0-9]/g, ""))}
                      placeholder="0"
                      style={inputSt} />
                  </Box>
                  <Flex justify="flex-end" gap={2}>
                    <Box as="button" onClick={() => !priceLoading && setPriceTarget(null)} style={cancelBtnSt}>{t("admin.moderation.cancel")}</Box>
                    <Box as="button" onClick={handlePricePublish} disabled={priceLoading || !canConfirmPrice}
                      display="flex" alignItems="center" gap={2}
                      px={4} py="8px" borderRadius="8px" border="none" cursor="pointer"
                      style={{ background: "rgba(192,132,252,0.15)", outline: "1px solid rgba(192,132,252,0.4)", color: "#a855f7", fontSize: "0.82rem", fontFamily: "'HarmonyOS Sans', sans-serif", opacity: (priceLoading || !canConfirmPrice) ? 0.45 : 1 }}>
                      <Tag size={13} />
                      {priceLoading ? t("admin.moderation.publishing") : t("admin.moderation.publish")}
                    </Box>
                  </Flex>
                </Box>
              </MotionBox>
            </ModalCenter>
          </>
        )}
      </AnimatePresence>
    </Box>
  );
}
