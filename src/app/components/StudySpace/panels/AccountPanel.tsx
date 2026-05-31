import { useEffect, useState } from "react";
import { Box, Flex, Text } from "@chakra-ui/react";
import { motion, AnimatePresence } from "motion/react";
import { LogIn, HelpCircle, LogOut, User, Home, Info, Crown } from "lucide-react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";

const MotionBox = motion.create(Box);

export interface UserInfo {
  name: string;
  email: string;
  avatarUrl?: string;
  accountTier?: string;
}

function AccountTierBadge({ tier }: { tier?: string }) {
  const isPremium = tier?.toLowerCase() === "premium";
  return (
    <Flex
      align="center"
      gap="3px"
      style={{
        display: "inline-flex",
        padding: "2px 7px 2px 5px",
        borderRadius: "20px",
        fontSize: "0.67rem",
        fontFamily: "'HarmonyOS Sans', sans-serif",
        fontWeight: 600,
        letterSpacing: "0.04em",
        userSelect: "none",
        ...(isPremium
          ? {
              background: "linear-gradient(135deg, rgba(251,191,36,0.18) 0%, rgba(245,158,11,0.12) 100%)",
              border: "1px solid rgba(251,191,36,0.45)",
              color: "#fbbf24",
            }
          : {
              background: "rgba(255,255,255,0.07)",
              border: "1px solid rgba(255,255,255,0.15)",
              color: "rgba(255,255,255,0.45)",
            }),
      }}
    >
      {isPremium ? (
        <Crown size={9} style={{ flexShrink: 0 }} />
      ) : null}
      {isPremium ? "Premium" : "Free"}
    </Flex>
  );
}

