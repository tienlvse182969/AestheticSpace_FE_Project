import { useEffect, useState, useCallback } from "react";
import { Box, Flex, Text } from "@chakra-ui/react";
import { motion, AnimatePresence } from "motion/react";
import { Gift, Coins, PartyPopper } from "lucide-react";
import { useTranslation } from "react-i18next";
import { LoadingRing } from "../../ui/LoadingRing";
import { PanelCloseBtn } from "../ui/PanelCloseBtn";
import { useCenteredPanel } from "../hooks/useCenteredPanel";
import { luckyDrawService, type LuckyDrawResult, type LuckyDrawHistoryItem } from "../../../../services/luckyDraw.service";
import { useAuth } from "../../../../context/AuthContext";

const MotionBox = motion.create(Box);

const PANEL_W = 380;
const PANEL_H = 640;
const WHEEL_SIZE = 232;

interface Prize {
  coins: number;
  key: string;
  color: string;
  textColor: string;
}

// Order mirrors the backend's reward table for /api/lucky-draw/spin.
// `key` maps to the `luckyDraw.prizes.*` i18n entries.
const PRIZES: Prize[] = [
  { coins: 10, key: "lucky", color: "#5b8def", textColor: "#ffffff" },
  { coins: 20, key: "bronze", color: "#b45309", textColor: "#ffffff" },
  { coins: 50, key: "silver", color: "#94a3b8", textColor: "#1a1a1a" },
  { coins: 100, key: "gold", color: "#f5b700", textColor: "#1a1a1a" },
  { coins: 200, key: "jackpot", color: "#a78bfa", textColor: "#ffffff" },
  { coins: 500, key: "bigJackpot", color: "#f472b6", textColor: "#ffffff" },
];

// Wheel is drawn as equal slices for legibility — real odds (shown in the legend below)
// are enforced server-side, not by slice size.
const SEGMENT_ANGLE = 360 / PRIZES.length;
const segmentCenter = (index: number) => index * SEGMENT_ANGLE + SEGMENT_ANGLE / 2;

const WHEEL_GRADIENT = `conic-gradient(from 0deg, ${PRIZES.map(
  (p, i) => `${p.color} ${i * SEGMENT_ANGLE}deg ${(i + 1) * SEGMENT_ANGLE}deg`
).join(", ")})`;

