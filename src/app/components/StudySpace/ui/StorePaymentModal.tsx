import { Box, Flex, Text } from "@chakra-ui/react";
import { motion, AnimatePresence } from "motion/react";
import { X, Coins } from "lucide-react";
import { useTranslation } from "react-i18next";
import { LoadingRing } from "../../ui/LoadingRing";
import { getPremiumDiscountedPrice, type StoreItem } from "../../../../services/aestheticStore.service";

const MotionBox = motion.create(Box);


interface Props {
  item: StoreItem;
  coinBalance: number;
  onClose: () => void;
  onPayWithCoins: () => void;
  isPayingWithCoins: boolean;
  purchaseError: string | null;
  isPremiumUser?: boolean;
}

export function StorePaymentModal({
  item,
  coinBalance,
  onClose,
  onPayWithCoins,
  isPayingWithCoins,
  purchaseError,
  isPremiumUser,
}: Props) {
  const { t } = useTranslation();

  const originalPrice = item.coinPrice ?? 0;
  const hasDiscount = !!isPremiumUser && originalPrice > 0;
  const price = hasDiscount ? getPremiumDiscountedPrice(originalPrice) : originalPrice;
  const canAffordWithCoins = coinBalance >= price;

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
          if (e.target === e.currentTarget && !isPayingWithCoins) onClose();
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
            {!isPayingWithCoins && (
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
              {t("themeStore.payment.title")}
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
                cursor={!canAffordWithCoins || isPayingWithCoins ? "not-allowed" : "pointer"}
                textAlign="left"
                onClick={() => canAffordWithCoins && !isPayingWithCoins && onPayWithCoins()}
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
                  canAffordWithCoins && !isPayingWithCoins
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
                        {t("themeStore.payment.coinTitle")}
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
                          {t("themeStore.payment.balance", { amount: coinBalance.toLocaleString("vi-VN") })}
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
                          {t("themeStore.payment.needMore", { amount: (price - coinBalance).toLocaleString("vi-VN") })}
                        </Text>
                      )}
                    </Box>
                  </Flex>
                  <Flex align="center" gap="6px" flexShrink={0}>
                    <Coins
                      size={13}
                      color={canAffordWithCoins ? "#facc15" : "rgba(255,255,255,0.18)"}
                    />
                    {hasDiscount && (
                      <Text
                        style={{
                          fontSize: "0.76rem",
                          fontFamily: "'HarmonyOS Sans', sans-serif",
                          fontWeight: 500,
                          color: "rgba(255,255,255,0.35)",
                          textDecoration: "line-through",
                        }}
                      >
                        {originalPrice.toLocaleString("vi-VN")}
                      </Text>
                    )}
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
            </Flex>

          </Box>
        </MotionBox>
      </Box>
    </AnimatePresence>
  );
}
