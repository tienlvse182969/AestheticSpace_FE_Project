import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Box, Flex, Text } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import {
  Timer,
  Music2,
  Coffee,
  Wind,
  Waves,
  TreePine,
  Play,
  Pause,
  SkipForward,
  CheckSquare,
  Check,
  Clock,
  Flame,
  Sun,
  Moon,
  Mountain,
} from "lucide-react";

const MotionBox = motion.create(Box);

/* ─────────────── Slide 1: Pomodoro Timer ─────────────── */
function SlideTimer() {
  const { t } = useTranslation();
  const [seconds, setSeconds] = useState(1487);
  const [running, setRunning] = useState(true);
  const total = 25 * 60;
  const progress = seconds / total;
  const r = 88;
  const circ = 2 * Math.PI * r;
  const dash = circ * progress;

  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setSeconds((s) => (s > 0 ? s - 1 : total)), 1000);
    return () => clearInterval(t);
  }, [running, total]);

  const mins = String(Math.floor(seconds / 60)).padStart(2, "0");
  const secs = String(seconds % 60).padStart(2, "0");

  return (
    <Flex direction="column" align="center" gap={6} py={2} w="full">
      <Flex align="center" gap={2}>
        <Flame size={14} style={{ color: "#f97316" }} />
        <Text fontSize="0.8rem" color="#7aab97" letterSpacing="0.1em">
          {t("whyChooseUs.sessionInfo")}
        </Text>
      </Flex>

      <Box position="relative" w="220px" h="220px">
        <svg width="220" height="220" style={{ transform: "rotate(-90deg)" }}>
          <circle cx="110" cy="110" r={r} fill="none" stroke="rgba(74,166,134,0.12)" strokeWidth="10" />
          <circle
            cx="110" cy="110" r={r}
            fill="none"
            stroke="url(#timerGrad)"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={`${dash} ${circ}`}
            style={{ transition: "stroke-dasharray 0.8s ease" }}
          />
          <defs>
            <linearGradient id="timerGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#4ade80" />
              <stop offset="100%" stopColor="#38bdf8" />
            </linearGradient>
          </defs>
        </svg>
        <Flex
          position="absolute"
          inset={0}
          direction="column"
          align="center"
          justify="center"
        >
          <Text style={{ fontSize: "3rem", color: "#fff", letterSpacing: "0.04em", lineHeight: 1, fontWeight:"600" }}>
            {mins}:{secs}
          </Text>
          <Text style={{ fontSize: "0.75rem", color: "#7aab97", marginTop: 4 }}>
            {t("whyChooseUs.remaining")}
          </Text>
        </Flex>
      </Box>

      <Flex align="center" gap={4}>
        <Box
          as="button"
          borderRadius="full"
          display="flex"
          alignItems="center"
          justifyContent="center"
          transition="transform 0.2s"
          _hover={{ transform: "scale(1.05)" }}
          style={{ width: 44, height: 44, background: "rgba(74,166,134,0.12)", border: "1px solid rgba(74,166,134,0.3)", cursor: "pointer" }}
        >
          <SkipForward size={16} style={{ color: "#7aab97" }} />
        </Box>
        <Box
          as="button"
          onClick={() => setRunning((r) => !r)}
          borderRadius="full"
          display="flex"
          alignItems="center"
          justifyContent="center"
          transition="transform 0.2s"
          _hover={{ transform: "scale(1.05)" }}
          style={{ width: 56, height: 56, background: "linear-gradient(135deg, #4ade80, #38bdf8)", boxShadow: "0 0 20px rgba(74,222,128,0.35)", cursor: "pointer" }}
        >
          {running
            ? <Pause size={20} style={{ color: "#0d2b24" }} fill="#0d2b24" />
            : <Play size={20} style={{ color: "#0d2b24" }} fill="#0d2b24" />}
        </Box>
        <Box
          as="button"
          borderRadius="full"
          display="flex"
          alignItems="center"
          justifyContent="center"
          transition="transform 0.2s"
          _hover={{ transform: "scale(1.05)" }}
          style={{ width: 44, height: 44, background: "rgba(74,166,134,0.12)", border: "1px solid rgba(74,166,134,0.3)", cursor: "pointer" }}
        >
          <Clock size={16} style={{ color: "#7aab97" }} />
        </Box>
      </Flex>

      <Flex gap={2}>
        {[0, 1, 2, 3].map((i) => (
          <Box
            key={i}
            borderRadius="full"
            style={{
              width: 10, height: 10,
              background: i < 2 ? "#4ade80" : "rgba(74,166,134,0.2)",
              border: "1px solid rgba(74,222,128,0.4)"
            }}
          />
        ))}
      </Flex>

      <Text style={{ fontSize: "0.82rem", color: "#4d8a78", textAlign: "center" }}>
        2 sessions completed · Break in {mins}:{secs}
      </Text>
    </Flex>
  );
}

