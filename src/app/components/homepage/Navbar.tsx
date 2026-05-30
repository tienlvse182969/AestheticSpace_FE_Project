import { useState, useEffect, useRef } from "react";
import { Box, Flex, Text, Link } from "@chakra-ui/react";
import { Menu, X, Info, Settings, LogOut, Layers } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../../context/AuthContext";

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function AvatarBubble({ avatarUrl, name, size = 28 }: { avatarUrl: string | null; name: string; size?: number }) {
  if (avatarUrl) {
    return (
      <Box w={`${size}px`} h={`${size}px`} borderRadius="full" overflow="hidden" flexShrink={0}>
        <img src={avatarUrl} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </Box>
    );
  }
  return (
    <Box
      w={`${size}px`} h={`${size}px`} borderRadius="full" flexShrink={0}
      display="flex" alignItems="center" justifyContent="center"
      style={{
        background: "linear-gradient(135deg, #2a6b55 0%, #1a4db5 100%)",
        color: "white",
        fontSize: size < 32 ? "0.6rem" : "0.75rem",
        fontWeight: 600,
        letterSpacing: "0.03em",
      }}
    >
      {getInitials(name)}
    </Box>
  );
}

const menuItemBase = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  width: "100%",
  padding: "8px 10px",
  borderRadius: "9px",
  background: "transparent",
  border: "none",
  cursor: "pointer",
  textAlign: "left" as const,
  transition: "background 0.15s, color 0.15s",
  fontSize: "0.83rem",
  fontFamily: "'HarmonyOS Sans', sans-serif",
  letterSpacing: "0.01em",
  color: "rgba(255,255,255,0.78)",
};

