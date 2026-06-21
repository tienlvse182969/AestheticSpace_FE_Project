import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Box, Flex, Text } from "@chakra-ui/react";
import { Crown, XCircle, Loader } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router";
import { useAuth } from "../../context/AuthContext";
import { paymentService } from "../../services/payment.service";

const MotionBox = motion.create(Box);

type Status = "loading" | "success" | "error";

export function PaymentResultPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { refreshAccountTier } = useAuth();
  const [status, setStatus] = useState<Status>("loading");
  const [coinsReceived, setCoinsReceived] = useState<number | null>(null);

  useEffect(() => {
    const transactionCode = sessionStorage.getItem("vnpay_transaction_code");
    const purpose = sessionStorage.getItem("vnpay_purpose");
    const coinsAmount = sessionStorage.getItem("vnpay_coins_amount");
    sessionStorage.removeItem("vnpay_transaction_code");
    sessionStorage.removeItem("vnpay_purpose");
    sessionStorage.removeItem("vnpay_store_item_name");
    sessionStorage.removeItem("vnpay_coins_amount");
    if (coinsAmount) setCoinsReceived(Number(coinsAmount));

    const statusParam = searchParams.get("status");
    const vnpResponseCode = searchParams.get("vnp_ResponseCode");
    const isSuccess = statusParam === "success" || vnpResponseCode === "00";

    if (!isSuccess || !transactionCode) {
      setStatus("error");
      return;
    }

    if (purpose === "StoreItem" || purpose === "BuyCoins") {
      // Backend webhook đã xử lý delivery/coin crediting — chỉ cần hiện success
      setStatus("success");
      return;
    }

    paymentService
      .upgradeSubscription(transactionCode)
      .then(() => {
        refreshAccountTier("Premium");
        setStatus("success");
      })
      .catch(() => {
        setStatus("error");
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Box
      as="main"
      minH="100vh"
      bg="#f9f6f2"
      display="flex"
      alignItems="center"
      justifyContent="center"
      px={6}
    >
      <MotionBox
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 } as any}
        textAlign="center"
        maxW="480px"
        w="full"
      >
        {status === "loading" && (
          <Flex direction="column" align="center" gap={5}>
            <Box
              style={{
                animation: "spin 1s linear infinite",
              }}
            >
              <Loader size={48} color="#4e7c6a" />
            </Box>
            <Text fontSize="lg" fontWeight="600" color="#1a3c34">
              Đang xác nhận thanh toán của bạn...
            </Text>
            <Text fontSize="sm" color="#6b7280">
              Vui lòng không đóng trang này
            </Text>
            <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
          </Flex>
        )}

        {status === "success" && (
          <Flex direction="column" align="center" gap={6}>
            <Box
              w="88px"
              h="88px"
              borderRadius="full"
              display="flex"
              alignItems="center"
              justifyContent="center"
              style={{
                background: "linear-gradient(135deg, rgba(122,171,151,0.2) 0%, rgba(78,124,106,0.15) 100%)",
                border: "2px solid rgba(122,171,151,0.4)",
              }}
            >
              <Crown size={40} color="#4e7c6a" />
            </Box>

            <Box>
              <Text
                fontWeight="800"
                color="#1a3c34"
                mb={2}
                style={{ fontSize: "clamp(1.5rem, 4vw, 2rem)" }}
              >
                {coinsReceived != null ? "Nạp xu thành công!" : "Chào mừng bạn đến với Premium!"}
              </Text>
              <Text color="#6b7280" lineHeight="relaxed">
                {coinsReceived != null
                  ? (<>{coinsReceived} xu đã được cộng vào tài khoản của bạn.</>)
                  : (<>Tài khoản của bạn đã được nâng cấp thành công.<br />Tận hưởng toàn bộ tính năng độc quyền ngay bây giờ.</>)
                }
              </Text>
            </Box>

            <Box
              as="button"
              px={10}
              py={3}
              borderRadius="xl"
              color="#1a3c34"
              fontWeight="700"
              fontSize="sm"
              cursor="pointer"
              transition="all 0.2s"
              onClick={() => navigate("/space", { replace: true })}
              style={{
                background: "linear-gradient(90deg, #7aab97 0%, #5a9982 100%)",
                boxShadow: "0 4px 16px rgba(122,171,151,0.4)",
              }}
              _hover={{ transform: "scale(1.03)" }}
              _active={{ transform: "scale(0.97)" }}
            >
              Khám phá không gian của bạn
            </Box>
          </Flex>
        )}

        {status === "error" && (
          <Flex direction="column" align="center" gap={6}>
            <Box
              w="88px"
              h="88px"
              borderRadius="full"
              display="flex"
              alignItems="center"
              justifyContent="center"
              style={{
                background: "rgba(239,68,68,0.08)",
                border: "2px solid rgba(239,68,68,0.2)",
              }}
            >
              <XCircle size={40} color="#ef4444" />
            </Box>

            <Box>
              <Text
                fontWeight="800"
                color="#1a3c34"
                mb={2}
                style={{ fontSize: "clamp(1.4rem, 4vw, 1.75rem)" }}
              >
                Xác nhận thanh toán thất bại
              </Text>
              <Text color="#6b7280" lineHeight="relaxed">
                Nếu bạn đã thanh toán, vui lòng liên hệ bộ phận hỗ trợ.
                <br />
                Chúng tôi sẽ kiểm tra và cập nhật tài khoản cho bạn.
              </Text>
            </Box>

            <Box
              as="button"
              px={10}
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
              onClick={() => navigate("/pricing", { replace: true })}
              _hover={{ bg: "#4e7c6a", color: "white" }}
            >
              Quay lại bảng giá
            </Box>
          </Flex>
        )}
      </MotionBox>
    </Box>
  );
}
