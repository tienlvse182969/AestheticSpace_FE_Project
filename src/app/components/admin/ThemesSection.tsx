import { useState, useEffect, useRef } from "react";
import { Box, Flex, Text } from "@chakra-ui/react";
import { motion, AnimatePresence } from "motion/react";
import { Plus, Edit2, Trash2, Eye, EyeOff, Check, X, ChevronLeft, ChevronRight, Palette, Image, Sticker, Zap, Volume2, Upload, Music, Play, Pause, Search } from "lucide-react";
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
  Sticker:      { label: "Sticker",       color: "#fb923c", icon: Sticker  },
  Effect:       { label: "Effect",        color: "#34d399", icon: Zap      },
  AmbientSound: { label: "Ambient Sound", color: "#f472b6", icon: Volume2  },
};

const STATUS_META: Record<StoreItemStatus, { label: string; color: string; bg: string }> = {
  AdminCreated:  { label: "Admin",    color: "#94a3b8", bg: "rgba(148,163,184,0.12)" },
  PendingReview: { label: "Pending",  color: "#fbbf24", bg: "rgba(251,191,36,0.12)"  },
  Approved:      { label: "Approved", color: "#4ade80", bg: "rgba(74,222,128,0.12)"  },
  Rejected:      { label: "Rejected", color: "#f87171", bg: "rgba(248,113,113,0.12)" },
};

type TabType = "all" | StoreCategory;

