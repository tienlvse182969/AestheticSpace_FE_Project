import { Box, Flex, Text, Link } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";

export function Footer() {
  const year = new Date().getFullYear();
  const { t } = useTranslation();

  return (
    <Box as="footer" bg="#0f2921" pt={16} pb={8} px={{ base: 6, lg: 10 }}>
      <Box maxW="1280px" mx="auto">
        <Box mb={12}>
          <Box mb={4}>
            <Text
              style={{
                fontFamily: "'Manrope', sans-serif",
                fontSize: "1.4rem",
                color: "rgba(255,255,255,0.9)",
                letterSpacing: "0.01em",
              }}
            >
              A<span style={{ fontFamily: "'Manrope', sans-serif" }}>ē</span>sthetic Group
            </Text>
          </Box>
          <Text color="white/40" fontSize="sm" lineHeight="relaxed">
            {t("footer.tagline")}
          </Text>
        </Box>

        {/* Divider */}
        <Box
          mb={6}
          style={{
            height: "1px",
            background: "rgba(255,255,255,0.07)",
          }}
        />

        {/* Bottom */}
        <Flex
          direction={{ base: "column", sm: "row" }}
          align="center"
          justify="space-between"
          gap={4}
        >
          <Text color="white/30" fontSize="sm">
            {t("footer.copyright", { year })}
          </Text>
          <Flex gap={6}>
            {["Instagram", "Facebook"].map((social) => (
              <Link
                key={social}
                href="https://www.facebook.com/profile.php?id=61590643954157"
                color="white/30"
                fontSize="sm"
                textDecoration="none"
                transition="color 0.2s"
                _hover={{ color: "white/70" }}
              >
                {social}
              </Link>
            ))}
          </Flex>
        </Flex>
      </Box>
    </Box>
  );
}