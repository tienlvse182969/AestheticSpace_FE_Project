import { useState, useEffect, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Box, Flex, Text, Input, Spinner } from "@chakra-ui/react";
import { motion, AnimatePresence } from "motion/react";
import {
  Plus, Pencil, Trash2, RefreshCw, X, MoreHorizontal,
  Music, Image, Layers, ChevronDown, UploadCloud, FileAudio, FileImage, CheckCircle,
} from "lucide-react";
import {
  adminAssetsService,
  type AssetDto,
  type AssetFormData,
} from "../../../services/admin/assets.admin.service";
import {
  uploadToCloudinary,
  mimeToAssetType,
} from "../../../services/cloudinary.service";
import { useAdminTheme } from "./AdminThemeContext";

const MotionBox = motion.create(Box);

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

const TYPE_OPTIONS = ["Audio", "Sticker"];
const TYPE_LABELS: Record<string, string> = {
  Audio:   "Ambient Sound",
  Sticker: "Sticker",
};

const TYPE_STYLE: Record<string, { color: string; bg: string; border: string; icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }> }> = {
  Audio:   { color: "#a78bfa", bg: "rgba(167,139,250,0.12)", border: "rgba(167,139,250,0.3)", icon: Music },
  Sticker: { color: "#fbbf24", bg: "rgba(251,191,36,0.12)",  border: "rgba(251,191,36,0.3)",  icon: Image },
};
const DEFAULT_TYPE_STYLE = { color: "#94a3b8", bg: "rgba(148,163,184,0.1)", border: "rgba(148,163,184,0.2)", icon: Layers };

const ACCEPT_BY_TYPE: Record<string, string> = {
  Audio:   "audio/*",
  Sticker: "image/*",
};

const DEFAULT_FORM: AssetFormData = {
  name: "", description: "", url: "",
  type: "Audio", category: "",
  defaultVolume: 50, isPremium: false,
  previewUrl: "",
};

const COL_FLEX = [2.5, 1.2, 1.3, 0.9, 0.9, 0.7];