export function LuckyDrawPanel({
  onClose,
  onBalanceChange,
  onRemainingChange,
}: {
  onClose: () => void;
  onBalanceChange?: (newBalance: number) => void;
  onRemainingChange?: (remaining: number) => void;
}) {
  const { x, y, ref } = useCenteredPanel(PANEL_W, PANEL_H);
  const { user } = useAuth();
  const { t } = useTranslation();

  const [loading, setLoading] = useState(true);
  const [remainingDraws, setRemainingDraws] = useState(0);
  const [maxDraws, setMaxDraws] = useState(0);
  const [canSpin, setCanSpin] = useState(false);
  const [history, setHistory] = useState<LuckyDrawHistoryItem[]>([]);

  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [pendingResult, setPendingResult] = useState<LuckyDrawResult | null>(null);
  const [result, setResult] = useState<LuckyDrawResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    luckyDrawService
      .getStatus()
      .then((status) => {
        setRemainingDraws(status.remainingDrawsToday);
        setMaxDraws(status.maxDrawsToday);
        setCanSpin(status.canSpin);
        setHistory(status.drawHistoryToday ?? []);
        onRemainingChange?.(status.remainingDrawsToday);
      })
      .catch(() => setError(t("luckyDraw.loadError")))
      .finally(() => setLoading(false));
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSpin = useCallback(async () => {
    if (spinning || loading || !canSpin || remainingDraws <= 0) return;
    setError(null);
    setResult(null);
    setSpinning(true);
    try {
      const res = await luckyDrawService.spin();
      const prizeIndex = PRIZES.findIndex((p) => p.coins === res.rewardCoins);
      const targetCenter = segmentCenter(prizeIndex >= 0 ? prizeIndex : 0);

      // Land the fixed top pointer on the winning slice, always spinning forward.
      const currentMod = ((rotation % 360) + 360) % 360;
      const desiredMod = ((360 - targetCenter) % 360 + 360) % 360;
      let delta = desiredMod - currentMod;
      if (delta <= 0) delta += 360;
      const extraSpins = 4 + Math.floor(Math.random() * 3);

      setPendingResult(res);
      setRotation((prev) => prev + extraSpins * 360 + delta);
    } catch {
      setSpinning(false);
      setError(t("luckyDraw.spinError"));
    }
  }, [spinning, loading, canSpin, remainingDraws, rotation, t]);

  const handleSpinComplete = useCallback(() => {
    if (!spinning || !pendingResult) return;
    setSpinning(false);
    setResult(pendingResult);
    setRemainingDraws(pendingResult.remainingDrawsToday);
    setCanSpin(pendingResult.remainingDrawsToday > 0);
    onBalanceChange?.(pendingResult.newCoinsBalance);
    onRemainingChange?.(pendingResult.remainingDrawsToday);
    setHistory((prev) => [
      {
        id: `local-${Date.now()}`,
        rewardCoins: pendingResult.rewardCoins,
        rewardDescription: pendingResult.rewardDescription,
        createdAt: new Date().toISOString(),
      },
      ...prev,
    ]);
    setPendingResult(null);
  }, [spinning, pendingResult, onBalanceChange, onRemainingChange]);

  const spinDisabled = spinning || loading || !canSpin || remainingDraws <= 0;

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
        height: PANEL_H,
        borderRadius: "16px",
        background: "rgba(12,18,22,0.78)",
        backdropFilter: "blur(18px)",
        WebkitBackdropFilter: "blur(18px)",
        border: "1px solid rgba(255,255,255,0.1)",
        boxShadow: "0 24px 80px rgba(0,0,0,0.75), 0 0 0 1px rgba(255,255,255,0.08)",
        cursor: "grab",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* ── Header ── */}
      <Box pl="18px" pr="56px" pt="18px" pb="10px" flexShrink={0}>
        <PanelCloseBtn onClose={onClose} />

        <Flex align="center" gap={2}>
          <Gift size={15} style={{ color: "rgba(255,255,255,0.5)" }} />
          <Text
            style={{
              fontSize: "0.7rem",
              color: "rgba(255,255,255,0.35)",
              letterSpacing: "0.1em",
              fontFamily: "'HarmonyOS Sans', sans-serif",
            }}
          >
            {t("luckyDraw.title")}
          </Text>
        </Flex>

        <Flex align="center" gap="8px" mt="6px">
          <Text style={{ fontSize: "0.72rem", fontFamily: "'HarmonyOS Sans', sans-serif", color: "rgba(255,255,255,0.45)" }}>
            {t("luckyDraw.drawsToday")}
          </Text>
          <Flex
            align="center"
            gap="4px"
            style={{
              padding: "2px 8px",
              borderRadius: "20px",
              fontSize: "0.7rem",
              fontWeight: 700,
              fontFamily: "'HarmonyOS Sans', sans-serif",
              background: remainingDraws > 0 ? "rgba(74,222,128,0.15)" : "rgba(255,255,255,0.06)",
              border: remainingDraws > 0 ? "1px solid rgba(74,222,128,0.35)" : "1px solid rgba(255,255,255,0.1)",
              color: remainingDraws > 0 ? "#4ade80" : "rgba(255,255,255,0.35)",
            }}
          >
            {remainingDraws} / {maxDraws}
          </Flex>
        </Flex>
      </Box>

      {/* ── Body ── */}
      <Box flex={1} px="18px" pb="18px" style={{ overflowY: "auto" }}>
        {loading ? (
          <Flex h="100%" align="center" justify="center" direction="column" gap="12px">
            <LoadingRing size={28} />
          </Flex>
        ) : (
          <Flex direction="column" align="center" gap="18px">
            {/* Wheel */}
            <Box position="relative" style={{ width: WHEEL_SIZE, height: WHEEL_SIZE, marginTop: 4 }}>
              {/* Pointer */}
              <Box
                position="absolute"
                style={{
                  top: -4,
                  left: "50%",
                  transform: "translateX(-50%)",
                  zIndex: 3,
                  width: 0,
                  height: 0,
                  borderLeft: "9px solid transparent",
                  borderRight: "9px solid transparent",
                  borderTop: "16px solid #facc15",
                  filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.5))",
                }}
              />
              {/* Outer ring */}
              <Box
                position="absolute"
                inset={0}
                borderRadius="50%"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "3px solid rgba(255,255,255,0.15)",
                  boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
                }}
              />
              {/* Rotating wheel */}
              <MotionBox
                position="absolute"
                style={{
                  top: 6,
                  left: 6,
                  right: 6,
                  bottom: 6,
                  borderRadius: "50%",
                  background: WHEEL_GRADIENT,
                  border: "2px solid rgba(255,255,255,0.25)",
                  boxShadow: "inset 0 0 20px rgba(0,0,0,0.35)",
                }}
                animate={{ rotate: rotation }}
                transition={{ duration: 4.4, ease: [0.14, 0.8, 0.22, 1] } as any}
                onAnimationComplete={handleSpinComplete}
              >
                {PRIZES.map((p, i) => {
                  const mid = segmentCenter(i);
                  const flip = mid > 90 && mid < 270;
                  return (
                    <Box
                      key={p.coins}
                      position="absolute"
                      style={{ top: "50%", left: "50%", width: 0, height: 0, transform: `rotate(${mid}deg)` }}
                    >
                      <Box
                        style={{
                          position: "absolute",
                          top: -(WHEEL_SIZE / 2 - 34),
                          left: -38,
                          width: 76,
                          textAlign: "center",
                          transform: `rotate(${flip ? 180 : 0}deg)`,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: "0.62rem",
                            fontWeight: 700,
                            color: p.textColor,
                            fontFamily: "'HarmonyOS Sans', sans-serif",
                            lineHeight: 1.2,
                            textShadow: "0 1px 2px rgba(0,0,0,0.35)",
                          }}
                        >
                          {t(`luckyDraw.prizes.${p.key}`)}
                        </Text>
                        <Text
                          style={{
                            fontSize: "0.6rem",
                            fontWeight: 600,
                            color: p.textColor,
                            opacity: 0.9,
                            fontFamily: "'HarmonyOS Sans', sans-serif",
                          }}
                        >
                          {t("luckyDraw.coins", { count: p.coins })}
                        </Text>
                      </Box>
                    </Box>
                  );
                })}
              </MotionBox>

              {/* Center hub / spin button */}
              <Box
                as="button"
                onClick={handleSpin}
                position="absolute"
                style={{
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  width: 62,
                  height: 62,
                  borderRadius: "50%",
                  zIndex: 4,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: spinDisabled ? "rgba(60,60,60,0.85)" : "linear-gradient(145deg, #fde68a, #f59e0b)",
                  border: "3px solid rgba(255,255,255,0.3)",
                  boxShadow: spinDisabled ? "none" : "0 4px 18px rgba(245,158,11,0.55)",
                  cursor: spinDisabled ? "not-allowed" : "pointer",
                  color: spinDisabled ? "rgba(255,255,255,0.4)" : "#1a1a1a",
                  fontWeight: 800,
                  fontSize: "0.72rem",
                  fontFamily: "'HarmonyOS Sans', sans-serif",
                }}
              >
                {spinning ? "…" : t("luckyDraw.spin")}
              </Box>
            </Box>

            {error && (
              <Text style={{ fontSize: "0.75rem", color: "#f87171", fontFamily: "'HarmonyOS Sans', sans-serif", textAlign: "center" }}>
                {error}
              </Text>
            )}

            {!canSpin && remainingDraws <= 0 && !error && (
              <Text
                style={{
                  fontSize: "0.75rem",
                  color: "rgba(255,255,255,0.4)",
                  fontFamily: "'HarmonyOS Sans', sans-serif",
                  textAlign: "center",
                }}
              >
                {t("luckyDraw.noDrawsLeft")}
              </Text>
            )}

            {/* Prize legend */}
            <Box w="100%">
              <Text
                mb="6px"
                style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.35)", letterSpacing: "0.05em", fontFamily: "'HarmonyOS Sans', sans-serif" }}
              >
                {t("luckyDraw.prizesHeading")}
              </Text>
              <Flex direction="column" gap="4px">
                {PRIZES.map((p) => (
                  <Flex
                    key={p.coins}
                    align="center"
                    gap="6px"
                    style={{ padding: "5px 8px", borderRadius: "8px", background: "rgba(255,255,255,0.03)" }}
                  >
                    <Box style={{ width: 10, height: 10, borderRadius: "3px", background: p.color, flexShrink: 0 }} />
                    <Text style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.75)", fontFamily: "'HarmonyOS Sans', sans-serif" }}>
                      {t("luckyDraw.prizeLine", { label: t(`luckyDraw.prizes.${p.key}`), coins: p.coins })}
                    </Text>
                  </Flex>
                ))}
              </Flex>
            </Box>

            {/* History */}
            {history.length > 0 && (
              <Box w="100%">
                <Text
                  mb="6px"
                  style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.35)", letterSpacing: "0.05em", fontFamily: "'HarmonyOS Sans', sans-serif" }}
                >
                  {t("luckyDraw.historyHeading")}
                </Text>
                <Flex direction="column" gap="4px">
                  {history.slice(0, 10).map((h) => (
                    <Flex key={h.id} align="center" justify="space-between" style={{ padding: "4px 8px" }}>
                      <Text style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.55)", fontFamily: "'HarmonyOS Sans', sans-serif" }}>
                        {h.rewardDescription || t("luckyDraw.historyFallback")}
                      </Text>
                      <Flex align="center" gap="3px" style={{ color: "#facc15" }}>
                        <Coins size={10} />
                        <Text style={{ fontSize: "0.72rem", fontWeight: 600, fontFamily: "'HarmonyOS Sans', sans-serif" }}>
                          +{h.rewardCoins}
                        </Text>
                      </Flex>
                    </Flex>
                  ))}
                </Flex>
              </Box>
            )}
          </Flex>
        )}
      </Box>

      {/* ── Result overlay ── */}
      <AnimatePresence>
        {result && (
          <MotionBox
            key="result-overlay"
            position="absolute"
            inset={0}
            zIndex={10}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setResult(null)}
            style={{
              background: "rgba(6,10,14,0.88)",
              backdropFilter: "blur(6px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
          >
            <MotionBox
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1, transition: { type: "spring", stiffness: 400, damping: 20 } } as any}
              onClick={(e) => e.stopPropagation()}
              style={{
                width: 260,
                padding: "28px 20px",
                borderRadius: "16px",
                textAlign: "center",
                background: "rgba(20,26,32,0.95)",
                border: "1px solid rgba(250,204,21,0.35)",
                boxShadow: "0 0 40px rgba(250,204,21,0.25)",
              }}
            >
              <PartyPopper size={32} style={{ color: "#facc15", margin: "0 auto 10px" }} />
              <Text style={{ fontSize: "0.95rem", fontWeight: 700, color: "white", fontFamily: "'HarmonyOS Sans', sans-serif" }}>
                {t("luckyDraw.congrats")}
              </Text>
              <Text mt="4px" style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.6)", fontFamily: "'HarmonyOS Sans', sans-serif" }}>
                {result?.rewardDescription || t("luckyDraw.wonFallback")}
              </Text>
              <Flex align="center" justify="center" gap="6px" mt="10px">
                <Coins size={18} style={{ color: "#facc15" }} />
                <Text style={{ fontSize: "1.4rem", fontWeight: 800, color: "#facc15", fontFamily: "'HarmonyOS Sans', sans-serif" }}>
                  +{result?.rewardCoins}
                </Text>
              </Flex>
              <Box
                as="button"
                onClick={() => setResult(null)}
                mt="16px"
                style={{
                  padding: "8px 20px",
                  borderRadius: "10px",
                  border: "1px solid rgba(255,255,255,0.15)",
                  background: "rgba(255,255,255,0.06)",
                  color: "rgba(255,255,255,0.85)",
                  fontSize: "0.78rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: "'HarmonyOS Sans', sans-serif",
                }}
              >
                {t("luckyDraw.closeResult")}
              </Box>
            </MotionBox>
          </MotionBox>
        )}
      </AnimatePresence>
    </MotionBox>
  );
}