interface AccountPanelProps {
  open: boolean;
  user: UserInfo | null;
  anchorRef: React.RefObject<HTMLDivElement | null>;
  panelRef: React.RefObject<HTMLDivElement | null>;
  onClose: () => void;
  onLogout: () => void;
  onHome: () => void;
  onAbout: () => void;
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function AvatarCircle({
  user,
  size = 40,
  fontSize = "0.95rem",
}: {
  user: UserInfo | null;
  size?: number;
  fontSize?: string;
}) {
  if (user?.avatarUrl) {
    return (
      <Box
        w={`${size}px`}
        h={`${size}px`}
        borderRadius="full"
        overflow="hidden"
        flexShrink={0}
        style={{ border: "2px solid rgba(122,171,151,0.55)" }}
      >
        <img
          src={user.avatarUrl}
          alt={user.name}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </Box>
    );
  }
  if (user) {
    return (
      <Box
        w={`${size}px`}
        h={`${size}px`}
        borderRadius="full"
        flexShrink={0}
        display="flex"
        alignItems="center"
        justifyContent="center"
        style={{
          background: "linear-gradient(135deg, #2a6b55 0%, #1a4db5 100%)",
          border: "2px solid rgba(122,171,151,0.55)",
          color: "white",
          fontSize,
          letterSpacing: "0.03em",
          userSelect: "none",
        }}
      >
        {getInitials(user.name)}
      </Box>
    );
  }
  // Guest
  return (
    <Box
      w={`${size}px`}
      h={`${size}px`}
      borderRadius="full"
      flexShrink={0}
      display="flex"
      alignItems="center"
      justifyContent="center"
      style={{
        background: "rgba(255,255,255,0.08)",
        border: "2px solid rgba(255,255,255,0.2)",
        color: "rgba(255,255,255,0.5)",
      }}
    >
      <User size={size * 0.5} />
    </Box>
  );
}

export { AvatarCircle };

export function AccountPanel({ open, user, anchorRef, panelRef, onClose, onLogout, onHome, onAbout }: AccountPanelProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [pos, setPos] = useState<{ bottom: number; right: number } | null>(null);

  useEffect(() => {
    if (!open || !anchorRef.current) return;
    const rect = anchorRef.current.getBoundingClientRect();
    setPos({
      bottom: window.innerHeight - rect.top + 8,
      right: window.innerWidth - rect.right - rect.width / 2,
    });
  }, [open, anchorRef]);

  const menuItemStyle = {
    color: "rgba(255,255,255,0.78)",
    fontSize: "0.84rem",
    fontFamily: "'HarmonyOS Sans', sans-serif",
    cursor: "pointer",
    transition: "background 0.15s, color 0.15s",
    background: "transparent",
    border: "none",
    textAlign: "left" as const,
    letterSpacing: "0.01em",
  };

  return (
    <AnimatePresence>
      {open && (
        <MotionBox
          ref={panelRef as any}
          // ref is managed externally for click-outside in parent
          initial={{ opacity: 0, scale: 0.94, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 8 }}
          transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] } as any}
          position="fixed"
          zIndex={100}
          style={{
            bottom: pos ? `${pos.bottom}px` : "80px",
            right: pos ? `${Math.max(8, pos.right)}px` : "24px",
            background: "rgba(12,18,22,0.92)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: "16px",
            padding: "10px",
            minWidth: "220px",
            boxShadow: "0 16px 48px rgba(0,0,0,0.65)",
            transformOrigin: "bottom right",
          }}
        >
          {user ? (
            /* ── Logged-in state ── */
            <>
              {/* User info header */}
              <Flex align="center" gap={3} px={2} py={2} mb={1}>
                <AvatarCircle user={user} size={42} />
                <Box overflow="hidden">
                  <Text
                    style={{
                      color: "rgba(255,255,255,0.95)",
                      fontSize: "0.88rem",
                      fontFamily: "'HarmonyOS Sans', sans-serif",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      maxWidth: "140px",
                    }}
                  >
                    {user.name}
                  </Text>
                  <Text
                    style={{
                      color: "rgba(255,255,255,0.42)",
                      fontSize: "0.75rem",
                      fontFamily: "'HarmonyOS Sans', sans-serif",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      maxWidth: "140px",
                    }}
                  >
                    {user.email}
                  </Text>
                  <Box mt="4px">
                    <AccountTierBadge tier={user.accountTier} />
                  </Box>
                </Box>
              </Flex>

              {/* Divider */}
              <Box
                mx={2}
                my="6px"
                h="1px"
                style={{ background: "rgba(255,255,255,0.08)" }}
              />

              {/* Help */}
              <Box
                as="button"
                onClick={() => onClose()}
                display="flex"
                alignItems="center"
                gap={2}
                w="100%"
                px="10px"
                py="8px"
                borderRadius="9px"
                style={menuItemStyle}
                _hover={{ background: "rgba(255,255,255,0.08)", color: "white" } as any}
              >
                <HelpCircle size={15} style={{ opacity: 0.65, flexShrink: 0 }} />
                {t("account.help")}
              </Box>

              {/* Home */}
              <Box
                as="button"
                onClick={() => { onHome(); onClose(); }}
                display="flex"
                alignItems="center"
                gap={2}
                w="100%"
                px="10px"
                py="8px"
                borderRadius="9px"
                style={menuItemStyle}
                _hover={{ background: "rgba(255,255,255,0.08)", color: "white" } as any}
              >
                <Home size={15} style={{ opacity: 0.65, flexShrink: 0 }} />
                {t("account.home")}
              </Box>

              {/* About */}
              <Box
                as="button"
                onClick={() => { onAbout(); onClose(); }}
                display="flex"
                alignItems="center"
                gap={2}
                w="100%"
                px="10px"
                py="8px"
                borderRadius="9px"
                style={menuItemStyle}
                _hover={{ background: "rgba(255,255,255,0.08)", color: "white" } as any}
              >
                <Info size={15} style={{ opacity: 0.65, flexShrink: 0 }} />
                {t("account.about")}
              </Box>

              {/* Divider */}
              <Box
                mx={2}
                my="6px"
                h="1px"
                style={{ background: "rgba(255,255,255,0.08)" }}
              />

              {/* Logout */}
              <Box
                as="button"
                onClick={() => { onLogout(); onClose(); }}
                display="flex"
                alignItems="center"
                gap={2}
                w="100%"
                px="10px"
                py="8px"
                borderRadius="9px"
                style={{ ...menuItemStyle, color: "rgba(248,113,113,0.85)" }}
                _hover={{ background: "rgba(248,113,113,0.1)", color: "#f87171" } as any}
              >
                <LogOut size={15} style={{ flexShrink: 0 }} />
                {t("account.signOut")}
              </Box>
            </>
          ) : (
            /* ── Guest state ── */
            <>
              {/* Guest header */}
              <Flex align="center" gap={3} px={2} py={2} mb={1}>
                <AvatarCircle user={null} size={42} />
                <Box>
                  <Text
                    style={{
                      color: "rgba(255,255,255,0.9)",
                      fontSize: "0.88rem",
                      fontFamily: "'HarmonyOS Sans', sans-serif",
                    }}
                  >
                    {t("account.guest")}
                  </Text>
                  <Text
                    style={{
                      color: "rgba(255,255,255,0.38)",
                      fontSize: "0.73rem",
                      fontFamily: "'HarmonyOS Sans', sans-serif",
                    }}
                  >
                    {t("account.demoMode")}
                  </Text>
                </Box>
              </Flex>

              {/* Divider */}
              <Box
                mx={2}
                my="6px"
                h="1px"
                style={{ background: "rgba(255,255,255,0.08)" }}
              />

              {/* Prompt message */}
              <Box px={2} py="6px" mb={1}>
                <Text
                  style={{
                    color: "rgba(255,255,255,0.45)",
                    fontSize: "0.78rem",
                    fontFamily: "'HarmonyOS Sans', sans-serif",
                    lineHeight: "1.5",
                  }}
                >
                  {t("account.signInPrompt")}
                </Text>
              </Box>

              {/* Help */}
              <Box
                as="button"
                onClick={() => onClose()}
                display="flex"
                alignItems="center"
                gap={2}
                w="100%"
                px="10px"
                py="8px"
                borderRadius="9px"
                style={menuItemStyle}
                _hover={{ background: "rgba(255,255,255,0.08)", color: "white" } as any}
              >
                <HelpCircle size={15} style={{ opacity: 0.65, flexShrink: 0 }} />
                {t("account.help")}
              </Box>

              {/* Home */}
              <Box
                as="button"
                onClick={() => { onHome(); onClose(); }}
                display="flex"
                alignItems="center"
                gap={2}
                w="100%"
                px="10px"
                py="8px"
                borderRadius="9px"
                style={menuItemStyle}
                _hover={{ background: "rgba(255,255,255,0.08)", color: "white" } as any}
              >
                <Home size={15} style={{ opacity: 0.65, flexShrink: 0 }} />
                {t("account.home")}
              </Box>

              {/* About */}
              <Box
                as="button"
                onClick={() => { onAbout(); onClose(); }}
                display="flex"
                alignItems="center"
                gap={2}
                w="100%"
                px="10px"
                py="8px"
                borderRadius="9px"
                style={menuItemStyle}
                _hover={{ background: "rgba(255,255,255,0.08)", color: "white" } as any}
              >
                <Info size={15} style={{ opacity: 0.65, flexShrink: 0 }} />
                {t("account.about")}
              </Box>

              {/* Divider */}
              <Box
                mx={2}
                my="6px"
                h="1px"
                style={{ background: "rgba(255,255,255,0.08)" }}
              />

              {/* Sign in button */}
              <Box
                as="button"
                onClick={() => { onClose(); navigate("/login"); }}
                display="flex"
                alignItems="center"
                justifyContent="center"
                gap={2}
                w="100%"
                h="38px"
                borderRadius="10px"
                mt={1}
                style={{
                  background: "linear-gradient(135deg, #1a6b55 0%, #1a4db5 100%)",
                  color: "rgba(255,255,255,0.95)",
                  fontSize: "0.84rem",
                  fontFamily: "'HarmonyOS Sans', sans-serif",
                  cursor: "pointer",
                  border: "none",
                  boxShadow: "0 4px 14px rgba(26,77,181,0.35)",
                  transition: "opacity 0.2s",
                  letterSpacing: "0.02em",
                }}
                _hover={{ opacity: 0.88 } as any}
              >
                <LogIn size={15} />
                {t("account.signIn")}
              </Box>
            </>
          )}
        </MotionBox>
      )}
    </AnimatePresence>
  );
}
