import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Box, Flex, Text } from "@chakra-ui/react";
import {
  Users, TrendingUp, Activity, Crown, Banknote,
  Flame, CheckCircle2, LayoutDashboard, CreditCard,
  CalendarDays, TrendingDown,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts";
import { useAdminTheme } from "./AdminThemeContext";
import {
  analyticsAdminService,
  type AdminOverview,
  type AdminDateCount,
  type AdminFeatureUsage,
} from "../../../services/admin/analytics.admin.service";
import { adminUsersService, type AdminUserDto } from "../../../services/admin/user.admin.services";

const AVATAR_COLORS = ["#4e7c6a", "#1a3a8a", "#a78bfa", "#fb923c", "#38bdf8"];
const DAY_OPTIONS = [7, 30, 90] as const;

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function fmtDate(iso: string) {
  const d = new Date(iso);
  return `${d.getDate()}/${d.getMonth() + 1}`;
}

function fmtDateFull(iso: string) {
  return new Date(iso).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function fmtRevenue(vnd: number): string {
  if (vnd >= 1_000_000_000) return `${(vnd / 1_000_000_000).toFixed(1).replace(/\.0$/, "")} tỷ ₫`;
  if (vnd >= 1_000_000)     return `${(vnd / 1_000_000).toFixed(1).replace(/\.0$/, "")} tr ₫`;
  return `${vnd.toLocaleString("vi-VN")} ₫`;
}

type TooltipProps = {
  active?: boolean;
  payload?: { payload: AdminDateCount & { displayDate: string } }[];
  cardBg: string;
  cardText: string;
  cardTextMuted: string;
};

function ChartTooltip({ active, payload, cardBg, cardText, cardTextMuted }: TooltipProps) {
  const { t } = useTranslation();
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <Box px={3} py="10px" borderRadius="10px"
      style={{ background: cardBg, border: "1px solid rgba(78,124,106,0.45)", boxShadow: "0 8px 24px rgba(0,0,0,0.35)" }}>
      <Text style={{ fontSize: "0.68rem", color: "rgba(78,124,106,0.85)", marginBottom: 4, letterSpacing: "0.04em" }}>
        {fmtDateFull(d.date)}
      </Text>
      <Flex align="center" gap="6px">
        <Box w="8px" h="8px" borderRadius="full" style={{ background: "#4e7c6a", flexShrink: 0 }} />
        <Text style={{ fontSize: "0.92rem", color: cardText, fontWeight: 700 }}>{d.count}</Text>
        <Text style={{ fontSize: "0.72rem", color: cardTextMuted }}>{t("admin.dashboard.newUsers")}</Text>
      </Flex>
    </Box>
  );
}

export function DashboardSection() {
  const { c } = useAdminTheme();
  const { t } = useTranslation();

  const [overview,      setOverview]      = useState<AdminOverview | null>(null);
  const [featureUsage,  setFeatureUsage]  = useState<AdminFeatureUsage | null>(null);
  const [growthData,    setGrowthData]    = useState<AdminDateCount[]>([]);
  const [recentUsers,   setRecentUsers]   = useState<AdminUserDto[]>([]);
  const [selectedDays,  setSelectedDays]  = useState<7 | 30 | 90>(30);
  const [loadingOverview, setLoadingOverview] = useState(true);
  const [loadingFeature,  setLoadingFeature]  = useState(true);
  const [loadingGrowth,   setLoadingGrowth]   = useState(true);
  const [loadingUsers,    setLoadingUsers]    = useState(true);

  useEffect(() => {
    analyticsAdminService.getOverview()
      .then(setOverview).catch(() => {}).finally(() => setLoadingOverview(false));
    analyticsAdminService.getFeatureUsage()
      .then(setFeatureUsage).catch(() => {}).finally(() => setLoadingFeature(false));
    adminUsersService.getUsers(1, 5)
      .then(r => setRecentUsers(r.items)).catch(() => {}).finally(() => setLoadingUsers(false));
  }, []);

  useEffect(() => {
    setLoadingGrowth(true);
    analyticsAdminService.getUserGrowth(selectedDays)
      .then(setGrowthData).catch(() => setGrowthData([]))
      .finally(() => setLoadingGrowth(false));
  }, [selectedDays]);

  // ── Derived chart stats ──
  const totalNew  = growthData.reduce((s, d) => s + d.count, 0);
  const maxCount  = Math.max(...growthData.map(d => d.count), 0);
  const avgPerDay = growthData.length > 0 ? totalNew / growthData.length : 0;
  const peakEntry = growthData.find(d => d.count === maxCount);
  const chartData  = growthData.map(d => ({ ...d, displayDate: fmtDate(d.date) }));
  const xInterval  = selectedDays === 7 ? 0 : selectedDays === 30 ? 1 : 5;
  const yAxisMax   = maxCount <= 50 ? 50 : maxCount + Math.ceil(maxCount * 0.1);

  // ── Stat cards (5) ──
  const stats = [
    { label: t("admin.dashboard.totalUsers"),    icon: Users,     color: "#38bdf8", bg: "rgba(56,189,248,0.1)",  border: "rgba(56,189,248,0.2)",  value: overview?.totalUsers },
    { label: t("admin.dashboard.activeToday"),   icon: Activity,  color: "#4ade80", bg: "rgba(74,222,128,0.1)",  border: "rgba(74,222,128,0.2)",  value: overview?.activeUsersToday },
    { label: t("admin.dashboard.newThisMonth"),  icon: TrendingUp,color: "#a78bfa", bg: "rgba(167,139,250,0.1)", border: "rgba(167,139,250,0.2)", value: overview?.newUsersThisMonth },
    { label: t("admin.dashboard.premiumUsers"),  icon: Crown,     color: "#fbbf24", bg: "rgba(251,191,36,0.1)",  border: "rgba(251,191,36,0.2)",  value: overview?.totalPremiumUsers },
    { label: t("admin.dashboard.totalRevenue"),  icon: Banknote,  color: "#34d399", bg: "rgba(52,211,153,0.1)",  border: "rgba(52,211,153,0.2)",  value: overview?.totalRevenueVnd, isRevenue: true },
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
          const loading = loadingOverview;
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

      {/* ── User Growth chart ── */}
      <Box mb={6} borderRadius="14px" style={{ background: c.cardBg, border: `1px solid ${c.cardBorder}`, transition: "background 0.3s, border-color 0.3s" }}>
        <Box p={5}>
          {/* Header row */}
          <Flex align="center" justify="space-between" mb={1}>
            <Box>
              <Text style={{ fontSize: "0.85rem", color: c.cardText, fontWeight: 600 }}>{t("admin.dashboard.userGrowth")}</Text>
              {!loadingGrowth && growthData.length > 0 && (
                <Text style={{ fontSize: "0.7rem", color: c.cardTextMuted, marginTop: 1 }}>
                  {t("admin.dashboard.growthSub", { days: selectedDays, count: totalNew })}
                </Text>
              )}
            </Box>
            <Flex gap={1}>
              {DAY_OPTIONS.map(d => (
                <Box key={d} as="button" onClick={() => setSelectedDays(d)}
                  px={3} py="4px" borderRadius="8px"
                  style={{
                    fontSize: "0.68rem", fontWeight: selectedDays === d ? 600 : 400, cursor: "pointer",
                    background: selectedDays === d ? "rgba(78,124,106,0.18)" : "transparent",
                    border: selectedDays === d ? "1px solid rgba(78,124,106,0.4)" : `1px solid ${c.cardBorder}`,
                    color: selectedDays === d ? "#4e7c6a" : c.cardTextMuted, transition: "all 0.15s",
                  }}>
                  {d}d
                </Box>
              ))}
            </Flex>
          </Flex>

          {/* Chart */}
          {loadingGrowth ? (
            <Flex h="200px" align="center" justify="center">
              <Text style={{ fontSize: "0.8rem", color: c.cardTextMuted }}>{t("admin.dashboard.loading")}</Text>
            </Flex>
          ) : chartData.length === 0 ? (
            <Flex h="200px" align="center" justify="center">
              <Text style={{ fontSize: "0.8rem", color: c.cardTextMuted }}>{t("admin.dashboard.noData")}</Text>
            </Flex>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={chartData} margin={{ top: 10, right: 24, left: -18, bottom: 0 }}>
                  <defs>
                    <linearGradient id="growthGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#4e7c6a" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#4e7c6a" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={c.cardBorder} vertical={false} />
                  <XAxis dataKey="displayDate" interval={xInterval}
                    tick={{ fontSize: 10, fill: c.cardTextMuted }} axisLine={false} tickLine={false} dy={6} />
                  <YAxis allowDecimals={false} domain={[0, yAxisMax]}
                    tick={{ fontSize: 10, fill: c.cardTextMuted }} axisLine={false} tickLine={false} />
                  <Tooltip
                    content={<ChartTooltip cardBg={c.cardBg} cardText={c.cardText} cardTextMuted={c.cardTextMuted} />}
                    cursor={{ stroke: "rgba(78,124,106,0.25)", strokeWidth: 1 }}
                  />
                  <Area type="monotone" dataKey="count" stroke="#4e7c6a" strokeWidth={2}
                    fill="url(#growthGradient)"
                    dot={{ r: 2.5, fill: "#4e7c6a", strokeWidth: 0 }}
                    activeDot={{ r: 5, fill: "#4e7c6a", stroke: "rgba(78,124,106,0.3)", strokeWidth: 4 }}
                  />
                </AreaChart>
              </ResponsiveContainer>

              {/* Summary stats row */}
              <Flex mt={3} pt={3} gap={6} style={{ borderTop: `1px solid ${c.cardBorder}` }}>
                <Box>
                  <Text style={{ fontSize: "0.65rem", color: c.cardTextMuted, letterSpacing: "0.08em" }}>{t("admin.dashboard.statTotalNew")}</Text>
                  <Text style={{ fontSize: "1rem", color: c.cardText, fontWeight: 700, marginTop: 2 }}>{totalNew.toLocaleString()}</Text>
                </Box>
                <Box>
                  <Text style={{ fontSize: "0.65rem", color: c.cardTextMuted, letterSpacing: "0.08em" }}>{t("admin.dashboard.statPeak")}</Text>
                  <Flex align="center" gap="5px" mt="2px">
                    <TrendingUp size={12} color="#4ade80" />
                    <Text style={{ fontSize: "1rem", color: "#4ade80", fontWeight: 700 }}>{maxCount}</Text>
                    {peakEntry && (
                      <Flex align="center" gap="3px">
                        <CalendarDays size={10} style={{ color: c.cardTextMuted }} />
                        <Text style={{ fontSize: "0.68rem", color: c.cardTextMuted }}>{fmtDate(peakEntry.date)}</Text>
                      </Flex>
                    )}
                  </Flex>
                </Box>
                <Box>
                  <Text style={{ fontSize: "0.65rem", color: c.cardTextMuted, letterSpacing: "0.08em" }}>{t("admin.dashboard.statAvgDay")}</Text>
                  <Flex align="center" gap="5px" mt="2px">
                    <TrendingDown size={12} color="#a78bfa" />
                    <Text style={{ fontSize: "1rem", color: "#a78bfa", fontWeight: 700 }}>{avgPerDay.toFixed(1)}</Text>
                  </Flex>
                </Box>
              </Flex>
            </>
          )}
        </Box>
      </Box>

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
