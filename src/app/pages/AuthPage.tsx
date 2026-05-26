import { useState } from "react";
import { Box, Flex, Text, Input } from "@chakra-ui/react";
import { Mail, Lock, Eye, EyeOff, User, AtSign } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useNavigate, useLocation } from "react-router";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../context/AuthContext";
import axios from "axios";

const MotionBox = motion.create(Box);

const FOREST_BG =
  "https://images.unsplash.com/photo-1768383236117-d2ebae5b175d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkYXJrJTIwbWlzdHklMjBmb3Jlc3QlMjB0cmVlcyUyMG1vb2R5JTIwYXRtb3NwaGVyaWN8ZW58MXx8fHwxNzc0Mjc5OTI1fDA&ixlib=rb-4.1.0&q=80&w=1080";

const inputStyle = (hasError: boolean) => ({
  background: "rgba(235, 238, 240, 0.92)",
  border: hasError ? "1px solid #f87171" : "1px solid rgba(180,185,195,0.6)",
  borderRadius: "6px",
  color: "#2a2a2a",
  fontSize: "0.9rem",
  paddingRight: "42px",
  height: "44px",
  outline: "none",
  width: "100%",
});

const inputFocus = (hasError: boolean) => ({
  background: "rgba(245, 247, 249, 0.98)",
  borderColor: hasError ? "#f87171" : "rgba(78,124,106,0.7)",
  boxShadow: hasError ? "0 0 0 2px rgba(248,113,113,0.2)" : "0 0 0 2px rgba(78,124,106,0.2)",
});

type Errors = { identifier?: string; username?: string; email?: string; password?: string; server?: string };