export function Navbar() {
  const [isScrolled, setIsScrolled]   = useState(false);
  const [isInHero,   setIsInHero]     = useState(true);
  const [mobileOpen, setMobileOpen]   = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);

  const avatarBtnRef  = useRef<HTMLDivElement>(null);
  const dropdownRef   = useRef<HTMLDivElement>(null);

  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

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

  // Close dropdown on outside click
  useEffect(() => {
    if (!accountOpen) return;
    const handler = (e: MouseEvent) => {
      if (
        dropdownRef.current?.contains(e.target as Node) ||
        avatarBtnRef.current?.contains(e.target as Node)
      ) return;
      setAccountOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [accountOpen]);

  const onHero = isInHero;

  const navLinks = [
    { key: "home",     href: "#home",     label: t("nav.home"),    route: null },
    { key: "about-us", href: "#about-us", label: t("nav.aboutUs"), route: null },
    { key: "pricing",  href: "/pricing",  label: t("nav.pricing"), route: "/pricing" },
    { key: "contact",  href: "#contact",  label: t("nav.contact"), route: null },
  ];

  const changeLang = (lang: string) => {
    i18n.changeLanguage(lang);
    localStorage.setItem("lang", lang);
  };

  const handleLogout = () => {
    logout();
    setAccountOpen(false);
    navigate("/");
  };

  return (
    <Box
      as="nav"
      position="fixed"
      top={0} left={0} right={0}
      zIndex={50}
      transition="all 0.3s"
      bg={isScrolled && !onHero ? "white/90" : "transparent"}
      backdropFilter={isScrolled && !onHero ? "blur(12px)" : undefined}
      boxShadow={isScrolled && !onHero ? "sm" : undefined}
    >
      <Flex maxW="1280px" mx="auto" px={{ base: 6, lg: 10 }} h="80px" align="center" justify="space-between">

        {/* Logo */}
        <Flex as="a" href="#" align="center">
          <Text style={{
            fontFamily: "'Manrope', sans-serif",
            fontSize: "clamp(1.25rem, 2.5vw, 1.6rem)",
            color: onHero ? "white" : "#555555",
            letterSpacing: "0.01em",
            transition: "color 0.3s",
          }}>
            A<span style={{ fontFamily: "'Manrope', sans-serif" }}>ē</span>sthetic Group
          </Text>
        </Flex>

        {/* Desktop Nav */}
        <Flex display={{ base: "none", md: "flex" }} align="center" gap={10}>
          {navLinks.map((link) => (
            <Link
              key={link.key}
              href={link.route ? undefined : link.href}
              color={onHero ? "white" : "#1a3c34"}
              fontSize="md" position="relative" transition="color 0.2s" textDecoration="none"
              cursor="pointer"
              _hover={{ color: onHero ? "white/70" : "#4e7c6a" }}
              css={{ "&:hover .underline": { width: "100%" } }}
              onClick={link.route ? (e: React.MouseEvent) => { e.preventDefault(); navigate(link.route!); } : undefined}
            >
              {link.label}
              <Box className="underline" position="absolute" bottom="-4px" left={0} w={0} h="2px"
                bg={onHero ? "white" : "#4e7c6a"} transition="width 0.3s" />
            </Link>
          ))}

          {/* Language switcher */}
          <Flex align="center" gap={1} borderRadius="lg" overflow="hidden"
            style={{ border: `1px solid ${onHero ? "rgba(255,255,255,0.35)" : "rgba(78,124,106,0.4)"}` }}>
            {["en", "vi"].map((lang) => (
              <Box as="button" key={lang} onClick={() => changeLang(lang)}
                px={2} py={1} fontSize="xs" fontWeight="600" border="none" cursor="pointer" transition="all 0.2s"
                style={{
                  background: i18n.language === lang ? (onHero ? "rgba(255,255,255,0.25)" : "#4e7c6a") : "transparent",
                  color: i18n.language === lang ? "white" : (onHero ? "rgba(255,255,255,0.65)" : "#4e7c6a"),
                  letterSpacing: "0.05em",
                }}>
                {lang.toUpperCase()}
              </Box>
            ))}
          </Flex>

          {/* User avatar + name OR Login button */}
          {user ? (
            <Box position="relative">
              {/* Trigger button */}
              <Flex
                ref={avatarBtnRef}
                align="center" gap={2} cursor="pointer"
                onClick={() => setAccountOpen(v => !v)}
                px={3} py={1} borderRadius="lg" transition="all 0.2s"
                style={{ border: `1px solid ${onHero ? "rgba(255,255,255,0.25)" : "rgba(78,124,106,0.3)"}` }}
                _hover={{ bg: onHero ? "rgba(255,255,255,0.1)" : "rgba(78,124,106,0.08)" }}
              >
                <AvatarBubble avatarUrl={user.avatarUrl} name={user.name} size={28} />
                <Text fontSize="sm" fontWeight="500" color={onHero ? "white" : "#1a3c34"}
                  style={{ maxWidth: "100px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {user.name}
                </Text>
              </Flex>

              {/* Dropdown panel */}
              <AnimatePresence>
                {accountOpen && (
                  <motion.div
                    ref={dropdownRef}
                    initial={{ opacity: 0, scale: 0.94, y: -8 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.94, y: -8 }}
                    transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
                    style={{
                      position: "absolute",
                      top: "calc(100% + 12px)",
                      right: 0,
                      zIndex: 200,
                      background: "rgba(12,18,22,0.92)",
                      backdropFilter: "blur(20px)",
                      WebkitBackdropFilter: "blur(20px)",
                      border: "1px solid rgba(255,255,255,0.12)",
                      borderRadius: "16px",
                      padding: "10px",
                      minWidth: "220px",
                      boxShadow: "0 16px 48px rgba(0,0,0,0.55)",
                      transformOrigin: "top right",
                    }}
                  >
                    {/* User info */}
                    <Flex align="center" gap={3} px={2} py={2} mb={1}>
                      <AvatarBubble avatarUrl={user.avatarUrl} name={user.name} size={40} />
                      <Box overflow="hidden">
                        <Text style={{
                          color: "rgba(255,255,255,0.95)", fontSize: "0.88rem",
                          fontFamily: "'HarmonyOS Sans', sans-serif",
                          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "140px",
                        }}>
                          {user.name}
                        </Text>
                        <Text style={{
                          color: "rgba(255,255,255,0.42)", fontSize: "0.75rem",
                          fontFamily: "'HarmonyOS Sans', sans-serif",
                          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "140px",
                        }}>
                          {user.email}
                        </Text>
                      </Box>
                    </Flex>

                    {/* Divider */}
                    <Box mx={2} my="6px" h="1px" style={{ background: "rgba(255,255,255,0.08)" }} />

                    {/* Go to Space */}
                    <Box as="button"
                      onClick={() => { setAccountOpen(false); navigate("/space"); }}
                      style={menuItemBase}
                      onMouseEnter={e => Object.assign((e.currentTarget as HTMLElement).style, { background: "rgba(255,255,255,0.08)", color: "white" })}
                      onMouseLeave={e => Object.assign((e.currentTarget as HTMLElement).style, { background: "transparent", color: "rgba(255,255,255,0.78)" })}
                    >
                      <Layers size={15} style={{ opacity: 0.65, flexShrink: 0 }} />
                      {t("account.mySpace")}
                    </Box>

                    {/* About */}
                    <Box as="button"
                      onClick={() => { setAccountOpen(false); navigate("/about"); }}
                      style={menuItemBase}
                      onMouseEnter={e => Object.assign((e.currentTarget as HTMLElement).style, { background: "rgba(255,255,255,0.08)", color: "white" })}
                      onMouseLeave={e => Object.assign((e.currentTarget as HTMLElement).style, { background: "transparent", color: "rgba(255,255,255,0.78)" })}
                    >
                      <Info size={15} style={{ opacity: 0.65, flexShrink: 0 }} />
                      {t("account.about")}
                    </Box>

                    {/* Settings */}
                    <Box as="button"
                      onClick={() => { setAccountOpen(false); navigate("/space", { state: { openPanel: "settings" } }); }}
                      style={menuItemBase}
                      onMouseEnter={e => Object.assign((e.currentTarget as HTMLElement).style, { background: "rgba(255,255,255,0.08)", color: "white" })}
                      onMouseLeave={e => Object.assign((e.currentTarget as HTMLElement).style, { background: "transparent", color: "rgba(255,255,255,0.78)" })}
                    >
                      <Settings size={15} style={{ opacity: 0.65, flexShrink: 0 }} />
                      {t("account.settings")}
                    </Box>

                    {/* Divider */}
                    <Box mx={2} my="6px" h="1px" style={{ background: "rgba(255,255,255,0.08)" }} />

                    {/* Sign out */}
                    <Box as="button"
                      onClick={handleLogout}
                      style={{ ...menuItemBase, color: "rgba(248,113,113,0.85)" }}
                      onMouseEnter={e => Object.assign((e.currentTarget as HTMLElement).style, { background: "rgba(248,113,113,0.1)", color: "#f87171" })}
                      onMouseLeave={e => Object.assign((e.currentTarget as HTMLElement).style, { background: "transparent", color: "rgba(248,113,113,0.85)" })}
                    >
                      <LogOut size={15} style={{ flexShrink: 0 }} />
                      {t("account.signOut")}
                    </Box>
                  </motion.div>
                )}
              </AnimatePresence>
            </Box>
          ) : (
            <Box as="button"
              px={6} py={2} borderRadius="lg" border="2px solid"
              borderColor={onHero ? "white" : "#4e7c6a"}
              color={onHero ? "white" : "#4e7c6a"}
              fontSize="sm" fontWeight="500" bg="transparent" transition="all 0.2s" cursor="pointer"
              onClick={() => navigate("/login")}
              _hover={{ bg: onHero ? "white" : "#4e7c6a", color: onHero ? "#1a3c34" : "white" }}
            >
              {t("nav.login")}
            </Box>
          )}
        </Flex>

        {/* Mobile Menu Button */}
        <Box as="button" display={{ base: "flex", md: "none" }} p={2}
          color={onHero ? "white" : "#1a3c34"} bg="transparent" border="none" cursor="pointer"
          onClick={() => setMobileOpen(!mobileOpen)} aria-label="Toggle menu">
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </Box>
      </Flex>

      {/* Mobile Menu */}
      {mobileOpen && (
        <Box display={{ md: "none" }} bg="white/95" backdropFilter="blur(12px)"
          borderTop="1px solid" borderColor="rgba(78,124,106,0.2)" px={6} py={4}>
          <Flex direction="column" gap={4}>
            {navLinks.map((link) => (
              <Link key={link.key}
                href={link.route ? undefined : link.href}
                color="#1a3c34" py={2}
                borderBottom="1px solid" borderColor="gray.100" textDecoration="none"
                cursor="pointer"
                _hover={{ color: "#4e7c6a" }}
                onClick={(e: React.MouseEvent) => {
                  setMobileOpen(false);
                  if (link.route) { e.preventDefault(); navigate(link.route); }
                }}>
                {link.label}
              </Link>
            ))}

            <Flex align="center" gap={2}>
              {["en", "vi"].map((lang) => (
                <Box as="button" key={lang} onClick={() => changeLang(lang)}
                  px={3} py={1} borderRadius="md" fontSize="xs" fontWeight="600" border="1px solid"
                  borderColor={i18n.language === lang ? "#4e7c6a" : "rgba(78,124,106,0.3)"}
                  bg={i18n.language === lang ? "#4e7c6a" : "transparent"}
                  color={i18n.language === lang ? "white" : "#4e7c6a"}
                  cursor="pointer" transition="all 0.2s">
                  {lang.toUpperCase()}
                </Box>
              ))}
            </Flex>

            {/* Mobile: user section or login */}
            {user ? (
              <Flex direction="column" gap={1}
                style={{ background: "rgba(12,18,22,0.06)", borderRadius: "12px", padding: "10px" }}>
                <Flex align="center" gap={3} px={1} py={1} mb={1}>
                  <AvatarBubble avatarUrl={user.avatarUrl} name={user.name} size={36} />
                  <Box>
                    <Text fontSize="sm" fontWeight="600" color="#1a3c34">{user.name}</Text>
                    <Text fontSize="xs" color="#6b7280">{user.email}</Text>
                  </Box>
                </Flex>
                <Box h="1px" style={{ background: "rgba(0,0,0,0.08)" }} mx={1} my={1} />
                <Box as="button" onClick={() => { setMobileOpen(false); navigate("/space"); }}
                  style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 10px", borderRadius: "8px", background: "transparent", border: "none", cursor: "pointer", color: "#1a3c34", fontSize: "0.84rem" }}>
                  <Layers size={15} style={{ opacity: 0.6 }} />
                  {t("account.mySpace")}
                </Box>
                <Box as="button" onClick={() => { setMobileOpen(false); navigate("/about"); }}
                  style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 10px", borderRadius: "8px", background: "transparent", border: "none", cursor: "pointer", color: "#1a3c34", fontSize: "0.84rem" }}>
                  <Info size={15} style={{ opacity: 0.6 }} />
                  {t("account.about")}
                </Box>
                <Box as="button" onClick={() => { setMobileOpen(false); navigate("/space", { state: { openPanel: "settings" } }); }}
                  style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 10px", borderRadius: "8px", background: "transparent", border: "none", cursor: "pointer", color: "#1a3c34", fontSize: "0.84rem" }}>
                  <Settings size={15} style={{ opacity: 0.6 }} />
                  {t("account.settings")}
                </Box>
                <Box h="1px" style={{ background: "rgba(0,0,0,0.08)" }} mx={1} my={1} />
                <Box as="button" onClick={() => { setMobileOpen(false); handleLogout(); }}
                  style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 10px", borderRadius: "8px", background: "transparent", border: "none", cursor: "pointer", color: "#ef4444", fontSize: "0.84rem" }}>
                  <LogOut size={15} />
                  {t("account.signOut")}
                </Box>
              </Flex>
            ) : (
              <Box as="button"
                px={6} py={2} borderRadius="lg" border="2px solid" borderColor="#4e7c6a"
                color="#4e7c6a" fontSize="sm" fontWeight="500" bg="transparent" textAlign="center"
                transition="all 0.2s" cursor="pointer"
                onClick={() => { setMobileOpen(false); navigate("/login"); }}
                _hover={{ bg: "#4e7c6a", color: "white" }}>
                {t("nav.login")}
              </Box>
            )}
          </Flex>
        </Box>
      )}
    </Box>
  );
}
