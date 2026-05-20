import { useState, useEffect } from "react";
import { Box, Flex, Text } from "@chakra-ui/react";
import { Flame, RotateCcw, Play, Pause, Coffee, Zap, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useTranslation } from "react-i18next";

const MotionBox = motion.create(Box);

type Phase  = "idle" | "focus" | "break";
type Dialog = "break-prompt" | "next-prompt" | null;

const SPRING = { type: "spring", stiffness: 500, damping: 24, mass: 0.9 } as const;

interface PomodoroWidgetProps {
  focusMinutes:   number;
  breakMinutes:   number;
  totalSessions:  number;
}

export function PomodoroWidget({ focusMinutes, breakMinutes, totalSessions }: PomodoroWidgetProps) {
  const { t } = useTranslation();
  const focusTotal = focusMinutes * 60;
  const breakTotal = breakMinutes * 60;

  const [phase,   setPhase]   = useState<Phase>("idle");
  const [seconds, setSeconds] = useState(focusTotal);
  const [running, setRunning] = useState(false);
  const [session, setSession] = useState(1);
  const [dialog,  setDialog]  = useState<Dialog>(null);

  const isBreak = phase === "break";
  const total   = isBreak ? breakTotal : focusTotal;
  const progress = seconds / (total || 1);

  const r    = 76;
  const circ = 2 * Math.PI * r;
  const dash = circ * progress;
  const mins = String(Math.floor(seconds / 60)).padStart(2, "0");
  const secs = String(seconds % 60).padStart(2, "0");

  /* ── Sync when settings change (idle only) ── */
  useEffect(() => {
    if (phase === "idle") setSeconds(focusTotal);
  }, [focusTotal, phase]);

  /* ── Tick ── */
  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setSeconds((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [running]);

  /* ── Timer hits 0 ── */
  useEffect(() => {
    if (seconds === 0 && running) {
      setRunning(false);
      if (phase === "focus")      { setPhase("idle"); setDialog("break-prompt"); }
      else if (phase === "break") { setPhase("idle"); setDialog("next-prompt");  }
    }
  }, [seconds, running, phase]);

  /* ── Helpers ── */
  const startFocus = () => { setPhase("focus"); setSeconds(focusTotal); setRunning(true);  setDialog(null); };
  const startBreak = () => { setPhase("break"); setSeconds(breakTotal); setRunning(true);  setDialog(null); };
  const skipToNext = () => { setSession((s) => s + 1); setDialog(null); startFocus(); };
  const resetAll   = () => { setRunning(false); setPhase("idle"); setSeconds(focusTotal); setDialog(null); setSession(1); };
  const togglePlay = () => { if (phase === "idle") startFocus(); else setRunning((r) => !r); };

  const gradId = isBreak ? "timerGradBreak" : "timerGradFocus";

  return (
    <Box
      position="relative"
      style={{
        background: "rgba(12,18,22,0.75)",
        backdropFilter: "blur(18px)",
        WebkitBackdropFilter: "blur(18px)",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: "16px",
        padding: "20px 22px",
        overflow: "hidden",
        minWidth: 224,
      }}
    >
      {/* ── Header ── */}
      <Flex align="center" gap={2} justify="center" mb={3}>
        <Flame size={12} color={isBreak ? "#38bdf8" : "#f97316"} />
        <Text style={{ fontSize: "0.72rem", color: "#7aab97", letterSpacing: "0.1em", fontFamily: "'HarmonyOS Sans', sans-serif" }}>
          {isBreak ? t("pomodoroWidget.sessionBreak", { session }) : t("pomodoroWidget.sessionFocus", { session })}
        </Text>
      </Flex>

      {/* ── Phase pill ── */}
      <Flex justify="center" mb={4}>
        <Box style={{
          padding: "3px 14px", borderRadius: "20px", fontSize: "0.7rem",
          fontFamily: "'HarmonyOS Sans', sans-serif",
          color: isBreak ? "rgba(56,189,248,0.85)" : "#7aab97",
          background: isBreak ? "rgba(56,189,248,0.1)" : "rgba(74,166,134,0.08)",
          border: isBreak ? "1px solid rgba(56,189,248,0.22)" : "1px solid rgba(74,166,134,0.18)",
          display: "flex", alignItems: "center", gap: 5,
        }}>
          <span style={{ opacity: 0.6, fontSize: "0.62rem" }}>{isBreak ? t("pomodoroWidget.breakPhase") : t("pomodoroWidget.focusPhase")}</span>
          <span style={{ fontWeight: 600 }}>{isBreak ? breakMinutes : focusMinutes}</span>
          <span>{t("pomodoroWidget.min")}</span>
        </Box>
      </Flex>

      {/* ── Circular timer ── */}
      <Box position="relative" w="170px" h="170px" mx="auto">
        <svg width="170" height="170" style={{ transform: "rotate(-90deg)" }}>
          <defs>
            <linearGradient id="timerGradFocus" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#4ade80" />
              <stop offset="100%" stopColor="#38bdf8" />
            </linearGradient>
            <linearGradient id="timerGradBreak" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#818cf8" />
            </linearGradient>
          </defs>
          <circle cx="85" cy="85" r={r} fill="none" stroke="rgba(74,166,134,0.12)" strokeWidth="9" />
          <circle cx="85" cy="85" r={r} fill="none"
            stroke={`url(#${gradId})`} strokeWidth="9" strokeLinecap="round"
            strokeDasharray={`${dash} ${circ}`}
            style={{ transition: "stroke-dasharray 0.8s ease" }}
          />
        </svg>
        <Flex position="absolute" inset={0} direction="column" align="center" justify="center">
          <Text style={{ fontSize: "2.4rem", color: "#fff", letterSpacing: "0.04em", lineHeight: 1, fontFamily: "'HarmonyOS Sans', sans-serif", fontWeight: "600" }}>
            {mins}:{secs}
          </Text>
          <Text style={{ fontSize: "0.65rem", color: isBreak ? "rgba(56,189,248,0.7)" : "#7aab97", marginTop: 4, letterSpacing: "0.1em", fontFamily: "'HarmonyOS Sans', sans-serif" }}>
            {isBreak ? t("pomodoroWidget.breakLabel") : t("pomodoroWidget.remaining")}
          </Text>
        </Flex>
      </Box>

      {/* ── Controls ── */}
      <Flex align="center" justify="center" gap={3} mt={4}>
        <Box as="button" onClick={resetAll}
          borderRadius="full" display="flex" alignItems="center" justifyContent="center"
          style={{ width: 38, height: 38, background: "rgba(74,166,134,0.1)", border: "1px solid rgba(74,166,134,0.3)", cursor: "pointer" }}>
          <RotateCcw size={14} color="#7aab97" />
        </Box>
        <Box as="button" onClick={togglePlay}
          borderRadius="full" display="flex" alignItems="center" justifyContent="center"
          style={{
            width: 52, height: 52,
            background: isBreak ? "linear-gradient(135deg,#38bdf8,#818cf8)" : "linear-gradient(135deg,#4ade80,#38bdf8)",
            boxShadow: isBreak ? "0 0 18px rgba(56,189,248,0.3)" : "0 0 18px rgba(74,222,128,0.3)",
            cursor: "pointer", border: "none",
          }}>
          {running ? <Pause size={18} color="#0d2b24" fill="#0d2b24" /> : <Play size={18} color="#0d2b24" fill="#0d2b24" />}
        </Box>
        {/* Skip break */}
        <Box as="button"
          onClick={() => { if (isBreak) { setRunning(false); setPhase("idle"); setDialog("next-prompt"); } }}
          borderRadius="full" display="flex" alignItems="center" justifyContent="center"
          title={isBreak ? t("pomodoroWidget.skipBreakTooltip") : ""}
          style={{
            width: 38, height: 38,
            background: "rgba(74,166,134,0.1)", border: "1px solid rgba(74,166,134,0.3)",
            cursor: isBreak ? "pointer" : "default",
            opacity: isBreak ? 1 : 0.35,
            transition: "opacity 0.2s",
          }}>
          <Zap size={14} color={isBreak ? "#38bdf8" : "#7aab97"} />
        </Box>
      </Flex>

      {/* ── Session dots ── */}
      <Flex gap="6px" justify="center" mt={4} flexWrap="wrap"
        style={{ maxWidth: 160, margin: "16px auto 0" }}>
        {Array.from({ length: totalSessions }, (_, i) => i + 1).map((i) => (
          <Box key={i} borderRadius="full" style={{
            width: 8, height: 8,
            background: i < session ? "#4ade80" : i === session ? "rgba(74,222,128,0.6)" : "rgba(74,166,134,0.18)",
            border: "1px solid rgba(74,222,128,0.3)",
            transition: "background 0.3s",
            flexShrink: 0,
          }} />
        ))}
      </Flex>
      <Text mt={3} textAlign="center" style={{ fontSize: "0.72rem", color: "#4d8a78", fontFamily: "'HarmonyOS Sans', sans-serif" }}>
        {session > 1
          ? t("pomodoroWidget.sessionsDone", { done: session - 1, total: totalSessions, count: session - 1 })
          : t("pomodoroWidget.noSessionsDone", { total: totalSessions })}
      </Text>

      {/* ── End-of-session dialog overlay ── */}
      <AnimatePresence>
        {dialog && (
          <MotionBox
            key={dialog}
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1, transition: SPRING }}
            exit={{ opacity: 0, scale: 0.94, transition: { duration: 0.14, ease: [0.4, 0, 1, 1] } }}
            position="absolute" inset={0}
            display="flex" flexDirection="column" alignItems="center" justifyContent="center"
            style={{
              background: "rgba(10,15,20,0.9)",
              backdropFilter: "blur(14px)",
              WebkitBackdropFilter: "blur(14px)",
              borderRadius: "16px",
              padding: "24px 20px",
              zIndex: 10,
            }}
          >
            <Box as="button" position="absolute" top="10px" right="10px"
              display="flex" alignItems="center" justifyContent="center"
              w="22px" h="22px" borderRadius="full" onClick={resetAll}
              style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.4)", cursor: "pointer" }}>
              <X size={11} />
            </Box>

            {dialog === "break-prompt" && (
              <>
                <Coffee size={28} color="#38bdf8" style={{ marginBottom: 12, opacity: 0.9 }} />
                <Text textAlign="center" mb={1} style={{ fontSize: "0.92rem", color: "rgba(255,255,255,0.92)", fontFamily: "'HarmonyOS Sans', sans-serif", fontWeight: 600 }}>
                  {t("pomodoroWidget.focusDoneTitle")}
                </Text>
                <Text textAlign="center" mb={5} style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.45)", fontFamily: "'HarmonyOS Sans', sans-serif", lineHeight: 1.5 }}>
                  {t("pomodoroWidget.breakPromptDesc", { minutes: breakMinutes })}
                </Text>
                <Flex gap={2} w="100%">
                  <Box as="button" flex={1} py="9px" borderRadius="10px" onClick={startBreak}
                    style={{ background: "linear-gradient(135deg,#38bdf8,#818cf8)", color: "#fff", fontSize: "0.78rem", fontFamily: "'HarmonyOS Sans', sans-serif", fontWeight: 600, border: "none", cursor: "pointer", boxShadow: "0 4px 16px rgba(56,189,248,0.3)" }}>
                    {t("pomodoroWidget.takeBreak", { minutes: breakMinutes })}
                  </Box>
                  <Box as="button" flex={1} py="9px" borderRadius="10px" onClick={() => setDialog("next-prompt")}
                    style={{ background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.6)", fontSize: "0.78rem", fontFamily: "'HarmonyOS Sans', sans-serif", border: "1px solid rgba(255,255,255,0.12)", cursor: "pointer" }}>
                    {t("pomodoroWidget.skip")}
                  </Box>
                </Flex>
              </>
            )}

            {dialog === "next-prompt" && (
              <>
                <Zap size={28} color="#4ade80" style={{ marginBottom: 12, opacity: 0.9 }} />
                <Text textAlign="center" mb={1} style={{ fontSize: "0.92rem", color: "rgba(255,255,255,0.92)", fontFamily: "'HarmonyOS Sans', sans-serif", fontWeight: 600 }}>
                  {session >= totalSessions ? t("pomodoroWidget.allDoneTitle") : t("pomodoroWidget.readyNextTitle")}
                </Text>
                <Text textAlign="center" mb={5} style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.45)", fontFamily: "'HarmonyOS Sans', sans-serif", lineHeight: 1.5 }}>
                  {session >= totalSessions
                    ? t("pomodoroWidget.allDoneDesc", { total: totalSessions })
                    : t("pomodoroWidget.nextSessionDesc", { next: session + 1, total: totalSessions, minutes: focusMinutes })}
                </Text>
                <Flex gap={2} w="100%">
                  {session < totalSessions && (
                    <Box as="button" flex={1} py="9px" borderRadius="10px" onClick={skipToNext}
                      style={{ background: "linear-gradient(135deg,#4ade80,#38bdf8)", color: "#0d2b24", fontSize: "0.78rem", fontFamily: "'HarmonyOS Sans', sans-serif", fontWeight: 600, border: "none", cursor: "pointer", boxShadow: "0 4px 16px rgba(74,222,128,0.28)" }}>
                      {t("pomodoroWidget.startNext", { next: session + 1 })}
                    </Box>
                  )}
                  <Box as="button" flex={1} py="9px" borderRadius="10px" onClick={resetAll}
                    style={{
                      background: session >= totalSessions ? "linear-gradient(135deg,#4ade80,#38bdf8)" : "rgba(255,255,255,0.07)",
                      color: session >= totalSessions ? "#0d2b24" : "rgba(255,255,255,0.6)",
                      fontSize: "0.78rem", fontFamily: "'HarmonyOS Sans', sans-serif",
                      fontWeight: session >= totalSessions ? 600 : 400,
                      border: session >= totalSessions ? "none" : "1px solid rgba(255,255,255,0.12)",
                      cursor: "pointer",
                    }}>
                    {session >= totalSessions ? t("pomodoroWidget.restart") : t("pomodoroWidget.stop")}
                  </Box>
                </Flex>
              </>
            )}
          </MotionBox>
        )}
      </AnimatePresence>
    </Box>
  );
}