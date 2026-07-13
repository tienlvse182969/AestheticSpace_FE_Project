import { useEffect, useRef, useState } from "react";
import { Box, Flex, Text } from "@chakra-ui/react";
import { motion, AnimatePresence } from "motion/react";
import { Bell, Check } from "lucide-react";
import type { NotificationDto } from "../../../../services/notification.service";

const MotionBox = motion.create(Box);

interface Props {
  enabled: boolean;
  fetchNotifications: () => Promise<NotificationDto[]>;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  /** "floating" = fixed top-right pill (user StudySpace toolbar); "inline" = sits inline in a topbar row (admin panel). */
  variant?: "floating" | "inline";
}

function fmtRelative(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "Vừa xong";
  if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} ngày trước`;
  return new Date(iso).toLocaleDateString("vi-VN", { year: "numeric", month: "short", day: "numeric" });
}

export function NotificationBell({ enabled, fetchNotifications, markRead, markAllRead, variant = "floating" }: Props) {
  const [notifications, setNotifications] = useState<NotificationDto[]>([]);
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  useEffect(() => {
    if (!enabled) return;
    fetchNotifications().then(setNotifications).catch(() => {});
  }, [enabled]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  if (!enabled) return null;

  const handleToggleOpen = () => {
    setOpen(o => {
      const next = !o;
      if (next) fetchNotifications().then(setNotifications).catch(() => {});
      return next;
    });
  };

  const handleMarkRead = async (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    try { await markRead(id); } catch {}
  };

  const handleMarkAllRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    try { await markAllRead(); } catch {}
  };

  const triggerSize = variant === "floating" ? "36px" : "30px";

  return (
    <Box
      ref={wrapRef as any}
      position={variant === "floating" ? "fixed" : "relative"}
      zIndex={variant === "floating" ? 200 : undefined}
      style={variant === "floating" ? { top: "52px", right: "16px" } : undefined}
    >
      <Box
        as="button"
        onClick={handleToggleOpen}
        position="relative"
        display="flex" alignItems="center" justifyContent="center"
        w={triggerSize} h={triggerSize} borderRadius="full" border="none" cursor="pointer"
        style={{
          background: variant === "floating" ? "rgba(10,15,20,0.65)" : "rgba(255,255,255,0.06)",
          backdropFilter: variant === "floating" ? "blur(10px)" : undefined,
          border: variant === "floating" ? "1px solid rgba(255,255,255,0.18)" : "1px solid rgba(255,255,255,0.1)",
          color: "rgba(255,255,255,0.8)",
          transition: "background 0.2s, color 0.2s",
          boxShadow: variant === "floating" ? "0 2px 12px rgba(0,0,0,0.4)" : "none",
        }}
        _hover={{ background: "rgba(25,35,45,0.85)", color: "white" } as any}
      >
        <Bell size={variant === "floating" ? 16 : 14} />
        {unreadCount > 0 && (
          <Flex
            position="absolute" top="-2px" right="-2px"
            align="center" justify="center"
            minW="15px" h="15px" px="3px" borderRadius="full"
            style={{ background: "#f87171", border: "1.5px solid rgba(10,15,20,0.9)" }}
          >
            <Text style={{ fontSize: "0.55rem", fontWeight: 700, color: "white", lineHeight: 1 }}>
              {unreadCount > 9 ? "9+" : unreadCount}
            </Text>
          </Flex>
        )}
      </Box>

      <AnimatePresence>
        {open && (
          <MotionBox
            initial={{ opacity: 0, scale: 0.94, y: -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: -6 }}
            transition={{ duration: 0.16, ease: [0.4, 0, 0.2, 1] } as any}
            position="absolute" top="calc(100% + 8px)" right={0} zIndex={210}
            style={{
              background: "rgba(12,18,22,0.92)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: "14px",
              width: "300px",
              maxHeight: "360px",
              boxShadow: "0 16px 48px rgba(0,0,0,0.65)",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <Flex align="center" justify="space-between" px="14px" py="10px"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
              <Text style={{ fontSize: "0.78rem", fontWeight: 600, color: "rgba(255,255,255,0.85)", fontFamily: "'HarmonyOS Sans', sans-serif" }}>
                Thông báo
              </Text>
              {unreadCount > 0 && (
                <Box as="button" onClick={handleMarkAllRead}
                  border="none" background="transparent" cursor="pointer"
                  style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <Check size={11} color="rgba(78,124,106,0.9)" />
                  <Text style={{ fontSize: "0.66rem", color: "rgba(78,124,106,0.9)", fontFamily: "'HarmonyOS Sans', sans-serif" }}>
                    Đánh dấu tất cả đã đọc
                  </Text>
                </Box>
              )}
            </Flex>

            <Box overflowY="auto" style={{ flex: 1 }}>
              {notifications.length === 0 ? (
                <Flex align="center" justify="center" py="28px">
                  <Text style={{ fontSize: "0.76rem", color: "rgba(255,255,255,0.3)", fontFamily: "'HarmonyOS Sans', sans-serif" }}>
                    Không có thông báo
                  </Text>
                </Flex>
              ) : (
                notifications
                  .slice()
                  .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                  .map(n => (
                    <Box
                      key={n.id}
                      as="button"
                      onClick={() => !n.isRead && handleMarkRead(n.id)}
                      w="100%" textAlign="left" border="none" cursor="pointer"
                      px="14px" py="10px"
                      style={{
                        background: n.isRead ? "transparent" : "rgba(78,124,106,0.08)",
                        borderBottom: "1px solid rgba(255,255,255,0.05)",
                        transition: "background 0.15s",
                      }}
                    >
                      <Flex align="flex-start" gap="8px">
                        {!n.isRead && (
                          <Box w="6px" h="6px" mt="5px" borderRadius="full" flexShrink={0} style={{ background: "#4ade80" }} />
                        )}
                        <Box flex={1} minW={0}>
                          <Text style={{
                            fontSize: "0.76rem", fontWeight: n.isRead ? 400 : 600,
                            color: n.isRead ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.92)",
                            fontFamily: "'HarmonyOS Sans', sans-serif", marginBottom: "2px",
                          }}>
                            {n.title}
                          </Text>
                          <Text style={{
                            fontSize: "0.7rem", color: "rgba(255,255,255,0.4)",
                            fontFamily: "'HarmonyOS Sans', sans-serif", lineHeight: 1.45, marginBottom: "3px",
                          }}>
                            {n.message}
                          </Text>
                          <Text style={{ fontSize: "0.62rem", color: "rgba(255,255,255,0.22)", fontFamily: "'HarmonyOS Sans', sans-serif" }}>
                            {fmtRelative(n.createdAt)}
                          </Text>
                        </Box>
                      </Flex>
                    </Box>
                  ))
              )}
            </Box>
          </MotionBox>
        )}
      </AnimatePresence>
    </Box>
  );
}
