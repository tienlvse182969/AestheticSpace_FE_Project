import { useState, useEffect, useRef } from "react";
import { Box, Flex, Text } from "@chakra-ui/react";
import { motion, AnimatePresence } from "motion/react";
import { RefreshCw } from "lucide-react";
import { useTranslation } from "react-i18next";
import { fetchQuote, type BilingualQuote } from "../../../../../services/quote.service";

const INTERVAL_MS  = 30 * 60 * 1000;
const MotionBox    = motion.create(Box);

export function QuoteWidget() {
  const { i18n } = useTranslation();
  const [quote,      setQuote]      = useState<BilingualQuote | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = () => {
    fetchQuote()
      .then(setQuote)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    timerRef.current = setInterval(load, INTERVAL_MS);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const handleRefresh = async () => {
    if (refreshing) return;
    setRefreshing(true);
    try {
      const q = await fetchQuote(true);
      setQuote(q);
    } catch {
      // keep current quote on error
    } finally {
      setRefreshing(false);
    }
  };

  const displayText = quote
    ? i18n.language === "vi" ? quote.textVi : quote.textEn
    : null;

  return (
    <Box
      style={{
        background: "rgba(var(--widget-bg-rgb), 0.78)",
        backdropFilter: "blur(18px)",
        WebkitBackdropFilter: "blur(18px)",
        border: "1px solid rgba(var(--accent-rgb), 0.18)",
        borderRadius: "16px",
        padding: "16px 16px 14px",
        width: "100%",
        boxSizing: "border-box",
      }}
    >
      {/* ── Decorative quote mark ── */}
      <Text
        style={{
          fontFamily: "Georgia, serif",
          fontSize: "2.6rem",
          lineHeight: 1,
          color: "#2dd4bf",
          opacity: 0.45,
          marginBottom: "-6px",
          userSelect: "none",
        }}
      >
        "
      </Text>

      {/* ── Quote text (animated on change) ── */}
      <Box style={{ minHeight: "52px" }}>
        <AnimatePresence mode="wait" initial={false}>
          <MotionBox
            key={quote?.textEn ?? "loading"}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.22, ease: "easeOut" } as any}
          >
            <Text
              style={{
                fontSize: "0.8rem",
                fontFamily: "'HarmonyOS Sans', sans-serif",
                color: loading || error ? "rgba(255,255,255,0.35)" : "rgba(255,255,255,0.82)",
                lineHeight: 1.65,
                fontStyle: "italic",
                letterSpacing: "0.01em",
              }}
            >
              {loading ? "Loading…" : error ? "Could not load quote." : displayText}
            </Text>
          </MotionBox>
        </AnimatePresence>
      </Box>

      {/* ── Divider ── */}
      <Box style={{ height: 1, background: "rgba(255,255,255,0.07)", margin: "12px 0 10px" }} />

      {/* ── Author + refresh button ── */}
      <Flex align="center" justify="space-between">
        <AnimatePresence mode="wait" initial={false}>
          <MotionBox
            key={quote?.author ?? "author"}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 } as any}
          >
            <Text
              style={{
                fontSize: "0.7rem",
                fontFamily: "'HarmonyOS Sans', sans-serif",
                color: "#2dd4bf",
                opacity: 0.7,
                letterSpacing: "0.04em",
              }}
            >
              {quote && !loading ? `— ${quote.author}` : ""}
            </Text>
          </MotionBox>
        </AnimatePresence>

        <Box
          as="button"
          onClick={handleRefresh}
          title="New quote"
          display="flex" alignItems="center" justifyContent="center"
          w="22px" h="22px" borderRadius="full"
          style={{
            background: "none",
            border: "none",
            cursor: refreshing ? "default" : "pointer",
            color: "rgba(255,255,255,0.28)",
            transition: "color 0.2s",
            flexShrink: 0,
          }}
          _hover={{ color: "rgba(255,255,255,0.65)" } as any}
        >
          <MotionBox
            animate={refreshing ? { rotate: 360 } : { rotate: 0 }}
            transition={refreshing
              ? { duration: 0.7, repeat: Infinity, ease: "linear" } as any
              : { duration: 0 } as any
            }
            display="flex" alignItems="center" justifyContent="center"
          >
            <RefreshCw size={12} />
          </MotionBox>
        </Box>
      </Flex>
    </Box>
  );
}
