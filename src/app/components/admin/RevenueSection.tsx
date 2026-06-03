import { useState } from "react";
import { Box, Flex, Text } from "@chakra-ui/react";
import { TrendingUp, TrendingDown, DollarSign, Users, CreditCard, Calendar } from "lucide-react";
import { motion } from "motion/react";

const MotionBox = motion.create(Box);

const MONTHLY_REVENUE = [
  { month: "Nov 25", revenue: 1_200_000, subs: 24 },
  { month: "Dec 25", revenue: 1_850_000, subs: 37 },
  { month: "Jan 26", revenue: 2_400_000, subs: 48 },
  { month: "Feb 26", revenue: 2_100_000, subs: 42 },
  { month: "Mar 26", revenue: 3_250_000, subs: 65 },
  { month: "Apr 26", revenue: 2_900_000, subs: 58 },
  { month: "May 26", revenue: 3_800_000, subs: 76 },
];

const TRANSACTIONS = [
  { id: "TXN-0091", user: "Pham Thu Ha",    email: "thuha.pham@gmail.com",   plan: "Pro Monthly", amount: 99_000,  date: "2026-05-18", status: "paid"    },
  { id: "TXN-0090", user: "Dang Quoc Hung", email: "quochung@gmail.com",     plan: "Pro Yearly",  amount: 890_000, date: "2026-05-17", status: "paid"    },
  { id: "TXN-0089", user: "Tran Thi Bich",  email: "bich.tran@outlook.com",  plan: "Pro Monthly", amount: 99_000,  date: "2026-05-15", status: "paid"    },
  { id: "TXN-0088", user: "Bui Thanh Tung", email: "buithanhtung@gmail.com", plan: "Pro Yearly",  amount: 890_000, date: "2026-05-14", status: "paid"    },
  { id: "TXN-0087", user: "Ly Thi Kim",     email: "kimly@gmail.com",        plan: "Pro Monthly", amount: 99_000,  date: "2026-05-12", status: "refunded" },
  { id: "TXN-0086", user: "Nguyen Van An",  email: "van.an@gmail.com",       plan: "Pro Monthly", amount: 99_000,  date: "2026-05-10", status: "paid"    },
  { id: "TXN-0085", user: "Hoang Van Long", email: "vanlong@yahoo.com",      plan: "Pro Yearly",  amount: 890_000, date: "2026-05-08", status: "pending"  },
  { id: "TXN-0084", user: "Cao Minh Tri",   email: "caoминhtri@gmail.com",   plan: "Pro Monthly", amount: 99_000,  date: "2026-05-05", status: "paid"    },
  { id: "TXN-0083", user: "Vo Thi Mai",     email: "mai.vo@gmail.com",       plan: "Pro Monthly", amount: 99_000,  date: "2026-05-01", status: "refunded" },
  { id: "TXN-0082", user: "Le Minh Duc",    email: "minhduc@gmail.com",      plan: "Pro Yearly",  amount: 890_000, date: "2026-04-28", status: "paid"    },
];

const STATUS_CFG = {
  paid:     { label: "Paid",     color: "#4ade80", bg: "rgba(74,222,128,0.1)",  border: "rgba(74,222,128,0.25)"  },
  refunded: { label: "Refunded", color: "#f87171", bg: "rgba(248,113,113,0.1)", border: "rgba(248,113,113,0.25)" },
  pending:  { label: "Pending",  color: "#fbbf24", bg: "rgba(251,191,36,0.1)",  border: "rgba(251,191,36,0.25)"  },
};

const AVATAR_COLORS = ["#4e7c6a","#1a3a8a","#a78bfa","#fb923c","#38bdf8","#f97316","#4ade80","#c084fc","#fbbf24","#60a5fa"];
function initials(name: string) {
  return name.split(" ").slice(-2).map(w => w[0]).join("").toUpperCase();
}
function fmt(n: number) {
  return n.toLocaleString("vi-VN") + "đ";
}

const maxRevenue = Math.max(...MONTHLY_REVENUE.map(m => m.revenue));

const totalRevenue  = MONTHLY_REVENUE.reduce((s, m) => s + m.revenue, 0);
const currentMonth  = MONTHLY_REVENUE[MONTHLY_REVENUE.length - 1];
const prevMonth     = MONTHLY_REVENUE[MONTHLY_REVENUE.length - 2];
const momGrowth     = ((currentMonth.revenue - prevMonth.revenue) / prevMonth.revenue * 100).toFixed(1);
const momPositive   = currentMonth.revenue >= prevMonth.revenue;
const totalPaid     = TRANSACTIONS.filter(t => t.status === "paid").reduce((s, t) => s + t.amount, 0);
const totalRefunded = TRANSACTIONS.filter(t => t.status === "refunded").reduce((s, t) => s + t.amount, 0);

