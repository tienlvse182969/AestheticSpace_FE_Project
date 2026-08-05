import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { useTranslation } from "react-i18next";
import type { BreathingPattern } from "../../../../hooks/studyspace/useWellnessSettings";

type PhaseKind = "inhale" | "hold" | "exhale";

interface Phase {
  kind: PhaseKind;
  seconds: number;
  scale: number;
}

const PATTERNS: Record<BreathingPattern, Phase[]> = {
  box: [
    { kind: "inhale", seconds: 4, scale: 1.35 },
    { kind: "hold",   seconds: 4, scale: 1.35 },
    { kind: "exhale", seconds: 4, scale: 0.85 },
    { kind: "hold",   seconds: 4, scale: 0.85 },
  ],
  "478": [
    { kind: "inhale", seconds: 4, scale: 1.35 },
    { kind: "hold",   seconds: 7, scale: 1.35 },
    { kind: "exhale", seconds: 8, scale: 0.85 },
  ],
  "462": [
    { kind: "inhale", seconds: 4, scale: 1.35 },
    { kind: "exhale", seconds: 6, scale: 0.85 },
    { kind: "hold",   seconds: 2, scale: 0.85 },
  ],
};

interface BreathingCircleProps {
  pattern: BreathingPattern;
  cycleCount: number; // 0 = unlimited
}

export function BreathingCircle({ pattern, cycleCount }: BreathingCircleProps) {
  const { t } = useTranslation();
  const phases = PATTERNS[pattern];
  const [running, setRunning] = useState(false);
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(phases[0].seconds);
  const cyclesRef = useRef(0);

  useEffect(() => {
    setRunning(false);
    setPhaseIndex(0);
    setSecondsLeft(phases[0].seconds);
    cyclesRef.current = 0;
  }, [pattern]);

  useEffect(() => {
    if (!running) return;
    const tick = setInterval(() => {
      setSecondsLeft(s => {
        if (s > 1) return s - 1;
        setPhaseIndex(i => {
          const next = (i + 1) % phases.length;
          if (next === 0) cyclesRef.current += 1;
          if (cycleCount > 0 && cyclesRef.current >= cycleCount && next === 0) {
            setRunning(false);
          }
          return next;
        });
        return 0;
      });
    }, 1000);
    return () => clearInterval(tick);
  }, [running, phases, cycleCount]);

  useEffect(() => {
    if (running) setSecondsLeft(phases[phaseIndex].seconds);
  }, [phaseIndex]); // eslint-disable-line react-hooks/exhaustive-deps

  const current = phases[phaseIndex];

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, padding: "6px 0" }}>
      <div style={{ position: "relative", width: 96, height: 96, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <motion.div
          animate={{ scale: running ? current.scale : 1 }}
          transition={{ duration: running ? current.seconds : 0.3, ease: "easeInOut" }}
          style={{
            width: 64, height: 64, borderRadius: "50%",
            background: "radial-gradient(circle, rgba(103,232,249,0.5) 0%, rgba(103,232,249,0.12) 70%)",
            border: "1px solid rgba(103,232,249,0.4)",
          }}
        />
        {running && (
          <div style={{ position: "absolute", fontSize: "1rem", fontWeight: 700, color: "rgba(255,255,255,0.85)", fontFamily: "'HarmonyOS Sans', sans-serif" }}>
            {secondsLeft}
          </div>
        )}
      </div>
      <div style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.7)", fontFamily: "'HarmonyOS Sans', sans-serif", minHeight: 18 }}>
        {running ? t(`wellness.${current.kind}`) : t("wellness.ready")}
      </div>
      <button
        onClick={() => setRunning(r => !r)}
        style={{
          padding: "6px 18px", borderRadius: 20,
          background: running ? "rgba(248,113,113,0.14)" : "rgba(103,232,249,0.14)",
          border: running ? "1px solid rgba(248,113,113,0.35)" : "1px solid rgba(103,232,249,0.35)",
          color: running ? "#f87171" : "#67e8f9",
          fontSize: "0.74rem", fontFamily: "'HarmonyOS Sans', sans-serif", cursor: "pointer",
        }}
      >
        {running ? t("wellness.stop") : t("wellness.start")}
      </button>
    </div>
  );
}
