import { useState, useEffect, useRef } from "react";
import { Box, Flex, Text } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import { convertSolar2Lunar, getLunarYearName } from "../../utils/lunarCalendar";
import type { ClockMode, DigitalLayout } from "../../types";

// Re-export types so ClockSettingsPanel can import from types.ts cleanly
export type { ClockMode, DigitalLayout };

// ─────────────────────────────────────────────────────────────────────────────

interface ClockWidgetProps {
  mode: ClockMode;
  layout: DigitalLayout;
  showSeconds: boolean;
  showLunar: boolean;
  showDate: boolean;
}

export function ClockWidget({ mode, layout, showSeconds, showLunar, showDate }: ClockWidgetProps) {
  const { t } = useTranslation();
  const [now, setNow] = useState(new Date());

  // 50 ms tick → 20 fps, enough for buttery-smooth sweep
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 50);
    return () => clearInterval(timer);
  }, []);

  // ── formatted values ──────────────────────────────────────────────────────
  const hh = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");
  const ss = String(now.getSeconds()).padStart(2, "0");

  const days    = t("clockWidget.days",   { returnObjects: true }) as string[];
  const months  = t("clockWidget.months", { returnObjects: true }) as string[];
  const dayName = days[now.getDay()];
  const dateStr = t("clockWidget.dateStr", {
    month:    months[now.getMonth()],
    monthNum: now.getMonth() + 1,
    date:     now.getDate(),
    year:     now.getFullYear(),
  });

  // ── lunar calendar ────────────────────────────────────────────────────────
  const [lDay, lMonth, lYear, lLeap] = convertSolar2Lunar(
    now.getDate(), now.getMonth() + 1, now.getFullYear()
  );
  const lunarYearName = getLunarYearName(lYear);
  const lunarStr = t("clockWidget.lunarStr", {
    day:   lDay,
    month: lMonth,
    leap:  lLeap ? t("clockWidget.lunarLeap") : "",
    year:  lunarYearName,
  });

  // ── digital seconds arc (ms-smooth) ──────────────────────────────────────
  const r      = 28;
  const circ   = 2 * Math.PI * r;
  const secFrac = (now.getSeconds() + now.getMilliseconds() / 1000) / 60;
  const dash   = circ * secFrac;

  // ── analog angles (ms-precision → continuous sweep) ───────────────────────
  const msFrac   = now.getMilliseconds() / 1000;
  // smooth raw angle 0-360 per minute
  const rawSecAngle = (now.getSeconds() + msFrac) * 6;
  const minAngle    = (now.getMinutes() + (now.getSeconds() + msFrac) / 60) * 6;
  const hrAngle     = ((now.getHours() % 12) + (now.getMinutes() + (now.getSeconds() + msFrac) / 60) / 60) * 30;

  // Accumulated second angle — prevents backward snap at 59 s → 0 s
  const prevRawSecRef = useRef(rawSecAngle);
  const accSecRef     = useRef(rawSecAngle);
  const delta = rawSecAngle - prevRawSecRef.current;
  if (Math.abs(delta) > 0) {
    // If wrapped (delta strongly negative, e.g. 354 → 0 = -354), add 360
    accSecRef.current  += delta < -180 ? delta + 360 : delta;
    prevRawSecRef.current = rawSecAngle;
  }

  return (
    <Box style={{
      background: "rgba(12,18,22,0.75)",
      backdropFilter: "blur(18px)",
      WebkitBackdropFilter: "blur(18px)",
      border: "1px solid rgba(255,255,255,0.1)",
      borderRadius: "16px",
      padding: "14px 16px 14px",
    }}>

      {/* ── Clock body ───────────────────────────────────────────────────── */}
      {mode === "digital" ? (
        layout === "horizontal"
          ? <DigitalHorizontal hh={hh} mm={mm} ss={ss} showSeconds={showSeconds} />
          : <DigitalVertical   hh={hh} mm={mm} ss={ss} showSeconds={showSeconds} secFrac={secFrac} />
      ) : (
        <AnalogFace
          hrAngle={hrAngle}
          minAngle={minAngle}
          secAngle={accSecRef.current}
          showSeconds={showSeconds}
        />
      )}

      {/* ── Date: day + date on one line ─────────────────────────────────── */}
      {showDate && (
        <Text mt="10px" style={{
          fontSize: "0.68rem",
          color: "rgba(255,255,255,0.3)",
          fontFamily: "'HarmonyOS Sans', sans-serif",
          textAlign: "center",
          letterSpacing: "0.04em",
        }}>
          {dayName},&nbsp;{dateStr}
        </Text>
      )}

      {/* ── Lunar calendar ───────────────────────────────────────────────── */}
      {showDate && showLunar && (
        <Flex align="center" justify="center" gap="6px" mt="5px">
          <Box style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.07)", borderRadius: 1 }} />
          <Text style={{
            fontSize: "0.65rem",
            color: "rgba(251,191,36,0.6)",
            fontFamily: "'HarmonyOS Sans', sans-serif",
            whiteSpace: "nowrap",
            letterSpacing: "0.02em",
          }}>
            {lunarStr}
          </Text>
          <Box style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.07)", borderRadius: 1 }} />
        </Flex>
      )}

      <style>{`
        @keyframes colonBlink {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.15; }
        }
      `}</style>
    </Box>
  );
}

