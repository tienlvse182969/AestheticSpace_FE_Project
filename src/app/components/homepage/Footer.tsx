import { Box, Flex, Grid, Text, Link } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";

export function Footer() {
  const year = new Date().getFullYear();
  const { t } = useTranslation();

  const links = {
    [t("footer.product")]: [t("footer.features"), t("footer.scenes"), t("footer.sounds"), t("footer.timer"), t("footer.studyRooms")],
    [t("footer.company")]: [t("footer.aboutUs"), t("footer.blog"), t("footer.press"), t("footer.contact")],
    [t("footer.support")]: [t("footer.faq"), t("footer.community"), t("footer.privacyPolicy"), t("footer.termsOfService")],
  };

  return (
    <Box as="footer" bg="#0f2921" pt={16} pb={8} px={{ base: 6, lg: 10 }}>
      <Box maxW="1280px" mx="auto">
        <Grid
          templateColumns={{ base: "1fr", md: "repeat(2, 1fr)", lg: "repeat(4, 1fr)" }}
          gap={10}
          mb={12}
        >
          {/* Brand */}
          <Box>
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

          {/* Links */}
          {Object.entries(links).map(([category, items]) => (
            <Box key={category}>
              <Text
                color="#7aab97"
                mb={4}
                fontSize="xs"
                letterSpacing="widest"
                textTransform="uppercase"
                fontWeight="600"
              >
                {category}
              </Text>
              <Flex as="ul" direction="column" gap={3} listStyleType="none" p={0} m={0}>
                {items.map((item) => (
                  <Box as="li" key={item}>
                    <Link
                      href="#"
                      color="white/40"
                      fontSize="sm"
                      textDecoration="none"
                      transition="color 0.2s"
                      _hover={{ color: "white/80" }}
                    >
                      {item}
                    </Link>
                  </Box>
                ))}
              </Flex>
            </Box>
          ))}
        </Grid>

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
            {["Twitter", "Instagram", "Discord", "YouTube"].map((social) => (
              <Link
                key={social}
                href="#"
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