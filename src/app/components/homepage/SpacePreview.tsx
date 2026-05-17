import { motion } from "motion/react";
import { Box, Heading, Text } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";

const MotionBox = motion.create(Box);

const FOREST_IMG =
  "https://images.unsplash.com/photo-1618756501529-a591ffb93392?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhZXN0aGV0aWMlMjBmb3Jlc3QlMjBuYXR1cmUlMjBjYWxtJTIwZ3JlZW58ZW58MXx8fHwxNzc0Mjc0MDgwfDA&ixlib=rb-4.1.0&q=80&w=1080";
const ROOM_IMG =
  "https://images.unsplash.com/photo-1769184618473-58c1f0e294f4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb3p5JTIwc3R1ZHklMjByb29tJTIwaW50ZXJpb3IlMjBwbGFudHMlMjBib29rc3xlbnwxfHx8fDE3NzQyNzQwODR8MA&ixlib=rb-4.1.0&q=80&w=1080";
const ZEN_IMG =
  "https://images.unsplash.com/photo-1762932922297-767ca87bfe3f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwZWFjZWZ1bCUyMGphcGFuZXNlJTIwZ2FyZGVuJTIwemVuJTIwbWluaW1hbHxlbnwxfHx8fDE3NzQyNzQxNTh8MA&ixlib=rb-4.1.0&q=80&w=1080";

export function SpacePreview() {
  const { t } = useTranslation();
  const scenes = [
    { labelKey: "spacePreview.forest", img: FOREST_IMG },
    { labelKey: "spacePreview.cozyRoom", img: ROOM_IMG },
    { labelKey: "spacePreview.zenGarden", img: ZEN_IMG },
  ];
  return (
    <Box as="section" bg="#f5f0e8" py={24} px={{ base: 6, lg: 10 }}>
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
            px={4}
            py={1}
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

        <Box
          display="grid"
          gridTemplateColumns={{ base: "1fr", md: "repeat(3, 1fr)" }}
          gap={5}
        >
          {scenes.map((scene, index) => (
            <MotionBox
              key={scene.labelKey}
              position="relative"
              overflow="hidden"
              borderRadius="2xl"
              cursor="pointer"
              style={{ aspectRatio: "16/10" }}
              initial={{ opacity: 0, scale: 0.96 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.5, delay: index * 0.15 } as any}
              css={{
                "&:hover img": { transform: "scale(1.1)" },
                "&:hover .hover-tag": { opacity: 1 },
              }}
            >
              <Box
                as="img"
                src={scene.img}
                alt={t(scene.labelKey)}
                w="full"
                h="full"
                objectFit="cover"
                transition="transform 0.7s"
              />
              {/* Gradient overlay */}
              <Box
                position="absolute"
                inset={0}
                style={{
                  background: "linear-gradient(to top, rgba(26,60,52,0.7), transparent)",
                }}
              />
              {/* Label */}
              <Box position="absolute" bottom={4} left={4}>
                <Text color="white/90" fontSize="1.1rem" fontWeight="700">
                  {t(scene.labelKey)}
                </Text>
              </Box>
              {/* Hover tag */}
              <Box
                className="hover-tag"
                position="absolute"
                inset={0}
                display="flex"
                alignItems="center"
                justifyContent="center"
                opacity={0}
                transition="opacity 0.3s"
              >
                <Box
                  as="span"
                  px={4}
                  py={2}
                  borderRadius="full"
                  color="white"
                  fontSize="sm"
                  fontWeight="600"
                  bg="#4e7c6a"
                >
                  {t("spacePreview.useScene")}
                </Box>
              </Box>
            </MotionBox>
          ))}
        </Box>
      </Box>
    </Box>
  );
}