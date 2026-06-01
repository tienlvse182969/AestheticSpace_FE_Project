import { useState } from "react";
import { Box, Flex, Text, Input } from "@chakra-ui/react";
import { Mail, Loader2, ArrowLeft, CheckCircle } from "lucide-react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { authService } from "../../services/auth.service";
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

export function ForgotPasswordPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const reduce = useReducedMotion();

  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [serverError, setServerError] = useState("");

  const isEmailFormat = (val: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);

  const handleSubmit = async () => {
    if (!email.trim()) { setEmailError(t("auth.errors.emailRequired")); return; }
    if (!isEmailFormat(email.trim())) { setEmailError(t("auth.errors.invalidEmailFormat")); return; }
    setEmailError("");
    setServerError("");
    setIsLoading(true);
    try {
      await authService.forgotPassword(email.trim());
      setSent(true);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setServerError(err.response?.data?.message || t("auth.errors.serverError"));
      } else {
        setServerError(t("auth.errors.serverError"));
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box minH="100vh" position="relative" overflow="hidden" style={{ fontFamily: "'HarmonyOS Sans', sans-serif" }}>
      <Box position="absolute" inset={0} style={{
        backgroundImage: `url(${FOREST_BG})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }} />
      <Box position="absolute" inset={0} style={{ background: "rgba(10, 15, 20, 0.55)" }} />

      {/* Navbar */}
      <Box position="relative" zIndex={10} px={{ base: 6, lg: 10 }} h="80px">
        <Flex maxW="1280px" mx="auto" h="full" align="center">
          <a href="/" onClick={(e) => { e.preventDefault(); navigate("/"); }} style={{ cursor: "pointer", textDecoration: "none" }}>
            <Text style={{ fontFamily: "'Manrope', sans-serif", fontSize: "clamp(1.1rem, 2vw, 1.45rem)", color: "rgba(255,255,255,0.92)", letterSpacing: "0.01em" }}>
              A<span style={{ fontFamily: "'Manrope', sans-serif" }}>ē</span>sthetic Group
            </Text>
          </a>
        </Flex>
      </Box>

      <Flex position="relative" zIndex={10} minH="calc(100vh - 80px)" align="center" justify="center" px={4} pb={12}>
        <AnimatePresence mode="wait">
          <MotionBox
            key="forgot"
            initial={reduce ? false : { opacity: 0, y: 24, scale: 0.97 }}
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
            <Text textAlign="center" mb={3} color="white" style={{ fontFamily: "'HarmonyOS Sans', sans-serif", fontSize: "clamp(1.6rem, 4vw, 2rem)", letterSpacing: "0.02em" }}>
              {t("auth.forgotPasswordTitle")}
            </Text>

            {!sent ? (
              <>
                <Text textAlign="center" mb={7} style={{ fontSize: "0.875rem", color: "rgba(210,215,225,0.75)", lineHeight: 1.6 }}>
                  {t("auth.forgotPasswordDesc")}
                </Text>

                {serverError && (
                  <Box mb={4} px={3} py={2} borderRadius="md" style={{ background: "rgba(248,113,113,0.15)", border: "1px solid rgba(248,113,113,0.35)" }}>
                    <Text fontSize="sm" color="#f87171" textAlign="center">{serverError}</Text>
                  </Box>
                )}

                <style>{`@keyframes auth-spin { to { transform: rotate(360deg); } }`}</style>
                <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
                  <Box mb={emailError ? 1 : 5} position="relative">
                    <Input
                      placeholder={t("auth.emailPlaceholder")}
                      type="email"
                      value={email}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        setEmail(e.target.value);
                        if (emailError) setEmailError("");
                      }}
                      style={inputStyle(!!emailError)}
                      _placeholder={{ color: "#666" }}
                      _focus={inputFocus(!!emailError) as any}
                    />
                    <Box position="absolute" right="12px" top="50%" transform="translateY(-50%)" color={emailError ? "#f87171" : "#888"} pointerEvents="none">
                      <Mail size={16} />
                    </Box>
                  </Box>
                  {emailError && <Text fontSize="xs" color="#f87171" mb={4} pl={1}>{emailError}</Text>}

                  <button
                    type="submit"
                    disabled={isLoading}
                    style={{
                      width: "100%", height: "44px", borderRadius: "6px",
                      color: "white", fontSize: "0.875rem", letterSpacing: "0.06em",
                      cursor: isLoading ? "not-allowed" : "pointer",
                      border: "none", transition: "all 0.2s", marginBottom: "16px",
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
                      : t("auth.sendResetLink")}
                  </button>
                </form>
              </>
            ) : (
              <Flex direction="column" align="center" gap={4} mb={6}>
                <CheckCircle size={48} color="#4ade80" strokeWidth={1.5} />
                <Text textAlign="center" style={{ fontSize: "0.9rem", color: "rgba(210,215,225,0.85)", lineHeight: 1.7 }}>
                  {t("auth.forgotPasswordSuccess")}
                </Text>
              </Flex>
            )}

            <Flex align="center" justify="center" gap={2}
              cursor="pointer"
              onClick={() => navigate("/login")}
              style={{ color: "rgba(210,215,225,0.75)", fontSize: "0.875rem", transition: "color 0.2s" }}
              _hover={{ color: "white" } as any}
            >
              <ArrowLeft size={14} />
              <Text>{t("auth.backToLogin")}</Text>
            </Flex>
          </MotionBox>
        </AnimatePresence>
      </Flex>
    </Box>
  );
}
