import { useState, useEffect, useRef } from "react";
import { Box, Flex, Text, Input } from "@chakra-ui/react";
import { motion, AnimatePresence } from "motion/react";
import { useTranslation } from "react-i18next";
import {
  LayoutDashboard, Check, Loader2, AlertCircle, RefreshCw,
  Plus, Pencil, Trash2, X, Crown, Check as CheckIcon,
} from "lucide-react";
import { PanelCloseBtn } from "../ui/PanelCloseBtn";
import { useCenteredPanel } from "../hooks/useCenteredPanel";
import { roomService, type UserRoomRequest } from "../../../../services/room.service";
import type { Room, UserRoom } from "../../../../types/room.types";

type AnyRoom = Room | UserRoom;
import type { BackgroundItem } from "../types";
import { useAuth } from "../../../../context/AuthContext";
import { useNavigate } from "react-router";

const MotionBox = motion.create(Box);

const FREE_ROOM_LIMIT = 3;

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
      <Box position="absolute" inset={0}
        style={{
          background: `linear-gradient(135deg, ${fallbackBg} 0%, rgba(0,0,0,0.6) 100%)`,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}
      >
        <Text style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.3)", fontFamily: "'HarmonyOS Sans', sans-serif" }}>
          {name}
        </Text>
      </Box>
    );
  }

  return (
    <img ref={imgRef} src={url} alt={name} onError={() => setFailed(true)}
      style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
  );
}

const DEFAULT_FORM: UserRoomRequest = { name: "", description: "", thumbnailUrl: "", backgroundUrl: "" };

interface RoomManagerPanelProps {
  currentRoomId: string | null;
  currentBg?: BackgroundItem;
  onSelect: (roomId: string, bg: BackgroundItem) => void;
  onClose: () => void;
}

