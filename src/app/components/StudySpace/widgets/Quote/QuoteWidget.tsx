import { useState, useEffect, useRef } from "react";
import { Box, Text } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import { fetchQuote, type BilingualQuote } from "../../../../../services/quote.service";

const INTERVAL_MS = 30 * 60 * 1000;

export function QuoteWidget() {
  const { i18n } = useTranslation();
  const [quote, setQuote] = useState<BilingualQuote | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
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
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const displayText = quote
    ? i18n.language === "vi"
      ? quote.textVi
      : quote.textEn
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

      {/* ── Quote text ── */}
      <Text
        style={{
          fontSize: "0.8rem",
          fontFamily: "'HarmonyOS Sans', sans-serif",
          color: loading || error ? "rgba(255,255,255,0.35)" : "rgba(255,255,255,0.82)",
          lineHeight: 1.65,
          fontStyle: "italic",
          letterSpacing: "0.01em",
          minHeight: "52px",
        }}
      >
        {loading ? "Loading…" : error ? "Could not load quote." : displayText}
      </Text>

      {/* ── Divider ── */}
      <Box
        style={{
          height: 1,
          background: "rgba(255,255,255,0.07)",
          margin: "12px 0 10px",
        }}
      />

      {/* ── Author ── */}
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
    </Box>
  );
}
