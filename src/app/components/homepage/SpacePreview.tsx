import { motion } from "motion/react";
import { Box, Heading, Text } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";

const MotionBox = motion.create(Box);

const SCENES = [
  {
    labelKey: "spacePreview.cozyRoom",
    img: "https://images.unsplash.com/photo-1633945984522-a19268cc75ad?w=1080&q=80&fit=crop&auto=format",
    wide: true,
  },
  {
    labelKey: "spacePreview.starryNight",
    img: "https://images.unsplash.com/photo-1707755939969-e9c1da71c5bb?w=1080&q=80&fit=crop&auto=format",
    wide: true,
  },
  {
    labelKey: "spacePreview.forest",
    img: "https://images.unsplash.com/photo-1549576691-27846291ae50?w=1080&q=80&fit=crop&auto=format",
    wide: false,
  },
  {
    labelKey: "spacePreview.zenGarden",
    img: "https://images.unsplash.com/photo-1670854753472-4d7cbe07a1c0?w=1080&q=80&fit=crop&auto=format",
    wide: false,
  },
  {
    labelKey: "spacePreview.rainyWindow",
    img: "https://images.unsplash.com/photo-1509635022432-0220ac12960b?w=1080&q=80&fit=crop&auto=format",
    wide: false,
  },
];

export function SpacePreview() {
  const { t } = useTranslation();

  return (
    <Box as="section" bg="#f5f0e8" py={24} px={{ base: 6, lg: 10 }}>
      <style>{`
        .scenes-grid {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 16px;
        }
        .scene-wide  { grid-column: span 3; }
        .scene-small { grid-column: span 2; }
        @media (max-width: 900px) {
          .scenes-grid { grid-template-columns: repeat(2, 1fr); gap: 12px; }
          .scene-wide, .scene-small { grid-column: span 1; }
        }
        @media (max-width: 520px) {
          .scenes-grid { grid-template-columns: 1fr; }
        }
        .scene-img { transform: scale(1); transition: transform 0.7s ease; }
        .scene-card:hover .scene-img { transform: scale(1.06); }
      `}</style>

      <Box maxW="1280px" mx="auto">
        <MotionBox
          textAlign="center"
          mb={14}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 } as any}
        >
          <Box
            as="span"
            display="inline-block"
            px={4} py={1}
            borderRadius="full"
            fontSize="sm"
            mb={4}
            bg="#4e7c6a20"
            color="#4e7c6a"
            fontWeight="600"
            letterSpacing="0.1em"
          >
            {t("spacePreview.sectionLabel")}
          </Box>
          <Heading
            as="h2"
            color="#1a3c34"
            fontWeight="900"
            style={{ fontSize: "clamp(1.8rem, 4vw, 2.8rem)" }}
          >
            {t("spacePreview.title")}
          </Heading>
          <Text mt={4} maxW="lg" mx="auto" color="#1a3c34/60">
            {t("spacePreview.subtitle")}
          </Text>
        </MotionBox>

        <div className="scenes-grid">
          {SCENES.map((scene, index) => (
            <MotionBox
              key={scene.labelKey}
              className={`scene-card ${scene.wide ? "scene-wide" : "scene-small"}`}
              position="relative"
              overflow="hidden"
              borderRadius="2xl"
              style={{ aspectRatio: scene.wide ? "16/10" : "4/3" }}
              initial={{ opacity: 0, scale: 0.96 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 } as any}
            >
              <img
                className="scene-img"
                src={scene.img}
                alt={t(scene.labelKey)}
                style={{
                  position: "absolute",
                  inset: 0,
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
              <Box
                position="absolute"
                inset={0}
                style={{
                  background: "linear-gradient(to top, rgba(26,60,52,0.65) 0%, transparent 50%)",
                }}
              />
              <Box position="absolute" bottom={4} left={4}>
                <Text color="white" fontSize="1rem" fontWeight="700" style={{ textShadow: "0 1px 4px rgba(0,0,0,0.4)" }}>
                  {t(scene.labelKey)}
                </Text>
              </Box>
            </MotionBox>
          ))}
        </div>
      </Box>
    </Box>
  );
}
