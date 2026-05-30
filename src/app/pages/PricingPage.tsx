import { motion } from "motion/react";
import { Box, Flex, Heading, Text } from "@chakra-ui/react";
import { Check, Sparkles, Crown, Gift } from "lucide-react";
import { useNavigate } from "react-router";
import { useAuth } from "../../context/AuthContext";

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
  { label: "Hình nền, sticker & hiệu ứng độc quyền theo theme", highlight: true },
  { label: "Ambient sound đặc biệt đi kèm từng theme", highlight: true },
  { label: "Kiểu widget premium (sắp ra mắt)", highlight: false },
  { label: "Lưu preset room không giới hạn", highlight: true },
  { label: "Tự sáng tạo & đăng theme lên Store để kiếm xu", highlight: false },
  { label: "Hệ thống điểm xu & nhiệm vụ hằng ngày", highlight: false },
];

export function PricingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleGetStarted = () => {
    if (user) {
      navigate("/space");
    } else {
      navigate("/signup");
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
            style={{
              background: "white",
              border: "1.5px solid rgba(78,124,106,0.2)",
              boxShadow: "0 4px 24px rgba(26,60,52,0.07)",
            }}
          >
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
            {/* Popular badge */}
            <Box
              position="absolute"
              top={0}
              right={0}
              px={5}
              py={2}
              style={{
                background: "linear-gradient(90deg, #7aab97 0%, #4e7c6a 100%)",
                borderBottomLeftRadius: "18px",
                fontSize: "0.72rem",
                fontWeight: 700,
                color: "white",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              Phổ biến nhất
            </Box>

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
                      f.highlight ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.6)"
                    }
                    fontWeight={f.highlight ? "500" : "400"}
                  >
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
              color="#1a3c34"
              fontWeight="700"
              fontSize="sm"
              cursor="pointer"
              transition="all 0.2s"
              onClick={handleGetStarted}
              style={{
                background: "linear-gradient(90deg, #7aab97 0%, #5a9982 100%)",
                boxShadow: "0 4px 16px rgba(122,171,151,0.4)",
              }}
              _hover={{ transform: "scale(1.02)" }}
              _active={{ transform: "scale(0.98)" }}
            >
              {user ? "Nâng cấp Premium" : "Bắt đầu dùng thử miễn phí"}
            </Box>
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
              Sepay / VNPay
            </Box>{" "}
            · Huỷ bất cứ lúc nào · Không tính phí ẩn
          </Text>
        </MotionBox>
      </Box>
    </Box>
  );
}
