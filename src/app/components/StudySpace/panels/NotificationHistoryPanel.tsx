import { useEffect, useState } from "react";
import { Box, Flex, Text } from "@chakra-ui/react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowRight, Bell, Brush, Sparkles, Trash2, Trophy, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import { PanelCloseBtn } from "../ui/PanelCloseBtn";
import { useNotificationBanners, type NotificationHistoryItem } from "../../../context/NotificationBannerContext";

const MotionBox = motion.create(Box);

const SIDEBAR_W = 360;

function fmtRelative(iso: string, t: TFunction, locale: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return t("notification.justNow");
  if (diff < 3600) return t("notification.minutesAgo", { n: Math.floor(diff / 60) });
  if (diff < 86400) return t("notification.hoursAgo", { n: Math.floor(diff / 3600) });
  if (diff < 604800) return t("notification.daysAgo", { n: Math.floor(diff / 86400) });
  return new Date(iso).toLocaleDateString(locale, { year: "numeric", month: "short", day: "numeric" });
}

const KIND_ICON = { notification: Bell, quest: Trophy, welcome: Sparkles, creator: Brush } as const;
const KIND_COLOR = { notification: "rgba(255,255,255,0.5)", quest: "#facc15", welcome: "#38bdf8", creator: "#a78bfa" } as const;

function ActionBtn({ label, color, onClick }: { label: string; color: string; onClick: () => void }) {
  return (
    <Box
      as="button"
      onClick={(e: React.MouseEvent) => { e.stopPropagation(); onClick(); }}
      border="none" cursor="pointer"
      display="inline-flex" alignItems="center" gap="4px"
      px="8px" py="4px" borderRadius="7px" mt="6px"
      style={{ background: `${color}1f`, border: `1px solid ${color}55` }}
    >
      <Text style={{ fontSize: "0.66rem", fontWeight: 600, color, fontFamily: "'HarmonyOS Sans', sans-serif" }}>
        {label}
      </Text>
      <ArrowRight size={10} style={{ color }} />
    </Box>
  );
}

interface HistoryRowProps {
  item: NotificationHistoryItem;
  onOpenQuest: () => void;
  onOpenCreatorStore: () => void;
  onRemove: () => void;
}

function HistoryRow({ item, onOpenQuest, onOpenCreatorStore, onRemove }: HistoryRowProps) {
  const { t, i18n } = useTranslation();
  const locale = i18n.language === "vi" ? "vi-VN" : "en-US";
  const Icon = KIND_ICON[item.kind];
  const [hovered, setHovered] = useState(false);
  return (
    <MotionBox
      layout
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 80, transition: { duration: 0.22, ease: [0.4, 0, 1, 1] } } as any}
      transition={{ duration: 0.18 } as any}
      position="relative"
      px="12px" py="10px"
      borderRadius="12px"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: item.read ? "rgba(255,255,255,0.03)" : "rgba(78,124,106,0.1)",
        border: `1px solid ${item.read ? "rgba(255,255,255,0.06)" : "rgba(78,124,106,0.28)"}`,
        transition: "background 0.15s, border-color 0.15s",
      }}
    >
      {hovered && (
        <Box
          as="button"
          onClick={(e: React.MouseEvent) => { e.stopPropagation(); onRemove(); }}
          position="absolute" top="6px" right="6px" zIndex={1}
          display="flex" alignItems="center" justifyContent="center"
          w="18px" h="18px" borderRadius="full" border="none" cursor="pointer"
          style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.55)" }}
          _hover={{ background: "rgba(248,113,113,0.25)", color: "#f87171" } as any}
        >
          <X size={11} />
        </Box>
      )}
      <Flex align="flex-start" gap="8px">
        <Box
          display="flex" alignItems="center" justifyContent="center"
          w="26px" h="26px" borderRadius="full" flexShrink={0}
          style={{ background: "rgba(255,255,255,0.05)" }}
        >
          <Icon size={13} style={{ color: KIND_COLOR[item.kind] }} />
        </Box>
        <Box flex={1} minW={0}>
          <Text style={{
            fontSize: "0.76rem", fontWeight: item.read ? 400 : 600,
            color: item.read ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.92)",
            fontFamily: "'HarmonyOS Sans', sans-serif", marginBottom: "2px",
          }}>
            {item.title}
          </Text>
          {item.message && (
            <Text style={{
              fontSize: "0.7rem", color: "rgba(255,255,255,0.4)",
              fontFamily: "'HarmonyOS Sans', sans-serif", lineHeight: 1.45, marginBottom: "3px",
            }}>
              {item.message}
            </Text>
          )}
          <Text style={{ fontSize: "0.62rem", color: "rgba(255,255,255,0.22)", fontFamily: "'HarmonyOS Sans', sans-serif" }}>
            {fmtRelative(item.createdAt, t, locale)}
          </Text>
          {item.kind === "quest" && (
            <ActionBtn label={t("notification.viewQuest")} color={KIND_COLOR.quest} onClick={onOpenQuest} />
          )}
          {item.kind === "creator" && (
            <ActionBtn label={t("notification.viewCreator")} color={KIND_COLOR.creator} onClick={onOpenCreatorStore} />
          )}
        </Box>
        {!item.read && !hovered && (
          <Box w="6px" h="6px" mt="4px" borderRadius="full" flexShrink={0} style={{ background: "#4ade80" }} />
        )}
      </Flex>
    </MotionBox>
  );
}

