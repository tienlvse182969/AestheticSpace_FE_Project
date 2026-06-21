import { useState, useEffect, useMemo, useRef } from "react";
import { Box, Flex, Text } from "@chakra-ui/react";
import { motion, AnimatePresence } from "motion/react";
import {
  Check, X, ChevronLeft, ChevronRight, Image, Volume2, Sparkles,
  Palette, ClipboardList, Play, Pause,
} from "lucide-react";
import {
  adminStoreService,
  AdminStoreItemDto,
  StoreCategory,
  ApproveItemBody,
} from "../../../services/admin/store.admin.service";
import { useAdminTheme } from "./AdminThemeContext";

const MotionBox = motion.create(Box);

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

const CAT_META: Record<StoreCategory, { label: string; color: string; icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }> }> = {
  Theme:        { label: "Theme",         color: "#a78bfa", icon: Palette  },
  Background:   { label: "Background",    color: "#60a5fa", icon: Image    },
  Sticker:      { label: "Sticker",       color: "#fb923c", icon: Sparkles },
  Effect:       { label: "Effect",        color: "#34d399", icon: Palette  },
  AmbientSound: { label: "Ambient Sound", color: "#f472b6", icon: Volume2  },
};

type FilterTab = "all" | StoreCategory;
const TABS: { key: FilterTab; label: string }[] = [
  { key: "all",          label: "All Pending"  },
  { key: "Theme",        label: "Themes"       },
  { key: "Background",   label: "Backgrounds"  },
  { key: "Sticker",      label: "Stickers"     },
  { key: "AmbientSound", label: "Ambient"      },
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

function Toggle({ value, onChange, label, textColor }: {
  value: boolean; onChange: () => void; label: string; textColor: string;
}) {
  return (
    <Flex align="center" gap={2} as="button" onClick={onChange}
      style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}>
      <Box w="32px" h="18px" borderRadius="full" position="relative" transition="all 0.2s"
        style={{ background: value ? "rgba(78,124,106,0.6)" : "rgba(128,128,128,0.25)" }}>
        <Box w="14px" h="14px" borderRadius="full" position="absolute" top="2px" transition="all 0.2s"
          style={{ background: "#fff", left: value ? "16px" : "2px" }} />
      </Box>
      <Text style={{ fontSize: "0.8rem", color: textColor, fontFamily: "'HarmonyOS Sans', sans-serif" }}>
        {label}
      </Text>
    </Flex>
  );
}

