import { useState, useEffect, useRef } from "react";
import { Box, Flex, Text } from "@chakra-ui/react";
import { Flame, RotateCcw, Play, Pause, Zap } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../../../../context/AuthContext";
import { pomodoroService } from "../../../../../services/pomodoro.service";

const MotionBox = motion.create(Box);

const chime = {
  startPomodoro: new Audio("/assets/PomodoroChime/StartPomodoroChime.mp3"),
  startBreak:    new Audio("/assets/PomodoroChime/StartBreakTimeChime.mp3"),
  pause:         new Audio("/assets/PomodoroChime/PauseChime.mp3"),
  reset:         new Audio("/assets/PomodoroChime/ResetPomodoroChime.mp3"),
  success:       new Audio("/assets/PomodoroChime/SuccessChime.mp3"),
};

const playChime = (audio: HTMLAudioElement) => {
  audio.currentTime = 0;
  audio.play().catch(() => {});
};

type Phase  = "idle" | "focus" | "break";
type Dialog = "break-prompt" | "next-prompt" | "cancel-confirm" | "skip-break-confirm" | null;

const SPRING = { type: "spring", stiffness: 500, damping: 24, mass: 0.9 } as const;

interface PomodoroWidgetProps {
  focusMinutes:   number;
  breakMinutes:   number;
  totalSessions:  number;
}