// ─── Digital Horizontal ───────────────────────────────────────────────────────

function DigitalHorizontal({ hh, mm, ss, showSeconds }: {
  hh: string; mm: string; ss: string;
  showSeconds: boolean;
}) {
  return (
    <Flex align="baseline" justify="center" gap="2px">
      <Text style={{
        fontSize: "2.75rem",
        color: "#fff",
        letterSpacing: "-0.01em",
        lineHeight: 1,
        fontFamily: "'HarmonyOS Sans', sans-serif",
        fontWeight: "600",
      }}>
        {hh}
        <Box as="span" style={{
          color: "rgba(255,255,255,0.28)",
          margin: "0 1px",
          animation: showSeconds ? undefined : "colonBlink 1s step-end infinite",
        }}>:</Box>
        {mm}
        {showSeconds && (
          <>
            <Box as="span" style={{
              color: "rgba(255,255,255,0.28)",
              margin: "0 1px",
            }}>:</Box>
            <Box as="span">{ss}</Box>
          </>
        )}
      </Text>
    </Flex>
  );
}

// ─── Digital Vertical ─────────────────────────────────────────────────────────

function DigitalVertical({ hh, mm, ss, showSeconds, secFrac }: {
  hh: string; mm: string; ss: string;
  showSeconds: boolean;
  secFrac: number;
}) {
  const size = 164;
  const cx = size / 2, cy = size / 2;
  const r    = 76;
  const circ = 2 * Math.PI * r;
  const dash = circ * secFrac;

  const digits = (
    <Flex direction="column" align="center" gap="2px">
      {[hh, mm].map((val, i) => (
        <Text key={i} style={{
          fontSize: "3.2rem",
          color: "#fff",
          letterSpacing: "0.02em",
          lineHeight: 1.05,
          fontFamily: "'HarmonyOS Sans', sans-serif",
          fontWeight: "600",
          textAlign: "center",
        }}>
          {val}
        </Text>
      ))}
    </Flex>
  );

  if (!showSeconds) return (
    <Flex justify="center" align="center" style={{ width: "100%" }}>
      {digits}
    </Flex>
  );

  return (
    <Box mx="auto" position="relative" style={{ width: size, height: size }}>
      <svg
        width={size} height={size}
        style={{ position: "absolute", top: 0, left: 0, transform: "rotate(-90deg)" }}
      >
        {/* track */}
        <circle cx={cx} cy={cy} r={r} fill="none"
          stroke="rgba(251,191,36,0.1)" strokeWidth={4} />
        {/* progress arc */}
        <circle cx={cx} cy={cy} r={r} fill="none"
          stroke="url(#vSecGrad)" strokeWidth={4} strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
          style={{ transition: "stroke-dasharray 0.45s ease" }}
        />
        <defs>
          <linearGradient id="vSecGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"   stopColor="#fbbf24" />
            <stop offset="100%" stopColor="#f97316" />
          </linearGradient>
        </defs>
      </svg>
      <Flex position="absolute" inset={0} align="center" justify="center">
        {digits}
      </Flex>
    </Box>
  );
}

