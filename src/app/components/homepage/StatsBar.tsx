import { motion } from "motion/react";
import { Box, Flex, Text } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";

const MotionFlex = motion.create(Flex);

export function StatsBar() {
  const { t } = useTranslation();
  const stats = [
    { value: "50K+", label: t("stats.activeUsers") },
    { value: "1.2M+", label: t("stats.studySessions") },
    { value: "200+", label: t("stats.aestheticScenes") },
    { value: "98%", label: t("stats.satisfactionRate") },
  ];
  return (
    <Box as="section" bg="#1a3c34" py={14} px={{ base: 6, lg: 10 }}>
      <Box maxW="1280px" mx="auto">
        <Box
          display="grid"
          gridTemplateColumns={{ base: "repeat(2, 1fr)", lg: "repeat(4, 1fr)" }}
          gap={{ base: 8, lg: 4 }}
        >
          {stats.map((stat, index) => (
            <MotionFlex
              key={stat.label}
              direction="column"
              align="center"
              textAlign="center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 } as any}
            >
              <Text
                color="#7aab97"
                letterSpacing="0.04em"
                lineHeight="1.1"
                fontWeight="800"
                style={{ fontSize: "clamp(2.2rem, 5vw, 3rem)" }}
              >
                {stat.value}
              </Text>
              <Text
                mt={1}
                color="white/60"
                fontSize="sm"
                letterSpacing="widest"
                textTransform="uppercase"
              >
                {stat.label}
              </Text>
            </MotionFlex>
          ))}
        </Box>
      </Box>
    </Box>
  );
}