import { Box, Flex, Text } from "@chakra-ui/react";
import { Users, Image, Sparkles, AudioWaveform, TrendingUp, Activity, Clock, Eye } from "lucide-react";
import { useAdminTheme } from "./AdminThemeContext";

const STATS = [
  { label: "Total Users",        value: "1,247", change: "+12%", icon: Users,     color: "#38bdf8", bg: "rgba(56,189,248,0.1)",  border: "rgba(56,189,248,0.2)"  },
  { label: "Active Today",       value: "89",    change: "+5%",  icon: Activity,  color: "#4ade80", bg: "rgba(74,222,128,0.1)",  border: "rgba(74,222,128,0.2)"  },
  { label: "Sessions Created",   value: "3,841", change: "+28%", icon: TrendingUp,color: "#a78bfa", bg: "rgba(167,139,250,0.1)", border: "rgba(167,139,250,0.2)" },
  { label: "Avg. Session Time",  value: "47 min",change: "+3%",  icon: Clock,     color: "#fb923c", bg: "rgba(251,146,60,0.1)",  border: "rgba(251,146,60,0.2)"  },
];

const CONTENT_STATS = [
  { label: "Backgrounds",    value: 9, icon: Image,        color: "#a78bfa" },
  { label: "Stickers",       value: 2, icon: Sparkles,     color: "#fb923c" },
  { label: "Ambient Sounds", value: 8, icon: AudioWaveform,color: "#38bdf8" },
  { label: "Widgets",        value: 5, icon: Eye,          color: "#4ade80" },
];

const RECENT_USERS = [
  { name: "Pham Thu Ha",    email: "thuha.pham@gmail.com", plan: "pro",  joined: "2026-02-08" },
  { name: "Hoang Van Long", email: "vanlong@yahoo.com",    plan: "free", joined: "2026-03-11" },
  { name: "Ly Thi Kim",     email: "kimly@gmail.com",      plan: "free", joined: "2026-04-14" },
  { name: "Dang Quoc Hung", email: "quochung@gmail.com",   plan: "pro",  joined: "2026-01-22" },
  { name: "Nguyen Van An",  email: "van.an@gmail.com",     plan: "free", joined: "2025-12-01" },
];

function initials(name: string) {
  return name.split(" ").slice(-2).map(w => w[0]).join("").toUpperCase();
}

const AVATAR_COLORS = ["#4e7c6a", "#1a3a8a", "#a78bfa", "#fb923c", "#38bdf8"];