export function RoomManagerPanel({ currentRoomId, currentBg, onSelect, onClose }: RoomManagerPanelProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isPremium = user?.accountTier?.toLowerCase() === "premium";

  const [panelH, setPanelH] = useState(460);
  const { x, y, ref } = useCenteredPanel(480, panelH);

  const [rooms,       setRooms]       = useState<AnyRoom[]>([]);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState<string | null>(null);

  // Form state
  const [showForm,    setShowForm]    = useState(false);
  const [editTarget,  setEditTarget]  = useState<AnyRoom | null>(null);
  const [form,        setForm]        = useState<UserRoomRequest>(DEFAULT_FORM);
  const [formLoading, setFormLoading] = useState(false);
  const [formError,   setFormError]   = useState<string | null>(null);

  // Delete confirm
  const [deleteId,    setDeleteId]    = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Hover state for card overlay
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  // Premium upgrade prompt
  const [showUpgrade, setShowUpgrade] = useState(false);

  const isGuest = !user;
  const atFreeLimit = !isPremium && rooms.length >= FREE_ROOM_LIMIT;

  useEffect(() => {
    setPanelH(showForm ? 520 : 460);
  }, [showForm]);

  const fetchRooms = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = isGuest ? await roomService.getAll() : await roomService.getMyRooms();
      setRooms(data);
    } catch {
      setError(t("backgrounds.errorRooms"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRooms(); }, []);

  const openCreate = () => {
    if (atFreeLimit) { setShowUpgrade(true); return; }
    setEditTarget(null);
    setForm(DEFAULT_FORM);
    setFormError(null);
    setShowForm(true);
    setShowUpgrade(false);
  };

  const openEdit = (room: AnyRoom) => {
    setEditTarget(room);
    setForm({ name: room.name, description: null, thumbnailUrl: null, backgroundUrl: null });
    setFormError(null);
    setShowForm(true);
  };

  const closeForm = () => { setShowForm(false); setEditTarget(null); };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setFormLoading(true);
    setFormError(null);
    try {
      const body: UserRoomRequest = {
        name:          form.name.trim(),
        description:   null,
        thumbnailUrl:  null,
        backgroundUrl: null,
      };
      if (editTarget) {
        const updated = await roomService.updateMyRoom(editTarget.id, body);
        setRooms(prev => prev.map(r => r.id === editTarget.id ? updated : r));
      } else {
        const created = await roomService.createMyRoom(body);
        setRooms(prev => [...prev, created]);
        onSelect(created.id, {
          id: created.id,
          url: created.thumbnailUrl ?? "",
          thumb: created.thumbnailUrl ?? "",
          label: created.name,
        });
      }
      closeForm();
    } catch {
      setFormError(t("room.saveError"));
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleteLoading(true);
    try {
      await roomService.deleteMyRoom(deleteId);
      setRooms(prev => prev.filter(r => r.id !== deleteId));
    } catch {
      // silent
    } finally {
      setDeleteLoading(false);
      setDeleteId(null);
    }
  };

  const inputStyle = {
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "8px",
    color: "rgba(255,255,255,0.9)",
    fontSize: "0.82rem",
    height: "34px",
    paddingLeft: "10px",
    outline: "none",
    width: "100%",
    fontFamily: "'HarmonyOS Sans', sans-serif",
  };

  return (
    <MotionBox
      ref={ref as any}
      className="no-capture"
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
        width: 480,
        height: panelH,
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
        transition: "height 0.25s ease",
      }}
    >
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      <Box position="relative" style={{ padding: "18px 18px 14px", display: "flex", flexDirection: "column", flex: 1, minHeight: 0, overflow: "hidden" }}>
        <PanelCloseBtn onClose={onClose} />

        {/* Header */}
        <Flex align="center" justify="space-between" mb={3} pr="36px">
          <Flex align="center" gap={2}>
            <LayoutDashboard size={15} style={{ color: "rgba(255,255,255,0.5)" }} />
            <Text style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.35)", letterSpacing: "0.1em", fontFamily: "'HarmonyOS Sans', sans-serif" }}>
              {t("space.rooms").toUpperCase()}
            </Text>
          </Flex>

          {/* Add room button — hidden for guests */}
          {!isGuest && (
            <Box
              as="button"
              onClick={openCreate}
              display="flex" alignItems="center" gap="5px"
              px="10px" py="5px" borderRadius="8px" border="none" cursor="pointer"
              style={{
                background: atFreeLimit ? "rgba(251,191,36,0.1)" : "rgba(78,124,106,0.18)",
                border: atFreeLimit ? "1px solid rgba(251,191,36,0.3)" : "1px solid rgba(78,124,106,0.35)",
                color: atFreeLimit ? "#fbbf24" : "#7ecfb0",
                fontSize: "0.68rem",
                fontFamily: "'HarmonyOS Sans', sans-serif",
                transition: "all 0.15s",
              }}
            >
              {atFreeLimit ? <Crown size={11} /> : <Plus size={11} />}
              {atFreeLimit ? "Premium" : t("space.rooms")}
            </Box>
          )}
        </Flex>

        {/* Premium upgrade prompt */}
        <AnimatePresence>
          {showUpgrade && (
            <MotionBox
              initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 } as any}
              mb={3} px={3} py="10px" borderRadius="10px"
              style={{ background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.25)" }}
            >
              <Flex align="center" justify="space-between">
                <Flex align="center" gap={2}>
                  <Crown size={13} style={{ color: "#fbbf24", flexShrink: 0 }} />
                  <Text style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.7)", fontFamily: "'HarmonyOS Sans', sans-serif" }}>
                    {t("premiumGate.desc")}
                  </Text>
                </Flex>
                <Box as="button" onClick={() => setShowUpgrade(false)}
                  style={{ background: "transparent", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.4)", display: "flex", marginLeft: 8, flexShrink: 0 }}>
                  <X size={13} />
                </Box>
              </Flex>
              <Flex mt="8px" gap={2}>
                <Box as="button"
                  onClick={() => { onClose(); navigate("/pricing"); }}
                  px={3} py="5px" borderRadius="7px" border="none" cursor="pointer"
                  style={{ background: "rgba(251,191,36,0.2)", border: "1px solid rgba(251,191,36,0.4)", color: "#fbbf24", fontSize: "0.7rem", fontFamily: "'HarmonyOS Sans', sans-serif" }}>
                  {t("premiumGate.upgrade")}
                </Box>
                <Box as="button" onClick={() => setShowUpgrade(false)}
                  px={3} py="5px" borderRadius="7px" border="none" cursor="pointer"
                  style={{ background: "transparent", color: "rgba(255,255,255,0.35)", fontSize: "0.7rem", fontFamily: "'HarmonyOS Sans', sans-serif" }}>
                  {t("premiumGate.later")}
                </Box>
              </Flex>
            </MotionBox>
          )}
        </AnimatePresence>

        {/* Loading */}
        {loading && (
          <Flex justify="center" align="center" py={8} gap={2}>
            <Loader2 size={16} style={{ color: "rgba(255,255,255,0.3)", animation: "spin 1s linear infinite" }} />
            <Text style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.3)", fontFamily: "'HarmonyOS Sans', sans-serif" }}>
              {t("room.loading")}
            </Text>
          </Flex>
        )}

        {/* Error */}
        {!loading && error && (
          <Flex direction="column" align="center" py={6} gap={3}>
            <AlertCircle size={20} style={{ color: "rgba(248,113,113,0.6)" }} />
            <Text style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.3)", fontFamily: "'HarmonyOS Sans', sans-serif" }}>{error}</Text>
            <Box as="button" onClick={fetchRooms}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.5)", fontSize: "0.72rem", fontFamily: "'HarmonyOS Sans', sans-serif", cursor: "pointer" }}>
              <RefreshCw size={12} /> {t("room.retry")}
            </Box>
          </Flex>
        )}

        {/* Empty */}
        {!loading && !error && rooms.length === 0 && (
          <Flex direction="column" justify="center" align="center" flex={1} gap={3} py={4}>
            <Text style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.25)", fontFamily: "'HarmonyOS Sans', sans-serif" }}>
              {isGuest ? t("backgrounds.noRooms") : t("room.emptyOwned")}
            </Text>
            {!isGuest && (
              <Box as="button" onClick={openCreate}
                display="flex" alignItems="center" gap="6px"
                px={4} py="7px" borderRadius="9px" border="none" cursor="pointer"
                style={{ background: "rgba(78,124,106,0.2)", border: "1px solid rgba(78,124,106,0.35)", color: "#7ecfb0", fontSize: "0.75rem", fontFamily: "'HarmonyOS Sans', sans-serif" }}>
                <Plus size={13} /> {t("room.createBtn")}
              </Box>
            )}
          </Flex>
        )}

        {/* Room grid */}
        {!loading && !error && rooms.length > 0 && (
          <Box display="grid"
            style={{ gridTemplateColumns: "1fr 1fr 1fr", gap: 10, alignContent: "start", flex: 1, minHeight: 0, overflowY: "auto", paddingRight: 2 }}>
            {rooms.map(room => {
              const isActive  = room.id === currentRoomId;
              const isHovered = hoveredCard === room.id;
              const isDeleting = deleteId === room.id;
              const bg: BackgroundItem = {
                id: room.id,
                url:   room.thumbnailUrl ?? "",
                thumb: room.thumbnailUrl ?? "",
                label: room.name,
              };
              return (
                <Box key={room.id} position="relative" borderRadius="10px" overflow="hidden"
                  style={{
                    aspectRatio: "16/9", cursor: "pointer",
                    border: `2px solid ${isActive ? "rgba(255,255,255,0.55)" : "rgba(255,255,255,0.06)"}`,
                    background: "rgba(255,255,255,0.04)",
                    transition: "border-color 0.2s, transform 0.15s",
                    transform: isHovered ? "scale(1.02)" : "scale(1)",
                  }}
                  onMouseEnter={() => setHoveredCard(room.id)}
                  onMouseLeave={() => setHoveredCard(null)}
                  onClick={() => { if (!isHovered) onSelect(room.id, bg); }}
                >
                  <RoomThumb url={isActive && currentBg ? currentBg.url : room.thumbnailUrl} name={room.name} />

                  {/* Gradient overlay */}
                  <Box position="absolute" inset={0}
                    style={{ background: "linear-gradient(to top, rgba(0,0,0,0.65) 0%, transparent 55%)", pointerEvents: "none" }} />

                  {/* Active checkmark */}
                  {isActive && (
                    <Flex position="absolute" top="6px" right="6px" align="center" justify="center"
                      borderRadius="full"
                      style={{ width: 18, height: 18, background: "white", flexShrink: 0 }}>
                      <Check size={11} style={{ color: "#1a3c34" }} />
                    </Flex>
                  )}

                  {/* Room name */}
                  <Text position="absolute" bottom="7px" left="8px"
                    style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.9)", fontFamily: "'HarmonyOS Sans', sans-serif", letterSpacing: "0.02em", pointerEvents: "none" }}>
                    {room.name}
                  </Text>

                  {/* Hover overlay — Edit / Delete (only for logged-in users) */}
                  <AnimatePresence>
                    {!isGuest && isHovered && !isDeleting && (
                      <MotionBox
                        position="absolute" inset={0}
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        transition={{ duration: 0.12 } as any}
                        display="flex" alignItems="center" justifyContent="center" gap="8px"
                        style={{ background: "rgba(0,0,0,0.5)" }}
                      >
                        <Box as="button"
                          onClick={e => { e.stopPropagation(); onSelect(room.id, bg); }}
                          display="flex" alignItems="center" justifyContent="center"
                          w="28px" h="28px" borderRadius="8px" border="none" cursor="pointer"
                          style={{ background: "rgba(255,255,255,0.15)", color: "white" }}
                          title={t("room.selectTitle")}>
                          <CheckIcon size={13} />
                        </Box>
                        <Box as="button"
                          onClick={e => { e.stopPropagation(); openEdit(room); }}
                          display="flex" alignItems="center" justifyContent="center"
                          w="28px" h="28px" borderRadius="8px" border="none" cursor="pointer"
                          style={{ background: "rgba(255,255,255,0.15)", color: "white" }}
                          title={t("room.editTitle")}>
                          <Pencil size={13} />
                        </Box>
                        <Box as="button"
                          onClick={e => { e.stopPropagation(); setDeleteId(room.id); }}
                          display="flex" alignItems="center" justifyContent="center"
                          w="28px" h="28px" borderRadius="8px" border="none" cursor="pointer"
                          style={{ background: "rgba(248,113,113,0.25)", color: "#f87171" }}
                          title={t("room.deleteTitle")}>
                          <Trash2 size={13} />
                        </Box>
                      </MotionBox>
                    )}
                  </AnimatePresence>

                  {/* Delete confirm overlay */}
                  <AnimatePresence>
                    {isDeleting && (
                      <MotionBox
                        position="absolute" inset={0}
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        transition={{ duration: 0.12 } as any}
                        display="flex" flexDirection="column" alignItems="center" justifyContent="center" gap="8px"
                        style={{ background: "rgba(0,0,0,0.75)" }}
                        onClick={e => e.stopPropagation()}
                      >
                        <Text style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.7)", fontFamily: "'HarmonyOS Sans', sans-serif" }}>
                          {t("room.deleteConfirm")}
                        </Text>
                        <Flex gap={2}>
                          <Box as="button" onClick={e => { e.stopPropagation(); setDeleteId(null); }}
                            px={2} py="4px" borderRadius="6px" border="none" cursor="pointer"
                            style={{ background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)", fontSize: "0.65rem", fontFamily: "'HarmonyOS Sans', sans-serif" }}>
                            {t("room.cancel")}
                          </Box>
                          <Box as="button" onClick={e => { e.stopPropagation(); handleDelete(); }}
                            px={2} py="4px" borderRadius="6px" border="none" cursor="pointer"
                            style={{ background: "rgba(248,113,113,0.3)", color: "#f87171", fontSize: "0.65rem", fontFamily: "'HarmonyOS Sans', sans-serif", opacity: deleteLoading ? 0.6 : 1 }}>
                            {deleteLoading ? "…" : t("room.delete")}
                          </Box>
                        </Flex>
                      </MotionBox>
                    )}
                  </AnimatePresence>
                </Box>
              );
            })}
          </Box>
        )}

        {/* Current room footer */}
        {!showForm && (
          <Box mt={3} flexShrink={0} borderRadius="10px" px={3} py="10px"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
            {currentRoomId ? (
              <Flex align="center" gap={2}>
                <Box borderRadius="full" style={{ width: 6, height: 6, background: "#4ade80", boxShadow: "0 0 6px #4ade80", flexShrink: 0 }} />
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
        )}

        {/* Create / Edit form */}
        <AnimatePresence>
          {showForm && (
            <MotionBox
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }}
              transition={{ duration: 0.2 } as any}
              mt={3} flexShrink={0} borderRadius="12px" p={3}
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}
            >
              {/* Form header */}
              <Flex align="center" justify="space-between" mb={3}>
                <Text style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.6)", fontFamily: "'HarmonyOS Sans', sans-serif", letterSpacing: "0.06em" }}>
                  {editTarget ? t("room.formEditHeader") : t("room.formCreateHeader")}
                </Text>
                <Box as="button" onClick={closeForm}
                  style={{ background: "transparent", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.35)", display: "flex" }}>
                  <X size={14} />
                </Box>
              </Flex>

              <Flex direction="column" gap={2}>
                <Input
                  placeholder={t("room.namePlaceholder")}
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  style={inputStyle}
                  _placeholder={{ color: "rgba(255,255,255,0.2)" } as any}
                  _focus={{ borderColor: "rgba(78,124,106,0.5)" } as any}
                />
              </Flex>

              {formError && (
                <Text mt={2} style={{ fontSize: "0.68rem", color: "#f87171", fontFamily: "'HarmonyOS Sans', sans-serif" }}>
                  {formError}
                </Text>
              )}

              <Flex mt={3} gap={2} justify="flex-end">
                <Box as="button" onClick={closeForm}
                  px={3} py="6px" borderRadius="8px" border="none" cursor="pointer"
                  style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.4)", fontSize: "0.72rem", fontFamily: "'HarmonyOS Sans', sans-serif" }}>
                  {t("room.cancel")}
                </Box>
                <Box as="button" onClick={handleSave}
                  px={4} py="6px" borderRadius="8px" border="none" cursor="pointer"
                  style={{
                    background: "rgba(78,124,106,0.25)", border: "1px solid rgba(78,124,106,0.4)",
                    color: "#7ecfb0", fontSize: "0.72rem", fontFamily: "'HarmonyOS Sans', sans-serif", fontWeight: 600,
                    opacity: formLoading ? 0.6 : 1,
                  }}>
                  {formLoading ? "…" : t("room.save")}
                </Box>
              </Flex>
            </MotionBox>
          )}
        </AnimatePresence>
      </Box>
    </MotionBox>
  );
}
