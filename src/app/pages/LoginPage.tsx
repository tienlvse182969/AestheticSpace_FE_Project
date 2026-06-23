import { useState } from "react";
import { Box, Flex, Text, Input } from "@chakra-ui/react";
import { Mail, Eye, EyeOff, Loader2 } from "lucide-react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { useNavigate, useLocation } from "react-router";
import { useTranslation } from "react-i18next";
import { GoogleAuthButton } from "../components/GoogleAuthButton";
import { useAuth } from "../../context/AuthContext";
import { Navbar } from "../components/homepage/Navbar";
import axios from "axios";

const MotionBox  = motion.create(Box);
const MotionFlex = motion.create(Flex);

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

type Errors = { identifier?: string; password?: string; server?: string };

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const reduce = useReducedMotion();
  const { login, googleLogin, isLoading } = useAuth();

  const [identifier,    setIdentifier]    = useState("");
  const [password,      setPassword]      = useState("");
  const [showPassword,  setShowPassword]  = useState(false);
  const [rememberMe,    setRememberMe]    = useState(false);
  const [errors,        setErrors]        = useState<Errors>({});

  const from = (location.state as any)?.from?.pathname || "/space";

  const isEmailFormat = (val: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);

  const handleGoogleCredential = async (idToken: string) => {
    await googleLogin(idToken);
    navigate(from, { replace: true });
  };

  const handleSubmit = async () => {
    const newErrors: Errors = {};

    if (!identifier.trim())
      newErrors.identifier = t("auth.errors.identifierRequired");
    else if (!isEmailFormat(identifier.trim()))
      newErrors.identifier = t("auth.errors.invalidEmail");

    if (!password)
      newErrors.password = t("auth.errors.passwordRequired");
    else if (password.length < 8)
      newErrors.password = t("auth.errors.passwordTooShort");

    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }
    setErrors({});

    try {
      await login({ email: identifier.trim(), password }, rememberMe);
      navigate(from, { replace: true });
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const msg = err.response?.data?.message;
        setErrors({ server: msg || t("auth.errors.serverError") });
      } else {
        setErrors({ server: t("auth.errors.serverError") });
      }
    }
  };

  return (
    <Box minH="100vh" position="relative" overflow="hidden" style={{ fontFamily: "'HarmonyOS Sans', sans-serif" }}>
      <Box position="absolute" inset={0} style={{
        backgroundImage: `url(${FOREST_BG})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }} />
      <Box position="absolute" inset={0} style={{ background: "rgba(10, 15, 20, 0.55)" }} />

      <Navbar />

      {/* Split layout */}
      <Flex position="relative" zIndex={10} minH="calc(100vh - 80px)" pt="80px">

        {/* ── Left: tagline (desktop only) ── */}
        <MotionFlex
          display={{ base: "none", lg: "flex" }}
          flex={1}
          direction="column"
          justify="center"
          px={{ lg: 14, xl: 20 }}
          pb={10}
          initial={reduce ? false : { opacity: 0, x: -28 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" } as any}
        >
          {/* Brand label */}
          <Text style={{
            fontSize: "1.25rem",
            letterSpacing: "-0.01em",
            color: "rgba(255,255,255,0.92)",
            marginBottom: "28px",
          }}>
            <span style={{ fontFamily: "'Manrope', sans-serif" }}>Aēsthetic</span>
            <span style={{ fontFamily: "'HarmonyOS Sans', sans-serif" }}> Space</span>
          </Text>

          {/* Main tagline */}
          <Text style={{
            fontSize: "clamp(2.8rem, 5vw, 4rem)",
            fontWeight: 700,
            color: "rgba(255,255,255,0.92)",
            fontFamily: "'HarmonyOS Sans', sans-serif",
            lineHeight: 1.12,
            whiteSpace: "pre-line",
            marginBottom: "24px",
          }}>
            {t("auth.loginTagline")}
          </Text>

          {/* Divider */}
          <Box style={{ width: 48, height: 2, background: "rgba(255,255,255,0.22)", borderRadius: 1, marginBottom: "20px" }} />

          {/* Sub line */}
          <Text style={{
            fontSize: "0.95rem",
            color: "rgba(255,255,255,0.48)",
            fontFamily: "'HarmonyOS Sans', sans-serif",
            lineHeight: 1.6,
            maxWidth: 280,
          }}>
            {t("auth.loginSubline")}
          </Text>
        </MotionFlex>

        {/* ── Right: form card ── */}
        <Flex
          w={{ base: "full", lg: "520px" }}
          align="center"
          justify="center"
          px={4}
          pb={12}
          pt={{ base: 6, lg: 0 }}
        >
        <AnimatePresence mode="wait">
          <MotionBox
            key="login"
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
            <Text textAlign="center" mb={8} color="white" style={{ fontFamily: "'HarmonyOS Sans', sans-serif", fontSize: "clamp(1.8rem, 4vw, 2.2rem)", letterSpacing: "0.02em" }}>
              {t("auth.login")}
            </Text>

            {errors.server && (
              <Box mb={4} px={3} py={2} borderRadius="md" style={{ background: "rgba(248,113,113,0.15)", border: "1px solid rgba(248,113,113,0.35)" }}>
                <Text fontSize="sm" color="#f87171" textAlign="center">{errors.server}</Text>
              </Box>
            )}

            <style>{`@keyframes auth-spin { to { transform: rotate(360deg); } }`}</style>
            <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
            {/* Email */}
            <Box mb={errors.identifier ? 1 : 4} position="relative">
              <Input
                placeholder={t("auth.emailPlaceholder")}
                type="email"
                value={identifier}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  setIdentifier(e.target.value);
                  if (errors.identifier) setErrors(p => ({ ...p, identifier: undefined }));
                }}
                style={inputStyle(!!errors.identifier)}
                _placeholder={{ color: "#666" }}
                _focus={inputFocus(!!errors.identifier) as any}
              />
              <Box position="absolute" right="12px" top="50%" transform="translateY(-50%)" color={errors.identifier ? "#f87171" : "#888"} pointerEvents="none">
                <Mail size={16} />
              </Box>
            </Box>
            {errors.identifier && <Text fontSize="xs" color="#f87171" mb={3} pl={1}>{errors.identifier}</Text>}

            {/* Password */}
            <Box mb={errors.password ? 1 : 3} position="relative">
              <Input
                placeholder={t("auth.passwordPlaceholder")}
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  setPassword(e.target.value);
                  if (errors.password) setErrors(p => ({ ...p, password: undefined }));
                }}
                style={inputStyle(!!errors.password)}
                _placeholder={{ color: "#666" }}
                _focus={inputFocus(!!errors.password) as any}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                  color: errors.password ? "#f87171" : "#888",
                  background: "none", border: "none", cursor: "pointer",
                  display: "flex", alignItems: "center", padding: 0,
                }}
              >
                {showPassword ? <Eye size={16} /> : <EyeOff size={16} />}
              </button>
            </Box>
            {errors.password && <Text fontSize="xs" color="#f87171" mb={3} pl={1}>{errors.password}</Text>}

            {/* Remember Me + Forgot Password */}
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
              <Text as="span" fontSize="sm" color="rgba(230,235,240,0.85)" cursor="pointer"
                _hover={{ color: "white", textDecoration: "underline" } as any} transition="color 0.2s"
                onClick={() => navigate("/forgot-password")}>
                {t("auth.forgotPassword")}
              </Text>
            </Flex>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              style={{
                width: "100%", height: "44px", borderRadius: "6px",
                color: "white", fontSize: "0.875rem", letterSpacing: "0.06em",
                cursor: isLoading ? "not-allowed" : "pointer",
                border: "none", transition: "all 0.2s", marginBottom: "20px",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                fontFamily: "'HarmonyOS Sans', sans-serif",
                background: isLoading
                  ? "rgba(26,58,138,0.5)"
                  : "linear-gradient(135deg, #1a3a8a 0%, #1e4db5 100%)",
                boxShadow: "0 4px 16px rgba(26,58,138,0.4)",
                opacity: isLoading ? 0.7 : 1,
              }}
            >
              {isLoading
                ? <Loader2 size={18} style={{ animation: "auth-spin 0.75s linear infinite" }} />
                : t("auth.login")}
            </button>
            </form>

            {/* Divider */}
            <Flex align="center" my={4} gap={3}>
              <Box flex={1} h="1px" style={{ background: "rgba(255,255,255,0.15)" }} />
              <Text style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.32)", letterSpacing: "0.12em", fontFamily: "'HarmonyOS Sans', sans-serif" }}>
                {t("auth.orContinueWith")}
              </Text>
              <Box flex={1} h="1px" style={{ background: "rgba(255,255,255,0.15)" }} />
            </Flex>

            {/* Google Login */}
            <Box mb={5}>
              <GoogleAuthButton
                label={t("auth.signInWithGoogle")}
                onCredential={handleGoogleCredential}
                onError={() => setErrors({ server: t("auth.errors.googleError") })}
              />
            </Box>

            {/* Toggle to Sign Up */}
            <Text textAlign="center" fontSize="sm" color="rgba(210,215,225,0.8)">
              {t("auth.noAccount") + " "}
              <Box as="span" color="white" fontWeight="700" cursor="pointer" borderBottom="1px solid rgba(255,255,255,0.4)"
                transition="border-color 0.2s" _hover={{ borderColor: "white" }}
                onClick={() => navigate("/signup")}>
                {t("auth.register")}
              </Box>
            </Text>
          </MotionBox>
        </AnimatePresence>
        </Flex>
      </Flex>
    </Box>
  );
}