/* ─────────────── Slide 2: Soundscapes ─────────────── */
const sounds = [
  { icon: Coffee, label: "Café", color: "#fb923c", vol: 70, active: true },
  { icon: Waves, label: "Ocean", color: "#38bdf8", vol: 40, active: true },
  { icon: Wind, label: "Wind", color: "#a3e635", vol: 20, active: false },
  { icon: TreePine, label: "Forest", color: "#4ade80", vol: 55, active: true },
  { icon: Music2, label: "Lo-fi", color: "#c084fc", vol: 85, active: true },
  { icon: Timer, label: "White Noise", color: "#94a3b8", vol: 0, active: false },
];

function VolumeBar({ vol, color }: { vol: number; color: string }) {
  return (
    <Flex align="flex-end" gap="2px" h="18px">
      {Array.from({ length: 10 }).map((_, i) => (
        <Box
          key={i}
          borderRadius="sm"
          style={{
            width: 3,
            height: `${30 + i * 7}%`,
            background: i < Math.round((vol / 100) * 10) ? color : "rgba(255,255,255,0.1)",
            transition: "background 0.3s",
          }}
        />
      ))}
    </Flex>
  );
}

function SlideSound() {
  const { t } = useTranslation();
  const [vols] = useState(sounds.map((s) => s.vol));
  const [active, setActive] = useState(sounds.map((s) => s.active));

  return (
    <Flex direction="column" gap={4} py={2} w="full">
      <Text style={{ fontSize: "0.78rem", color: "#7aab97", letterSpacing: "0.1em", textAlign: "center" }}>
        {t("whyChooseUs.mixAtmosphere")}
      </Text>
      <Box display="grid" gridTemplateColumns="repeat(2, 1fr)" gap={3}>
        {sounds.map((s, i) => {
          const Icon = s.icon;
          return (
            <Box
              as="button"
              key={i}
              onClick={() => setActive((a) => a.map((v, j) => (j === i ? !v : v)))}
              borderRadius="xl"
              p={3}
              textAlign="left"
              transition="transform 0.2s"
              _hover={{ transform: "scale(1.02)" }}
              style={{
                background: active[i]
                  ? `linear-gradient(135deg, ${s.color}18, ${s.color}08)`
                  : "rgba(13,43,36,0.5)",
                border: `1px solid ${active[i] ? s.color + "40" : "rgba(74,166,134,0.1)"}`,
                cursor: "pointer",
              }}
            >
              <Flex align="center" justify="space-between" mb={2}>
                <Flex align="center" gap={2}>
                  <Icon size={14} style={{ color: active[i] ? s.color : "#4d8a78" }} />
                  <Text style={{ fontSize: "0.8rem", color: active[i] ? "#e2f5ef" : "#4d8a78" }}>
                    {s.label}
                  </Text>
                </Flex>
                <Flex
                  borderRadius="full"
                  align="center"
                  justify="center"
                  style={{ width: 16, height: 16, background: active[i] ? s.color : "rgba(74,166,134,0.15)" }}
                >
                  {active[i] && <Check size={9} style={{ color: "#0d2b24" }} strokeWidth={3} />}
                </Flex>
              </Flex>
              <VolumeBar vol={active[i] ? vols[i] : 0} color={s.color} />
            </Box>
          );
        })}
      </Box>

      <Flex
        borderRadius="xl"
        p={3}
        align="center"
        gap={3}
        style={{ background: "rgba(74,166,134,0.06)", border: "1px solid rgba(74,166,134,0.12)" }}
      >
        <Flex
          borderRadius="full"
          align="center"
          justify="center"
          flexShrink={0}
          style={{ width: 32, height: 32, background: "linear-gradient(135deg, #4ade80, #38bdf8)" }}
        >
          <Music2 size={14} style={{ color: "#0d2b24" }} />
        </Flex>
        <Box flex={1} minW={0}>
          <Text style={{ fontSize: "0.8rem", color: "#e2f5ef" }}>{t("whyChooseUs.nowMixing")}</Text>
          <Text style={{ fontSize: "0.72rem", color: "#4d8a78" }}>{t("whyChooseUs.layersActive")}</Text>
        </Box>
        <Flex align="flex-end" gap="2px" h="20px">
          {[4, 7, 5, 9, 6, 8, 4, 7].map((h, i) => (
            <motion.div
              key={i}
              style={{ width: 3, background: "#4ade80", borderRadius: 2 }}
              animate={{ height: [h * 2, h * 3.5, h * 1.5, h * 2.5, h * 2] }}
              transition={{ repeat: Infinity, duration: 0.9 + i * 0.1, ease: "easeInOut" }}
            />
          ))}
        </Flex>
      </Flex>
    </Flex>
  );
}