export function RevenueSection() {
  const [hoveredBar, setHoveredBar] = useState<number | null>(null);
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);

  return (
    <Box>
      {/* ── Stat cards ── */}
      <Box display="grid" mb={5} style={{ gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
        {[
          {
            label: "Total Revenue",
            value: fmt(totalRevenue),
            sub: "All time",
            icon: DollarSign,
            color: "#4ade80",
            bg: "rgba(74,222,128,0.1)",
            border: "rgba(74,222,128,0.2)",
          },
          {
            label: "This Month",
            value: fmt(currentMonth.revenue),
            sub: `${momPositive ? "+" : ""}${momGrowth}% vs last month`,
            icon: momPositive ? TrendingUp : TrendingDown,
            color: momPositive ? "#4ade80" : "#f87171",
            bg: momPositive ? "rgba(74,222,128,0.1)" : "rgba(248,113,113,0.1)",
            border: momPositive ? "rgba(74,222,128,0.2)" : "rgba(248,113,113,0.2)",
          },
          {
            label: "Pro Subscribers",
            value: String(currentMonth.subs),
            sub: "Active this month",
            icon: Users,
            color: "#a78bfa",
            bg: "rgba(167,139,250,0.1)",
            border: "rgba(167,139,250,0.2)",
          },
          {
            label: "Refunds",
            value: fmt(totalRefunded),
            sub: `${TRANSACTIONS.filter(t => t.status === "refunded").length} transactions`,
            icon: CreditCard,
            color: "#f87171",
            bg: "rgba(248,113,113,0.1)",
            border: "rgba(248,113,113,0.2)",
          },
        ].map(card => {
          const Icon = card.icon;
          return (
            <Box key={card.label} borderRadius="14px" p={5}
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <Flex align="center" justify="space-between" mb={4}>
                <Flex align="center" justify="center" w="38px" h="38px" borderRadius="10px"
                  style={{ background: card.bg, border: `1px solid ${card.border}` }}>
                  <Icon size={17} style={{ color: card.color }} />
                </Flex>
              </Flex>
              <Text style={{ fontSize: "1.5rem", color: "rgba(255,255,255,0.92)", fontFamily: "'HarmonyOS Sans', sans-serif", lineHeight: 1, fontWeight: 600 }}>
                {card.value}
              </Text>
              <Text mt={1} style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.3)", fontFamily: "'HarmonyOS Sans', sans-serif" }}>
                {card.label}
              </Text>
              <Text mt="3px" style={{ fontSize: "0.68rem", color: card.color, fontFamily: "'HarmonyOS Sans', sans-serif" }}>
                {card.sub}
              </Text>
            </Box>
          );
        })}
      </Box>

      {/* ── Bar chart ── */}
      <Box borderRadius="14px" p={6} mb={5}
        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
        <Flex align="center" justify="space-between" mb={6}>
          <Box>
            <Text style={{ fontSize: "0.62rem", color: "rgba(255,255,255,0.2)", letterSpacing: "0.12em", fontFamily: "'HarmonyOS Sans', sans-serif" }}>
              REVENUE HISTORY
            </Text>
            <Text style={{ fontSize: "0.95rem", color: "rgba(255,255,255,0.82)", fontFamily: "'HarmonyOS Sans', sans-serif", marginTop: 2 }}>
              Monthly Revenue (VNĐ)
            </Text>
          </Box>
          <Flex align="center" gap={2} borderRadius="full" px={3} py="5px"
            style={{ background: "rgba(78,124,106,0.1)", border: "1px solid rgba(78,124,106,0.2)" }}>
            <Calendar size={12} style={{ color: "#4e7c6a" }} />
            <Text style={{ fontSize: "0.7rem", color: "#4e7c6a", fontFamily: "'HarmonyOS Sans', sans-serif" }}>
              Nov 2025 – May 2026
            </Text>
          </Flex>
        </Flex>

        {/* Y-axis labels + bars */}
        <Flex gap={4} align="flex-end" style={{ height: 200 }}>
          {/* Y-axis */}
          <Flex direction="column" justify="space-between" style={{ height: "100%", flexShrink: 0 }}>
            {[4_000_000, 3_000_000, 2_000_000, 1_000_000, 0].map(v => (
              <Text key={v} style={{ fontSize: "0.6rem", color: "rgba(255,255,255,0.2)", fontFamily: "'HarmonyOS Sans', sans-serif", textAlign: "right", lineHeight: 1 }}>
                {v === 0 ? "0" : `${v / 1_000_000}M`}
              </Text>
            ))}
          </Flex>

          {/* Chart area */}
          <Box flex={1} position="relative">
            {/* Grid lines */}
            {[0, 25, 50, 75, 100].map(pct => (
              <Box
                key={pct}
                position="absolute"
                left={0}
                right={0}
                style={{
                  bottom: `${pct}%`,
                  borderTop: "1px solid rgba(255,255,255,0.05)",
                  pointerEvents: "none",
                }}
              />
            ))}

            {/* Bars */}
            <Flex align="flex-end" justify="space-around" style={{ height: "100%", position: "relative" }}>
              {MONTHLY_REVENUE.map((m, i) => {
                const heightPct = (m.revenue / maxRevenue) * 92;
                const isHov = hoveredBar === i;
                return (
                  <Flex
                    key={m.month}
                    direction="column"
                    align="center"
                    justify="flex-end"
                    style={{ height: "100%", flex: 1, cursor: "pointer" }}
                    onMouseEnter={() => setHoveredBar(i)}
                    onMouseLeave={() => setHoveredBar(null)}
                  >
                    {/* Tooltip */}
                    {isHov && (
                      <Box
                        position="absolute"
                        borderRadius="8px"
                        px={3}
                        py={2}
                        style={{
                          background: "rgba(10,18,24,0.95)",
                          border: "1px solid rgba(78,124,106,0.4)",
                          bottom: `calc(${heightPct}% + 10px)`,
                          pointerEvents: "none",
                          whiteSpace: "nowrap",
                          zIndex: 10,
                        }}
                      >
                        <Text style={{ fontSize: "0.75rem", color: "#4ade80", fontFamily: "'HarmonyOS Sans', sans-serif" }}>
                          {fmt(m.revenue)}
                        </Text>
                        <Text style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.4)", fontFamily: "'HarmonyOS Sans', sans-serif" }}>
                          {m.subs} subscribers
                        </Text>
                      </Box>
                    )}

                    {/* Bar */}
                    <MotionBox
                      borderRadius="6px 6px 3px 3px"
                      style={{
                        width: "60%",
                        background: isHov
                          ? "linear-gradient(to top, #1a3c34, #4ade80)"
                          : "linear-gradient(to top, rgba(78,124,106,0.6), rgba(78,124,106,0.25))",
                        border: isHov ? "1px solid rgba(74,222,128,0.4)" : "1px solid rgba(78,124,106,0.2)",
                        transition: "background 0.2s, border 0.2s",
                      }}
                      initial={{ height: 0 }}
                      animate={{ height: `${heightPct}%` }}
                      transition={{ duration: 0.5, delay: i * 0.06, ease: "easeOut" } as any}
                    />

                    {/* Month label */}
                    <Text mt={2} style={{ fontSize: "0.62rem", color: isHov ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.25)", fontFamily: "'HarmonyOS Sans', sans-serif", transition: "color 0.2s" }}>
                      {m.month}
                    </Text>
                  </Flex>
                );
              })}
            </Flex>
          </Box>
        </Flex>

        {/* Summary row */}
        <Flex gap={6} mt={5} pt={4} style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          {[
            { label: "Peak Month", value: "May 2026", color: "#4ade80" },
            { label: "Avg Monthly", value: fmt(Math.round(totalRevenue / MONTHLY_REVENUE.length)), color: "rgba(255,255,255,0.6)" },
            { label: "Growth (MoM)", value: `+${momGrowth}%`, color: momPositive ? "#4ade80" : "#f87171" },
          ].map(s => (
            <Box key={s.label}>
              <Text style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.2)", fontFamily: "'HarmonyOS Sans', sans-serif", letterSpacing: "0.08em" }}>
                {s.label.toUpperCase()}
              </Text>
              <Text style={{ fontSize: "0.9rem", color: s.color, fontFamily: "'HarmonyOS Sans', sans-serif" }}>
                {s.value}
              </Text>
            </Box>
          ))}
        </Flex>
      </Box>

      {/* ── Transaction history ── */}
      <Box borderRadius="14px" overflow="hidden"
        style={{ border: "1px solid rgba(255,255,255,0.07)" }}>
        {/* Header */}
        <Flex px={5} py={3} align="center" justify="space-between"
          style={{ background: "rgba(255,255,255,0.04)", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          <Text style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.8)", fontFamily: "'HarmonyOS Sans', sans-serif" }}>
            Transaction History
          </Text>
          <Text style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.2)", fontFamily: "'HarmonyOS Sans', sans-serif" }}>
            {TRANSACTIONS.length} transactions
          </Text>
        </Flex>

        {/* Column headers */}
        <Flex px={5} py="10px"
          style={{ background: "rgba(255,255,255,0.02)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
          {["Transaction ID", "User", "Plan", "Amount", "Date", "Status"].map((h, i) => (
            <Text key={h} style={{
              fontSize: "0.62rem", color: "rgba(255,255,255,0.22)", letterSpacing: "0.1em",
              fontFamily: "'HarmonyOS Sans', sans-serif",
              flex: [1.4, 2.2, 1.4, 1, 1.2, 1][i],
            }}>
              {h.toUpperCase()}
            </Text>
          ))}
        </Flex>

        {/* Rows */}
        {TRANSACTIONS.map((tx, i) => {
          const st = STATUS_CFG[tx.status as keyof typeof STATUS_CFG];
          return (
            <Flex
              key={tx.id}
              align="center"
              px={5}
              py="13px"
              style={{
                background: hoveredRow === tx.id ? "rgba(78,124,106,0.1)" : "transparent",
                borderBottom: i < TRANSACTIONS.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                transition: "background 0.15s",
              }}
              onMouseEnter={() => setHoveredRow(tx.id)}
              onMouseLeave={() => setHoveredRow(null)}
            >
              {/* ID */}
              <Text style={{ flex: 1.4, fontSize: "0.75rem", color: "rgba(255,255,255,0.4)", fontFamily: "'HarmonyOS Sans', sans-serif", letterSpacing: "0.04em" }}>
                {tx.id}
              </Text>

              {/* User */}
              <Flex align="center" gap={2} style={{ flex: 2.2 }}>
                <Flex align="center" justify="center" w="26px" h="26px" borderRadius="full" flexShrink={0}
                  style={{ background: AVATAR_COLORS[i % AVATAR_COLORS.length] }}>
                  <Text style={{ fontSize: "0.55rem", color: "white", fontFamily: "'HarmonyOS Sans', sans-serif", fontWeight: 700 }}>
                    {initials(tx.user)}
                  </Text>
                </Flex>
                <Box minW={0}>
                  <Text style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.82)", fontFamily: "'HarmonyOS Sans', sans-serif", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {tx.user}
                  </Text>
                  <Text style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.25)", fontFamily: "'HarmonyOS Sans', sans-serif", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {tx.email}
                  </Text>
                </Box>
              </Flex>

              {/* Plan */}
              <Box style={{ flex: 1.4 }}>
                <Box display="inline-flex" borderRadius="full" px={2} py="2px"
                  style={{
                    background: tx.plan.includes("Yearly") ? "rgba(167,139,250,0.15)" : "rgba(56,189,248,0.1)",
                    border: `1px solid ${tx.plan.includes("Yearly") ? "rgba(167,139,250,0.3)" : "rgba(56,189,248,0.25)"}`,
                  }}>
                  <Text style={{ fontSize: "0.65rem", color: tx.plan.includes("Yearly") ? "#a78bfa" : "#38bdf8", fontFamily: "'HarmonyOS Sans', sans-serif" }}>
                    {tx.plan}
                  </Text>
                </Box>
              </Box>

              {/* Amount */}
              <Text style={{ flex: 1, fontSize: "0.85rem", color: tx.status === "refunded" ? "#f87171" : "rgba(255,255,255,0.85)", fontFamily: "'HarmonyOS Sans', sans-serif" }}>
                {tx.status === "refunded" ? `-${fmt(tx.amount)}` : fmt(tx.amount)}
              </Text>

              {/* Date */}
              <Text style={{ flex: 1.2, fontSize: "0.75rem", color: "rgba(255,255,255,0.3)", fontFamily: "'HarmonyOS Sans', sans-serif" }}>
                {tx.date}
              </Text>

              {/* Status */}
              <Box style={{ flex: 1 }}>
                <Flex align="center" gap="5px" display="inline-flex" borderRadius="full" px={2} py="3px"
                  style={{ background: st.bg, border: `1px solid ${st.border}` }}>
                  <Box w="5px" h="5px" borderRadius="full" style={{ background: st.color, flexShrink: 0 }} />
                  <Text style={{ fontSize: "0.65rem", color: st.color, fontFamily: "'HarmonyOS Sans', sans-serif" }}>
                    {st.label}
                  </Text>
                </Flex>
              </Box>
            </Flex>
          );
        })}
      </Box>

      {/* Footer summary */}
      <Flex mt={3} align="center" justify="space-between">
        <Text style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.2)", fontFamily: "'HarmonyOS Sans', sans-serif" }}>
          Showing {TRANSACTIONS.length} most recent transactions
        </Text>
        <Text style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.2)", fontFamily: "'HarmonyOS Sans', sans-serif" }}>
          Net collected: <span style={{ color: "#4ade80" }}>{fmt(totalPaid)}</span>
        </Text>
      </Flex>
    </Box>
  );
}
