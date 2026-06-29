import { useState } from "react";
import { Box, Flex, Text } from "@chakra-ui/react";
import { motion, AnimatePresence } from "motion/react";
import { X, Coins, CreditCard } from "lucide-react";
import { LoadingRing } from "../../ui/LoadingRing";
import type { StoreItem } from "../../../../services/aestheticStore.service";
import { paymentService } from "../../../../services/payment.service";

const MotionBox = motion.create(Box);


interface Props {
  item: StoreItem;
  coinBalance: number;
  onClose: () => void;
  onPayWithCoins: () => void;
  isPayingWithCoins: boolean;
  purchaseError: string | null;
}

export function StorePaymentModal({
  item,
  coinBalance,
  onClose,
  onPayWithCoins,
  isPayingWithCoins,
  purchaseError,
}: Props) {
  const [payosProcessing, setPayosProcessing] = useState(false);

  const price = item.coinPrice ?? 0;
  const canAffordWithCoins = coinBalance >= price;
  const hasPayOsOption =
    item.realMoneyPriceVnd != null && item.realMoneyPriceVnd > 0;
  const isAnyProcessing = isPayingWithCoins || payosProcessing;

  const handlePayOs = async () => {
    if (!item.realMoneyPriceVnd) return;
    setPayosProcessing(true);
    try {
      const result = await paymentService.createPayOsPayment({
        amountVnd: item.realMoneyPriceVnd,
        returnUrl: `${window.location.origin}/payment/result`,
        cancelUrl: `${window.location.origin}/payment/result?status=cancelled`,
        description: `Mua ${item.name}`,
        purpose: "BuyAsset",
        storeItemId: item.id,
      });
      console.log("[PayOS] create response:", result);
      const checkoutUrl = result?.checkoutUrl;
      if (!checkoutUrl) {
        console.error("[PayOS] checkoutUrl is missing in response", result);
        setPayosProcessing(false);
        return;
      }
      sessionStorage.setItem("payos_transaction_code", result.transactionCode);
      sessionStorage.setItem("payos_purpose", "BuyAsset");
      sessionStorage.setItem("payos_store_item_name", item.name);
      window.location.href = checkoutUrl;
    } catch (err) {
      console.error("[PayOS] createPayOsPayment error:", err);
      setPayosProcessing(false);
    }
  };

  return (
    <AnimatePresence>
      <Box
        position="fixed"
        inset={0}
        zIndex={200}
        display="flex"
        alignItems="center"
        justifyContent="center"
        px="16px"
        style={{ background: "rgba(0,0,0,0.72)", backdropFilter: "blur(8px)" }}
        onClick={(e: React.MouseEvent) => {
          if (e.target === e.currentTarget && !isAnyProcessing) onClose();
        }}
      >
        <MotionBox
          initial={{ opacity: 0, scale: 0.92, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0, transition: { duration: 0.22, ease: [0.4, 0, 0.2, 1] } } as any}
          exit={{ opacity: 0, scale: 0.92, y: 16, transition: { duration: 0.16, ease: [0.4, 0, 1, 1] } } as any}
          w="100%"
          style={{ maxWidth: "420px" }}
        >
          <Box
            borderRadius="20px"
            p="24px"
            position="relative"
            style={{
              background: "rgba(14,20,28,0.98)",
              backdropFilter: "blur(24px)",
              border: "1px solid rgba(255,255,255,0.1)",
              boxShadow: "0 24px 64px rgba(0,0,0,0.8)",
            }}
          >
            {/* Close */}
            {!isAnyProcessing && (
              <Box
                as="button"
                position="absolute"
                top="14px"
                right="14px"
                w="28px"
                h="28px"
                borderRadius="full"
                display="flex"
                alignItems="center"
                justifyContent="center"
                border="none"
                cursor="pointer"
                onClick={onClose}
                style={{
                  background: "rgba(255,255,255,0.06)",
                  color: "rgba(255,255,255,0.4)",
                  transition: "all 0.15s",
                }}
                _hover={{ background: "rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.8)" } as any}
              >
                <X size={14} />
              </Box>
            )}

            {/* Header */}
            <Text
              mb="3px"
              style={{
                fontSize: "1rem",
                fontFamily: "'HarmonyOS Sans', sans-serif",
                fontWeight: 700,
                color: "rgba(255,255,255,0.92)",
              }}
            >
              Chọn phương thức thanh toán
            </Text>
            <Text
              mb="20px"
              style={{
                fontSize: "0.74rem",
                fontFamily: "'HarmonyOS Sans', sans-serif",
                color: "rgba(255,255,255,0.38)",
              }}
            >
              {item.name}
            </Text>

            {/* Error */}
            {purchaseError && (
              <Box
                mb="12px"
                px="12px"
                py="8px"
                borderRadius="10px"
                style={{
                  background: "rgba(248,113,113,0.08)",
                  border: "1px solid rgba(248,113,113,0.22)",
                }}
              >
                <Text
                  style={{
                    fontSize: "0.72rem",
                    fontFamily: "'HarmonyOS Sans', sans-serif",
                    color: "#f87171",
                    textAlign: "center",
                  }}
                >
                  {purchaseError}
                </Text>
              </Box>
            )}

            <Flex direction="column" gap="10px">
              {/* ── Coin payment ── */}
              <Box
                as="button"
                w="100%"
                p="14px 16px"
                borderRadius="14px"
                border="none"
                cursor={!canAffordWithCoins || isAnyProcessing ? "not-allowed" : "pointer"}
                textAlign="left"
                onClick={() => canAffordWithCoins && !isAnyProcessing && onPayWithCoins()}
                style={{
                  background: canAffordWithCoins
                    ? "rgba(250,204,21,0.05)"
                    : "rgba(255,255,255,0.025)",
                  border: canAffordWithCoins
                    ? "1px solid rgba(250,204,21,0.2)"
                    : "1px solid rgba(255,255,255,0.07)",
                  opacity: isPayingWithCoins ? 0.65 : 1,
                  transition: "all 0.18s",
                }}
                _hover={
                  canAffordWithCoins && !isAnyProcessing
                    ? { background: "rgba(250,204,21,0.1)", border: "1px solid rgba(250,204,21,0.35)" } as any
                    : {}
                }
              >
                <Flex align="center" justify="space-between">
                  <Flex align="center" gap="12px">
                    {isPayingWithCoins ? (
                      <LoadingRing size={20} color="rgba(250,204,21,0.9)" trackColor="rgba(250,204,21,0.15)" />
                    ) : (
                      <Box
                        w="38px"
                        h="38px"
                        borderRadius="10px"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                        flexShrink={0}
                        style={{
                          background: canAffordWithCoins
                            ? "rgba(250,204,21,0.1)"
                            : "rgba(255,255,255,0.05)",
                        }}
                      >
                        <Coins
                          size={18}
                          color={canAffordWithCoins ? "#facc15" : "rgba(255,255,255,0.18)"}
                        />
                      </Box>
                    )}
                    <Box>
                      <Text
                        style={{
                          fontSize: "0.82rem",
                          fontFamily: "'HarmonyOS Sans', sans-serif",
                          fontWeight: 600,
                          color: canAffordWithCoins
                            ? "rgba(255,255,255,0.88)"
                            : "rgba(255,255,255,0.28)",
                          marginBottom: "3px",
                        }}
                      >
                        Thanh toán bằng xu
                      </Text>
                      <Flex align="center" gap="4px">
                        <Coins
                          size={10}
                          color={canAffordWithCoins ? "rgba(250,204,21,0.65)" : "rgba(255,255,255,0.18)"}
                        />
                        <Text
                          style={{
                            fontSize: "0.68rem",
                            fontFamily: "'HarmonyOS Sans', sans-serif",
                            color: canAffordWithCoins
                              ? "rgba(250,204,21,0.75)"
                              : "rgba(255,255,255,0.22)",
                          }}
                        >
                          Số dư: {coinBalance.toLocaleString("vi-VN")} xu
                        </Text>
                      </Flex>
                      {!canAffordWithCoins && (
                        <Text
                          mt="2px"
                          style={{
                            fontSize: "0.65rem",
                            fontFamily: "'HarmonyOS Sans', sans-serif",
                            color: "rgba(248,113,113,0.65)",
                          }}
                        >
                          Cần thêm {(price - coinBalance).toLocaleString("vi-VN")} xu
                        </Text>
                      )}
                    </Box>
                  </Flex>
                  <Flex align="center" gap="4px" flexShrink={0}>
                    <Coins
                      size={13}
                      color={canAffordWithCoins ? "#facc15" : "rgba(255,255,255,0.18)"}
                    />
                    <Text
                      style={{
                        fontSize: "0.95rem",
                        fontFamily: "'HarmonyOS Sans', sans-serif",
                        fontWeight: 700,
                        color: canAffordWithCoins ? "#facc15" : "rgba(255,255,255,0.22)",
                      }}
                    >
                      {price.toLocaleString("vi-VN")}
                    </Text>
                  </Flex>
                </Flex>
              </Box>

              {/* ── PayOS ── */}
              {hasPayOsOption && (
                <Box
                  as="button"
                  w="100%"
                  p="14px 16px"
                  borderRadius="14px"
                  border="none"
                  cursor={isAnyProcessing ? "not-allowed" : "pointer"}
                  textAlign="left"
                  onClick={() => !isAnyProcessing && handlePayOs()}
                  style={{
                    background: "rgba(99,102,241,0.05)",
                    border: "1px solid rgba(99,102,241,0.18)",
                    opacity: payosProcessing ? 0.65 : 1,
                    transition: "all 0.18s",
                  }}
                  _hover={
                    !isAnyProcessing
                      ? { background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.38)" } as any
                      : {}
                  }
                >
                  <Flex align="center" justify="space-between">
                    <Flex align="center" gap="12px">
                      {payosProcessing ? (
                        <LoadingRing size={20} color="rgba(129,140,248,0.9)" trackColor="rgba(129,140,248,0.15)" />
                      ) : (
                        <Box
                          w="38px"
                          h="38px"
                          borderRadius="10px"
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                          flexShrink={0}
                          style={{ background: "rgba(99,102,241,0.1)" }}
                        >
                          <CreditCard size={18} color="#818cf8" />
                        </Box>
                      )}
                      <Box>
                        <Text
                          style={{
                            fontSize: "0.82rem",
                            fontFamily: "'HarmonyOS Sans', sans-serif",
                            fontWeight: 600,
                            color: "rgba(255,255,255,0.88)",
                            marginBottom: "3px",
                          }}
                        >
                          PayOS
                        </Text>
                        <Text
                          style={{
                            fontSize: "0.68rem",
                            fontFamily: "'HarmonyOS Sans', sans-serif",
                            color: "rgba(255,255,255,0.33)",
                          }}
                        >
                          {payosProcessing ? "Đang chuyển hướng..." : "Thẻ ATM, Visa, MasterCard, QR Code"}
                        </Text>
                      </Box>
                    </Flex>
                    {!payosProcessing && (
                      <Text
                        flexShrink={0}
                        style={{
                          fontSize: "0.9rem",
                          fontFamily: "'HarmonyOS Sans', sans-serif",
                          fontWeight: 700,
                          color: "rgba(165,180,252,0.9)",
                        }}
                      >
                        {item.realMoneyPriceVnd!.toLocaleString("vi-VN")}₫
                      </Text>
                    )}
                  </Flex>
                </Box>
              )}
            </Flex>

          </Box>
        </MotionBox>
      </Box>
    </AnimatePresence>
  );
}
