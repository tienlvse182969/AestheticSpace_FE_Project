import { useEffect, useState } from "react";
import { Box, Flex, Text } from "@chakra-ui/react";
import { motion } from "motion/react";
import { BarChart2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Cell,
} from "recharts";
import { PanelCloseBtn }   from "../ui/PanelCloseBtn";
import { useCenteredPanel } from "../hooks/useCenteredPanel";
import { pomodoroService, type PomodoroStatsDto } from "../../../../services/pomodoro.service";

const MotionBox = motion.create(Box);

const PANEL_W = 460;

/* ── Aggregate history → 7-day chart data ────────────────────────────── */
function buildChartData(history: { startTime: string; durationMinutes: number; isActive: boolean }[], locale: string, todayLabel: string) {
  const todayStr = new Date().toISOString().split("T")[0];
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toISOString().split("T")[0];
    const label   = dateStr === todayStr ? todayLabel : d.toLocaleDateString(locale, { day: "numeric", month: "numeric" });
    const day     = history.filter(s => s.startTime.startsWith(dateStr) && !s.isActive);
    return {
      label,
      sessions: day.length,
      minutes:  day.reduce((sum, s) => sum + s.durationMinutes, 0),
    };
  });
}

/* ── Custom tooltip ────────────────────────────────────────────────────── */
function ChartTooltip({ active, payload, label }: any) {
  const { t } = useTranslation();
  if (!active || !payload?.length) return null;
  const { sessions, minutes } = payload[0].payload;
  return (
    <Box
      px={3} py={2} borderRadius="10px"
      style={{
        background: "rgba(10,15,22,0.92)",
        border: "1px solid rgba(255,255,255,0.12)",
        backdropFilter: "blur(12px)",
        fontSize: "0.75rem",
        color: "rgba(255,255,255,0.85)",
        fontFamily: "'HarmonyOS Sans', sans-serif",
      }}
    >
      <Text fontWeight="600" mb={1}>{label}</Text>
      <Text>{t("pomodoroStats.tooltip", { sessions, minutes })}</Text>
    </Box>
  );
}

/* ── Section label (matches SettingsPanel style) ────────────────────────── */
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <Text mb="8px" style={{
      fontSize: "0.6rem",
      color: "rgba(255,255,255,0.22)",
      letterSpacing: "0.14em",
      fontFamily: "'HarmonyOS Sans', sans-serif",
    }}>
      {children}
    </Text>
  );
}

/* ── Panel ─────────────────────────────────────────────────────────────── */
interface Props { onClose: () => void; }

