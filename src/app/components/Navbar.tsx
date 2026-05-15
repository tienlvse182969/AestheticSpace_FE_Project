import { useState, useEffect } from "react";
import { Box, Flex, Text, Link } from "@chakra-ui/react";
import { Menu, X } from "lucide-react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isInHero, setIsInHero] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const heroEl = document.getElementById("home");
    if (!heroEl) return;
    const observer = new IntersectionObserver(
      ([entry]) => setIsInHero(entry.isIntersecting),
      { threshold: 0.1 }
    );
    observer.observe(heroEl);
    return () => observer.disconnect();
  }, []);

  const onHero = isInHero;
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const navLinks = [
    { key: "home", href: "#home", label: t("nav.home") },
    { key: "about-us", href: "#about-us", label: t("nav.aboutUs") },
    { key: "contact", href: "#contact", label: t("nav.contact") },
  ];

  const changeLang = (lang: string) => {
    i18n.changeLanguage(lang);
    localStorage.setItem("lang", lang);
  };

  return (
    <Box
      as="nav"
      position="fixed"
      top={0}
      left={0}
      right={0}
      zIndex={50}
      transition="all 0.3s"
      bg={isScrolled && !onHero ? "white/90" : "transparent"}
      backdropFilter={isScrolled && !onHero ? "blur(12px)" : undefined}
      boxShadow={isScrolled && !onHero ? "sm" : undefined}
    >
      <Flex
        maxW="1280px"
        mx="auto"
        px={{ base: 6, lg: 10 }}
        h="80px"
        align="center"
        justify="space-between"
      >
        {/* Logo */}
        <Flex as="a" href="#" align="center">
          <Text
            style={{
              fontFamily: "'Manrope', sans-serif",
              fontSize: "clamp(1.25rem, 2.5vw, 1.6rem)",
              color: onHero ? "white" : "#555555",
              letterSpacing: "0.01em",
              transition: "color 0.3s",
            }}
          >
            A<span style={{ fontFamily: "'Manrope', sans-serif" }}>ē</span>sthetic Group
          </Text>
        </Flex>

        {/* Desktop Nav */}
        <Flex display={{ base: "none", md: "flex" }} align="center" gap={10}>
          {navLinks.map((link) => (
            <Box
              as="a"
              key={link.key}
              href={link.href}
              color={onHero ? "white" : "#1a3c34"}
              fontSize="md"
              position="relative"
              transition="color 0.2s"
              textDecoration="none"
              _hover={{ color: onHero ? "white/70" : "#4e7c6a" }}
              css={{
                "&:hover .underline": { width: "100%" },
              }}
            >
              {link.label}
              <Box
                className="underline"
                position="absolute"
                bottom="-4px"
                left={0}
                w={0}
                h="2px"
                bg={onHero ? "white" : "#4e7c6a"}
                transition="width 0.3s"
              />
            </Box>
          ))}
          {/* Language switcher */}
          <Flex align="center" gap={1} borderRadius="lg" overflow="hidden"
            style={{ border: `1px solid ${onHero ? "rgba(255,255,255,0.35)" : "rgba(78,124,106,0.4)"}` }}>
            {["en", "vi"].map((lang) => (
              <Box
                as="button"
                key={lang}
                onClick={() => changeLang(lang)}
                px={2}
                py={1}
                fontSize="xs"
                fontWeight="600"
                border="none"
                cursor="pointer"
                transition="all 0.2s"
                style={{
                  background: i18n.language === lang
                    ? (onHero ? "rgba(255,255,255,0.25)" : "#4e7c6a")
                    : "transparent",
                  color: i18n.language === lang
                    ? (onHero ? "white" : "white")
                    : (onHero ? "rgba(255,255,255,0.65)" : "#4e7c6a"),
                  letterSpacing: "0.05em",
                }}
              >
                {lang.toUpperCase()}
              </Box>
            ))}
          </Flex>
          <Box
            as="a"
            href="#join"
            px={6}
            py={2}
            borderRadius="lg"
            border="2px solid"
            borderColor={onHero ? "white" : "#4e7c6a"}
            color={onHero ? "white" : "#4e7c6a"}
            fontSize="sm"
            fontWeight="500"
            textDecoration="none"
            transition="all 0.2s"
            cursor="pointer"
            onClick={(e: React.MouseEvent) => {
              e.preventDefault();
              navigate("/login");
            }}
            _hover={{
              bg: onHero ? "white" : "#4e7c6a",
              color: onHero ? "#1a3c34" : "white",
            }}
          >
            {t("nav.login")}
          </Box>
        </Flex>

        {/* Mobile Menu Button */}
        <Box
          as="button"
          display={{ base: "flex", md: "none" }}
          p={2}
          color={onHero ? "white" : "#1a3c34"}
          bg="transparent"
          border="none"
          cursor="pointer"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </Box>
      </Flex>

      {/* Mobile Menu */}
      {mobileOpen && (
        <Box
          display={{ md: "none" }}
          bg="white/95"
          backdropFilter="blur(12px)"
          borderTop="1px solid"
          borderColor="rgba(78,124,106,0.2)"
          px={6}
          py={4}
        >
          <Flex direction="column" gap={4}>
            {navLinks.map((link) => (
              <Link
                key={link.key}
                href={link.href}
                color="#1a3c34"
                py={2}
                borderBottom="1px solid"
                borderColor="gray.100"
                textDecoration="none"
                _hover={{ color: "#4e7c6a" }}
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <Flex align="center" gap={2}>
              {["en", "vi"].map((lang) => (
                <Box
                  as="button"
                  key={lang}
                  onClick={() => changeLang(lang)}
                  px={3}
                  py={1}
                  borderRadius="md"
                  fontSize="xs"
                  fontWeight="600"
                  border="1px solid"
                  borderColor={i18n.language === lang ? "#4e7c6a" : "rgba(78,124,106,0.3)"}
                  bg={i18n.language === lang ? "#4e7c6a" : "transparent"}
                  color={i18n.language === lang ? "white" : "#4e7c6a"}
                  cursor="pointer"
                  transition="all 0.2s"
                >
                  {lang.toUpperCase()}
                </Box>
              ))}
            </Flex>
            <Box
              as="a"
              href="#join"
              px={6}
              py={2}
              borderRadius="lg"
              border="2px solid"
              borderColor="#4e7c6a"
              color="#4e7c6a"
              fontSize="sm"
              fontWeight="500"
              textDecoration="none"
              textAlign="center"
              transition="all 0.2s"
              cursor="pointer"
              onClick={(e: React.MouseEvent) => {
                e.preventDefault();
                navigate("/login");
              }}
              _hover={{ bg: "#4e7c6a", color: "white" }}
            >
              {t("nav.login")}
            </Box>
          </Flex>
        </Box>
      )}
    </Box>
  );
}