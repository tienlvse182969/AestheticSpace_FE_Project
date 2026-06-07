import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Box, Flex, Text, Input, Spinner } from "@chakra-ui/react";
import { motion, AnimatePresence } from "motion/react";
import {
  Plus, Pencil, Trash2, RefreshCw, X, MoreHorizontal,
  Music, Image, Layers, Sticker, ChevronDown,
} from "lucide-react";
import {
  adminAssetsService,
  type AssetDto,
  type AssetFormData,
} from "../../../services/admin/assets.admin.service";
import { useAdminTheme } from "./AdminThemeContext";

const MotionBox = motion.create(Box);

const TYPE_OPTIONS = ["Audio", "Image", "Video", "Sticker", "Effect"];
const TYPE_STYLE: Record<string, { color: string; bg: string; border: string; icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }> }> = {
  Audio:   { color: "#a78bfa", bg: "rgba(167,139,250,0.12)", border: "rgba(167,139,250,0.3)", icon: Music },
  Image:   { color: "#60a5fa", bg: "rgba(96,165,250,0.12)",  border: "rgba(96,165,250,0.3)",  icon: Image },
  Sticker: { color: "#fbbf24", bg: "rgba(251,191,36,0.12)",  border: "rgba(251,191,36,0.3)",  icon: Sticker },
  Effect:  { color: "#34d399", bg: "rgba(52,211,153,0.12)",  border: "rgba(52,211,153,0.3)",  icon: Layers },
  Video:   { color: "#f472b6", bg: "rgba(244,114,182,0.12)", border: "rgba(244,114,182,0.3)", icon: Layers },
};
const DEFAULT_TYPE_STYLE = { color: "#94a3b8", bg: "rgba(148,163,184,0.1)", border: "rgba(148,163,184,0.2)", icon: Layers };

const DEFAULT_FORM: AssetFormData = {
  name: "", description: "", url: "",
  type: "Audio", category: "",
  defaultVolume: 50, isPremium: false,
};

// Table: Name | Type | Category | Volume | Premium | Actions
const COL_FLEX = [2.5, 1.2, 1.3, 0.9, 0.9, 0.7];