export function DashboardSection() {
  const { c } = useAdminTheme();

  return (
    <Box>
      {/* Stat cards */}
      <Box display="grid" mb={6} style={{ gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
        {STATS.map((stat) => {
          const Icon = stat.icon;
          return (
            <Box
              key={stat.label}
              borderRadius="14px"
              style={{ background: c.cardBg, border: `1px solid ${c.cardBorder}`, transition: "background 0.3s, border-color 0.3s" }}
            >
              <Box p={5}>
                <Flex align="center" justify="space-between" mb={4}>
                  <Flex align="center" justify="center" w="40px" h="40px" borderRadius="10px"
                    style={{ background: stat.bg, border: `1px solid ${stat.border}` }}>
                    <Icon size={18} style={{ color: stat.color }} />
                  </Flex>
                  <Box borderRadius="full" px={2} py="2px"
                    style={{ background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.2)" }}>
                    <Text style={{ fontSize: "0.68rem", color: "#4ade80" }}>{stat.change}</Text>
                  </Box>
                </Flex>
                <Text style={{ fontSize: "1.7rem", color: c.cardText, lineHeight: 1, fontWeight: 600 }}>
                  {stat.value}
                </Text>
                <Text mt={1} style={{ fontSize: "0.75rem", color: c.cardTextMuted }}>
                  {stat.label}
                </Text>
              </Box>
            </Box>
          );
        })}
      </Box>

      <Flex gap={4} align="flex-start">
        {/* Recent users */}
        <Box flex={1} borderRadius="14px" style={{ background: c.cardBg, border: `1px solid ${c.cardBorder}`, transition: "background 0.3s, border-color 0.3s" }}>
          <Box p={5}>
            <Flex align="center" justify="space-between" mb={4}>
              <Text style={{ fontSize: "0.85rem", color: c.cardText }}>Recent Users</Text>
              <Text style={{ fontSize: "0.72rem", color: "#4e7c6a", cursor: "pointer" }}>View all →</Text>
            </Flex>

            <Flex direction="column" gap={3}>
              {RECENT_USERS.map((u, i) => (
                <Flex key={u.email} align="center" gap={3} py={2}
                  style={{ borderBottom: i < RECENT_USERS.length - 1 ? `1px solid ${c.rowDivider}` : "none" }}>
                  <Flex align="center" justify="center" w="32px" h="32px" borderRadius="full" flexShrink={0}
                    style={{ background: AVATAR_COLORS[i % AVATAR_COLORS.length] }}>
                    <Text style={{ fontSize: "0.65rem", color: "white", fontWeight: 600 }}>
                      {initials(u.name)}
                    </Text>
                  </Flex>
                  <Box flex={1} minW={0}>
                    <Text style={{ fontSize: "0.82rem", color: c.cardText, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {u.name}
                    </Text>
                    <Text style={{ fontSize: "0.7rem", color: c.cardTextMuted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {u.email}
                    </Text>
                  </Box>
                  <Box borderRadius="full" px={2} py="2px" style={{
                    background: u.plan === "pro" ? "rgba(167,139,250,0.15)" : c.cardBorder,
                    border: `1px solid ${u.plan === "pro" ? "rgba(167,139,250,0.3)" : c.cardBorder}`,
                  }}>
                    <Text style={{ fontSize: "0.65rem", color: u.plan === "pro" ? "#a78bfa" : c.cardTextMuted }}>
                      {u.plan.toUpperCase()}
                    </Text>
                  </Box>
                  <Text style={{ fontSize: "0.7rem", color: c.cardTextMuted, flexShrink: 0 }}>
                    {u.joined}
                  </Text>
                </Flex>
              ))}
            </Flex>
          </Box>
        </Box>

        {/* Content overview */}
        <Box w="220px" flexShrink={0} borderRadius="14px" style={{ background: c.cardBg, border: `1px solid ${c.cardBorder}`, transition: "background 0.3s, border-color 0.3s" }}>
          <Box p={5}>
            <Text mb={4} style={{ fontSize: "0.85rem", color: c.cardText }}>Content Library</Text>
            <Flex direction="column" gap={3}>
              {CONTENT_STATS.map((stat) => {
                const Icon = stat.icon;
                return (
                  <Flex key={stat.label} align="center" justify="space-between">
                    <Flex align="center" gap={2}>
                      <Icon size={14} style={{ color: stat.color }} />
                      <Text style={{ fontSize: "0.78rem", color: c.cardTextSub }}>{stat.label}</Text>
                    </Flex>
                    <Text style={{ fontSize: "0.85rem", color: c.cardText, fontWeight: 600 }}>{stat.value}</Text>
                  </Flex>
                );
              })}
            </Flex>

            <Box mt={5} pt={4} style={{ borderTop: `1px solid ${c.rowDivider}` }}>
              <Text mb={2} style={{ fontSize: "0.68rem", color: c.cardTextMuted, letterSpacing: "0.1em" }}>
                STORAGE USED
              </Text>
              <Box borderRadius="full" h="5px" style={{ background: c.cardBorder }}>
                <Box borderRadius="full" h="5px" w="38%" style={{ background: "linear-gradient(90deg, #4e7c6a, #38bdf8)" }} />
              </Box>
              <Text mt={1} style={{ fontSize: "0.7rem", color: c.cardTextMuted }}>38% of 10 GB</Text>
            </Box>
          </Box>
        </Box>
      </Flex>
    </Box>
  );
}
