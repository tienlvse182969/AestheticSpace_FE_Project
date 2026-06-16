import { Box, Flex, Text } from "@chakra-ui/react";
import { motion } from "motion/react";
import { Clock, ShoppingBag, Coins, Image as ImageIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { StoreItem } from "../../../../services/aestheticStore.service";

const MotionBox = motion.create(Box);

interface Props {
  item: StoreItem;
  onBuy: () => void;
  onDismiss: () => void;
}

export function TrialExpiredModal({ item, onBuy, onDismiss }: Props) {
  const { t } = useTranslation();
  const hasCoin = item.coinPrice != null && item.coinPrice > 0;
  const hasVnd  = item.realMoneyPriceVnd != null && item.realMoneyPriceVnd > 0;

  return (
    <>
      {/* Backdrop */}
      <MotionBox
        position="fixed" inset={0} zIndex={300}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        transition={{ duration: 0.2 } as any}
        onClick={onDismiss}
        style={{ background: "rgba(0,0,0,0.62)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}
      />

      {/* Centering wrapper */}
      <Box
        position="fixed" inset={0} zIndex={301}
        display="flex" alignItems="center" justifyContent="center"
        style={{ pointerEvents: "none" }}
      >
        <MotionBox
          initial={{ opacity: 0, scale: 0.88, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0, transition: { type: "spring", stiffness: 420, damping: 28 } } as any}
          exit={{ opacity: 0, scale: 0.92, y: 10, transition: { duration: 0.18, ease: [0.4, 0, 1, 1] } } as any}
          style={{ pointerEvents: "auto", width: 360 }}
        >
          <Box
            borderRadius="18px"
            overflow="hidden"
            style={{
              background: "rgba(8,12,20,0.96)",
              backdropFilter: "blur(24px)",
              WebkitBackdropFilter: "blur(24px)",
              border: "1px solid rgba(255,255,255,0.1)",
              boxShadow: "0 28px 80px rgba(0,0,0,0.75), 0 0 0 1px rgba(255,255,255,0.05)",
            }}
          >
            {/* Top section */}
            <Box px="24px" pt="24px" pb="16px" textAlign="center">
              <Flex justify="center" mb="14px">
                <Box
                  w="54px" h="54px" borderRadius="15px"
                  display="flex" alignItems="center" justifyContent="center"
                  style={{ background: "rgba(59,130,246,0.12)", border: "1px solid rgba(59,130,246,0.25)" }}
                >
                  <Clock size={24} color="#3b82f6" />
                </Box>
              </Flex>

              <Text
                mb="7px"
                style={{
                  fontSize: "1rem",
                  fontFamily: "'HarmonyOS Sans', sans-serif",
                  fontWeight: 700,
                  color: "rgba(255,255,255,0.95)",
                }}
              >
                {t("themeStore.trial.expired.title")}
              </Text>

              <Text
                style={{
                  fontSize: "0.78rem",
                  fontFamily: "'HarmonyOS Sans', sans-serif",
                  color: "rgba(255,255,255,0.42)",
                  lineHeight: 1.65,
                }}
              >
                {t("themeStore.trial.expired.body", { name: item.name })}
              </Text>
            </Box>

            {/* Item card */}
            <Box mx="16px" mb="12px" borderRadius="11px" overflow="hidden"
              style={{ border: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.04)" }}>
              <Flex align="center" gap="11px" px="12px" py="11px">
                <Box w="38px" h="38px" borderRadius="9px" flexShrink={0} overflow="hidden"
                  style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
                  {item.assetUrl ? (
                    <Box as="img" src={item.assetUrl}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <Flex w="full" h="full" align="center" justify="center"
                      style={{ background: "rgba(59,130,246,0.1)" }}>
                      <ImageIcon size={14} color="rgba(255,255,255,0.3)" />
                    </Flex>
                  )}
                </Box>

                <Box flex={1} minW={0}>
                  <Text style={{
                    fontSize: "0.83rem",
                    fontFamily: "'HarmonyOS Sans', sans-serif",
                    fontWeight: 600,
                    color: "rgba(255,255,255,0.9)",
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>
                    {item.name}
                  </Text>
                  <Flex align="center" gap="6px" mt="3px">
                    {hasCoin && (
                      <Flex align="center" gap="3px">
                        <Coins size={11} color="#facc15" />
                        <Text style={{ fontSize: "0.75rem", fontFamily: "'HarmonyOS Sans', sans-serif", fontWeight: 700, color: "#facc15" }}>
                          {item.coinPrice!.toLocaleString("vi-VN")}
                        </Text>
                      </Flex>
                    )}
                    {hasCoin && hasVnd && (
                      <Text style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.2)", fontFamily: "'HarmonyOS Sans', sans-serif" }}>·</Text>
                    )}
                    {hasVnd && (
                      <Text style={{ fontSize: "0.75rem", fontFamily: "'HarmonyOS Sans', sans-serif", color: "rgba(255,255,255,0.4)" }}>
                        {item.realMoneyPriceVnd!.toLocaleString("vi-VN")}đ
                      </Text>
                    )}
                    {!hasCoin && !hasVnd && (
                      <Text style={{ fontSize: "0.75rem", fontFamily: "'HarmonyOS Sans', sans-serif", color: "rgba(94,234,212,0.8)" }}>
                        {t("themeStore.free")}
                      </Text>
                    )}
                  </Flex>
                </Box>
              </Flex>
            </Box>

            {/* Prompt text */}
            <Text px="24px" mb="14px" style={{
              fontSize: "0.73rem",
              fontFamily: "'HarmonyOS Sans', sans-serif",
              color: "rgba(255,255,255,0.3)",
              textAlign: "center",
            }}>
              {t("themeStore.trial.expired.prompt")}
            </Text>

            {/* Buttons */}
            <Flex direction="column" gap="6px" px="16px" pb="20px">
              <Box
                as="button"
                onClick={onBuy}
                display="flex" alignItems="center" justifyContent="center" gap="7px"
                w="100%" py="11px" borderRadius="11px" border="none" cursor="pointer"
                style={{
                  background: "linear-gradient(135deg, rgba(139,92,246,0.92), rgba(59,130,246,0.92))",
                  color: "#fff",
                  fontSize: "0.83rem",
                  fontFamily: "'HarmonyOS Sans', sans-serif",
                  fontWeight: 600,
                  boxShadow: "0 4px 20px rgba(99,102,241,0.32)",
                  transition: "filter 0.15s",
                }}
                _hover={{ filter: "brightness(1.1)" } as any}
              >
                <ShoppingBag size={14} />
                {t("themeStore.trial.expired.buyNow")}
              </Box>

              <Box
                as="button"
                onClick={onDismiss}
                display="flex" alignItems="center" justifyContent="center"
                w="100%" py="9px" borderRadius="11px" border="none" cursor="pointer"
                style={{
                  background: "transparent",
                  color: "rgba(255,255,255,0.3)",
                  fontSize: "0.78rem",
                  fontFamily: "'HarmonyOS Sans', sans-serif",
                  transition: "color 0.15s",
                }}
                _hover={{ color: "rgba(255,255,255,0.6)" } as any}
              >
                {t("themeStore.trial.expired.dismiss")}
              </Box>
            </Flex>
          </Box>
        </MotionBox>
      </Box>
    </>
  );
}
