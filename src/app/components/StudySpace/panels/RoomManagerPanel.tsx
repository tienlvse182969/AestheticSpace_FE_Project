import { useState, useEffect, useRef } from "react";
import { Box, Flex, Text } from "@chakra-ui/react";
import { motion } from "motion/react";
import { useTranslation } from "react-i18next";
import { LayoutDashboard, Check, Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { PanelCloseBtn } from "../ui/PanelCloseBtn";
import { useCenteredPanel } from "../hooks/useCenteredPanel";
import { roomService } from "../../../../services/room.service";
import type { Room } from "../../../../types/room.types";
import type { BackgroundItem } from "../types";

const MotionBox = motion.create(Box);

function RoomThumb({ url, name }: { url: string | null; name: string }) {
  const [failed, setFailed] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  const COLORS: Record<string, string> = {
    a: "#2d3a2e", b: "#1e2d3d", c: "#2d1e2f", d: "#3d2e1e",
  };
  const seed = name.charCodeAt(0) % 4;
  const fallbackBg = COLORS[Object.keys(COLORS)[seed]];

  if (failed || !url) {
    return (
      <Box
        position="absolute"
        inset={0}
        style={{
          background: `linear-gradient(135deg, ${fallbackBg} 0%, rgba(0,0,0,0.6) 100%)`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.3)", fontFamily: "'HarmonyOS Sans', sans-serif" }}>
          {name}
        </Text>
      </Box>
    );
  }

  return (
    <img
      ref={imgRef}
      src={url}
      alt={name}
      onError={() => setFailed(true)}
      style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
    />
  );
}

interface RoomManagerPanelProps {
  currentRoomId: string | null;
  onSelect: (roomId: string, bg: BackgroundItem) => void;
  onClose: () => void;
}

export function RoomManagerPanel({ currentRoomId, onSelect, onClose }: RoomManagerPanelProps) {
  const { t } = useTranslation();
  const { x, y, ref } = useCenteredPanel(400, 460);

  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRooms = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await roomService.getAll();
      setRooms(data);
    } catch {
      setError(t("backgrounds.errorRooms"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRooms(); }, []);

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
        width: 400,
        height: 460,
        borderRadius: "16px",
        background: "rgba(12,18,22,0.75)",
        backdropFilter: "blur(18px)",
        WebkitBackdropFilter: "blur(18px)",
        border: "1px solid rgba(255,255,255,0.1)",
        boxShadow: "0 24px 80px rgba(0,0,0,0.75), 0 0 0 1px rgba(255,255,255,0.08)",
        cursor: "grab",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      <Box position="relative" style={{ padding: "18px 18px 20px", display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
        <PanelCloseBtn onClose={onClose} />

        {/* Header */}
        <Flex align="center" gap={2} mb={4}>
          <LayoutDashboard size={15} style={{ color: "rgba(255,255,255,0.5)" }} />
          <Text style={{
            fontSize: "0.7rem", color: "rgba(255,255,255,0.35)",
            letterSpacing: "0.1em", fontFamily: "'HarmonyOS Sans', sans-serif",
          }}>
            {t("space.rooms")}
          </Text>
        </Flex>

        {/* Loading */}
        {loading && (
          <Flex justify="center" align="center" py={8} gap={2}>
            <Loader2 size={16} style={{ color: "rgba(255,255,255,0.3)", animation: "spin 1s linear infinite" }} />
            <Text style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.3)", fontFamily: "'HarmonyOS Sans', sans-serif" }}>
              Loading…
            </Text>
          </Flex>
        )}

        {/* Error */}
        {!loading && error && (
          <Flex direction="column" align="center" py={8} gap={3}>
            <AlertCircle size={20} style={{ color: "rgba(248,113,113,0.6)" }} />
            <Text style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.3)", fontFamily: "'HarmonyOS Sans', sans-serif" }}>
              {error}
            </Text>
            <Box
              as="button"
              onClick={fetchRooms}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "6px 14px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)",
                background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.5)",
                fontSize: "0.72rem", fontFamily: "'HarmonyOS Sans', sans-serif",
                cursor: "pointer",
              }}
            >
              <RefreshCw size={12} />
              Retry
            </Box>
          </Flex>
        )}

        {/* Empty */}
        {!loading && !error && rooms.length === 0 && (
          <Flex justify="center" py={8}>
            <Text style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.25)", fontFamily: "'HarmonyOS Sans', sans-serif" }}>
              {t("backgrounds.noRooms")}
            </Text>
          </Flex>
        )}

        {/* Room grid */}
        {!loading && !error && rooms.length > 0 && (
          <Box
            display="grid"
            style={{
              gridTemplateColumns: "1fr 1fr",
              gap: 10,
              flex: 1,
              overflowY: "auto",
              paddingRight: 2,
            }}
          >
            {rooms.map(room => {
              const isActive = room.id === currentRoomId;
              const bg: BackgroundItem = {
                id: room.id,
                url: room.thumbnailUrl ?? "",
                thumb: room.thumbnailUrl ?? "",
                label: room.name,
              };
              return (
                <Box
                  key={room.id}
                  as="button"
                  onClick={() => onSelect(room.id, bg)}
                  position="relative"
                  borderRadius="10px"
                  overflow="hidden"
                  style={{
                    aspectRatio: "16/9",
                    cursor: "pointer",
                    border: `2px solid ${isActive ? "rgba(255,255,255,0.55)" : "rgba(255,255,255,0.06)"}`,
                    transition: "border-color 0.2s, transform 0.15s",
                    background: "rgba(255,255,255,0.04)",
                    padding: 0,
                  }}
                  _hover={{ transform: "scale(1.02)" } as any}
                >
                  <RoomThumb url={room.thumbnailUrl} name={room.name} />

                  {/* Gradient overlay */}
                  <Box
                    position="absolute"
                    inset={0}
                    style={{ background: "linear-gradient(to top, rgba(0,0,0,0.65) 0%, transparent 55%)", pointerEvents: "none" }}
                  />

                  {/* Active checkmark */}
                  {isActive && (
                    <Flex
                      position="absolute"
                      top="6px"
                      right="6px"
                      align="center"
                      justify="center"
                      borderRadius="full"
                      style={{ width: 18, height: 18, background: "white", flexShrink: 0 }}
                    >
                      <Check size={11} style={{ color: "#1a3c34" }} />
                    </Flex>
                  )}

                  {/* Room name */}
                  <Text
                    position="absolute"
                    bottom="7px"
                    left="8px"
                    style={{
                      fontSize: "0.7rem",
                      color: "rgba(255,255,255,0.9)",
                      fontFamily: "'HarmonyOS Sans', sans-serif",
                      letterSpacing: "0.02em",
                      pointerEvents: "none",
                    }}
                  >
                    {room.name}
                  </Text>
                </Box>
              );
            })}
          </Box>
        )}

        {/* Footer: current room info */}
        <Box
          mt={3}
          flexShrink={0}
          borderRadius="10px"
          px={3}
          py="10px"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
        >
          {currentRoomId ? (
            <Flex align="center" gap={2}>
              <Box
                borderRadius="full"
                style={{ width: 6, height: 6, background: "#4ade80", boxShadow: "0 0 6px #4ade80", flexShrink: 0 }}
              />
              <Text style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.55)", fontFamily: "'HarmonyOS Sans', sans-serif" }}>
                {rooms.find(r => r.id === currentRoomId)?.name ?? currentRoomId}
              </Text>
            </Flex>
          ) : (
            <Text style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.22)", fontFamily: "'HarmonyOS Sans', sans-serif" }}>
              {t("backgrounds.noRooms")}
            </Text>
          )}
        </Box>
      </Box>
    </MotionBox>
  );
}