export function AssetsSection() {
  const { c, isDark } = useAdminTheme();
  const { t } = useTranslation();

  const modalBg = isDark ? "rgba(14,20,28,0.97)" : "rgba(238,243,248,0.97)";

  const [assets,        setAssets]        = useState<AssetDto[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState<string | null>(null);

  const [filterType,    setFilterType]    = useState("");
  const [filterCat,     setFilterCat]    = useState("");
  const [showTypeMenu,  setShowTypeMenu]  = useState(false);

  const [showForm,      setShowForm]      = useState(false);
  const [editTarget,    setEditTarget]    = useState<AssetDto | null>(null);
  const [form,          setForm]          = useState<AssetFormData>(DEFAULT_FORM);
  const [formLoading,   setFormLoading]   = useState(false);
  const [formError,     setFormError]     = useState<string | null>(null);

  const [viewAsset,     setViewAsset]     = useState<AssetDto | null>(null);
  const [openMenu,      setOpenMenu]      = useState<string | null>(null);
  const [hoveredRow,    setHoveredRow]    = useState<string | null>(null);
  const [deleteId,      setDeleteId]      = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

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

  const openCreate = () => {
    setEditTarget(null);
    setForm(DEFAULT_FORM);
    setFormError(null);
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
    });
    setFormError(null);
    setShowForm(true);
    setOpenMenu(null);
  };

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

  const premiumCount = assets.filter(a => a.isPremium).length;
  const freeCount    = assets.filter(a => !a.isPremium).length;

  const inputStyle = {
    background: c.cardBg, border: `1px solid ${c.cardBorder}`,
    borderRadius: "8px", color: c.cardText, fontSize: "0.85rem",
    height: "38px", paddingLeft: "12px", outline: "none", width: "100%",
  };

  const getTypeStyle = (type: string | null) => TYPE_STYLE[type ?? ""] ?? DEFAULT_TYPE_STYLE;

  const allCategories = [...new Set(assets.map(a => a.category).filter(Boolean))] as string[];

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
          <Box
            as="button"
            onClick={() => setShowTypeMenu(p => !p)}
            display="flex" alignItems="center" gap={2}
            px={3} py="8px" borderRadius="9px" border="none" cursor="pointer"
            style={{
              background: filterType ? "rgba(78,124,106,0.12)" : c.cardBg,
              border: filterType ? "1px solid rgba(78,124,106,0.35)" : `1px solid ${c.cardBorder}`,
              color: filterType ? "#4e7c6a" : c.textMuted,
              fontSize: "0.8rem", transition: "all 0.18s",
            }}
          >
            {filterType || t("admin.assets.filterType")}
            <ChevronDown size={12} />
          </Box>
          <AnimatePresence>
            {showTypeMenu && (
              <MotionBox
                position="absolute" top="38px" left={0} zIndex={100}
                borderRadius="10px" overflow="hidden"
                initial={{ opacity: 0, scale: 0.95, y: -4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -4 }}
                transition={{ duration: 0.12 } as any}
                style={{
                  background: "rgba(15,22,30,0.97)", backdropFilter: "blur(16px)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  boxShadow: "0 12px 40px rgba(0,0,0,0.6)", minWidth: 130,
                }}
                onMouseDown={(e: React.MouseEvent) => e.stopPropagation()}
              >
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
                    {tp || t("admin.assets.filterAll")}
                  </Box>
                ))}
              </MotionBox>
            )}
          </AnimatePresence>
        </Box>

        {/* Category search */}
        <Input
          value={filterCat}
          onChange={(e) => setFilterCat(e.target.value)}
          placeholder={t("admin.assets.filterCategory")}
          style={{ ...inputStyle, width: 160, height: 36 }}
          _placeholder={{ color: c.textSub } as any}
          _focus={{ borderColor: "rgba(78,124,106,0.5)" } as any}
        />

        {/* Refresh */}
        <Box
          as="button"
          onClick={fetchAssets}
          display="flex" alignItems="center" justifyContent="center"
          w="38px" h="38px" borderRadius="9px" border="none" cursor="pointer" flexShrink={0}
          style={{ background: c.cardBg, border: `1px solid ${c.cardBorder}`, color: c.textMuted }}
          _hover={{ background: c.navActive } as any}
        >
          <RefreshCw size={14} />
        </Box>

        <Box flex={1} />

        {/* Create button */}
        <Box
          as="button"
          onClick={openCreate}
          display="flex" alignItems="center" gap={2}
          px={4} py="8px" borderRadius="9px" border="none" cursor="pointer" flexShrink={0}
          style={{
            background: "rgba(78,124,106,0.18)",
            border: "1px solid rgba(78,124,106,0.4)",
            color: "#4e7c6a", fontSize: "0.82rem", fontWeight: 600,
          }}
          _hover={{ background: "rgba(78,124,106,0.28)" } as any}
        >
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
            <Text key={h} style={{
              fontSize: "0.63rem", color: c.cardTextMuted, letterSpacing: "0.1em",
              flex: COL_FLEX[i],
            }}>
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
              <Flex
                key={a.id} align="center" px={5} py="13px" position="relative"
                cursor="pointer"
                style={{
                  background: hoveredRow === a.id ? "rgba(78,124,106,0.1)" : "transparent",
                  borderBottom: i < assets.length - 1 ? `1px solid ${c.rowDivider}` : "none",
                  transition: "background 0.15s",
                }}
                onClick={() => { setViewAsset(a); setHoveredRow(null); }}
                onMouseEnter={() => setHoveredRow(a.id)}
                onMouseLeave={() => setHoveredRow(null)}
              >
                {/* Name + URL snippet */}
                <Box style={{ flex: COL_FLEX[0], minWidth: 0, paddingRight: 12 }}>
                  <Text style={{ fontSize: "0.82rem", color: c.cardText, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {a.name ?? "—"}
                  </Text>
                  {a.url && (
                    <Text style={{ fontSize: "0.68rem", color: c.cardTextMuted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {a.url}
                    </Text>
                  )}
                </Box>

                {/* Type */}
                <Box style={{ flex: COL_FLEX[1] }}>
                  <Box display="inline-flex" alignItems="center" gap="4px" borderRadius="full" px={2} py="1px"
                    style={{ background: ts.bg, border: `1px solid ${ts.border}` }}>
                    <TypeIcon size={10} style={{ color: ts.color }} />
                    <Text style={{ fontSize: "0.63rem", color: ts.color }}>{a.type ?? "—"}</Text>
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
                  <Box
                    as="button"
                    onClick={(e: React.MouseEvent) => { e.stopPropagation(); setOpenMenu(openMenu === a.id ? null : a.id); }}
                    display="flex" alignItems="center" justifyContent="center"
                    w="28px" h="28px" borderRadius="7px" border="none" cursor="pointer"
                    style={{ background: openMenu === a.id ? c.navActive : "transparent", color: c.textMuted }}
                    _hover={{ background: c.navActive } as any}
                  >
                    <MoreHorizontal size={14} />
                  </Box>

                  <AnimatePresence>
                    {openMenu === a.id && (
                      <MotionBox
                        position="absolute" right={0} top="34px" zIndex={100}
                        borderRadius="10px" overflow="hidden"
                        initial={{ opacity: 0, scale: 0.95, y: -4 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -4 }}
                        transition={{ duration: 0.12 } as any}
                        style={{
                          background: "rgba(15,22,30,0.97)", backdropFilter: "blur(16px)",
                          border: "1px solid rgba(255,255,255,0.1)",
                          boxShadow: "0 12px 40px rgba(0,0,0,0.6)", minWidth: 130,
                        }}
                        onMouseDown={(e: React.MouseEvent) => e.stopPropagation()}
                      >
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

      {/* Footer count */}
      <Flex align="center" mt={3}>
        <Text style={{ fontSize: "0.72rem", color: c.cardTextMuted }}>
          {loading ? t("admin.assets.loading") : t("admin.assets.showing", { count: assets.length })}
        </Text>
      </Flex>

      {/* ── Create / Edit Form Modal ── */}
      <AnimatePresence>
        {showForm && (
          <MotionBox
            position="fixed" inset={0} zIndex={200}
            display="flex" alignItems="center" justifyContent="center" px={4}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.15 } as any}
            style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
            onClick={() => !formLoading && setShowForm(false)}
          >
            <MotionBox
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] } as any}
              style={{
                width: "100%", maxWidth: 520, maxHeight: "88vh", overflowY: "auto",
                background: modalBg, border: `1px solid ${c.cardBorder}`,
                borderRadius: 16, boxShadow: "0 24px 80px rgba(0,0,0,0.75)",
              }}
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
            >
              <Box p={6}>
                <Flex align="center" justify="space-between" mb={5}>
                  <Text style={{ fontSize: "1rem", color: c.cardText, fontWeight: 600 }}>
                    {editTarget ? t("admin.assets.editAsset") : t("admin.assets.createNew")}
                  </Text>
                  <Box as="button" onClick={() => !formLoading && setShowForm(false)}
                    style={{ background: "transparent", border: "none", cursor: "pointer", color: c.textMuted, display: "flex" }}>
                    <X size={18} />
                  </Box>
                </Flex>

                <Flex direction="column" gap={4}>
                  {/* Name */}
                  <Box>
                    <Text mb="5px" style={{ fontSize: "0.7rem", color: c.cardTextMuted, letterSpacing: "0.06em" }}>
                      {t("admin.assets.fieldName")} *
                    </Text>
                    <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                      style={inputStyle} _focus={{ borderColor: "rgba(78,124,106,0.6)" } as any} />
                  </Box>

                  {/* URL */}
                  <Box>
                    <Text mb="5px" style={{ fontSize: "0.7rem", color: c.cardTextMuted, letterSpacing: "0.06em" }}>
                      {t("admin.assets.fieldUrl")} *
                    </Text>
                    <Input value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
                      placeholder="https://..."
                      style={inputStyle}
                      _placeholder={{ color: c.textSub } as any}
                      _focus={{ borderColor: "rgba(78,124,106,0.6)" } as any} />
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
                          <option key={tp} value={tp}>{tp}</option>
                        ))}
                      </Box>
                    </Box>
                    <Box flex={1}>
                      <Text mb="5px" style={{ fontSize: "0.7rem", color: c.cardTextMuted, letterSpacing: "0.06em" }}>
                        {t("admin.assets.fieldCategory")}
                      </Text>
                      <Input
                        value={form.category}
                        onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                        list="asset-categories"
                        placeholder={t("admin.assets.fieldCategoryPlaceholder")}
                        style={inputStyle}
                        _placeholder={{ color: c.textSub } as any}
                        _focus={{ borderColor: "rgba(78,124,106,0.6)" } as any}
                      />
                      <datalist id="asset-categories">
                        {allCategories.map(cat => <option key={cat} value={cat} />)}
                      </datalist>
                    </Box>
                  </Flex>

                  {/* Volume */}
                  <Box>
                    <Flex justify="space-between" mb="5px">
                      <Text style={{ fontSize: "0.7rem", color: c.cardTextMuted, letterSpacing: "0.06em" }}>
                        {t("admin.assets.fieldVolume")}
                      </Text>
                      <Text style={{ fontSize: "0.7rem", color: c.cardText }}>{form.defaultVolume}</Text>
                    </Flex>
                    <Box as="input" type="range" min={0} max={100} value={form.defaultVolume}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm(f => ({ ...f, defaultVolume: Number(e.target.value) }))}
                      style={{ width: "100%", accentColor: "#4e7c6a" }} />
                  </Box>

                  {/* isPremium toggle */}
                  <Flex align="center" gap={3}>
                    <Box as="button"
                      onClick={() => setForm(f => ({ ...f, isPremium: !f.isPremium }))}
                      w="36px" h="20px" borderRadius="full" border="none" cursor="pointer"
                      style={{
                        background: form.isPremium ? "rgba(251,191,36,0.4)" : c.cardBorder,
                        border: form.isPremium ? "1px solid rgba(251,191,36,0.55)" : `1px solid ${c.cardBorder}`,
                        position: "relative", transition: "all 0.2s", flexShrink: 0,
                      }}>
                      <Box position="absolute" w="14px" h="14px" borderRadius="full" top="2px"
                        style={{
                          left: form.isPremium ? "18px" : "2px",
                          background: form.isPremium ? "#fbbf24" : c.textDim,
                          transition: "left 0.2s",
                        }} />
                    </Box>
                    <Text style={{ fontSize: "0.82rem", color: c.cardText }}>
                      {t("admin.assets.fieldPremium")}
                    </Text>
                  </Flex>
                </Flex>

                {formError && (
                  <Text mt={3} style={{ fontSize: "0.78rem", color: "#f87171" }}>{formError}</Text>
                )}

                <Flex mt={5} gap={3} justify="flex-end">
                  <Box as="button" onClick={() => setShowForm(false)}
                    px={4} py="8px" borderRadius="9px" border="none" cursor="pointer"
                    style={{ background: c.cardBorder, color: c.cardTextMuted, fontSize: "0.83rem" }}
                    _hover={{ opacity: 0.8 } as any}>
                    {t("admin.assets.cancel")}
                  </Box>
                  <Box as="button" onClick={handleSave}
                    px={5} py="8px" borderRadius="9px" border="none" cursor="pointer"
                    style={{
                      background: "rgba(78,124,106,0.22)", border: "1px solid rgba(78,124,106,0.4)",
                      color: "#4e7c6a", fontSize: "0.83rem", fontWeight: 600,
                      opacity: formLoading || !form.name.trim() || !form.url.trim() ? 0.5 : 1,
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

      {/* ── Delete Confirmation Modal ── */}
      <AnimatePresence>
        {deleteId && (
          <MotionBox
            position="fixed" inset={0} zIndex={200}
            display="flex" alignItems="center" justifyContent="center" px={4}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.15 } as any}
            style={{ background: "rgba(0,0,0,0.55)" }}
            onClick={() => !deleteLoading && setDeleteId(null)}
          >
            <MotionBox
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              transition={{ duration: 0.15 } as any}
              style={{
                width: "100%", maxWidth: 340, background: modalBg,
                border: `1px solid ${c.cardBorder}`,
                borderRadius: 14, boxShadow: "0 16px 48px rgba(0,0,0,0.65)",
              }}
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
            >
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
                    style={{
                      background: "rgba(248,113,113,0.15)", border: "1px solid rgba(248,113,113,0.3)",
                      color: "#f87171", fontSize: "0.8rem", opacity: deleteLoading ? 0.6 : 1,
                    }}
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
          <MotionBox
            position="fixed" inset={0} zIndex={200}
            display="flex" alignItems="center" justifyContent="center" px={4}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.15 } as any}
            style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}
            onClick={() => setViewAsset(null)}
          >
            <MotionBox
              initial={{ scale: 0.96, y: 14 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.96, y: 14 }}
              transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] } as any}
              style={{
                width: "100%", maxWidth: 460,
                background: modalBg, border: `1px solid ${c.cardBorder}`,
                borderRadius: 16, boxShadow: "0 24px 80px rgba(0,0,0,0.7)",
              }}
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
            >
              <Box p={6}>
                <Flex align="flex-start" justify="space-between" mb={5} gap={3}>
                  <Box minW={0}>
                    <Text style={{ fontSize: "1.05rem", color: c.cardText, fontWeight: 700, lineHeight: 1.3 }}>
                      {viewAsset.name ?? "—"}
                    </Text>
                    {viewAsset.type && (
                      <Box mt="5px" display="inline-flex" alignItems="center" gap="4px" borderRadius="full" px={2} py="1px"
                        style={{ background: getTypeStyle(viewAsset.type).bg, border: `1px solid ${getTypeStyle(viewAsset.type).border}` }}>
                        <Text style={{ fontSize: "0.68rem", color: getTypeStyle(viewAsset.type).color }}>
                          {viewAsset.type}
                        </Text>
                      </Box>
                    )}
                  </Box>
                  <Flex align="center" gap={2} flexShrink={0}>
                    <Box as="button"
                      onClick={() => { setViewAsset(null); openEdit(viewAsset); }}
                      display="flex" alignItems="center" gap="5px"
                      px={3} py="6px" borderRadius="8px" border="none" cursor="pointer"
                      style={{
                        background: "rgba(78,124,106,0.15)", border: "1px solid rgba(78,124,106,0.35)",
                        color: "#4e7c6a", fontSize: "0.78rem",
                      }}
                      _hover={{ background: "rgba(78,124,106,0.25)" } as any}>
                      <Pencil size={12} />
                      {t("admin.assets.actionEdit")}
                    </Box>
                    <Box as="button" onClick={() => setViewAsset(null)}
                      style={{ background: "transparent", border: "none", cursor: "pointer", color: c.textMuted, display: "flex" }}>
                      <X size={18} />
                    </Box>
                  </Flex>
                </Flex>

                {viewAsset.description && (
                  <Box mb={4} px={3} py="10px" borderRadius="8px"
                    style={{ background: c.cardBg, border: `1px solid ${c.cardBorder}` }}>
                    <Text style={{ fontSize: "0.82rem", color: c.cardTextSub, lineHeight: 1.6 }}>
                      {viewAsset.description}
                    </Text>
                  </Box>
                )}

                {/* URL */}
                <Box mb={3} px={3} py="10px" borderRadius="8px"
                  style={{ background: c.cardBg, border: `1px solid ${c.cardBorder}`, wordBreak: "break-all" }}>
                  <Text style={{ fontSize: "0.62rem", color: c.cardTextMuted, letterSpacing: "0.08em", marginBottom: 4 }}>
                    URL
                  </Text>
                  <Text style={{ fontSize: "0.78rem", color: c.cardText, fontFamily: "monospace" }}>
                    {viewAsset.url ?? "—"}
                  </Text>
                </Box>

                <Box display="grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  {[
                    { label: t("admin.assets.fieldCategory"), value: viewAsset.category ?? "—" },
                    { label: t("admin.assets.fieldVolume"),   value: String(viewAsset.defaultVolume) },
                  ].map(item => (
                    <Box key={item.label} px={3} py="10px" borderRadius="8px"
                      style={{ background: c.cardBg, border: `1px solid ${c.cardBorder}` }}>
                      <Text style={{ fontSize: "0.62rem", color: c.cardTextMuted, letterSpacing: "0.08em", marginBottom: 4 }}>
                        {item.label.toUpperCase()}
                      </Text>
                      <Text style={{ fontSize: "0.85rem", color: c.cardText, fontWeight: 600 }}>
                        {item.value}
                      </Text>
                    </Box>
                  ))}
                </Box>

                <Flex mt={3} align="center" justify="flex-end">
                  <Flex align="center" gap="6px" borderRadius="full" px={3} py="4px"
                    style={{
                      background: viewAsset.isPremium ? "rgba(251,191,36,0.1)" : "rgba(74,222,128,0.1)",
                      border: viewAsset.isPremium ? "1px solid rgba(251,191,36,0.25)" : "1px solid rgba(74,222,128,0.2)",
                    }}>
                    <Box w="6px" h="6px" borderRadius="full" flexShrink={0}
                      style={{ background: viewAsset.isPremium ? "#fbbf24" : "#4ade80" }} />
                    <Text style={{ fontSize: "0.72rem", color: viewAsset.isPremium ? "#fbbf24" : "#4ade80" }}>
                      {viewAsset.isPremium ? t("admin.assets.premium") : t("admin.assets.free")}
                    </Text>
                  </Flex>
                </Flex>
              </Box>
            </MotionBox>
          </MotionBox>
        )}
      </AnimatePresence>
    </Box>
  );
}