export function PomodoroStatsPanel({ onClose }: Props) {
  const { t, i18n } = useTranslation();
  const locale = i18n.language === "vi" ? "vi-VN" : "en-US";
  const { x, y, ref } = useCenteredPanel(PANEL_W);

  const [stats,   setStats]   = useState<PomodoroStatsDto | null>(null);
  const [chart,   setChart]   = useState<ReturnType<typeof buildChartData> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    Promise.all([
      pomodoroService.getStats(),
      pomodoroService.getHistory(50),
    ]).then(([s, history]) => {
      if (!alive) return;
      setStats(s);
      setChart(buildChartData(history, locale, t("pomodoroStats.today")));
    }).catch(() => {
      if (alive) setChart(buildChartData([], locale, t("pomodoroStats.today")));
    }).finally(() => {
      if (alive) setLoading(false);
    });
    return () => { alive = false; };
  }, [locale]);

  const maxSessions = chart ? Math.max(...chart.map(d => d.sessions), 0) : 0;
  const yMax = Math.max(maxSessions + 1, 5);
  const yTicks = Array.from({ length: yMax + 1 }, (_, i) => i);

  return (
    <MotionBox
      ref={ref as any}
      drag
      dragMomentum={false}
      dragElastic={0}
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1, transition: { type: "spring", stiffness: 500, damping: 24, mass: 0.9 } } as any}
      exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.14, ease: [0.4, 0, 1, 1] } } as any}
      position="fixed"
      top={0}
      left={0}
      zIndex={50}
      style={{
        x, y,
        width: PANEL_W,
        borderRadius: "16px",
        background: "rgba(12,18,22,0.75)",
        backdropFilter: "blur(18px)",
        WebkitBackdropFilter: "blur(18px)",
        border: "1px solid rgba(255,255,255,0.1)",
        boxShadow: "0 24px 80px rgba(0,0,0,0.75), 0 0 0 1px rgba(255,255,255,0.08)",
        cursor: "grab",
        overflow: "hidden",
        touchAction: "none",
      }}
    >
      <Box position="relative" style={{ padding: "18px 18px 20px" }}>
        <PanelCloseBtn onClose={onClose} />

        {/* Header */}
        <Flex align="center" gap={2} mb={5}>
          <BarChart2 size={15} style={{ color: "rgba(255,255,255,0.5)" }} />
          <Text style={{
            fontSize: "0.7rem",
            color: "rgba(255,255,255,0.35)",
            letterSpacing: "0.1em",
            fontFamily: "'HarmonyOS Sans', sans-serif",
          }}>
            {t("pomodoroStats.title")}
          </Text>
        </Flex>

        {loading ? (
          /* Skeleton */
          <Flex direction="column" gap={3}>
            <Flex gap={3}>
              {[1, 2].map(i => (
                <Box key={i} flex={1} h="72px" borderRadius="10px"
                  style={{ background: "rgba(255,255,255,0.06)", animation: `pulse 1.5s ease-in-out ${i * 0.15}s infinite` }} />
              ))}
            </Flex>
            <Box h="200px" borderRadius="10px" mt={1}
              style={{ background: "rgba(255,255,255,0.04)", animation: "pulse 1.5s ease-in-out infinite" }} />
          </Flex>
        ) : (
          <>
            {/* Summary cards */}
            <Box mb={4}>
              <SectionLabel>{t("pomodoroStats.summary")}</SectionLabel>
              <Flex gap={3}>
                {[
                  { label: t("pomodoroStats.days7"),  sessions: stats?.sessionsLast7Days  ?? 0, minutes: stats?.totalMinutesLast7Days  ?? 0 },
                  { label: t("pomodoroStats.days30"), sessions: stats?.sessionsLast30Days ?? 0, minutes: stats?.totalMinutesLast30Days ?? 0 },
                ].map(card => (
                  <Box key={card.label} flex={1} px="12px" py="10px" borderRadius="10px"
                    style={{
                      background: "rgba(255,255,255,0.03)",
                      border: "1px solid rgba(255,255,255,0.06)",
                    }}
                  >
                    <Text style={{
                      fontSize: "0.6rem", letterSpacing: "0.1em",
                      color: "rgba(255,255,255,0.22)",
                      fontFamily: "'HarmonyOS Sans', sans-serif",
                    }}>
                      {card.label}
                    </Text>
                    <Flex align="baseline" gap={1} mt="6px">
                      <Text style={{ fontSize: "1.6rem", fontWeight: 800, color: "#4ade80", fontFamily: "'HarmonyOS Sans', sans-serif", lineHeight: 1 }}>
                        {card.sessions}
                      </Text>
                      <Text style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.35)", fontFamily: "'HarmonyOS Sans', sans-serif" }}>
                        {t("pomodoroStats.sessions")}
                      </Text>
                    </Flex>
                    <Text style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.3)", fontFamily: "'HarmonyOS Sans', sans-serif", marginTop: 3 }}>
                      {t("pomodoroStats.focusMinutes", { minutes: card.minutes })}
                    </Text>
                  </Box>
                ))}
              </Flex>
            </Box>

            {/* Bar chart */}
            <Box>
              <SectionLabel>{t("pomodoroStats.chart")}</SectionLabel>

              {chart && chart.every(d => d.sessions === 0) ? (
                <Flex
                  h="200px" align="center" justify="center" borderRadius="10px"
                  style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
                >
                  <Text style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.2)", fontFamily: "'HarmonyOS Sans', sans-serif" }}>
                    {t("pomodoroStats.noData")}
                  </Text>
                </Flex>
              ) : (
                <Box
                  h="200px" borderRadius="10px" pt={3} pr={2} pb={1}
                  style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chart ?? []} barCategoryGap="30%" margin={{ top: 10, right: 8, bottom: 0, left: -20 }}>
                      <defs>
                        <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%"   stopColor="#4ade80" stopOpacity={0.95} />
                          <stop offset="100%" stopColor="#38bdf8" stopOpacity={0.7} />
                        </linearGradient>
                      </defs>
                      <XAxis
                        dataKey="label"
                        tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 6, fontFamily: "'HarmonyOS Sans', sans-serif" }}
                        axisLine={false} tickLine={false}
                      />
                      <YAxis
                        allowDecimals={false}
                        domain={[0, yMax]}
                        ticks={yTicks}
                        interval={0}
                        tick={{ fill: "rgba(255,255,255,0.25)", fontSize: 7, fontFamily: "'HarmonyOS Sans', sans-serif" }}
                        axisLine={false} tickLine={false}
                      />
                      <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
                      <Bar dataKey="sessions" fill="url(#barGrad)" radius={[5, 5, 0, 0]}>
                        {(chart ?? []).map((entry, i) => (
                          <Cell
                            key={i}
                            fill={entry.sessions > 0 ? "url(#barGrad)" : "rgba(255,255,255,0.06)"}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              )}
            </Box>
          </>
        )}
      </Box>

      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 0.4; } 50% { opacity: 0.8; } }
      `}</style>
    </MotionBox>
  );
}
