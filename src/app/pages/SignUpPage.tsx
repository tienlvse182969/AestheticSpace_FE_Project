import { useState } from "react";
import { Box, Flex, Text, Input } from "@chakra-ui/react";
import { Mail, Eye, EyeOff, User, Loader2 } from "lucide-react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { GoogleAuthButton } from "../components/GoogleAuthButton";
import { useAuth } from "../../context/AuthContext";
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

type Errors = { username?: string; email?: string; password?: string; server?: string };

export function SignUpPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { register, googleLogin, isLoading } = useAuth();
  const reduce = useReducedMotion();

  const [username,     setUsername]     = useState("");
  const [email,        setEmail]        = useState("");
  const [password,     setPassword]     = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors,       setErrors]       = useState<Errors>({});

  const isEmailFormat = (val: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);

  const handleGoogleCredential = async (idToken: string) => {
    await googleLogin(idToken);
    navigate("/space");
  };

  const handleSubmit = async () => {
    const newErrors: Errors = {};

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

    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }
    setErrors({});

    try {
      await register({ username: username.trim(), email: email.trim(), password });
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

  return (
    <Box minH="100vh" position="relative" overflow="hidden" style={{ fontFamily: "'HarmonyOS Sans', sans-serif" }}>
      <Box position="absolute" inset={0} style={{
        backgroundImage: `url(${FOREST_BG})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }} />
      <Box position="absolute" inset={0} style={{ background: "rgba(10, 15, 20, 0.55)" }} />

      {/* Navbar */}
      <Box position="relative" zIndex={10} px={{ base: 6, lg: 10 }} h="80px">
        <Flex maxW="1280px" mx="auto" h="full" align="center" justify="space-between">
          <a href="/" onClick={(e) => { e.preventDefault(); navigate("/"); }} style={{ cursor: "pointer", textDecoration: "none" }}>
            <Text style={{ fontFamily: "'Manrope', sans-serif", fontSize: "clamp(1.1rem, 2vw, 1.45rem)", color: "rgba(255,255,255,0.92)", letterSpacing: "0.01em" }}>
              A<span style={{ fontFamily: "'Manrope', sans-serif" }}>ē</span>sthetic Group
            </Text>
          </a>
          <Flex display={{ base: "none", md: "flex" }} align="center" gap={10}>
            {[t("nav.home"), t("nav.aboutUs"), t("nav.contact")].map((link) => (
              <Box key={link} position="relative"
                css={{ "&:hover .nav-underline": { width: "100%" } }}>
                <a href="#" style={{ color: "white", fontSize: "1rem", textDecoration: "none", cursor: "pointer", opacity: 0.9 }}>
                  {link}
                </a>
                <Box className="nav-underline" position="absolute" bottom="-4px" left={0} w={0} h="1.5px" bg="white" transition="width 0.3s" />
              </Box>
            ))}
            <button
              type="button"
              onClick={() => navigate("/login")}
              style={{
                padding: "8px 20px", borderRadius: "8px",
                border: "2px solid white", color: "white",
                fontSize: "0.875rem", background: "transparent",
                cursor: "pointer", transition: "all 0.2s",
                fontFamily: "'HarmonyOS Sans', sans-serif",
              }}
              onMouseEnter={e => { (e.currentTarget).style.background = "white"; (e.currentTarget).style.color = "#1a3c34"; }}
              onMouseLeave={e => { (e.currentTarget).style.background = "transparent"; (e.currentTarget).style.color = "white"; }}
            >
              {t("auth.login")}
            </button>
          </Flex>
        </Flex>
      </Box>

      {/* Split layout */}
      <Flex position="relative" zIndex={10} minH="calc(100vh - 80px)">

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
          <Text style={{
            fontSize: "1.25rem",
            letterSpacing: "-0.01em",
            color: "rgba(255,255,255,0.92)",
            marginBottom: "28px",
          }}>
            <span style={{ fontFamily: "'Manrope', sans-serif" }}>Aēsthetic</span>
            <span style={{ fontFamily: "'HarmonyOS Sans', sans-serif" }}> Space</span>
          </Text>

          <Text style={{
            fontSize: "clamp(2.8rem, 5vw, 4rem)",
            fontWeight: 700,
            color: "rgba(255,255,255,0.92)",
            fontFamily: "'HarmonyOS Sans', sans-serif",
            lineHeight: 1.12,
            whiteSpace: "pre-line",
            marginBottom: "24px",
          }}>
            {t("auth.signupTagline")}
          </Text>

          <Box style={{ width: 48, height: 2, background: "rgba(255,255,255,0.22)", borderRadius: 1, marginBottom: "20px" }} />

          <Text style={{
            fontSize: "0.95rem",
            color: "rgba(255,255,255,0.48)",
            fontFamily: "'HarmonyOS Sans', sans-serif",
            lineHeight: 1.6,
            maxWidth: 280,
          }}>
            {t("auth.signupSubline")}
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
            key="signup"
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
              {t("auth.signUp")}
            </Text>

            {errors.server && (
              <Box mb={4} px={3} py={2} borderRadius="md" style={{ background: "rgba(248,113,113,0.15)", border: "1px solid rgba(248,113,113,0.35)" }}>
                <Text fontSize="sm" color="#f87171" textAlign="center">{errors.server}</Text>
              </Box>
            )}

            <style>{`@keyframes auth-spin { to { transform: rotate(360deg); } }`}</style>
            <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
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
                  style={inputStyle(!!errors.email)}
                  _placeholder={{ color: "#666" }}
                  _focus={inputFocus(!!errors.email) as any}
                />
                <Box position="absolute" right="12px" top="50%" transform="translateY(-50%)" color={errors.email ? "#f87171" : "#888"} pointerEvents="none">
                  <Mail size={16} />
                </Box>
              </Box>
              {errors.email && <Text fontSize="xs" color="#f87171" mb={3} pl={1}>{errors.email}</Text>}

              {/* Password */}
              <Box mb={errors.password ? 1 : 5} position="relative">
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
              {errors.password && <Text fontSize="xs" color="#f87171" mb={5} pl={1}>{errors.password}</Text>}

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
                  : t("auth.signUp")}
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

            {/* Google Signup */}
            <Box mb={5}>
              <GoogleAuthButton
                label={t("auth.signUpWithGoogle")}
                onCredential={handleGoogleCredential}
                onError={() => setErrors({ server: t("auth.errors.googleError") })}
              />
            </Box>

            {/* Toggle to Login */}
            <Text textAlign="center" fontSize="sm" color="rgba(210,215,225,0.8)">
              {t("auth.alreadyMember") + " "}
              <Box as="span" color="white" fontWeight="700" cursor="pointer" borderBottom="1px solid rgba(255,255,255,0.4)"
                transition="border-color 0.2s" _hover={{ borderColor: "white" }}
                onClick={() => navigate("/login")}>
                {t("auth.login")}
              </Box>
            </Text>
          </MotionBox>
        </AnimatePresence>
        </Flex>
      </Flex>
    </Box>
  );
}
