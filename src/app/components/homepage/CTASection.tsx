import { motion } from "motion/react";
import { Box, Flex, Heading, Text } from "@chakra-ui/react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../../context/AuthContext";

const MotionBox = motion.create(Box);

const DESK_IMG =
  "https://images.unsplash.com/photo-1772475385458-21163e41f4ba?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb3p5JTIwYWVzdGhldGljJTIwc3R1ZHklMjBkZXNrJTIwbWluaW1hbHxlbnwxfHx8fDE3NzQyNzQwNzV8MA&ixlib=rb-4.1.0&q=80&w=1080";

export function CTASection() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth();
  return (
    <Box
      as="section"
      id="join"
      position="relative"
      py={32}
      px={{ base: 6, lg: 10 }}
      overflow="hidden"
    >
      {/* Background */}
      <Box
        position="absolute"
        inset={0}
        bgImage={`url(${DESK_IMG})`}
        bgSize="cover"
        bgPosition="center"
      />
      <Box
        position="absolute"
        inset={0}
        style={{ backgroundColor: "rgba(26, 60, 52, 0.82)" }}
      />

      <Box position="relative" zIndex={10} maxW="3xl" mx="auto" textAlign="center">
        <MotionBox
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
            mb={6}
            fontWeight="600"
            letterSpacing="0.1em"
            style={{
              backgroundColor: "rgba(122, 171, 151, 0.25)",
              color: "#7aab97",
              border: "1px solid rgba(122, 171, 151, 0.4)",
            }}
          >
            {t("cta.badge")}
          </Box>

          <Heading
            as="h2"
            color="white"
            mb={4}
            fontWeight="900"
            lineHeight="1.15"
            style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)" }}
          >
            {t("cta.title1")}
            <br />
            <Box as="span" style={{ color: "#7aab97" }}>
              {t("cta.title2")}
            </Box>
          </Heading>

          <Text color="white/70" maxW="xl" mx="auto" mb={10} lineHeight="relaxed">
            {t("cta.subtitle")}
          </Text>

          <Flex
            direction={{ base: "column", sm: "row" }}
            gap={4}
            justify="center"
          >
            <Box
              as="a"
              href="#"
              display="inline-block"
              px={10}
              py={4}
              borderRadius="xl"
              color="#1a3c34"
              bg="#7aab97"
              fontWeight="700"
              letterSpacing="0.08em"
              fontSize="0.95rem"
              textDecoration="none"
              transition="all 0.2s"
              boxShadow="xl"
              _hover={{ transform: "scale(1.05)" }}
              _active={{ transform: "scale(0.95)" }}
              onClick={(e: React.MouseEvent) => {
                e.preventDefault();
                if (user) {
                  navigate("/space");
                } else {
                  navigate("/signup");
                }
              }}
            >
              {t("cta.joinNow")}
            </Box>
          </Flex>
        </MotionBox>
      </Box>
    </Box>
  );
}