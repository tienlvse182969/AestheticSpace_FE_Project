import { useState, useRef, useEffect } from "react";
import { Box, Flex, Text, Input } from "@chakra-ui/react";
import { motion } from "motion/react";
import { useTranslation } from "react-i18next";
import { Sparkles } from "lucide-react";
import { LoadingRing } from "@/app/components/ui/LoadingRing";

const MotionBox = motion.create(Box);

interface FirstRoomModalProps {
  onConfirm: (name: string) => Promise<void>;
}

export function FirstRoomModal({ onConfirm }: FirstRoomModalProps) {
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => inputRef.current?.focus(), 300);
    return () => clearTimeout(timer);
  }, []);

  const handleConfirm = async () => {
    if (!name.trim() || loading) return;
    setLoading(true);
    setError(null);
    try {
      await onConfirm(name.trim());
    } catch {
      setError(t("firstRoom.error"));
      setLoading(false);
    }
  };

  return (
    <Box
      position="fixed" inset={0} zIndex={200}
      display="flex" alignItems="center" justifyContent="center"
      style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)" }}
    >
      <MotionBox
        initial={{ opacity: 0, scale: 0.92, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 } as any}
        transition={{ type: "spring", stiffness: 420, damping: 28 } as any}
        style={{
          width: 400,
          borderRadius: 20,
          background: "rgba(12,18,22,0.94)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          border: "1px solid rgba(255,255,255,0.12)",
          boxShadow: "0 32px 80px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.06)",
          padding: "32px 28px 28px",
        }}
      >
        {/* Icon */}
        <Flex justify="center" mb={4}>
          <Flex align="center" justify="center" borderRadius="full"
            style={{
              width: 52, height: 52,
              background: "rgba(78,124,106,0.15)",
              border: "1px solid rgba(78,124,106,0.3)",
            }}>
            <Sparkles size={22} style={{ color: "#7ecfb0" }} />
          </Flex>
        </Flex>

        {/* Title */}
        <Text textAlign="center" mb="6px"
          style={{ fontSize: "1.05rem", fontWeight: 700, color: "rgba(255,255,255,0.92)", fontFamily: "'HarmonyOS Sans', sans-serif" }}>
          {t("firstRoom.title")}
        </Text>
        <Text textAlign="center" mb={5}
          style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.4)", fontFamily: "'HarmonyOS Sans', sans-serif", lineHeight: 1.5 }}>
          {t("firstRoom.subtitle")}
        </Text>

        {/* Input */}
        <Input
          ref={inputRef as any}
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleConfirm()}
          placeholder={t("firstRoom.placeholder")}
          style={{
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.14)",
            borderRadius: 10,
            color: "rgba(255,255,255,0.9)",
            fontSize: "0.9rem",
            height: 44,
            paddingLeft: 14,
            fontFamily: "'HarmonyOS Sans', sans-serif",
          }}
          _placeholder={{ color: "rgba(255,255,255,0.25)" } as any}
          _focus={{ borderColor: "rgba(78,124,106,0.6)", boxShadow: "0 0 0 3px rgba(78,124,106,0.12)" } as any}
        />

        {error && (
          <Text mt={2}
            style={{ fontSize: "0.71rem", color: "#f87171", fontFamily: "'HarmonyOS Sans', sans-serif" }}>
            {error}
          </Text>
        )}

        {/* Confirm button */}
        <Box
          as="button"
          onClick={handleConfirm}
          mt={4} w="100%"
          py="13px" borderRadius="10px" border="none"
          cursor={name.trim() && !loading ? "pointer" : "not-allowed"}
          style={{
            background: name.trim() && !loading
              ? "rgba(78,124,106,0.3)"
              : "rgba(255,255,255,0.05)",
            border: `1px solid ${name.trim() && !loading ? "rgba(78,124,106,0.5)" : "rgba(255,255,255,0.08)"}`,
            color: name.trim() && !loading ? "#7ecfb0" : "rgba(255,255,255,0.25)",
            fontSize: "0.85rem",
            fontWeight: 600,
            fontFamily: "'HarmonyOS Sans', sans-serif",
            transition: "all 0.15s",
            opacity: loading ? 0.6 : 1,
          }}
        >
          {loading ? (
            <Flex align="center" justify="center" gap={2}>
              <LoadingRing size={14} color="#7ecfb0" trackColor="rgba(126,207,176,0.2)" />
              {t("firstRoom.confirm")}
            </Flex>
          ) : t("firstRoom.confirm")}
        </Box>
      </MotionBox>
    </Box>
  );
}
