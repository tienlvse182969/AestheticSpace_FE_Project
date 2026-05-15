import { Box, Flex, Text } from "@chakra-ui/react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { Sparkles, Music, Timer, StickyNote, ArrowLeft } from "lucide-react";

const MotionBox = motion.create(Box);

const FEATURES = [
  { icon: Timer,     label: "Pomodoro Timer",    desc: "Stay focused with customizable work & break sessions." },
  { icon: Music,     label: "Music Player",       desc: "Play your favourite tracks to set the mood." },
  { icon: StickyNote,label: "Todo List",          desc: "Keep track of tasks without leaving your space." },
  { icon: Sparkles,  label: "Stickers & Themes",  desc: "Personalise your environment with aesthetic overlays." },
];

export function AboutPage() {
  const navigate = useNavigate();

  return (
    <Box
      minH="100vh"
      style={{
        background: "linear-gradient(135deg, #0a0f14 0%, #0d1a1f 50%, #0a1410 100%)",
        fontFamily: "'HarmonyOS Sans', sans-serif",
      }}
    >
      {/* Back button */}
      <Box position="fixed" top={5} left={7} zIndex={20}>
        <Box
          as="button"
          display="flex"
          alignItems="center"
          gap={2}
          onClick={() => navigate(-1)}
          style={{
            background: "rgba(10,15,20,0.55)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            border: "1px solid rgba(255,255,255,0.15)",
            borderRadius: "10px",
            color: "rgba(255,255,255,0.78)",
            fontSize: "0.85rem",
            padding: "7px 14px",
            cursor: "pointer",
            transition: "all 0.2s",
          }}
        >
          <ArrowLeft size={15} />
          Back
        </Box>
      </Box>

      {/* Content */}
      <Flex
        direction="column"
        align="center"
        justify="center"
        minH="100vh"
        px={6}
        py={24}
      >
        {/* Hero */}
        <MotionBox
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] } as any}
          textAlign="center"
          mb={14}
        >
          <Text
            mb={3}
            style={{
              fontSize: "0.72rem",
              letterSpacing: "0.18em",
              color: "rgba(94,234,212,0.6)",
              textTransform: "uppercase",
            }}
          >
            Aesthetic Group
          </Text>
          <Text
            mb={5}
            style={{
              fontSize: "clamp(2rem, 5vw, 3.2rem)",
              color: "rgba(255,255,255,0.92)",
              fontFamily: "'Tenor Sans', sans-serif",
              letterSpacing: "-0.01em",
              lineHeight: 1.15,
            }}
          >
            Aesthetic Study Space
          </Text>
          <Text
            style={{
              fontSize: "1rem",
              color: "rgba(255,255,255,0.45)",
              maxWidth: 480,
              lineHeight: 1.7,
            }}
          >
            A distraction-free environment crafted to help you focus, stay inspired,
            and make every study session feel effortless.
          </Text>
        </MotionBox>

        {/* Feature cards */}
        <Box
          display="grid"
          style={{
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 16,
            width: "100%",
            maxWidth: 860,
          }}
        >
          {FEATURES.map(({ icon: Icon, label, desc }, i) => (
            <MotionBox
              key={label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 + i * 0.08, ease: [0.4, 0, 0.2, 1] } as any}
              borderRadius="16px"
              p="20px"
              style={{
                background: "rgba(255,255,255,0.035)",
                backdropFilter: "blur(12px)",
                WebkitBackdropFilter: "blur(12px)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <Flex
                align="center"
                justify="center"
                mb={3}
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  background: "rgba(94,234,212,0.1)",
                  border: "1px solid rgba(94,234,212,0.2)",
                }}
              >
                <Icon size={17} style={{ color: "rgba(94,234,212,0.8)" }} />
              </Flex>
              <Text
                mb={1}
                style={{
                  fontSize: "0.88rem",
                  color: "rgba(255,255,255,0.82)",
                }}
              >
                {label}
              </Text>
              <Text
                style={{
                  fontSize: "0.78rem",
                  color: "rgba(255,255,255,0.38)",
                  lineHeight: 1.6,
                }}
              >
                {desc}
              </Text>
            </MotionBox>
          ))}
        </Box>

        {/* CTA */}
        <MotionBox
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.55 } as any}
          mt={14}
        >
          <Box
            as="button"
            onClick={() => navigate("/space")}
            style={{
              background: "linear-gradient(135deg, rgba(94,234,212,0.18), rgba(56,189,248,0.12))",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              border: "1px solid rgba(94,234,212,0.3)",
              borderRadius: "12px",
              color: "rgba(255,255,255,0.88)",
              fontSize: "0.9rem",
              padding: "12px 32px",
              cursor: "pointer",
              transition: "all 0.2s",
              letterSpacing: "0.04em",
            }}
          >
            Open Study Space →
          </Box>
        </MotionBox>
      </Flex>
    </Box>
  );
}