export function AssetsSection() {
  const { c, isDark } = useAdminTheme();
  const { t } = useTranslation();
  const fileInputRef      = useRef<HTMLInputElement>(null);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);

  const closeBtnSt: React.CSSProperties = {
    background: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)",
    color: c.textMuted,
    width: 28, height: 28, borderRadius: "7px",
    border: "none", cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center",
  };
  const modalBoxSt: React.CSSProperties = {
    background: c.panelBg,
    backdropFilter: "blur(20px)",
    border: `1px solid ${c.panelBorder}`,
    boxShadow: c.panelShadow,
    borderRadius: "16px",
    padding: 24,
  };
  const cancelBtnSt: React.CSSProperties = {
    background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)",
    color: c.textMuted,
    fontSize: "0.82rem",
    fontFamily: "'HarmonyOS Sans', sans-serif",
    border: `1px solid ${c.cardBorder}`,
    borderRadius: "8px",
    cursor: "pointer",
    padding: "8px 16px",
  };
  const modalBg = isDark ? "rgba(14,20,28,0.97)" : "rgba(238,243,248,0.97)";

  /* ── list state ── */
  const [assets,        setAssets]        = useState<AssetDto[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState<string | null>(null);
  const [filterType,    setFilterType]    = useState("");
  const [filterCat,     setFilterCat]     = useState("");
  const [showTypeMenu,  setShowTypeMenu]  = useState(false);

  /* ── form state ── */
  const [showForm,      setShowForm]      = useState(false);
  const [editTarget,    setEditTarget]    = useState<AssetDto | null>(null);
  const [form,          setForm]          = useState<AssetFormData>(DEFAULT_FORM);
  const [formLoading,   setFormLoading]   = useState(false);
  const [formError,     setFormError]     = useState<string | null>(null);

  /* ── upload state ── */
  const [uploadProgress,        setUploadProgress]        = useState<number | null>(null);
  const [uploadedFileName,      setUploadedFileName]      = useState<string | null>(null);
  const [isDragOver,            setIsDragOver]            = useState(false);
  const [previewUploadProgress, setPreviewUploadProgress] = useState<number | null>(null);

  /* ── row state ── */
  const [viewAsset,     setViewAsset]     = useState<AssetDto | null>(null);
  const [openMenu,      setOpenMenu]      = useState<string | null>(null);
  const [hoveredRow,    setHoveredRow]    = useState<string | null>(null);
  const [deleteId,      setDeleteId]      = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  /* ── fetch ── */
  const fetchAssets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await adminAssetsService.getAssets(
        filterType || undefined,
        filterCat  || undefined,
      );
      setAssets(result);
    } catch {
      setError(t("admin.assets.errorLoad"));
    } finally {
      setLoading(false);
    }
  }, [t, filterType, filterCat]);

  useEffect(() => { fetchAssets(); }, [fetchAssets]);

  useEffect(() => {
    if (!openMenu && !showTypeMenu) return;
    const handler = () => { setOpenMenu(null); setShowTypeMenu(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [openMenu, showTypeMenu]);

  /* ── helpers ── */
  const getTypeStyle = (type: string | null) => TYPE_STYLE[type ?? ""] ?? DEFAULT_TYPE_STYLE;
  const allCategories = [...new Set(assets.map(a => a.category).filter(Boolean))] as string[];

  const resetUpload = () => {
    setUploadProgress(null);
    setUploadedFileName(null);
  };

  const resetPreviewUpload = () => {
    setPreviewUploadProgress(null);
  };

  /* ── open form ── */
  const openCreate = () => {
    setEditTarget(null);
    setForm(DEFAULT_FORM);
    setFormError(null);
    resetUpload();
    resetPreviewUpload();
    setShowForm(true);
  };

  const openEdit = (a: AssetDto) => {
    setEditTarget(a);
    setForm({
      name:          a.name          ?? "",
      description:   a.description   ?? "",
      url:           a.url           ?? "",
      type:          a.type          ?? "Audio",
      category:      a.category      ?? "",
      defaultVolume: a.defaultVolume,
      isPremium:     a.isPremium,
      previewUrl:    a.previewUrl    ?? "",
    });
    setFormError(null);
    resetUpload();
    resetPreviewUpload();
    setShowForm(true);
    setOpenMenu(null);
  };

  /* ── file upload ── */
  const handleFileSelected = async (file: File) => {
    const detectedType = mimeToAssetType(file);
    setUploadedFileName(file.name);
    setUploadProgress(0);
    setFormError(null);

    const folder = detectedType === "Audio" ? "aesthetic-space/audio" : "aesthetic-space/images";

    try {
      const result = await uploadToCloudinary(file, folder, (pct) => setUploadProgress(pct));
      setForm(f => ({
        ...f,
        url:  result.secure_url,
        type: detectedType === "Other" ? f.type : detectedType,
        name: f.name || file.name.replace(/\.[^.]+$/, ""),
      }));
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : t("admin.assets.uploadError"));
      resetUpload();
    }
  };

  const onFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelected(file);
    e.target.value = "";
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileSelected(file);
  };

  const handleThumbnailSelected = async (file: File) => {
    setPreviewUploadProgress(0);
    setFormError(null);
    try {
      const result = await uploadToCloudinary(file, "aesthetic-space/thumbnails", (pct) => setPreviewUploadProgress(pct));
      setForm(f => ({ ...f, previewUrl: result.secure_url }));
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : t("admin.assets.uploadError"));
      resetPreviewUpload();
    }
  };

  const onThumbnailInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleThumbnailSelected(file);
    e.target.value = "";
  };

  /* ── save ── */
  const handleSave = async () => {
    if (!form.name.trim() || !form.url.trim()) return;
    setFormLoading(true);
    setFormError(null);
    try {
      if (editTarget) {
        const updated = await adminAssetsService.updateAsset(editTarget.id, form);
        setAssets(prev => prev.map(a => a.id === editTarget.id ? updated : a));
      } else {
        const created = await adminAssetsService.createAsset(form);
        setAssets(prev => [created, ...prev]);
      }
      setShowForm(false);
    } catch {
      setFormError(t("admin.assets.saveError"));
    } finally {
      setFormLoading(false);
    }
  };

  /* ── delete ── */
  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleteLoading(true);
    try {
      await adminAssetsService.deleteAsset(deleteId);
      setAssets(prev => prev.filter(a => a.id !== deleteId));
    } catch {
      fetchAssets();
    } finally {
      setDeleteLoading(false);
      setDeleteId(null);
    }
  };

  /* ── derived ── */
  const premiumCount = assets.filter(a => a.isPremium).length;
  const freeCount    = assets.filter(a => !a.isPremium).length;
  const isUploading        = uploadProgress !== null && uploadProgress < 100;
  const isUploaded         = uploadProgress === 100;
  const isPreviewUploading = previewUploadProgress !== null && previewUploadProgress < 100;
  const isPreviewUploaded  = previewUploadProgress === 100;

  const inputStyle = {
    background: c.cardBg, border: `1px solid ${c.cardBorder}`,
    borderRadius: "8px", color: c.cardText, fontSize: "0.85rem",
    height: "38px", paddingLeft: "12px", outline: "none", width: "100%",
  };

  /* ─────────────────────────── render ─────────────────────────── */
  return (
    <Box>
      {/* Stats */}
      <Flex gap={3} mb={5}>
        {[
          { label: t("admin.assets.statTotal"),   value: assets.length, color: c.cardText },
          { label: t("admin.assets.statPremium"), value: premiumCount,  color: "#fbbf24"  },
          { label: t("admin.assets.statFree"),    value: freeCount,     color: "#4ade80"  },
        ].map(s => (
          <Box key={s.label} borderRadius="10px" px={4} py={3} flexShrink={0}
            style={{ background: c.cardBg, border: `1px solid ${c.cardBorder}`, minWidth: 110, transition: "background 0.3s" }}>
            <Text style={{ fontSize: "1.3rem", color: s.color, fontWeight: 600 }}>{s.value}</Text>
            <Text style={{ fontSize: "0.7rem", color: c.cardTextMuted }}>{s.label}</Text>
          </Box>
        ))}
      </Flex>

      {/* Toolbar */}
      <Flex align="center" gap={3} mb={4} wrap="wrap">
        {/* Type filter */}
        <Box position="relative" onMouseDown={(e: React.MouseEvent) => e.stopPropagation()}>
          <Box as="button" onClick={() => setShowTypeMenu(p => !p)}
            display="flex" alignItems="center" gap={2}
            px={3} py="8px" borderRadius="9px" border="none" cursor="pointer"
            style={{
              background: filterType ? "rgba(78,124,106,0.12)" : c.cardBg,
              border: filterType ? "1px solid rgba(78,124,106,0.35)" : `1px solid ${c.cardBorder}`,
              color: filterType ? "#4e7c6a" : c.textMuted,
              fontSize: "0.8rem", transition: "all 0.18s",
            }}>
            {filterType || t("admin.assets.filterType")}
            <ChevronDown size={12} />
          </Box>
          <AnimatePresence>
            {showTypeMenu && (
              <MotionBox position="absolute" top="38px" left={0} zIndex={100} borderRadius="10px" overflow="hidden"
                initial={{ opacity: 0, scale: 0.95, y: -4 }} animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -4 }} transition={{ duration: 0.12 } as any}
                style={{ background: "rgba(15,22,30,0.97)", backdropFilter: "blur(16px)", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 12px 40px rgba(0,0,0,0.6)", minWidth: 140 }}
                onMouseDown={(e: React.MouseEvent) => e.stopPropagation()}>
                {["", ...TYPE_OPTIONS].map(tp => (
                  <Box key={tp || "__all__"} as="button" w="full" textAlign="left"
                    onClick={() => { setFilterType(tp); setShowTypeMenu(false); }}
                    px={4} py="9px" border="none" cursor="pointer"
                    style={{
                      background: filterType === tp ? "rgba(78,124,106,0.15)" : "transparent",
                      color: tp ? (TYPE_STYLE[tp]?.color ?? "rgba(255,255,255,0.78)") : "rgba(255,255,255,0.55)",
                      fontSize: "0.8rem",
                    }}
                    _hover={{ background: "rgba(255,255,255,0.06)" } as any}>
                    {tp ? (TYPE_LABELS[tp] ?? tp) : t("admin.assets.filterAll")}
                  </Box>
                ))}
              </MotionBox>
            )}
          </AnimatePresence>
        </Box>

        {/* Category filter */}
        <Input value={filterCat} onChange={e => setFilterCat(e.target.value)}
          placeholder={t("admin.assets.filterCategory")}
          style={{ ...inputStyle, width: 160, height: 36 }}
          _placeholder={{ color: c.textSub } as any}
          _focus={{ borderColor: "rgba(78,124,106,0.5)" } as any} />

        {/* Refresh */}
        <Box as="button" onClick={fetchAssets}
          display="flex" alignItems="center" justifyContent="center"
          w="38px" h="38px" borderRadius="9px" border="none" cursor="pointer" flexShrink={0}
          style={{ background: c.cardBg, border: `1px solid ${c.cardBorder}`, color: c.textMuted }}
          _hover={{ background: c.navActive } as any}>
          <RefreshCw size={14} />
        </Box>

        <Box flex={1} />

        {/* Create button */}
        <Box as="button" onClick={openCreate}
          display="flex" alignItems="center" gap={2}
          px={4} py="8px" borderRadius="9px" border="none" cursor="pointer" flexShrink={0}
          style={{ background: "rgba(78,124,106,0.18)", border: "1px solid rgba(78,124,106,0.4)", color: "#4e7c6a", fontSize: "0.82rem", fontWeight: 600 }}
          _hover={{ background: "rgba(78,124,106,0.28)" } as any}>
          <Plus size={14} />
          {t("admin.assets.createNew")}
        </Box>
      </Flex>

      {/* Table */}
      <Box borderRadius="14px" style={{ border: `1px solid ${c.cardBorder}`, overflow: "visible" }}>
        {/* Header */}
        <Flex px={5} py={3} style={{ background: c.cardBg, borderBottom: `1px solid ${c.cardBorder}`, borderRadius: "14px 14px 0 0" }}>
          {[
            t("admin.assets.colName"), t("admin.assets.colType"),
            t("admin.assets.colCategory"), t("admin.assets.colVolume"),
            t("admin.assets.colPremium"), t("admin.assets.colActions"),
          ].map((h, i) => (
            <Text key={h} style={{ fontSize: "0.63rem", color: c.cardTextMuted, letterSpacing: "0.1em", flex: COL_FLEX[i] }}>
              {h.toUpperCase()}
            </Text>
          ))}
        </Flex>

        {/* Rows */}
        {loading ? (
          <Flex align="center" justify="center" py={16} gap={3}>
            <Spinner size="sm" style={{ color: "#4e7c6a" }} />
            <Text style={{ fontSize: "0.85rem", color: c.cardTextMuted }}>{t("admin.assets.loading")}</Text>
          </Flex>
        ) : error ? (
          <Flex direction="column" align="center" justify="center" py={12} gap={3}>
            <Text style={{ fontSize: "0.85rem", color: "#f87171" }}>{error}</Text>
            <Box as="button" onClick={fetchAssets}
              style={{ fontSize: "0.8rem", color: "#4e7c6a", background: "transparent", border: "1px solid rgba(78,124,106,0.4)", borderRadius: 8, padding: "6px 16px", cursor: "pointer" }}>
              {t("admin.assets.retry")}
            </Box>
          </Flex>
        ) : assets.length === 0 ? (
          <Flex align="center" justify="center" py={12}>
            <Text style={{ fontSize: "0.85rem", color: c.cardTextMuted }}>{t("admin.assets.noData")}</Text>
          </Flex>
        ) : (
          assets.map((a, i) => {
            const ts = getTypeStyle(a.type);
            const TypeIcon = ts.icon;
            return (
              <Flex key={a.id} align="center" px={5} py="13px" position="relative" cursor="pointer"
                style={{
                  background: hoveredRow === a.id ? "rgba(78,124,106,0.1)" : "transparent",
                  borderBottom: i < assets.length - 1 ? `1px solid ${c.rowDivider}` : "none",
                  transition: "background 0.15s",
                }}
                onClick={() => { setViewAsset(a); setHoveredRow(null); }}
                onMouseEnter={() => setHoveredRow(a.id)}
                onMouseLeave={() => setHoveredRow(null)}>

                {/* Name + thumbnail */}
                <Box style={{ flex: COL_FLEX[0], minWidth: 0, paddingRight: 12 }}>
                  <Flex align="center" gap={2}>
                    {(() => {
                      const thumbSrc = a.previewUrl || (a.type === "Sticker" ? a.url : null);
                      const isSticker = a.type === "Sticker";
                      return thumbSrc ? (
                        <Box w="36px" h="36px" borderRadius="6px" overflow="hidden" flexShrink={0}
                          style={{
                            border: `1px solid ${c.cardBorder}`,
                            background: isSticker
                              ? "repeating-conic-gradient(rgba(128,128,128,0.15) 0% 25%, transparent 0% 50%) 0 0 / 10px 10px"
                              : undefined,
                          }}>
                          <Box as="img" {...{ src: thumbSrc, alt: "" }}
                            style={{ width: "100%", height: "100%", objectFit: isSticker ? "contain" as const : "cover" as const }} />
                        </Box>
                      ) : null;
                    })()}
                    <Box minWidth={0}>
                      <Text style={{ fontSize: "0.82rem", color: c.cardText, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {a.name ?? "—"}
                      </Text>
                      {a.url && (
                        <Text style={{ fontSize: "0.68rem", color: c.cardTextMuted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {a.url}
                        </Text>
                      )}
                    </Box>
                  </Flex>
                </Box>

                {/* Type */}
                <Box style={{ flex: COL_FLEX[1] }}>
                  <Box display="inline-flex" alignItems="center" gap="4px" borderRadius="full" px={2} py="1px"
                    style={{ background: ts.bg, border: `1px solid ${ts.border}` }}>
                    <TypeIcon size={10} style={{ color: ts.color }} />
                    <Text style={{ fontSize: "0.63rem", color: ts.color }}>{TYPE_LABELS[a.type ?? ""] ?? a.type ?? "—"}</Text>
                  </Box>
                </Box>

                {/* Category */}
                <Text style={{ flex: COL_FLEX[2], fontSize: "0.78rem", color: c.cardTextMuted }}>
                  {a.category ?? "—"}
                </Text>

                {/* Volume */}
                <Text style={{ flex: COL_FLEX[3], fontSize: "0.78rem", color: c.cardTextMuted }}>
                  {a.defaultVolume}
                </Text>

                {/* Premium */}
                <Box style={{ flex: COL_FLEX[4] }}>
                  <Flex align="center" gap="5px" display="inline-flex" borderRadius="full" px={2} py="1px"
                    style={{
                      background: a.isPremium ? "rgba(251,191,36,0.1)"  : "rgba(74,222,128,0.1)",
                      border:     a.isPremium ? "1px solid rgba(251,191,36,0.25)" : "1px solid rgba(74,222,128,0.2)",
                    }}>
                    <Box w="5px" h="5px" borderRadius="full" flexShrink={0}
                      style={{ background: a.isPremium ? "#fbbf24" : "#4ade80" }} />
                    <Text style={{ fontSize: "0.63rem", color: a.isPremium ? "#fbbf24" : "#4ade80" }}>
                      {a.isPremium ? t("admin.assets.premium") : t("admin.assets.free")}
                    </Text>
                  </Flex>
                </Box>

                {/* Actions */}
                <Box style={{ flex: COL_FLEX[5] }} position="relative"
                  onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                  <Box as="button"
                    onClick={(e: React.MouseEvent) => { e.stopPropagation(); setOpenMenu(openMenu === a.id ? null : a.id); }}
                    display="flex" alignItems="center" justifyContent="center"
                    w="28px" h="28px" borderRadius="7px" border="none" cursor="pointer"
                    style={{ background: openMenu === a.id ? c.navActive : "transparent", color: c.textMuted }}
                    _hover={{ background: c.navActive } as any}>
                    <MoreHorizontal size={14} />
                  </Box>

                  <AnimatePresence>
                    {openMenu === a.id && (
                      <MotionBox position="absolute" right={0} top="34px" zIndex={100}
                        borderRadius="10px" overflow="hidden"
                        initial={{ opacity: 0, scale: 0.95, y: -4 }} animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -4 }} transition={{ duration: 0.12 } as any}
                        style={{ background: "rgba(15,22,30,0.97)", backdropFilter: "blur(16px)", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 12px 40px rgba(0,0,0,0.6)", minWidth: 130 }}
                        onMouseDown={(e: React.MouseEvent) => e.stopPropagation()}>
                        <Box as="button" w="full" textAlign="left" onClick={() => openEdit(a)}
                          display="flex" alignItems="center" gap={2} px={4} py="10px"
                          border="none" cursor="pointer"
                          style={{ background: "transparent", color: "rgba(255,255,255,0.78)" }}
                          _hover={{ background: "rgba(255,255,255,0.06)" } as any}>
                          <Pencil size={13} />
                          <Text style={{ fontSize: "0.8rem" }}>{t("admin.assets.actionEdit")}</Text>
                        </Box>
                        <Box as="button" w="full" textAlign="left"
                          onClick={() => { setDeleteId(a.id); setOpenMenu(null); }}
                          display="flex" alignItems="center" gap={2} px={4} py="10px"
                          border="none" cursor="pointer"
                          style={{ background: "transparent", color: "#f87171" }}
                          _hover={{ background: "rgba(248,113,113,0.08)" } as any}>
                          <Trash2 size={13} />
                          <Text style={{ fontSize: "0.8rem", color: "#f87171" }}>{t("admin.assets.actionDelete")}</Text>
                        </Box>
                      </MotionBox>
                    )}
                  </AnimatePresence>
                </Box>
              </Flex>
            );
          })
        )}
      </Box>

      {/* Footer */}
      <Flex align="center" mt={3}>
        <Text style={{ fontSize: "0.72rem", color: c.cardTextMuted }}>
          {loading ? t("admin.assets.loading") : t("admin.assets.showing", { count: assets.length })}
        </Text>
      </Flex>

      {/* ── Create / Edit Form Modal ── */}
      <AnimatePresence>
        {showForm && (
          <MotionBox position="fixed" inset={0} zIndex={200}
            display="flex" alignItems="center" justifyContent="center" px={4}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.15 } as any}
            style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)" }}
            onClick={() => !formLoading && !isUploading && !isPreviewUploading && setShowForm(false)}>
            <MotionBox
              initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] } as any}
              style={{
                width: "100%", maxWidth: 540, maxHeight: "90vh", overflowY: "auto",
                background: modalBg, border: `1px solid ${c.cardBorder}`,
                borderRadius: 16, boxShadow: "0 24px 80px rgba(0,0,0,0.75)",
              }}
              onClick={(e: React.MouseEvent) => e.stopPropagation()}>
              <Box p={6}>
                {/* Modal header */}
                <Flex align="center" justify="space-between" mb={5}>
                  <Text style={{ fontSize: "1rem", color: c.cardText, fontWeight: 600 }}>
                    {editTarget ? t("admin.assets.editAsset") : t("admin.assets.createNew")}
                  </Text>
                  <Box as="button" onClick={() => !formLoading && !isUploading && !isPreviewUploading && setShowForm(false)}
                    style={{ background: "transparent", border: "none", cursor: "pointer", color: c.textMuted, display: "flex" }}>
                    <X size={18} />
                  </Box>
                </Flex>

                <Flex direction="column" gap={4}>
                  {/* ── File Upload Zone ── */}
                  <Box>
                    <Text mb="6px" style={{ fontSize: "0.7rem", color: c.cardTextMuted, letterSpacing: "0.06em" }}>
                      {t("admin.assets.fieldFile")}
                    </Text>

                    {/* hidden file input */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept={ACCEPT_BY_TYPE[form.type] ?? "*/*"}
                      style={{ display: "none" }}
                      onChange={onFileInputChange}
                    />

                    {/* drop zone */}
                    <Box
                      borderRadius="10px"
                      style={{
                        border: `2px dashed ${isDragOver ? "#4e7c6a" : isUploaded ? "rgba(74,222,128,0.4)" : c.cardBorder}`,
                        background: isDragOver ? "rgba(78,124,106,0.08)" : isUploaded ? "rgba(74,222,128,0.05)" : c.cardBg,
                        transition: "all 0.2s",
                        cursor: isUploading ? "default" : "pointer",
                        padding: "20px 16px",
                        textAlign: "center",
                      }}
                      onClick={() => !isUploading && fileInputRef.current?.click()}
                      onDragOver={(e: React.DragEvent) => { e.preventDefault(); setIsDragOver(true); }}
                      onDragLeave={() => setIsDragOver(false)}
                      onDrop={onDrop}
                    >
                      {isUploading ? (
                        /* uploading */
                        <Flex direction="column" align="center" gap={2}>
                          <Spinner size="sm" style={{ color: "#4e7c6a" }} />
                          <Text style={{ fontSize: "0.78rem", color: c.cardTextMuted }}>
                            {t("admin.assets.uploading")} {uploadProgress}%
                          </Text>
                          {/* progress bar */}
                          <Box w="100%" h="3px" borderRadius="full" style={{ background: c.cardBorder }}>
                            <Box h="3px" borderRadius="full"
                              style={{ background: "#4e7c6a", width: `${uploadProgress}%`, transition: "width 0.2s" }} />
                          </Box>
                          <Text style={{ fontSize: "0.68rem", color: c.cardTextMuted }}>{uploadedFileName}</Text>
                        </Flex>
                      ) : isUploaded ? (
                        /* done */
                        <Flex direction="column" align="center" gap="6px">
                          <CheckCircle size={20} style={{ color: "#4ade80" }} />
                          <Text style={{ fontSize: "0.78rem", color: "#4ade80" }}>
                            {t("admin.assets.uploadDone")}
                          </Text>
                          <Text style={{ fontSize: "0.7rem", color: c.cardTextMuted }}>{uploadedFileName}</Text>
                          <Text style={{ fontSize: "0.68rem", color: c.textSub }}>
                            {t("admin.assets.uploadReplace")}
                          </Text>
                        </Flex>
                      ) : (
                        /* idle */
                        <Flex direction="column" align="center" gap="8px">
                          <Flex gap={3} justify="center">
                            <FileAudio size={22} style={{ color: "#a78bfa", opacity: 0.7 }} />
                            <FileImage size={22} style={{ color: "#60a5fa", opacity: 0.7 }} />
                            <UploadCloud size={22} style={{ color: c.textDim }} />
                          </Flex>
                          <Text style={{ fontSize: "0.8rem", color: c.cardText }}>
                            {t("admin.assets.dropZoneTitle")}
                          </Text>
                          <Text style={{ fontSize: "0.7rem", color: c.cardTextMuted }}>
                            {t("admin.assets.dropZoneSub")}
                          </Text>
                        </Flex>
                      )}
                    </Box>
                  </Box>


                  {/* Name */}
                  <Box>
                    <Text mb="5px" style={{ fontSize: "0.7rem", color: c.cardTextMuted, letterSpacing: "0.06em" }}>
                      {t("admin.assets.fieldName")} *
                    </Text>
                    <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                      style={inputStyle} _focus={{ borderColor: "rgba(78,124,106,0.6)" } as any} />
                  </Box>

                  {/* Description */}
                  <Box>
                    <Text mb="5px" style={{ fontSize: "0.7rem", color: c.cardTextMuted, letterSpacing: "0.06em" }}>
                      {t("admin.assets.fieldDescription")}
                    </Text>
                    <Box as="textarea" value={form.description} rows={2}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setForm(f => ({ ...f, description: e.target.value }))}
                      style={{
                        width: "100%", background: c.cardBg, border: `1px solid ${c.cardBorder}`,
                        borderRadius: 8, color: c.cardText, fontSize: "0.85rem",
                        padding: "8px 12px", resize: "vertical", outline: "none",
                        fontFamily: "'HarmonyOS Sans', sans-serif",
                      }} />
                  </Box>

                  {/* Type + Category */}
                  <Flex gap={3}>
                    <Box flex={1}>
                      <Text mb="5px" style={{ fontSize: "0.7rem", color: c.cardTextMuted, letterSpacing: "0.06em" }}>
                        {t("admin.assets.fieldType")}
                      </Text>
                      <Box as="select" value={form.type}
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setForm(f => ({ ...f, type: e.target.value }))}
                        style={{
                          width: "100%", height: 38, background: c.cardBg, border: `1px solid ${c.cardBorder}`,
                          borderRadius: 8, color: c.cardText, fontSize: "0.85rem", padding: "0 12px", outline: "none",
                        }}>
                        {TYPE_OPTIONS.map(tp => (
                          <option key={tp} value={tp} style={{ color: "#111", background: "#fff" }}>{TYPE_LABELS[tp]}</option>
                        ))}
                      </Box>
                    </Box>
                    <Box flex={1}>
                      <Text mb="5px" style={{ fontSize: "0.7rem", color: c.cardTextMuted, letterSpacing: "0.06em" }}>
                        {t("admin.assets.fieldCategory")}
                      </Text>
                      <Input value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                        list="asset-categories"
                        placeholder={t("admin.assets.fieldCategoryPlaceholder")}
                        style={inputStyle}
                        _placeholder={{ color: c.textSub } as any}
                        _focus={{ borderColor: "rgba(78,124,106,0.6)" } as any} />
                      <datalist id="asset-categories">
                        {allCategories.map(cat => <option key={cat} value={cat} />)}
                      </datalist>
                    </Box>
                  </Flex>

                  {/* Volume (only for Audio) */}
                  {form.type === "Audio" && (
                    <Box>
                      <Flex justify="space-between" mb="5px">
                        <Text style={{ fontSize: "0.7rem", color: c.cardTextMuted, letterSpacing: "0.06em" }}>
                          {t("admin.assets.fieldVolume")}
                        </Text>
                        <Text style={{ fontSize: "0.7rem", color: c.cardText }}>{form.defaultVolume}</Text>
                      </Flex>
                      <input type="range" min={0} max={100} value={form.defaultVolume}
                        onChange={(e) => setForm(f => ({ ...f, defaultVolume: Number(e.target.value) }))}
                        style={{ width: "100%", accentColor: "#4e7c6a" }} />
                    </Box>
                  )}

                  {/* Thumbnail (only for Ambient Sound) */}
                  {form.type === "Audio" && (
                    <Box>
                      <Text mb="6px" style={{ fontSize: "0.7rem", color: c.cardTextMuted, letterSpacing: "0.06em" }}>
                        THUMBNAIL IMAGE
                      </Text>

                      <input
                        ref={thumbnailInputRef}
                        type="file"
                        accept="image/*"
                        style={{ display: "none" }}
                        onChange={onThumbnailInputChange}
                      />

                      <Box borderRadius="10px"
                        style={{
                          border: `2px dashed ${isPreviewUploading ? "#4e7c6a" : isPreviewUploaded || form.previewUrl ? "rgba(74,222,128,0.4)" : c.cardBorder}`,
                          background: isPreviewUploaded || form.previewUrl ? "rgba(74,222,128,0.05)" : c.cardBg,
                          transition: "all 0.2s",
                          cursor: isPreviewUploading ? "default" : "pointer",
                          padding: "16px",
                          textAlign: "center",
                        }}
                        onClick={() => !isPreviewUploading && thumbnailInputRef.current?.click()}>
                        {isPreviewUploading ? (
                          <Flex direction="column" align="center" gap={2}>
                            <Spinner size="sm" style={{ color: "#4e7c6a" }} />
                            <Text style={{ fontSize: "0.75rem", color: c.cardTextMuted }}>
                              {previewUploadProgress}%
                            </Text>
                            <Box w="100%" h="3px" borderRadius="full" style={{ background: c.cardBorder }}>
                              <Box h="3px" borderRadius="full"
                                style={{ background: "#4e7c6a", width: `${previewUploadProgress}%`, transition: "width 0.2s" }} />
                            </Box>
                          </Flex>
                        ) : form.previewUrl ? (
                          <Flex direction="column" align="center" gap={2}>
                            <Box w="80px" h="80px" borderRadius="8px" overflow="hidden" mx="auto"
                              style={{ border: `1px solid ${c.cardBorder}` }}>
                              <Box as="img" {...{ src: form.previewUrl, alt: "thumbnail" }}
                                style={{ width: "100%", height: "100%", objectFit: "cover" as const }} />
                            </Box>
                            <Text style={{ fontSize: "0.68rem", color: c.cardTextMuted }}>
                              Click to replace
                            </Text>
                          </Flex>
                        ) : (
                          <Flex direction="column" align="center" gap="6px">
                            <FileImage size={20} style={{ color: "#60a5fa", opacity: 0.7 }} />
                            <Text style={{ fontSize: "0.78rem", color: c.cardText }}>
                              Add thumbnail image
                            </Text>
                            <Text style={{ fontSize: "0.68rem", color: c.cardTextMuted }}>
                              JPG, PNG, WebP
                            </Text>
                          </Flex>
                        )}
                      </Box>
                    </Box>
                  )}

                </Flex>

                {formError && (
                  <Text mt={3} style={{ fontSize: "0.78rem", color: "#f87171" }}>{formError}</Text>
                )}

                {/* Modal footer */}
                <Flex mt={5} gap={3} justify="flex-end">
                  <Box as="button" onClick={() => setShowForm(false)}
                    px={4} py="8px" borderRadius="9px" border="none" cursor="pointer"
                    style={{ background: c.cardBorder, color: c.cardTextMuted, fontSize: "0.83rem" }}
                    _hover={{ opacity: 0.8 } as any}>
                    {t("admin.assets.cancel")}
                  </Box>
                  <Box as="button" onClick={handleSave}
                    px={5} py="8px" borderRadius="9px" border="none"
                    cursor={formLoading || isUploading || isPreviewUploading || !form.name.trim() || !form.url.trim() ? "not-allowed" : "pointer"}
                    style={{
                      background: "rgba(78,124,106,0.22)", border: "1px solid rgba(78,124,106,0.4)",
                      color: "#4e7c6a", fontSize: "0.83rem", fontWeight: 600,
                      opacity: formLoading || isUploading || isPreviewUploading || !form.name.trim() || !form.url.trim() ? 0.45 : 1,
                    }}
                    _hover={{ background: "rgba(78,124,106,0.32)" } as any}>
                    {formLoading ? <Spinner size="xs" /> : t("admin.assets.save")}
                  </Box>
                </Flex>
              </Box>
            </MotionBox>
          </MotionBox>
        )}
      </AnimatePresence>

      {/* ── Delete Confirm Modal ── */}
      <AnimatePresence>
        {deleteId && (
          <MotionBox position="fixed" inset={0} zIndex={200}
            display="flex" alignItems="center" justifyContent="center" px={4}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.15 } as any}
            style={{ background: "rgba(0,0,0,0.55)" }}
            onClick={() => !deleteLoading && setDeleteId(null)}>
            <MotionBox initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 10 }}
              transition={{ duration: 0.15 } as any}
              style={{ width: "100%", maxWidth: 340, background: modalBg, border: `1px solid ${c.cardBorder}`, borderRadius: 14, boxShadow: "0 16px 48px rgba(0,0,0,0.65)" }}
              onClick={(e: React.MouseEvent) => e.stopPropagation()}>
              <Box p={5}>
                <Text style={{ fontSize: "0.9rem", color: c.cardText, fontWeight: 600, marginBottom: 6 }}>
                  {t("admin.assets.deleteConfirm")}
                </Text>
                <Text style={{ fontSize: "0.78rem", color: c.cardTextMuted, marginBottom: 20 }}>
                  {t("admin.assets.deleteNote")}
                </Text>
                <Flex gap={3} justify="flex-end">
                  <Box as="button" onClick={() => setDeleteId(null)}
                    px={4} py="7px" borderRadius="8px" border="none" cursor="pointer"
                    style={{ background: c.cardBorder, color: c.cardTextMuted, fontSize: "0.8rem" }}
                    _hover={{ opacity: 0.8 } as any}>
                    {t("admin.assets.cancel")}
                  </Box>
                  <Box as="button" onClick={handleDelete}
                    px={4} py="7px" borderRadius="8px" border="none" cursor="pointer"
                    style={{ background: "rgba(248,113,113,0.15)", border: "1px solid rgba(248,113,113,0.3)", color: "#f87171", fontSize: "0.8rem", opacity: deleteLoading ? 0.6 : 1 }}
                    _hover={{ background: "rgba(248,113,113,0.25)" } as any}>
                    {deleteLoading ? "…" : t("admin.assets.delete")}
                  </Box>
                </Flex>
              </Box>
            </MotionBox>
          </MotionBox>
        )}
      </AnimatePresence>

      {/* ── Detail Modal ── */}
      <AnimatePresence>
        {viewAsset && (
          <>
            <ModalBackdrop onClose={() => setViewAsset(null)} loading={false} />
            <ModalCenter zIndex={310}>
              <MotionBox
                style={{ width: "640px", maxHeight: "88vh", overflowY: "auto" }}
                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] } as any}>
                <Box style={modalBoxSt}>
                  {/* Header */}
                  <Flex align="center" justify="space-between" mb={4}>
                    <Text style={{ fontSize: "0.9rem", color: c.text, fontWeight: 600, fontFamily: "'HarmonyOS Sans', sans-serif" }}>
                      {t("admin.assets.detailTitle")}
                    </Text>
                    <Box as="button" onClick={() => setViewAsset(null)} style={closeBtnSt}>
                      <X size={13} />
                    </Box>
                  </Flex>

                  {/* Hero — image/sticker */}
                  {viewAsset.url && (viewAsset.type === "Image" || viewAsset.type === "Sticker") && (
                    <Box mb={4} borderRadius="10px" overflow="hidden" h="180px"
                      style={{
                        border: `1px solid ${c.cardBorder}`,
                        background: viewAsset.type === "Sticker"
                          ? "repeating-conic-gradient(rgba(128,128,128,0.12) 0% 25%, transparent 0% 50%) 0 0 / 16px 16px"
                          : isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)",
                      }}>
                      <Box as="img" {...{ src: viewAsset.url, alt: viewAsset.name ?? "" }}
                        style={{ width: "100%", height: "100%", objectFit: viewAsset.type === "Sticker" ? "contain" as const : "cover" as const, padding: viewAsset.type === "Sticker" ? "12px" : undefined }} />
                    </Box>
                  )}

                  {/* Hero — audio player */}
                  {viewAsset.url && viewAsset.type === "Audio" && (
                    <Box mb={4} px={3} py="11px" borderRadius="10px"
                      style={{ background: isDark ? "rgba(167,139,250,0.06)" : "rgba(167,139,250,0.05)", border: "1px solid rgba(167,139,250,0.2)" }}>
                      <Text mb={2} style={{ fontSize: "0.6rem", color: c.textDim, letterSpacing: "0.08em", fontFamily: "'HarmonyOS Sans', sans-serif" }}>
                        AUDIO PREVIEW
                      </Text>
                      <audio controls src={viewAsset.url} style={{ width: "100%", height: 36 }} />
                    </Box>
                  )}

                  {/* Name + badges */}
                  <Flex align="center" gap={2} mb="4px" flexWrap="wrap">
                    <Text style={{ fontSize: "1.05rem", color: c.text, fontWeight: 600, fontFamily: "'HarmonyOS Sans', sans-serif" }}>
                      {viewAsset.name ?? "—"}
                    </Text>
                    {viewAsset.type && (() => {
                      const ts = getTypeStyle(viewAsset.type);
                      return (
                        <Box px="7px" py="1px" borderRadius="full"
                          style={{ background: ts.bg, border: `1px solid ${ts.border}` }}>
                          <Text style={{ fontSize: "0.6rem", color: ts.color, fontFamily: "'HarmonyOS Sans', sans-serif" }}>{TYPE_LABELS[viewAsset.type] ?? viewAsset.type}</Text>
                        </Box>
                      );
                    })()}
                    <Box px="7px" py="1px" borderRadius="full"
                      style={{
                        background: viewAsset.isPremium ? "rgba(251,191,36,0.1)" : "rgba(74,222,128,0.1)",
                        border: viewAsset.isPremium ? "1px solid rgba(251,191,36,0.25)" : "1px solid rgba(74,222,128,0.2)",
                      }}>
                      <Text style={{ fontSize: "0.6rem", color: viewAsset.isPremium ? "#fbbf24" : "#4ade80", fontFamily: "'HarmonyOS Sans', sans-serif" }}>
                        {viewAsset.isPremium ? t("admin.assets.premium") : t("admin.assets.free")}
                      </Text>
                    </Box>
                  </Flex>

                  {/* Description */}
                  {viewAsset.description && (
                    <Text mb={3} style={{ fontSize: "0.8rem", color: c.textMuted, fontFamily: "'HarmonyOS Sans', sans-serif", lineHeight: 1.55 }}>
                      {viewAsset.description}
                    </Text>
                  )}

                  {/* Meta row */}
                  <Flex gap={6} mb={4} flexWrap="wrap">
                    <Box>
                      <Text style={{ fontSize: "0.6rem", color: c.textDim, letterSpacing: "0.08em", fontFamily: "'HarmonyOS Sans', sans-serif", marginBottom: 2 }}>
                        {t("admin.assets.fieldCategory").toUpperCase()}
                      </Text>
                      <Text style={{ fontSize: "0.82rem", color: c.textMuted, fontFamily: "'HarmonyOS Sans', sans-serif" }}>
                        {viewAsset.category ?? "—"}
                      </Text>
                    </Box>
                    {viewAsset.type === "Audio" && (
                      <Box>
                        <Text style={{ fontSize: "0.6rem", color: c.textDim, letterSpacing: "0.08em", fontFamily: "'HarmonyOS Sans', sans-serif", marginBottom: 2 }}>
                          {t("admin.assets.fieldVolume").toUpperCase()}
                        </Text>
                        <Text style={{ fontSize: "0.82rem", color: c.textMuted, fontFamily: "'HarmonyOS Sans', sans-serif" }}>
                          {viewAsset.defaultVolume}
                        </Text>
                      </Box>
                    )}
                    <Box>
                      <Text style={{ fontSize: "0.6rem", color: c.textDim, letterSpacing: "0.08em", fontFamily: "'HarmonyOS Sans', sans-serif", marginBottom: 2 }}>URL</Text>
                      <Text style={{ fontSize: "0.75rem", color: c.textMuted, fontFamily: "monospace", wordBreak: "break-all", maxWidth: 340 }}>
                        {viewAsset.url ?? "—"}
                      </Text>
                    </Box>
                  </Flex>

                  {/* Actions */}
                  <Box mb={3} h="1px" style={{ background: c.border }} />
                  <Flex gap={2}>
                    <Box as="button" onClick={() => { setViewAsset(null); openEdit(viewAsset); }}
                      display="flex" alignItems="center" justifyContent="center" gap={2} flex={1} py="9px" borderRadius="9px" border="none" cursor="pointer"
                      style={{ background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)", outline: `1px solid ${c.cardBorder}`, color: c.textMuted, fontSize: "0.82rem", fontFamily: "'HarmonyOS Sans', sans-serif" }}>
                      <Pencil size={14} />
                      {t("admin.assets.actionEdit")}
                    </Box>
                    <Box as="button" onClick={() => { setViewAsset(null); setDeleteId(viewAsset.id); }}
                      display="flex" alignItems="center" justifyContent="center" gap={2} flex={1} py="9px" borderRadius="9px" border="none" cursor="pointer"
                      style={{ background: "rgba(248,113,113,0.08)", outline: "1px solid rgba(248,113,113,0.25)", color: "#dc2626", fontSize: "0.82rem", fontFamily: "'HarmonyOS Sans', sans-serif" }}>
                      <Trash2 size={14} />
                      {t("admin.assets.actionDelete")}
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