// ─── Analog Face ──────────────────────────────────────────────────────────────

function AnalogFace({ hrAngle, minAngle, secAngle, showSeconds }: {
  hrAngle: number; minAngle: number; secAngle: number; showSeconds: boolean;
}) {
  const cx = 86, cy = 86, size = 172;
  const toRad = (deg: number) => (deg - 90) * (Math.PI / 180);

  const handEnd = (angleDeg: number, length: number) => ({
    x: cx + length * Math.cos(toRad(angleDeg)),
    y: cy + length * Math.sin(toRad(angleDeg)),
  });
  const tailEnd = (angleDeg: number, length: number) => ({
    x: cx - length * Math.cos(toRad(angleDeg)),
    y: cy - length * Math.sin(toRad(angleDeg)),
  });

  const hr  = handEnd(hrAngle,  44);
  const mn  = handEnd(minAngle, 62);
  const sc  = handEnd(secAngle, 65);
  const scT = tailEnd(secAngle, 14);

  return (
    <Box mx="auto" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle cx={cx} cy={cy} r={80} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={1.5} />
        <circle cx={cx} cy={cy} r={78} fill="rgba(0,0,0,0.18)" />

        {Array.from({ length: 60 }, (_, i) => {
          const isHour    = i % 5  === 0;
          const isQuarter = i % 15 === 0;
          const angle = (i * 6 - 90) * (Math.PI / 180);
          const outer = 74;
          const inner = isQuarter ? 63 : isHour ? 66 : 70;
          return (
            <line key={i}
              x1={cx + outer * Math.cos(angle)} y1={cy + outer * Math.sin(angle)}
              x2={cx + inner * Math.cos(angle)} y2={cy + inner * Math.sin(angle)}
              stroke={isQuarter ? "rgba(255,255,255,0.55)" : isHour ? "rgba(255,255,255,0.28)" : "rgba(255,255,255,0.09)"}
              strokeWidth={isQuarter ? 2.5 : isHour ? 1.5 : 1}
              strokeLinecap="round"
            />
          );
        })}

        <line x1={cx} y1={cy} x2={hr.x} y2={hr.y}
          stroke="white" strokeWidth={3.5} strokeLinecap="round"
          style={{ transition: "x2 0.5s ease, y2 0.5s ease", filter: "drop-shadow(0 0 4px rgba(255,255,255,0.35))" }}
        />
        <line x1={cx} y1={cy} x2={mn.x} y2={mn.y}
          stroke="rgba(255,255,255,0.82)" strokeWidth={2} strokeLinecap="round"
          style={{ transition: "x2 0.5s ease, y2 0.5s ease" }}
        />
        {showSeconds && (
          <line x1={scT.x} y1={scT.y} x2={sc.x} y2={sc.y}
            stroke="#fbbf24" strokeWidth={1.5} strokeLinecap="round"
            style={{
              // No CSS transition — 50 ms tick already gives smooth continuous sweep
              filter: "drop-shadow(0 0 3px rgba(251,191,36,0.8))",
            }}
          />
        )}

        <circle cx={cx} cy={cy} r={5}   fill="rgba(255,255,255,0.9)" />
        <circle cx={cx} cy={cy} r={2.5} fill={showSeconds ? "#fbbf24" : "rgba(12,18,22,0.85)"} />
      </svg>
    </Box>
  );
}