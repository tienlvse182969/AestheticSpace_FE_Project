import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Box, Flex, Heading, Text } from "@chakra-ui/react";
import { Check, Sparkles, Crown, Gift, X } from "lucide-react";
import { LoadingRing } from "../components/ui/LoadingRing";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../context/AuthContext";
import { paymentService } from "../../services/payment.service";
import { toast } from "sonner";

const MotionBox = motion.create(Box);
const MotionFlex = motion.create(Flex);

const BG_IMG =
  "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhZXN0aGV0aWMlMjBncmFkaWVudCUyMHB1cnBsZSUyMHBpbmt8ZW58MXx8fHwxNzQ4NzQyMjQ2fDA&ixlib=rb-4.1.0&q=80&w=1080";

const PREMIUM_HIGHLIGHTS = [true, true, true, true, true, true, true, true];

type PaymentMethod = "payos" | null;

export function PricingPage() {
  const navigate = useNavigate();
  const { user, refreshAccountTier } = useAuth();
  const { t } = useTranslation();

  const freemiumFeatures = (t("pricing.freemium.features", { returnObjects: true }) as string[]);
  const premiumFeatures  = (t("pricing.premium.features",  { returnObjects: true }) as string[]);

  // Modal state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isStartingTrial, setIsStartingTrial] = useState(false);
  const [showTrialModal, setShowTrialModal] = useState(false);

  const resetModal = () => {
    setShowPaymentModal(false);
    setPaymentMethod(null);
    setIsProcessing(false);
  };

  const handleGetStarted = () => {
    if (user) {
      navigate("/space");
    } else {
      navigate("/signup");
    }
  };

  const handleUpgradeClick = () => {
    if (!user) {
      navigate("/signup");
      return;
    }
    setShowPaymentModal(true);
  };

  const handleStartTrial = () => {
    if (!user) {
      navigate("/signup");
      return;
    }
    setShowTrialModal(true);
  };

  const handleConfirmTrial = async () => {
    setIsStartingTrial(true);
    try {
      await paymentService.startTrial();
      refreshAccountTier("Premium");
      setShowTrialModal(false);
      toast.success(t("pricing.trial.success"));
    } catch {
      toast.error(t("pricing.trial.error"));
    } finally {
      setIsStartingTrial(false);
    }
  };

  const handlePayOs = async () => {
    setIsProcessing(true);
    try {
      const { transactionCode, checkoutUrl } =
        await paymentService.createPayOsPayment({
          amountVnd: 100000,
          returnUrl: `${window.location.origin}/payment/result`,
          cancelUrl: `${window.location.origin}/payment/result?status=cancelled`,
          description: "Nâng cấp Premium",
          purpose: "Subscription",
          storeItemId: null,
          coinsAmount: 0,
        });
      sessionStorage.setItem("payos_transaction_code", transactionCode);
      window.location.href = checkoutUrl;
    } catch {
      setIsProcessing(false);
    }
  };

  return (
    <Box as="main" minH="100vh" bg="#f9f6f2" pt="80px">
      {/* Hero */}
      <Box
        position="relative"
        py={{ base: 20, md: 28 }}
        px={{ base: 6, lg: 10 }}
        overflow="hidden"
        textAlign="center"
      >
        <Box
          position="absolute"
          inset={0}
          style={{
            backgroundImage: `url(${BG_IMG})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            opacity: 0.18,
          }}
        />
        <Box
          position="absolute"
          inset={0}
          style={{
            background:
              "linear-gradient(to bottom, rgba(249,246,242,0.1) 0%, rgba(249,246,242,0.7) 60%, rgba(249,246,242,1) 100%)",
          }}
        />

        <Box position="relative" zIndex={10} maxW="3xl" mx="auto">
          <MotionBox
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 } as any}
          >
            <Box
              as="span"
              display="inline-flex"
              alignItems="center"
              gap={2}
              px={4}
              py={1}
              borderRadius="full"
              fontSize="sm"
              fontWeight="600"
              letterSpacing="0.08em"
              mb={5}
              style={{
                background: "rgba(26,60,52,0.1)",
                color: "#1a3c34",
                border: "1px solid rgba(26,60,52,0.2)",
              }}
            >
              <Sparkles size={14} />
              {t("pricing.sectionLabel")}
            </Box>

            <Heading
              as="h1"
              mb={5}
              lineHeight="1.15"
              style={{
                fontSize: "clamp(2rem, 5vw, 3.25rem)",
                fontWeight: 800,
                color: "#1a3c34",
              }}
            >
              {t("pricing.title")}
              <br />
              <Box as="span" style={{ color: "#4e7c6a" }}>
                {t("pricing.titleHighlight")}
              </Box>
            </Heading>

          </MotionBox>
        </Box>
      </Box>

      {/* Pricing Cards */}
      <Box maxW="900px" mx="auto" px={{ base: 6, lg: 0 }} pb={24}>
        <MotionFlex
          direction={{ base: "column", md: "row" }}
          gap={6}
          align="stretch"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 } as any}
        >
          {/* Freemium Card */}
          <Box
            flex={1}
            borderRadius="3xl"
            p={8}
            position="relative"
            style={{
              background: "white",
              border:
                user?.accountTier === "Premium"
                  ? "1.5px solid rgba(78,124,106,0.2)"
                  : "1.5px solid rgba(78,124,106,0.35)",
              boxShadow: "0 4px 24px rgba(26,60,52,0.07)",
            }}
          >
            {user?.accountTier !== "Premium" && (
              <Box
                position="absolute"
                top={0}
                right={0}
                px={4}
                py={1}
                style={{
                  background: "rgba(78,124,106,0.12)",
                  borderBottomLeftRadius: "14px",
                  borderTopRightRadius: "24px",
                  fontSize: "0.72rem",
                  fontWeight: 700,
                  color: "#4e7c6a",
                  letterSpacing: "0.06em",
                }}
              >
                {t("pricing.freemium.currentBadge")}
              </Box>
            )}
            <Flex align="center" gap={2} mb={2}>
              <Box
                w="36px"
                h="36px"
                borderRadius="xl"
                display="flex"
                alignItems="center"
                justifyContent="center"
                style={{ background: "rgba(78,124,106,0.12)" }}
              >
                <Sparkles size={18} color="#4e7c6a" />
              </Box>
              <Text fontWeight="700" fontSize="lg" color="#1a3c34">
                Freemium
              </Text>
            </Flex>

            <Text color="#6b7280" fontSize="sm" mb={6} lineHeight="relaxed">
              {t("pricing.freemium.desc")}
            </Text>

            <Box mb={7}>
              <Box
                as="span"
                style={{
                  fontSize: "clamp(2.5rem, 6vw, 3rem)",
                  fontWeight: 800,
                  color: "#1a3c34",
                }}
              >
                {t("pricing.freemium.price")}
              </Box>
            </Box>

            <Flex direction="column" gap={3} mb={8}>
              {freemiumFeatures.map((label, i) => (
                <Flex key={i} align="flex-start" gap={3}>
                  <Box
                    mt="3px"
                    w="18px"
                    h="18px"
                    borderRadius="full"
                    flexShrink={0}
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    style={{ background: "rgba(78,124,106,0.15)" }}
                  >
                    <Check size={11} color="#4e7c6a" strokeWidth={3} />
                  </Box>
                  <Text fontSize="sm" color="#374151" lineHeight="relaxed">
                    {label}
                  </Text>
                </Flex>
              ))}
            </Flex>

            <Box
              as="button"
              w="full"
              py={3}
              borderRadius="xl"
              border="2px solid"
              borderColor="#4e7c6a"
              color="#4e7c6a"
              fontWeight="600"
              fontSize="sm"
              bg="transparent"
              cursor="pointer"
              transition="all 0.2s"
              onClick={handleGetStarted}
              _hover={{ bg: "#4e7c6a", color: "white" }}
            >
              {t("pricing.freemium.cta")}
            </Box>
          </Box>

          {/* Premium Card */}
          <Box
            flex={1}
            borderRadius="3xl"
            p={8}
            position="relative"
            overflow="hidden"
            style={{
              background: "linear-gradient(160deg, #2e2a0e 0%, #1e1a07 100%)",
              boxShadow: "0 16px 48px rgba(251,191,36,0.18)",
            }}
          >
            {/* Popular / Current plan badge */}
            <Flex
              position="absolute"
              top={0}
              right={0}
              align="center"
              gap="5px"
              px={4}
              py={2}
              style={{
                background: "linear-gradient(90deg, #fbbf24 0%, #f59e0b 100%)",
                borderBottomLeftRadius: "18px",
                borderTopRightRadius: "24px",
                fontSize: "0.72rem",
                fontWeight: 700,
                color: "#1c1a08",
                letterSpacing: "0.06em",
              }}
            >
              {user?.accountTier === "Premium" ? (
                <>
                  <Check size={11} strokeWidth={3} />
                  {t("pricing.premium.currentBadge")}
                </>
              ) : (
                t("pricing.premium.popularBadge")
              )}
            </Flex>

            {/* Decorative circle */}
            <Box
              position="absolute"
              bottom="-60px"
              right="-60px"
              w="220px"
              h="220px"
              borderRadius="full"
              style={{
                background: "rgba(251,191,36,0.06)",
                pointerEvents: "none",
              }}
            />

            <Flex align="center" gap={2} mb={2}>
              <Box
                w="36px"
                h="36px"
                borderRadius="xl"
                display="flex"
                alignItems="center"
                justifyContent="center"
                style={{ background: "rgba(251,191,36,0.15)" }}
              >
                <Crown size={18} color="#fbbf24" />
              </Box>
              <Text fontWeight="700" fontSize="lg" color="white">
                Premium
              </Text>
            </Flex>

            <Text
              color="rgba(255,255,255,0.55)"
              fontSize="sm"
              mb={6}
              lineHeight="relaxed"
            >
              {t("pricing.premium.desc")}
            </Text>

            <Flex align="baseline" gap={2} mb={1}>
              <Box
                as="span"
                style={{
                  fontSize: "clamp(2.2rem, 5vw, 2.75rem)",
                  fontWeight: 800,
                  color: "white",
                }}
              >
                {t("pricing.premium.priceAmount")}
              </Box>
              <Text color="rgba(255,255,255,0.5)" fontSize="sm">
                {t("pricing.premium.priceUnit")}
              </Text>
            </Flex>

            {/* Trial highlight */}
            <Flex
              align="center"
              gap={2}
              mb={7}
              px={3}
              py={2}
              borderRadius="xl"
              style={{
                background: "rgba(251,191,36,0.1)",
                border: "1px solid rgba(251,191,36,0.25)",
              }}
            >
              <Gift size={14} color="#fbbf24" />
              <Text fontSize="xs" fontWeight="600" color="#fbbf24">
                {t("pricing.premium.trialHighlight")}
              </Text>
            </Flex>

            <Flex direction="column" gap={3} mb={8}>
              {premiumFeatures.map((label, i) => {
                const highlight = PREMIUM_HIGHLIGHTS[i] ?? false;
                return (
                  <Flex key={i} align="flex-start" gap={3}>
                    <Box
                      mt="3px"
                      w="18px"
                      h="18px"
                      borderRadius="full"
                      flexShrink={0}
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      style={{
                        background: highlight
                          ? "rgba(251,191,36,0.2)"
                          : "rgba(255,255,255,0.1)",
                      }}
                    >
                      <Check
                        size={11}
                        color={highlight ? "#fbbf24" : "rgba(255,255,255,0.6)"}
                        strokeWidth={3}
                      />
                    </Box>
                    <Text
                      fontSize="sm"
                      lineHeight="relaxed"
                      color={
                        highlight
                          ? "rgba(255,255,255,0.9)"
                          : "rgba(255,255,255,0.6)"
                      }
                      fontWeight={highlight ? "500" : "400"}
                    >
                      {label}
                    </Text>
                  </Flex>
                );
              })}
            </Flex>

            {/* Premium CTA — conditional on accountTier */}
            {user && user.accountTier !== "Premium" && (
              <Box
                as="button"
                w="full"
                py={3}
                borderRadius="xl"
                color="rgba(255,255,255,0.85)"
                fontWeight="700"
                fontSize="sm"
                cursor={isStartingTrial ? "not-allowed" : "pointer"}
                transition="all 0.2s"
                mb={3}
                onClick={handleStartTrial}
                _disabled={{ opacity: 0.7 }}
                style={{
                  background: "rgba(251,191,36,0.12)",
                  border: "1.5px solid rgba(251,191,36,0.35)",
                }}
                _hover={isStartingTrial ? {} : { background: "rgba(251,191,36,0.2)" }}
              >
                {isStartingTrial ? (
                  <Flex justify="center" align="center" gap={2}>
                    <LoadingRing size={16} color="rgba(251,191,36,0.9)" trackColor="rgba(251,191,36,0.2)" />
                    <Text fontSize="sm" color="rgba(255,255,255,0.8)">{t("pricing.trial.loading")}</Text>
                  </Flex>
                ) : (
                  <Flex justify="center" align="center" gap={2}>
                    <Gift size={15} color="#fbbf24" />
                    {t("pricing.trial.cta")}
                  </Flex>
                )}
              </Box>
            )}
            {user?.accountTier === "Premium" ? (
              <Flex direction="column" gap={2}>
                <Flex
                  w="full"
                  py={3}
                  borderRadius="xl"
                  justify="center"
                  align="center"
                  gap={2}
                  style={{
                    background: "rgba(251,191,36,0.12)",
                    border: "1.5px solid rgba(251,191,36,0.35)",
                  }}
                >
                  <Crown size={15} color="#fbbf24" />
                  <Text color="#fbbf24" fontWeight="700" fontSize="sm">
                    {t("pricing.premium.currentPlanText")}
                  </Text>
                </Flex>
                <Text
                  fontSize="xs"
                  color="rgba(255,255,255,0.35)"
                  textAlign="center"
                >
                  {t("pricing.premium.currentPlanSubtext")}
                </Text>
              </Flex>
            ) : (
              <Box
                as="button"
                w="full"
                py={3}
                borderRadius="xl"
                color="#1c1a08"
                fontWeight="700"
                fontSize="sm"
                cursor="pointer"
                transition="all 0.2s"
                onClick={handleUpgradeClick}
                style={{
                  background: "linear-gradient(90deg, #fbbf24 0%, #f59e0b 100%)",
                  boxShadow: "0 4px 16px rgba(251,191,36,0.35)",
                }}
                _hover={{ transform: "scale(1.02)" }}
                _active={{ transform: "scale(0.98)" }}
              >
                {user ? t("pricing.premium.cta") : t("pricing.premium.ctaGuest")}
              </Box>
            )}
          </Box>
        </MotionFlex>

        {/* FAQ / Note */}
        <MotionBox
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.5 } as any}
          mt={12}
          textAlign="center"
        >
          <Text color="#9ca3af" fontSize="sm" lineHeight="relaxed">
            {t("pricing.footer")}
          </Text>
        </MotionBox>
      </Box>

      {/* Trial Confirmation Modal */}
      <AnimatePresence>
        {showTrialModal && (
          <Box
            position="fixed"
            inset={0}
            zIndex={200}
            display="flex"
            alignItems="center"
            justifyContent="center"
            px={4}
            style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}
            onClick={(e: React.MouseEvent) => {
              if (e.target === e.currentTarget && !isStartingTrial) setShowTrialModal(false);
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 16 }}
              transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
              style={{ width: "100%", maxWidth: "420px" }}
            >
              <Box
                borderRadius="3xl"
                p={8}
                position="relative"
                style={{
                  background: "linear-gradient(160deg, #1c1a08 0%, #100e03 100%)",
                  boxShadow: "0 24px 64px rgba(0,0,0,0.4)",
                  border: "1px solid rgba(251,191,36,0.15)",
                }}
              >
                {/* Close */}
                {!isStartingTrial && (
                  <Box
                    as="button"
                    position="absolute"
                    top={5}
                    right={5}
                    w="32px"
                    h="32px"
                    borderRadius="full"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    bg="transparent"
                    border="none"
                    cursor="pointer"
                    onClick={() => setShowTrialModal(false)}
                    style={{ color: "rgba(255,255,255,0.35)" }}
                    _hover={{ color: "rgba(255,255,255,0.7)" }}
                  >
                    <X size={18} />
                  </Box>
                )}

                {/* Icon */}
                <Flex justify="center" mb={5}>
                  <Flex
                    align="center"
                    justify="center"
                    borderRadius="full"
                    style={{
                      width: 56,
                      height: 56,
                      background: "rgba(251,191,36,0.12)",
                      border: "1px solid rgba(251,191,36,0.3)",
                    }}
                  >
                    <Gift size={24} color="#fbbf24" />
                  </Flex>
                </Flex>

                <Text fontWeight="800" fontSize="lg" color="white" textAlign="center" mb={2}>
                  {t("pricing.trial.confirmTitle")}
                </Text>
                <Text fontSize="sm" color="rgba(255,255,255,0.5)" textAlign="center" mb={7} lineHeight="relaxed">
                  {t("pricing.trial.confirmSubtitle")}
                </Text>

                <Flex direction="column" gap={3}>
                  <Box
                    as="button"
                    w="full"
                    py={3}
                    borderRadius="xl"
                    border="none"
                    cursor={isStartingTrial ? "not-allowed" : "pointer"}
                    transition="all 0.2s"
                    onClick={handleConfirmTrial}
                    style={{
                      background: "linear-gradient(90deg, #fbbf24 0%, #f59e0b 100%)",
                      boxShadow: "0 4px 16px rgba(251,191,36,0.35)",
                      color: "#1c1a08",
                      fontWeight: 700,
                      fontSize: "0.875rem",
                      opacity: isStartingTrial ? 0.7 : 1,
                    }}
                    _hover={isStartingTrial ? {} : { filter: "brightness(1.08)" }}
                  >
                    {isStartingTrial ? (
                      <Flex justify="center" align="center" gap={2}>
                        <LoadingRing size={15} color="#1c1a08" trackColor="rgba(28,26,8,0.25)" />
                        {t("pricing.trial.loading")}
                      </Flex>
                    ) : (
                      <Flex justify="center" align="center" gap={2}>
                        <Gift size={15} />
                        {t("pricing.trial.confirmBtn")}
                      </Flex>
                    )}
                  </Box>

                  <Box
                    as="button"
                    w="full"
                    py={3}
                    borderRadius="xl"
                    border="none"
                    cursor={isStartingTrial ? "not-allowed" : "pointer"}
                    transition="all 0.2s"
                    onClick={() => !isStartingTrial && setShowTrialModal(false)}
                    style={{
                      background: "rgba(255,255,255,0.06)",
                      color: "rgba(255,255,255,0.5)",
                      fontWeight: 600,
                      fontSize: "0.875rem",
                    }}
                    _hover={isStartingTrial ? {} : { background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.75)" }}
                  >
                    {t("pricing.trial.cancelBtn")}
                  </Box>
                </Flex>
              </Box>
            </motion.div>
          </Box>
        )}
      </AnimatePresence>

      {/* Payment Modal */}
      <AnimatePresence>
        {showPaymentModal && (
          <Box
            position="fixed"
            inset={0}
            zIndex={200}
            display="flex"
            alignItems="center"
            justifyContent="center"
            px={4}
            style={{
              background: "rgba(0,0,0,0.55)",
              backdropFilter: "blur(4px)",
            }}
            onClick={(e: React.MouseEvent) => {
              if (e.target === e.currentTarget) resetModal();
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 16 }}
              transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
              style={{ width: "100%", maxWidth: "480px" }}
            >
              <Box
                bg="#f9f6f2"
                borderRadius="3xl"
                p={8}
                position="relative"
                style={{ boxShadow: "0 24px 64px rgba(0,0,0,0.2)" }}
              >
                {/* Close button */}
                <Box
                  as="button"
                  position="absolute"
                  top={5}
                  right={5}
                  w="32px"
                  h="32px"
                  borderRadius="full"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  bg="transparent"
                  border="none"
                  cursor="pointer"
                  onClick={resetModal}
                  style={{ color: "#9ca3af" }}
                  _hover={{ bg: "rgba(0,0,0,0.06)", color: "#1a3c34" }}
                >
                  <X size={18} />
                </Box>

                {/* ── Step: chọn phương thức ── */}
                {!paymentMethod && (
                  <Box>
                    <Text fontWeight="800" fontSize="lg" color="#1a3c34" mb={1}>
                      {t("pricing.modal.title")}
                    </Text>
                    <Text fontSize="sm" color="#6b7280" mb={6}>
                      {t("pricing.modal.subtitle")}
                    </Text>

                    <Flex direction="column" gap={3}>
                      {/* PayOS */}
                      <Box position="relative">
                      <Box
                        as="button"
                        w="full"
                        p={4}
                        borderRadius="2xl"
                        border="1.5px solid"
                        borderColor={
                          isProcessing
                            ? "rgba(78,124,106,0.5)"
                            : "rgba(78,124,106,0.25)"
                        }
                        bg="white"
                        cursor={isProcessing ? "not-allowed" : "pointer"}
                        transition="all 0.2s"
                        onClick={() => !isProcessing && handlePayOs()}
                        _hover={
                          isProcessing
                            ? {}
                            : {
                                borderColor: "#4e7c6a",
                                boxShadow: "0 4px 16px rgba(78,124,106,0.12)",
                              }
                        }
                        textAlign="left"
                      >
                        <Flex align="center" justify="space-between">
                          <Box>
                            <Text
                              fontWeight="700"
                              fontSize="sm"
                              color="#1a3c34"
                              mb="2px"
                            >
                              PayOS
                            </Text>
                            <Text fontSize="xs" color="#6b7280">
                              {t("pricing.modal.payosDesc")}
                            </Text>
                          </Box>
                          {isProcessing ? (
                            <LoadingRing size={18} color="rgba(78,124,106,0.9)" trackColor="rgba(78,124,106,0.18)" />
                          ) : (
                            <Box
                              px={3}
                              py={1}
                              borderRadius="lg"
                              style={{ background: "rgba(78,124,106,0.1)" }}
                            >
                              <Text
                                fontSize="xs"
                                fontWeight="600"
                                color="#4e7c6a"
                              >
                                {t("pricing.modal.redirect")}
                              </Text>
                            </Box>
                          )}
                        </Flex>
                      </Box>
                      </Box>
                    </Flex>
                  </Box>
                )}
              </Box>
            </motion.div>
          </Box>
        )}
      </AnimatePresence>
    </Box>
  );
}
