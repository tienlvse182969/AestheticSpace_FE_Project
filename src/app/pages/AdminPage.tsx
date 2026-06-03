import { useState, useRef, useEffect } from "react";
import { Box, Flex, Text } from "@chakra-ui/react";
import { motion, AnimatePresence } from "motion/react";
import {
  LayoutDashboard, Users, Palette, Sparkles, AudioWaveform,
  ArrowLeft, ShieldCheck, ChevronRight, BarChart2, Sun, Moon, LogOut, Globe, Target,
} from "lucide-react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../context/AuthContext";
import { AdminThemeProvider, useAdminTheme } from "../components/admin/AdminThemeContext";
import { analyticsAdminService } from "../../services/admin/analytics.admin.service";
import { AvatarCircle } from "../components/StudySpace/panels/AccountPanel";
import { DashboardSection }  from "../components/admin/DashboardSection";
import { UsersSection }      from "../components/admin/UsersSection";
import { MissionsSection }   from "../components/admin/MissionsSection";
import { ThemesSection }    from "../components/admin/ThemesSection";
import { StickersSection }  from "../components/admin/StickersSection";
import { SoundsSection }    from "../components/admin/SoundsSection";
import { RevenueSection }   from "../components/admin/RevenueSection";

const MotionBox = motion.create(Box);

type AdminSection = "dashboard" | "users" | "missions" | "themes" | "stickers" | "sounds" | "revenue";

const BASE_NAV_ITEMS: {
  key: AdminSection;
  labelKey: string;
  icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>;
  badge?: number;
}[] = [
  { key: "dashboard", labelKey: "admin.nav.dashboard", icon: LayoutDashboard },
  { key: "users",     labelKey: "admin.nav.users",     icon: Users },
  { key: "missions",  labelKey: "admin.nav.missions",  icon: Target },
  { key: "revenue",   labelKey: "admin.nav.revenue",   icon: BarChart2 },
  { key: "themes",    labelKey: "admin.nav.themes",    icon: Palette,       badge: 6 },
  { key: "stickers",  labelKey: "admin.nav.stickers",  icon: Sparkles,      badge: 8 },
  { key: "sounds",    labelKey: "admin.nav.sounds",    icon: AudioWaveform, badge: 8 },
];

