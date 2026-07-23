import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Box, Flex, Text } from "@chakra-ui/react";
import {
  Users, TrendingUp, Activity, Crown, Banknote,
  Flame, CheckCircle2, LayoutDashboard, CreditCard,
} from "lucide-react";
import { useAdminTheme } from "./AdminThemeContext";
import {
  analyticsAdminService,
  type AdminOverview,
  type AdminFeatureUsage,
  type AdminRevenueSummary,
} from "../../../services/admin/analytics.admin.service";
import { adminUsersService, isDeletedAccount, type AdminUserDto } from "../../../services/admin/user.admin.services";
import { DailyVisitsChart } from "./DailyVisitsChart";

const AVATAR_COLORS = ["#4e7c6a", "#1a3a8a", "#a78bfa", "#fb923c", "#38bdf8"];

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function fmtRevenue(vnd: number): string {
  if (vnd >= 1_000_000_000) return `${(vnd / 1_000_000_000).toFixed(1).replace(/\.0$/, "")} tỷ ₫`;
  if (vnd >= 1_000_000)     return `${(vnd / 1_000_000).toFixed(1).replace(/\.0$/, "")} tr ₫`;
  return `${vnd.toLocaleString("vi-VN")} ₫`;
}

export function DashboardSection() {
  const { c } = useAdminTheme();
  const { t } = useTranslation();

  const [overview,        setOverview]        = useState<AdminOverview | null>(null);
  const [featureUsage,    setFeatureUsage]    = useState<AdminFeatureUsage | null>(null);
  const [revenueSummary,  setRevenueSummary]  = useState<AdminRevenueSummary | null>(null);
  const [recentUsers,     setRecentUsers]     = useState<AdminUserDto[]>([]);
  const [totalUsers,      setTotalUsers]      = useState<number | null>(null);
  const [loadingOverview, setLoadingOverview] = useState(true);
  const [loadingFeature,  setLoadingFeature]  = useState(true);
  const [loadingRevenue,  setLoadingRevenue]  = useState(true);
  const [loadingUsers,    setLoadingUsers]    = useState(true);
  const [loadingTotalUsers, setLoadingTotalUsers] = useState(true);

  useEffect(() => {
    analyticsAdminService.getOverview()
      .then(setOverview).catch(() => {}).finally(() => setLoadingOverview(false));
    analyticsAdminService.getFeatureUsage()
      .then(setFeatureUsage).catch(() => {}).finally(() => setLoadingFeature(false));
    analyticsAdminService.getRevenueSummary()
      .then(setRevenueSummary).catch(() => {}).finally(() => setLoadingRevenue(false));
    adminUsersService.getUsers(1, 5)
      .then(r => setRecentUsers(r.items)).catch(() => {}).finally(() => setLoadingUsers(false));
    adminUsersService.getAllUsers()
      .then(items => setTotalUsers(items.filter(u => !isDeletedAccount(u)).length))
      .catch(() => {}).finally(() => setLoadingTotalUsers(false));
  }, []);

  // ── Stat cards (5) ──
  const stats = [
    { label: t("admin.dashboard.totalUsers"),   icon: Users,      color: "#38bdf8", bg: "rgba(56,189,248,0.1)",  border: "rgba(56,189,248,0.2)",  value: totalUsers ?? undefined,      loading: loadingTotalUsers },
    { label: t("admin.dashboard.activeToday"),  icon: Activity,   color: "#4ade80", bg: "rgba(74,222,128,0.1)",  border: "rgba(74,222,128,0.2)",  value: overview?.activeUsersToday,   loading: loadingOverview },
    { label: t("admin.dashboard.newThisMonth"), icon: TrendingUp, color: "#a78bfa", bg: "rgba(167,139,250,0.1)", border: "rgba(167,139,250,0.2)", value: overview?.newUsersThisMonth,  loading: loadingOverview },
    { label: t("admin.dashboard.premiumUsers"), icon: Crown,      color: "#fbbf24", bg: "rgba(251,191,36,0.1)",  border: "rgba(251,191,36,0.2)",  value: overview?.totalPremiumUsers,  loading: loadingOverview },
    { label: t("admin.dashboard.totalRevenue"), icon: Banknote,   color: "#34d399", bg: "rgba(52,211,153,0.1)",  border: "rgba(52,211,153,0.2)",  value: revenueSummary?.totalRevenueVnd, isRevenue: true, loading: loadingRevenue },
  ];

  const featureStats = [
    { label: t("admin.dashboard.pomodoroSessions"), icon: Flame,          color: "#fb923c", value: featureUsage?.pomodoroSessions ?? 0 },
    { label: t("admin.dashboard.todosCompleted"),   icon: CheckCircle2,   color: "#4ade80", value: featureUsage?.todosCompleted   ?? 0 },
    { label: t("admin.dashboard.roomsVisited"),      icon: LayoutDashboard,color: "#38bdf8", value: featureUsage?.roomsVisited      ?? 0 },
    { label: t("admin.dashboard.payments"),          icon: CreditCard,     color: "#a78bfa", value: featureUsage?.paymentsSucceeded ?? 0 },
  ];

  return (
    <Box>
      {/* ── 5 stat cards ── */}
      <Box display="grid" mb={6} style={{ gridTemplateColumns: "repeat(5, 1fr)", gap: 14 }}>
        {stats.map((stat) => {
          const Icon  = stat.icon;
          const loading = stat.loading;
          const displayVal = loading
            ? "—"
            : stat.value == null
            ? "—"
            : (stat as { isRevenue?: boolean }).isRevenue
            ? fmtRevenue(stat.value)
            : stat.value.toLocaleString();

          return (
            <Box key={stat.label} borderRadius="14px"
              style={{ background: c.cardBg, border: `1px solid ${c.cardBorder}`, transition: "background 0.3s, border-color 0.3s" }}>
              <Box p={4}>
                <Flex align="center" justify="space-between" mb={3}>
                  <Flex align="center" justify="center" w="36px" h="36px" borderRadius="9px"
                    style={{ background: stat.bg, border: `1px solid ${stat.border}` }}>
                    <Icon size={16} style={{ color: stat.color }} />
                  </Flex>
                </Flex>
                <Text style={{ fontSize: "1.5rem", color: c.cardText, lineHeight: 1, fontWeight: 700, opacity: loading ? 0.3 : 1, transition: "opacity 0.3s" }}>
                  {displayVal}
                </Text>
                <Text mt="4px" style={{ fontSize: "0.7rem", color: c.cardTextMuted }}>{stat.label}</Text>
              </Box>
            </Box>
          );
        })}
      </Box>

      {/* ── Daily visits chart ── */}
      <DailyVisitsChart />

      {/* ── Bottom row ── */}
      <Flex gap={4} align="flex-start">
        {/* Recent users — real API */}
        <Box flex={1} borderRadius="14px"
          style={{ background: c.cardBg, border: `1px solid ${c.cardBorder}`, transition: "background 0.3s, border-color 0.3s" }}>
          <Box p={5}>
            <Flex align="center" justify="space-between" mb={4}>
              <Text style={{ fontSize: "0.85rem", color: c.cardText, fontWeight: 600 }}>{t("admin.dashboard.recentUsers")}</Text>
              <Text style={{ fontSize: "0.72rem", color: "#4e7c6a", cursor: "pointer" }}>{t("admin.dashboard.viewAll")}</Text>
            </Flex>

            {loadingUsers ? (
              <Flex h="120px" align="center" justify="center">
                <Text style={{ fontSize: "0.8rem", color: c.cardTextMuted }}>{t("admin.dashboard.loading")}</Text>
              </Flex>
            ) : recentUsers.length === 0 ? (
              <Flex h="80px" align="center" justify="center">
                <Text style={{ fontSize: "0.8rem", color: c.cardTextMuted }}>{t("admin.dashboard.noUsers")}</Text>
              </Flex>
            ) : (
              <Flex direction="column" gap={3}>
                {recentUsers.map((u, i) => {
                  const isPremium = u.accountTier === "Premium";
                  return (
                    <Flex key={u.id} align="center" gap={3} py={2}
                      style={{ borderBottom: i < recentUsers.length - 1 ? `1px solid ${c.rowDivider}` : "none" }}>
                      <Flex align="center" justify="center" w="32px" h="32px" borderRadius="full" flexShrink={0}
                        style={{ background: AVATAR_COLORS[i % AVATAR_COLORS.length] }}>
                        <Text style={{ fontSize: "0.65rem", color: "white", fontWeight: 600 }}>
                          {initials(u.username ?? "?")}
                        </Text>
                      </Flex>
                      <Box flex={1} minW={0}>
                        <Text style={{ fontSize: "0.82rem", color: c.cardText, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {u.username ?? "—"}
                        </Text>
                        <Text style={{ fontSize: "0.7rem", color: c.cardTextMuted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {u.email ?? "—"}
                        </Text>
                      </Box>
                      <Box borderRadius="full" px={2} py="2px" style={{
                        background: isPremium ? "rgba(167,139,250,0.15)" : c.cardBorder,
                        border: `1px solid ${isPremium ? "rgba(167,139,250,0.3)" : c.cardBorder}`,
                      }}>
                        <Text style={{ fontSize: "0.65rem", color: isPremium ? "#a78bfa" : c.cardTextMuted }}>
                          {isPremium ? t("admin.users.planPremium") : t("admin.users.planFree")}
                        </Text>
                      </Box>
                      <Text style={{ fontSize: "0.7rem", color: c.cardTextMuted, flexShrink: 0 }}>
                        {u.createdAt.split("T")[0]}
                      </Text>
                    </Flex>
                  );
                })}
              </Flex>
            )}
          </Box>
        </Box>

        {/* Feature usage */}
        <Box w="220px" flexShrink={0} borderRadius="14px"
          style={{ background: c.cardBg, border: `1px solid ${c.cardBorder}`, transition: "background 0.3s, border-color 0.3s" }}>
          <Box p={5}>
            <Text mb={4} style={{ fontSize: "0.85rem", color: c.cardText, fontWeight: 600 }}>{t("admin.dashboard.featureUsage")}</Text>
            <Flex direction="column" gap={3}>
              {featureStats.map((stat) => {
                const Icon = stat.icon;
                return (
                  <Flex key={stat.label} align="center" justify="space-between">
                    <Flex align="center" gap={2}>
                      <Icon size={14} style={{ color: stat.color }} />
                      <Text style={{ fontSize: "0.78rem", color: c.cardTextSub }}>{stat.label}</Text>
                    </Flex>
                    <Text style={{
                      fontSize: "0.85rem", color: c.cardText, fontWeight: 600,
                      opacity: loadingFeature ? 0.3 : 1, transition: "opacity 0.3s",
                    }}>
                      {loadingFeature ? "—" : stat.value.toLocaleString()}
                    </Text>
                  </Flex>
                );
              })}
            </Flex>
          </Box>
        </Box>
      </Flex>
    </Box>
  );
}