/* ─────────────── Slide 3: Backgrounds / Mood ─────────────── */
const bgScenes = [
  { label: "Misty Mountain", emoji: "🏔️", time: "Dawn", color: "#38bdf8", gradient: "linear-gradient(135deg, #0f4c75, #1b6ca8, #bdc3c7)" },
  { label: "Cozy Library", emoji: "📚", time: "Evening", color: "#fb923c", gradient: "linear-gradient(135deg, #3b1f0d, #7c4a1e, #c68642)" },
  { label: "Zen Garden", emoji: "🌿", time: "Morning", color: "#4ade80", gradient: "linear-gradient(135deg, #0d3b2e, #1a6644, #5cb85c)" },
  { label: "Rainy Café", emoji: "☕", time: "Night", color: "#c084fc", gradient: "linear-gradient(135deg, #1a0a2e, #3d1c72, #7b5ea7)" },
  { label: "Night Sky", emoji: "✨", time: "Midnight", color: "#facc15", gradient: "linear-gradient(135deg, #050d1a, #0a1628, #1a2a4a)" },
  { label: "Nordic Cabin", emoji: "🪵", time: "Winter", color: "#f472b6", gradient: "linear-gradient(135deg, #1a0f0f, #3d1515, #8b3a3a)" },
];

function SlideBackground() {
  const { t } = useTranslation();
  const [selected, setSelected] = useState(0);

  return (
    <Flex direction="column" gap={4} py={2} w="full">
      <Box
        w="full"
        borderRadius="2xl"
        overflow="hidden"
        position="relative"
        display="flex"
        alignItems="flex-end"
        style={{ height: 140, background: bgScenes[selected].gradient, transition: "background 0.5s ease" }}
      >
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            style={{
              position: "absolute",
              width: 2, height: 2,
              background: "rgba(255,255,255,0.6)",
              borderRadius: "50%",
              left: `${8 + i * 8}%`,
              top: `${10 + (i % 4) * 15}%`,
            }}
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ repeat: Infinity, duration: 2 + i * 0.3, delay: i * 0.2 }}
          />
        ))}
        <Box
          position="absolute"
          inset={0}
          style={{ background: "linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 60%)" }}
        />
        <Flex position="relative" zIndex={10} p={4} align="flex-end" justify="space-between" w="full">
          <Box>
            <Text style={{ fontSize: "1.5rem" }}>{bgScenes[selected].emoji}</Text>
            <Text style={{ fontSize: "1.1rem", color: "#fff", letterSpacing: "0.06em" }}>
              {bgScenes[selected].label}
            </Text>
          </Box>
          <Flex align="center" gap="6px">
            {selected < 3
              ? <Sun size={12} style={{ color: bgScenes[selected].color }} />
              : <Moon size={12} style={{ color: bgScenes[selected].color }} />}
            <Text style={{ fontSize: "0.72rem", color: bgScenes[selected].color }}>
              {bgScenes[selected].time}
            </Text>
          </Flex>
        </Flex>
      </Box>

      <Box display="grid" gridTemplateColumns="repeat(3, 1fr)" gap={2}>
        {bgScenes.map((scene, i) => (
          <Box
            as="button"
            key={i}
            onClick={() => setSelected(i)}
            borderRadius="xl"
            overflow="hidden"
            position="relative"
            display="flex"
            flexDirection="column"
            alignItems="center"
            justifyContent="flex-end"
            transition="transform 0.2s"
            _hover={{ transform: "scale(1.03)" }}
            style={{
              height: 64,
              background: scene.gradient,
              border: selected === i ? `2px solid ${scene.color}` : "2px solid transparent",
              boxShadow: selected === i ? `0 0 12px ${scene.color}55` : "none",
              cursor: "pointer",
            }}
          >
            <Box
              position="absolute"
              inset={0}
              style={{ background: "linear-gradient(to top, rgba(0,0,0,0.5), transparent)" }}
            />
            <Flex position="relative" zIndex={10} pb="6px" direction="column" align="center">
              <Text style={{ fontSize: "0.95rem" }}>{scene.emoji}</Text>
              <Text style={{ fontSize: "0.62rem", color: "#fff", lineHeight: 1.2 }}>
                {scene.label.split(" ")[0]}
              </Text>
            </Flex>
            {selected === i && (
              <Flex
                position="absolute"
                top={1}
                right={1}
                borderRadius="full"
                align="center"
                justify="center"
                style={{ width: 14, height: 14, background: scene.color }}
              >
                <Check size={8} style={{ color: "#0d2b24" }} strokeWidth={3} />
              </Flex>
            )}
          </Box>
        ))}
      </Box>

      <Flex align="center" gap={2} justify="center">
        <Mountain size={12} style={{ color: "#4d8a78" }} />
        <Text style={{ fontSize: "0.78rem", color: "#4d8a78" }}>
          {t("whyChooseUs.curatedScenes", { count: bgScenes.length })}
        </Text>
      </Flex>
    </Flex>
  );
}

