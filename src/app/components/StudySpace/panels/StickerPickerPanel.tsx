import { useState, useEffect, useCallback } from "react";
import { Box, Flex, Text, Spinner } from "@chakra-ui/react";
import { motion } from "motion/react";
import { useTranslation } from "react-i18next";
import { PanelCloseBtn } from "../ui/PanelCloseBtn";
import { useCenteredPanel } from "../hooks/useCenteredPanel";
import {
  adminAssetsService,
  type AssetDto,
} from "../../../../services/admin/assets.admin.service";

const MotionBox = motion.create(Box);

interface StickerPickerPanelProps {
  onPlace: (src: string) => void;
  onClose: () => void;
}

export function StickerPickerPanel({ onPlace, onClose }: StickerPickerPanelProps) {
  const { t } = useTranslation();
  const { x, y, ref } = useCenteredPanel(320, 440);

  const [stickers, setStickers] = useState<AssetDto[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState<string | null>(null);

  const fetchStickers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await adminAssetsService.getAssets("Sticker");
      setStickers(result);
    } catch {
      setError("Failed to load stickers");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchStickers(); }, [fetchStickers]);

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
      zIndex={50}
      style={{
        x, y,
        width: 320,
        height: 440,
        borderRadius: "14px",
        background: "rgba(12,18,22,0.75)",
        backdropFilter: "blur(18px)",
        WebkitBackdropFilter: "blur(18px)",
        border: "1px solid rgba(255,255,255,0.1)",
        boxShadow: "0 24px 80px rgba(0,0,0,0.75), 0 0 0 1px rgba(255,255,255,0.08)",
        overflow: "hidden",
      }}
    >
      <Box position="relative" style={{ padding: "20px 18px 18px", height: "100%", display: "flex", flexDirection: "column" }}>
        <PanelCloseBtn onClose={onClose} />

        <Text mb={1} style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.35)", letterSpacing: "0.1em", fontFamily: "'HarmonyOS Sans', sans-serif" }}>
          {t("stickerPicker.title")}
        </Text>
        <Text mb={4} style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.5)", fontFamily: "'HarmonyOS Sans', sans-serif" }}>
          {t("stickerPicker.hint")}
        </Text>

        {/* Sticker grid */}
        <Box style={{ flex: 1, overflowY: "auto", overflowX: "hidden", marginRight: -4, paddingRight: 4 }}>
          {loading ? (
            <Flex align="center" justify="center" style={{ height: "100%" }} gap={3}>
              <Spinner size="sm" style={{ color: "rgba(255,255,255,0.4)" }} />
              <Text style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.3)", fontFamily: "'HarmonyOS Sans', sans-serif" }}>
                Loading…
              </Text>
            </Flex>
          ) : error ? (
            <Flex direction="column" align="center" justify="center" style={{ height: "100%" }} gap={3}>
              <Text style={{ fontSize: "0.78rem", color: "rgba(248,113,113,0.75)", fontFamily: "'HarmonyOS Sans', sans-serif" }}>
                {error}
              </Text>
              <Box
                as="button"
                onClick={fetchStickers}
                style={{
                  background: "transparent",
                  border: "1px solid rgba(255,255,255,0.15)",
                  borderRadius: 8, padding: "5px 14px",
                  cursor: "pointer", fontSize: "0.75rem",
                  color: "rgba(255,255,255,0.5)",
                  fontFamily: "'HarmonyOS Sans', sans-serif",
                }}
              >
                Retry
              </Box>
            </Flex>
          ) : stickers.length === 0 ? (
            <Flex align="center" justify="center" style={{ height: "100%" }}>
              <Text style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.28)", fontFamily: "'HarmonyOS Sans', sans-serif" }}>
                No stickers found
              </Text>
            </Flex>
          ) : (
            <Box display="grid" style={{ gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              {stickers.map((s) => (
                <Box
                  key={s.id}
                  as="button"
                  onClick={() => s.url && onPlace(s.url)}
                  display="flex"
                  flexDirection="column"
                  alignItems="center"
                  gap={2}
                  p={3}
                  borderRadius="12px"
                  border="none"
                  cursor="pointer"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    transition: "all 0.18s",
                  }}
                  _hover={{
                    background: "rgba(255,255,255,0.09)",
                    border: "1px solid rgba(255,255,255,0.2)",
                    transform: "scale(1.04)",
                  }}
                >
                  <img
                    src={s.url ?? ""}
                    alt={s.name ?? ""}
                    style={{ width: 100, height: 100, objectFit: "contain", filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.3))" }}
                    draggable={false}
                  />
                  <Text style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.5)", fontFamily: "'HarmonyOS Sans', sans-serif" }}>
                    {s.name ?? ""}
                  </Text>
                </Box>
              ))}
            </Box>
          )}
        </Box>
      </Box>
    </MotionBox>
  );
}
