import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Box, Flex, Text } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import { Timer, Music2, Image } from "lucide-react";

const MotionBox = motion.create(Box);

/* ─────────────── Main Section ─────────────── */
export function WhyChooseUs() {
  const { t } = useTranslation();
  const [current,   setCurrent]   = useState(0);
  const [direction, setDirection] = useState(1);

  const slides = [
    {
      id: 0,
      label: t("whyChooseUs.focusTimer"),
      title: t("whyChooseUs.slide1title"),
      desc:  t("whyChooseUs.slide1desc"),
      icon:  Timer,
      color: "#4ade80",
      image: "/assets/WhyChooseUs/pomodoro.png",
    },
    {
      id: 1,
      label: t("whyChooseUs.soundscapes"),
      title: t("whyChooseUs.slide2title"),
      desc:  t("whyChooseUs.slide2desc"),
      icon:  Music2,
      color: "#c084fc",
      image: "/assets/WhyChooseUs/music-player.png",
    },
    {
      id: 2,
      label: t("whyChooseUs.backgrounds"),
      title: t("whyChooseUs.slide3title"),
      desc:  t("whyChooseUs.slide3desc"),
      icon:  Image,
      color: "#fb923c",
      image: "/assets/WhyChooseUs/background-picker.png",
    },
  ];

  const goTo = useCallback(
    (index: number) => {
      setDirection(index > current ? 1 : -1);
      setCurrent(index);
    },
    [current],
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setDirection(1);
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const slide = slides[current];
  const Icon  = slide.icon;

  return (
    <Box
      as="section"
      id="why-choose-us"
      w="full"
      overflow="hidden"
      style={{ background: "linear-gradient(180deg, #0d2b24 0%, #112e26 100%)" }}
    >
      {/* Section header */}
      <Box w="full" py={14} px={6} textAlign="center">
        <Box as="span" display="inline-block" px={4} py={1} borderRadius="full" fontSize="sm" mb={4}
          style={{ background: "rgba(122,171,151,0.12)", color: "#7aab97", fontWeight: 600, letterSpacing: "0.1em" }}>
          {t("whyChooseUs.sectionLabel")}
        </Box>
        <Text as="h2" color="white"
          style={{ fontSize: "clamp(1.8rem, 4vw, 2.8rem)", lineHeight: 1.15, fontWeight: 900 }}>
          {t("whyChooseUs.title")}{" "}
          <Box as="span" style={{ background: "linear-gradient(90deg, #4ade80, #38bdf8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            {t("whyChooseUs.titleHighlight")}
          </Box>
        </Text>
      </Box>

      {/* Carousel */}
      <Flex direction="column" align="center" w="full" maxW="5xl" mx="auto" px={{ base: 5, sm: 8 }} pb={16}>

        {/* Tab switcher */}
        <Flex gap={1} mb={8} p={1} borderRadius="full"
          style={{ background: "rgba(13,43,36,0.7)", border: "1px solid rgba(74,166,134,0.15)" }}>
          {slides.map((s, i) => {
            const SIcon = s.icon;
            return (
              <Box key={s.id} as="button" onClick={() => goTo(i)}
                display="flex" alignItems="center" gap={2}
                borderRadius="full" px={4} py={2} transition="all 0.3s"
                style={{
                  background: current === i ? `linear-gradient(135deg, ${s.color}22, ${s.color}0f)` : "transparent",
                  border:     current === i ? `1px solid ${s.color}44` : "1px solid transparent",
                  color:      current === i ? s.color : "#4d8a78",
                  fontSize: "0.82rem",
                  cursor: "pointer",
                }}>
                <SIcon size={14} />
                <Box as="span" display={{ base: "none", sm: "inline" }}>{s.label}</Box>
              </Box>
            );
          })}
        </Flex>

        {/* Card */}
        <Box w="full" borderRadius="3xl" overflow="hidden"
          style={{ background: "linear-gradient(145deg, rgba(22,56,46,0.95) 0%, rgba(13,38,32,0.98) 100%)", border: "1px solid rgba(74,166,134,0.15)", boxShadow: "0 8px 48px rgba(0,0,0,0.4), 0 0 0 1px rgba(74,166,134,0.08)" }}>

          {/* Card header */}
          <Flex px={6} pt={6} pb={4} align="flex-start" justify="space-between"
            style={{ borderBottom: "1px solid rgba(74,166,134,0.1)" }}>
            <Flex align="center" gap={3}>
              <Flex borderRadius="xl" align="center" justify="center"
                style={{ width: 40, height: 40, background: `linear-gradient(135deg, ${slide.color}22, ${slide.color}0a)`, border: `1px solid ${slide.color}33` }}>
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
            <Flex display={{ base: "none", sm: "flex" }} align="center" gap="6px" mt={1}>
              {["#ef4444", "#f59e0b", "#22c55e"].map((c, i) => (
                <Box key={i} borderRadius="full" style={{ width: 10, height: 10, background: c, opacity: 0.7 }} />
              ))}
            </Flex>
          </Flex>

          {/* Screenshot */}
          <Box position="relative" overflow="hidden" style={{ minHeight: 360 }}>
            {/* Glow */}
            <Box position="absolute" top={0} left="50%" transform="translateX(-50%)" w="256px" h="128px" pointerEvents="none"
              style={{ background: `radial-gradient(ellipse at 50% 0%, ${slide.color}18, transparent 70%)` }} />

            <AnimatePresence mode="wait" initial={false}>
              <MotionBox
                key={current}
                initial={{ opacity: 0, x: direction * 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -direction * 40 }}
                transition={{ duration: 0.4, ease: "easeInOut" } as any}
                display="flex"
                alignItems="center"
                justifyContent="center"
                px={6}
                pt={6}
                pb={8}
              >
                <Box
                  borderRadius="2xl"
                  overflow="hidden"
                  style={{
                    maxWidth: "100%",
                    boxShadow: `0 12px 48px rgba(0,0,0,0.55), 0 0 0 1px ${slide.color}22`,
                    border: `1px solid ${slide.color}22`,
                  }}
                >
                  <img
                    src={slide.image}
                    alt={slide.title}
                    style={{ display: "block", maxWidth: "100%", maxHeight: 380, objectFit: "contain" }}
                  />
                </Box>
              </MotionBox>
            </AnimatePresence>
          </Box>
        </Box>

        {/* Dot navigation */}
        <Flex align="center" gap={3} mt={7}>
          {slides.map((s, index) => (
            <Box key={s.id} as="button" onClick={() => goTo(index)} borderRadius="full" transition="all 0.3s"
              style={{
                width:      index === current ? 28 : 10,
                height:     10,
                background: index === current ? s.color : "rgba(74,166,134,0.2)",
                border:     index === current ? "none" : "1px solid rgba(74,166,134,0.3)",
                cursor:     "pointer",
              }}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </Flex>
      </Flex>
    </Box>
  );
}