/* ─────────────── Main Section ─────────────── */
export function WhyChooseUs() {
  const { t } = useTranslation();
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);

  const slides = [
    { id: 0, label: t("whyChooseUs.focusTimer"), title: t("whyChooseUs.slide1title"), desc: t("whyChooseUs.slide1desc"), icon: Timer, color: "#4ade80", Component: SlideTimer },
    { id: 1, label: t("whyChooseUs.soundscapes"), title: t("whyChooseUs.slide2title"), desc: t("whyChooseUs.slide2desc"), icon: Music2, color: "#38bdf8", Component: SlideSound },
    { id: 2, label: t("whyChooseUs.backgrounds"), title: t("whyChooseUs.slide3title"), desc: t("whyChooseUs.slide3desc"), icon: CheckSquare, color: "#c084fc", Component: SlideBackground },
  ];

  const goTo = useCallback(
    (index: number) => {
      setDirection(index > current ? 1 : -1);
      setCurrent(index);
    },
    [current]
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setDirection(1);
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const slide = slides[current];
  const Icon = slide.icon;

  return (
    <Box
      as="section"
      id="why-choose-us"
      w="full"
      overflow="hidden"
      style={{ background: "linear-gradient(180deg, #0d2b24 0%, #112e26 100%)" }}
    >
      {/* Section header */}
      <Box w="full" py={14} px={6} textAlign="center" position="relative">
        <Box
          as="span"
          display="inline-block"
          px={4}
          py={1}
          borderRadius="full"
          fontSize="sm"
          mb={4}
          style={{
            background: "rgba(122,171,151,0.12)",
            color: "#7aab97",
            fontWeight: 600,
            letterSpacing: "0.1em",
          }}
        >
          {t("whyChooseUs.sectionLabel")}
        </Box>
        <Text
          as="h2"
          color="white"
          style={{
            fontSize: "clamp(1.8rem, 4vw, 2.8rem)",
            lineHeight: 1.15,
            fontWeight: 900,
          }}
        >
          {t("whyChooseUs.title")}{" "}
          <Box
            as="span"
            style={{
              background: "linear-gradient(90deg, #4ade80, #38bdf8)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            {t("whyChooseUs.titleHighlight")}
          </Box>
        </Text>
      </Box>

      {/* Carousel */}
      <Flex
        direction="column"
        align="center"
        w="full"
        maxW="5xl"
        mx="auto"
        px={{ base: 5, sm: 8 }}
        pb={16}
      >
        {/* Tab switcher */}
        <Flex
          gap={1}
          mb={8}
          p={1}
          borderRadius="full"
          style={{ background: "rgba(13,43,36,0.7)", border: "1px solid rgba(74,166,134,0.15)" }}
        >
          {slides.map((s, i) => {
            const SIcon = s.icon;
            return (
              <Box
                as="button"
                key={s.id}
                onClick={() => goTo(i)}
                display="flex"
                alignItems="center"
                gap={2}
                borderRadius="full"
                px={4}
                py={2}
                transition="all 0.3s"
                style={{
                  background: current === i ? `linear-gradient(135deg, ${s.color}22, ${s.color}0f)` : "transparent",
                  border: current === i ? `1px solid ${s.color}44` : "1px solid transparent",
                  color: current === i ? s.color : "#4d8a78",
                  fontSize: "0.82rem",
                  cursor: "pointer",
                }}
              >
                <SIcon size={14} />
                <Box as="span" display={{ base: "none", sm: "inline" }}>{s.label}</Box>
              </Box>
            );
          })}
        </Flex>

        {/* Card */}
        <Box
          w="full"
          borderRadius="3xl"
          overflow="hidden"
          style={{
            background: "linear-gradient(145deg, rgba(22,56,46,0.95) 0%, rgba(13,38,32,0.98) 100%)",
            border: "1px solid rgba(74,166,134,0.15)",
            boxShadow: "0 8px 48px rgba(0,0,0,0.4), 0 0 0 1px rgba(74,166,134,0.08)",
          }}
        >
          {/* Card header strip */}
          <Flex
            px={6}
            pt={6}
            pb={4}
            align="flex-start"
            justify="space-between"
            style={{ borderBottom: "1px solid rgba(74,166,134,0.1)" }}
          >
            <Flex align="center" gap={3}>
              <Flex
                borderRadius="xl"
                align="center"
                justify="center"
                style={{
                  width: 40,
                  height: 40,
                  background: `linear-gradient(135deg, ${slide.color}22, ${slide.color}0a)`,
                  border: `1px solid ${slide.color}33`,
                }}
              >
                <Icon size={18} style={{ color: slide.color }} strokeWidth={1.8} />
              </Flex>
              <Box>
                <Text style={{ fontSize: "1.25rem", color: "#fff", letterSpacing: "0.06em", lineHeight: 1, fontWeight: 600 }}>
                  {slide.title}
                </Text>
                <Text style={{ fontSize: "0.8rem", color: "#7aab97", marginTop: 3 }}>
                  {slide.desc}
                </Text>
              </Box>
            </Flex>
            {/* Window dots */}
            <Flex display={{ base: "none", sm: "flex" }} align="center" gap="6px" mt={1}>
              {["#ef4444", "#f59e0b", "#22c55e"].map((c, i) => (
                <Box key={i} borderRadius="full" style={{ width: 10, height: 10, background: c, opacity: 0.7 }} />
              ))}
            </Flex>
          </Flex>

          {/* Slide content */}
          <Box position="relative" overflow="hidden" style={{ minHeight: 360 }}>
            {/* Top glow */}
            <Box
              position="absolute"
              top={0}
              left="50%"
              transform="translateX(-50%)"
              w="256px"
              h="128px"
              pointerEvents="none"
              style={{ background: `radial-gradient(ellipse at 50% 0%, ${slide.color}18, transparent 70%)` }}
            />

            <AnimatePresence mode="wait" initial={false}>
              <MotionBox
                key={current}
                initial={{ opacity: 0, x: direction * 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -direction * 40 }}
                transition={{ duration: 0.4, ease: "easeInOut" } as any}
                px={6}
                pt={4}
                pb={6}
              >
                <slide.Component />
              </MotionBox>
            </AnimatePresence>
          </Box>
        </Box>

        {/* Dot navigation */}
        <Flex align="center" gap={3} mt={7}>
          {slides.map((s, index) => (
            <Box
              as="button"
              key={s.id}
              onClick={() => goTo(index)}
              borderRadius="full"
              transition="all 0.3s"
              style={{
                width: index === current ? 28 : 10,
                height: 10,
                background: index === current ? s.color : "rgba(74,166,134,0.2)",
                border: index === current ? "none" : "1px solid rgba(74,166,134,0.3)",
                cursor: "pointer",
              }}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </Flex>
      </Flex>
    </Box>
  );
}