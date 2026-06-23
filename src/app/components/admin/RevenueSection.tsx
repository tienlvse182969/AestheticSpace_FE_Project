import { useState, useEffect } from "react";
import { Box, Flex, Text } from "@chakra-ui/react";
import { DollarSign, Crown, Coins, Package, Calendar } from "lucide-react";
import { motion } from "motion/react";
import { useAdminTheme } from "./AdminThemeContext";
import {
  analyticsAdminService,
  type AdminRevenueSummary,
  type AdminRevenueTrend,
} from "../../../services/admin/analytics.admin.service";

const MotionBox = motion.create(Box);

const TREND_DAYS = [30, 90, 180] as const;
type TrendDay = (typeof TREND_DAYS)[number];

// ── helpers ──────────────────────────────────────────────────────────────────

function fmtVnd(n: number) {
  return n.toLocaleString("vi-VN") + " ₫";
}

function fmtShort(n: number) {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000)     return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)         return `${(n / 1_000).toFixed(0)}K`;
  return n === 0 ? "0" : n.toFixed(0);
}

function fmtDay(iso: string) {
  const d = new Date(iso);
  return `${d.getDate()}/${d.getMonth() + 1}`;
}

// ── component ─────────────────────────────────────────────────────────────────

export function RevenueSection() {
  const { c } = useAdminTheme();

  const [summary,        setSummary]        = useState<AdminRevenueSummary | null>(null);
  const [trend,          setTrend]          = useState<AdminRevenueTrend[]>([]);
  const [selectedDays,   setSelectedDays]   = useState<TrendDay>(30);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [loadingTrend,   setLoadingTrend]   = useState(true);
  const [hoveredBar,     setHoveredBar]     = useState<number | null>(null);

  // fetch summary once
  useEffect(() => {
    analyticsAdminService
      .getRevenueSummary()
      .then(setSummary)
      .catch(() => {})
      .finally(() => setLoadingSummary(false));
  }, []);

  // fetch trend whenever days changes
  useEffect(() => {
    setLoadingTrend(true);
    analyticsAdminService
      .getRevenueTrend(selectedDays)
      .then(setTrend)
      .catch(() => setTrend([]))
      .finally(() => setLoadingTrend(false));
  }, [selectedDays]);

  // ── derived values ──────────────────────────────────────────────────────────
  const CHART_H = 200; // total container height (px)
  const PLOT_H  = 175; // usable bar height (px) — leaves 25px top padding so max bar never hits top

  const maxVnd    = trend.length ? Math.max(...trend.map(t => t.amountVnd)) : 1;
  const totalVnd  = trend.reduce((s, t) => s + t.amountVnd, 0);
  const totalTx   = trend.reduce((s, t) => s + t.transactions, 0);
  const peakEntry = trend.find(t => t.amountVnd === maxVnd);
  const avgDaily  = trend.length ? totalVnd / trend.length : 0;

  // convert a VNĐ value → pixel height (same function used for bars, gridlines AND y-labels)
  const barPx = (vnd: number) => maxVnd > 0 ? (vnd / maxVnd) * PLOT_H : 0;

  // y-axis: 5 levels from max → 0
  const yLevels = [maxVnd, maxVnd * 0.75, maxVnd * 0.5, maxVnd * 0.25, 0];

  // show ~7 x-labels across however many bars exist
  const labelEvery = Math.max(1, Math.ceil(trend.length / 7));

  const dateRangeLabel =
    trend.length >= 2
      ? `${fmtDay(trend[0].date)} – ${fmtDay(trend[trend.length - 1].date)}`
      : "—";

  // ── stat cards config ───────────────────────────────────────────────────────
  const cards = [
    {
      label: "Total Revenue",
      value: summary?.totalRevenueVnd,
      sub:   `${summary?.totalTransactions ?? 0} transactions`,
      icon:  DollarSign,
      color: "#16a34a",
      bg:    "rgba(74,222,128,0.1)",
      border:"rgba(74,222,128,0.2)",
    },
    {
      label: "Subscriptions",
      value: summary?.subscriptionRevenueVnd,
      sub:   "All time",
      icon:  Crown,
      color: "#7c3aed",
      bg:    "rgba(167,139,250,0.1)",
      border:"rgba(167,139,250,0.2)",
    },
    {
      label: "Coin Packs",
      value: summary?.coinPackRevenueVnd,
      sub:   "All time",
      icon:  Coins,
      color: "#d97706",
      bg:    "rgba(251,191,36,0.1)",
      border:"rgba(251,191,36,0.2)",
    },
    {
      label: "Asset Sales",
      value: summary?.assetRevenueVnd,
      sub:   "All time",
      icon:  Package,
      color: "#0284c7",
      bg:    "rgba(56,189,248,0.1)",
      border:"rgba(56,189,248,0.2)",
    },
  ];

  // ── render ──────────────────────────────────────────────────────────────────
  return (
    <Box>
      {/* ── 4 stat cards ── */}
      <Box display="grid" mb={5} style={{ gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
        {cards.map(card => {
          const Icon = card.icon;
          return (
            <Box key={card.label} borderRadius="14px" p={5}
              style={{ background: c.cardBg, border: `1px solid ${c.cardBorder}` }}>
              <Flex align="center" justify="space-between" mb={4}>
                <Flex align="center" justify="center" w="38px" h="38px" borderRadius="10px"
                  style={{ background: card.bg, border: `1px solid ${card.border}` }}>
                  <Icon size={17} style={{ color: card.color }} />
                </Flex>
              </Flex>
              <Text style={{
                fontSize: "1.45rem", fontWeight: 600, lineHeight: 1,
                color: c.cardText,
                fontFamily: "'HarmonyOS Sans', sans-serif",
                opacity: loadingSummary ? 0.3 : 1,
                transition: "opacity 0.3s",
              }}>
                {loadingSummary ? "—" : card.value != null ? fmtVnd(card.value) : "—"}
              </Text>
              <Text mt={1} style={{ fontSize: "0.72rem", color: c.textMuted, fontFamily: "'HarmonyOS Sans', sans-serif" }}>
                {card.label}
              </Text>
              <Text mt="3px" style={{ fontSize: "0.68rem", color: card.color, fontFamily: "'HarmonyOS Sans', sans-serif" }}>
                {loadingSummary ? "—" : card.sub}
              </Text>
            </Box>
          );
        })}
      </Box>

      {/* ── Revenue Trend chart ── */}
      <Box borderRadius="14px" p={6} mb={5}
        style={{ background: c.cardBg, border: `1px solid ${c.cardBorder}` }}>

        {/* Chart header */}
        <Flex align="center" justify="space-between" mb={6}>
          <Box>
            <Text style={{ fontSize: "0.6rem", letterSpacing: "0.12em", color: c.textDim, fontFamily: "'HarmonyOS Sans', sans-serif" }}>
              REVENUE TREND
            </Text>
            <Text style={{ fontSize: "0.95rem", color: c.text, fontFamily: "'HarmonyOS Sans', sans-serif", marginTop: 2 }}>
              Daily Revenue (VNĐ)
            </Text>
          </Box>
          <Flex align="center" gap={3}>
            {/* Date range badge */}
            <Flex align="center" gap={2} borderRadius="full" px={3} py="5px"
              style={{ background: "rgba(78,124,106,0.1)", border: "1px solid rgba(78,124,106,0.2)" }}>
              <Calendar size={12} style={{ color: "#4e7c6a" }} />
              <Text style={{ fontSize: "0.7rem", color: "#4e7c6a", fontFamily: "'HarmonyOS Sans', sans-serif" }}>
                {dateRangeLabel}
              </Text>
            </Flex>
            {/* Days selector */}
            <Flex gap={1}>
              {TREND_DAYS.map(d => (
                <Box key={d} as="button" onClick={() => setSelectedDays(d)} px={3} py="4px" borderRadius="8px"
                  style={{
                    fontSize: "0.68rem",
                    fontWeight: selectedDays === d ? 600 : 400,
                    cursor: "pointer",
                    background:  selectedDays === d ? "rgba(78,124,106,0.18)" : "transparent",
                    border:      selectedDays === d ? "1px solid rgba(78,124,106,0.4)" : `1px solid ${c.cardBorder}`,
                    color:       selectedDays === d ? "#4e7c6a" : c.textDim,
                    transition:  "all 0.15s",
                  }}>
                  {d}d
                </Box>
              ))}
            </Flex>
          </Flex>
        </Flex>

        {/* Chart body */}
        {loadingTrend ? (
          <Flex h="200px" align="center" justify="center">
            <Text style={{ fontSize: "0.8rem", color: c.textDim, fontFamily: "'HarmonyOS Sans', sans-serif" }}>
              Loading…
            </Text>
          </Flex>
        ) : trend.length === 0 ? (
          <Flex h="200px" align="center" justify="center">
            <Text style={{ fontSize: "0.8rem", color: c.textDim, fontFamily: "'HarmonyOS Sans', sans-serif" }}>
              No revenue data for this period
            </Text>
          </Flex>
        ) : (
          <>
            <Flex gap={2} style={{ height: CHART_H }}>
              {/* Y-axis — absolutely positioned so labels align exactly with bars & gridlines */}
              <Box position="relative" style={{ width: 44, flexShrink: 0, height: "100%" }}>
                {yLevels.map((v, i) => (
                  <Text key={i} position="absolute" style={{
                    right: 6,
                    bottom: barPx(v),
                    transform: "translateY(50%)",
                    fontSize: "0.6rem",
                    color: c.textDim,
                    fontFamily: "'HarmonyOS Sans', sans-serif",
                    lineHeight: 1,
                    whiteSpace: "nowrap",
                  }}>
                    {fmtShort(Math.round(v))}
                  </Text>
                ))}
              </Box>

              {/* Bars area */}
              <Box flex={1} position="relative" style={{ height: "100%" }}>
                {/* Gridlines — same barPx positions as Y-axis labels */}
                {yLevels.map((v, i) => (
                  <Box key={i} position="absolute" left={0} right={0} style={{
                    bottom: barPx(v),
                    borderTop: `1px solid ${c.rowDivider}`,
                    pointerEvents: "none",
                  }} />
                ))}

                {/* Bars */}
                <Flex align="flex-end" justify="space-around" style={{ height: CHART_H, position: "relative" }}>
                  {trend.map((entry, i) => {
                    const h         = barPx(entry.amountVnd);
                    const isHov     = hoveredBar === i;
                    const showLabel = i % labelEvery === 0 || i === trend.length - 1;

                    return (
                      <Flex key={entry.date} direction="column" align="center" justify="flex-end"
                        style={{ height: "100%", flex: 1, cursor: "pointer" }}
                        onMouseEnter={() => setHoveredBar(i)}
                        onMouseLeave={() => setHoveredBar(null)}>

                        {/* Tooltip */}
                        {isHov && (
                          <Box position="absolute" borderRadius="8px" px={3} py={2}
                            style={{
                              background: c.panelBg,
                              border: `1px solid ${c.panelBorder}`,
                              boxShadow: c.panelShadow,
                              bottom: h + 12,
                              pointerEvents: "none",
                              whiteSpace: "nowrap",
                              zIndex: 10,
                            }}>
                            <Text style={{ fontSize: "0.65rem", color: c.textMuted, fontFamily: "'HarmonyOS Sans', sans-serif" }}>
                              {entry.date}
                            </Text>
                            <Text style={{ fontSize: "0.8rem", color: "#16a34a", fontFamily: "'HarmonyOS Sans', sans-serif", fontWeight: 600 }}>
                              {fmtVnd(entry.amountVnd)}
                            </Text>
                            <Text style={{ fontSize: "0.65rem", color: c.textMuted, fontFamily: "'HarmonyOS Sans', sans-serif" }}>
                              {entry.transactions} transaction{entry.transactions !== 1 ? "s" : ""}
                            </Text>
                          </Box>
                        )}

                        {/* Bar */}
                        <MotionBox borderRadius="6px 6px 3px 3px"
                          style={{
                            width: "70%",
                            background: isHov
                              ? "linear-gradient(to top, #1a3c34, #4ade80)"
                              : "linear-gradient(to top, rgba(78,124,106,0.6), rgba(78,124,106,0.25))",
                            border: isHov
                              ? "1px solid rgba(74,222,128,0.4)"
                              : "1px solid rgba(78,124,106,0.2)",
                            transition: "background 0.2s, border 0.2s",
                          }}
                          initial={{ height: 0 }}
                          animate={{ height: h }}
                          transition={{ duration: 0.45, delay: i * 0.03, ease: "easeOut" } as any}
                        />

                        {/* X label */}
                        <Text mt={2} style={{
                          fontSize: "0.58rem",
                          color: isHov ? c.text : c.textDim,
                          fontFamily: "'HarmonyOS Sans', sans-serif",
                          transition: "color 0.2s",
                          visibility: showLabel ? "visible" : "hidden",
                        }}>
                          {fmtDay(entry.date)}
                        </Text>
                      </Flex>
                    );
                  })}
                </Flex>
              </Box>
            </Flex>

            {/* Summary row */}
            <Flex gap={6} mt={5} pt={4} style={{ borderTop: `1px solid ${c.rowDivider}` }}>
              {[
                {
                  label: "PEAK DAY",
                  value: peakEntry ? `${fmtDay(peakEntry.date)} · ${fmtVnd(peakEntry.amountVnd)}` : "—",
                  color: "#16a34a",
                },
                {
                  label: "AVG DAILY",
                  value: fmtVnd(Math.round(avgDaily)),
                  color: c.textMuted,
                },
                {
                  label: "PERIOD TOTAL",
                  value: fmtVnd(totalVnd),
                  color: "#4e7c6a",
                },
                {
                  label: "TRANSACTIONS",
                  value: totalTx.toLocaleString(),
                  color: c.textMuted,
                },
              ].map(s => (
                <Box key={s.label}>
                  <Text style={{ fontSize: "0.6rem", letterSpacing: "0.08em", color: c.textDim, fontFamily: "'HarmonyOS Sans', sans-serif" }}>
                    {s.label}
                  </Text>
                  <Text style={{ fontSize: "0.9rem", color: s.color, fontFamily: "'HarmonyOS Sans', sans-serif", marginTop: 2 }}>
                    {s.value}
                  </Text>
                </Box>
              ))}
            </Flex>
          </>
        )}
      </Box>
    </Box>
  );
}