export function PomodoroWidget({ focusMinutes, breakMinutes, totalSessions }: PomodoroWidgetProps) {
  const { t } = useTranslation();
  const { user } = useAuth();

  const focusTotal = focusMinutes * 60;
  const breakTotal = breakMinutes * 60;

  const [phase,            setPhase]            = useState<Phase>("idle");
  const [seconds,          setSeconds]          = useState(focusTotal);
  const [running,          setRunning]          = useState(false);
  const [session,          setSession]          = useState(1);
  const [dialog,           setDialog]           = useState<Dialog>(null);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const startingRef = useRef(false); // guard against concurrent start calls

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
    const id = setInterval(() => setSeconds((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, [running]);

  /* ── Browser notification helper ── */
  const notify = (title: string, body: string) => {
    if (localStorage.getItem("notifications") !== "enabled") return;
    if (Notification.permission !== "granted") return;
    new Notification(title, { body, icon: "/favicon.ico" });
  };

  /* ── Timer hits 0 ── */
  useEffect(() => {
    if (seconds === 0 && running) {
      setRunning(false);
      if (phase === "focus") {
        playChime(chime.success);
        notify(t("pomodoroWidget.focusEndTitle"), t("pomodoroWidget.focusEndBody"));
        if (user && currentSessionId) {
          pomodoroService.end(currentSessionId).catch(() => {});
          setCurrentSessionId(null);
        }
        setSession((s) => s + 1);
        setPhase("idle");
        setDialog("break-prompt");
      } else if (phase === "break") {
        playChime(chime.success);
        notify(t("pomodoroWidget.breakEndTitle"), t("pomodoroWidget.breakEndBody"));
        setPhase("idle");
        setDialog("next-prompt");
      }
    }
  }, [seconds, running, phase]);

  /* ── Helpers ── */
  const startFocus = async () => {
    if (startingRef.current) return; // prevent double-click / concurrent calls
    startingRef.current = true;

    setPhase("focus");
    setSeconds(focusTotal);
    setRunning(true);
    setDialog(null);
    playChime(chime.startPomodoro);

    if (user) {
      try {
        const s = await pomodoroService.start(focusMinutes);
        setCurrentSessionId(s.id);
      } catch {
        // silent — timer vẫn chạy local, không block UX
      }
    }

    startingRef.current = false;
  };

  const startBreak = () => {
    playChime(chime.startBreak);
    setPhase("break");
    setSeconds(breakTotal);
    setRunning(true);
    setDialog(null);
  };

  const skipToNext = () => { setDialog(null); startFocus(); };

  const performReset = () => {
    playChime(chime.reset);
    startingRef.current = false;
    setRunning(false);
    setPhase("idle");
    setSeconds(focusTotal);
    setDialog(null);
    setSession(1);
    setCurrentSessionId(null);
  };

  const resetAll = performReset;

  const stopWithoutReset = () => {
    startingRef.current = false;
    setRunning(false);
    setPhase("idle");
    setSeconds(focusTotal);
    setDialog(null);
    setCurrentSessionId(null);
  };

  const handleResetClick = () => {
    if (user && currentSessionId) {
      setDialog("cancel-confirm");
    } else {
      performReset();
    }
  };

  const confirmCancel = () => {
    if (user && currentSessionId) {
      pomodoroService.cancel(currentSessionId).catch(() => {});
    }
    performReset();
  };

  const togglePlay = () => {
    if (phase === "idle") {
      startFocus();
    } else if (running) {
      playChime(chime.pause);
      setRunning(false);
    } else {
      playChime(phase === "break" ? chime.startBreak : chime.startPomodoro);
      setRunning(true);
    }
  };

  const gradId = isBreak ? "timerGradBreak" : "timerGradFocus";

  return (
    <Box
      position="relative"
      style={{
        background: "rgba(var(--widget-bg-rgb), 0.78)",
        backdropFilter: "blur(18px)",
        WebkitBackdropFilter: "blur(18px)",
        border: "1px solid rgba(var(--accent-rgb), 0.18)",
        borderRadius: "16px",
        padding: "20px 22px",
        overflow: "hidden",
        minWidth: 224,
      }}
    >
      {/* ── Header ── */}
      <Flex align="center" gap={2} justify="center" mb={3}>
        <Flame size={12} color={isBreak ? "#38bdf8" : "#f97316"} />
        <Text style={{ fontSize: "0.72rem", color: "rgba(var(--accent-light-rgb), 0.85)", letterSpacing: "0.1em", fontFamily: "'HarmonyOS Sans', sans-serif" }}>
          {isBreak ? t("pomodoroWidget.sessionBreak", { session }) : t("pomodoroWidget.sessionFocus", { session })}
        </Text>
      </Flex>

      {/* ── Phase pill ── */}
      <Flex justify="center" mb={4}>
        <Box style={{
          padding: "3px 14px", borderRadius: "20px", fontSize: "0.7rem",
          fontFamily: "'HarmonyOS Sans', sans-serif",
          color: isBreak ? "rgba(56,189,248,0.85)" : "rgba(var(--accent-light-rgb), 0.88)",
          background: isBreak ? "rgba(56,189,248,0.1)" : "rgba(var(--accent-rgb), 0.08)",
          border: isBreak ? "1px solid rgba(56,189,248,0.22)" : "1px solid rgba(var(--accent-rgb), 0.2)",
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
          <circle cx="85" cy="85" r={r} fill="none" style={{ stroke: "rgba(var(--accent-rgb), 0.12)" }} strokeWidth="9" />
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
          <Text style={{ fontSize: "0.65rem", color: isBreak ? "rgba(56,189,248,0.7)" : "rgba(var(--accent-light-rgb), 0.75)", marginTop: 4, letterSpacing: "0.1em", fontFamily: "'HarmonyOS Sans', sans-serif" }}>
            {isBreak ? t("pomodoroWidget.breakLabel") : t("pomodoroWidget.remaining")}
          </Text>
        </Flex>
      </Box>

      {/* ── Controls ── */}
      <Flex align="center" justify="center" gap={3} mt={4}>
        <Box as="button" onClick={handleResetClick}
          borderRadius="full" display="flex" alignItems="center" justifyContent="center"
          style={{ width: 38, height: 38, background: "rgba(var(--accent-rgb), 0.1)", border: "1px solid rgba(var(--accent-rgb), 0.3)", cursor: "pointer" }}>
          <RotateCcw size={14} color="rgba(var(--accent-light-rgb), 0.85)" />
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
        <Box as="button"
          onClick={() => { if (isBreak) { setRunning(false); setDialog("skip-break-confirm"); } }}
          borderRadius="full" display="flex" alignItems="center" justifyContent="center"
          title={isBreak ? t("pomodoroWidget.skipBreakTooltip") : ""}
          style={{
            width: 38, height: 38,
            background: "rgba(var(--accent-rgb), 0.1)", border: "1px solid rgba(var(--accent-rgb), 0.3)",
            cursor: isBreak ? "pointer" : "default",
            opacity: isBreak ? 1 : 0.35,
            transition: "opacity 0.2s",
          }}>
          <Zap size={14} color={isBreak ? "#38bdf8" : "rgba(var(--accent-light-rgb), 0.85)"} />
        </Box>
      </Flex>

      {/* ── Session dots ── */}
      <Flex gap="6px" justify="center" mt={4} flexWrap="wrap"
        style={{ maxWidth: 160, margin: "16px auto 0" }}>
        {Array.from({ length: totalSessions }, (_, i) => i + 1).map((i) => (
          <Box key={i} borderRadius="full" style={{
            width: 8, height: 8,
            background: i < session ? "var(--accent)" : i === session ? "rgba(var(--accent-light-rgb), 0.6)" : "rgba(var(--accent-rgb), 0.18)",
            border: "1px solid rgba(var(--accent-rgb), 0.35)",
            transition: "background 0.3s",
            flexShrink: 0,
          }} />
        ))}
      </Flex>
      <Text mt={3} textAlign="center" style={{ fontSize: "0.72rem", color: "rgba(var(--accent-rgb), 0.7)", fontFamily: "'HarmonyOS Sans', sans-serif" }}>
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
            {dialog === "cancel-confirm" && (
              <>
                <Text textAlign="center" mb={1} style={{ fontSize: "0.92rem", color: "rgba(255,255,255,0.92)", fontFamily: "'HarmonyOS Sans', sans-serif", fontWeight: 600 }}>
                  {t("pomodoroWidget.cancelConfirmTitle")}
                </Text>
                <Text textAlign="center" mb={5} style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.45)", fontFamily: "'HarmonyOS Sans', sans-serif", lineHeight: 1.5 }}>
                  {t("pomodoroWidget.cancelConfirmDesc")}
                </Text>
                <Flex gap={2} w="100%">
                  <Box as="button" flex={1} py="9px" borderRadius="10px" onClick={confirmCancel}
                    style={{ background: "linear-gradient(135deg,#f97316,#ef4444)", color: "#fff", fontSize: "0.78rem", fontFamily: "'HarmonyOS Sans', sans-serif", fontWeight: 600, border: "none", cursor: "pointer", boxShadow: "0 4px 16px rgba(249,115,22,0.3)" }}>
                    {t("pomodoroWidget.cancelConfirmBtn")}
                  </Box>
                  <Box as="button" flex={1} py="9px" borderRadius="10px" onClick={() => setDialog(null)}
                    style={{ background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.6)", fontSize: "0.78rem", fontFamily: "'HarmonyOS Sans', sans-serif", border: "1px solid rgba(255,255,255,0.12)", cursor: "pointer" }}>
                    {t("pomodoroWidget.cancelKeepBtn")}
                  </Box>
                </Flex>
              </>
            )}

            {dialog === "skip-break-confirm" && (
              <>
                <Text textAlign="center" mb={1} style={{ fontSize: "0.92rem", color: "rgba(255,255,255,0.92)", fontFamily: "'HarmonyOS Sans', sans-serif", fontWeight: 600 }}>
                  {t("pomodoroWidget.skipBreakTitle")}
                </Text>
                <Text textAlign="center" mb={5} style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.45)", fontFamily: "'HarmonyOS Sans', sans-serif", lineHeight: 1.5 }}>
                  {t("pomodoroWidget.skipBreakDesc")}
                </Text>
                <Flex gap={2} w="100%">
                  <Box as="button" flex={1} py="9px" borderRadius="10px"
                    onClick={() => { setDialog(null); setRunning(true); }}
                    style={{ background: "linear-gradient(135deg,#38bdf8,#818cf8)", color: "#fff", fontSize: "0.78rem", fontFamily: "'HarmonyOS Sans', sans-serif", fontWeight: 600, border: "none", cursor: "pointer", boxShadow: "0 4px 16px rgba(56,189,248,0.3)" }}>
                    {t("pomodoroWidget.skipBreakCancel")}
                  </Box>
                  <Box as="button" flex={1} py="9px" borderRadius="10px"
                    onClick={() => { setPhase("idle"); setDialog("next-prompt"); }}
                    style={{ background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.6)", fontSize: "0.78rem", fontFamily: "'HarmonyOS Sans', sans-serif", border: "1px solid rgba(255,255,255,0.12)", cursor: "pointer" }}>
                    {t("pomodoroWidget.skipBreakConfirm")}
                  </Box>
                </Flex>
              </>
            )}

            {dialog === "break-prompt" && (
              <>
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
                <Text textAlign="center" mb={1} style={{ fontSize: "0.92rem", color: "rgba(255,255,255,0.92)", fontFamily: "'HarmonyOS Sans', sans-serif", fontWeight: 600 }}>
                  {session > totalSessions ? t("pomodoroWidget.allDoneTitle") : t("pomodoroWidget.readyNextTitle")}
                </Text>
                <Text textAlign="center" mb={5} style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.45)", fontFamily: "'HarmonyOS Sans', sans-serif", lineHeight: 1.5 }}>
                  {session > totalSessions
                    ? t("pomodoroWidget.allDoneDesc", { total: totalSessions })
                    : t("pomodoroWidget.nextSessionDesc", { next: session, total: totalSessions, minutes: focusMinutes })}
                </Text>
                <Flex gap={2} w="100%">
                  {session <= totalSessions && (
                    <Box as="button" flex={1} py="9px" borderRadius="10px" onClick={skipToNext}
                      style={{ background: "linear-gradient(135deg,#4ade80,#38bdf8)", color: "#0d2b24", fontSize: "0.78rem", fontFamily: "'HarmonyOS Sans', sans-serif", fontWeight: 600, border: "none", cursor: "pointer", boxShadow: "0 4px 16px rgba(74,222,128,0.28)" }}>
                      {t("pomodoroWidget.startNext", { next: session })}
                    </Box>
                  )}
                  <Box as="button" flex={1} py="9px" borderRadius="10px"
                    onClick={session > totalSessions ? resetAll : stopWithoutReset}
                    style={{
                      background: session > totalSessions ? "linear-gradient(135deg,#4ade80,#38bdf8)" : "rgba(255,255,255,0.07)",
                      color: session > totalSessions ? "#0d2b24" : "rgba(255,255,255,0.6)",
                      fontSize: "0.78rem", fontFamily: "'HarmonyOS Sans', sans-serif",
                      fontWeight: session > totalSessions ? 600 : 400,
                      border: session > totalSessions ? "none" : "1px solid rgba(255,255,255,0.12)",
                      cursor: "pointer",
                    }}>
                    {session > totalSessions ? t("pomodoroWidget.restart") : t("pomodoroWidget.stop")}
                  </Box>
                </Flex>
              </>
            )}
          </MotionBox>
        )}
      </AnimatePresence>

      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 0.4; } 50% { opacity: 0.8; } }
      `}</style>
    </Box>
  );
}
