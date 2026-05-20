import { useState } from "react";
import { Box, Flex, Text } from "@chakra-ui/react";
import { motion, AnimatePresence } from "motion/react";
import {
  LayoutDashboard, Users, Palette, Sparkles, AudioWaveform,
  ArrowLeft, ShieldCheck, ChevronRight, BarChart2,
} from "lucide-react";
import { useNavigate } from "react-router";
import { DashboardSection }   from "../components/admin/DashboardSection";
import { UsersSection }       from "../components/admin/UsersSection";
import { ThemesSection }      from "../components/admin/ThemesSection";
import { StickersSection }    from "../components/admin/StickersSection";
import { SoundsSection }      from "../components/admin/SoundsSection";
import { RevenueSection }     from "../components/admin/RevenueSection";

const MotionBox = motion.create(Box);

type AdminSection = "dashboard" | "users" | "themes" | "stickers" | "sounds" | "revenue";

const NAV_ITEMS: {
  key: AdminSection;
  label: string;
  icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>;
  badge?: number;
}[] = [
  { key: "dashboard",   label: "Dashboard",      icon: LayoutDashboard },
  { key: "users",       label: "Users",           icon: Users,          badge: 1247 },
  { key: "revenue",     label: "Revenue",         icon: BarChart2                   },
  { key: "themes",      label: "Themes",          icon: Palette,        badge: 6    },
  { key: "stickers",    label: "Stickers",        icon: Sparkles,       badge: 8    },
  { key: "sounds",      label: "Ambient Sounds",  icon: AudioWaveform,  badge: 8    },
];

