import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Box, Flex, Heading, Text } from "@chakra-ui/react";
import { Check, Sparkles, Crown, Gift, X, Loader } from "lucide-react";
import { useNavigate } from "react-router";
import { useAuth } from "../../context/AuthContext";
import { paymentService } from "../../services/payment.service";

const MotionBox = motion.create(Box);
const MotionFlex = motion.create(Flex);

const BG_IMG =
  "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhZXN0aGV0aWMlMjBncmFkaWVudCUyMHB1cnBsZSUyMHBpbmt8ZW58MXx8fHwxNzQ4NzQyMjQ2fDA&ixlib=rb-4.1.0&q=80&w=1080";

const freemiumFeatures = [
  { label: "Preset room với layout có thể tuỳ chỉnh & lưu lại" },
  { label: "Hình nền miễn phí từ Unsplash" },
  { label: "Thêm widget vào không gian học" },
  { label: "Music player tích hợp YouTube / SoundCloud" },
  { label: "Đổi màu theme mặc định" },
  { label: "Tạo tối đa 3 rooms" },
];

const premiumFeatures = [
  { label: "Tất cả tính năng của gói Freemium", highlight: false },
  { label: "Truy cập Aesthetic Store — kho theme độc quyền", highlight: true },
  {
    label: "Hình nền, sticker & hiệu ứng độc quyền theo theme",
    highlight: true,
  },
  { label: "Ambient sound đặc biệt đi kèm từng theme", highlight: true },
  { label: "Kiểu widget premium (sắp ra mắt)", highlight: false },
  { label: "Lưu preset room không giới hạn", highlight: true },
  { label: "Tự sáng tạo & đăng theme lên Store để kiếm xu", highlight: false },
  { label: "Hệ thống điểm xu & nhiệm vụ hằng ngày", highlight: false },
];

type PaymentMethod = "vnpay" | null;

