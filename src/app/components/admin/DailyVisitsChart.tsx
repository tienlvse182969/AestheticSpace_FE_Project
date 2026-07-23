import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Box, Flex, Text } from "@chakra-ui/react";
import { TrendingUp, CalendarDays, TrendingDown } from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts";
import { useAdminTheme } from "./AdminThemeContext";
import {
  analyticsAdminService,
  type AdminDateCount,
} from "../../../services/admin/analytics.admin.service";

const DAY_OPTIONS = [7, 30, 90] as const;

function fmtDate(iso: string) {
  const d = new Date(iso);
  return `${d.getDate()}/${d.getMonth() + 1}`;
}

function fmtDateFull(iso: string) {
  return new Date(iso).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function fillMissingDays(data: AdminDateCount[], days: number): AdminDateCount[] {
  const countByDate = new Map(data.map(d => [d.date.slice(0, 10), d.count]));
  const today = new Date();
  const filled: AdminDateCount[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    filled.push({ date: key, count: countByDate.get(key) ?? 0 });
  }
  return filled;
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

export function DailyVisitsChart() {
  const { c } = useAdminTheme();
  const { t } = useTranslation();

  const [growthData,   setGrowthData]   = useState<AdminDateCount[]>([]);
  const [selectedDays, setSelectedDays] = useState<7 | 30 | 90>(30);
  const [loadingGrowth, setLoadingGrowth] = useState(true);

  useEffect(() => {
    setLoadingGrowth(true);
    analyticsAdminService.getUserGrowth(selectedDays)
      .then(setGrowthData).catch(() => setGrowthData([]))
      .finally(() => setLoadingGrowth(false));
  }, [selectedDays]);

  const filledData = fillMissingDays(growthData, selectedDays);
  const totalNew  = filledData.reduce((s, d) => s + d.count, 0);
  const maxCount  = Math.max(...filledData.map(d => d.count), 0);
  const avgPerDay = filledData.length > 0 ? totalNew / filledData.length : 0;
  const peakEntry = filledData.find(d => d.count === maxCount);
  const chartData = filledData.map(d => ({ ...d, displayDate: fmtDate(d.date) }));
  const xInterval = selectedDays === 7 ? 0 : selectedDays === 30 ? 1 : 5;
  const yAxisMax  = maxCount <= 50 ? 50 : maxCount + Math.ceil(maxCount * 0.1);

  return (
    <Box mb={6} borderRadius="14px" style={{ background: c.cardBg, border: `1px solid ${c.cardBorder}`, transition: "background 0.3s, border-color 0.3s" }}>
      <Box p={5}>
        {/* Header row */}
        <Flex align="center" justify="space-between" mb={1}>
          <Box>
            <Text style={{ fontSize: "0.85rem", color: c.cardText, fontWeight: 600 }}>{t("admin.dashboard.userGrowth")}</Text>
            {!loadingGrowth && (
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
  );
}