function ClearAllConfirmModal({ onCancel, onConfirm }: { onCancel: () => void; onConfirm: () => void }) {
  const { t } = useTranslation();
  return (
    <>
      <MotionBox
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 } as any}
        position="fixed"
        inset={0}
        zIndex={59}
        onClick={onCancel}
        style={{ background: "rgba(0,0,0,0.45)" }}
      />
      <Box position="fixed" inset={0} zIndex={60} display="flex" alignItems="center" justifyContent="center" pointerEvents="none">
        <MotionBox
          initial={{ opacity: 0, scale: 0.9, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 6 }}
          transition={{ duration: 0.18, ease: [0.34, 1.56, 0.64, 1] } as any}
          style={{
            pointerEvents: "auto",
            width: 280,
            borderRadius: "16px",
            background: "rgba(16,22,26,0.96)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            border: "1px solid rgba(248,113,113,0.25)",
            boxShadow: "0 24px 64px rgba(0,0,0,0.7)",
            padding: "22px 20px 16px",
            textAlign: "center",
          }}
        >
          <Flex justify="center" mb={3}>
            <Box
              display="flex" alignItems="center" justifyContent="center"
              style={{
                width: 44, height: 44, borderRadius: "14px",
                background: "rgba(248,113,113,0.14)",
                border: "1px solid rgba(248,113,113,0.3)",
              }}
            >
              <Trash2 size={20} style={{ color: "#f87171" }} />
            </Box>
          </Flex>
          <Text style={{ fontSize: "0.9rem", fontWeight: 700, color: "rgba(255,255,255,0.92)", fontFamily: "'HarmonyOS Sans', sans-serif", marginBottom: "6px" }}>
            {t("notification.clearAllConfirm")}
          </Text>
          <Text style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.4)", fontFamily: "'HarmonyOS Sans', sans-serif", lineHeight: 1.5, marginBottom: "18px" }}>
            {t("notification.clearAllDesc")}
          </Text>
          <Flex gap={2}>
            <Box
              as="button"
              onClick={onCancel}
              flex={1} h="36px" borderRadius="10px" border="none" cursor="pointer"
              display="flex" alignItems="center" justifyContent="center"
              style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.7)", fontSize: "0.78rem", fontFamily: "'HarmonyOS Sans', sans-serif", fontWeight: 600 }}
            >
              {t("notification.cancel")}
            </Box>
            <Box
              as="button"
              onClick={onConfirm}
              flex={1} h="36px" borderRadius="10px" border="none" cursor="pointer"
              display="flex" alignItems="center" justifyContent="center"
              style={{ background: "rgba(248,113,113,0.22)", color: "#f87171", fontSize: "0.78rem", fontFamily: "'HarmonyOS Sans', sans-serif", fontWeight: 700 }}
            >
              {t("notification.clearAll")}
            </Box>
          </Flex>
        </MotionBox>
      </Box>
    </>
  );
}

interface Props {
  onClose: () => void;
  onOpenQuest: () => void;
  onOpenCreatorStore: () => void;
}