function AdminPageInner() {
  const [activeSection,    setActiveSection]    = useState<AdminSection>("dashboard");
  const [showAccountPanel, setShowAccountPanel] = useState(false);
  const [totalUsers,       setTotalUsers]       = useState<number | null>(null);
  const avatarRef      = useRef<HTMLDivElement>(null);
  const panelRef       = useRef<HTMLDivElement>(null);
  const navigate       = useNavigate();
  const { t, i18n }    = useTranslation();
  const isVi = i18n.language === "vi";
  const { user, logout } = useAuth();
  const { isDark, toggle, c } = useAdminTheme();

  const NAV_ITEMS = BASE_NAV_ITEMS.map(item => ({
    ...item,
    label: t(item.labelKey),
    ...(item.key === "users" && totalUsers !== null ? { badge: totalUsers } : {}),
  }));

  const current = NAV_ITEMS.find(n => n.key === activeSection)!;

  useEffect(() => {
    analyticsAdminService.getOverview()
      .then(d => setTotalUsers(d.totalUsers))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        panelRef.current  && !panelRef.current.contains(e.target as Node) &&
        avatarRef.current && !avatarRef.current.contains(e.target as Node)
      ) {
        setShowAccountPanel(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <Box
      position="fixed"
      inset={0}
      display="flex"
      overflow="hidden"
      style={{ fontFamily: "'HarmonyOS Sans', sans-serif" }}
    >
      {/* Background */}
      <Box position="absolute" inset={0} style={{ background: c.bg, transition: "background 0.3s" }} />
      <Box
        position="absolute"
        inset={0}
        style={{
          backgroundImage: c.dot,
          backgroundSize: "28px 28px",
          pointerEvents: "none",
          transition: "background-image 0.3s",
        }}
      />

      {/* ── Sidebar ── */}
      <Box
        flexShrink={0}
        w="240px"
        h="100vh"
        overflowY="auto"
        position="relative"
        zIndex={20}
        display="flex"
        flexDirection="column"
        style={{
          background:          c.sidebar,
          backdropFilter:      "blur(20px)",
          WebkitBackdropFilter:"blur(20px)",
          borderRight:         `1px solid ${c.sidebarBorder}`,
          transition:          "background 0.3s, border-color 0.3s",
        }}
      >
        {/* Logo */}
        <Box px={5} py={5} style={{ borderBottom: `1px solid ${c.border}` }}>
          <Flex align="center" gap={2}>
            <Flex
              align="center"
              justify="center"
              w="28px"
              h="28px"
              borderRadius="7px"
              style={{ background: "rgba(78,124,106,0.2)", border: "1px solid rgba(78,124,106,0.3)" }}
            >
              <ShieldCheck size={14} style={{ color: "#4e7c6a" }} />
            </Flex>
            <Text style={{ fontSize: "0.95rem", color: c.text, letterSpacing: "0.01em" }}>
              <span style={{ fontFamily: "'Manrope', sans-serif" }}>Aēsthetic</span>
              {" "}
              <span style={{ fontFamily: "'HarmonyOS Sans', sans-serif" }}>{t("admin.nav.adminPanel")}</span>
            </Text>
          </Flex>
        </Box>

        {/* Nav */}
        <Box px={3} py={4} flex={1}>
          <Text
            mb={3}
            px={2}
            style={{ fontSize: "0.6rem", color: c.textSub, letterSpacing: "0.14em" }}
          >
            {t("admin.nav.navigation")}
          </Text>

          {NAV_ITEMS.map(item => {
            const Icon     = item.icon;
            const isActive = activeSection === item.key;
            return (
              <Box
                key={item.key}
                as="button"
                w="full"
                textAlign="left"
                onClick={() => setActiveSection(item.key)}
                borderRadius="9px"
                mb="2px"
                px={3}
                py="9px"
                border="none"
                cursor="pointer"
                transition="all 0.18s"
                style={{
                  display:    "flex",
                  alignItems: "center",
                  gap:        9,
                  background: isActive ? c.navActive : "transparent",
                  outline:    isActive ? `1px solid ${c.navActiveBorder}` : "1px solid transparent",
                }}
                _hover={{ background: isActive ? c.navActive : c.navHover } as any}
              >
                <Icon size={15} style={{ color: isActive ? c.accent : c.textDim, flexShrink: 0 }} />
                <Text
                  flex={1}
                  style={{ fontSize: "0.83rem", color: isActive ? c.text : c.textMuted }}
                >
                  {item.label}
                </Text>
                {item.badge !== undefined && (
                  <Box
                    borderRadius="full"
                    px="7px"
                    py="1px"
                    style={{
                      background: isActive ? "rgba(78,124,106,0.25)" : c.badgeBg,
                      flexShrink: 0,
                    }}
                  >
                    <Text style={{ fontSize: "0.6rem", color: isActive ? c.accent : c.badgeText }}>
                      {item.badge.toLocaleString()}
                    </Text>
                  </Box>
                )}
                {isActive && (
                  <Box w="4px" h="4px" borderRadius="full" flexShrink={0} style={{ background: c.accent }} />
                )}
              </Box>
            );
          })}
        </Box>

        {/* Bottom: back to home */}
        <Box px={3} pb={5} style={{ borderTop: `1px solid ${c.border}`, paddingTop: 16 }}>
          <Box
            as="button"
            w="full"
            textAlign="left"
            onClick={() => navigate("/")}
            borderRadius="9px"
            px={3}
            py="9px"
            border="none"
            cursor="pointer"
            transition="all 0.18s"
            style={{ display: "flex", alignItems: "center", gap: 9, background: "transparent" }}
            _hover={{ background: c.navHover } as any}
          >
            <ArrowLeft size={14} style={{ color: c.textDim }} />
            <Text style={{ fontSize: "0.8rem", color: c.textDim }}>
              {t("admin.nav.backToHome")}
            </Text>
          </Box>
        </Box>
      </Box>

      {/* ── Main content ── */}
      <Box flex={1} display="flex" flexDirection="column" overflow="hidden" position="relative" zIndex={10}>
        {/* Top bar */}
        <Box
          px={8}
          py="14px"
          flexShrink={0}
          style={{
            background:          c.topbar,
            backdropFilter:      "blur(10px)",
            WebkitBackdropFilter:"blur(10px)",
            borderBottom:        `1px solid ${c.border}`,
            transition:          "background 0.3s, border-color 0.3s",
          }}
        >
          <Flex align="center" justify="space-between">
            {/* Breadcrumb */}
            <Flex align="center" gap={2}>
              <Text style={{ fontSize: "0.7rem", color: c.textSub, letterSpacing: "0.06em" }}>
                {t("admin.topbar.breadcrumb")}
              </Text>
              <ChevronRight size={12} style={{ color: c.textSub }} />
              <Text style={{ fontSize: "0.7rem", color: c.textMuted }}>
                {current.label}
              </Text>
            </Flex>

            <Flex align="center" gap={3}>
              {/* Live badge */}
              <Flex
                align="center"
                gap="6px"
                borderRadius="full"
                px={3}
                py="5px"
                style={{
                  background: "rgba(74,222,128,0.08)",
                  border:     "1px solid rgba(74,222,128,0.2)",
                }}
              >
                <Box
                  w="6px"
                  h="6px"
                  borderRadius="full"
                  style={{ background: "#4ade80", boxShadow: "0 0 6px #4ade80" }}
                />
                <Text style={{ fontSize: "0.7rem", color: "#4ade80" }}>{t("admin.topbar.live")}</Text>
              </Flex>

              {/* Language toggle */}
              <Box
                as="button"
                onClick={() => i18n.changeLanguage(isVi ? "en" : "vi")}
                border="none"
                cursor="pointer"
                borderRadius="8px"
                px={3}
                py="6px"
                transition="all 0.18s"
                style={{ background: c.chipBg, border: `1px solid ${c.chipBorder}`, display: "flex", alignItems: "center", gap: 5 }}
                _hover={{ background: c.navHover } as any}
              >
                <Globe size={13} style={{ color: c.textMuted }} />
                <Text style={{ fontSize: "0.7rem", color: c.textMuted, fontWeight: 600, userSelect: "none" }}>
                  {isVi ? "VI" : "EN"}
                </Text>
              </Box>

              {/* Theme toggle */}
              <Box
                as="button"
                onClick={toggle}
                border="none"
                cursor="pointer"
                borderRadius="8px"
                p="6px"
                transition="all 0.18s"
                style={{ background: c.chipBg, border: `1px solid ${c.chipBorder}`, display: "flex", alignItems: "center", justifyContent: "center" }}
                _hover={{ background: c.navHover } as any}
              >
                {isDark
                  ? <Sun  size={15} style={{ color: c.textMuted }} />
                  : <Moon size={15} style={{ color: c.textMuted }} />
                }
              </Box>

              {/* Avatar + account panel */}
              <Box position="relative">
                <Flex
                  ref={avatarRef as any}
                  as="button"
                  align="center"
                  gap={2}
                  borderRadius="lg"
                  px={3}
                  py="5px"
                  border="none"
                  cursor="pointer"
                  transition="all 0.2s"
                  onClick={() => setShowAccountPanel(p => !p)}
                  style={{
                    border:     `1px solid ${showAccountPanel ? "rgba(78,124,106,0.45)" : "rgba(255,255,255,0.22)"}`,
                    background: showAccountPanel ? "rgba(255,255,255,0.1)" : "transparent",
                    outline:    "none",
                  }}
                  _hover={{ background: "rgba(255,255,255,0.1)" } as any}
                >
                  <AvatarCircle
                    user={user ? { name: user.name, email: user.email, avatarUrl: user.avatarUrl ?? undefined } : null}
                    size={26}
                    fontSize="0.55rem"
                  />
                  <Text style={{ fontSize: "0.75rem", color: c.textMuted }}>
                    {user?.name ?? "Admin"}
                  </Text>
                </Flex>

                {/* Account panel dropdown */}
                <AnimatePresence>
                  {showAccountPanel && (
                    <MotionBox
                      ref={panelRef as any}
                      position="absolute"
                      top="calc(100% + 12px)"
                      right={0}
                      zIndex={200}
                      initial={{ opacity: 0, scale: 0.94, y: -8 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.94, y: -8 }}
                      transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] } as any}
                      style={{
                        background:           "rgba(12,18,22,0.92)",
                        backdropFilter:       "blur(20px)",
                        WebkitBackdropFilter: "blur(20px)",
                        border:               "1px solid rgba(255,255,255,0.12)",
                        borderRadius:         "16px",
                        padding:              "10px",
                        minWidth:             "220px",
                        boxShadow:            "0 16px 48px rgba(0,0,0,0.55)",
                        transformOrigin:      "top right",
                      }}
                    >
                      {/* User info */}
                      <Flex align="center" gap={3} px={2} py={2} mb={1}>
                        <AvatarCircle
                          user={user ? { name: user.name, email: user.email, avatarUrl: user.avatarUrl ?? undefined } : null}
                          size={42}
                        />
                        <Box overflow="hidden">
                          <Text style={{
                            color: "rgba(255,255,255,0.95)", fontSize: "0.88rem",
                            fontFamily: "'HarmonyOS Sans', sans-serif",
                            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "140px",
                          }}>
                            {user?.name ?? "Admin"}
                          </Text>
                          <Text style={{
                            color: "rgba(255,255,255,0.42)", fontSize: "0.75rem",
                            fontFamily: "'HarmonyOS Sans', sans-serif",
                            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "140px",
                          }}>
                            {user?.email ?? ""}
                          </Text>
                        </Box>
                      </Flex>

                      {/* Role badge */}
                      <Box px={2} pb={1}>
                        <Box
                          display="inline-flex"
                          borderRadius="full"
                          px="10px"
                          py="3px"
                          style={{
                            background: "rgba(78,124,106,0.15)",
                            border:     "1px solid rgba(78,124,106,0.3)",
                          }}
                        >
                          <Text style={{ fontSize: "0.65rem", color: "#4e7c6a", letterSpacing: "0.08em" }}>
                            ADMIN
                          </Text>
                        </Box>
                      </Box>

                      {/* Divider */}
                      <Box mx={2} my="6px" h="1px" style={{ background: "rgba(255,255,255,0.08)" }} />

                      {/* Logout */}
                      <Box
                        as="button"
                        onClick={handleLogout}
                        display="flex"
                        alignItems="center"
                        gap={2}
                        w="100%"
                        px="10px"
                        py="8px"
                        borderRadius="9px"
                        style={{
                          color:       "rgba(248,113,113,0.85)",
                          fontSize:    "0.83rem",
                          fontFamily:  "'HarmonyOS Sans', sans-serif",
                          cursor:      "pointer",
                          transition:  "background 0.15s, color 0.15s",
                          background:  "transparent",
                          border:      "none",
                          textAlign:   "left",
                          letterSpacing: "0.01em",
                        }}
                        _hover={{ background: "rgba(248,113,113,0.1)", color: "#f87171" } as any}
                      >
                        <LogOut size={15} style={{ flexShrink: 0 }} />
                        {t("admin.topbar.logout")}
                      </Box>
                    </MotionBox>
                  )}
                </AnimatePresence>
              </Box>
            </Flex>
          </Flex>
        </Box>

        {/* Scrollable content */}
        <Box flex={1} overflowY="auto" px={8} py={6}>
          <AnimatePresence mode="wait">
            <MotionBox
              key={activeSection}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.22, ease: "easeOut" } as any}
            >
              {activeSection === "dashboard" && <DashboardSection />}
              {activeSection === "users"     && <UsersSection />}
              {activeSection === "missions"  && <MissionsSection />}
              {activeSection === "revenue"   && <RevenueSection />}
              {activeSection === "themes"    && <ThemesSection />}
              {activeSection === "stickers"  && <StickersSection />}
              {activeSection === "sounds"    && <SoundsSection />}
            </MotionBox>
          </AnimatePresence>
        </Box>
      </Box>
    </Box>
  );
}

export function AdminPage() {
  return (
    <AdminThemeProvider>
      <AdminPageInner />
    </AdminThemeProvider>
  );
}
