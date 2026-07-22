import { useState, useEffect, useCallback } from "react";
import { Box, Flex, Text, Input, Spinner } from "@chakra-ui/react";
import { DollarSign, Crown, Coins, Package, Calendar, Search, ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import { motion } from "motion/react";
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

const MotionBox = motion.create(Box);

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

// ── component ─────────────────────────────────────────────────────────────────

export function RevenueSection() {
  const { c } = useAdminTheme();

  const [summary,        setSummary]        = useState<AdminRevenueSummary | null>(null);
  const [trend,          setTrend]          = useState<AdminRevenueTrend[]>([]);
  const [selectedDays,   setSelectedDays]   = useState<TrendDay>(30);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [loadingTrend,   setLoadingTrend]   = useState(true);
  const [hoveredBar,     setHoveredBar]     = useState<number | null>(null);

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