export function ThemeModerationSection() {
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
  const [tab,        setTab]        = useState<FilterTab>("all");

  /* ── Detail modal ──────────────────────────────────────────────────── */
  const [detailItem,    setDetailItem]    = useState<AdminStoreItemDto | null>(null);
  const [childItems,    setChildItems]    = useState<AdminStoreItemDto[]>([]);
  const [childLoading,  setChildLoading]  = useState(false);

  /* ── Approve ───────────────────────────────────────────────────────── */
  const [approveTarget,  setApproveTarget]  = useState<{ item: AdminStoreItemDto; isComponent: boolean } | null>(null);
  const [approveLoading, setApproveLoading] = useState(false);

  /* ── Reject ────────────────────────────────────────────────────────── */
  const [rejectTarget,  setRejectTarget]  = useState<{ item: AdminStoreItemDto; isComponent: boolean } | null>(null);
  const [rejectLoading, setRejectLoading] = useState(false);
  const [rejectNote,    setRejectNote]    = useState("");

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

  /* ── Load pending ──────────────────────────────────────────────────── */
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    adminStoreService.getPendingItems({
      category: tab !== "all" ? (tab as StoreCategory) : undefined,
      page,
      pageSize: 15,
    }).then(r => {
      if (cancelled) return;
      setItems(r.items);
      setTotalCount(r.totalCount);
      setTotalPages(r.totalPages);
    }).catch(() => {}).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [tab, page]);

  const changeTab = (t: FilterTab) => { setTab(t); setPage(1); };

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

  const openApprove = (item: AdminStoreItemDto, isComponent: boolean) => {
    setApproveTarget({ item, isComponent });
  };

  const openReject = (item: AdminStoreItemDto, isComponent: boolean) => {
    setRejectTarget({ item, isComponent });
    setRejectNote("");
  };

  /* ── Approve handler ───────────────────────────────────────────────── */
  const handleApprove = async () => {
    if (!approveTarget) return;
    setApproveLoading(true);
    const body: ApproveItemBody = {
      isPremium: false,
      coinPrice: null,
      realMoneyPriceVnd: null,
    };
    try {
      if (approveTarget.isComponent) {
        await adminStoreService.approveComponent(approveTarget.item.id, body);
      } else {
        await adminStoreService.approveItem(approveTarget.item.id, body);
      }
      const id = approveTarget.item.id;
      setItems(prev => prev.filter(i => i.id !== id));
      setTotalCount(n => n - 1);
      setChildItems(prev => prev.filter(i => i.id !== id));
      if (detailItem?.id === id) setDetailItem(null);
      setApproveTarget(null);
    } catch {} finally { setApproveLoading(false); }
  };

  /* ── Reject handler ────────────────────────────────────────────────── */
  const handleReject = async () => {
    if (!rejectTarget || !rejectNote.trim()) return;
    setRejectLoading(true);
    try {
      if (rejectTarget.isComponent) {
        await adminStoreService.rejectComponent(rejectTarget.item.id, { rejectionNote: rejectNote.trim() });
      } else {
        await adminStoreService.rejectItem(rejectTarget.item.id, { rejectionNote: rejectNote.trim() });
      }
      const id = rejectTarget.item.id;
      setItems(prev => prev.filter(i => i.id !== id));
      setTotalCount(n => n - 1);
      setChildItems(prev => prev.filter(i => i.id !== id));
      if (detailItem?.id === id) setDetailItem(null);
      setRejectTarget(null);
      setRejectNote("");
    } catch {} finally { setRejectLoading(false); }
  };

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
            Pending Review
          </Text>
        </Box>
      </Flex>

      {/* Tabs */}
      <Flex gap="2px" mb={5} p="3px" borderRadius="10px" flexWrap="wrap"
        style={{ background: c.chipBg, border: `1px solid ${c.chipBorder}`, width: "fit-content" }}>
        {TABS.map(t => (
          <Box key={t.key} as="button" onClick={() => changeTab(t.key)}
            px={3} py="6px" borderRadius="7px" border="none" cursor="pointer" transition="all 0.15s"
            style={{
              background: tab === t.key ? c.navActive : "transparent",
              outline:    tab === t.key ? `1px solid ${c.navActiveBorder}` : "1px solid transparent",
            }}>
            <Text style={{
              fontSize:   "0.78rem",
              color:      tab === t.key ? c.accent : c.textMuted,
              fontFamily: "'HarmonyOS Sans', sans-serif",
            }}>
              {t.label}
            </Text>
          </Box>
        ))}
      </Flex>

      {/* Table */}
      {loading ? (
        <Flex justify="center" py={14}>
          <Text style={{ color: c.textMuted, fontSize: "0.85rem", fontFamily: "'HarmonyOS Sans', sans-serif" }}>Loading…</Text>
        </Flex>
      ) : displayItems.length === 0 ? (
        <Flex justify="center" py={14} direction="column" align="center" gap={3}>
          <ClipboardList size={32} style={{ color: c.textDim }} />
          <Text style={{ color: c.textDim, fontSize: "0.85rem", fontFamily: "'HarmonyOS Sans', sans-serif" }}>
            No pending submissions
          </Text>
        </Flex>
      ) : (
        <Box borderRadius="12px" overflow="hidden"
          style={{ border: `1px solid ${c.cardBorder}`, background: c.cardBg }}>
          {/* Header */}
          <Flex px={4} py={3} style={{ borderBottom: `1px solid ${c.rowDivider}` }}>
            {[
              { label: "ITEM",      flex: 3   },
              { label: "CATEGORY",  flex: 1   },
              { label: "CREATOR",   flex: 1   },
              { label: "SUBMITTED", flex: 1.5 },
            ].map(col => (
              <Box key={col.label} flex={col.flex}>
                <Text style={{ fontSize: "0.65rem", color: c.textDim, letterSpacing: "0.1em", fontFamily: "'HarmonyOS Sans', sans-serif" }}>
                  {col.label}
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
                <Flex flex={3} align="center" gap={3} minW={0}>
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
                        fontFamily: "'HarmonyOS Sans', sans-serif", maxWidth: 260,
                      }}>
                        {item.description}
                      </Text>
                    )}
                  </Box>
                </Flex>

                {/* Category */}
                <Box flex={1}>
                  <Box display="inline-flex" borderRadius="full" px="8px" py="2px"
                    style={{ background: `${catMeta.color}18`, border: `1px solid ${catMeta.color}35` }}>
                    <Text style={{ fontSize: "0.65rem", color: catMeta.color, fontFamily: "'HarmonyOS Sans', sans-serif" }}>
                      {catMeta.label}
                    </Text>
                  </Box>
                </Box>

                {/* Creator */}
                <Box flex={1}>
                  <Text style={{ fontSize: "0.78rem", color: c.textMuted, fontFamily: "'HarmonyOS Sans', sans-serif" }}>
                    {item.creatorUsername ?? "—"}
                  </Text>
                </Box>

                {/* Submitted */}
                <Box flex={1.5}>
                  <Text style={{ fontSize: "0.78rem", color: c.textMuted, fontFamily: "'HarmonyOS Sans', sans-serif" }}>
                    {fmtDate(item.createdAt)}
                  </Text>
                </Box>

                {/* Actions */}
                <Flex w="80px" justify="flex-end" gap="4px">
                  <Box as="button"
                    onClick={(e: React.MouseEvent) => { e.stopPropagation(); openApprove(item, item.category !== "Theme"); }}
                    display="flex" alignItems="center" justifyContent="center"
                    w="28px" h="28px" borderRadius="7px" border="none" cursor="pointer" title="Approve"
                    style={{ background: "rgba(74,222,128,0.12)", color: "#16a34a" }}>
                    <Check size={13} />
                  </Box>
                  <Box as="button"
                    onClick={(e: React.MouseEvent) => { e.stopPropagation(); openReject(item, item.category !== "Theme"); }}
                    display="flex" alignItems="center" justifyContent="center"
                    w="28px" h="28px" borderRadius="7px" border="none" cursor="pointer" title="Reject"
                    style={{ background: "rgba(248,113,113,0.12)", color: "#dc2626" }}>
                    <X size={13} />
                  </Box>
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
                      Theme Submission
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
                        <Text style={{ fontSize: "0.75rem", color: c.textDim, fontFamily: "'HarmonyOS Sans', sans-serif" }}>No preview</Text>
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
                  <Flex gap={6} mb={5}>
                    <Box>
                      <Text style={{ fontSize: "0.6rem", color: c.textDim, letterSpacing: "0.08em", fontFamily: "'HarmonyOS Sans', sans-serif", marginBottom: 2 }}>CREATOR</Text>
                      <Text style={{ fontSize: "0.82rem", color: c.textMuted, fontFamily: "'HarmonyOS Sans', sans-serif" }}>{detailItem.creatorUsername ?? "—"}</Text>
                    </Box>
                    <Box>
                      <Text style={{ fontSize: "0.6rem", color: c.textDim, letterSpacing: "0.08em", fontFamily: "'HarmonyOS Sans', sans-serif", marginBottom: 2 }}>SUBMITTED</Text>
                      <Text style={{ fontSize: "0.82rem", color: c.textMuted, fontFamily: "'HarmonyOS Sans', sans-serif" }}>{fmtDate(detailItem.createdAt)}</Text>
                    </Box>
                  </Flex>

                  {/* Components */}
                  {childLoading ? (
                    <Flex py={6} mb={4} borderRadius="9px" align="center" justify="center"
                      style={{ background: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)", border: `1px solid ${c.cardBorder}` }}>
                      <Text style={{ fontSize: "0.8rem", color: c.textMuted, fontFamily: "'HarmonyOS Sans', sans-serif" }}>Loading components…</Text>
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
                              <Text style={{ fontSize: "0.6rem", color: c.textDim, letterSpacing: "0.08em", fontFamily: "'HarmonyOS Sans', sans-serif" }}>BACKGROUNDS</Text>
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
                              <Text style={{ fontSize: "0.6rem", color: c.textDim, letterSpacing: "0.08em", fontFamily: "'HarmonyOS Sans', sans-serif" }}>STICKERS</Text>
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
                              <Text style={{ fontSize: "0.6rem", color: c.textDim, letterSpacing: "0.08em", fontFamily: "'HarmonyOS Sans', sans-serif" }}>AMBIENT SOUNDS</Text>
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
                                      {sound.name ?? sound.assetUrl?.split("/").pop() ?? "Sound"}
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

                  {/* Theme decision */}
                  <Box mb={3} h="1px" style={{ background: c.border }} />
                  <Text mb={3} style={{ fontSize: "0.62rem", color: c.textDim, letterSpacing: "0.08em", fontFamily: "'HarmonyOS Sans', sans-serif" }}>
                    THEME DECISION
                  </Text>
                  <Flex gap={2}>
                    <Box as="button" onClick={() => openApprove(detailItem, false)}
                      display="flex" alignItems="center" justifyContent="center" gap={2}
                      flex={1} py="9px" borderRadius="9px" border="none" cursor="pointer"
                      style={{ background: "rgba(74,222,128,0.12)", outline: "1px solid rgba(74,222,128,0.3)", color: "#16a34a", fontSize: "0.82rem", fontFamily: "'HarmonyOS Sans', sans-serif" }}>
                      <Check size={14} />
                      Approve Theme
                    </Box>
                    <Box as="button" onClick={() => openReject(detailItem, false)}
                      display="flex" alignItems="center" justifyContent="center" gap={2}
                      flex={1} py="9px" borderRadius="9px" border="none" cursor="pointer"
                      style={{ background: "rgba(248,113,113,0.12)", outline: "1px solid rgba(248,113,113,0.3)", color: "#dc2626", fontSize: "0.82rem", fontFamily: "'HarmonyOS Sans', sans-serif" }}>
                      <X size={14} />
                      Reject Theme
                    </Box>
                  </Flex>
                </Box>
              </MotionBox>
            </ModalCenter>
          </>
        )}
      </AnimatePresence>

      {/* ═══ Approve Modal ════════════════════════════════════════════════ */}
      <AnimatePresence>
        {approveTarget && (
          <>
            <ModalBackdrop onClose={() => setApproveTarget(null)} loading={approveLoading} />
            <ModalCenter zIndex={320}>
              <MotionBox style={{ width: "400px" }}
                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.18, ease: [0.4,0,0.2,1] } as any}>
                <Box style={modalBoxSt}>
                  <Flex align="center" justify="space-between" mb={4}>
                    <Text style={{ fontSize: "0.9rem", color: "#16a34a", fontWeight: 600, fontFamily: "'HarmonyOS Sans', sans-serif" }}>
                      {approveTarget.isComponent ? "Approve Component" : "Approve Theme"}
                    </Text>
                    <Box as="button" onClick={() => !approveLoading && setApproveTarget(null)} style={closeBtnSt}>
                      <X size={13} />
                    </Box>
                  </Flex>
                  <Text mb={5} style={{ fontSize: "0.82rem", color: c.textMuted, fontFamily: "'HarmonyOS Sans', sans-serif" }}>
                    Approving: <span style={{ color: c.text }}>{approveTarget.item.name}</span>
                  </Text>
                  <Flex justify="flex-end" gap={2}>
                    <Box as="button" onClick={() => !approveLoading && setApproveTarget(null)} style={cancelBtnSt}>Cancel</Box>
                    <Box as="button" onClick={handleApprove} disabled={approveLoading}
                      display="flex" alignItems="center" gap={2}
                      px={4} py="8px" borderRadius="8px" border="none" cursor="pointer"
                      style={{ background: "rgba(74,222,128,0.15)", outline: "1px solid rgba(74,222,128,0.4)", color: "#16a34a", fontSize: "0.82rem", fontFamily: "'HarmonyOS Sans', sans-serif", opacity: approveLoading ? 0.6 : 1 }}>
                      <Check size={13} />
                      {approveLoading ? "Approving…" : "Approve"}
                    </Box>
                  </Flex>
                </Box>
              </MotionBox>
            </ModalCenter>
          </>
        )}
      </AnimatePresence>

      {/* ═══ Reject Modal ═════════════════════════════════════════════════ */}
      <AnimatePresence>
        {rejectTarget && (
          <>
            <ModalBackdrop onClose={() => setRejectTarget(null)} loading={rejectLoading} />
            <ModalCenter zIndex={320}>
              <MotionBox style={{ width: "400px" }}
                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.18, ease: [0.4,0,0.2,1] } as any}>
                <Box style={modalBoxSt}>
                  <Flex align="center" justify="space-between" mb={4}>
                    <Text style={{ fontSize: "0.9rem", color: "#dc2626", fontWeight: 600, fontFamily: "'HarmonyOS Sans', sans-serif" }}>
                      {rejectTarget.isComponent ? "Reject Component" : "Reject Theme"}
                    </Text>
                    <Box as="button" onClick={() => !rejectLoading && setRejectTarget(null)} style={closeBtnSt}>
                      <X size={13} />
                    </Box>
                  </Flex>
                  <Text mb={4} style={{ fontSize: "0.82rem", color: c.textMuted, fontFamily: "'HarmonyOS Sans', sans-serif" }}>
                    Rejecting: <span style={{ color: c.text }}>{rejectTarget.item.name}</span>
                  </Text>
                  <Box mb={5}>
                    <Text as="label" style={labelSt}>REJECTION REASON *</Text>
                    <Box as="textarea" value={rejectNote} rows={3}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setRejectNote(e.target.value)}
                      placeholder="Explain why this submission is rejected…"
                      style={{ ...inputSt, height: "auto", padding: "8px 12px", resize: "vertical" }} />
                  </Box>
                  <Flex justify="flex-end" gap={2}>
                    <Box as="button" onClick={() => !rejectLoading && setRejectTarget(null)} style={cancelBtnSt}>Cancel</Box>
                    <Box as="button" onClick={handleReject} disabled={rejectLoading || !rejectNote.trim()}
                      display="flex" alignItems="center" gap={2}
                      px={4} py="8px" borderRadius="8px" border="none" cursor="pointer"
                      style={{ background: "rgba(248,113,113,0.15)", outline: "1px solid rgba(248,113,113,0.4)", color: "#dc2626", fontSize: "0.82rem", fontFamily: "'HarmonyOS Sans', sans-serif", opacity: (rejectLoading || !rejectNote.trim()) ? 0.45 : 1 }}>
                      <X size={13} />
                      {rejectLoading ? "Rejecting…" : "Reject"}
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
