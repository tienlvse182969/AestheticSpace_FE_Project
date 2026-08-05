import { useLayoutEffect, useRef, useState } from "react";
import { Box, Flex, Text } from "@chakra-ui/react";
import { motion, AnimatePresence } from "motion/react";
import { X, Upload, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { uploadToCloudinary } from "../../../../../services/cloudinary.service";
import type { PhotoFrameTransition } from "../../../../hooks/studyspace/usePhotoFrameSettings";

interface PhotoFrameSettingsPanelProps {
  show: boolean;
  containerRef?: React.RefObject<HTMLDivElement | null>;
  images: string[];
  intervalSec: number;
  transition: PhotoFrameTransition;
  shuffle: boolean;
  maxPhotos: number;
  onAddImage: (url: string) => void;
  onRemoveImage: (url: string) => void;
  onIntervalSec: (v: number) => void;
  onTransition: (v: PhotoFrameTransition) => void;
  onShuffle: (v: boolean) => void;
  onClose: () => void;
}

const TRANSITION_KEYS: Record<PhotoFrameTransition, string> = {
  fade: "photoFrame.transitionFade",
  slide: "photoFrame.transitionSlide",
  none: "photoFrame.transitionNone",
};

const PANEL_W = 230 + 10;
const PANEL_H = 340;
const MARGIN  = 12;

export function PhotoFrameSettingsPanel({
  show, containerRef, images, intervalSec, transition, shuffle, maxPhotos,
  onAddImage, onRemoveImage, onIntervalSec, onTransition, onShuffle, onClose,
}: PhotoFrameSettingsPanelProps) {
  const { t } = useTranslation();
  const [hSide, setHSide] = useState<"right" | "left">("right");
  const [vSide, setVSide] = useState<"top" | "bottom">("top");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useLayoutEffect(() => {
    if (!show || !containerRef?.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setHSide(rect.right + PANEL_W > window.innerWidth  - MARGIN ? "left" : "right");
    setVSide(rect.top   + PANEL_H > window.innerHeight - MARGIN ? "bottom" : "top");
  }, [show, containerRef]);

  const posStyle: React.CSSProperties =
    hSide === "right" ? { left: "calc(100% + 10px)", right: "auto" } : { right: "calc(100% + 10px)", left: "auto" };
  const vStyle: React.CSSProperties =
    vSide === "top" ? { top: "0px", bottom: "auto" } : { bottom: "0px", top: "auto" };
  const xInit  = hSide === "right" ? -10 : 10;
  const origin = hSide === "right" ? "left center" : "right center";

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    if (images.length >= maxPhotos) { setError(t("photoFrame.maxPhotosError", { count: maxPhotos })); return; }
    setError(null);
    setUploading(true);
    try {
      const result = await uploadToCloudinary(file, "studyspace/photo-frame");
      onAddImage(result.secure_url);
    } catch {
      setError(t("photoFrame.uploadFailed"));
    } finally {
      setUploading(false);
    }
  };

  return (
    <AnimatePresence>
      {show && (
        <div style={{ position: "absolute", ...posStyle, ...vStyle, zIndex: 20 }}>
          <motion.div
            key="photoframe-settings-panel"
            initial={{ opacity: 0, scale: 0.92, x: xInit }}
            animate={{ opacity: 1, scale: 1,    x: 0    }}
            exit={{    opacity: 0, scale: 0.92, x: xInit }}
            transition={{ type: "spring", stiffness: 500, damping: 24, mass: 0.9 }}
            onPointerDown={e => e.stopPropagation()}
            style={{
              width: 230,
              background: "rgba(12,18,22,0.86)",
              backdropFilter: "blur(18px)",
              WebkitBackdropFilter: "blur(18px)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 14,
              padding: "12px 14px 14px",
              boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
              transformOrigin: origin,
            }}
          >
            <Flex align="center" justify="space-between" mb="10px">
              <Text style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.55)", fontFamily: "'HarmonyOS Sans', sans-serif", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                {t("photoFrame.settingsTitle")}
              </Text>
              <Box as="button" onClick={onClose} display="flex" alignItems="center" justifyContent="center"
                w="20px" h="20px" borderRadius="full" border="none" cursor="pointer"
                style={{ background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.4)" }}>
                <X size={11} />
              </Box>
            </Flex>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={e => { void handleFile(e.target.files?.[0]); e.target.value = ""; }}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              style={{
                width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                padding: "7px 0", borderRadius: 8, marginBottom: 10,
                background: "rgba(251,146,60,0.14)", border: "1px solid rgba(251,146,60,0.35)",
                color: "#fb923c", fontSize: "0.74rem", fontFamily: "'HarmonyOS Sans', sans-serif",
                cursor: uploading ? "default" : "pointer", opacity: uploading ? 0.6 : 1,
              }}
            >
              <Upload size={12} /> {uploading ? t("photoFrame.uploading") : t("photoFrame.uploadPhoto")}
            </button>
            {error && <Text style={{ fontSize: "0.66rem", color: "#f87171", marginBottom: 8 }}>{error}</Text>}

            {images.length > 0 && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, marginBottom: 10 }}>
                {images.map(url => (
                  <div key={url} style={{ position: "relative", borderRadius: 6, overflow: "hidden", aspectRatio: "1", background: "rgba(255,255,255,0.05)" }}>
                    <img src={url} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    <button
                      onClick={() => onRemoveImage(url)}
                      style={{
                        position: "absolute", top: 2, right: 2, width: 16, height: 16, borderRadius: "50%",
                        background: "rgba(0,0,0,0.6)", border: "none", color: "white",
                        display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
                      }}
                    >
                      <Trash2 size={9} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <Flex align="center" justify="space-between" mb="8px">
              <Text style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.42)", fontFamily: "'HarmonyOS Sans', sans-serif" }}>{t("photoFrame.interval")}</Text>
              <Flex align="center" gap="6px">
                <input
                  type="range" min={3} max={60} value={intervalSec}
                  onChange={e => onIntervalSec(Number(e.target.value))}
                  onPointerDown={e => e.stopPropagation()}
                  style={{ width: 90 }}
                />
                <Text style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.5)", width: 28 }}>{intervalSec}s</Text>
              </Flex>
            </Flex>

            <Flex align="center" justify="space-between" mb="8px">
              <Text style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.42)", fontFamily: "'HarmonyOS Sans', sans-serif" }}>{t("photoFrame.transition")}</Text>
              <Flex style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 8, padding: 2, gap: 2 }}>
                {(["fade", "slide", "none"] as PhotoFrameTransition[]).map(opt => (
                  <Box key={opt} as="button" onClick={() => onTransition(opt)}
                    style={{
                      padding: "3px 8px", borderRadius: 6, fontSize: "0.64rem",
                      fontFamily: "'HarmonyOS Sans', sans-serif", cursor: "pointer", border: "none",
                      background: transition === opt ? "rgba(255,255,255,0.13)" : "transparent",
                      color: transition === opt ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.32)",
                    }}
                  >
                    {t(TRANSITION_KEYS[opt])}
                  </Box>
                ))}
              </Flex>
            </Flex>

            <Flex align="center" justify="space-between">
              <Text style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.42)", fontFamily: "'HarmonyOS Sans', sans-serif" }}>{t("photoFrame.shuffle")}</Text>
              <Box as="button" onClick={() => onShuffle(!shuffle)}
                style={{
                  width: 34, height: 18, borderRadius: 9, border: "none", cursor: "pointer",
                  background: shuffle ? "rgba(251,146,60,0.5)" : "rgba(255,255,255,0.1)", padding: 2,
                  display: "flex", alignItems: "center",
                }}
              >
                <Box style={{
                  width: 14, height: 14, borderRadius: "50%",
                  background: shuffle ? "#fb923c" : "rgba(255,255,255,0.38)",
                  transform: shuffle ? "translateX(16px)" : "translateX(0)",
                  transition: "transform 0.22s",
                }} />
              </Box>
            </Flex>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