const TABS: { key: TabType; label: string }[] = [
  { key: "all",          label: "All"         },
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
  themeBackgroundUrls:    [] as string[],
  themeStickerUrls:       [] as string[],
  themeAmbientUrls:       [] as string[],
  themeBackgroundExistingUrls:  [] as string[],
  themeStickerExistingUrls:     [] as string[],
  themeAmbientExistingUrls:     [] as string[],
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

  const handleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []).slice(0, max - values.length);
    if (!files.length) return;
    setProgress(0);
    const newUrls: string[] = [];
    try {
      for (let i = 0; i < files.length; i++) {
        const result = await uploadToCloudinary(files[i], "store/previews", pct =>
          setProgress(Math.round((i / files.length) * 100 + pct / files.length))
        );
        newUrls.push(result.secure_url);
      }
      onChange([...values, ...newUrls]);
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
          <input id={inputId} type="file" accept="image/*" multiple
            onChange={handleFiles} style={{ display: "none" }} />
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

/* Multi-image upload (backgrounds / stickers) */
function MultiImageUpload({ label, values, folder, onChange, onError, existingId }: {
  label: string; values: string[]; folder: string;
  onChange: (urls: string[]) => void; onError: (msg: string) => void; existingId?: string;
}) {
  const { c, isDark } = useAdminTheme();
  const [progress, setProgress] = useState<number | null>(null);
  const uid = `multi-img-${label.replace(/\s+/g,"-").toLowerCase()}`;

  const labelSt: React.CSSProperties = {
    fontSize: "0.7rem", color: c.cardTextMuted, letterSpacing: "0.08em",
    fontFamily: "'HarmonyOS Sans', sans-serif", marginBottom: 6, display: "block",
  };

  const handleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setProgress(0);
    const newUrls: string[] = [];
    try {
      for (let i = 0; i < files.length; i++) {
        const result = await uploadToCloudinary(files[i], folder, pct =>
          setProgress(Math.round((i / files.length) * 100 + pct / files.length))
        );
        newUrls.push(result.secure_url);
      }
      onChange([...values, ...newUrls]);
    } catch (err: any) {
      onError(err.message ?? "Upload failed");
    } finally { setProgress(null); e.target.value = ""; }
  };

  const remove = (idx: number) => onChange(values.filter((_, i) => i !== idx));

  return (
    <Box mb={3}>
      <Text as="label" style={labelSt}>{label}</Text>
      {existingId && values.length === 0 && (
        <Text style={{ fontSize: "0.68rem", color: c.textDim, fontFamily: "'HarmonyOS Sans', sans-serif", marginBottom: 4, display: "block" }}>
          1 item currently linked · Upload to replace
        </Text>
      )}
      {values.length > 0 && (
        <Flex gap="8px" flexWrap="wrap" mb={2}>
          {values.map((url, idx) => (
            <Box key={idx} position="relative" w="80px" h="56px" borderRadius="8px" overflow="hidden"
              style={{ border: `1px solid ${c.cardBorder}`, flexShrink: 0 }}>
              <Box as="img" {...{ src: url }} style={{ width: "100%", height: "100%", objectFit: "cover" as const }} />
              <Box as="button" onClick={() => remove(idx)}
                position="absolute" top="2px" right="2px" w="16px" h="16px" borderRadius="full"
                border="none" cursor="pointer" display="flex" alignItems="center" justifyContent="center"
                style={{ background: "rgba(0,0,0,0.65)", color: "#fff", padding: 0 }}>
                <X size={9} />
              </Box>
            </Box>
          ))}
        </Flex>
      )}
      <Box as="label" htmlFor={uid} display="inline-flex" alignItems="center" gap={2}
        px={3} py="7px" borderRadius="8px" cursor="pointer"
        style={{ background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)", border: `1px solid ${c.cardBorder}`, color: c.textMuted, opacity: progress !== null ? 0.6 : 1 }}>
        <Upload size={13} />
        <Text style={{ fontSize: "0.78rem", color: c.textMuted, fontFamily: "'HarmonyOS Sans', sans-serif" }}>
          {values.length === 0 ? "Choose file" : "Add more"}
        </Text>
        <input id={uid} type="file" accept="image/*" multiple onChange={handleFiles} style={{ display: "none" }} />
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

/* Multi-audio upload (ambient sounds) */
function MultiAudioUpload({ label, values, folder, onChange, onError, existingId }: {
  label: string; values: string[]; folder: string;
  onChange: (urls: string[]) => void; onError: (msg: string) => void; existingId?: string;
}) {
  const { c, isDark } = useAdminTheme();
  const [progress, setProgress] = useState<number | null>(null);
  const uid = `multi-aud-${label.replace(/\s+/g,"-").toLowerCase()}`;

  const labelSt: React.CSSProperties = {
    fontSize: "0.7rem", color: c.cardTextMuted, letterSpacing: "0.08em",
    fontFamily: "'HarmonyOS Sans', sans-serif", marginBottom: 6, display: "block",
  };

  const handleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setProgress(0);
    const newUrls: string[] = [];
    try {
      for (let i = 0; i < files.length; i++) {
        const result = await uploadToCloudinary(files[i], folder, pct =>
          setProgress(Math.round((i / files.length) * 100 + pct / files.length))
        );
        newUrls.push(result.secure_url);
      }
      onChange([...values, ...newUrls]);
    } catch (err: any) {
      onError(err.message ?? "Upload failed");
    } finally { setProgress(null); e.target.value = ""; }
  };

  const remove = (idx: number) => onChange(values.filter((_, i) => i !== idx));

  return (
    <Box mb={3}>
      <Text as="label" style={labelSt}>{label}</Text>
      {existingId && values.length === 0 && (
        <Text style={{ fontSize: "0.68rem", color: c.textDim, fontFamily: "'HarmonyOS Sans', sans-serif", marginBottom: 4, display: "block" }}>
          1 item currently linked · Upload to replace
        </Text>
      )}
      {values.length > 0 && (
        <Flex direction="column" gap={1} mb={2}>
          {values.map((url, idx) => (
            <Flex key={idx} align="center" gap={2} px={3} py="6px" borderRadius="8px"
              style={{ background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)", border: `1px solid ${c.cardBorder}` }}>
              <Music size={12} style={{ color: "#f472b6", flexShrink: 0 }} />
              <Text style={{ flex: 1, fontSize: "0.72rem", color: c.textMuted, fontFamily: "'HarmonyOS Sans', sans-serif", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {url.split("/").pop()}
              </Text>
              <Box as="button" onClick={() => remove(idx)}
                display="flex" alignItems="center" justifyContent="center" w="16px" h="16px"
                borderRadius="full" border="none" cursor="pointer"
                style={{ background: "rgba(248,113,113,0.15)", color: "#f87171", flexShrink: 0, padding: 0 }}>
                <X size={9} />
              </Box>
            </Flex>
          ))}
        </Flex>
      )}
      <Box as="label" htmlFor={uid} display="inline-flex" alignItems="center" gap={2}
        px={3} py="7px" borderRadius="8px" cursor="pointer"
        style={{ background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)", border: `1px solid ${c.cardBorder}`, color: c.textMuted, opacity: progress !== null ? 0.6 : 1 }}>
        <Upload size={13} />
        <Text style={{ fontSize: "0.78rem", color: c.textMuted, fontFamily: "'HarmonyOS Sans', sans-serif" }}>
          {values.length === 0 ? "Choose file" : "Add more"}
        </Text>
        <input id={uid} type="file" accept="audio/*" multiple onChange={handleFiles} style={{ display: "none" }} />
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
  const [items,   setItems]   = useState<AdminStoreItemDto[]>([]);
  const [loading, setLoading] = useState(true);

  const PAGE_SIZE = 20;

  /* ── Pagination / filters ─────────────────────────────────────────────── */
  const [page,        setPage]        = useState(1);
  const [tab,         setTab]         = useState<TabType>("all");
  const [searchQuery, setSearchQuery] = useState("");


  /* ── Create / Edit ────────────────────────────────────────────────────── */
  const [showForm,        setShowForm]        = useState(false);
  const [editTarget,      setEditTarget]      = useState<AdminStoreItemDto | null>(null);
  const [form,            setForm]            = useState({ ...EMPTY_FORM });
  const [formLoading,     setFormLoading]     = useState(false);
  const [formError,       setFormError]       = useState<string | null>(null);
  const [priceErrors,     setPriceErrors]     = useState({ coin: false, vnd: false });
  const [editChildLoading, setEditChildLoading] = useState(false);

  /* ── Detail preview ──────────────────────────────────────────────────── */
  const [detailItem,   setDetailItem]   = useState<AdminStoreItemDto | null>(null);
  const [childItems,   setChildItems]   = useState<AdminStoreItemDto[]>([]);
  const [childLoading, setChildLoading] = useState(false);
  const [playingId,    setPlayingId]    = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  /* ── Delete ───────────────────────────────────────────────────────────── */
  const [deleteTarget,  setDeleteTarget]  = useState<AdminStoreItemDto | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  /* ── Load main list ───────────────────────────────────────────────────── */
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const category = tab !== "all" ? (tab as StoreCategory) : undefined;
    adminStoreService.getItems({ category, includeInactive: true, page: 1, pageSize: 200 })
      .then(r => {
        if (cancelled) return;
        setItems(r.items);
        setPage(1);
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [tab]);

  const changeTab = (t: TabType) => { setTab(t); setPage(1); setSearchQuery(""); };

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
      themeBackgroundUrls:    [],
      themeStickerUrls:       [],
      themeAmbientUrls:       [],
      themeBackgroundExistingUrls:  [],
      themeStickerExistingUrls:     [],
      themeAmbientExistingUrls:     [],
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

    if (item.category === "Theme") {
      setEditChildLoading(true);
      const fetchUrl = async (category: StoreCategory, id: string): Promise<string | null> => {
        try {
          const r = await adminStoreService.getItems({ category, includeInactive: true, page: 1, pageSize: 200 });
          return r.items.find(i => i.id === id)?.assetUrl ?? null;
        } catch { return null; }
      };
      Promise.all([
        item.themeBackgroundItemId  ? fetchUrl("Background",   item.themeBackgroundItemId)  : Promise.resolve(null),
        item.themeStickerItemId     ? fetchUrl("Sticker",      item.themeStickerItemId)     : Promise.resolve(null),
        item.themeAmbientSoundItemId ? fetchUrl("AmbientSound", item.themeAmbientSoundItemId) : Promise.resolve(null),
      ]).then(([bgUrl, stickerUrl, ambUrl]) => {
        setForm(prev => ({
          ...prev,
          themeBackgroundUrls:         bgUrl      ? [bgUrl]      : [],
          themeStickerUrls:            stickerUrl ? [stickerUrl] : [],
          themeAmbientUrls:            ambUrl     ? [ambUrl]     : [],
          themeBackgroundExistingUrls: bgUrl      ? [bgUrl]      : [],
          themeStickerExistingUrls:    stickerUrl ? [stickerUrl] : [],
          themeAmbientExistingUrls:    ambUrl     ? [ambUrl]     : [],
        }));
      }).catch(() => {}).finally(() => setEditChildLoading(false));
    }
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
        const existingBgUrls      = new Set(form.themeBackgroundExistingUrls);
        const existingStickerUrls = new Set(form.themeStickerExistingUrls);
        const existingAmbUrls     = new Set(form.themeAmbientExistingUrls);

        // If the existing bg URL was removed from the list, clear the reference
        if (bgId && !form.themeBackgroundUrls.some(u => existingBgUrls.has(u))) bgId = null;
        const newBgUrls = form.themeBackgroundUrls.filter(u => !existingBgUrls.has(u));
        for (let i = 0; i < newBgUrls.length; i++) {
          const it = await adminStoreService.createItem({
            category: "Background", themeSource: "Official",
            name: `${themeName} – Background${newBgUrls.length > 1 ? ` ${i + 1}` : ""}`,
            description: null, assetUrl: newBgUrls[i],
            isPremium: false, coinPrice: null, realMoneyPriceVnd: null, isActive: true,
          });
          if (!bgId) bgId = it.id;
        }

        if (stId && !form.themeStickerUrls.some(u => existingStickerUrls.has(u))) stId = null;
        const newStickerUrls = form.themeStickerUrls.filter(u => !existingStickerUrls.has(u));
        for (let i = 0; i < newStickerUrls.length; i++) {
          const it = await adminStoreService.createItem({
            category: "Sticker", themeSource: "Official",
            name: `${themeName} – Sticker${newStickerUrls.length > 1 ? ` ${i + 1}` : ""}`,
            description: null, assetUrl: newStickerUrls[i],
            isPremium: false, coinPrice: null, realMoneyPriceVnd: null, isActive: true,
          });
          if (!stId) stId = it.id;
        }

        if (ambId && !form.themeAmbientUrls.some(u => existingAmbUrls.has(u))) ambId = null;
        const newAmbUrls = form.themeAmbientUrls.filter(u => !existingAmbUrls.has(u));
        for (let i = 0; i < newAmbUrls.length; i++) {
          const it = await adminStoreService.createItem({
            category: "AmbientSound", themeSource: "Official",
            name: `${themeName} – Ambient Sound${newAmbUrls.length > 1 ? ` ${i + 1}` : ""}`,
            description: null, assetUrl: newAmbUrls[i],
            isPremium: false, coinPrice: null, realMoneyPriceVnd: null, isActive: true,
          });
          if (!ambId) ambId = it.id;
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

  /* ── Detail ───────────────────────────────────────────────────────────── */
  const stopAudio = () => {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    setPlayingId(null);
  };

  const closeDetail = () => { stopAudio(); setDetailItem(null); setChildItems([]); };

  const openDetail = async (item: AdminStoreItemDto) => {
    setDetailItem(item);
    setChildItems([]);
    if (item.category !== "Theme") return;
    const queries: Promise<AdminStoreItemDto | null>[] = [];
    if (item.themeBackgroundItemId) {
      const id = item.themeBackgroundItemId;
      queries.push(adminStoreService.getItems({ category: "Background", includeInactive: true, page: 1, pageSize: 100 })
        .then(r => r.items.find(i => i.id === id) ?? null).catch(() => null));
    }
    if (item.themeStickerItemId) {
      const id = item.themeStickerItemId;
      queries.push(adminStoreService.getItems({ category: "Sticker", includeInactive: true, page: 1, pageSize: 100 })
        .then(r => r.items.find(i => i.id === id) ?? null).catch(() => null));
    }
    if (item.themeAmbientSoundItemId) {
      const id = item.themeAmbientSoundItemId;
      queries.push(adminStoreService.getItems({ category: "AmbientSound", includeInactive: true, page: 1, pageSize: 100 })
        .then(r => r.items.find(i => i.id === id) ?? null).catch(() => null));
    }
    if (queries.length === 0) return;
    setChildLoading(true);
    try {
      const results = await Promise.all(queries);
      setChildItems(results.filter((i): i is AdminStoreItemDto => i !== null));
    } catch {} finally { setChildLoading(false); }
  };

  const toggleDetailSound = (sound: AdminStoreItemDto) => {
    if (!sound.assetUrl) return;
    if (playingId === sound.id) { stopAudio(); return; }
    stopAudio();
    const audio = new Audio(sound.assetUrl);
    audioRef.current = audio;
    audio.play().catch(() => {});
    audio.onended = () => setPlayingId(null);
    setPlayingId(sound.id);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await adminStoreService.deleteItem(deleteTarget.id);
      setItems(prev => prev.filter(i => i.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch { } finally { setDeleteLoading(false); }
  };

  const isPaid = (item: AdminStoreItemDto) =>
    item.coinPrice != null || item.realMoneyPriceVnd != null;
  const isVisible = (item: AdminStoreItemDto) =>
    isPaid(item) && (item.status === "Approved" || item.status === "AdminCreated");

  const displayItems = searchQuery
    ? items.filter(i => isVisible(i) && i.name?.toLowerCase().includes(searchQuery.toLowerCase()))
    : items.filter(i => isVisible(i));

  const totalPages = Math.max(1, Math.ceil(displayItems.length / PAGE_SIZE));
  const pagedItems = displayItems.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  /* ── Render ───────────────────────────────────────────────────────────── */
  return (
    <Box>
      {/* Stats + Add button */}
      <Flex align="center" justify="space-between" mb={5}>
        <Box borderRadius="9px" px={4} py="10px"
          style={{ background: c.cardBg, border: `1px solid ${c.cardBorder}` }}>
          <Text style={{ fontSize: "1.1rem", color: c.cardText, fontWeight: 600, fontFamily: "'HarmonyOS Sans', sans-serif" }}>
            {displayItems.length}
          </Text>
          <Text style={{ fontSize: "0.68rem", color: c.textMuted, fontFamily: "'HarmonyOS Sans', sans-serif" }}>
            Total Items
          </Text>
        </Box>

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
            </Flex>
          </Box>
        ))}
      </Flex>

      {/* Search */}
      <Flex
        align="center"
        gap="8px"
        mb={4}
        px="10px"
        borderRadius="9px"
        style={{ background: c.cardBg, border: `1px solid ${c.cardBorder}`, maxWidth: 340 }}
      >
        <Search size={13} style={{ color: c.textMuted, flexShrink: 0 }} />
        <input
          value={searchQuery}
          onChange={e => { setSearchQuery(e.target.value); setPage(1); }}
          placeholder="Search items…"
          style={{
            flex: 1,
            background: "transparent",
            border: "none",
            outline: "none",
            color: c.cardText,
            fontSize: "0.8rem",
            fontFamily: "'HarmonyOS Sans', sans-serif",
            padding: "9px 0",
          }}
        />
        {searchQuery && (
          <Box as="button" onClick={() => { setSearchQuery(""); setPage(1); }}
            display="flex" alignItems="center" border="none" bg="transparent"
            cursor="pointer" flexShrink={0}
            style={{ color: c.textMuted, padding: "2px", transition: "color 0.15s" }}
          >
            <X size={12} />
          </Box>
        )}
      </Flex>

      {/* Table */}
      {loading ? (
        <Flex justify="center" py={14}>
          <Text style={{ color: c.textMuted, fontSize: "0.85rem", fontFamily: "'HarmonyOS Sans', sans-serif" }}>Loading…</Text>
        </Flex>
      ) : pagedItems.length === 0 ? (
        <Flex justify="center" py={14}>
          <Text style={{ color: c.textDim, fontSize: "0.85rem", fontFamily: "'HarmonyOS Sans', sans-serif" }}>
            No items found
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
              { label: "PRICE",  flex: 1 },
              { label: "ACTIVE", flex: 1 },
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
          {pagedItems.map((item, idx) => {
            const catMeta    = CATEGORY_META[item.category];
            const statusMeta = STATUS_META[item.status];
            return (
              <Flex key={item.id} align="center" px={4} py="12px" transition="background 0.15s" cursor="pointer"
                onClick={() => openDetail(item)}
                style={{ borderBottom: idx < pagedItems.length - 1 ? `1px solid ${c.rowDivider}` : "none" }}
                _hover={{ background: isDark ? "rgba(255,255,255,0.025)" : "rgba(0,0,0,0.02)" } as any}>

                {/* Item thumbnail + name */}
                <Flex flex={3} align="center" gap={3} minW={0}>
                  <Box w="36px" h="36px" borderRadius="8px" flexShrink={0} overflow="hidden"
                    style={{ background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)", border: `1px solid ${c.cardBorder}` }}>
                    {(() => {
                      const thumbSrc = item.category === "AmbientSound"
                        ? parsePreviewUrls(item.previewUrl)[0] ?? null
                        : item.assetUrl ?? null;
                      return thumbSrc ? (
                        <Box as="img" {...{ src: thumbSrc }}
                          style={{ width: "100%", height: "100%", objectFit: "cover" as const }} />
                      ) : (
                        <Flex w="full" h="full" align="center" justify="center">
                          {item.category === "AmbientSound"
                            ? <Volume2 size={14} style={{ color: c.textDim }} />
                            : <Text style={{ fontSize: "0.68rem", color: c.textDim }}>–</Text>
                          }
                        </Flex>
                      );
                    })()}
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

                {/* Active dot */}
                <Box flex={1}>
                  <Box w="8px" h="8px" borderRadius="full"
                    style={{
                      background: item.isActive ? "#22c55e" : "#94a3b8",
                      boxShadow:  item.isActive ? "0 0 5px #22c55e" : "none",
                    }} />
                </Box>

                {/* Actions */}
                <Flex w="96px" justify="flex-end" gap="4px">
                  <Box as="button" onClick={(e: React.MouseEvent) => { e.stopPropagation(); openEdit(item); }}
                    display="flex" alignItems="center" justifyContent="center"
                    w="28px" h="28px" borderRadius="7px" border="none" cursor="pointer" title="Edit"
                    style={{ background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)", color: c.textMuted }}>
                    <Edit2 size={12} />
                  </Box>
                  <Box as="button" onClick={(e: React.MouseEvent) => { e.stopPropagation(); handleToggleActive(item); }}
                    display="flex" alignItems="center" justifyContent="center"
                    w="28px" h="28px" borderRadius="7px" border="none" cursor="pointer"
                    title={item.isActive ? "Deactivate" : "Activate"}
                    style={{ background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)", color: item.isActive ? "#22c55e" : "#94a3b8" }}>
                    {item.isActive ? <Eye size={13} /> : <EyeOff size={13} />}
                  </Box>
                  <Box as="button" onClick={(e: React.MouseEvent) => { e.stopPropagation(); setDeleteTarget(item); }}
                    display="flex" alignItems="center" justifyContent="center"
                    w="28px" h="28px" borderRadius="7px" border="none" cursor="pointer" title="Delete"
                    style={{ background: "rgba(248,113,113,0.08)", color: "#dc2626" }}>
                    <Trash2 size={12} />
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
                          themeBackgroundUrls:    [],
                          themeStickerUrls:       [],
                          themeAmbientUrls:       [],
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
                      {editChildLoading ? (
                        <Flex align="center" gap={2} mb={3} px={3} py={2} borderRadius="8px"
                          style={{ background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)", border: `1px solid ${c.cardBorder}` }}>
                          <Text style={{ fontSize: "0.75rem", color: c.textMuted, fontFamily: "'HarmonyOS Sans', sans-serif" }}>
                            Loading existing components…
                          </Text>
                        </Flex>
                      ) : (
                        <>
                          <MultiImageUpload
                            label="BACKGROUND IMAGES"
                            values={form.themeBackgroundUrls}
                            folder="store/backgrounds"
                            onChange={(urls) => setForm(f => ({ ...f, themeBackgroundUrls: urls }))}
                            onError={(msg) => setFormError(msg)}
                            existingId={form.themeBackgroundItemId}
                          />
                          <MultiImageUpload
                            label="STICKER IMAGES"
                            values={form.themeStickerUrls}
                            folder="store/stickers"
                            onChange={(urls) => setForm(f => ({ ...f, themeStickerUrls: urls }))}
                            onError={(msg) => setFormError(msg)}
                            existingId={form.themeStickerItemId}
                          />
                          <MultiAudioUpload
                            label="AMBIENT SOUNDS"
                            values={form.themeAmbientUrls}
                            folder="store/ambient"
                            onChange={(urls) => setForm(f => ({ ...f, themeAmbientUrls: urls }))}
                            onError={(msg) => setFormError(msg)}
                            existingId={form.themeAmbientSoundItemId}
                          />
                        </>
                      )}
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
                        max={1}
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

      {/* ═══ Detail Modal ═════════════════════════════════════════════════ */}
      <AnimatePresence>
        {detailItem && (
          <>
            <ModalBackdrop onClose={closeDetail} loading={false} />
            <ModalCenter zIndex={310}>
              <MotionBox style={{ width: "640px", maxHeight: "88vh", overflowY: "auto" }}
                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2, ease: [0.4,0,0.2,1] } as any}>
                <Box style={modalBoxSt}>
                  {/* Header */}
                  <Flex align="center" justify="space-between" mb={4}>
                    <Text style={{ fontSize: "0.9rem", color: c.text, fontWeight: 600, fontFamily: "'HarmonyOS Sans', sans-serif" }}>
                      Store Item
                    </Text>
                    <Box as="button" onClick={closeDetail} style={closeBtnSt}><X size={13} /></Box>
                  </Flex>

                  {/* Hero */}
                  {(() => {
                    const isSticker = detailItem.category === "Sticker";
                    const heroSrc = isSticker
                      ? detailItem.assetUrl ?? null
                      : parsePreviewUrls(detailItem.previewUrl)[0] || detailItem.assetUrl || null;
                    return (
                      <Box mb={4} borderRadius="10px" overflow="hidden" h="180px"
                        style={{
                          border: `1px solid ${c.cardBorder}`,
                          background: isSticker
                            ? "repeating-conic-gradient(rgba(128,128,128,0.12) 0% 25%, transparent 0% 50%) 0 0 / 16px 16px"
                            : isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)",
                        }}>
                        {heroSrc ? (
                          <Box as="img" {...{ src: heroSrc }}
                            style={{ width: "100%", height: "100%", objectFit: isSticker ? "contain" as const : "cover" as const, padding: isSticker ? "12px" : undefined }} />
                        ) : (
                          <Flex w="full" h="full" align="center" justify="center" direction="column" gap={2}>
                            <Palette size={32} style={{ color: c.textDim }} />
                            <Text style={{ fontSize: "0.75rem", color: c.textDim, fontFamily: "'HarmonyOS Sans', sans-serif" }}>No preview</Text>
                          </Flex>
                        )}
                      </Box>
                    );
                  })()}

                  {/* Name + badges */}
                  <Flex align="center" gap={2} mb="4px" flexWrap="wrap">
                    <Text style={{ fontSize: "1.05rem", color: c.text, fontWeight: 600, fontFamily: "'HarmonyOS Sans', sans-serif" }}>
                      {detailItem.name ?? "—"}
                    </Text>
                    {(() => { const cm = CATEGORY_META[detailItem.category]; return (
                      <Box px="7px" py="1px" borderRadius="full"
                        style={{ background: `${cm.color}18`, border: `1px solid ${cm.color}35` }}>
                        <Text style={{ fontSize: "0.6rem", color: cm.color, fontFamily: "'HarmonyOS Sans', sans-serif" }}>{cm.label}</Text>
                      </Box>
                    ); })()}
                    {(() => { const sm = STATUS_META[detailItem.status]; return (
                      <Box px="7px" py="1px" borderRadius="full"
                        style={{ background: sm.bg, border: `1px solid ${sm.color}35` }}>
                        <Text style={{ fontSize: "0.6rem", color: sm.color, fontFamily: "'HarmonyOS Sans', sans-serif" }}>{sm.label}</Text>
                      </Box>
                    ); })()}
                  </Flex>
                  {detailItem.description && (
                    <Text mb={3} style={{ fontSize: "0.8rem", color: c.textMuted, fontFamily: "'HarmonyOS Sans', sans-serif", lineHeight: 1.55 }}>
                      {detailItem.description}
                    </Text>
                  )}

                  {/* Meta row */}
                  <Flex gap={6} mb={4} flexWrap="wrap">
                    {detailItem.creatorUsername && (
                      <Box>
                        <Text style={{ fontSize: "0.6rem", color: c.textDim, letterSpacing: "0.08em", fontFamily: "'HarmonyOS Sans', sans-serif", marginBottom: 2 }}>CREATOR</Text>
                        <Text style={{ fontSize: "0.82rem", color: c.textMuted, fontFamily: "'HarmonyOS Sans', sans-serif" }}>{detailItem.creatorUsername}</Text>
                      </Box>
                    )}
                    <Box>
                      <Text style={{ fontSize: "0.6rem", color: c.textDim, letterSpacing: "0.08em", fontFamily: "'HarmonyOS Sans', sans-serif", marginBottom: 2 }}>PRICE</Text>
                      <Text style={{ fontSize: "0.82rem", color: detailItem.coinPrice ? "#d97706" : c.textMuted, fontFamily: "'HarmonyOS Sans', sans-serif" }}>
                        {detailItem.coinPrice ? `${detailItem.coinPrice} coins` : detailItem.realMoneyPriceVnd ? `${detailItem.realMoneyPriceVnd.toLocaleString()}đ` : "Free"}
                      </Text>
                    </Box>
                    <Box>
                      <Text style={{ fontSize: "0.6rem", color: c.textDim, letterSpacing: "0.08em", fontFamily: "'HarmonyOS Sans', sans-serif", marginBottom: 4 }}>ACTIVE</Text>
                      <Box w="8px" h="8px" borderRadius="full"
                        style={{ background: detailItem.isActive ? "#22c55e" : "#94a3b8", boxShadow: detailItem.isActive ? "0 0 5px #22c55e" : "none" }} />
                    </Box>
                  </Flex>

                  {/* Audio player — AmbientSound only */}
                  {detailItem.category === "AmbientSound" && detailItem.assetUrl && (
                    <Box mb={4} px={3} py="11px" borderRadius="10px"
                      style={{ background: isDark ? "rgba(244,114,182,0.06)" : "rgba(244,114,182,0.05)", border: "1px solid rgba(244,114,182,0.2)" }}>
                      <Text mb={2} style={{ fontSize: "0.6rem", color: c.textDim, letterSpacing: "0.08em", fontFamily: "'HarmonyOS Sans', sans-serif" }}>
                        AUDIO PREVIEW
                      </Text>
                      <Flex align="center" gap={3}>
                        <Box as="button"
                          onClick={() => toggleDetailSound(detailItem)}
                          display="flex" alignItems="center" justifyContent="center" flexShrink={0}
                          w="36px" h="36px" borderRadius="50%" border="none" cursor="pointer"
                          style={{
                            background: playingId === detailItem.id ? "rgba(244,114,182,0.22)" : "rgba(244,114,182,0.1)",
                            outline: playingId === detailItem.id ? "1px solid rgba(244,114,182,0.5)" : "1px solid rgba(244,114,182,0.22)",
                            color: "#f472b6",
                            transition: "all 0.15s",
                          }}>
                          {playingId === detailItem.id ? <Pause size={15} /> : <Play size={15} />}
                        </Box>
                        <Box flex={1} minW={0}>
                          <Text style={{ fontSize: "0.82rem", color: c.text, fontFamily: "'HarmonyOS Sans', sans-serif", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {detailItem.name ?? "—"}
                          </Text>
                          <Text style={{ fontSize: "0.65rem", color: c.textDim, fontFamily: "'HarmonyOS Sans', sans-serif", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {detailItem.assetUrl.split("/").pop()}
                          </Text>
                        </Box>
                        <Volume2 size={14} style={{ color: "rgba(244,114,182,0.35)", flexShrink: 0 }} />
                      </Flex>
                    </Box>
                  )}

                  {/* Child components (Theme only) */}
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
                        {bgs.length > 0 && (
                          <Box mb={4}>
                            <Flex align="center" gap={2} mb={2}>
                              <Text style={{ fontSize: "0.6rem", color: c.textDim, letterSpacing: "0.08em", fontFamily: "'HarmonyOS Sans', sans-serif" }}>BACKGROUNDS</Text>
                              <Box px="6px" py="1px" borderRadius="full" style={{ background: "rgba(96,165,250,0.12)", border: "1px solid rgba(96,165,250,0.3)" }}>
                                <Text style={{ fontSize: "0.6rem", color: "#60a5fa", fontFamily: "'HarmonyOS Sans', sans-serif" }}>{bgs.length}</Text>
                              </Box>
                            </Flex>
                            <Box overflowX="auto" pb="8px">
                              <Flex gap={2} style={{ width: "max-content" }}>
                                {bgs.map(bg => (
                                  <Box key={bg.id} borderRadius="9px" overflow="hidden" w="140px" h="84px"
                                    style={{ border: `1px solid ${c.cardBorder}`, flexShrink: 0, background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)" }}>
                                    {bg.assetUrl
                                      ? <Box as="img" {...{ src: bg.assetUrl }} style={{ width: "100%", height: "100%", objectFit: "cover" as const, display: "block" }} />
                                      : <Flex w="full" h="full" align="center" justify="center"><Image size={20} style={{ color: "#60a5fa" }} /></Flex>}
                                  </Box>
                                ))}
                              </Flex>
                            </Box>
                          </Box>
                        )}
                        {stickers.length > 0 && (
                          <Box mb={4}>
                            <Flex align="center" gap={2} mb={2}>
                              <Text style={{ fontSize: "0.6rem", color: c.textDim, letterSpacing: "0.08em", fontFamily: "'HarmonyOS Sans', sans-serif" }}>STICKERS</Text>
                              <Box px="6px" py="1px" borderRadius="full" style={{ background: "rgba(251,146,60,0.12)", border: "1px solid rgba(251,146,60,0.3)" }}>
                                <Text style={{ fontSize: "0.6rem", color: "#fb923c", fontFamily: "'HarmonyOS Sans', sans-serif" }}>{stickers.length}</Text>
                              </Box>
                            </Flex>
                            <Flex gap={2} flexWrap="wrap">
                              {stickers.map(s => (
                                <Box key={s.id} borderRadius="9px" overflow="hidden" w="80px" h="80px"
                                  style={{ border: `1px solid ${c.cardBorder}`, flexShrink: 0, background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)" }}>
                                  {s.assetUrl
                                    ? <Box as="img" {...{ src: s.assetUrl }} style={{ width: "100%", height: "100%", objectFit: "contain" as const, display: "block" }} />
                                    : <Flex w="full" h="full" align="center" justify="center"><Sparkles size={18} style={{ color: "#fb923c" }} /></Flex>}
                                </Box>
                              ))}
                            </Flex>
                          </Box>
                        )}
                        {sounds.length > 0 && (
                          <Box mb={2}>
                            <Flex align="center" gap={2} mb={2}>
                              <Text style={{ fontSize: "0.6rem", color: c.textDim, letterSpacing: "0.08em", fontFamily: "'HarmonyOS Sans', sans-serif" }}>AMBIENT SOUNDS</Text>
                              <Box px="6px" py="1px" borderRadius="full" style={{ background: "rgba(244,114,182,0.12)", border: "1px solid rgba(244,114,182,0.3)" }}>
                                <Text style={{ fontSize: "0.6rem", color: "#f472b6", fontFamily: "'HarmonyOS Sans', sans-serif" }}>{sounds.length}</Text>
                              </Box>
                            </Flex>
                            <Flex direction="column" gap={2}>
                              {sounds.map(sound => (
                                <Flex key={sound.id} align="center" gap={3} px={3} py="10px" borderRadius="9px"
                                  style={{ background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)", border: `1px solid ${c.cardBorder}` }}>
                                  <Box as="button" onClick={() => toggleDetailSound(sound)}
                                    display="flex" alignItems="center" justifyContent="center" flexShrink={0}
                                    w="32px" h="32px" borderRadius="50%" border="none" cursor={sound.assetUrl ? "pointer" : "default"}
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

                  {/* Actions */}
                  <Box mb={3} h="1px" style={{ background: c.border }} />
                  <Flex gap={2}>
                    <Box as="button" onClick={() => { closeDetail(); openEdit(detailItem); }}
                      display="flex" alignItems="center" justifyContent="center" gap={2} flex={1} py="9px" borderRadius="9px" border="none" cursor="pointer"
                      style={{ background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)", outline: `1px solid ${c.cardBorder}`, color: c.textMuted, fontSize: "0.82rem", fontFamily: "'HarmonyOS Sans', sans-serif" }}>
                      <Edit2 size={14} /> Edit
                    </Box>
                    <Box as="button" onClick={() => { closeDetail(); handleToggleActive(detailItem); }}
                      display="flex" alignItems="center" justifyContent="center" gap={2} flex={1} py="9px" borderRadius="9px" border="none" cursor="pointer"
                      style={{ background: detailItem.isActive ? "rgba(148,163,184,0.08)" : "rgba(34,197,94,0.1)", outline: `1px solid ${detailItem.isActive ? c.cardBorder : "rgba(34,197,94,0.3)"}`, color: detailItem.isActive ? "#94a3b8" : "#22c55e", fontSize: "0.82rem", fontFamily: "'HarmonyOS Sans', sans-serif" }}>
                      {detailItem.isActive ? <EyeOff size={14} /> : <Eye size={14} />}
                      {detailItem.isActive ? "Deactivate" : "Activate"}
                    </Box>
                    <Box as="button" onClick={() => { closeDetail(); setDeleteTarget(detailItem); }}
                      display="flex" alignItems="center" justifyContent="center" gap={2} flex={1} py="9px" borderRadius="9px" border="none" cursor="pointer"
                      style={{ background: "rgba(248,113,113,0.08)", outline: "1px solid rgba(248,113,113,0.25)", color: "#dc2626", fontSize: "0.82rem", fontFamily: "'HarmonyOS Sans', sans-serif" }}>
                      <Trash2 size={14} /> Delete
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
