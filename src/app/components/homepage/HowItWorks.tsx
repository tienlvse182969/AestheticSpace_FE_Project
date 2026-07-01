import { motion } from "motion/react";
import { Box, Flex, Heading, Text } from "@chakra-ui/react";
import { UserPlus, Sliders, Zap } from "lucide-react";
import { useTranslation } from "react-i18next";

const MotionBox = motion.create(Box);
const MotionFlex = motion.create(Flex);

export function HowItWorks() {
  const { t } = useTranslation();
  const steps = [
    { number: "01", icon: UserPlus, title: t("howItWorks.step1.title"), description: t("howItWorks.step1.desc") },
    { number: "02", icon: Sliders, title: t("howItWorks.step2.title"), description: t("howItWorks.step2.desc") },
    { number: "03", icon: Zap, title: t("howItWorks.step3.title"), description: t("howItWorks.step3.desc") },
  ];
  return (
    <Box as="section" bg="white" py={24} px={{ base: 6, lg: 10 }}>
      <Box maxW="1280px" mx="auto">
        <MotionBox
          textAlign="center"
          mb={16}
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
            {t("howItWorks.sectionLabel")}
          </Box>
          <Heading
            as="h2"
            color="#1a3c34"
            fontWeight="900"
            style={{ fontSize: "clamp(1.8rem, 4vw, 2.8rem)" }}
          >
            {t("howItWorks.title")}
          </Heading>
          <Text mt={4} maxW="lg" mx="auto" color="#1a3c34/60">
            {t("howItWorks.subtitle")}
          </Text>
        </MotionBox>

        {/* Steps */}
        <Box position="relative">
          {/* Connector line (desktop) */}
          <Box
            display={{ base: "none", lg: "block" }}
            position="absolute"
            top="48px"
            left="50%"
            transform="translateX(-50%)"
            w="60%"
            h="2px"
            style={{
              background: "linear-gradient(to right, rgba(78,124,106,0.25), #4e7c6a, rgba(78,124,106,0.25))",
            }}
          />

          <Box
            display="grid"
            gridTemplateColumns={{ base: "1fr", lg: "repeat(3, 1fr)" }}
            gap={{ base: 12, lg: 8 }}
          >
            {steps.map((step, index) => (
              <MotionFlex
                key={step.number}
                direction="column"
                align="center"
                textAlign="center"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.2 } as any}
              >
                {/* Icon circle */}
                <Box position="relative" mb={6}>
                  <Flex
                    w="96px"
                    h="96px"
                    borderRadius="full"
                    align="center"
                    justify="center"
                    bg="#1a3c34"
                    boxShadow="lg"
                  >
                    <step.icon size={32} color="#7aab97" strokeWidth={1.5} />
                  </Flex>
                  {/* Step number badge */}
                  <Flex
                    position="absolute"
                    top="-8px"
                    right="-8px"
                    w="32px"
                    h="32px"
                    borderRadius="full"
                    align="center"
                    justify="center"
                    bg="#4e7c6a"
                    color="white"
                    fontSize="0.9rem"
                    fontWeight="600"
                    letterSpacing="0.05em"
                  >
                    {step.number.replace("0", "")}
                  </Flex>
                </Box>

                <Heading
                  as="h3"
                  mb={3}
                  fontSize="1.25rem"
                  fontWeight="700"
                  color="#1a3c34"
                >
                  {step.title}
                </Heading>
                <Text color="#1a3c34/60" fontSize="sm" lineHeight="relaxed" maxW="xs">
                  {step.description}
                </Text>
              </MotionFlex>
            ))}
          </Box>
        </Box>

        {/* CTA */}
        {/* <MotionBox
          textAlign="center"
          mt={16}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 } as any}
        >
          <Box
            as="a"
            href="#join"
            display="inline-block"
            px={10}
            py={4}
            borderRadius="xl"
            color="white"
            bg="#1a3c34"
            fontWeight="700"
            letterSpacing="0.08em"
            fontSize="0.95rem"
            textDecoration="none"
            transition="all 0.2s"
            boxShadow="lg"
            _hover={{ transform: "scale(1.05)" }}
            _active={{ transform: "scale(0.95)" }}
          >
            {t("howItWorks.cta")}
          </Box>
        </MotionBox> */}
      </Box>
    </Box>
  );
}