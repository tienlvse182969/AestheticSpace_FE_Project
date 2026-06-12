import { useState, useEffect } from "react";
import { Box, Flex, Text } from "@chakra-ui/react";
import { motion, AnimatePresence } from "motion/react";
import { Plus, Edit2, Trash2, Eye, EyeOff, Check, X, ChevronLeft, ChevronRight, Palette, Image, Sparkles, Zap, Volume2, Upload, Music } from "lucide-react";
import {
  adminStoreService,
  AdminStoreItemDto,
  StoreCategory,
  StoreItemStatus,
  StoreThemeSource,
  CreateStoreItemBody,
} from "../../../services/admin/store.admin.service";
import { uploadToCloudinary } from "../../../services/cloudinary.service";
import { useAdminTheme } from "./AdminThemeContext";

const MotionBox = motion.create(Box);

const CATEGORY_META: Record<StoreCategory, { label: string; color: string; icon: React.ComponentType<{ size?: number }> }> = {
  Theme:        { label: "Theme",         color: "#a78bfa", icon: Palette  },
  Background:   { label: "Background",    color: "#60a5fa", icon: Image    },
  Sticker:      { label: "Sticker",       color: "#fb923c", icon: Sparkles },
  Effect:       { label: "Effect",        color: "#34d399", icon: Zap      },
  AmbientSound: { label: "Ambient Sound", color: "#f472b6", icon: Volume2  },
};

const STATUS_META: Record<StoreItemStatus, { label: string; color: string; bg: string }> = {
  AdminCreated:  { label: "Admin",    color: "#94a3b8", bg: "rgba(148,163,184,0.12)" },
  PendingReview: { label: "Pending",  color: "#fbbf24", bg: "rgba(251,191,36,0.12)"  },
  Approved:      { label: "Approved", color: "#4ade80", bg: "rgba(74,222,128,0.12)"  },
  Rejected:      { label: "Rejected", color: "#f87171", bg: "rgba(248,113,113,0.12)" },
};

type TabType = "all" | "pending" | StoreCategory;

const TABS: { key: TabType; label: string }[] = [
  { key: "all",          label: "All"         },
  { key: "pending",      label: "Pending"     },
  { key: "Theme",        label: "Themes"      },
  { key: "Background",   label: "Backgrounds" },
  { key: "Sticker",      label: "Stickers"    },
  { key: "Effect",       label: "Effects"     },
  { key: "AmbientSound", label: "Ambient"     },
];

const EMPTY_FORM = {
  category:               "Theme" as StoreCategory,
  themeSource:            "Official" as StoreThemeSource,
  name:                   "",
  description:            "",
  assetUrl:               "",
  previewUrls:            [] as string[],
  themeBackgroundUrl:     "",
  themeStickerUrl:        "",
  themeAmbientUrl:        "",
  themeBackgroundItemId:  "",
  themeStickerItemId:     "",
  themeAmbientSoundItemId: "",
  isPremium:              true,
  coinPrice:              "",
  realMoneyPriceVnd:      "",
  isActive:               true,
};

function parsePreviewUrls(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.filter((u): u is string => !!u);
  } catch {}
  return [raw];
}

/* ── Small reusable pieces ─────────────────────────────────────────────── */

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

/* Backdrop (dark in both themes — standard for modals) */
function ModalBackdrop({ onClose, loading }: { onClose: () => void; loading: boolean }) {
  return (
    <MotionBox position="fixed" inset={0} zIndex={300}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.15 } as any}
      onClick={() => !loading && onClose()}
      style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(6px)" }} />
  );
}

/* Centering wrapper — solves the y-animation + translate(-50%) conflict */
function ModalCenter({ children, zIndex = 310 }: { children: React.ReactNode; zIndex?: number }) {
  return (
    <Box position="fixed" inset={0} display="flex" alignItems="center" justifyContent="center"
      zIndex={zIndex} style={{ pointerEvents: "none" }}>
      <Box style={{ pointerEvents: "auto" }}>
        {children}
      </Box>
    </Box>
  );
}