export function AdminPage() {
  const [activeSection, setActiveSection] = useState<AdminSection>("dashboard");
  const navigate = useNavigate();

  const current = NAV_ITEMS.find(n => n.key === activeSection)!;

  return (
    <Box
      position="fixed"
      inset={0}
      display="flex"
      overflow="hidden"
      style={{ fontFamily: "'HarmonyOS Sans', sans-serif" }}
    >
      {/* Background */}
      <Box
        position="absolute"
        inset={0}
        style={{
          background: "linear-gradient(135deg, #060b0f 0%, #0b1a18 55%, #07101c 100%)",
        }}
      />
      {/* Subtle dot grid */}
      <Box
        position="absolute"
        inset={0}
        style={{
          backgroundImage: "radial-gradient(rgba(78,124,106,0.07) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
          pointerEvents: "none",
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
          background: "rgba(6,10,14,0.88)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderRight: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        {/* Logo */}
        <Box px={5} py={5} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
          <Flex align="center" gap={2} mb={1}>
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
            <Text style={{ fontFamily: "'Manrope', sans-serif", fontSize: "0.95rem", color: "rgba(255,255,255,0.88)", letterSpacing: "0.01em" }}>
              Admin Panel
            </Text>
          </Flex>
          <Text style={{ fontSize: "0.62rem", color: "rgba(255,255,255,0.18)", letterSpacing: "0.12em" }}>
            AĒSTHETIC GROUP
          </Text>
        </Box>

        {/* Nav */}
        <Box px={3} py={4} flex={1}>
          <Text
            mb={3}
            px={2}
            style={{ fontSize: "0.6rem", color: "rgba(255,255,255,0.18)", letterSpacing: "0.14em", fontFamily: "'HarmonyOS Sans', sans-serif" }}
          >
            NAVIGATION
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
                  display: "flex",
                  alignItems: "center",
                  gap: 9,
                  background: isActive ? "rgba(78,124,106,0.16)" : "transparent",
                  outline: isActive ? "1px solid rgba(78,124,106,0.3)" : "1px solid transparent",
                }}
                _hover={{
                  background: isActive ? "rgba(78,124,106,0.2)" : "rgba(255,255,255,0.04)",
                } as any}
              >
                <Icon size={15} style={{ color: isActive ? "#4e7c6a" : "rgba(255,255,255,0.3)", flexShrink: 0 }} />
                <Text
                  flex={1}
                  style={{
                    fontSize: "0.83rem",
                    color: isActive ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.42)",
                    fontFamily: "'HarmonyOS Sans', sans-serif",
                  }}
                >
                  {item.label}
                </Text>
                {item.badge !== undefined && (
                  <Box
                    borderRadius="full"
                    px="7px"
                    py="1px"
                    style={{
                      background: isActive ? "rgba(78,124,106,0.25)" : "rgba(255,255,255,0.06)",
                      flexShrink: 0,
                    }}
                  >
                    <Text style={{ fontSize: "0.6rem", color: isActive ? "#4e7c6a" : "rgba(255,255,255,0.22)", fontFamily: "'HarmonyOS Sans', sans-serif" }}>
                      {item.badge.toLocaleString()}
                    </Text>
                  </Box>
                )}
                {isActive && (
                  <Box w="4px" h="4px" borderRadius="full" flexShrink={0} style={{ background: "#4e7c6a" }} />
                )}
              </Box>
            );
          })}
        </Box>

        {/* Bottom: back to space */}
        <Box px={3} pb={5} style={{ borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: 16 }}>
          <Box
            as="button"
            w="full"
            textAlign="left"
            onClick={() => navigate("/space")}
            borderRadius="9px"
            px={3}
            py="9px"
            border="none"
            cursor="pointer"
            transition="all 0.18s"
            style={{ display: "flex", alignItems: "center", gap: 9, background: "transparent" }}
            _hover={{ background: "rgba(255,255,255,0.04)" } as any}
          >
            <ArrowLeft size={14} style={{ color: "rgba(255,255,255,0.25)" }} />
            <Text style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.28)", fontFamily: "'HarmonyOS Sans', sans-serif" }}>
              Back to Space
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
            background: "rgba(6,10,14,0.6)",
            backdropFilter: "blur(10px)",
            WebkitBackdropFilter: "blur(10px)",
            borderBottom: "1px solid rgba(255,255,255,0.05)",
          }}
        >
          <Flex align="center" justify="space-between">
            <Flex align="center" gap={2}>
              <Text style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.2)", fontFamily: "'HarmonyOS Sans', sans-serif", letterSpacing: "0.06em" }}>
                Admin
              </Text>
              <ChevronRight size={12} style={{ color: "rgba(255,255,255,0.15)" }} />
              <Text style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.5)", fontFamily: "'HarmonyOS Sans', sans-serif" }}>
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
                  border: "1px solid rgba(74,222,128,0.2)",
                }}
              >
                <Box
                  w="6px"
                  h="6px"
                  borderRadius="full"
                  style={{ background: "#4ade80", boxShadow: "0 0 6px #4ade80" }}
                />
                <Text style={{ fontSize: "0.7rem", color: "#4ade80", fontFamily: "'HarmonyOS Sans', sans-serif" }}>
                  Live
                </Text>
              </Flex>

              {/* Admin user */}
              <Flex
                align="center"
                gap={2}
                borderRadius="8px"
                px={3}
                py="5px"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.07)",
                }}
              >
                <Flex
                  align="center"
                  justify="center"
                  w="22px"
                  h="22px"
                  borderRadius="full"
                  style={{ background: "#1a3a8a" }}
                >
                  <Text style={{ fontSize: "0.55rem", color: "white", fontFamily: "'HarmonyOS Sans', sans-serif", fontWeight: 700 }}>
                    AD
                  </Text>
                </Flex>
                <Text style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.55)", fontFamily: "'HarmonyOS Sans', sans-serif" }}>
                  Admin
                </Text>
              </Flex>
            </Flex>
          </Flex>
        </Box>

        {/* Section title */}
        <Box
          px={8}
          pt={6}
          pb={4}
          flexShrink={0}
          style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
        >
          <Text style={{ fontSize: "0.62rem", color: "rgba(255,255,255,0.2)", letterSpacing: "0.14em", fontFamily: "'HarmonyOS Sans', sans-serif" }}>
            {current.label.toUpperCase()}
          </Text>
          <Text style={{ fontSize: "1.45rem", color: "rgba(255,255,255,0.88)", fontFamily: "'HarmonyOS Sans', sans-serif", marginTop: 2 }}>
            {current.label}
          </Text>
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
              {activeSection === "dashboard"   && <DashboardSection />}
              {activeSection === "users"        && <UsersSection />}
              {activeSection === "revenue"      && <RevenueSection />}
              {activeSection === "themes"       && <ThemesSection />}
              {activeSection === "stickers"     && <StickersSection />}
              {activeSection === "sounds"       && <SoundsSection />}
            </MotionBox>
          </AnimatePresence>
        </Box>
      </Box>
    </Box>
  );
}
