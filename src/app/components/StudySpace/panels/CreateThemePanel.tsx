import { useState, useEffect, useRef, useCallback } from "react";
import { Box, Flex, Text, Input } from "@chakra-ui/react";
import { motion, AnimatePresence } from "motion/react";
import {
  Palette, Image as ImageIcon, Music, Sparkles,
  Check, Play, Pause, Loader2, CheckCircle, Upload,
  ShoppingBag,
} from "lucide-react";
import { PanelCloseBtn } from "../ui/PanelCloseBtn";
import { useCenteredPanel } from "../hooks/useCenteredPanel";
import { userThemeService } from "../../../../services/userTheme.service";
import {
  aestheticStoreService,
  type InventoryItem,
} from "../../../../services/aestheticStore.service";

const MotionBox = motion.create(Box);

const PANEL_W = 480;
const PANEL_H = 640;

// ── Sub-components ───────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <Text mb="8px" style={{
      fontSize: "0.6rem",
      color: "rgba(255,255,255,0.22)",
      letterSpacing: "0.14em",
      fontFamily: "'HarmonyOS Sans', sans-serif",
    }}>
      {children}
    </Text>
  );
}

function EmptyInventory({ label, onGoToStore }: { label: string; onGoToStore?: () => void }) {
  return (
    <Flex
      direction="column"
      align="center"
      py="14px"
      gap="8px"
      borderRadius="10px"
      style={{ background: "rgba(255,255,255,0.02)", border: "1.5px dashed rgba(255,255,255,0.08)" }}
    >
      <Text style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.3)", fontFamily: "'HarmonyOS Sans', sans-serif" }}>
        Chưa có {label} nào trong thư viện
      </Text>
      {onGoToStore && (
        <Box
          as="button"
          onClick={onGoToStore}
          onPointerDown={(e: React.PointerEvent) => e.stopPropagation()}
          border="none"
          cursor="pointer"
          borderRadius="6px"
          px="10px"
          py="4px"
          display="flex"
          alignItems="center"
          gap="5px"
          style={{
            background: "rgba(139,92,246,0.14)",
            border: "1px solid rgba(139,92,246,0.3)",
            color: "rgba(167,139,250,0.85)",
            fontSize: "0.66rem",
            fontFamily: "'HarmonyOS Sans', sans-serif",
            transition: "all 0.15s",
          }}
          _hover={{ background: "rgba(139,92,246,0.25) !important" }}
        >
          <ShoppingBag size={10} />
          Ghé Aesthetic Store
        </Box>
      )}
    </Flex>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

interface Props {
  onClose: () => void;
}

export function CreateThemePanel({ onClose }: Props) {
  const { x, y, ref } = useCenteredPanel(PANEL_W, PANEL_H);

  // ── State ──
  const [themeName, setThemeName]         = useState("");
  const [inventory, setInventory]         = useState<InventoryItem[]>([]);
  const [invLoading, setInvLoading]       = useState(true);

  const [selectedBgId, setSelectedBgId]       = useState<string | null>(null);
  const [selectedStickerId, setSelectedStickerId] = useState<string | null>(null);
  const [selectedSoundId, setSelectedSoundId]   = useState<string | null>(null);

  const [playingSound, setPlayingSound]   = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting]   = useState(false);
  const [uploadLabel, setUploadLabel]     = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [error, setError]                 = useState<string | null>(null);

  const audioRef     = useRef<HTMLAudioElement | null>(null);
  const audioBlobRef = useRef<string | null>(null);

  // ── Fetch inventory on mount ──
  useEffect(() => {
    aestheticStoreService.getInventory(1, 200)
      .then(data => setInventory(data))
      .catch(() => {})
      .finally(() => setInvLoading(false));
  }, []);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      audioRef.current?.pause();
      if (audioBlobRef.current) URL.revokeObjectURL(audioBlobRef.current);
    };
  }, []);

  // Auto-close after success
  useEffect(() => {
    if (!submitSuccess) return;
    const t = setTimeout(onClose, 1600);
    return () => clearTimeout(t);
  }, [submitSuccess, onClose]);

  // ── Derived ──
  const bgItems     = inventory.filter(i => i.category === "Background");
  const stickerItems = inventory.filter(i => i.category === "Sticker");
  const soundItems  = inventory.filter(i => i.category === "AmbientSound");

  const selectedBg      = inventory.find(i => i.storeItemId === selectedBgId);
  const selectedSticker = inventory.find(i => i.storeItemId === selectedStickerId);

  const selectedCount = [selectedBgId, selectedStickerId, selectedSoundId].filter(Boolean).length;
  const canSave = themeName.trim().length > 0 && selectedCount >= 2 && !isSubmitting && !submitSuccess;

  // Preview URL for the card: bg → sticker → null
  const previewUrl = selectedBg?.assetUrl ?? selectedSticker?.assetUrl ?? null;

  // ── Sound preview ──
  const togglePlay = useCallback((item: InventoryItem) => {
    if (playingSound === item.storeItemId) {
      audioRef.current?.pause();
      setPlayingSound(null);
      return;
    }
    audioRef.current?.pause();
    if (audioBlobRef.current) { URL.revokeObjectURL(audioBlobRef.current); audioBlobRef.current = null; }

    if (!item.assetUrl) return;
    const audio = new Audio(item.assetUrl);
    audioRef.current = audio;
    audio.play().catch(() => {});
    audio.onended = () => setPlayingSound(null);
    setPlayingSound(item.storeItemId);
  }, [playingSound]);

  // ── Submit ──
  const handleSave = async () => {
    if (!canSave) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const assetUrl = selectedBg?.assetUrl ?? selectedSticker?.assetUrl ?? "";

      setUploadLabel("Đang gửi theme để duyệt…");
      await userThemeService.submit({
        name: themeName.trim(),
        assetUrl,
        themeBackgroundItemId: selectedBgId ?? undefined,
        themeStickerItemId: selectedStickerId ?? undefined,
        themeAmbientSoundItemId: selectedSoundId ?? undefined,
      });

      setSubmitSuccess(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Không thể lưu theme. Vui lòng thử lại.";
      setError(msg);
    } finally {
      setIsSubmitting(false);
      setUploadLabel(null);
    }
  };

  // ── Render ──
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
      zIndex={55}
      style={{
        x, y,
        width: PANEL_W,
        height: PANEL_H,
        borderRadius: "16px",
        background: "rgba(12,18,22,0.78)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        border: "1px solid rgba(255,255,255,0.1)",
        boxShadow: "0 24px 80px rgba(0,0,0,0.75), 0 0 0 1px rgba(255,255,255,0.08)",
        cursor: "grab",
        overflow: "hidden",
      }}
    >
      <Box position="relative" style={{ height: "100%", overflowY: "auto", scrollbarWidth: "none" }}>
        <PanelCloseBtn onClose={onClose} />

        <Box px="20px" pt="18px" pb="24px">

          {/* ── Header ── */}
          <Flex align="center" gap={2} mb={5}>
            <Palette size={15} style={{ color: "rgba(255,255,255,0.5)" }} />
            <Text style={{
              fontSize: "0.7rem",
              color: "rgba(255,255,255,0.35)",
              letterSpacing: "0.1em",
              fontFamily: "'HarmonyOS Sans', sans-serif",
            }}>
              TẠO CHỦ ĐỀ CỦA BẠN
            </Text>
            <Box
              px="5px"
              py="1px"
              borderRadius="4px"
              style={{
                background: "rgba(78,124,106,0.2)",
                border: "1px solid rgba(78,124,106,0.38)",
              }}
            >
              <Text style={{
                fontSize: "0.52rem",
                fontFamily: "'HarmonyOS Sans', sans-serif",
                fontWeight: 700,
                color: "rgba(78,124,106,0.9)",
                letterSpacing: "0.07em",
              }}>
                BETA
              </Text>
            </Box>
          </Flex>

          {/* ── Theme Name ── */}
          <Box mb={4}>
            <SectionLabel>TÊN CHỦ ĐỀ</SectionLabel>
            <Input
              value={themeName}
              onChange={e => setThemeName(e.target.value.slice(0, 40))}
              placeholder="Ví dụ: My Lofi Night…"
              onPointerDown={(e: React.PointerEvent) => e.stopPropagation()}
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: "10px",
                color: "rgba(255,255,255,0.88)",
                fontFamily: "'HarmonyOS Sans', sans-serif",
                fontSize: "0.84rem",
                padding: "10px 14px",
                width: "100%",
                outline: "none",
              }}
              css={{
                "::placeholder": { color: "rgba(255,255,255,0.22)" },
                ":focus": { borderColor: "rgba(255,255,255,0.28) !important" },
              }}
            />
            <Flex justify="flex-end" mt="4px">
              <Text style={{ fontSize: "0.62rem", color: "rgba(255,255,255,0.2)", fontFamily: "'HarmonyOS Sans', sans-serif" }}>
                {themeName.length}/40
              </Text>
            </Flex>
          </Box>

          {/* ── Loading inventory ── */}
          {invLoading ? (
            <Flex h="120px" align="center" justify="center" gap="8px">
              <Loader2 size={14} color="rgba(255,255,255,0.25)" style={{ animation: "spin 1s linear infinite" }} />
              <Text style={{ fontSize: "0.74rem", fontFamily: "'HarmonyOS Sans', sans-serif", color: "rgba(255,255,255,0.28)" }}>
                Đang tải thư viện…
              </Text>
            </Flex>
          ) : (
            <>

              {/* ── Background section ── */}
              <Box mb={4}>
                <Flex align="center" justify="space-between" mb="8px">
                  <SectionLabel>HÌNH NỀN</SectionLabel>
                  {selectedBgId && (
                    <Text style={{ fontSize: "0.6rem", color: "rgba(74,222,128,0.7)", fontFamily: "'HarmonyOS Sans', sans-serif" }}>
                      ✓ Đã chọn
                    </Text>
                  )}
                </Flex>

                {bgItems.length === 0 ? (
                  <EmptyInventory label="hình nền" />
                ) : (
                  <Flex
                    gap="8px"
                    onPointerDown={(e: React.PointerEvent) => e.stopPropagation()}
                    style={{ overflowX: "auto", paddingBottom: 4, scrollbarWidth: "none" }}
                  >
                    {bgItems.map(item => {
                      const isSelected = selectedBgId === item.storeItemId;
                      return (
                        <Box
                          key={item.storeItemId}
                          as="button"
                          onClick={() => setSelectedBgId(isSelected ? null : item.storeItemId)}
                          onPointerDown={(e: React.PointerEvent) => e.stopPropagation()}
                          flexShrink={0}
                          borderRadius="8px"
                          overflow="hidden"
                          border="none"
                          cursor="pointer"
                          position="relative"
                          style={{
                            width: 100, height: 64,
                            backgroundImage: item.assetUrl ? `url(${item.assetUrl})` : undefined,
                            backgroundSize: "cover",
                            backgroundPosition: "center",
                            background: item.assetUrl ? undefined : "rgba(255,255,255,0.06)",
                            border: isSelected
                              ? "2px solid rgba(74,222,128,0.85)"
                              : "2px solid rgba(255,255,255,0.08)",
                            transition: "border-color 0.15s",
                          }}
                        >
                          {!item.assetUrl && (
                            <Flex w="100%" h="100%" align="center" justify="center">
                              <ImageIcon size={18} color="rgba(255,255,255,0.2)" />
                            </Flex>
                          )}
                          {isSelected && (
                            <Flex
                              position="absolute"
                              inset={0}
                              align="center"
                              justify="center"
                              style={{ background: "rgba(0,0,0,0.35)" }}
                            >
                              <Box
                                style={{
                                  width: 22, height: 22, borderRadius: "50%",
                                  background: "rgba(74,222,128,0.9)",
                                  display: "flex", alignItems: "center", justifyContent: "center",
                                }}
                              >
                                <Check size={11} color="#fff" />
                              </Box>
                            </Flex>
                          )}
                          <Box
                            position="absolute"
                            bottom={0}
                            left={0}
                            right={0}
                            px="5px"
                            py="3px"
                            style={{
                              background: "linear-gradient(transparent, rgba(0,0,0,0.7))",
                              overflow: "hidden",
                            }}
                          >
                            <Text style={{
                              fontSize: "0.55rem",
                              fontFamily: "'HarmonyOS Sans', sans-serif",
                              color: "rgba(255,255,255,0.75)",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}>
                              {item.name}
                            </Text>
                          </Box>
                        </Box>
                      );
                    })}
                  </Flex>
                )}
              </Box>

              {/* ── Sticker section ── */}
              <Box mb={4}>
                <Flex align="center" justify="space-between" mb="8px">
                  <SectionLabel>STICKER</SectionLabel>
                  {selectedStickerId && (
                    <Text style={{ fontSize: "0.6rem", color: "rgba(74,222,128,0.7)", fontFamily: "'HarmonyOS Sans', sans-serif" }}>
                      ✓ Đã chọn
                    </Text>
                  )}
                </Flex>

                {stickerItems.length === 0 ? (
                  <EmptyInventory label="sticker" />
                ) : (
                  <Flex
                    gap="8px"
                    onPointerDown={(e: React.PointerEvent) => e.stopPropagation()}
                    style={{ overflowX: "auto", paddingBottom: 4, scrollbarWidth: "none" }}
                  >
                    {stickerItems.map(item => {
                      const isSelected = selectedStickerId === item.storeItemId;
                      return (
                        <Box
                          key={item.storeItemId}
                          as="button"
                          onClick={() => setSelectedStickerId(isSelected ? null : item.storeItemId)}
                          onPointerDown={(e: React.PointerEvent) => e.stopPropagation()}
                          flexShrink={0}
                          borderRadius="8px"
                          border="none"
                          cursor="pointer"
                          position="relative"
                          style={{
                            width: 56, height: 56,
                            background: "rgba(255,255,255,0.04)",
                            border: isSelected
                              ? "2px solid rgba(74,222,128,0.85)"
                              : "2px solid rgba(255,255,255,0.08)",
                            transition: "border-color 0.15s",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            overflow: "hidden",
                          }}
                        >
                          {item.assetUrl ? (
                            <img
                              src={item.assetUrl}
                              alt={item.name}
                              style={{ width: "100%", height: "100%", objectFit: "contain" }}
                              draggable={false}
                            />
                          ) : (
                            <Sparkles size={16} color="rgba(255,255,255,0.2)" />
                          )}
                          {isSelected && (
                            <Flex
                              position="absolute"
                              inset={0}
                              align="flex-end"
                              justify="flex-end"
                              p="3px"
                            >
                              <Box
                                style={{
                                  width: 14, height: 14, borderRadius: "50%",
                                  background: "rgba(74,222,128,0.9)",
                                  display: "flex", alignItems: "center", justifyContent: "center",
                                }}
                              >
                                <Check size={8} color="#fff" />
                              </Box>
                            </Flex>
                          )}
                        </Box>
                      );
                    })}
                  </Flex>
                )}
              </Box>

              {/* ── Ambient Sound section ── */}
              <Box mb={4}>
                <Flex align="center" justify="space-between" mb="8px">
                  <SectionLabel>ÂM THANH MÔI TRƯỜNG</SectionLabel>
                  {selectedSoundId && (
                    <Text style={{ fontSize: "0.6rem", color: "rgba(74,222,128,0.7)", fontFamily: "'HarmonyOS Sans', sans-serif" }}>
                      ✓ Đã chọn
                    </Text>
                  )}
                </Flex>

                {soundItems.length === 0 ? (
                  <EmptyInventory label="âm thanh" />
                ) : (
                  <Box
                    borderRadius="10px"
                    onPointerDown={(e: React.PointerEvent) => e.stopPropagation()}
                    style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
                  >
                    {soundItems.map((item, i) => {
                      const isSelected = selectedSoundId === item.storeItemId;
                      const isPlaying  = playingSound === item.storeItemId;
                      return (
                        <Flex
                          key={item.storeItemId}
                          align="center"
                          gap={3}
                          px="12px"
                          py="9px"
                          style={{
                            borderBottom: i < soundItems.length - 1
                              ? "1px solid rgba(255,255,255,0.05)"
                              : "none",
                          }}
                        >
                          {/* Play button */}
                          <Box
                            as="button"
                            onClick={() => togglePlay(item)}
                            border="none"
                            cursor="pointer"
                            borderRadius="50%"
                            display="flex" alignItems="center" justifyContent="center"
                            flexShrink={0}
                            style={{
                              width: 26, height: 26,
                              background: isPlaying
                                ? "rgba(99,102,241,0.25)"
                                : "rgba(255,255,255,0.07)",
                              border: isPlaying
                                ? "1px solid rgba(99,102,241,0.4)"
                                : "1px solid rgba(255,255,255,0.1)",
                              color: isPlaying ? "rgba(129,140,248,0.95)" : "rgba(255,255,255,0.45)",
                              transition: "all 0.15s",
                            }}
                          >
                            {isPlaying ? <Pause size={10} /> : <Play size={10} />}
                          </Box>

                          {/* Name */}
                          <Text flex={1} style={{
                            fontSize: "0.76rem",
                            color: "rgba(255,255,255,0.75)",
                            fontFamily: "'HarmonyOS Sans', sans-serif",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}>
                            {item.name}
                          </Text>

                          {/* Select button */}
                          <Box
                            as="button"
                            onClick={() => setSelectedSoundId(isSelected ? null : item.storeItemId)}
                            border="none"
                            cursor="pointer"
                            borderRadius="6px"
                            px="8px"
                            py="3px"
                            flexShrink={0}
                            style={{
                              background: isSelected
                                ? "rgba(74,222,128,0.18)"
                                : "rgba(255,255,255,0.07)",
                              border: isSelected
                                ? "1px solid rgba(74,222,128,0.4)"
                                : "1px solid rgba(255,255,255,0.1)",
                              color: isSelected ? "rgba(74,222,128,0.9)" : "rgba(255,255,255,0.45)",
                              fontSize: "0.62rem",
                              fontFamily: "'HarmonyOS Sans', sans-serif",
                              display: "flex", alignItems: "center", gap: 4,
                              transition: "all 0.15s",
                            }}
                          >
                            {isSelected && <Check size={9} />}
                            {isSelected ? "Đã chọn" : "Chọn"}
                          </Box>
                        </Flex>
                      );
                    })}
                  </Box>
                )}
              </Box>

            </>
          )}

          {/* ── Preview Card ── */}
          <Box mb={4}>
            <SectionLabel>XEM TRƯỚC</SectionLabel>
            <Box
              borderRadius="10px"
              overflow="hidden"
              position="relative"
              style={{ height: 96, border: "1px solid rgba(255,255,255,0.1)" }}
            >
              {previewUrl ? (
                <Box
                  position="absolute" inset={0}
                  style={{
                    backgroundImage: `url(${previewUrl})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                />
              ) : (
                <Box
                  position="absolute" inset={0}
                  style={{ background: "linear-gradient(135deg, rgba(20,25,32,1) 0%, rgba(14,20,28,1) 100%)" }}
                />
              )}
              <Box position="absolute" inset={0} style={{ background: "rgba(0,0,0,0.4)" }} />

              {/* Sticker preview */}
              {selectedSticker?.assetUrl && (
                <Box
                  position="absolute"
                  style={{
                    width: 32, height: 32,
                    bottom: 8, right: 10,
                    backgroundImage: `url(${selectedSticker.assetUrl})`,
                    backgroundSize: "contain",
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "center",
                    filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.5))",
                  }}
                />
              )}

              <Flex position="absolute" inset={0} align="center" justify="center" direction="column" gap="6px">
                <Text style={{
                  fontSize: "0.9rem",
                  fontWeight: 600,
                  color: themeName ? "rgba(255,255,255,0.92)" : "rgba(255,255,255,0.2)",
                  fontFamily: "'HarmonyOS Sans', sans-serif",
                  letterSpacing: "0.04em",
                  textShadow: "0 1px 8px rgba(0,0,0,0.7)",
                }}>
                  {themeName || "Tên chủ đề của bạn"}
                </Text>
                <Flex gap="10px">
                  {selectedBg && (
                    <Flex align="center" gap="4px" style={{ opacity: 0.55 }}>
                      <ImageIcon size={9} color="white" />
                      <Text style={{ fontSize: "0.58rem", color: "white", fontFamily: "'HarmonyOS Sans', sans-serif" }}>
                        {selectedBg.name}
                      </Text>
                    </Flex>
                  )}
                  {selectedSoundId && (
                    <Flex align="center" gap="4px" style={{ opacity: 0.55 }}>
                      <Music size={9} color="white" />
                      <Text style={{ fontSize: "0.58rem", color: "white", fontFamily: "'HarmonyOS Sans', sans-serif" }}>
                        {soundItems.find(s => s.storeItemId === selectedSoundId)?.name ?? ""}
                      </Text>
                    </Flex>
                  )}
                </Flex>
              </Flex>
            </Box>
          </Box>

          {/* ── Validation hint ── */}
          {!invLoading && selectedCount < 2 && (
            <Text mb={3} style={{
              fontSize: "0.65rem",
              color: "rgba(255,255,255,0.28)",
              fontFamily: "'HarmonyOS Sans', sans-serif",
              textAlign: "center",
            }}>
              Chọn ít nhất 2 thành phần (hình nền, sticker hoặc âm thanh) để gửi duyệt
            </Text>
          )}

          {/* ── Error ── */}
          <AnimatePresence>
            {error && (
              <MotionBox
                key="error"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                mb={3} px="12px" py="8px" borderRadius="8px"
                style={{
                  background: "rgba(248,113,113,0.12)",
                  border: "1px solid rgba(248,113,113,0.28)",
                  color: "#f87171",
                  fontSize: "0.72rem",
                  fontFamily: "'HarmonyOS Sans', sans-serif",
                }}
              >
                {error}
              </MotionBox>
            )}
          </AnimatePresence>

          {/* ── Submit Button ── */}
          <Box
            as="button"
            onClick={handleSave}
            onPointerDown={(e: React.PointerEvent) => e.stopPropagation()}
            w="100%"
            border="none"
            cursor={canSave ? "pointer" : "not-allowed"}
            borderRadius="10px"
            py="11px"
            style={{
              background: submitSuccess
                ? "rgba(74,222,128,0.18)"
                : canSave
                ? "rgba(255,255,255,0.1)"
                : "rgba(255,255,255,0.04)",
              border: submitSuccess
                ? "1px solid rgba(74,222,128,0.35)"
                : canSave
                ? "1px solid rgba(255,255,255,0.22)"
                : "1px solid rgba(255,255,255,0.07)",
              color: submitSuccess
                ? "#4ade80"
                : canSave
                ? "rgba(255,255,255,0.88)"
                : "rgba(255,255,255,0.2)",
              fontFamily: "'HarmonyOS Sans', sans-serif",
              fontSize: "0.82rem",
              fontWeight: 600,
              letterSpacing: "0.05em",
              transition: "background 0.2s, border 0.2s, color 0.2s",
              opacity: isSubmitting ? 0.7 : 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            {isSubmitting ? (
              <>
                <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />
                {uploadLabel ?? "Đang gửi…"}
              </>
            ) : submitSuccess ? (
              <>
                <CheckCircle size={14} />
                Đã gửi duyệt!
              </>
            ) : (
              <>
                <Upload size={14} />
                {!themeName.trim()
                  ? "Nhập tên để tiếp tục"
                  : selectedCount < 2
                  ? `Chọn thêm ${2 - selectedCount} thành phần nữa`
                  : "Lưu & Gửi duyệt"}
              </>
            )}
          </Box>

          {!submitSuccess && !isSubmitting && (
            <Text mt="8px" style={{
              fontSize: "0.62rem",
              color: "rgba(255,255,255,0.18)",
              fontFamily: "'HarmonyOS Sans', sans-serif",
              textAlign: "center",
              lineHeight: 1.5,
            }}>
              Theme sẽ được gửi để admin duyệt trước khi xuất hiện trong store
            </Text>
          )}

        </Box>
      </Box>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </MotionBox>
  );
}
