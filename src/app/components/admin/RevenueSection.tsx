import { useState, useEffect, useCallback } from "react";
import { Box, Flex, Text, Input, Spinner } from "@chakra-ui/react";
import { DollarSign, Crown, Coins, Calendar, Search, ChevronLeft, ChevronRight, RefreshCw, FileSpreadsheet, ChevronDown } from "lucide-react";
import {
  BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts";
import { useAdminTheme } from "./AdminThemeContext";
import {
  analyticsAdminService,
  type AdminRevenueSummary,
  type AdminRevenueTrend,
} from "../../../services/admin/analytics.admin.service";
import {
  adminPaymentsService,
  type AdminPaymentTransactionDto,
  type PaymentProvider,
  type PaymentStatus,
  type PaymentPurpose,
} from "../../../services/admin/payment.admin.service";
import { downloadXlsx } from "../../../utils/exportXlsx";

const TREND_DAYS = [30, 90, 180] as const;
type TrendDay = (typeof TREND_DAYS)[number];

const PAYMENTS_PAGE_SIZE = 15;

const PROVIDER_OPTIONS: (PaymentProvider | "")[] = ["", "VNPay", "SePay", "PayOS"];
const STATUS_OPTIONS: (PaymentStatus | "")[] = ["", "Pending", "Succeeded", "Failed", "Cancelled"];
const PURPOSE_OPTIONS: (PaymentPurpose | "")[] = ["", "Subscription", "BuyCoins", "BuyAsset"];

const PURPOSE_LABEL: Record<PaymentPurpose, string> = {
  Subscription: "Subscription",
  BuyCoins: "Coin Pack",
  BuyAsset: "Asset",
};

const PAYMENT_STATUS_STYLE: Record<PaymentStatus, { color: string; bg: string; border: string }> = {
  Succeeded: { color: "#4ade80", bg: "rgba(74,222,128,0.1)",  border: "rgba(74,222,128,0.25)" },
  Pending:   { color: "#facc15", bg: "rgba(250,204,21,0.1)",  border: "rgba(250,204,21,0.25)" },
  Failed:    { color: "#f87171", bg: "rgba(248,113,113,0.1)", border: "rgba(248,113,113,0.25)" },
  Cancelled: { color: "#94a3b8", bg: "rgba(148,163,184,0.1)", border: "rgba(148,163,184,0.2)" },
};

function fmtDateTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

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

// backend only returns days that had at least one transaction — fill the rest with 0 so the trend covers the full selected range
function fillMissingTrend(data: AdminRevenueTrend[], days: number): AdminRevenueTrend[] {
  const byDate = new Map(data.map(t => [t.date.slice(0, 10), t]));
  const today = new Date();
  const filled: AdminRevenueTrend[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    filled.push(byDate.get(key) ?? { date: key, amountVnd: 0, transactions: 0 });
  }
  return filled;
}

type TrendTooltipProps = {
  active?: boolean;
  payload?: { payload: AdminRevenueTrend & { displayDate: string } }[];
  panelBg: string;
  panelBorder: string;
  panelShadow: string;
  textMuted: string;
};

function TrendTooltip({ active, payload, panelBg, panelBorder, panelShadow, textMuted }: TrendTooltipProps) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <Box borderRadius="8px" px={3} py={2}
      style={{ background: panelBg, border: `1px solid ${panelBorder}`, boxShadow: panelShadow, whiteSpace: "nowrap" }}>
      <Text style={{ fontSize: "0.65rem", color: textMuted, fontFamily: "'HarmonyOS Sans', sans-serif" }}>
        {d.date}
      </Text>
      <Text style={{ fontSize: "0.8rem", color: "#16a34a", fontFamily: "'HarmonyOS Sans', sans-serif", fontWeight: 600 }}>
        {fmtVnd(d.amountVnd)}
      </Text>
      <Text style={{ fontSize: "0.65rem", color: textMuted, fontFamily: "'HarmonyOS Sans', sans-serif" }}>
        {d.transactions} transaction{d.transactions !== 1 ? "s" : ""}
      </Text>
    </Box>
  );
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

  const [subscriptionTxCount, setSubscriptionTxCount] = useState(0);
  const [coinPackTxCount,     setCoinPackTxCount]     = useState(0);

  const [payments,          setPayments]          = useState<AdminPaymentTransactionDto[]>([]);
  const [paymentsLoading,   setPaymentsLoading]   = useState(true);
  const [paymentsError,     setPaymentsError]     = useState<string | null>(null);
  const [paymentsPage,      setPaymentsPage]      = useState(1);
  const [paymentsTotalPages,setPaymentsTotalPages] = useState(1);
  const [paymentsTotalCount,setPaymentsTotalCount] = useState(0);
  const [paymentsHasNext,   setPaymentsHasNext]   = useState(false);
  const [paymentsHasPrev,   setPaymentsHasPrev]   = useState(false);
  const [searchInput,       setSearchInput]       = useState("");
  const [search,            setSearch]            = useState("");
  const [providerFilter,    setProviderFilter]    = useState<PaymentProvider | "">("");
  const [statusFilter,      setStatusFilter]      = useState<PaymentStatus | "">("Succeeded");
  const [purposeFilter,     setPurposeFilter]     = useState<PaymentPurpose | "">("");
  const [exportMenuOpen,    setExportMenuOpen]    = useState(false);
  const [exporting,         setExporting]         = useState(false);

  // close export menu when clicking outside
  useEffect(() => {
    if (!exportMenuOpen) return;
    const handler = () => setExportMenuOpen(false);
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [exportMenuOpen]);

  const handleExport = async (days: TrendDay) => {
    setExportMenuOpen(false);
    setExporting(true);
    try {
      const trendData = await analyticsAdminService.getRevenueTrend(days);
      const filledTrendData = fillMissingTrend(trendData, days);
      const allPayments = await adminPaymentsService.getAllPayments({
        search:   search || undefined,
        provider: providerFilter || undefined,
        status:   statusFilter || undefined,
        purpose:  purposeFilter || undefined,
      });

      await downloadXlsx(`admin-revenue-${days}d-${new Date().toISOString().slice(0, 10)}.xlsx`, [
        {
          name: "Revenue Trend",
          headers: ["Date", "Revenue (VND)", "Transactions"],
          rows: filledTrendData.map(t => [t.date, t.amountVnd, t.transactions]),
        },
        {
          name: "Transaction History",
          headers: ["User", "Email", "Provider", "Purpose", "Amount (VND)", "Status", "Date"],
          rows: allPayments.map(p => [
            p.username ?? "",
            p.email ?? "",
            p.provider,
            PURPOSE_LABEL[p.purpose],
            p.amount,
            p.status,
            fmtDateTime(p.createdAt),
          ]),
        },
      ]);
    } catch {
      // no-op: export failure is non-critical, user can retry
    } finally {
      setExporting(false);
    }
  };

  // fetch summary once
  useEffect(() => {
    analyticsAdminService
      .getRevenueSummary()
      .then(setSummary)
      .catch(() => {})
      .finally(() => setLoadingSummary(false));
  }, []);

  // fetch per-purpose transaction counts (succeeded only, matches revenue figures)
  useEffect(() => {
    adminPaymentsService
      .getPayments({ purpose: "Subscription", status: "Succeeded", page: 1, pageSize: 1 })
      .then(r => setSubscriptionTxCount(r.totalCount))
      .catch(() => {});
    adminPaymentsService
      .getPayments({ purpose: "BuyCoins", status: "Succeeded", page: 1, pageSize: 1 })
      .then(r => setCoinPackTxCount(r.totalCount))
      .catch(() => {});
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

  // debounce the free-text search box
  useEffect(() => {
    const id = setTimeout(() => setSearch(searchInput.trim()), 400);
    return () => clearTimeout(id);
  }, [searchInput]);

  // any filter change resets pagination back to page 1
  useEffect(() => { setPaymentsPage(1); }, [search, providerFilter, statusFilter, purposeFilter]);

  const fetchPayments = useCallback(() => {
    setPaymentsLoading(true);
    setPaymentsError(null);
    adminPaymentsService
      .getPayments({
        search:   search || undefined,
        provider: providerFilter || undefined,
        status:   statusFilter || undefined,
        purpose:  purposeFilter || undefined,
        page:     paymentsPage,
        pageSize: PAYMENTS_PAGE_SIZE,
      })
      .then(result => {
        setPayments(result.items);
        setPaymentsTotalPages(result.totalPages);
        setPaymentsTotalCount(result.totalCount);
        setPaymentsHasNext(result.hasNext);
        setPaymentsHasPrev(result.hasPrevious);
      })
      .catch(() => setPaymentsError("Failed to load transaction history."))
      .finally(() => setPaymentsLoading(false));
  }, [search, providerFilter, statusFilter, purposeFilter, paymentsPage]);

  useEffect(() => { fetchPayments(); }, [fetchPayments]);

  // ── derived values ──────────────────────────────────────────────────────────
  const CHART_H = 320; // container height (px)

  const filledTrend = fillMissingTrend(trend, selectedDays);

  const maxVnd    = filledTrend.length ? Math.max(...filledTrend.map(t => t.amountVnd)) : 0;
  const totalVnd  = filledTrend.reduce((s, t) => s + t.amountVnd, 0);
  const totalTx   = filledTrend.reduce((s, t) => s + t.transactions, 0);
  const peakEntry = filledTrend.find(t => t.amountVnd === maxVnd);
  const avgDaily  = filledTrend.length ? totalVnd / filledTrend.length : 0;

  const chartData = filledTrend.map(t => ({ ...t, displayDate: fmtDay(t.date) }));

  // 6 evenly spaced Y-axis ticks from 0 up to the highest bar's value
  const yTicks = Array.from({ length: 6 }, (_, i) => Math.round((maxVnd * i) / 5));

  // show ~7 x-labels across however many bars exist
  const xInterval = Math.max(0, Math.ceil(filledTrend.length / 7) - 1);

  const dateRangeLabel =
    filledTrend.length >= 2
      ? `${fmtDay(filledTrend[0].date)} – ${fmtDay(filledTrend[filledTrend.length - 1].date)}`
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
      sub:   `${subscriptionTxCount} transactions`,
      icon:  Crown,
      color: "#7c3aed",
      bg:    "rgba(167,139,250,0.1)",
      border:"rgba(167,139,250,0.2)",
    },
    {
      label: "Coin Packs",
      value: summary?.coinPackRevenueVnd,
      sub:   `${coinPackTxCount} transactions`,
      icon:  Coins,
      color: "#d97706",
      bg:    "rgba(251,191,36,0.1)",
      border:"rgba(251,191,36,0.2)",
    },
  ];

  // ── render ──────────────────────────────────────────────────────────────────
  return (
    <Box>
      {/* ── 4 stat cards ── */}
      <Box display="grid" mb={5} style={{ gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
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

            {/* Export to Excel */}
            <Box position="relative" flexShrink={0}>
              <Box
                as="button"
                onClick={(e: React.MouseEvent) => { e.stopPropagation(); setExportMenuOpen(v => !v); }}
                display="flex" alignItems="center" gap={2}
                h="30px" px={3} borderRadius="8px" border="none" cursor={exporting ? "not-allowed" : "pointer"} transition="all 0.18s"
                style={{
                  background: exportMenuOpen ? c.navActive : "transparent",
                  border: `1px solid ${c.cardBorder}`,
                  color: c.textDim,
                  opacity: exporting ? 0.6 : 1,
                }}
                _hover={{ background: c.navActive } as any}
              >
                {exporting ? <Spinner size="xs" /> : <FileSpreadsheet size={13} />}
                <Text style={{ fontSize: "0.68rem", whiteSpace: "nowrap", fontFamily: "'HarmonyOS Sans', sans-serif" }}>Export Excel</Text>
                <ChevronDown size={12} />
              </Box>

              {exportMenuOpen && (
                <Box
                  position="absolute" right={0} top="36px" zIndex={50}
                  borderRadius="10px" overflow="hidden"
                  style={{
                    background:    "rgba(15,22,30,0.96)",
                    backdropFilter:"blur(16px)",
                    border:        "1px solid rgba(255,255,255,0.1)",
                    boxShadow:     "0 12px 40px rgba(0,0,0,0.6)",
                    minWidth:      170,
                  }}
                  onMouseDown={(e: React.MouseEvent) => e.stopPropagation()}
                >
                  {TREND_DAYS.map(d => (
                    <Box
                      key={d}
                      as="button"
                      w="full" textAlign="left"
                      onClick={() => handleExport(d)}
                      display="flex" alignItems="center" gap={2}
                      px={4} py="10px" border="none" cursor="pointer" transition="background 0.15s"
                      style={{ background: "transparent", color: c.cardText }}
                      _hover={{ background: "rgba(255,255,255,0.05)" } as any}
                    >
                      <Text style={{ fontSize: "0.8rem" }}>Last {d} days</Text>
                    </Box>
                  ))}
                </Box>
              )}
            </Box>
          </Flex>
        </Flex>

        {/* Chart body */}
        {loadingTrend ? (
          <Flex h={`${CHART_H}px`} align="center" justify="center">
            <Text style={{ fontSize: "0.8rem", color: c.textDim, fontFamily: "'HarmonyOS Sans', sans-serif" }}>
              Loading…
            </Text>
          </Flex>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={CHART_H}>
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                onMouseLeave={() => setHoveredBar(null)}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor="rgba(78,124,106,0.9)" />
                    <stop offset="100%" stopColor="rgba(78,124,106,0.35)" />
                  </linearGradient>
                  <linearGradient id="revenueGradientActive" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor="#4ade80" />
                    <stop offset="100%" stopColor="#1a3c34" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={c.rowDivider} vertical={false} />
                <XAxis dataKey="displayDate" interval={xInterval}
                  tick={{ fontSize: 10, fill: c.textDim, fontFamily: "'HarmonyOS Sans', sans-serif" }}
                  axisLine={false} tickLine={false} dy={6} />
                <YAxis allowDecimals={false} domain={[0, maxVnd]} ticks={yTicks}
                  tickFormatter={v => fmtShort(Number(v))}
                  tick={{ fontSize: 10, fill: c.textDim, fontFamily: "'HarmonyOS Sans', sans-serif" }}
                  axisLine={false} tickLine={false} width={56} />
                <Tooltip
                  content={
                    <TrendTooltip
                      panelBg={c.panelBg}
                      panelBorder={c.panelBorder}
                      panelShadow={c.panelShadow}
                      textMuted={c.textMuted}
                    />
                  }
                  cursor={{ fill: "rgba(78,124,106,0.08)" }}
                />
                <Bar dataKey="amountVnd" radius={[6, 6, 3, 3]} maxBarSize={48}
                  onMouseEnter={(_, index) => setHoveredBar(index)}>
                  {chartData.map((entry, i) => (
                    <Cell key={entry.date} fill={hoveredBar === i ? "url(#revenueGradientActive)" : "url(#revenueGradient)"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>

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

      {/* ── Transaction History ── */}
      <Box borderRadius="14px" p={6} style={{ background: c.cardBg, border: `1px solid ${c.cardBorder}` }}>
        <Flex align="center" justify="space-between" mb={5}>
          <Box>
            <Text style={{ fontSize: "0.6rem", letterSpacing: "0.12em", color: c.textDim, fontFamily: "'HarmonyOS Sans', sans-serif" }}>
              TRANSACTION HISTORY
            </Text>
            <Text style={{ fontSize: "0.95rem", color: c.text, fontFamily: "'HarmonyOS Sans', sans-serif", marginTop: 2 }}>
              All Payments
            </Text>
          </Box>
          <Box as="button" onClick={() => fetchPayments()}
            display="flex" alignItems="center" justifyContent="center"
            w="36px" h="36px" borderRadius="10px" border="none" cursor="pointer" transition="all 0.18s"
            style={{ background: c.cardBg, border: `1px solid ${c.cardBorder}`, color: c.textMuted, flexShrink: 0 }}
            _hover={{ background: c.navActive } as any}>
            <RefreshCw size={15} />
          </Box>
        </Flex>

        {/* Filters */}
        <Flex align="center" gap={3} mb={4} wrap="wrap">
          <Box flex={1} minW="220px" position="relative">
            <Box position="absolute" left="12px" top="50%" transform="translateY(-50%)" pointerEvents="none">
              <Search size={14} style={{ color: c.textDim }} />
            </Box>
            <Input
              placeholder="Search by username, email, transaction code..."
              value={searchInput}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchInput(e.target.value)}
              style={{
                background: c.cardBg, border: `1px solid ${c.cardBorder}`, borderRadius: "10px",
                color: c.cardText, fontSize: "0.82rem", paddingLeft: "34px", height: "38px", outline: "none", width: "100%",
              }}
              _placeholder={{ color: c.cardTextMuted } as any}
              _focus={{ borderColor: "rgba(78,124,106,0.6)", boxShadow: "0 0 0 2px rgba(78,124,106,0.15)" } as any}
            />
          </Box>

          <select value={providerFilter}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setProviderFilter(e.target.value as PaymentProvider | "")}
            style={{
              height: 38, background: c.cardBg, border: `1px solid ${c.cardBorder}`, borderRadius: 8,
              color: c.cardText, fontSize: "0.8rem", padding: "0 10px", outline: "none", minWidth: 130,
            }}>
            {PROVIDER_OPTIONS.map(p => (
              <option key={p || "all"} value={p} style={{ color: "#111", background: "#fff" }}>
                {p || "All Providers"}
              </option>
            ))}
          </select>

          <select value={statusFilter}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setStatusFilter(e.target.value as PaymentStatus | "")}
            style={{
              height: 38, background: c.cardBg, border: `1px solid ${c.cardBorder}`, borderRadius: 8,
              color: c.cardText, fontSize: "0.8rem", padding: "0 10px", outline: "none", minWidth: 130,
            }}>
            {STATUS_OPTIONS.map(s => (
              <option key={s || "all"} value={s} style={{ color: "#111", background: "#fff" }}>
                {s || "All Statuses"}
              </option>
            ))}
          </select>

          <select value={purposeFilter}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setPurposeFilter(e.target.value as PaymentPurpose | "")}
            style={{
              height: 38, background: c.cardBg, border: `1px solid ${c.cardBorder}`, borderRadius: 8,
              color: c.cardText, fontSize: "0.8rem", padding: "0 10px", outline: "none", minWidth: 130,
            }}>
            {PURPOSE_OPTIONS.map(p => (
              <option key={p || "all"} value={p} style={{ color: "#111", background: "#fff" }}>
                {p ? PURPOSE_LABEL[p] : "All Purposes"}
              </option>
            ))}
          </select>
        </Flex>

        {/* Table */}
        <Box borderRadius="12px" overflow="hidden" style={{ border: `1px solid ${c.cardBorder}` }}>
          <Flex px={4} py={3} style={{ background: c.cardBg, borderBottom: `1px solid ${c.cardBorder}` }}>
            {["User", "Provider", "Purpose", "Amount", "Status", "Date"].map((h, i) => (
              <Text key={h} style={{
                fontSize: "0.65rem", color: c.cardTextMuted, letterSpacing: "0.1em",
                flex: [2, 1, 1, 1.2, 1, 1.4][i],
              }}>
                {h.toUpperCase()}
              </Text>
            ))}
          </Flex>

          {paymentsLoading ? (
            <Flex align="center" justify="center" py={12} gap={3}>
              <Spinner size="sm" style={{ color: "#4e7c6a" }} />
              <Text style={{ fontSize: "0.82rem", color: c.cardTextMuted }}>Loading transactions…</Text>
            </Flex>
          ) : paymentsError ? (
            <Flex align="center" justify="center" py={10} direction="column" gap={3}>
              <Text style={{ fontSize: "0.82rem", color: "#f87171" }}>{paymentsError}</Text>
              <Box as="button" onClick={() => fetchPayments()} style={{
                fontSize: "0.78rem", color: "#4e7c6a", background: "transparent",
                border: "1px solid rgba(78,124,106,0.4)", borderRadius: "8px",
                padding: "6px 16px", cursor: "pointer",
              }}>
                Retry
              </Box>
            </Flex>
          ) : payments.length === 0 ? (
            <Flex align="center" justify="center" py={10}>
              <Text style={{ fontSize: "0.82rem", color: c.cardTextMuted }}>No transactions found</Text>
            </Flex>
          ) : (
            payments.map((p, i) => {
              const st = PAYMENT_STATUS_STYLE[p.status];
              return (
                <Flex key={p.id} align="center" px={4} py="12px"
                  style={{ borderBottom: i < payments.length - 1 ? `1px solid ${c.rowDivider}` : "none" }}>
                  <Box style={{ flex: 2, minWidth: 0 }}>
                    <Text style={{ fontSize: "0.8rem", color: c.cardText, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {p.username ?? "—"}
                    </Text>
                    <Text style={{ fontSize: "0.7rem", color: c.cardTextMuted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {p.email ?? "—"}
                    </Text>
                  </Box>
                  <Text style={{ flex: 1, fontSize: "0.78rem", color: c.cardTextMuted }}>{p.provider}</Text>
                  <Text style={{ flex: 1, fontSize: "0.78rem", color: c.cardTextMuted }}>{PURPOSE_LABEL[p.purpose]}</Text>
                  <Text style={{ flex: 1.2, fontSize: "0.8rem", color: c.cardText, fontWeight: 600 }}>{fmtVnd(p.amount)}</Text>
                  <Box style={{ flex: 1 }}>
                    <Flex align="center" gap="5px" display="inline-flex" borderRadius="full" px={2} py="2px"
                      style={{ background: st.bg, border: `1px solid ${st.border}` }}>
                      <Box w="5px" h="5px" borderRadius="full" flexShrink={0} style={{ background: st.color }} />
                      <Text style={{ fontSize: "0.65rem", color: st.color }}>{p.status}</Text>
                    </Flex>
                  </Box>
                  <Text style={{ flex: 1.4, fontSize: "0.75rem", color: c.cardTextMuted }}>{fmtDateTime(p.createdAt)}</Text>
                </Flex>
              );
            })
          )}
        </Box>

        {/* Footer: count + pagination */}
        <Flex align="center" justify="space-between" mt={3}>
          <Text style={{ fontSize: "0.72rem", color: c.cardTextMuted }}>
            {paymentsLoading ? "Loading…" : `Showing ${payments.length} of ${paymentsTotalCount} transactions`}
          </Text>

          {paymentsTotalPages > 1 && (
            <Flex align="center" gap={2}>
              <Box as="button" onClick={() => paymentsHasPrev && setPaymentsPage(p => p - 1)}
                display="flex" alignItems="center" justifyContent="center"
                w="30px" h="30px" borderRadius="8px" border="none"
                cursor={paymentsHasPrev ? "pointer" : "not-allowed"} transition="all 0.15s"
                style={{
                  background: c.cardBg, border: `1px solid ${c.cardBorder}`,
                  color: paymentsHasPrev ? c.textMuted : c.textSub, opacity: paymentsHasPrev ? 1 : 0.4,
                }}
                _hover={paymentsHasPrev ? { background: c.navActive } as any : {}}>
                <ChevronLeft size={14} />
              </Box>

              <Text style={{ fontSize: "0.78rem", color: c.textMuted, minWidth: "60px", textAlign: "center" }}>
                {paymentsPage} / {paymentsTotalPages}
              </Text>

              <Box as="button" onClick={() => paymentsHasNext && setPaymentsPage(p => p + 1)}
                display="flex" alignItems="center" justifyContent="center"
                w="30px" h="30px" borderRadius="8px" border="none"
                cursor={paymentsHasNext ? "pointer" : "not-allowed"} transition="all 0.15s"
                style={{
                  background: c.cardBg, border: `1px solid ${c.cardBorder}`,
                  color: paymentsHasNext ? c.textMuted : c.textSub, opacity: paymentsHasNext ? 1 : 0.4,
                }}
                _hover={paymentsHasNext ? { background: c.navActive } as any : {}}>
                <ChevronRight size={14} />
              </Box>
            </Flex>
          )}
        </Flex>
      </Box>
    </Box>
  );
}