export function PricingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Modal state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(null);
  const [isProcessing, setIsProcessing] = useState(false);

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

  const handleVnPay = async () => {
    setIsProcessing(true);
    try {
      const { transactionCode, paymentUrl } =
        await paymentService.createVnPayPayment({
          amountVnd: 100000,
          returnUrl: "string",
          description: "string",
          purpose: "Subscription",
          storeItemId: null,
          coinsAmount: 0,
        });
      sessionStorage.setItem("vnpay_transaction_code", transactionCode);
      window.location.href = paymentUrl;
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
          bgImage={`url(${BG_IMG})`}
          bgSize="cover"
          bgPosition="center"
          opacity={0.18}
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
              BẢNG GIÁ
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
              Chọn gói phù hợp
              <br />
              <Box as="span" style={{ color: "#4e7c6a" }}>
                với bạn
              </Box>
            </Heading>

            <Text
              color="#6b7280"
              maxW="xl"
              mx="auto"
              lineHeight="relaxed"
              fontSize={{ base: "md", md: "lg" }}
            >
              Bắt đầu miễn phí, nâng cấp khi bạn sẵn sàng. Người dùng mới được
              dùng thử gói Premium trong{" "}
              <Box as="span" fontWeight="700" color="#1a3c34">
                3 ngày hoàn toàn miễn phí
              </Box>
              .
            </Text>
          </MotionBox>
        </Box>
      </Box>

      {/* Trial Banner */}
      <MotionBox
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 } as any}
        maxW="760px"
        mx="auto"
        px={{ base: 6, lg: 0 }}
        mb={10}
      >
        <Flex
          align="center"
          gap={3}
          px={6}
          py={4}
          borderRadius="2xl"
          justify="center"
          flexWrap="wrap"
          style={{
            background: "linear-gradient(135deg, #1a3c34 0%, #2a6b55 100%)",
            boxShadow: "0 8px 32px rgba(26,60,52,0.25)",
          }}
        >
          <Gift size={20} color="#7aab97" />
          <Text color="white" fontWeight="700" fontSize="md" textAlign="center">
            Đăng ký tài khoản mới — dùng thử Premium{" "}
            <Box as="span" style={{ color: "#7aab97" }}>
              3 ngày miễn phí
            </Box>
            , không cần thẻ tín dụng
          </Text>
        </Flex>
      </MotionBox>

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
                Gói hiện tại
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
              Đầy đủ công cụ để bắt đầu xây dựng không gian học tập của bạn.
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
                Miễn phí
              </Box>
            </Box>

            <Flex direction="column" gap={3} mb={8}>
              {freemiumFeatures.map((f, i) => (
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
                    {f.label}
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
              Bắt đầu miễn phí
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
              background: "linear-gradient(160deg, #1a3c34 0%, #0f2420 100%)",
              boxShadow: "0 16px 48px rgba(26,60,52,0.35)",
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
                background:
                  user?.accountTier === "Premium"
                    ? "linear-gradient(90deg, #fbbf24 0%, #f59e0b 100%)"
                    : "linear-gradient(90deg, #7aab97 0%, #4e7c6a 100%)",
                borderBottomLeftRadius: "18px",
                borderTopRightRadius: "24px",
                fontSize: "0.72rem",
                fontWeight: 700,
                color: user?.accountTier === "Premium" ? "#1a3c34" : "white",
                letterSpacing: "0.06em",
              }}
            >
              {user?.accountTier === "Premium" ? (
                <>
                  <Check size={11} strokeWidth={3} />
                  Gói của bạn
                </>
              ) : (
                "Phổ biến nhất"
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
                background: "rgba(122,171,151,0.07)",
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
                style={{ background: "rgba(122,171,151,0.2)" }}
              >
                <Crown size={18} color="#7aab97" />
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
              Mở khoá toàn bộ tiềm năng sáng tạo với kho nội dung độc quyền.
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
                130.000₫
              </Box>
              <Text color="rgba(255,255,255,0.5)" fontSize="sm">
                / tháng
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
                background: "rgba(122,171,151,0.15)",
                border: "1px solid rgba(122,171,151,0.25)",
              }}
            >
              <Gift size={14} color="#7aab97" />
              <Text fontSize="xs" fontWeight="600" color="#7aab97">
                Dùng thử 3 ngày miễn phí cho tài khoản mới
              </Text>
            </Flex>

            <Flex direction="column" gap={3} mb={8}>
              {premiumFeatures.map((f, i) => (
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
                      background: f.highlight
                        ? "rgba(122,171,151,0.25)"
                        : "rgba(255,255,255,0.1)",
                    }}
                  >
                    <Check
                      size={11}
                      color={f.highlight ? "#7aab97" : "rgba(255,255,255,0.6)"}
                      strokeWidth={3}
                    />
                  </Box>
                  <Text
                    fontSize="sm"
                    lineHeight="relaxed"
                    color={
                      f.highlight
                        ? "rgba(255,255,255,0.9)"
                        : "rgba(255,255,255,0.6)"
                    }
                    fontWeight={f.highlight ? "500" : "400"}
                  >
                    {f.label}
                  </Text>
                </Flex>
              ))}
            </Flex>

            {/* Premium CTA — conditional on accountTier */}
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
                    Bạn đang sử dụng gói này
                  </Text>
                </Flex>
                <Text
                  fontSize="xs"
                  color="rgba(255,255,255,0.35)"
                  textAlign="center"
                >
                  Tài khoản của bạn đã được kích hoạt Premium
                </Text>
              </Flex>
            ) : (
              <Box
                as="button"
                w="full"
                py={3}
                borderRadius="xl"
                color="#1a3c34"
                fontWeight="700"
                fontSize="sm"
                cursor="pointer"
                transition="all 0.2s"
                onClick={handleUpgradeClick}
                style={{
                  background:
                    "linear-gradient(90deg, #7aab97 0%, #5a9982 100%)",
                  boxShadow: "0 4px 16px rgba(122,171,151,0.4)",
                }}
                _hover={{ transform: "scale(1.02)" }}
                _active={{ transform: "scale(0.98)" }}
              >
                {user ? "Nâng cấp Premium" : "Bắt đầu dùng thử miễn phí"}
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
            Thanh toán qua{" "}
            <Box as="span" color="#4e7c6a" fontWeight="600">
              VNPay
            </Box>{" "}
            · Huỷ bất cứ lúc nào · Không tính phí ẩn
          </Text>
        </MotionBox>
      </Box>

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
                      Chọn phương thức thanh toán
                    </Text>
                    <Text fontSize="sm" color="#6b7280" mb={6}>
                      130.000₫ / tháng · Gia hạn tự động
                    </Text>

                    <Flex direction="column" gap={3}>
                      {/* VNPay */}
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
                        onClick={() => !isProcessing && handleVnPay()}
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
                              VNPay
                            </Text>
                            <Text fontSize="xs" color="#6b7280">
                              Thẻ ATM, Visa, MasterCard, QR Code
                            </Text>
                          </Box>
                          {isProcessing ? (
                            <Box
                              style={{ animation: "spin 1s linear infinite" }}
                            >
                              <Loader size={18} color="#4e7c6a" />
                            </Box>
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
                                Chuyển hướng
                              </Text>
                            </Box>
                          )}
                        </Flex>
                      </Box>
                    </Flex>
                    <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
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
