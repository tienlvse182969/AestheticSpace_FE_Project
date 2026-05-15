import { motion } from "motion/react";
import { Box, Flex, Heading, Text } from "@chakra-ui/react";
import { ChevronDown } from "lucide-react";
import heroBg from "figma:asset/1cdb28c7d954d15491f2b5c0046bb5816ebd5fbf.png";
import { useTranslation } from "react-i18next";

const MotionBox = motion.create(Box);
const MotionFlex = motion.create(Flex);
const MotionText = motion.create(Text);
const MotionHeading = motion.create(Heading);

export function HeroSection() {
  const { t } = useTranslation();
  return (
    <Box
      as="section"
      id="home"
      position="relative"
      w="full"
      minH="100vh"
      display="flex"
      flexDirection="column"
      justifyContent="center"
      overflow="hidden"
    >
      {/* Background Image */}
      <Box
        position="absolute"
        inset={0}
        bgImage={`url(${heroBg})`}
        bgSize="cover"
        bgPosition="center"
        bgRepeat="no-repeat"
      />
      {/* Soft overlay */}
      <Box
        position="absolute"
        inset={0}
        style={{
          background: "linear-gradient(to bottom, rgba(255,255,255,0.1), transparent, rgba(255,255,255,0.2))",
        }}
      />

      {/* Content */}
      <Box
        position="relative"
        zIndex={10}
        maxW="1280px"
        mx="auto"
        px={{ base: 6, lg: 10 }}
        pt="112px"
        pb="80px"
      >
        <Box maxW="xl">
          <MotionBox
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 } as any}
          >
            <Heading
              as="h1"
              color="white"
              lineHeight="0.95"
              mb={4}
              whiteSpace="nowrap"
              style={{
                fontSize: "clamp(3rem, 10vw, 7rem)",
                fontWeight: 600,
                letterSpacing: "0.02em",
              }}
            >
              <Box as="span" display="block">AESTHETIC</Box>
              <Box as="span" display="block">SPACE</Box>
            </Heading>
          </MotionBox>

          <MotionText
            as="p"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 } as any}
            mt={6}
            color="white/80"
            lineHeight="relaxed"
            maxW="sm"
            textAlign="justify"
          >
            {t("hero.description")}
          </MotionText>

          <MotionFlex
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.7 } as any}
            mt={8}
            direction="column"
            gap={3}
          >
            <Text
              fontSize="sm"
              fontStyle="italic"
              color="white/70"
            >
              {t("hero.readyText")}
            </Text>
            <Box
              as="a"
              href="#join"
              display="inline-block"
              w="fit-content"
              px={8}
              py={3}
              borderRadius="xl"
              color="white"
              bg="#1a3c34"
              fontWeight="700"
              fontSize="md"
              letterSpacing="0.1em"
              textDecoration="none"
              transition="all 0.2s"
              boxShadow="lg"
              _hover={{ transform: "scale(1.05)", boxShadow: "xl" }}
              _active={{ transform: "scale(0.95)" }}
            >
              {t("hero.cta")}
            </Box>
          </MotionFlex>
        </Box>
      </Box>

      {/* Scroll indicator */}
      <MotionBox
        position="absolute"
        bottom={8}
        left="50%"
        style={{ x: "-50%" }}
        display="flex"
        flexDirection="column"
        alignItems="center"
        gap={1}
        color="#1a3c34/60"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, y: [0, 8, 0] }}
        transition={{ delay: 1.5, duration: 2, repeat: Infinity } as any}
      >
        <Text fontSize="xs" letterSpacing="widest" textTransform="uppercase">
          {t("hero.scroll")}
        </Text>
        <ChevronDown size={18} />
      </MotionBox>
    </Box>
  );
}