export function AuthPage() {
  const location = useLocation();
  const initialMode = (location.state as { mode?: string })?.mode === "signup" ? "signup" : "login";
  const [mode, setMode]               = useState<"login" | "signup">(initialMode);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe,   setRememberMe]   = useState(false);
  const { t } = useTranslation();
  const { login, register, isLoading } = useAuth();

  // Login fields
  const [identifier, setIdentifier] = useState("");

  // Signup fields
  const [username, setUsername] = useState("");
  const [email,    setEmail]    = useState("");

  const [password, setPassword] = useState("");
  const [errors,   setErrors]   = useState<Errors>({});
  const navigate = useNavigate();

  const isLogin = mode === "login";

  const isEmailFormat = (val: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);

  const handleSubmit = async () => {
    const newErrors: Errors = {};

    if (isLogin) {
      if (!identifier.trim())
        newErrors.identifier = t("auth.errors.identifierRequired");
      else if (!isEmailFormat(identifier.trim()))
        newErrors.identifier = t("auth.errors.invalidEmail");
      if (!password)
        newErrors.password = t("auth.errors.passwordRequired");
      else if (password.length < 6)
        newErrors.password = t("auth.errors.passwordTooShort");
    } else {
      if (!username.trim())
        newErrors.username = t("auth.errors.usernameRequired");
      else if (username.trim().length < 3)
        newErrors.username = t("auth.errors.usernameTooShort");
      if (!email.trim())
        newErrors.email = t("auth.errors.emailRequired");
      else if (!isEmailFormat(email.trim()))
        newErrors.email = t("auth.errors.invalidEmailFormat");
      if (!password)
        newErrors.password = t("auth.errors.passwordRequired");
      else if (password.length < 6)
        newErrors.password = t("auth.errors.passwordTooShort");
    }

    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }
    setErrors({});

    try {
      if (isLogin) {
        await login({ email: identifier.trim(), password });
      } else {
        await register({ username: username.trim(), email: email.trim(), password });
      }
      navigate("/space");
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const msg = err.response?.data?.message;
        setErrors({ server: msg || t("auth.errors.serverError") });
      } else {
        setErrors({ server: t("auth.errors.serverError") });
      }
    }
  };

  const handleModeSwitch = (newMode: "login" | "signup") => {
    setMode(newMode);
    setErrors({});
    setIdentifier("");
    setUsername("");
    setEmail("");
    setPassword("");
  };

  return (
    <Box minH="100vh" position="relative" overflow="hidden" style={{ fontFamily: "'HarmonyOS Sans', sans-serif" }}>
      <Box position="absolute" inset={0} bgImage={`url(${FOREST_BG})`} bgSize="cover" bgPosition="center" bgRepeat="no-repeat" />
      <Box position="absolute" inset={0} style={{ background: "rgba(10, 15, 20, 0.55)" }} />

      {/* Navbar */}
      <Box position="relative" zIndex={10} px={{ base: 6, lg: 10 }} h="80px">
        <Flex maxW="1280px" mx="auto" h="full" align="center" justify="space-between">
          <Box as="a" href="/" style={{ cursor: "pointer" }} onClick={(e: React.MouseEvent) => { e.preventDefault(); navigate("/"); }}>
            <Text style={{ fontFamily: "'Manrope', sans-serif", fontSize: "clamp(1.1rem, 2vw, 1.45rem)", color: "rgba(255,255,255,0.92)", letterSpacing: "0.01em" }}>
              A<span style={{ fontFamily: "'Manrope', sans-serif" }}>ē</span>sthetic Group
            </Text>
          </Box>
          <Flex display={{ base: "none", md: "flex" }} align="center" gap={10}>
            {[t("nav.home"), t("nav.aboutUs"), t("nav.contact")].map((link) => (
              <Box key={link} as="a" href="#" color="white" fontSize="md" textDecoration="none" position="relative"
                style={{ cursor: "pointer", opacity: 0.9 }} _hover={{ opacity: 1 }}
                css={{ "&:hover .nav-underline": { width: "100%" } }}>
                {link}
                <Box className="nav-underline" position="absolute" bottom="-4px" left={0} w={0} h="1.5px" bg="white" transition="width 0.3s" />
              </Box>
            ))}
            <Box as="button" px={5} py={2} borderRadius="lg" border="2px solid" borderColor="white" color="white"
              fontSize="sm" bg="transparent" cursor="pointer" transition="all 0.2s"
              onClick={() => setMode("login")} _hover={{ bg: "white", color: "#1a3c34" }}>
              {t("auth.login")}
            </Box>
          </Flex>
        </Flex>
      </Box>

      {/* Auth Card */}
      <Flex position="relative" zIndex={10} minH="calc(100vh - 80px)" align="center" justify="center" px={4} pb={12}>
        <AnimatePresence mode="wait">
          <MotionBox
            key={mode}
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.97 }}
            transition={{ duration: 0.35, ease: "easeOut" } as any}
            w="full" maxW="420px" borderRadius="2xl" overflow="hidden"
            style={{
              background: "rgba(80, 88, 100, 0.52)",
              backdropFilter: "blur(18px)",
              WebkitBackdropFilter: "blur(18px)",
              border: "1px solid rgba(200, 210, 220, 0.25)",
              boxShadow: "0 24px 64px rgba(0,0,0,0.45)",
            }}
            px={{ base: 8, sm: 10 }} pt={10} pb={10}
          >
            {/* Title */}
            <Text textAlign="center" mb={8} color="white" style={{ fontFamily: "'HarmonyOS Sans', sans-serif", fontSize: "clamp(1.8rem, 4vw, 2.2rem)", letterSpacing: "0.02em" }}>
              {isLogin ? t("auth.login") : t("auth.signUp")}
            </Text>

            {/* Server error */}
            {errors.server && (
              <Box mb={4} px={3} py={2} borderRadius="md" style={{ background: "rgba(248,113,113,0.15)", border: "1px solid rgba(248,113,113,0.35)" }}>
                <Text fontSize="sm" color="#f87171" textAlign="center">{errors.server}</Text>
              </Box>
            )}

            {/* ── LOGIN FIELDS ── */}
            {isLogin && (
              <>
                <Box mb={errors.identifier ? 1 : 4} position="relative">
                  <Input
                    placeholder={t("auth.emailPlaceholder")}
                    type="email"
                    value={identifier}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      setIdentifier(e.target.value);
                      if (errors.identifier) setErrors(p => ({ ...p, identifier: undefined }));
                    }}
                    onKeyDown={(e: React.KeyboardEvent) => { if (e.key === "Enter") handleSubmit(); }}
                    style={inputStyle(!!errors.identifier)}
                    _placeholder={{ color: "#666" }}
                    _focus={inputFocus(!!errors.identifier) as any}
                  />
                  <Box position="absolute" right="12px" top="50%" transform="translateY(-50%)" color={errors.identifier ? "#f87171" : "#888"} pointerEvents="none">
                    <Mail size={16} />
                  </Box>
                </Box>
                {errors.identifier && <Text fontSize="xs" color="#f87171" mb={3} pl={1}>{errors.identifier}</Text>}
              </>
            )}

            {/* ── SIGNUP FIELDS ── */}
            {!isLogin && (
              <>
                {/* Username */}
                <Box mb={errors.username ? 1 : 4} position="relative">
                  <Input
                    placeholder={t("auth.usernamePlaceholder")}
                    type="text"
                    value={username}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      setUsername(e.target.value);
                      if (errors.username) setErrors(p => ({ ...p, username: undefined }));
                    }}
                    onKeyDown={(e: React.KeyboardEvent) => { if (e.key === "Enter") handleSubmit(); }}
                    style={inputStyle(!!errors.username)}
                    _placeholder={{ color: "#666" }}
                    _focus={inputFocus(!!errors.username) as any}
                  />
                  <Box position="absolute" right="12px" top="50%" transform="translateY(-50%)" color={errors.username ? "#f87171" : "#888"} pointerEvents="none">
                    <User size={16} />
                  </Box>
                </Box>
                {errors.username && <Text fontSize="xs" color="#f87171" mb={3} pl={1}>{errors.username}</Text>}

                {/* Email */}
                <Box mb={errors.email ? 1 : 4} position="relative">
                  <Input
                    placeholder={t("auth.emailPlaceholder")}
                    type="email"
                    value={email}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      setEmail(e.target.value);
                      if (errors.email) setErrors(p => ({ ...p, email: undefined }));
                    }}
                    onKeyDown={(e: React.KeyboardEvent) => { if (e.key === "Enter") handleSubmit(); }}
                    style={inputStyle(!!errors.email)}
                    _placeholder={{ color: "#666" }}
                    _focus={inputFocus(!!errors.email) as any}
                  />
                  <Box position="absolute" right="12px" top="50%" transform="translateY(-50%)" color={errors.email ? "#f87171" : "#888"} pointerEvents="none">
                    <Mail size={16} />
                  </Box>
                </Box>
                {errors.email && <Text fontSize="xs" color="#f87171" mb={3} pl={1}>{errors.email}</Text>}
              </>
            )}

            {/* Password */}
            <Box mb={errors.password ? 1 : isLogin ? 3 : 5} position="relative">
              <Input
                placeholder={t("auth.passwordPlaceholder")}
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  setPassword(e.target.value);
                  if (errors.password) setErrors(p => ({ ...p, password: undefined }));
                }}
                onKeyDown={(e: React.KeyboardEvent) => { if (e.key === "Enter") handleSubmit(); }}
                style={inputStyle(!!errors.password)}
                _placeholder={{ color: "#666" }}
                _focus={inputFocus(!!errors.password) as any}
              />
              <Box position="absolute" right="12px" top="50%" transform="translateY(-50%)"
                color={errors.password ? "#f87171" : "#888"} cursor="pointer"
                onClick={() => setShowPassword(!showPassword)} as="button" bg="transparent" border="none"
                display="flex" alignItems="center">
                {showPassword ? <Eye size={16} /> : <EyeOff size={16} />}
              </Box>
            </Box>
            {errors.password && <Text fontSize="xs" color="#f87171" mb={isLogin ? 3 : 5} pl={1}>{errors.password}</Text>}

            {/* Remember Me + Forgot Password (login only) */}
            {isLogin && (
              <Flex align="center" justify="space-between" mb={5}>
                <Flex align="center" gap={2} cursor="pointer" onClick={() => setRememberMe(!rememberMe)} as="label">
                  <Box w="14px" h="14px" border="1.5px solid"
                    borderColor={rememberMe ? "#4e7c6a" : "rgba(200,205,210,0.8)"}
                    borderRadius="3px" bg={rememberMe ? "#4e7c6a" : "rgba(235,238,240,0.85)"}
                    display="flex" alignItems="center" justifyContent="center" transition="all 0.15s" flexShrink={0}>
                    {rememberMe && (
                      <Box as="span" style={{ display: "block", width: "7px", height: "5px", borderLeft: "1.5px solid white", borderBottom: "1.5px solid white", transform: "rotate(-45deg) translate(1px, -1px)" }} />
                    )}
                  </Box>
                  <Text fontSize="sm" color="rgba(230,235,240,0.85)" style={{ userSelect: "none" }}>{t("auth.rememberMe")}</Text>
                </Flex>
                <Text as="a" href="#" fontSize="sm" color="rgba(230,235,240,0.85)" textDecoration="none"
                  _hover={{ color: "white", textDecoration: "underline" }} transition="color 0.2s">
                  {t("auth.forgotPassword")}
                </Text>
              </Flex>
            )}

            {/* Submit */}
            <Box as="button" w="full" h="44px" borderRadius="6px" color="white" fontSize="sm"
              letterSpacing="0.06em" cursor={isLoading ? "not-allowed" : "pointer"} border="none" transition="all 0.2s" mb={5}
              style={{
                background: isLoading
                  ? "rgba(26,58,138,0.5)"
                  : "linear-gradient(135deg, #1a3a8a 0%, #1e4db5 100%)",
                boxShadow: "0 4px 16px rgba(26,58,138,0.4)",
                opacity: isLoading ? 0.7 : 1,
              }}
              _hover={!isLoading ? { transform: "translateY(-1px)", boxShadow: "0 6px 20px rgba(26,58,138,0.55)" } : {}}
              _active={{ transform: "translateY(0px)" }}
              onClick={handleSubmit}
              disabled={isLoading}>
              {isLoading ? "..." : (isLogin ? t("auth.login") : t("auth.signUp"))}
            </Box>

            {/* Toggle */}
            <Text textAlign="center" fontSize="sm" color="rgba(210,215,225,0.8)">
              {isLogin ? t("auth.noAccount") + " " : t("auth.alreadyMember") + " "}
              <Box as="span" color="white" fontWeight="700" cursor="pointer" borderBottom="1px solid rgba(255,255,255,0.4)"
                transition="border-color 0.2s" _hover={{ borderColor: "white" }}
                onClick={() => handleModeSwitch(isLogin ? "signup" : "login")}>
                {isLogin ? t("auth.register") : t("auth.login")}
              </Box>
            </Text>
          </MotionBox>
        </AnimatePresence>
      </Flex>
    </Box>
  );
}