export function NotificationHistoryPanel({ onClose, onOpenQuest, onOpenCreatorStore }: Props) {
  const { t } = useTranslation();
  const { history, markHistoryRead, clearHistory, removeHistoryItem } = useNotificationBanners();
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);

  // Opening the panel is what "reads" the notifications — clears the toolbar badge.
  useEffect(() => {
    markHistoryRead();
  }, [markHistoryRead]);

  const sorted = history.slice().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const handleClearAll = () => {
    if (history.length === 0) return;
    setConfirmClearOpen(true);
  };

  const handleConfirmClear = () => {
    clearHistory();
    setConfirmClearOpen(false);
  };

  // Both callbacks set the same shared activePanel state (to "quest" / "theme"), which
  // already implicitly closes this sidebar — calling onClose() afterwards would just
  // overwrite that with null in the same batched update and undo the navigation.
  const handleOpenQuest = onOpenQuest;
  const handleOpenCreatorStore = onOpenCreatorStore;

  return (
    <>
      {/* Backdrop — click outside the sidebar to close */}
      <MotionBox
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18 } as any}
        position="fixed"
        inset={0}
        zIndex={49}
        onClick={onClose}
        style={{ background: "rgba(0,0,0,0.25)" }}
      />

      <MotionBox
        initial={{ x: "100%" }}
        animate={{ x: 0, transition: { type: "spring", stiffness: 420, damping: 38, mass: 0.9 } } as any}
        exit={{ x: "100%", transition: { duration: 0.2, ease: [0.4, 0, 1, 1] } } as any}
        position="fixed"
        top={0}
        right={0}
        bottom={0}
        zIndex={50}
        style={{
          width: SIDEBAR_W,
          maxWidth: "92vw",
          background: "rgba(12,18,22,0.85)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderLeft: "1px solid rgba(255,255,255,0.1)",
          boxShadow: "-16px 0 48px rgba(0,0,0,0.5)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Box position="relative" style={{ padding: "18px 18px 14px" }}>
          <PanelCloseBtn onClose={onClose} />
          <Flex align="center" justify="space-between" pr="40px">
            <Flex align="center" gap={2}>
              <Bell size={15} style={{ color: "rgba(255,255,255,0.5)" }} />
              <Text style={{
                fontSize: "0.7rem", color: "rgba(255,255,255,0.35)",
                letterSpacing: "0.1em", fontFamily: "'HarmonyOS Sans', sans-serif",
              }}>
                {t("notification.panelTitle")}
              </Text>
            </Flex>
            {history.length > 0 && (
              <Box
                as="button"
                onClick={handleClearAll}
                border="none" background="transparent" cursor="pointer"
                style={{ display: "flex", alignItems: "center", gap: "4px" }}
              >
                <Trash2 size={11} color="rgba(248,113,113,0.85)" />
                <Text style={{ fontSize: "0.66rem", color: "rgba(248,113,113,0.85)", fontFamily: "'HarmonyOS Sans', sans-serif" }}>
                  {t("notification.clearAll")}
                </Text>
              </Box>
            )}
          </Flex>
        </Box>

        <Box overflowY="auto" style={{ flex: 1, borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          {/* AnimatePresence stays mounted across the empty <-> list switch so that exiting
              cards (single delete or "clear all") get to finish their slide-out animation
              instead of being yanked out the instant the empty state swaps in. */}
          <Flex direction="column" gap="8px" style={{ padding: sorted.length === 0 ? 0 : "14px" }}>
            <AnimatePresence initial={false}>
              {sorted.length === 0 ? (
                <MotionBox
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 } as any}
                  display="flex" alignItems="center" justifyContent="center" py="48px"
                >
                  <Text style={{ fontSize: "0.76rem", color: "rgba(255,255,255,0.3)", fontFamily: "'HarmonyOS Sans', sans-serif" }}>
                    {t("notification.empty")}
                  </Text>
                </MotionBox>
              ) : (
                sorted.map((item) => (
                  <HistoryRow
                    key={item.id}
                    item={item}
                    onOpenQuest={handleOpenQuest}
                    onOpenCreatorStore={handleOpenCreatorStore}
                    onRemove={() => removeHistoryItem(item.id)}
                  />
                ))
              )}
            </AnimatePresence>
          </Flex>
        </Box>
      </MotionBox>

      <AnimatePresence>
        {confirmClearOpen && (
          <ClearAllConfirmModal
            key="clear-all-confirm"
            onCancel={() => setConfirmClearOpen(false)}
            onConfirm={handleConfirmClear}
          />
        )}
      </AnimatePresence>
    </>
  );
}
