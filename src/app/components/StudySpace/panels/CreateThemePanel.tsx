import { useState, useEffect, useRef, useCallback } from "react";
import { Box, Flex, Text, Input } from "@chakra-ui/react";
import { motion, AnimatePresence } from "motion/react";
import {
  Palette, Image as ImageIcon, Music, Check,
  Play, Pause, Loader2, CheckCircle, Upload, X, FolderOpen,
} from "lucide-react";
import { PanelCloseBtn } from "../ui/PanelCloseBtn";
import { useCenteredPanel } from "../hooks/useCenteredPanel";
import {
  userThemeService,
  type UserThemeSubmission,
} from "../../../../services/userTheme.service";
import {
  aestheticStoreService,
  type InventoryItem,
} from "../../../../services/aestheticStore.service";

const MotionBox = motion.create(Box);
const PANEL_W = 480;
const PANEL_H = 640;

type ComponentType = "background" | "sticker" | "ambientSound";

interface LocalFile {
  id: string;
  file: File;
  objectUrl: string;
  componentType: ComponentType;
}

function makeId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function defaultType(file: File): ComponentType {
  return file.type.startsWith("audio/") ? "ambientSound" : "background";
}

async function uploadToCloud(file: File): Promise<string> {
  const cloudName   = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME as string;
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET as string;
  const form = new FormData();
  form.append("file", file);
  form.append("upload_preset", uploadPreset);
  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/upload`, {
    method: "POST",
    body: form,
  });
  if (!res.ok) throw new Error(`Upload lên Cloudinary thất bại: ${res.status}`);
  const json = await res.json();
  return json.secure_url as string;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <Text mb="8px" style={{
      fontSize: "0.6rem", color: "rgba(255,255,255,0.22)",
      letterSpacing: "0.14em", fontFamily: "'HarmonyOS Sans', sans-serif",
    }}>
      {children}
    </Text>
  );
}

const TYPE_LABELS: Record<ComponentType, string> = {
  background:   "Nền",
  sticker:      "Sticker",
  ambientSound: "Âm thanh",
};

const TYPE_ICONS: Record<ComponentType, React.ReactNode> = {
  background:   <ImageIcon size={9} />,
  sticker:      <span style={{ fontSize: 9 }}>✦</span>,
  ambientSound: <Music size={9} />,
};

// ── Main ─────────────────────────────────────────────────────────────────────

interface Props {
  onClose: () => void;
  initialTheme?: UserThemeSubmission;
}

export function CreateThemePanel({ onClose, initialTheme }: Props) {
  const isEditing = !!initialTheme;
  const { x, y, ref } = useCenteredPanel(PANEL_W, PANEL_H);

  // Inventory (backgrounds)
  const [inventory, setInventory]   = useState<InventoryItem[]>([]);
  const [invLoading, setInvLoading] = useState(true);

  // Theme name
  const [themeName, setThemeName] = useState(initialTheme?.name ?? "");

  // Inventory background selection
  const [selectedBgInventoryId, setSelectedBgInventoryId] = useState<string | null>(
    initialTheme?.themeBackgroundItemId ?? null
  );

  // Local files (unified)
  const [localFiles, setLocalFiles] = useState<LocalFile[]>([]);

  // Active selection per type (which local file is "used" for submission)
  const [activeBgFileId,      setActiveBgFileId]      = useState<string | null>(null);
  const [activeStickerFileId, setActiveStickerFileId] = useState<string | null>(null);
  const [activeSoundFileId,   setActiveSoundFileId]   = useState<string | null>(null);

  // Pricing
  const [coinPrice, setCoinPrice] = useState<string>(String(initialTheme?.coinPrice ?? ""));
  const [vndPrice,  setVndPrice]  = useState<string>(String(initialTheme?.realMoneyPriceVnd ?? ""));

  // Audio playback
  const [playingSoundId, setPlayingSoundId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Submit
  const [isSubmitting,  setIsSubmitting]  = useState(false);
  const [uploadLabel,   setUploadLabel]   = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [error,         setError]         = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // ── Load inventory ──
  useEffect(() => {
    aestheticStoreService.getInventory(1, 200)
      .then(d => setInventory(d))
      .catch(() => {})
      .finally(() => setInvLoading(false));
  }, []);

  // ── Cleanup ──
  useEffect(() => {
    return () => {
      audioRef.current?.pause();
      localFiles.forEach(f => URL.revokeObjectURL(f.objectUrl));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Auto close after success ──
  useEffect(() => {
    if (!submitSuccess) return;
    const t = setTimeout(onClose, 1600);
    return () => clearTimeout(t);
  }, [submitSuccess, onClose]);

  // ── Derived ──
  const bgItems = inventory.filter(i => i.category === "Background");

  const activeBgFile      = localFiles.find(f => f.id === activeBgFileId);
  const activeStickerFile = localFiles.find(f => f.id === activeStickerFileId);
  const activeSoundFile   = localFiles.find(f => f.id === activeSoundFileId);
  const selectedBgInv     = inventory.find(i => i.storeItemId === selectedBgInventoryId);

  const previewBgUrl      = selectedBgInv?.assetUrl ?? activeBgFile?.objectUrl ?? null;
  const previewStickerUrl = activeStickerFile?.objectUrl ?? null;
  const previewSoundName  = activeSoundFile?.file.name ?? null;

  const hasBg      = !!selectedBgInventoryId || !!activeBgFileId;
  const hasSticker = !!activeStickerFileId;
  const hasSound   = !!activeSoundFileId;
  const selectedCount = [hasBg, hasSticker, hasSound].filter(Boolean).length;
  const canSave = themeName.trim().length > 0 && selectedCount >= 2 && !isSubmitting && !submitSuccess;

  // ── File import ──
  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    const newFiles: LocalFile[] = files.map(file => ({
      id: makeId(), file, objectUrl: URL.createObjectURL(file),
      componentType: defaultType(file),
    }));
    setLocalFiles(prev => [...prev, ...newFiles]);

    // Auto-select first file of each type if nothing selected yet
    newFiles.forEach(lf => {
      if (lf.componentType === "background") {
        setActiveBgFileId(prev => prev ?? lf.id);
        setSelectedBgInventoryId(null);
      } else if (lf.componentType === "sticker") {
        setActiveStickerFileId(prev => prev ?? lf.id);
      } else {
        setActiveSoundFileId(prev => prev ?? lf.id);
      }
    });
    e.target.value = "";
  };

  // ── Change type ──
  const changeType = (id: string, newType: ComponentType) => {
    const lf = localFiles.find(f => f.id === id);
    if (!lf || lf.file.type.startsWith("audio/")) return; // audio locked to ambientSound
    setLocalFiles(prev => prev.map(f => f.id === id ? { ...f, componentType: newType } : f));
    // Deselect from old type
    if (lf.componentType === "background" && activeBgFileId === id) setActiveBgFileId(null);
    if (lf.componentType === "sticker" && activeStickerFileId === id) setActiveStickerFileId(null);
    // Auto-select for new type
    if (newType === "background") {
      setActiveBgFileId(prev => prev ?? id);
      setSelectedBgInventoryId(null);
    } else if (newType === "sticker") {
      setActiveStickerFileId(prev => prev ?? id);
    }
  };

  // ── Select as active ──
  const selectFile = (lf: LocalFile) => {
    if (lf.componentType === "background") {
      setActiveBgFileId(id => id === lf.id ? null : lf.id);
      setSelectedBgInventoryId(null);
    } else if (lf.componentType === "sticker") {
      setActiveStickerFileId(id => id === lf.id ? null : lf.id);
    } else {
      setActiveSoundFileId(id => id === lf.id ? null : lf.id);
    }
  };

  // ── Select inventory background ──
  const selectBgInventory = (id: string) => {
    setSelectedBgInventoryId(prev => prev === id ? null : id);
    setActiveBgFileId(null);
  };

  // ── Remove file ──
  const removeFile = (id: string) => {
    const lf = localFiles.find(f => f.id === id);
    if (!lf) return;
    URL.revokeObjectURL(lf.objectUrl);
    if (lf.componentType === "ambientSound" && playingSoundId === id) {
      audioRef.current?.pause();
      setPlayingSoundId(null);
    }
    if (activeBgFileId      === id) setActiveBgFileId(null);
    if (activeStickerFileId === id) setActiveStickerFileId(null);
    if (activeSoundFileId   === id) setActiveSoundFileId(null);
    setLocalFiles(prev => prev.filter(f => f.id !== id));
  };

  // ── Sound playback ──
  const toggleSound = useCallback((lf: LocalFile) => {
    if (playingSoundId === lf.id) {
      audioRef.current?.pause();
      setPlayingSoundId(null);
      return;
    }
    audioRef.current?.pause();
    const audio = new Audio(lf.objectUrl);
    audioRef.current = audio;
    audio.play().catch(() => {});
    audio.onended = () => setPlayingSoundId(null);
    setPlayingSoundId(lf.id);
  }, [playingSoundId]);

  // ── Submit ──
  const handleSave = async () => {
    if (!canSave) return;
    setIsSubmitting(true);
    setError(null);
    try {
      let assetUrl = selectedBgInv?.assetUrl ?? "";
      let customBackgroundUrl: string | undefined = undefined;
      let customStickerUrl:    string | undefined = undefined;
      let customAmbientSoundUrl: string | undefined = undefined;

      if (!assetUrl && activeBgFile) {
        setUploadLabel("Đang tải hình nền lên…");
        assetUrl = await uploadToCloud(activeBgFile.file);
        customBackgroundUrl = assetUrl;
      }
      if (activeStickerFile) {
        setUploadLabel("Đang tải sticker lên…");
        customStickerUrl = await uploadToCloud(activeStickerFile.file);
      }
      if (activeSoundFile) {
        setUploadLabel("Đang tải âm thanh lên…");
        customAmbientSoundUrl = await uploadToCloud(activeSoundFile.file);
      }

      const dto = {
        name:    themeName.trim(),
        assetUrl,
        previewUrl: assetUrl || undefined,
        themeBackgroundItemId: selectedBgInventoryId ?? undefined,
        customBackgroundUrl,
        customStickerUrl,
        customAmbientSoundUrl,
        coinPrice:          coinPrice !== "" ? Number(coinPrice) : undefined,
        realMoneyPriceVnd:  vndPrice  !== "" ? Number(vndPrice)  : undefined,
      };

      setUploadLabel(isEditing ? "Đang cập nhật theme…" : "Đang gửi theme để duyệt…");
      if (isEditing) {
        await userThemeService.update(initialTheme!.id, dto);
      } else {
        await userThemeService.submit(dto);
      }
      setSubmitSuccess(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Không thể lưu theme. Vui lòng thử lại.";
      setError(msg);
    } finally {
      setIsSubmitting(false);
      setUploadLabel(null);
    }
  };

  // ── File card ──
  const FileCard = ({ lf }: { lf: LocalFile }) => {
    const isAudio    = lf.file.type.startsWith("audio/");
    const isActive   = activeBgFileId === lf.id || activeStickerFileId === lf.id || activeSoundFileId === lf.id;
    const isPlaying  = playingSoundId === lf.id;
    const imageTypes: ComponentType[] = ["background", "sticker"];

    return (
      <Flex
        align="center"
        gap={2}
        px="10px"
        py="8px"
        borderRadius="8px"
        onPointerDown={(e: React.PointerEvent) => e.stopPropagation()}
        style={{
          background: isActive ? "rgba(74,222,128,0.06)" : "rgba(255,255,255,0.03)",
          border: isActive ? "1px solid rgba(74,222,128,0.25)" : "1px solid rgba(255,255,255,0.07)",
          transition: "all 0.15s",
        }}
      >
        {/* Thumbnail / audio icon */}
        {isAudio ? (
          <Box
            as="button"
            onClick={() => toggleSound(lf)}
            flexShrink={0}
            borderRadius="6px"
            border="none"
            cursor="pointer"
            display="flex" alignItems="center" justifyContent="center"
            style={{
              width: 32, height: 32,
              background: isPlaying ? "rgba(99,102,241,0.2)" : "rgba(255,255,255,0.07)",
              border: isPlaying ? "1px solid rgba(99,102,241,0.4)" : "1px solid rgba(255,255,255,0.1)",
              color: isPlaying ? "rgba(129,140,248,0.95)" : "rgba(255,255,255,0.5)",
              transition: "all 0.15s",
            }}
          >
            {isPlaying ? <Pause size={12} /> : <Play size={12} />}
          </Box>
        ) : (
          <Box
            flexShrink={0}
            borderRadius="6px"
            overflow="hidden"
            style={{ width: 32, height: 32, background: "rgba(255,255,255,0.06)", cursor: "pointer" }}
            onClick={() => selectFile(lf)}
          >
            <img src={lf.objectUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} draggable={false} />
          </Box>
        )}

        {/* Filename */}
        <Text
          flex={1}
          onClick={() => !isAudio && selectFile(lf)}
          style={{
            fontSize: "0.72rem", color: "rgba(255,255,255,0.7)",
            fontFamily: "'HarmonyOS Sans', sans-serif",
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            cursor: isAudio ? "default" : "pointer",
          }}
        >
          {lf.file.name}
        </Text>

        {/* Type chips */}
        <Flex gap="4px" flexShrink={0}>
          {(isAudio ? ["ambientSound"] as ComponentType[] : imageTypes).map(t => {
            const active = lf.componentType === t;
            return (
              <Box
                key={t}
                as="button"
                onClick={() => changeType(lf.id, t)}
                border="none"
                cursor={isAudio ? "default" : "pointer"}
                borderRadius="5px"
                px="6px"
                py="2px"
                display="flex" alignItems="center" gap="3px"
                style={{
                  background: active ? "rgba(74,222,128,0.18)" : "rgba(255,255,255,0.05)",
                  border: active ? "1px solid rgba(74,222,128,0.4)" : "1px solid rgba(255,255,255,0.1)",
                  color: active ? "rgba(74,222,128,0.9)" : "rgba(255,255,255,0.3)",
                  fontSize: "0.58rem", fontFamily: "'HarmonyOS Sans', sans-serif",
                  transition: "all 0.12s",
                  pointerEvents: isAudio ? "none" : "auto",
                }}
              >
                {TYPE_ICONS[t]}{TYPE_LABELS[t]}
              </Box>
            );
          })}
        </Flex>

        {/* Select (audio) / active indicator (image) */}
        {isAudio ? (
          <Box
            as="button"
            onClick={() => selectFile(lf)}
            border="none" cursor="pointer" borderRadius="5px" px="6px" py="2px"
            flexShrink={0}
            display="flex" alignItems="center" gap="3px"
            style={{
              background: isActive ? "rgba(74,222,128,0.18)" : "rgba(255,255,255,0.05)",
              border: isActive ? "1px solid rgba(74,222,128,0.4)" : "1px solid rgba(255,255,255,0.1)",
              color: isActive ? "rgba(74,222,128,0.9)" : "rgba(255,255,255,0.3)",
              fontSize: "0.58rem", fontFamily: "'HarmonyOS Sans', sans-serif",
              transition: "all 0.12s",
            }}
          >
            {isActive && <Check size={9} />}
            {isActive ? "Đã chọn" : "Chọn"}
          </Box>
        ) : (
          isActive && (
            <Box flexShrink={0} style={{ color: "rgba(74,222,128,0.8)" }}>
              <Check size={13} />
            </Box>
          )
        )}

        {/* Remove */}
        <Box
          as="button"
          onClick={() => removeFile(lf.id)}
          border="none" cursor="pointer" borderRadius="5px" flexShrink={0}
          display="flex" alignItems="center" justifyContent="center"
          style={{
            width: 20, height: 20,
            background: "transparent",
            color: "rgba(255,255,255,0.2)",
            transition: "all 0.12s",
          }}
          _hover={{ background: "rgba(248,113,113,0.15) !important", color: "rgba(248,113,113,0.7) !important" }}
        >
          <X size={11} />
        </Box>
      </Flex>
    );
  };

  // ── Render ──
  return (
    <MotionBox
      ref={ref as any}
      drag dragMomentum={false} dragElastic={0}
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1, transition: { type: "spring", stiffness: 500, damping: 24, mass: 0.9 } } as any}
      exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.14, ease: [0.4, 0, 1, 1] } } as any}
      position="fixed" top={0} left={0} zIndex={55}
      style={{
        x, y, width: PANEL_W, height: PANEL_H, borderRadius: "16px",
        background: "rgba(12,18,22,0.78)",
        backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
        border: "1px solid rgba(255,255,255,0.1)",
        boxShadow: "0 24px 80px rgba(0,0,0,0.75), 0 0 0 1px rgba(255,255,255,0.08)",
        cursor: "grab", overflow: "hidden",
      }}
    >
      <Box position="relative" display="flex" flexDirection="column" style={{ height: "100%" }}>

        {/* Title bar */}
        <Box flexShrink={0} px="20px" pt="18px" pb="14px"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.07)", paddingRight: "52px" }}>
          <PanelCloseBtn onClose={onClose} />
          <Flex align="center" gap={2}>
            <Palette size={15} style={{ color: "rgba(255,255,255,0.5)" }} />
            <Text style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.35)", letterSpacing: "0.1em", fontFamily: "'HarmonyOS Sans', sans-serif" }}>
              {isEditing ? "CHỈNH SỬA CHỦ ĐỀ" : "TẠO CHỦ ĐỀ CỦA BẠN"}
            </Text>
            <Box px="5px" py="1px" borderRadius="4px" style={{ background: "rgba(78,124,106,0.2)", border: "1px solid rgba(78,124,106,0.38)" }}>
              <Text style={{ fontSize: "0.52rem", fontFamily: "'HarmonyOS Sans', sans-serif", fontWeight: 700, color: "rgba(78,124,106,0.9)", letterSpacing: "0.07em" }}>BETA</Text>
            </Box>
          </Flex>
        </Box>

        {/* Scrollable body */}
        <Box flex={1} overflowY="auto" style={{ scrollbarWidth: "none" }}>
          <Box px="20px" pt="16px" pb="24px">

            {/* Theme name */}
            <Box mb={4}>
              <SectionLabel>TÊN CHỦ ĐỀ</SectionLabel>
              <Input
                value={themeName}
                onChange={e => setThemeName(e.target.value.slice(0, 40))}
                placeholder="Ví dụ: My Lofi Night…"
                onPointerDown={(e: React.PointerEvent) => e.stopPropagation()}
                style={{
                  background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)",
                  borderRadius: "10px", color: "rgba(255,255,255,0.88)",
                  fontFamily: "'HarmonyOS Sans', sans-serif", fontSize: "0.84rem",
                  padding: "10px 14px", width: "100%", outline: "none",
                }}
                css={{ "::placeholder": { color: "rgba(255,255,255,0.22)" }, ":focus": { borderColor: "rgba(255,255,255,0.28) !important" } }}
              />
              <Flex justify="flex-end" mt="4px">
                <Text style={{ fontSize: "0.62rem", color: "rgba(255,255,255,0.2)", fontFamily: "'HarmonyOS Sans', sans-serif" }}>{themeName.length}/40</Text>
              </Flex>
            </Box>

            {/* Inventory backgrounds */}
            <Box mb={4}>
              <Flex align="center" justify="space-between" mb="8px">
                <Flex align="center" gap="6px">
                  <ImageIcon size={11} color="rgba(255,255,255,0.3)" />
                  <SectionLabel>HÌNH NỀN TỪ KHO</SectionLabel>
                </Flex>
                {selectedBgInventoryId && <Text style={{ fontSize: "0.6rem", color: "rgba(74,222,128,0.7)", fontFamily: "'HarmonyOS Sans', sans-serif" }}>✓ Đã chọn</Text>}
              </Flex>
              {invLoading ? (
                <Flex h="56px" align="center" gap="6px">
                  <Loader2 size={12} color="rgba(255,255,255,0.2)" style={{ animation: "spin 1s linear infinite" }} />
                  <Text style={{ fontSize: "0.66rem", fontFamily: "'HarmonyOS Sans', sans-serif", color: "rgba(255,255,255,0.2)" }}>Đang tải…</Text>
                </Flex>
              ) : bgItems.length === 0 ? (
                <Text style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.18)", fontFamily: "'HarmonyOS Sans', sans-serif" }}>Bạn chưa có hình nền nào trong kho.</Text>
              ) : (
                <Flex gap="8px" onPointerDown={(e: React.PointerEvent) => e.stopPropagation()}
                  style={{ overflowX: "auto", paddingBottom: 4, scrollbarWidth: "none" }}>
                  {bgItems.map(item => {
                    const isSel = selectedBgInventoryId === item.storeItemId;
                    return (
                      <Box key={item.storeItemId} as="button" onClick={() => selectBgInventory(item.storeItemId)}
                        onPointerDown={(e: React.PointerEvent) => e.stopPropagation()}
                        flexShrink={0} borderRadius="8px" overflow="hidden" border="none" cursor="pointer" position="relative"
                        style={{
                          width: 100, height: 64,
                          backgroundImage: item.assetUrl ? `url(${item.assetUrl})` : undefined,
                          backgroundSize: "cover", backgroundPosition: "center",
                          background: item.assetUrl ? undefined : "rgba(255,255,255,0.06)",
                          border: isSel ? "2px solid rgba(74,222,128,0.85)" : "2px solid rgba(255,255,255,0.08)",
                          transition: "border-color 0.15s",
                        }}
                      >
                        {isSel && (
                          <Flex position="absolute" inset={0} align="center" justify="center" style={{ background: "rgba(0,0,0,0.3)" }}>
                            <Box style={{ width: 20, height: 20, borderRadius: "50%", background: "rgba(74,222,128,0.9)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                              <Check size={10} color="#fff" />
                            </Box>
                          </Flex>
                        )}
                        <Box position="absolute" bottom={0} left={0} right={0} px="5px" py="3px"
                          style={{ background: "linear-gradient(transparent, rgba(0,0,0,0.7))", pointerEvents: "none" }}>
                          <Text style={{ fontSize: "0.52rem", fontFamily: "'HarmonyOS Sans', sans-serif", color: "rgba(255,255,255,0.7)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {item.name}
                          </Text>
                        </Box>
                      </Box>
                    );
                  })}
                </Flex>
              )}
            </Box>

            {/* Local files */}
            <Box mb={4}>
              <Flex align="center" justify="space-between" mb="8px">
                <SectionLabel>FILE CỦA BẠN</SectionLabel>
                <Box
                  as="button"
                  onClick={() => fileInputRef.current?.click()}
                  onPointerDown={(e: React.PointerEvent) => e.stopPropagation()}
                  border="none" cursor="pointer" borderRadius="6px" px="8px" py="3px"
                  display="flex" alignItems="center" gap="5px"
                  style={{
                    background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)",
                    color: "rgba(255,255,255,0.5)", fontSize: "0.62rem", fontFamily: "'HarmonyOS Sans', sans-serif",
                    transition: "all 0.15s",
                  }}
                  _hover={{ background: "rgba(255,255,255,0.1) !important", color: "rgba(255,255,255,0.8) !important" }}
                >
                  <FolderOpen size={11} />Nhập file
                </Box>
                <input ref={fileInputRef} type="file" accept="image/*,audio/*" multiple style={{ display: "none" }} onChange={handleFiles} />
              </Flex>

              {localFiles.length === 0 ? (
                <Box
                  as="button"
                  onClick={() => fileInputRef.current?.click()}
                  onPointerDown={(e: React.PointerEvent) => e.stopPropagation()}
                  w="100%" border="none" cursor="pointer" borderRadius="10px"
                  style={{
                    padding: "18px 0", background: "rgba(255,255,255,0.02)",
                    border: "1.5px dashed rgba(255,255,255,0.08)",
                    display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
                    color: "rgba(255,255,255,0.22)", fontFamily: "'HarmonyOS Sans', sans-serif", fontSize: "0.72rem",
                    transition: "all 0.15s",
                  }}
                  _hover={{ borderColor: "rgba(255,255,255,0.2) !important", color: "rgba(255,255,255,0.5) !important" }}
                >
                  <FolderOpen size={16} />
                  Nhập ảnh hoặc âm thanh từ máy
                  <Text style={{ fontSize: "0.58rem", color: "rgba(255,255,255,0.15)", fontFamily: "'HarmonyOS Sans', sans-serif" }}>
                    Ảnh → Nền hoặc Sticker · Audio → Âm thanh
                  </Text>
                </Box>
              ) : (
                <Flex direction="column" gap="6px">
                  {localFiles.map(lf => <FileCard key={lf.id} lf={lf} />)}
                </Flex>
              )}

              {/* Component legend */}
              {localFiles.length > 0 && (
                <Flex gap="10px" mt="8px" align="center">
                  {(["background", "sticker", "ambientSound"] as ComponentType[]).map(t => {
                    const isActive = (t === "background" && !!activeBgFileId)
                      || (t === "sticker" && !!activeStickerFileId)
                      || (t === "ambientSound" && !!activeSoundFileId);
                    return (
                      <Flex key={t} align="center" gap="4px">
                        <Box style={{
                          width: 6, height: 6, borderRadius: "50%",
                          background: isActive ? "rgba(74,222,128,0.8)" : "rgba(255,255,255,0.15)",
                        }} />
                        <Text style={{ fontSize: "0.58rem", color: isActive ? "rgba(74,222,128,0.7)" : "rgba(255,255,255,0.2)", fontFamily: "'HarmonyOS Sans', sans-serif" }}>
                          {TYPE_LABELS[t]}
                        </Text>
                      </Flex>
                    );
                  })}
                </Flex>
              )}
            </Box>

            {/* Pricing */}
            <Box mb={4}>
              <SectionLabel>GIÁ BÁN</SectionLabel>
              <Flex gap={3}>
                <Box flex={1}>
                  <Text mb="5px" style={{ fontSize: "0.62rem", color: "rgba(255,255,255,0.3)", fontFamily: "'HarmonyOS Sans', sans-serif" }}>
                    Coin
                  </Text>
                  <Box position="relative">
                    <Input
                      value={coinPrice}
                      onChange={e => {
                        const v = e.target.value.replace(/[^0-9]/g, "");
                        setCoinPrice(v);
                      }}
                      placeholder="0"
                      onPointerDown={(e: React.PointerEvent) => e.stopPropagation()}
                      style={{
                        background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)",
                        borderRadius: "10px", color: "rgba(255,255,255,0.88)",
                        fontFamily: "'HarmonyOS Sans', sans-serif", fontSize: "0.84rem",
                        padding: "9px 36px 9px 12px", width: "100%", outline: "none",
                      }}
                      css={{ "::placeholder": { color: "rgba(255,255,255,0.22)" }, ":focus": { borderColor: "rgba(255,255,255,0.28) !important" } }}
                    />
                    <Text position="absolute" right="10px" top="50%" style={{ transform: "translateY(-50%)", fontSize: "0.68rem", color: "rgba(255,255,255,0.25)", fontFamily: "'HarmonyOS Sans', sans-serif", pointerEvents: "none" }}>
                      🪙
                    </Text>
                  </Box>
                </Box>
                <Box flex={1}>
                  <Text mb="5px" style={{ fontSize: "0.62rem", color: "rgba(255,255,255,0.3)", fontFamily: "'HarmonyOS Sans', sans-serif" }}>
                    VNĐ
                  </Text>
                  <Box position="relative">
                    <Input
                      value={vndPrice}
                      onChange={e => {
                        const v = e.target.value.replace(/[^0-9]/g, "");
                        setVndPrice(v);
                      }}
                      placeholder="0"
                      onPointerDown={(e: React.PointerEvent) => e.stopPropagation()}
                      style={{
                        background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)",
                        borderRadius: "10px", color: "rgba(255,255,255,0.88)",
                        fontFamily: "'HarmonyOS Sans', sans-serif", fontSize: "0.84rem",
                        padding: "9px 40px 9px 12px", width: "100%", outline: "none",
                      }}
                      css={{ "::placeholder": { color: "rgba(255,255,255,0.22)" }, ":focus": { borderColor: "rgba(255,255,255,0.28) !important" } }}
                    />
                    <Text position="absolute" right="10px" top="50%" style={{ transform: "translateY(-50%)", fontSize: "0.6rem", color: "rgba(255,255,255,0.25)", fontFamily: "'HarmonyOS Sans', sans-serif", pointerEvents: "none" }}>
                      VNĐ
                    </Text>
                  </Box>
                </Box>
              </Flex>
              <Text mt="6px" style={{ fontSize: "0.6rem", color: "rgba(255,255,255,0.18)", fontFamily: "'HarmonyOS Sans', sans-serif" }}>
                Để trống nếu muốn miễn phí
              </Text>
            </Box>

            {/* Preview */}
            <Box mb={4}>
              <SectionLabel>XEM TRƯỚC</SectionLabel>
              <Box borderRadius="10px" overflow="hidden" position="relative"
                style={{ height: 90, border: "1px solid rgba(255,255,255,0.1)" }}>
                {previewBgUrl ? (
                  <Box position="absolute" inset={0} style={{ backgroundImage: `url(${previewBgUrl})`, backgroundSize: "cover", backgroundPosition: "center" }} />
                ) : (
                  <Box position="absolute" inset={0} style={{ background: "linear-gradient(135deg, rgba(20,25,32,1) 0%, rgba(14,20,28,1) 100%)" }} />
                )}
                <Box position="absolute" inset={0} style={{ background: "rgba(0,0,0,0.38)" }} />
                {previewStickerUrl && (
                  <Box position="absolute" style={{ width: 30, height: 30, bottom: 8, right: 10, backgroundImage: `url(${previewStickerUrl})`, backgroundSize: "contain", backgroundRepeat: "no-repeat", backgroundPosition: "center", filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.5))" }} />
                )}
                <Flex position="absolute" inset={0} align="center" justify="center" direction="column" gap="5px">
                  <Text style={{ fontSize: "0.9rem", fontWeight: 600, color: themeName ? "rgba(255,255,255,0.92)" : "rgba(255,255,255,0.2)", fontFamily: "'HarmonyOS Sans', sans-serif", letterSpacing: "0.04em", textShadow: "0 1px 8px rgba(0,0,0,0.7)" }}>
                    {themeName || "Tên chủ đề của bạn"}
                  </Text>
                  <Flex gap="10px">
                    {previewBgUrl && (
                      <Flex align="center" gap="4px" style={{ opacity: 0.5 }}>
                        <ImageIcon size={9} color="white" />
                        <Text style={{ fontSize: "0.56rem", color: "white", fontFamily: "'HarmonyOS Sans', sans-serif" }}>
                          {selectedBgInv?.name ?? activeBgFile?.file.name}
                        </Text>
                      </Flex>
                    )}
                    {previewSoundName && (
                      <Flex align="center" gap="4px" style={{ opacity: 0.5 }}>
                        <Music size={9} color="white" />
                        <Text style={{ fontSize: "0.56rem", color: "white", fontFamily: "'HarmonyOS Sans', sans-serif" }}>{previewSoundName}</Text>
                      </Flex>
                    )}
                  </Flex>
                </Flex>
              </Box>
            </Box>

            {/* Validation hint */}
            {selectedCount < 2 && (
              <Text mb={3} style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.28)", fontFamily: "'HarmonyOS Sans', sans-serif", textAlign: "center" }}>
                Chọn ít nhất 2 thành phần (nền, sticker hoặc âm thanh) để gửi duyệt
              </Text>
            )}

            {/* Error */}
            <AnimatePresence>
              {error && (
                <MotionBox key="error" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  mb={3} px="12px" py="8px" borderRadius="8px"
                  style={{ background: "rgba(248,113,113,0.12)", border: "1px solid rgba(248,113,113,0.28)", color: "#f87171", fontSize: "0.72rem", fontFamily: "'HarmonyOS Sans', sans-serif" }}>
                  {error}
                </MotionBox>
              )}
            </AnimatePresence>

            {/* Submit */}
            <Box
              as="button" onClick={handleSave}
              onPointerDown={(e: React.PointerEvent) => e.stopPropagation()}
              w="100%" border="none" cursor={canSave ? "pointer" : "not-allowed"} borderRadius="10px" py="11px"
              style={{
                background: submitSuccess ? "rgba(74,222,128,0.18)" : canSave ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.04)",
                border: submitSuccess ? "1px solid rgba(74,222,128,0.35)" : canSave ? "1px solid rgba(255,255,255,0.22)" : "1px solid rgba(255,255,255,0.07)",
                color: submitSuccess ? "#4ade80" : canSave ? "rgba(255,255,255,0.88)" : "rgba(255,255,255,0.2)",
                fontFamily: "'HarmonyOS Sans', sans-serif", fontSize: "0.82rem", fontWeight: 600, letterSpacing: "0.05em",
                transition: "background 0.2s, border 0.2s, color 0.2s",
                opacity: isSubmitting ? 0.7 : 1,
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              }}
            >
              {isSubmitting ? (
                <><Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />{uploadLabel ?? "Đang gửi…"}</>
              ) : submitSuccess ? (
                <><CheckCircle size={14} />{isEditing ? "Đã cập nhật!" : "Đã gửi duyệt!"}</>
              ) : (
                <><Upload size={14} />
                  {!themeName.trim() ? "Nhập tên để tiếp tục"
                    : selectedCount < 2 ? `Chọn thêm ${2 - selectedCount} thành phần nữa`
                    : isEditing ? "Cập nhật theme" : "Lưu & Gửi duyệt"}
                </>
              )}
            </Box>

            {!submitSuccess && !isSubmitting && (
              <Text mt="8px" style={{ fontSize: "0.62rem", color: "rgba(255,255,255,0.18)", fontFamily: "'HarmonyOS Sans', sans-serif", textAlign: "center", lineHeight: 1.5 }}>
                {isEditing ? "Thay đổi sẽ được gửi lại để admin duyệt" : "Theme sẽ được gửi để admin duyệt trước khi xuất hiện trong store"}
              </Text>
            )}

          </Box>
        </Box>
      </Box>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </MotionBox>
  );
}
