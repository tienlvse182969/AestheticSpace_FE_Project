import { useState } from "react";
import { Box, Flex, Text } from "@chakra-ui/react";
import { RefreshCw } from "lucide-react";

/* ── Quote bank ──────────────────────────────────────────────────────────── */
const QUOTES: { text: string; author: string }[] = [
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "It always seems impossible until it's done.", author: "Nelson Mandela" },
  { text: "Don't watch the clock; do what it does — keep going.", author: "Sam Levenson" },
  { text: "Success is the sum of small efforts repeated day in and day out.", author: "Robert Collier" },
  { text: "You don't have to be great to start, but you have to start to be great.", author: "Zig Ziglar" },
  { text: "An investment in knowledge pays the best interest.", author: "Benjamin Franklin" },
  { text: "The beautiful thing about learning is nobody can take it away from you.", author: "B.B. King" },
  { text: "Education is not the filling of a pail, but the lighting of a fire.", author: "W.B. Yeats" },
  { text: "Live as if you were to die tomorrow. Learn as if you were to live forever.", author: "Mahatma Gandhi" },
  { text: "The more that you read, the more things you will know.", author: "Dr. Seuss" },
  { text: "Strive for progress, not perfection.", author: "Unknown" },
  { text: "Focus on being productive instead of busy.", author: "Tim Ferriss" },
  { text: "Your future is created by what you do today, not tomorrow.", author: "Robert Kiyosaki" },
  { text: "Small daily improvements over time lead to stunning results.", author: "Robin Sharma" },
  { text: "The expert in anything was once a beginner.", author: "Helen Hayes" },
  { text: "Discipline is the bridge between goals and accomplishment.", author: "Jim Rohn" },
  { text: "Knowledge is power. Information is liberating.", author: "Kofi Annan" },
  { text: "One hour per day of study in your chosen field is all it takes.", author: "Earl Nightingale" },
  { text: "Reading is to the mind what exercise is to the body.", author: "Joseph Addison" },
  { text: "The capacity to learn is a gift; the ability to learn is a skill.", author: "Brian Herbert" },
  { text: "You are never too old to set another goal or dream a new dream.", author: "C.S. Lewis" },
  { text: "Either you run the day, or the day runs you.", author: "Jim Rohn" },
  { text: "Creativity is intelligence having fun.", author: "Albert Einstein" },
  { text: "What we learn with pleasure we never forget.", author: "Alfred Mercier" },
  { text: "Hardships often prepare ordinary people for an extraordinary destiny.", author: "C.S. Lewis" },
  { text: "A year from now you may wish you had started today.", author: "Karen Lamb" },
  { text: "Study hard, for the well is deep and our brains are shallow.", author: "Richard Baxter" },
  { text: "The mind is not a vessel to be filled but a fire to be kindled.", author: "Plutarch" },
  { text: "Knowing is not enough; we must apply.", author: "Bruce Lee" },
  { text: "Push yourself because no one else is going to do it for you.", author: "Unknown" },
];

/* ── Day-of-year for deterministic daily quote ───────────────────────────── */
function getDayOfYear(): number {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  return Math.floor((now.getTime() - start.getTime()) / 86_400_000);
}

/* ── Component ───────────────────────────────────────────────────────────── */
export function QuoteWidget() {
  const daily = getDayOfYear() % QUOTES.length;
  const [idx, setIdx] = useState(daily);
  const [spinning, setSpinning] = useState(false);

  const quote = QUOTES[idx];

  const shuffle = () => {
    if (spinning) return;
    setSpinning(true);
    const next = (idx + 1) % QUOTES.length;
    setIdx(next);
    setTimeout(() => setSpinning(false), 400);
  };

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
          color: "rgba(255,255,255,0.82)",
          lineHeight: 1.65,
          fontStyle: "italic",
          letterSpacing: "0.01em",
          minHeight: "52px",
        }}
      >
        {quote.text}
      </Text>

      {/* ── Divider ── */}
      <Box
        style={{
          height: 1,
          background: "rgba(255,255,255,0.07)",
          margin: "12px 0 10px",
        }}
      />

      {/* ── Author + refresh ── */}
      <Flex align="center" justify="space-between">
        <Text
          style={{
            fontSize: "0.7rem",
            fontFamily: "'HarmonyOS Sans', sans-serif",
            color: "#2dd4bf",
            opacity: 0.7,
            letterSpacing: "0.04em",
          }}
        >
          — {quote.author}
        </Text>

        <Box
          as="button"
          onClick={shuffle}
          display="flex"
          alignItems="center"
          justifyContent="center"
          w="26px"
          h="26px"
          borderRadius="full"
          border="none"
          cursor="pointer"
          title="Next quote"
          style={{
            background: "rgba(45,212,191,0.1)",
            color: "rgba(45,212,191,0.6)",
            transition: "background 0.18s, color 0.18s",
            flexShrink: 0,
          }}
          _hover={{ background: "rgba(45,212,191,0.22)", color: "#2dd4bf" }}
        >
          <RefreshCw
            size={12}
            style={{
              transition: "transform 0.4s cubic-bezier(0.4,0,0.2,1)",
              transform: spinning ? "rotate(360deg)" : "rotate(0deg)",
            }}
          />
        </Box>
      </Flex>
    </Box>
  );
}
