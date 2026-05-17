import { motion } from "motion/react";
import { Box, Flex, Heading, Text } from "@chakra-ui/react";
import { Timer, Music2, Image, BookOpen, Moon, Users } from "lucide-react";
import { useTranslation } from "react-i18next";

export function FeaturesGrid() {
  const { t } = useTranslation();
  const features = [
    { icon: Timer, title: t("features.pomodoro.title"), description: t("features.pomodoro.desc") },
    { icon: Music2, title: t("features.ambient.title"), description: t("features.ambient.desc") },
    { icon: Image, title: t("features.backgrounds.title"), description: t("features.backgrounds.desc") },
    { icon: BookOpen, title: t("features.tasks.title"), description: t("features.tasks.desc") },
    { icon: Moon, title: t("features.focus.title"), description: t("features.focus.desc") },
    { icon: Users, title: t("features.together.title"), description: t("features.together.desc") },
  ];
  return (
    <Box as="section" id="features" bg="#f5f0e8" py={24} px={{ base: 6, lg: 10 }}>
      <Box maxW="1280px" mx="auto">
        <motion.div
          style={{ textAlign: "center", marginBottom: "4rem" }}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
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
            {t("features.sectionLabel")}
          </Box>
          <Heading
            as="h2"
            color="#1a3c34"
            fontWeight="900"
            style={{ fontSize: "clamp(1.8rem, 4vw, 2.8rem)" }}
          >
            {t("features.title")}
          </Heading>
          <Text mt={4} maxW="xl" mx="auto" color="#1a3c34/60">
            {t("features.subtitle")}
          </Text>
        </motion.div>

        <Box
          display="grid"
          gridTemplateColumns={{ base: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" }}
          gap={6}
        >
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ y: -4 }}
              style={{ borderRadius: "1rem" }}
            >
              <Box
                p={6}
                bg="white"
                borderRadius="2xl"
                border="1px solid transparent"
                cursor="default"
                h="full"
                transition="all 0.3s"
                _hover={{
                  boxShadow: "0 20px 40px rgba(0,0,0,0.12)",
                  borderColor: "rgba(78,124,106,0.2)",
                }}
              >
                <Flex
                  w="48px"
                  h="48px"
                  borderRadius="xl"
                  align="center"
                  justify="center"
                  mb={4}
                  bg="#4e7c6a15"
                >
                  <feature.icon size={22} color="#4e7c6a" strokeWidth={1.8} />
                </Flex>
                <Heading as="h3" mb={2} fontSize="1.15rem" fontWeight="700" color="#1a3c34">
                  {feature.title}
                </Heading>
                <Text color="#1a3c34/60" fontSize="sm" lineHeight="relaxed">
                  {feature.description}
                </Text>
              </Box>
            </motion.div>
          ))}
        </Box>
      </Box>
    </Box>
  );
}
