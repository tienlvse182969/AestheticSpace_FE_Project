import { useState, useEffect, useRef, useCallback } from "react";
import { Box, Flex, Text, Input } from "@chakra-ui/react";
import { motion, AnimatePresence } from "motion/react";
import {
  Palette, Image as ImageIcon, Music, Sparkles,
  Play, Pause, CheckCircle, Upload, X, Plus, Coins, Check, ChevronDown, ChevronLeft, ArrowRight, Landmark, Brush,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { LoadingRing } from "../../ui/LoadingRing";
import {
  userThemeService,
  type UserThemeSubmission,
  type SubmitThemeDto,
} from "../../../../services/userTheme.service";
import { VIETNAM_BANKS, searchVietnamBanks, type VietnamBank } from "../../../../data/vietnamBanks";
import { compressImageFile } from "../../../../utils/imageCompression";
import { cldOptimize } from "../../../../utils/cloudinaryImage";

const MotionBox = motion.create(Box);

const makeId = () => Math.random().toString(36).slice(2, 9);

interface LocalFile {
  id: string;
  file: File;
  objectUrl: string;
}

interface ExistingItem {
  id: string;
  url: string;
  name: string;
}

async function uploadToCloud(file: File, uploadFailedMsg: (status: number) => string): Promise<string> {
  const cloudName    = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME as string;
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET as string;
  const uploadFile = file.type.startsWith("image/") ? await compressImageFile(file) : file;
  const form = new FormData();
  form.append("file", uploadFile);
  form.append("upload_preset", uploadPreset);
  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/upload`, {
    method: "POST",
    body: form,
  });
  if (!res.ok) throw new Error(uploadFailedMsg(res.status));
  const json = await res.json();
  return json.secure_url as string;
}

function BankNameCombobox({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  // Once a bank is picked, the field holds "Short - Full" — reopening should
  // show the whole list again instead of filtering by that combined string.
  const isSelectedValue = VIETNAM_BANKS.some(b => `${b.shortName} - ${b.fullName}` === value);
  const results = isSelectedValue ? VIETNAM_BANKS : searchVietnamBanks(value);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const selectBank = (bank: VietnamBank) => {
    onChange(`${bank.shortName} - ${bank.fullName}`);
    setOpen(false);
  };

  return (
    <Box ref={wrapRef as any} position="relative">
      <Box position="relative">
        <Input
          value={value}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => { onChange(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder={t("themeStore.creator.bankNamePlaceholder")}
          onPointerDown={(e: React.PointerEvent) => e.stopPropagation()}
          style={{
            background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)",
            borderRadius: "10px", color: "rgba(255,255,255,0.88)",
            fontFamily: "'HarmonyOS Sans', sans-serif", fontSize: "0.84rem",
            padding: "9px 34px 9px 12px", width: "100%", outline: "none",
          }}
          css={{ "::placeholder": { color: "rgba(255,255,255,0.18)" } }}
        />
        <Box as="button"
          onClick={(e: React.MouseEvent) => { e.stopPropagation(); setOpen(o => !o); }}
          onPointerDown={(e: React.PointerEvent) => e.stopPropagation()}
          position="absolute" right="8px" top="50%"
          style={{ transform: "translateY(-50%)", background: "transparent", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.35)", display: "flex" }}>
          <ChevronDown size={14} style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 0.15s" }} />
        </Box>
      </Box>
      {open && (
        <Box position="absolute" left={0} right={0} top="calc(100% + 4px)" zIndex={20}
          borderRadius="10px" overflow="hidden"
          style={{
            background: "rgba(15,20,26,0.98)", backdropFilter: "blur(16px)",
            border: "1px solid rgba(255,255,255,0.12)", boxShadow: "0 12px 32px rgba(0,0,0,0.6)",
            maxHeight: "180px", overflowY: "auto",
          }}
          onPointerDown={(e: React.PointerEvent) => e.stopPropagation()}
        >
          {results.length === 0 ? (
            <Text px="12px" py="10px" style={{ fontSize: "0.74rem", color: "rgba(255,255,255,0.3)", fontFamily: "'HarmonyOS Sans', sans-serif" }}>
              {t("themeStore.creator.bankNotFound")}
            </Text>
          ) : (
            results.map(bank => (
              <Box key={bank.code} as="button" w="100%" textAlign="left"
                onClick={() => selectBank(bank)}
                px="12px" py="8px" border="none" cursor="pointer"
                style={{ background: "transparent" }}
                css={{ ":hover": { background: "rgba(255,255,255,0.06) !important" } }}>
                <Flex align="center" gap="6px">
                  <Text style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.85)", fontFamily: "'HarmonyOS Sans', sans-serif" }}>
                    {bank.shortName}
                  </Text>
                  <Text style={{ fontSize: "0.6rem", color: "rgba(78,124,106,0.85)", fontFamily: "'HarmonyOS Sans', sans-serif", fontWeight: 600 }}>
                    {bank.code}
                  </Text>
                </Flex>
                <Text style={{ fontSize: "0.64rem", color: "rgba(255,255,255,0.32)", fontFamily: "'HarmonyOS Sans', sans-serif" }}>
                  {bank.fullName}
                </Text>
              </Box>
            ))
          )}
        </Box>
      )}
    </Box>
  );
}

interface Props {
  onClose: () => void;
  initialTheme?: UserThemeSubmission;
}

export function CreateThemePanel({ onClose, initialTheme }: Props) {
  const { t } = useTranslation();
  const isEditing = !!initialTheme;

  const [step, setStep] = useState<1 | 2>(1);

  const [themeName,   setThemeName]   = useState(initialTheme?.name ?? "");
  const [description, setDescription] = useState(initialTheme?.description ?? "");

  // Multi-file slots — all files are submitted, no active selection
  const [bgFiles,      setBgFiles]      = useState<LocalFile[]>([]);
  const [stickerFiles, setStickerFiles] = useState<LocalFile[]>([]);
  const [soundFiles,   setSoundFiles]   = useState<LocalFile[]>([]);

  // Existing server-side items pre-populated when editing
  const [existingBgItems,      setExistingBgItems]      = useState<ExistingItem[]>(() =>
    (initialTheme?.inlineComponents ?? [])
      .filter(c => c.category === "Background" && c.assetUrl != null)
      .map(c => ({ id: c.id, url: c.assetUrl!, name: c.name }))
  );
  const [existingStickerItems, setExistingStickerItems] = useState<ExistingItem[]>(() =>
    (initialTheme?.inlineComponents ?? [])
      .filter(c => c.category === "Sticker" && c.assetUrl != null)
      .map(c => ({ id: c.id, url: c.assetUrl!, name: c.name }))
  );
  const [existingSoundItems,   setExistingSoundItems]   = useState<ExistingItem[]>(() =>
    (initialTheme?.inlineComponents ?? [])
      .filter(c => c.category === "AmbientSound" && c.assetUrl != null)
      .map(c => ({ id: c.id, url: c.assetUrl!, name: c.name }))
  );

  // Pricing
  const [coinPrice, setCoinPrice] = useState<string>(
    initialTheme?.coinPrice != null ? String(initialTheme.coinPrice) : ""
  );
  const [vndPrice, setVndPrice] = useState<string>(
    initialTheme?.realMoneyPriceVnd != null ? String(initialTheme.realMoneyPriceVnd) : ""
  );

  // Payout method — chosen by the creator, not the admin. Admin only approves
  // and pays out according to whichever method was requested here.
  const [payoutMethod, setPayoutMethod] = useState<"coin" | "bank">(() =>
    initialTheme?.requestedRealMoneyPriceVnd != null && initialTheme?.requestedCoinPrice == null ? "bank" : "coin"
  );

  // Bank info + buyout terms
  const [bankAccountNumber,    setBankAccountNumber]    = useState("");
  const [bankName,             setBankName]             = useState("");
  const [bankAccountOwnerName, setBankAccountOwnerName] = useState("");
  const [isAgreedToTerms,      setIsAgreedToTerms]      = useState(false);

  // Audio playback
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Track all object URLs for reliable cleanup on unmount
  const allUrlsRef = useRef<Set<string>>(new Set());

  // Submit state
  const [isSubmitting,  setIsSubmitting]  = useState(false);
  const [uploadLabel,   setUploadLabel]   = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [error,         setError]         = useState<string | null>(null);

  const bgInputRef      = useRef<HTMLInputElement | null>(null);
  const stickerInputRef = useRef<HTMLInputElement | null>(null);
  const soundInputRef   = useRef<HTMLInputElement | null>(null);

  // Cleanup all object URLs on unmount
  useEffect(() => {
    return () => {
      audioRef.current?.pause();
      allUrlsRef.current.forEach(url => URL.revokeObjectURL(url));
    };
  }, []);

  // Auto close after success
  useEffect(() => {
    if (!submitSuccess) return;
    const t = setTimeout(onClose, 1600);
    return () => clearTimeout(t);
  }, [submitSuccess, onClose]);

  // Slots are "filled" if they have at least one file or existing item
  const selectedCount = [
    bgFiles.length > 0      || existingBgItems.length > 0,
    stickerFiles.length > 0 || existingStickerItems.length > 0,
    soundFiles.length > 0   || existingSoundItems.length > 0,
  ].filter(Boolean).length;
  const bankFieldsProvided = !!(bankAccountNumber.trim() && bankName.trim() && bankAccountOwnerName.trim());
  const coinAmountValid = coinPrice !== "" && Number(coinPrice) > 0;
  const bankAmountValid = vndPrice !== "" && Number(vndPrice) >= 1000;
  const payoutValid = payoutMethod === "coin" ? coinAmountValid : (bankFieldsProvided && bankAmountValid);
  const canProceedStep1 = themeName.trim().length > 0 && selectedCount >= 2;
  const canSave =
    canProceedStep1 &&
    isAgreedToTerms &&
    payoutValid &&
    !isSubmitting &&
    !submitSuccess;

  // ── Generic file adder ──
  const makeLocalFiles = (rawFiles: File[]): LocalFile[] =>
    rawFiles.map(f => {
      const objectUrl = URL.createObjectURL(f);
      allUrlsRef.current.add(objectUrl);
      return { id: makeId(), file: f, objectUrl };
    });

  const addBgFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setBgFiles(prev => [...prev, ...makeLocalFiles(files)]);
    e.target.value = "";
  };

  const addStickerFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setStickerFiles(prev => [...prev, ...makeLocalFiles(files)]);
    e.target.value = "";
  };

  const addSoundFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setSoundFiles(prev => [...prev, ...makeLocalFiles(files)]);
    e.target.value = "";
  };

  // ── Remove handlers — local files ──
  const removeBgFile = (id: string) => {
    setBgFiles(prev => {
      const f = prev.find(p => p.id === id);
      if (f) { URL.revokeObjectURL(f.objectUrl); allUrlsRef.current.delete(f.objectUrl); }
      return prev.filter(p => p.id !== id);
    });
  };

  const removeStickerFile = (id: string) => {
    setStickerFiles(prev => {
      const f = prev.find(p => p.id === id);
      if (f) { URL.revokeObjectURL(f.objectUrl); allUrlsRef.current.delete(f.objectUrl); }
      return prev.filter(p => p.id !== id);
    });
  };

  const removeSoundFile = (id: string) => {
    setSoundFiles(prev => {
      const f = prev.find(p => p.id === id);
      if (f) {
        URL.revokeObjectURL(f.objectUrl);
        allUrlsRef.current.delete(f.objectUrl);
        if (playingId === id) { audioRef.current?.pause(); setPlayingId(null); }
      }
      return prev.filter(p => p.id !== id);
    });
  };

  // ── Remove handlers — existing server items ──
  const removeExistingBgItem      = (id: string) => setExistingBgItems(prev => prev.filter(i => i.id !== id));
  const removeExistingStickerItem = (id: string) => setExistingStickerItems(prev => prev.filter(i => i.id !== id));
  const removeExistingSoundItem   = (id: string) => {
    if (playingId === id) { audioRef.current?.pause(); setPlayingId(null); }
    setExistingSoundItems(prev => prev.filter(i => i.id !== id));
  };

  // ── Audio toggle (works for both local files and existing items) ──
  const toggleAudio = useCallback((id: string, url: string) => {
    if (playingId === id) {
      audioRef.current?.pause();
      setPlayingId(null);
      return;
    }
    audioRef.current?.pause();
    const audio = new Audio(url);
    audioRef.current = audio;
    audio.play().catch(() => {});
    audio.onended = () => setPlayingId(null);
    setPlayingId(id);
  }, [playingId]);

  // ── Submit — uploads ALL files from each slot ──
  const handleSave = async () => {
    if (!canSave) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const name = themeName.trim();
      const bgUrls: string[] = [];
      const stickerUrls: string[] = [];
      const soundUrls: string[] = [];

      const uploadFailedMsg = (status: number) => t("themeStore.creator.uploadFailed", { status });

      for (let i = 0; i < bgFiles.length; i++) {
        setUploadLabel(bgFiles.length > 1
          ? t("themeStore.creator.uploadingBgMulti", { current: i + 1, total: bgFiles.length })
          : t("themeStore.creator.uploadingBg"));
        bgUrls.push(await uploadToCloud(bgFiles[i].file, uploadFailedMsg));
      }
      for (let i = 0; i < stickerFiles.length; i++) {
        setUploadLabel(stickerFiles.length > 1
          ? t("themeStore.creator.uploadingStickerMulti", { current: i + 1, total: stickerFiles.length })
          : t("themeStore.creator.uploadingSticker"));
        stickerUrls.push(await uploadToCloud(stickerFiles[i].file, uploadFailedMsg));
      }
      for (let i = 0; i < soundFiles.length; i++) {
        setUploadLabel(soundFiles.length > 1
          ? t("themeStore.creator.uploadingSoundMulti", { current: i + 1, total: soundFiles.length })
          : t("themeStore.creator.uploadingSound"));
        soundUrls.push(await uploadToCloud(soundFiles[i].file, uploadFailedMsg));
      }

      const firstBgUrl      = bgUrls[0]      || existingBgItems[0]?.url      || "";
      const firstStickerUrl = stickerUrls[0]  || existingStickerItems[0]?.url || "";
      const firstSoundUrl   = soundUrls[0]    || existingSoundItems[0]?.url   || "";

      const dto: SubmitThemeDto = {
        name,
        description: description.trim() || undefined,
        assetUrl:    firstBgUrl || firstStickerUrl || "",
        previewUrl:  firstBgUrl || firstStickerUrl || undefined,
        inlineBackground: firstBgUrl
          ? { category: "Background" as const, name, assetUrl: firstBgUrl }
          : undefined,
        inlineSticker: firstStickerUrl
          ? { category: "Sticker" as const, name, assetUrl: firstStickerUrl }
          : undefined,
        inlineAmbientSound: firstSoundUrl
          ? { category: "AmbientSound" as const, name, assetUrl: firstSoundUrl }
          : undefined,
        requestedCoinPrice:         payoutMethod === "coin" && coinPrice !== "" ? Number(coinPrice) : undefined,
        requestedRealMoneyPriceVnd: payoutMethod === "bank" && vndPrice  !== "" ? Number(vndPrice)  : undefined,
        isAgreedToTerms,
        bankAccountNumber:    payoutMethod === "bank" ? (bankAccountNumber.trim()    || undefined) : undefined,
        bankName:             payoutMethod === "bank" ? (bankName.trim()             || undefined) : undefined,
        bankAccountOwnerName: payoutMethod === "bank" ? (bankAccountOwnerName.trim() || undefined) : undefined,
      };

      setUploadLabel(isEditing ? t("themeStore.creator.updatingTheme") : t("themeStore.creator.submittingTheme"));
      if (isEditing) {
        await userThemeService.update(initialTheme!.id, dto);
      } else {
        await userThemeService.submit(dto);
      }
      setSubmitSuccess(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : t("themeStore.creator.saveFailedDefault");
      setError(msg);
    } finally {
      setIsSubmitting(false);
      setUploadLabel(null);
    }
  };

  // Hero shows first uploaded background, or first existing bg, or theme preview
  const heroBgUrl      = bgFiles[0]?.objectUrl      ?? existingBgItems[0]?.url      ?? (isEditing ? (initialTheme?.previewUrl ?? initialTheme?.assetUrl ?? null) : null);
  const heroStickerUrl = stickerFiles[0]?.objectUrl ?? existingStickerItems[0]?.url ?? null;
  const totalBg      = bgFiles.length      + existingBgItems.length;
  const totalSticker = stickerFiles.length + existingStickerItems.length;
  const totalSound   = soundFiles.length   + existingSoundItems.length;

  // ── Slot section label ──
  const SlotHeader = ({
    icon, label, optional,
  }: {
    icon: React.ReactNode; label: string; optional?: boolean;
  }) => (
    <Flex align="center" mb="8px">
      <Flex align="center" gap="5px">
        {icon}
        <Text style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.45)", fontFamily: "'HarmonyOS Sans', sans-serif" }}>
          {label}{optional && <span style={{ color: "rgba(255,255,255,0.2)", fontSize: "0.6rem" }}> {t("themeStore.creator.optional")}</span>}
        </Text>
      </Flex>
    </Flex>
  );

  // ── Image thumbnail grid — shows existing server items + new local files ──
  const ImageGrid = ({
    files, onRemove, onAdd,
    existingItems, onRemoveExisting,
    thumbBorder, checkColor, emptyIcon, emptyLabel, emptyHover,
  }: {
    files: LocalFile[]; onRemove: (id: string) => void; onAdd: () => void;
    existingItems: ExistingItem[]; onRemoveExisting: (id: string) => void;
    thumbBorder: string; checkColor: string;
    emptyIcon: React.ReactNode; emptyLabel: string; emptyHover: string;
  }) => {
    if (files.length === 0 && existingItems.length === 0) {
      return (
        <Box as="button" w="100%" h="86px" border="none" cursor="pointer" borderRadius="10px"
          display="flex" flexDirection="column" alignItems="center" justifyContent="center" gap="6px"
          onClick={onAdd}
          onPointerDown={(e: React.PointerEvent) => e.stopPropagation()}
          style={{
            background: "rgba(255,255,255,0.02)",
            border: "1.5px dashed rgba(255,255,255,0.1)",
            color: "rgba(255,255,255,0.22)",
            transition: "all 0.15s",
          }}
          css={{ ":hover": { background: `${emptyHover} !important`, borderColor: `${thumbBorder} !important`, color: `${checkColor} !important` } }}>
          {emptyIcon}
          <Text style={{ fontSize: "0.65rem", fontFamily: "'HarmonyOS Sans', sans-serif" }}>{emptyLabel}</Text>
        </Box>
      );
    }
    const Thumb = ({ src, onRemoveClick }: { src: string; onRemoveClick: () => void }) => (
      <Box position="relative" flexShrink={0}
        w="58px" h="58px" borderRadius="8px" overflow="hidden"
        style={{ border: "2px solid rgba(255,255,255,0.08)" }}>
        <img src={cldOptimize(src, { width: 116, height: 116, crop: "fill" })} alt=""
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          draggable={false} loading="lazy" decoding="async" />
        <Box as="button" border="none" cursor="pointer" borderRadius="full"
          w="15px" h="15px" display="flex" alignItems="center" justifyContent="center"
          position="absolute" top="3px" right="3px"
          onClick={(e: React.MouseEvent) => { e.stopPropagation(); onRemoveClick(); }}
          onPointerDown={(e: React.PointerEvent) => e.stopPropagation()}
          style={{ background: "rgba(0,0,0,0.7)", color: "rgba(255,255,255,0.9)" }}
          css={{ ":hover": { background: "rgba(239,68,68,0.85) !important" } }}>
          <X size={8} />
        </Box>
      </Box>
    );
    return (
      <Flex wrap="wrap" gap="6px">
        {existingItems.map(item => (
          <Thumb key={item.id} src={item.url} onRemoveClick={() => onRemoveExisting(item.id)} />
        ))}
        {files.map(f => (
          <Thumb key={f.id} src={f.objectUrl} onRemoveClick={() => onRemove(f.id)} />
        ))}
        {/* Add more */}
        <Box as="button" border="none" cursor="pointer" borderRadius="8px" flexShrink={0}
          w="58px" h="58px" display="flex" alignItems="center" justifyContent="center"
          onClick={onAdd}
          onPointerDown={(e: React.PointerEvent) => e.stopPropagation()}
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1.5px dashed rgba(255,255,255,0.1)",
            color: "rgba(255,255,255,0.2)",
            transition: "all 0.15s",
          }}
          css={{ ":hover": { background: `${emptyHover} !important`, borderColor: `${thumbBorder} !important`, color: `${checkColor} !important` } }}>
          <Plus size={16} />
        </Box>
      </Flex>
    );
  };

  // ── Render ──
  return (
    <MotionBox
      initial={{ x: "100%" }}
      animate={{ x: 0, transition: { type: "spring", stiffness: 380, damping: 32, mass: 0.9 } } as any}
      exit={{ x: "100%", transition: { duration: 0.2, ease: [0.4, 0, 1, 1] } } as any}
      position="absolute" inset={0} overflow="hidden"
      bg="#0a0f14"
      style={{ background: "#0a0f14", zIndex: 21 }}
    >
      <Box position="relative" display="flex" flexDirection="column" h="100%" bg="#0a0f14" style={{ background: "#0a0f14" }}>

        {/* ── Header ── */}
        <Box flexShrink={0} px="14px" pt="12px" pb="11px"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          <Flex align="center" gap="9px">
            <Box as="button" onClick={() => { if (isSubmitting) return; step === 2 ? setStep(1) : onClose(); }}
              display="flex" alignItems="center" gap="4px"
              px="8px" py="5px" borderRadius="8px" border="none" cursor="pointer"
              style={{
                background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.7)",
                fontSize: "0.72rem", fontFamily: "'HarmonyOS Sans', sans-serif",
                transition: "background 0.15s", flexShrink: 0,
              }}
              _hover={{ background: "rgba(255,255,255,0.1)" } as any}>
              <ChevronLeft size={14} />
              {t("themeStore.creator.back")}
            </Box>
            <Box w="26px" h="26px" borderRadius="7px" display="flex" alignItems="center" justifyContent="center" flexShrink={0}
              style={{ background: "rgba(78,124,106,0.2)", border: "1px solid rgba(78,124,106,0.3)" }}>
              <Brush size={13} style={{ color: "rgba(78,124,106,0.9)" }} />
            </Box>
            <Text style={{ fontSize: "0.9rem", color: "rgba(255,255,255,0.88)", fontFamily: "'HarmonyOS Sans', sans-serif", fontWeight: 600, whiteSpace: "nowrap" }}>
              {isEditing ? t("themeStore.creator.editTitle") : t("themeStore.creator.createTitle")}
            </Text>
            <Box px="5px" py="1px" borderRadius="4px" flexShrink={0}
              style={{ background: "rgba(78,124,106,0.2)", border: "1px solid rgba(78,124,106,0.38)" }}>
              <Text style={{ fontSize: "0.52rem", fontFamily: "'HarmonyOS Sans', sans-serif", fontWeight: 700, color: "rgba(78,124,106,0.9)", letterSpacing: "0.07em" }}>
                {t("themeStore.creator.beta")}
              </Text>
            </Box>
            <Flex align="center" gap="5px" ml="auto" flexShrink={0}>
              {[1, 2].map(s => (
                <Box key={s} w="18px" h="4px" borderRadius="2px"
                  style={{
                    background: s <= step ? "rgba(78,124,106,0.85)" : "rgba(255,255,255,0.1)",
                    transition: "background 0.2s",
                  }} />
              ))}
              <Text style={{ fontSize: "0.6rem", color: "rgba(255,255,255,0.28)", fontFamily: "'HarmonyOS Sans', sans-serif", marginLeft: "2px" }}>
                {step}/2
              </Text>
            </Flex>
          </Flex>
        </Box>

        {/* ── Preview hero ── */}
        <Box flexShrink={0} position="relative" h="130px"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          {heroBgUrl ? (
            <Box position="absolute" inset={0}
              style={{ backgroundImage: `url(${cldOptimize(heroBgUrl, { width: 860, height: 260, crop: "fill" })})`, backgroundSize: "cover", backgroundPosition: "center" }} />
          ) : (
            <Box position="absolute" inset={0}
              style={{ background: "linear-gradient(135deg, #080d12 0%, #0f1820 60%, #0a1520 100%)" }} />
          )}
          <Box position="absolute" inset={0} style={{ background: heroBgUrl ? "rgba(0,0,0,0.38)" : "transparent" }} />

          {/* Show first sticker as preview */}
          {heroStickerUrl && (
            <Box position="absolute" bottom="10px" right="14px" w="44px" h="44px"
              style={{
                backgroundImage: `url(${cldOptimize(heroStickerUrl, { width: 88, height: 88, crop: "limit" })})`,
                backgroundSize: "contain", backgroundRepeat: "no-repeat", backgroundPosition: "center",
                filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.65))",
              }} />
          )}

          <Flex position="absolute" inset={0} align="center" justify="center" direction="column" gap="7px">
            <Text style={{
              fontSize: "1.1rem", fontWeight: 700,
              color: themeName ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.14)",
              fontFamily: "'HarmonyOS Sans', sans-serif",
              letterSpacing: "0.02em",
              textShadow: heroBgUrl ? "0 1px 12px rgba(0,0,0,0.8)" : "none",
            }}>
              {themeName || t("themeStore.creator.heroPlaceholderName")}
            </Text>
            {selectedCount > 0 && (
              <Flex gap="5px">
                {totalBg > 0 && (
                  <Flex align="center" gap="3px" px="7px" py="2px" borderRadius="20px"
                    style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.1)" }}>
                    <ImageIcon size={8} style={{ color: "rgba(96,165,250,0.85)" }} />
                    <Text style={{ fontSize: "0.57rem", color: "rgba(255,255,255,0.5)", fontFamily: "'HarmonyOS Sans', sans-serif" }}>
                      {t("themeStore.creator.heroBackground")}{totalBg > 1 ? ` ×${totalBg}` : ""}
                    </Text>
                  </Flex>
                )}
                {totalSticker > 0 && (
                  <Flex align="center" gap="3px" px="7px" py="2px" borderRadius="20px"
                    style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.1)" }}>
                    <Sparkles size={8} style={{ color: "rgba(251,146,60,0.85)" }} />
                    <Text style={{ fontSize: "0.57rem", color: "rgba(255,255,255,0.5)", fontFamily: "'HarmonyOS Sans', sans-serif" }}>
                      {t("themeStore.creator.heroSticker")}{totalSticker > 1 ? ` ×${totalSticker}` : ""}
                    </Text>
                  </Flex>
                )}
                {totalSound > 0 && (
                  <Flex align="center" gap="3px" px="7px" py="2px" borderRadius="20px"
                    style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.1)" }}>
                    <Music size={8} style={{ color: "rgba(244,114,182,0.85)" }} />
                    <Text style={{ fontSize: "0.57rem", color: "rgba(255,255,255,0.5)", fontFamily: "'HarmonyOS Sans', sans-serif" }}>
                      {t("themeStore.creator.heroSound")}{totalSound > 1 ? ` ×${totalSound}` : ""}
                    </Text>
                  </Flex>
                )}
              </Flex>
            )}
          </Flex>
        </Box>

        {/* ── Scrollable form body ── */}
        <Box flex={1} overflowY="auto" px="18px" pt="16px" pb="20px"
          style={{ scrollbarWidth: "none" }}>
          <AnimatePresence mode="wait" initial={false}>
            {step === 1 ? (
              <MotionBox key="step1"
                initial={{ opacity: 0, x: -14 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -14 }}
                transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] } as any}
              >
                {/* Theme name */}
                <Box mb="14px">
                  <Text mb="7px" style={{ fontSize: "0.6rem", color: "rgba(255,255,255,0.28)", letterSpacing: "0.11em", fontFamily: "'HarmonyOS Sans', sans-serif" }}>
                    {t("themeStore.creator.themeNameLabel")}
                  </Text>
                  <Box position="relative">
                    <Input
                      value={themeName}
                      onChange={e => setThemeName(e.target.value.slice(0, 40))}
                      placeholder={t("themeStore.creator.themeNamePlaceholder")}
                      onPointerDown={(e: React.PointerEvent) => e.stopPropagation()}
                      style={{
                        background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: "10px", color: "rgba(255,255,255,0.9)",
                        fontFamily: "'HarmonyOS Sans', sans-serif", fontSize: "0.86rem",
                        padding: "10px 44px 10px 14px", width: "100%", outline: "none",
                      }}
                      css={{ "::placeholder": { color: "rgba(255,255,255,0.18)" }, ":focus": { borderColor: "rgba(255,255,255,0.24) !important" } }}
                    />
                    <Text position="absolute" right="12px" top="50%"
                      style={{ transform: "translateY(-50%)", fontSize: "0.6rem", color: "rgba(255,255,255,0.16)", fontFamily: "'HarmonyOS Sans', sans-serif", pointerEvents: "none" }}>
                      {themeName.length}/40
                    </Text>
                  </Box>
                </Box>

                {/* Description */}
                <Box mb="16px">
                  <Text mb="7px" style={{ fontSize: "0.6rem", color: "rgba(255,255,255,0.28)", letterSpacing: "0.11em", fontFamily: "'HarmonyOS Sans', sans-serif" }}>
                    {t("themeStore.creator.descriptionLabel")} <span style={{ color: "rgba(255,255,255,0.14)" }}>{t("themeStore.creator.optional")}</span>
                  </Text>
                  <Box position="relative">
                    <textarea
                      className="theme-desc"
                      value={description}
                      onChange={e => setDescription(e.target.value.slice(0, 200))}
                      placeholder={t("themeStore.creator.descriptionPlaceholder")}
                      onPointerDown={e => e.stopPropagation()}
                      rows={3}
                      style={{
                        background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: "10px", color: "rgba(255,255,255,0.9)",
                        fontFamily: "'HarmonyOS Sans', sans-serif", fontSize: "0.84rem",
                        padding: "10px 14px 24px 14px", width: "100%", outline: "none",
                        resize: "none", lineHeight: 1.55, boxSizing: "border-box", scrollbarWidth: "none",
                      }}
                    />
                    <Text position="absolute" right="10px" bottom="8px"
                      style={{ fontSize: "0.58rem", color: "rgba(255,255,255,0.14)", fontFamily: "'HarmonyOS Sans', sans-serif", pointerEvents: "none" }}>
                      {description.length}/200
                    </Text>
                  </Box>
                </Box>

                {/* ── Component slots ── */}
                <Box mb="18px">
                  <Text mb="12px" style={{ fontSize: "0.6rem", color: "rgba(255,255,255,0.28)", letterSpacing: "0.11em", fontFamily: "'HarmonyOS Sans', sans-serif" }}>
                    {t("themeStore.creator.componentsLabel")} <span style={{ color: "rgba(255,255,255,0.14)" }}>{t("themeStore.creator.componentsHint")}</span>
                  </Text>

                  {/* Background + Sticker side by side */}
                  <Flex gap="12px" mb="12px">
                    {/* Background */}
                    <Box flex={1} minW={0}>
                      <input ref={bgInputRef} type="file" accept="image/*" multiple style={{ display: "none" }} onChange={addBgFiles} />
                      <SlotHeader
                        icon={<ImageIcon size={10} style={{ color: "rgba(96,165,250,0.7)" }} />}
                        label={t("themeStore.creator.backgroundLabel")}
                      />
                      <ImageGrid
                        files={bgFiles} onRemove={removeBgFile} onAdd={() => bgInputRef.current?.click()}
                        existingItems={existingBgItems} onRemoveExisting={removeExistingBgItem}
                        thumbBorder="rgba(96,165,250,0.85)" checkColor="rgba(96,165,250,0.8)"
                        emptyIcon={<ImageIcon size={20} />} emptyLabel={t("themeStore.creator.backgroundLabel")}
                        emptyHover="rgba(96,165,250,0.06)"
                      />
                    </Box>

                    {/* Sticker */}
                    <Box flex={1} minW={0}>
                      <input ref={stickerInputRef} type="file" accept="image/*" multiple style={{ display: "none" }} onChange={addStickerFiles} />
                      <SlotHeader
                        icon={<Sparkles size={10} style={{ color: "rgba(251,146,60,0.7)" }} />}
                        label={t("themeStore.creator.stickerLabel")}
                      />
                      <ImageGrid
                        files={stickerFiles} onRemove={removeStickerFile} onAdd={() => stickerInputRef.current?.click()}
                        existingItems={existingStickerItems} onRemoveExisting={removeExistingStickerItem}
                        thumbBorder="rgba(251,146,60,0.85)" checkColor="rgba(251,146,60,0.8)"
                        emptyIcon={<Sparkles size={20} />} emptyLabel={t("themeStore.creator.stickerLabel")}
                        emptyHover="rgba(251,146,60,0.06)"
                      />
                    </Box>
                  </Flex>

                  {/* Ambient sound */}
                  <Box>
                    <input ref={soundInputRef} type="file" accept="audio/*" multiple style={{ display: "none" }} onChange={addSoundFiles} />
                    <SlotHeader
                      icon={<Music size={10} style={{ color: "rgba(244,114,182,0.7)" }} />}
                      label={t("themeStore.creator.ambientLabel")} optional
                    />
                    {totalSound === 0 ? (
                      <Box as="button" w="100%" border="none" cursor="pointer" borderRadius="10px"
                        display="flex" alignItems="center" justifyContent="center" gap="8px" py="12px"
                        onClick={() => soundInputRef.current?.click()}
                        onPointerDown={(e: React.PointerEvent) => e.stopPropagation()}
                        style={{
                          background: "rgba(255,255,255,0.02)", border: "1.5px dashed rgba(255,255,255,0.1)",
                          color: "rgba(255,255,255,0.22)", transition: "all 0.15s",
                        }}
                        css={{ ":hover": { background: "rgba(244,114,182,0.06) !important", borderColor: "rgba(244,114,182,0.3) !important", color: "rgba(244,114,182,0.7) !important" } }}>
                        <Music size={14} />
                        <Text style={{ fontSize: "0.68rem", fontFamily: "'HarmonyOS Sans', sans-serif" }}>{t("themeStore.creator.addAmbientBtn")}</Text>
                      </Box>
                    ) : (
                      <Box borderRadius="10px" overflow="hidden"
                        style={{ border: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.015)" }}>
                        {existingSoundItems.map((item, i) => (
                          <Flex key={item.id} align="center" gap="10px" px="12px" py="9px"
                            onPointerDown={(e: React.PointerEvent) => e.stopPropagation()}
                            style={{ borderTop: i > 0 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
                            <Box as="button" border="none" cursor="pointer" borderRadius="full" flexShrink={0}
                              w="28px" h="28px" display="flex" alignItems="center" justifyContent="center"
                              onClick={(e: React.MouseEvent) => { e.stopPropagation(); toggleAudio(item.id, item.url); }}
                              onPointerDown={(e: React.PointerEvent) => e.stopPropagation()}
                              style={{
                                background: playingId === item.id ? "rgba(244,114,182,0.25)" : "rgba(255,255,255,0.07)",
                                border: playingId === item.id ? "1px solid rgba(244,114,182,0.5)" : "1px solid rgba(255,255,255,0.1)",
                                color: playingId === item.id ? "rgba(249,168,212,0.95)" : "rgba(255,255,255,0.5)",
                                transition: "all 0.15s",
                              }}>
                              {playingId === item.id ? <Pause size={10} /> : <Play size={10} />}
                            </Box>
                            <Text flex={1} minW={0} style={{
                              fontSize: "0.72rem", color: "rgba(255,255,255,0.75)",
                              fontFamily: "'HarmonyOS Sans', sans-serif",
                              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                            }}>
                              {item.name || item.url.split("/").pop()}
                            </Text>
                            <Box as="button" border="none" cursor="pointer" borderRadius="full" flexShrink={0}
                              w="20px" h="20px" display="flex" alignItems="center" justifyContent="center"
                              onClick={(e: React.MouseEvent) => { e.stopPropagation(); removeExistingSoundItem(item.id); }}
                              onPointerDown={(e: React.PointerEvent) => e.stopPropagation()}
                              style={{ background: "transparent", color: "rgba(255,255,255,0.22)", transition: "color 0.15s" }}
                              css={{ ":hover": { color: "rgba(239,68,68,0.8) !important" } }}>
                              <X size={10} />
                            </Box>
                          </Flex>
                        ))}
                        {soundFiles.map((sf, i) => (
                          <Flex key={sf.id} align="center" gap="10px" px="12px" py="9px"
                            onPointerDown={(e: React.PointerEvent) => e.stopPropagation()}
                            style={{ borderTop: (existingSoundItems.length > 0 || i > 0) ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
                            <Box as="button" border="none" cursor="pointer" borderRadius="full" flexShrink={0}
                              w="28px" h="28px" display="flex" alignItems="center" justifyContent="center"
                              onClick={(e: React.MouseEvent) => { e.stopPropagation(); toggleAudio(sf.id, sf.objectUrl); }}
                              onPointerDown={(e: React.PointerEvent) => e.stopPropagation()}
                              style={{
                                background: playingId === sf.id ? "rgba(244,114,182,0.25)" : "rgba(255,255,255,0.07)",
                                border: playingId === sf.id ? "1px solid rgba(244,114,182,0.5)" : "1px solid rgba(255,255,255,0.1)",
                                color: playingId === sf.id ? "rgba(249,168,212,0.95)" : "rgba(255,255,255,0.5)",
                                transition: "all 0.15s",
                              }}>
                              {playingId === sf.id ? <Pause size={10} /> : <Play size={10} />}
                            </Box>
                            <Text flex={1} minW={0} style={{
                              fontSize: "0.72rem", color: "rgba(255,255,255,0.75)",
                              fontFamily: "'HarmonyOS Sans', sans-serif",
                              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                            }}>
                              {sf.file.name}
                            </Text>
                            <Box as="button" border="none" cursor="pointer" borderRadius="full" flexShrink={0}
                              w="20px" h="20px" display="flex" alignItems="center" justifyContent="center"
                              onClick={(e: React.MouseEvent) => { e.stopPropagation(); removeSoundFile(sf.id); }}
                              onPointerDown={(e: React.PointerEvent) => e.stopPropagation()}
                              style={{ background: "transparent", color: "rgba(255,255,255,0.22)", transition: "color 0.15s" }}
                              css={{ ":hover": { color: "rgba(239,68,68,0.8) !important" } }}>
                              <X size={10} />
                            </Box>
                          </Flex>
                        ))}
                      </Box>
                    )}
                  </Box>
                </Box>

                {/* Next */}
                <Box
                  as="button" onClick={() => canProceedStep1 && setStep(2)}
                  onPointerDown={(e: React.PointerEvent) => e.stopPropagation()}
                  w="100%" border="none" borderRadius="11px" py="12px"
                  cursor={canProceedStep1 ? "pointer" : "not-allowed"}
                  display="flex" alignItems="center" justifyContent="center" gap="8px"
                  style={{
                    background: canProceedStep1
                      ? "linear-gradient(135deg, rgba(78,124,106,0.85) 0%, rgba(16,185,129,0.75) 100%)"
                      : "rgba(255,255,255,0.04)",
                    border: canProceedStep1 ? "1px solid rgba(78,124,106,0.5)" : "1px solid rgba(255,255,255,0.07)",
                    color: canProceedStep1 ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.2)",
                    fontFamily: "'HarmonyOS Sans', sans-serif", fontSize: "0.84rem", fontWeight: 600,
                    boxShadow: canProceedStep1 ? "0 4px 18px rgba(16,185,129,0.22)" : "none",
                    transition: "all 0.2s",
                  }}
                >
                  {!themeName.trim()
                    ? t("themeStore.creator.nextEnterName")
                    : selectedCount < 2
                    ? t("themeStore.creator.nextChooseMore", { n: 2 - selectedCount })
                    : t("themeStore.creator.next")}
                  {canProceedStep1 && <ArrowRight size={14} />}
                </Box>
              </MotionBox>
            ) : (
              <MotionBox key="step2"
                initial={{ opacity: 0, x: 14 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 14 }}
                transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] } as any}
              >
                {/* Payout method */}
                <Box mb="18px">
                  <Text mb="10px" style={{ fontSize: "0.6rem", color: "rgba(255,255,255,0.28)", letterSpacing: "0.11em", fontFamily: "'HarmonyOS Sans', sans-serif" }}>
                    {t("themeStore.creator.payoutMethodLabel")}
                  </Text>
                  <Flex gap="10px">
                    <Box as="button" flex={1} onClick={() => setPayoutMethod("coin")}
                      onPointerDown={(e: React.PointerEvent) => e.stopPropagation()}
                      display="flex" alignItems="center" justifyContent="center" gap="6px"
                      py="10px" border="none" borderRadius="10px" cursor="pointer"
                      style={{
                        background: payoutMethod === "coin" ? "rgba(250,204,21,0.12)" : "rgba(255,255,255,0.03)",
                        border: payoutMethod === "coin" ? "1px solid rgba(250,204,21,0.4)" : "1px solid rgba(255,255,255,0.08)",
                        color: payoutMethod === "coin" ? "#facc15" : "rgba(255,255,255,0.4)",
                        transition: "all 0.15s",
                      }}>
                      <Coins size={14} />
                      <Text style={{ fontSize: "0.78rem", fontFamily: "'HarmonyOS Sans', sans-serif", fontWeight: 600 }}>{t("themeStore.creator.payoutCoin")}</Text>
                    </Box>
                    <Box as="button" flex={1} onClick={() => setPayoutMethod("bank")}
                      onPointerDown={(e: React.PointerEvent) => e.stopPropagation()}
                      display="flex" alignItems="center" justifyContent="center" gap="6px"
                      py="10px" border="none" borderRadius="10px" cursor="pointer"
                      style={{
                        background: payoutMethod === "bank" ? "rgba(78,124,106,0.16)" : "rgba(255,255,255,0.03)",
                        border: payoutMethod === "bank" ? "1px solid rgba(78,124,106,0.5)" : "1px solid rgba(255,255,255,0.08)",
                        color: payoutMethod === "bank" ? "rgba(129,190,163,0.95)" : "rgba(255,255,255,0.4)",
                        transition: "all 0.15s",
                      }}>
                      <Landmark size={14} />
                      <Text style={{ fontSize: "0.78rem", fontFamily: "'HarmonyOS Sans', sans-serif", fontWeight: 600 }}>{t("themeStore.creator.payoutBank")}</Text>
                    </Box>
                  </Flex>
                </Box>

                {/* Pricing */}
                <Box mb="18px">
                  <Text mb="10px" style={{ fontSize: "0.6rem", color: "rgba(255,255,255,0.28)", letterSpacing: "0.11em", fontFamily: "'HarmonyOS Sans', sans-serif" }}>
                    {t("themeStore.creator.priceLabel")}{" "}
                    <span style={{ color: "rgba(255,255,255,0.14)" }}>
                      {payoutMethod === "coin" ? t("themeStore.creator.priceHintCoin") : t("themeStore.creator.priceHintBank")}
                    </span>
                  </Text>
                  {payoutMethod === "coin" ? (
                    <Box position="relative">
                      <Input
                        value={coinPrice}
                        onChange={e => setCoinPrice(e.target.value.replace(/[^0-9]/g, ""))}
                        placeholder="0"
                        onPointerDown={(e: React.PointerEvent) => e.stopPropagation()}
                        style={{
                          background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)",
                          borderRadius: "10px", color: "rgba(255,255,255,0.88)",
                          fontFamily: "'HarmonyOS Sans', sans-serif", fontSize: "0.84rem",
                          padding: "9px 36px 9px 12px", width: "100%", outline: "none",
                        }}
                        css={{ "::placeholder": { color: "rgba(255,255,255,0.18)" } }}
                      />
                      <Box position="absolute" right="10px" top="50%"
                        style={{ transform: "translateY(-50%)", pointerEvents: "none", color: "rgba(255,255,255,0.35)", display: "flex" }}>
                        <Coins size={14} />
                      </Box>
                    </Box>
                  ) : (
                    <Box position="relative">
                      <Input
                        value={vndPrice}
                        onChange={e => setVndPrice(e.target.value.replace(/[^0-9]/g, ""))}
                        placeholder="0"
                        onPointerDown={(e: React.PointerEvent) => e.stopPropagation()}
                        style={{
                          background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)",
                          borderRadius: "10px", color: "rgba(255,255,255,0.88)",
                          fontFamily: "'HarmonyOS Sans', sans-serif", fontSize: "0.84rem",
                          padding: "9px 44px 9px 12px", width: "100%", outline: "none",
                        }}
                        css={{ "::placeholder": { color: "rgba(255,255,255,0.18)" } }}
                      />
                      <Text position="absolute" right="10px" top="50%"
                        style={{ transform: "translateY(-50%)", fontSize: "0.6rem", color: "rgba(255,255,255,0.22)", fontFamily: "'HarmonyOS Sans', sans-serif", pointerEvents: "none" }}>
                        {t("themeStore.creator.vnd")}
                      </Text>
                    </Box>
                  )}
                </Box>

                {/* Bank info — only needed when payout is via bank transfer */}
                {payoutMethod === "bank" && (
                  <Box mb="18px">
                    <Text mb="10px" style={{ fontSize: "0.6rem", color: "rgba(255,255,255,0.28)", letterSpacing: "0.11em", fontFamily: "'HarmonyOS Sans', sans-serif" }}>
                      {t("themeStore.creator.bankInfoLabel")}{" "}
                      <span style={{ color: "rgba(255,255,255,0.14)" }}>{t("themeStore.creator.required")}</span>
                    </Text>
                    <Flex direction="column" gap="8px">
                      <Input
                        value={bankAccountOwnerName}
                        onChange={e => setBankAccountOwnerName(e.target.value)}
                        placeholder={t("themeStore.creator.bankOwnerPlaceholder")}
                        onPointerDown={(e: React.PointerEvent) => e.stopPropagation()}
                        style={{
                          background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)",
                          borderRadius: "10px", color: "rgba(255,255,255,0.88)",
                          fontFamily: "'HarmonyOS Sans', sans-serif", fontSize: "0.84rem",
                          padding: "9px 12px", width: "100%", outline: "none",
                        }}
                        css={{ "::placeholder": { color: "rgba(255,255,255,0.18)" } }}
                      />
                      <BankNameCombobox value={bankName} onChange={setBankName} />
                      <Input
                        value={bankAccountNumber}
                        onChange={e => setBankAccountNumber(e.target.value.replace(/[^0-9]/g, ""))}
                        placeholder={t("themeStore.creator.bankNumberPlaceholder")}
                        onPointerDown={(e: React.PointerEvent) => e.stopPropagation()}
                        style={{
                          background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)",
                          borderRadius: "10px", color: "rgba(255,255,255,0.88)",
                          fontFamily: "'HarmonyOS Sans', sans-serif", fontSize: "0.84rem",
                          padding: "9px 12px", width: "100%", outline: "none",
                        }}
                        css={{ "::placeholder": { color: "rgba(255,255,255,0.18)" } }}
                      />
                    </Flex>
                  </Box>
                )}

                {/* Error */}
                <AnimatePresence>
                  {error && (
                    <MotionBox key="error"
                      initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      mb="14px" px="12px" py="9px" borderRadius="9px"
                      style={{
                        background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.25)",
                        color: "#f87171", fontSize: "0.72rem", fontFamily: "'HarmonyOS Sans', sans-serif", lineHeight: 1.5,
                      }}>
                      {error}
                    </MotionBox>
                  )}
                </AnimatePresence>

                {/* Buyout terms */}
                <Flex
                  as="button"
                  onClick={() => setIsAgreedToTerms(v => !v)}
                  onPointerDown={(e: React.PointerEvent) => e.stopPropagation()}
                  align="flex-start" gap="9px" mb="14px" w="100%" textAlign="left"
                  border="none" background="transparent" cursor="pointer" p={0}
                >
                  <Box
                    w="18px" h="18px" borderRadius="5px" flexShrink={0} mt="1px"
                    display="flex" alignItems="center" justifyContent="center"
                    style={{
                      background: isAgreedToTerms ? "rgba(78,124,106,0.6)" : "rgba(255,255,255,0.04)",
                      border: isAgreedToTerms ? "1px solid rgba(78,124,106,0.8)" : "1px solid rgba(255,255,255,0.2)",
                      transition: "all 0.15s",
                    }}
                  >
                    {isAgreedToTerms && <Check size={12} color="white" />}
                  </Box>
                  <Text style={{
                    fontSize: "0.68rem", color: "rgba(255,255,255,0.45)",
                    fontFamily: "'HarmonyOS Sans', sans-serif", lineHeight: 1.55,
                  }}>
                    {t("themeStore.creator.terms")}
                  </Text>
                </Flex>

                {/* Submit */}
                <Box
                  as="button" onClick={handleSave}
                  onPointerDown={(e: React.PointerEvent) => e.stopPropagation()}
                  w="100%" border="none" borderRadius="11px" py="12px"
                  cursor={canSave ? "pointer" : "not-allowed"}
                  display="flex" alignItems="center" justifyContent="center" gap="8px"
                  style={{
                    background: submitSuccess
                      ? "rgba(74,222,128,0.15)"
                      : canSave
                      ? "linear-gradient(135deg, rgba(78,124,106,0.85) 0%, rgba(16,185,129,0.75) 100%)"
                      : "rgba(255,255,255,0.04)",
                    border: submitSuccess
                      ? "1px solid rgba(74,222,128,0.38)"
                      : canSave ? "1px solid rgba(78,124,106,0.5)" : "1px solid rgba(255,255,255,0.07)",
                    color: submitSuccess ? "#4ade80" : canSave ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.2)",
                    fontFamily: "'HarmonyOS Sans', sans-serif", fontSize: "0.84rem", fontWeight: 600,
                    boxShadow: canSave && !submitSuccess ? "0 4px 18px rgba(16,185,129,0.22)" : "none",
                    transition: "all 0.2s", opacity: isSubmitting ? 0.7 : 1,
                  }}
                >
                  {isSubmitting ? (
                    <><LoadingRing size={14} />{uploadLabel ?? t("themeStore.creator.submitting")}</>
                  ) : submitSuccess ? (
                    <><CheckCircle size={14} />{isEditing ? t("themeStore.creator.updated") : t("themeStore.creator.submitted")}</>
                  ) : (
                    <>
                      <Upload size={14} />
                      {payoutMethod === "coin" && !coinAmountValid
                        ? t("themeStore.creator.needCoinAmount")
                        : payoutMethod === "bank" && !bankFieldsProvided
                        ? t("themeStore.creator.needBankInfo")
                        : payoutMethod === "bank" && !bankAmountValid
                        ? t("themeStore.creator.needMinAmount")
                        : !isAgreedToTerms
                        ? t("themeStore.creator.needAgreeTerms")
                        : isEditing ? t("themeStore.creator.submitUpdate") : t("themeStore.creator.submitCreate")}
                    </>
                  )}
                </Box>

                {!submitSuccess && !isSubmitting && (
                  <Text mt="10px" style={{
                    fontSize: "0.6rem", color: "rgba(255,255,255,0.15)",
                    fontFamily: "'HarmonyOS Sans', sans-serif", textAlign: "center", lineHeight: 1.6,
                  }}>
                    {isEditing
                      ? t("themeStore.creator.footerEditing")
                      : t("themeStore.creator.footerCreating")}
                  </Text>
                )}
              </MotionBox>
            )}
          </AnimatePresence>
        </Box>
      </Box>

      <style>{`
        .theme-desc::placeholder { color: rgba(255,255,255,0.18); }
        .theme-desc:focus { border-color: rgba(255,255,255,0.24) !important; }
        .theme-desc::-webkit-scrollbar { display: none; }
      `}</style>
    </MotionBox>
  );
}