/* File upload field with Cloudinary progress */
function FileUploadField({ accept, label, value, folder, onChange, onError, existingId }: {
  accept: string;
  label: string;
  value: string;
  folder: string;
  onChange: (url: string) => void;
  onError: (msg: string) => void;
  existingId?: string;
}) {
  const { c, isDark } = useAdminTheme();
  const [progress, setProgress] = useState<number | null>(null);
  const isImage = accept.startsWith("image");
  const inputId = `upload-${label.replace(/\s+/g, "-").toLowerCase()}`;

  const labelSt: React.CSSProperties = {
    fontSize: "0.7rem", color: c.cardTextMuted, letterSpacing: "0.08em",
    fontFamily: "'HarmonyOS Sans', sans-serif", marginBottom: 6, display: "block",
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setProgress(0);
    try {
      const result = await uploadToCloudinary(file, folder, pct => setProgress(pct));
      onChange(result.secure_url);
    } catch (err: any) {
      onError(err.message ?? "Upload failed");
    } finally {
      setProgress(null);
      e.target.value = "";
    }
  };

  return (
    <Box mb={3}>
      <Text as="label" style={labelSt}>{label}</Text>
      {existingId && !value && (
        <Text style={{ fontSize: "0.68rem", color: c.textDim, fontFamily: "'HarmonyOS Sans', sans-serif", marginBottom: 4, display: "block" }}>
          Currently linked · Upload to replace
        </Text>
      )}
      {value && isImage && (
        <Box mb={2} w="80px" h="56px" borderRadius="8px" overflow="hidden"
          style={{ border: `1px solid ${c.cardBorder}` }}>
          <Box as="img" src={value} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </Box>
      )}
      {value && !isImage && (
        <Flex align="center" gap={2} mb={2} px={3} py="6px" borderRadius="8px"
          style={{ background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)", border: `1px solid ${c.cardBorder}`, width: "fit-content" }}>
          <Music size={13} style={{ color: c.textMuted, flexShrink: 0 }} />
          <Text style={{ fontSize: "0.72rem", color: c.textMuted, fontFamily: "'HarmonyOS Sans', sans-serif", maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {value.split("/").pop()}
          </Text>
        </Flex>
      )}
      <Box as="label" htmlFor={inputId} display="inline-flex" alignItems="center" gap={2}
        px={3} py="7px" borderRadius="8px" cursor="pointer"
        style={{ background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)", border: `1px solid ${c.cardBorder}`, color: c.textMuted, opacity: progress !== null ? 0.6 : 1 }}>
        <Upload size={13} />
        <Text style={{ fontSize: "0.78rem", color: c.textMuted, fontFamily: "'HarmonyOS Sans', sans-serif" }}>
          {value ? "Change file" : "Choose file"}
        </Text>
        <Box as="input" id={inputId} type="file" accept={accept}
          onChange={handleFile} style={{ display: "none" }} />
      </Box>
      {progress !== null && (
        <Box mt={2} h="3px" borderRadius="full" overflow="hidden" style={{ background: c.rowDivider }}>
          <Box h="full" borderRadius="full"
            style={{ width: `${progress}%`, background: "#4e7c6a", transition: "width 0.15s" }} />
        </Box>
      )}
    </Box>
  );
}

/* Multi-preview image upload */
function MultiPreviewUpload({ values, onChange, onError, max = 5 }: {
  values: string[];
  onChange: (urls: string[]) => void;
  onError: (msg: string) => void;
  max?: number;
}) {
  const { c, isDark } = useAdminTheme();
  const [progress, setProgress] = useState<number | null>(null);
  const inputId = "multi-preview-upload";

  const labelSt: React.CSSProperties = {
    fontSize: "0.7rem", color: c.cardTextMuted, letterSpacing: "0.08em",
    fontFamily: "'HarmonyOS Sans', sans-serif", marginBottom: 6, display: "block",
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setProgress(0);
    try {
      const result = await uploadToCloudinary(file, "store/previews", pct => setProgress(pct));
      onChange([...values, result.secure_url]);
    } catch (err: any) {
      onError(err.message ?? "Upload failed");
    } finally {
      setProgress(null);
      e.target.value = "";
    }
  };

  const remove = (idx: number) => onChange(values.filter((_, i) => i !== idx));

  return (
    <Box mb={3}>
      <Text as="label" style={labelSt}>PREVIEW IMAGES (Optional · max {max})</Text>
      {values.length > 0 && (
        <Flex gap="8px" flexWrap="wrap" mb={2}>
          {values.map((url, idx) => (
            <Box key={idx} position="relative" w="80px" h="56px" borderRadius="8px" overflow="hidden"
              style={{ border: `1px solid ${c.cardBorder}`, flexShrink: 0 }}>
              <Box as="img" src={url} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              <Box
                as="button"
                onClick={() => remove(idx)}
                position="absolute" top="2px" right="2px"
                w="16px" h="16px" borderRadius="full" border="none" cursor="pointer"
                display="flex" alignItems="center" justifyContent="center"
                style={{ background: "rgba(0,0,0,0.65)", color: "#fff", padding: 0 }}
              >
                <X size={9} />
              </Box>
            </Box>
          ))}
        </Flex>
      )}
      {values.length < max && (
        <Box as="label" htmlFor={inputId} display="inline-flex" alignItems="center" gap={2}
          px={3} py="7px" borderRadius="8px" cursor="pointer"
          style={{ background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)", border: `1px solid ${c.cardBorder}`, color: c.textMuted, opacity: progress !== null ? 0.6 : 1 }}>
          <Upload size={13} />
          <Text style={{ fontSize: "0.78rem", color: c.textMuted, fontFamily: "'HarmonyOS Sans', sans-serif" }}>
            Add preview
          </Text>
          <Box as="input" id={inputId} type="file" accept="image/*"
            onChange={handleFile} style={{ display: "none" }} />
        </Box>
      )}
      {progress !== null && (
        <Box mt={2} h="3px" borderRadius="full" overflow="hidden" style={{ background: c.rowDivider }}>
          <Box h="full" borderRadius="full"
            style={{ width: `${progress}%`, background: "#4e7c6a", transition: "width 0.15s" }} />
        </Box>
      )}
    </Box>
  );
}

/* ── Main section ──────────────────────────────────────────────────────── */

export function ThemesSection() {
  const { c, isDark } = useAdminTheme();

  /* Derived styles that depend on the theme */
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
    background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)",
    color:      c.textMuted,
    fontSize:   "0.82rem",
    fontFamily: "'HarmonyOS Sans', sans-serif",
    border:     `1px solid ${c.cardBorder}`,
    borderRadius: "8px",
    cursor:     "pointer",
    padding:    "8px 16px",
  };
  const closeBtnSt: React.CSSProperties = {
    background: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)",
    color:      c.textMuted,
    width: 28, height: 28, borderRadius: "7px",
    border: "none", cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center",
  };
  const modalBoxSt: React.CSSProperties = {
    background:   c.panelBg,
    backdropFilter: "blur(20px)",
    border:       `1px solid ${c.panelBorder}`,
    boxShadow:    c.panelShadow,
    borderRadius: "16px",
    padding:      24,
  };

  /* ── Data ─────────────────────────────────────────────────────────────── */
  const [items,        setItems]        = useState<AdminStoreItemDto[]>([]);
  const [pendingItems, setPendingItems] = useState<AdminStoreItemDto[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [totalCount,   setTotalCount]   = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [totalPages,   setTotalPages]   = useState(1);

  /* ── Pagination / filters ─────────────────────────────────────────────── */
  const [page, setPage] = useState(1);
  const [tab,  setTab]  = useState<TabType>("all");

  /* ── Theme child IDs (items auto-created as part of a Theme) ─────────── */
  const [themeChildIds, setThemeChildIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    adminStoreService.getItems({ category: "Theme", includeInactive: true, page: 1, pageSize: 500 })
      .then(r => {
        const ids = new Set<string>();
        r.items.forEach(item => {
          if (item.themeBackgroundItemId)   ids.add(item.themeBackgroundItemId);
          if (item.themeStickerItemId)       ids.add(item.themeStickerItemId);
          if (item.themeAmbientSoundItemId)  ids.add(item.themeAmbientSoundItemId);
        });
        setThemeChildIds(ids);
      })
      .catch(() => {});
  }, []);

  /* ── Create / Edit ────────────────────────────────────────────────────── */
  const [showForm,    setShowForm]    = useState(false);
  const [editTarget,  setEditTarget]  = useState<AdminStoreItemDto | null>(null);
  const [form,        setForm]        = useState({ ...EMPTY_FORM });
  const [formLoading, setFormLoading] = useState(false);
  const [formError,   setFormError]   = useState<string | null>(null);
  const [priceErrors, setPriceErrors] = useState({ coin: false, vnd: false });

  /* ── Approve ──────────────────────────────────────────────────────────── */
  const [approveTarget,  setApproveTarget]  = useState<AdminStoreItemDto | null>(null);
  const [approveLoading, setApproveLoading] = useState(false);
  const [approveForm,    setApproveForm]    = useState({ isPremium: false, coinPrice: "", realMoneyPriceVnd: "" });

  /* ── Reject ───────────────────────────────────────────────────────────── */
  const [rejectTarget,  setRejectTarget]  = useState<AdminStoreItemDto | null>(null);
  const [rejectLoading, setRejectLoading] = useState(false);
  const [rejectNote,    setRejectNote]    = useState("");

  /* ── Delete ───────────────────────────────────────────────────────────── */
  const [deleteTarget,  setDeleteTarget]  = useState<AdminStoreItemDto | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  /* ── Load pending ─────────────────────────────────────────────────────── */
  const refreshPending = () => {
    adminStoreService.getPendingItems({ page: 1, pageSize: 100 })
      .then(r => { setPendingItems(r.items); setPendingCount(r.totalCount); })
      .catch(() => {});
  };

  useEffect(() => { refreshPending(); }, []);

  /* ── Load main list ───────────────────────────────────────────────────── */
  useEffect(() => {
    if (tab === "pending") { setLoading(false); return; }
    let cancelled = false;
    setLoading(true);
    const category = tab !== "all" ? (tab as StoreCategory) : undefined;
    adminStoreService.getItems({ category, includeInactive: true, page, pageSize: 20 })
      .then(r => {
        if (cancelled) return;
        setItems(r.items);
        setTotalCount(r.totalCount);
        setTotalPages(r.totalPages);
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [tab, page]);

  const changeTab = (t: TabType) => { setTab(t); setPage(1); };

  /* ── Helpers ──────────────────────────────────────────────────────────── */
  const openCreate = () => {
    setForm({ ...EMPTY_FORM });
    setEditTarget(null);
    setFormError(null);
    setPriceErrors({ coin: false, vnd: false });
    setShowForm(true);
  };

  const openEdit = (item: AdminStoreItemDto) => {
    setForm({
      category:               item.category,
      themeSource:            item.themeSource ?? "Official",
      name:                   item.name ?? "",
      description:            item.description ?? "",
      assetUrl:               item.assetUrl ?? "",
      previewUrls:            parsePreviewUrls(item.previewUrl),
      themeBackgroundUrl:     "",
      themeStickerUrl:        "",
      themeAmbientUrl:        "",
      themeBackgroundItemId:  item.themeBackgroundItemId  ?? "",
      themeStickerItemId:     item.themeStickerItemId     ?? "",
      themeAmbientSoundItemId: item.themeAmbientSoundItemId ?? "",
      isPremium:              item.isPremium,
      coinPrice:              item.coinPrice != null ? String(item.coinPrice) : "",
      realMoneyPriceVnd:      item.realMoneyPriceVnd != null ? String(item.realMoneyPriceVnd) : "",
      isActive:               item.isActive,
    });
    setEditTarget(item);
    setFormError(null);
    setPriceErrors({ coin: false, vnd: false });
    setShowForm(true);
  };

  /* ── CRUD ─────────────────────────────────────────────────────────────── */
  const handleFormSave = async () => {
    if (!form.name.trim()) { setFormError("Name is required."); return; }

    const coinNum = Number(form.coinPrice);
    const vndNum  = Number(form.realMoneyPriceVnd);
    const coinInvalid = !form.coinPrice.trim() || isNaN(coinNum) || coinNum <= 0;
    const vndInvalid  = !form.realMoneyPriceVnd.trim() || isNaN(vndNum) || vndNum <= 0;
    if (coinInvalid || vndInvalid) {
      setPriceErrors({ coin: coinInvalid, vnd: vndInvalid });
      setFormError("Coin Price and VND Price are required and must be greater than 0.");
      return;
    }

    setFormLoading(true);
    setFormError(null);
    setPriceErrors({ coin: false, vnd: false });

    let bgId  = form.themeBackgroundItemId   || null;
    let stId  = form.themeStickerItemId      || null;
    let ambId = form.themeAmbientSoundItemId || null;

    try {
      if (form.category === "Theme") {
        const themeName = form.name.trim();
        if (form.themeBackgroundUrl) {
          const it = await adminStoreService.createItem({
            category: "Background", themeSource: "Official",
            name: `${themeName} – Background`,
            description: null, assetUrl: form.themeBackgroundUrl,
            isPremium: false, coinPrice: null, realMoneyPriceVnd: null, isActive: true,
          });
          bgId = it.id;
        }
        if (form.themeStickerUrl) {
          const it = await adminStoreService.createItem({
            category: "Sticker", themeSource: "Official",
            name: `${themeName} – Sticker`,
            description: null, assetUrl: form.themeStickerUrl,
            isPremium: false, coinPrice: null, realMoneyPriceVnd: null, isActive: true,
          });
          stId = it.id;
        }
        if (form.themeAmbientUrl) {
          const it = await adminStoreService.createItem({
            category: "AmbientSound", themeSource: "Official",
            name: `${themeName} – Ambient Sound`,
            description: null, assetUrl: form.themeAmbientUrl,
            isPremium: false, coinPrice: null, realMoneyPriceVnd: null, isActive: true,
          });
          ambId = it.id;
        }
      }

      const body: CreateStoreItemBody = {
        category:               form.category,
        themeSource:            "Official",
        name:                   form.name.trim() || null,
        description:            form.description.trim() || null,
        assetUrl:               form.assetUrl.trim() || null,
        previewUrl:             form.previewUrls.length > 0 ? JSON.stringify(form.previewUrls) : null,
        themeBackgroundItemId:  bgId,
        themeStickerItemId:     stId,
        themeAmbientSoundItemId: ambId,
        isPremium:              form.isPremium,
        coinPrice:              form.coinPrice !== "" ? Number(form.coinPrice) : null,
        realMoneyPriceVnd:      form.realMoneyPriceVnd !== "" ? Number(form.realMoneyPriceVnd) : null,
        isActive:               form.isActive,
      };

      if (editTarget) {
        const updated = await adminStoreService.updateItem(editTarget.id, body);
        setItems(prev => prev.map(i => i.id === updated.id ? updated : i));
      } else {
        const created = await adminStoreService.createItem(body);
        setItems(prev => [created, ...prev]);
        setTotalCount(n => n + 1);
        if (form.category === "Theme") {
          setThemeChildIds(prev => {
            const next = new Set(prev);
            if (bgId)  next.add(bgId);
            if (stId)  next.add(stId);
            if (ambId) next.add(ambId);
            return next;
          });
        }
      }
      setShowForm(false);
    } catch (e: any) {
      setFormError(e?.response?.data?.message ?? "Failed to save item.");
    } finally {
      setFormLoading(false);
    }
  };

  const handleToggleActive = async (item: AdminStoreItemDto) => {
    try {
      const updated = await adminStoreService.updateItem(item.id, {
        category: item.category, themeSource: item.themeSource ?? "Official",
        name: item.name, description: item.description, assetUrl: item.assetUrl,
        themeBackgroundItemId: item.themeBackgroundItemId,
        themeStickerItemId: item.themeStickerItemId,
        themeAmbientSoundItemId: item.themeAmbientSoundItemId,
        isPremium: item.isPremium, coinPrice: item.coinPrice,
        realMoneyPriceVnd: item.realMoneyPriceVnd, isActive: !item.isActive,
      });
      setItems(prev => prev.map(i => i.id === updated.id ? updated : i));
    } catch { }
  };

  const handleApprove = async () => {
    if (!approveTarget) return;
    setApproveLoading(true);
    try {
      await adminStoreService.approveItem(approveTarget.id, {
        isPremium:         approveForm.isPremium,
        coinPrice:         approveForm.coinPrice !== "" ? Number(approveForm.coinPrice) : null,
        realMoneyPriceVnd: approveForm.realMoneyPriceVnd !== "" ? Number(approveForm.realMoneyPriceVnd) : null,
      });
      setPendingItems(prev => prev.filter(i => i.id !== approveTarget.id));
      setPendingCount(n => n - 1);
      setApproveTarget(null);
    } catch { } finally { setApproveLoading(false); }
  };

  const handleReject = async () => {
    if (!rejectTarget || !rejectNote.trim()) return;
    setRejectLoading(true);
    try {
      await adminStoreService.rejectItem(rejectTarget.id, { rejectionNote: rejectNote.trim() });
      setPendingItems(prev => prev.filter(i => i.id !== rejectTarget.id));
      setPendingCount(n => n - 1);
      setRejectTarget(null);
      setRejectNote("");
    } catch { } finally { setRejectLoading(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await adminStoreService.deleteItem(deleteTarget.id);
      setItems(prev => prev.filter(i => i.id !== deleteTarget.id));
      setTotalCount(n => n - 1);
      setDeleteTarget(null);
    } catch { } finally { setDeleteLoading(false); }
  };

  const displayItems = tab === "pending"
    ? pendingItems
    : items.filter(item => !themeChildIds.has(item.id));

  /* ── Render ───────────────────────────────────────────────────────────── */
  return (
    <Box>
      {/* Stats + Add button */}
      <Flex align="center" justify="space-between" mb={5}>
        <Flex gap={3}>
          {[
            { label: "Total Items",    value: totalCount,   color: c.cardText  },
            { label: "Pending Review", value: pendingCount, color: "#fbbf24"   },
          ].map(s => (
            <Box key={s.label} borderRadius="9px" px={4} py="10px"
              style={{ background: c.cardBg, border: `1px solid ${c.cardBorder}` }}>
              <Text style={{ fontSize: "1.1rem", color: s.color, fontWeight: 600, fontFamily: "'HarmonyOS Sans', sans-serif" }}>
                {s.value}
              </Text>
              <Text style={{ fontSize: "0.68rem", color: c.textMuted, fontFamily: "'HarmonyOS Sans', sans-serif" }}>
                {s.label}
              </Text>
            </Box>
          ))}
        </Flex>

        <Box as="button" onClick={openCreate} display="flex" alignItems="center" gap={2}
          px={4} py="10px" borderRadius="9px" border="none" cursor="pointer" transition="all 0.2s"
          style={{ background: "rgba(78,124,106,0.18)", outline: "1px solid rgba(78,124,106,0.35)", color: "#4e7c6a" }}>
          <Plus size={15} />
          <Text style={{ fontSize: "0.82rem", color: "#4e7c6a", fontFamily: "'HarmonyOS Sans', sans-serif" }}>Add Item</Text>
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
            <Flex align="center" gap="5px">
              <Text style={{
                fontSize:   "0.78rem",
                color:      tab === t.key ? c.accent : c.textMuted,
                fontFamily: "'HarmonyOS Sans', sans-serif",
              }}>
                {t.label}
              </Text>
              {t.key === "pending" && pendingCount > 0 && (
                <Box borderRadius="full" px="6px" py="1px"
                  style={{ background: "rgba(251,191,36,0.2)", border: "1px solid rgba(251,191,36,0.3)" }}>
                  <Text style={{ fontSize: "0.6rem", color: "#fbbf24" }}>{pendingCount}</Text>
                </Box>
              )}
            </Flex>
          </Box>
        ))}
      </Flex>

      {/* Table */}
      {loading ? (
        <Flex justify="center" py={14}>
          <Text style={{ color: c.textMuted, fontSize: "0.85rem", fontFamily: "'HarmonyOS Sans', sans-serif" }}>Loading…</Text>
        </Flex>
      ) : displayItems.length === 0 ? (
        <Flex justify="center" py={14}>
          <Text style={{ color: c.textDim, fontSize: "0.85rem", fontFamily: "'HarmonyOS Sans', sans-serif" }}>
            {tab === "pending" ? "No items pending review" : "No items found"}
          </Text>
        </Flex>
      ) : (
        <Box borderRadius="12px" overflow="hidden"
          style={{ border: `1px solid ${c.cardBorder}`, background: c.cardBg }}>
          {/* Header */}
          <Flex px={4} py={3} style={{ borderBottom: `1px solid ${c.rowDivider}` }}>
            {[
              { label: "ITEM",     flex: 3 },
              { label: "CATEGORY", flex: 1 },
              { label: "STATUS",   flex: 1 },
              { label: "PRICE",    flex: 1 },
              { label: tab === "pending" ? "CREATOR" : "ACTIVE", flex: 1 },
            ].map(col => (
              <Box key={col.label} flex={col.flex}>
                <Text style={{ fontSize: "0.65rem", color: c.textDim, letterSpacing: "0.1em", fontFamily: "'HarmonyOS Sans', sans-serif" }}>
                  {col.label}
                </Text>
              </Box>
            ))}
            <Box w="96px" />
          </Flex>

          {/* Rows */}
          {displayItems.map((item, idx) => {
            const catMeta    = CATEGORY_META[item.category];
            const statusMeta = STATUS_META[item.status];
            return (
              <Flex key={item.id} align="center" px={4} py="12px" transition="background 0.15s"
                style={{ borderBottom: idx < displayItems.length - 1 ? `1px solid ${c.rowDivider}` : "none" }}
                _hover={{ background: isDark ? "rgba(255,255,255,0.025)" : "rgba(0,0,0,0.02)" } as any}>

                {/* Item thumbnail + name */}
                <Flex flex={3} align="center" gap={3} minW={0}>
                  <Box w="36px" h="36px" borderRadius="8px" flexShrink={0} overflow="hidden"
                    style={{ background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)", border: `1px solid ${c.cardBorder}` }}>
                    {item.assetUrl ? (
                      <Box as="img" src={item.assetUrl}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <Flex w="full" h="full" align="center" justify="center">
                        <Text style={{ fontSize: "0.68rem", color: c.textDim }}>–</Text>
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
                    {item.isPremium && (
                      <Text style={{ fontSize: "0.62rem", color: "#a78bfa", fontFamily: "'HarmonyOS Sans', sans-serif" }}>
                        Premium
                      </Text>
                    )}
                  </Box>
                </Flex>

                {/* Category badge */}
                <Box flex={1}>
                  <Box display="inline-flex" borderRadius="full" px="8px" py="2px"
                    style={{ background: `${catMeta.color}18`, border: `1px solid ${catMeta.color}35` }}>
                    <Text style={{ fontSize: "0.65rem", color: catMeta.color, fontFamily: "'HarmonyOS Sans', sans-serif" }}>
                      {catMeta.label}
                    </Text>
                  </Box>
                </Box>

                {/* Status badge */}
                <Box flex={1}>
                  <Box display="inline-flex" borderRadius="full" px="8px" py="2px"
                    style={{ background: statusMeta.bg, border: `1px solid ${statusMeta.color}35` }}>
                    <Text style={{ fontSize: "0.65rem", color: statusMeta.color, fontFamily: "'HarmonyOS Sans', sans-serif" }}>
                      {statusMeta.label}
                    </Text>
                  </Box>
                </Box>

                {/* Price */}
                <Box flex={1}>
                  {item.coinPrice ? (
                    <Text style={{ fontSize: "0.78rem", color: "#d97706", fontFamily: "'HarmonyOS Sans', sans-serif" }}>
                      {item.coinPrice} coins
                    </Text>
                  ) : item.realMoneyPriceVnd ? (
                    <Text style={{ fontSize: "0.78rem", color: "#16a34a", fontFamily: "'HarmonyOS Sans', sans-serif" }}>
                      {item.realMoneyPriceVnd.toLocaleString()}đ
                    </Text>
                  ) : (
                    <Text style={{ fontSize: "0.78rem", color: c.textDim, fontFamily: "'HarmonyOS Sans', sans-serif" }}>
                      Free
                    </Text>
                  )}
                </Box>

                {/* Active dot / Creator */}
                <Box flex={1}>
                  {tab === "pending" ? (
                    <Text style={{ fontSize: "0.78rem", color: c.textMuted, fontFamily: "'HarmonyOS Sans', sans-serif" }}>
                      {item.creatorUsername ?? "—"}
                    </Text>
                  ) : (
                    <Box w="8px" h="8px" borderRadius="full"
                      style={{
                        background: item.isActive ? "#22c55e" : "#94a3b8",
                        boxShadow:  item.isActive ? "0 0 5px #22c55e" : "none",
                      }} />
                  )}
                </Box>

                {/* Actions */}
                <Flex w="96px" justify="flex-end" gap="4px">
                  {tab === "pending" ? (
                    <>
                      <Box as="button"
                        onClick={() => { setApproveTarget(item); setApproveForm({ isPremium: false, coinPrice: "", realMoneyPriceVnd: "" }); }}
                        display="flex" alignItems="center" justifyContent="center"
                        w="28px" h="28px" borderRadius="7px" border="none" cursor="pointer" title="Approve"
                        style={{ background: "rgba(74,222,128,0.12)", color: "#16a34a" }}>
                        <Check size={13} />
                      </Box>
                      <Box as="button"
                        onClick={() => { setRejectTarget(item); setRejectNote(""); }}
                        display="flex" alignItems="center" justifyContent="center"
                        w="28px" h="28px" borderRadius="7px" border="none" cursor="pointer" title="Reject"
                        style={{ background: "rgba(248,113,113,0.12)", color: "#dc2626" }}>
                        <X size={13} />
                      </Box>
                    </>
                  ) : (
                    <>
                      <Box as="button" onClick={() => openEdit(item)}
                        display="flex" alignItems="center" justifyContent="center"
                        w="28px" h="28px" borderRadius="7px" border="none" cursor="pointer" title="Edit"
                        style={{ background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)", color: c.textMuted }}>
                        <Edit2 size={12} />
                      </Box>
                      <Box as="button" onClick={() => handleToggleActive(item)}
                        display="flex" alignItems="center" justifyContent="center"
                        w="28px" h="28px" borderRadius="7px" border="none" cursor="pointer"
                        title={item.isActive ? "Deactivate" : "Activate"}
                        style={{ background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)", color: item.isActive ? "#22c55e" : "#94a3b8" }}>
                        {item.isActive ? <Eye size={13} /> : <EyeOff size={13} />}
                      </Box>
                      <Box as="button" onClick={() => setDeleteTarget(item)}
                        display="flex" alignItems="center" justifyContent="center"
                        w="28px" h="28px" borderRadius="7px" border="none" cursor="pointer" title="Delete"
                        style={{ background: "rgba(248,113,113,0.08)", color: "#dc2626" }}>
                        <Trash2 size={12} />
                      </Box>
                    </>
                  )}
                </Flex>
              </Flex>
            );
          })}
        </Box>
      )}

      {/* Pagination */}
      {tab !== "pending" && totalPages > 1 && (
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

      {/* ═══ Create / Edit Modal ══════════════════════════════════════════ */}
      <AnimatePresence>
        {showForm && (
          <>
            <ModalBackdrop onClose={() => setShowForm(false)} loading={formLoading} />
            <ModalCenter>
              <MotionBox
                style={{ width: "660px", maxHeight: "88vh", overflowY: "auto" }}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1    }}
                exit={   { opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2, ease: [0.4,0,0.2,1] } as any}>
                <Box style={modalBoxSt}>
                  <Flex align="center" justify="space-between" mb={5}>
                    <Text style={{ fontSize: "0.9rem", color: c.text, fontWeight: 600, fontFamily: "'HarmonyOS Sans', sans-serif" }}>
                      {editTarget ? "Edit Item" : "Create Item"}
                    </Text>
                    <Box as="button" onClick={() => !formLoading && setShowForm(false)} style={closeBtnSt}>
                      <X size={13} />
                    </Box>
                  </Flex>

                  {/* Category */}
                  <Box mb={3}>
                    <Text as="label" style={labelSt}>CATEGORY</Text>
                    <Box as="select" value={form.category}
                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                        setForm(f => ({
                          ...f,
                          category:               e.target.value as StoreCategory,
                          themeBackgroundUrl:     "",
                          themeStickerUrl:        "",
                          themeAmbientUrl:        "",
                          themeBackgroundItemId:  "",
                          themeStickerItemId:     "",
                          themeAmbientSoundItemId: "",
                          assetUrl:               "",
                        }));
                      }}
                      style={inputSt}>
                      {(Object.keys(CATEGORY_META) as StoreCategory[]).filter(cat => cat !== "Effect").map(cat => (
                        <option key={cat} value={cat} style={{ color: "#111", background: "#fff" }}>{CATEGORY_META[cat].label}</option>
                      ))}
                    </Box>
                  </Box>


                  {/* Name */}
                  <Box mb={3}>
                    <Text as="label" style={labelSt}>NAME *</Text>
                    <Box as="input" value={form.name}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm(f => ({ ...f, name: e.target.value }))}
                      placeholder="Item name" style={inputSt} />
                  </Box>

                  {/* Description */}
                  <Box mb={3}>
                    <Text as="label" style={labelSt}>DESCRIPTION</Text>
                    <Box as="textarea" value={form.description} rows={2}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setForm(f => ({ ...f, description: e.target.value }))}
                      placeholder="Optional description"
                      style={{ ...inputSt, height: "auto", padding: "8px 12px", resize: "vertical" }} />
                  </Box>

                  {/* Asset — varies by category */}
                  {form.category === "Theme" ? (
                    <>
                      <FileUploadField
                        accept="image/*"
                        label="THEME THUMBNAIL (Optional)"
                        value={form.assetUrl}
                        folder="store/themes"
                        onChange={(url) => setForm(f => ({ ...f, assetUrl: url }))}
                        onError={(msg) => setFormError(msg)}
                      />
                      <FileUploadField
                        accept="image/*"
                        label="BACKGROUND IMAGE"
                        value={form.themeBackgroundUrl}
                        folder="store/backgrounds"
                        onChange={(url) => setForm(f => ({ ...f, themeBackgroundUrl: url }))}
                        onError={(msg) => setFormError(msg)}
                        existingId={form.themeBackgroundItemId}
                      />
                      <FileUploadField
                        accept="image/*"
                        label="STICKER IMAGE"
                        value={form.themeStickerUrl}
                        folder="store/stickers"
                        onChange={(url) => setForm(f => ({ ...f, themeStickerUrl: url }))}
                        onError={(msg) => setFormError(msg)}
                        existingId={form.themeStickerItemId}
                      />
                      <FileUploadField
                        accept="audio/*"
                        label="AMBIENT SOUND"
                        value={form.themeAmbientUrl}
                        folder="store/ambient"
                        onChange={(url) => setForm(f => ({ ...f, themeAmbientUrl: url }))}
                        onError={(msg) => setFormError(msg)}
                        existingId={form.themeAmbientSoundItemId}
                      />
                      <MultiPreviewUpload
                        values={form.previewUrls}
                        onChange={(urls) => setForm(f => ({ ...f, previewUrls: urls }))}
                        onError={(msg) => setFormError(msg)}
                      />
                    </>
                  ) : form.category === "Background" ? (
                    <>
                      <FileUploadField
                        accept="image/*"
                        label="BACKGROUND IMAGE"
                        value={form.assetUrl}
                        folder="store/backgrounds"
                        onChange={(url) => setForm(f => ({ ...f, assetUrl: url }))}
                        onError={(msg) => setFormError(msg)}
                      />
                      <MultiPreviewUpload
                        values={form.previewUrls}
                        onChange={(urls) => setForm(f => ({ ...f, previewUrls: urls }))}
                        onError={(msg) => setFormError(msg)}
                      />
                    </>
                  ) : form.category === "Sticker" ? (
                    <>
                      <FileUploadField
                        accept="image/*"
                        label="STICKER IMAGE"
                        value={form.assetUrl}
                        folder="store/stickers"
                        onChange={(url) => setForm(f => ({ ...f, assetUrl: url }))}
                        onError={(msg) => setFormError(msg)}
                      />
                      <MultiPreviewUpload
                        values={form.previewUrls}
                        onChange={(urls) => setForm(f => ({ ...f, previewUrls: urls }))}
                        onError={(msg) => setFormError(msg)}
                      />
                    </>
                  ) : form.category === "AmbientSound" ? (
                    <>
                      <FileUploadField
                        accept="audio/*"
                        label="AUDIO FILE"
                        value={form.assetUrl}
                        folder="store/ambient"
                        onChange={(url) => setForm(f => ({ ...f, assetUrl: url }))}
                        onError={(msg) => setFormError(msg)}
                      />
                      <MultiPreviewUpload
                        values={form.previewUrls}
                        onChange={(urls) => setForm(f => ({ ...f, previewUrls: urls }))}
                        onError={(msg) => setFormError(msg)}
                      />
                    </>
                  ) : (
                    /* Effect */
                    <Box mb={3}>
                      <Text as="label" style={labelSt}>ASSET URL</Text>
                      <Box as="input" value={form.assetUrl}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm(f => ({ ...f, assetUrl: e.target.value }))}
                        placeholder="https://..." style={inputSt} />
                    </Box>
                  )}

                  {/* Prices */}
                  <Flex gap={3} mb={3}>
                    <Box flex={1}>
                      <Text as="label" style={{ ...labelSt, color: priceErrors.coin ? "#dc2626" : labelSt.color }}>COIN PRICE *</Text>
                      <Box as="input" {...{ type: "number", min: 0 }} value={form.coinPrice}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                          setForm(f => ({ ...f, coinPrice: e.target.value }));
                          if (priceErrors.coin) setPriceErrors(p => ({ ...p, coin: false }));
                        }}
                        placeholder="e.g. 50"
                        style={{ ...inputSt, border: priceErrors.coin ? "1px solid #dc2626" : inputSt.border }} />
                    </Box>
                    <Box flex={1}>
                      <Text as="label" style={{ ...labelSt, color: priceErrors.vnd ? "#dc2626" : labelSt.color }}>VND PRICE *</Text>
                      <Box as="input" {...{ type: "number", min: 0 }} value={form.realMoneyPriceVnd}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                          setForm(f => ({ ...f, realMoneyPriceVnd: e.target.value }));
                          if (priceErrors.vnd) setPriceErrors(p => ({ ...p, vnd: false }));
                        }}
                        placeholder="e.g. 29000"
                        style={{ ...inputSt, border: priceErrors.vnd ? "1px solid #dc2626" : inputSt.border }} />
                    </Box>
                  </Flex>

                  {/* Toggles */}
                  <Flex gap={5} mb={5}>
                    <Toggle value={form.isActive} onChange={() => setForm(f => ({ ...f, isActive: !f.isActive }))} label="Active" textColor={c.textMuted} />
                  </Flex>

                  {formError && (
                    <Text mb={3} style={{ fontSize: "0.78rem", color: "#dc2626", fontFamily: "'HarmonyOS Sans', sans-serif" }}>
                      {formError}
                    </Text>
                  )}

                  <Flex justify="flex-end" gap={2} pt={4} style={{ borderTop: `1px solid ${c.border}` }}>
                    <Box as="button" onClick={() => !formLoading && setShowForm(false)} style={cancelBtnSt}>
                      Cancel
                    </Box>
                    <Box as="button" onClick={handleFormSave} disabled={formLoading}
                      display="flex" alignItems="center" gap={2}
                      px={4} py="8px" borderRadius="8px" border="none" cursor="pointer" transition="all 0.2s"
                      style={{
                        background: "rgba(78,124,106,0.22)", outline: "1px solid rgba(78,124,106,0.45)",
                        color: "#4e7c6a", fontSize: "0.82rem", fontFamily: "'HarmonyOS Sans', sans-serif",
                        opacity: formLoading ? 0.6 : 1,
                      }}>
                      <Check size={13} />
                      {formLoading ? "Saving…" : editTarget ? "Save Changes" : "Create"}
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
            <ModalCenter>
              <MotionBox style={{ width: "400px" }}
                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.18, ease: [0.4,0,0.2,1] } as any}>
                <Box style={modalBoxSt}>
                  <Flex align="center" justify="space-between" mb={4}>
                    <Text style={{ fontSize: "0.9rem", color: "#16a34a", fontWeight: 600, fontFamily: "'HarmonyOS Sans', sans-serif" }}>
                      Approve Item
                    </Text>
                    <Box as="button" onClick={() => !approveLoading && setApproveTarget(null)} style={closeBtnSt}>
                      <X size={13} />
                    </Box>
                  </Flex>
                  <Text mb={4} style={{ fontSize: "0.82rem", color: c.textMuted, fontFamily: "'HarmonyOS Sans', sans-serif" }}>
                    Approving: <span style={{ color: c.text }}>{approveTarget.name}</span>
                  </Text>
                  <Flex gap={3} mb={4}>
                    <Box flex={1}>
                      <Text as="label" style={labelSt}>COIN PRICE</Text>
                      <Box as="input" type="number" min={0} value={approveForm.coinPrice}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setApproveForm(f => ({ ...f, coinPrice: e.target.value }))}
                        placeholder="Optional" style={inputSt} />
                    </Box>
                    <Box flex={1}>
                      <Text as="label" style={labelSt}>VND PRICE</Text>
                      <Box as="input" type="number" min={0} value={approveForm.realMoneyPriceVnd}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setApproveForm(f => ({ ...f, realMoneyPriceVnd: e.target.value }))}
                        placeholder="Optional" style={inputSt} />
                    </Box>
                  </Flex>
                  <Box mb={5}>
                    <Toggle value={approveForm.isPremium} onChange={() => setApproveForm(f => ({ ...f, isPremium: !f.isPremium }))} label="Premium" textColor={c.textMuted} />
                  </Box>
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
            <ModalCenter>
              <MotionBox style={{ width: "400px" }}
                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.18, ease: [0.4,0,0.2,1] } as any}>
                <Box style={modalBoxSt}>
                  <Flex align="center" justify="space-between" mb={4}>
                    <Text style={{ fontSize: "0.9rem", color: "#dc2626", fontWeight: 600, fontFamily: "'HarmonyOS Sans', sans-serif" }}>
                      Reject Item
                    </Text>
                    <Box as="button" onClick={() => !rejectLoading && setRejectTarget(null)} style={closeBtnSt}>
                      <X size={13} />
                    </Box>
                  </Flex>
                  <Text mb={4} style={{ fontSize: "0.82rem", color: c.textMuted, fontFamily: "'HarmonyOS Sans', sans-serif" }}>
                    Rejecting: <span style={{ color: c.text }}>{rejectTarget.name}</span>
                  </Text>
                  <Box mb={5}>
                    <Text as="label" style={labelSt}>REJECTION REASON *</Text>
                    <Box as="textarea" value={rejectNote} rows={3}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setRejectNote(e.target.value)}
                      placeholder="Explain why this item is rejected…"
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

      {/* ═══ Delete Confirm ═══════════════════════════════════════════════ */}
      <AnimatePresence>
        {deleteTarget && (
          <>
            <ModalBackdrop onClose={() => setDeleteTarget(null)} loading={deleteLoading} />
            <ModalCenter>
              <MotionBox style={{ width: "360px" }}
                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.18, ease: [0.4,0,0.2,1] } as any}>
                <Box style={modalBoxSt}>
                  <Text mb={2} style={{ fontSize: "0.9rem", color: "#dc2626", fontWeight: 600, fontFamily: "'HarmonyOS Sans', sans-serif" }}>
                    Delete Item
                  </Text>
                  <Text mb={5} style={{ fontSize: "0.82rem", color: c.textMuted, lineHeight: 1.6, fontFamily: "'HarmonyOS Sans', sans-serif" }}>
                    Are you sure you want to delete{" "}
                    <span style={{ color: c.text }}>{deleteTarget.name}</span>?
                    This cannot be undone.
                  </Text>
                  <Flex justify="flex-end" gap={2}>
                    <Box as="button" onClick={() => !deleteLoading && setDeleteTarget(null)} style={cancelBtnSt}>Cancel</Box>
                    <Box as="button" onClick={handleDelete} disabled={deleteLoading}
                      display="flex" alignItems="center" gap={2}
                      px={4} py="8px" borderRadius="8px" border="none" cursor="pointer"
                      style={{ background: "rgba(248,113,113,0.15)", outline: "1px solid rgba(248,113,113,0.4)", color: "#dc2626", fontSize: "0.82rem", fontFamily: "'HarmonyOS Sans', sans-serif", opacity: deleteLoading ? 0.6 : 1 }}>
                      <Trash2 size={13} />
                      {deleteLoading ? "Deleting…" : "Delete"}
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
