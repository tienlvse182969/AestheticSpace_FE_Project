import { useState, useRef } from "react";
import { Box, Flex, Text } from "@chakra-ui/react";
import { motion } from "motion/react";
import { useTranslation } from "react-i18next";
import { MessageSquare, CheckCircle, ImagePlus, X } from "lucide-react";
import { PanelCloseBtn } from "../ui/PanelCloseBtn";
import { useCenteredPanel } from "../hooks/useCenteredPanel";
import { useAuth } from "../../../../context/AuthContext";
import { AvatarCircle } from "./AccountPanel";

const MotionBox = motion.create(Box);

type FeedbackType = "feedback" | "bug";

const inputStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: "8px",
  color: "rgba(255,255,255,0.88)",
  fontSize: "0.82rem",
  height: "36px",
  padding: "0 10px",
  outline: "none",
  width: "100%",
  fontFamily: "'HarmonyOS Sans', sans-serif",
};

export function FeedbackPanel({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { x, y, ref } = useCenteredPanel(440, 430);

  const [type, setType]       = useState<FeedbackType>("feedback");
  const [email, setEmail]     = useState("");
  const [content, setContent] = useState("");
  const [images, setImages]   = useState<{ file: File; preview: string }[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    const next = files.map(file => ({ file, preview: URL.createObjectURL(file) }));
    setImages(prev => [...prev, ...next].slice(0, 5));
    e.target.value = "";
  };

  const removeImage = (index: number) => {
    setImages(prev => {
      URL.revokeObjectURL(prev[index].preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  const isGuest  = !user;
  const canSubmit = content.trim().length > 0 && (!isGuest || email.trim().length > 0);

  const handleSubmit = async () => {
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    // TODO: replace with real API call when endpoint is ready
    await new Promise(r => setTimeout(r, 900));
    setSubmitting(false);
    setSuccess(true);
    setTimeout(() => onClose(), 1500);
  };

  return (
    <MotionBox
      ref={ref as any}
      drag
      dragMomentum={false}
      dragElastic={0}
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1, transition: { type: "spring", stiffness: 500, damping: 24, mass: 0.9 } } as any}
      exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.14, ease: [0.4, 0, 1, 1] } } as any}
      position="fixed"
      top={0}
      left={0}
      zIndex={55}
      style={{
        x, y,
        width: 440,
        borderRadius: "16px",
        background: "rgba(12,18,22,0.82)",
        backdropFilter: "blur(18px)",
        WebkitBackdropFilter: "blur(18px)",
        border: "1px solid rgba(255,255,255,0.1)",
        boxShadow: "0 24px 80px rgba(0,0,0,0.75), 0 0 0 1px rgba(255,255,255,0.08)",
        cursor: "grab",
        overflow: "hidden",
      }}
    >
      <Box position="relative" style={{ padding: "18px 18px 20px" }}>
        <PanelCloseBtn onClose={onClose} />

        {/* Header */}
        <Flex align="center" gap={2} mb={4}>
          <MessageSquare size={14} style={{ color: "rgba(255,255,255,0.4)" }} />
          <Text style={{
            fontSize: "0.65rem",
            color: "rgba(255,255,255,0.3)",
            letterSpacing: "0.12em",
            fontFamily: "'HarmonyOS Sans', sans-serif",
          }}>
            {t("feedbackPanel.title").toUpperCase()}
          </Text>
        </Flex>

        {success ? (
          /* ── Success state ── */
          <Flex direction="column" align="center" justify="center" py={10} gap={3}>
            <CheckCircle size={38} style={{ color: "#4ade80" }} />
            <Text style={{
              fontSize: "0.9rem",
              color: "rgba(255,255,255,0.85)",
              fontFamily: "'HarmonyOS Sans', sans-serif",
              textAlign: "center",
            }}>
              {t("feedbackPanel.success")}
            </Text>
          </Flex>
        ) : (
          /* ── Form ── */
          <>
            {/* User info card */}
            <Flex
              align="center" gap={3} mb={4} px="12px" py="10px" borderRadius="10px"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
            >
              <AvatarCircle
                user={user ? { ...user, avatarUrl: user.avatarUrl ?? undefined } : null}
                size={30} fontSize="0.72rem"
              />
              <Box>
                <Text style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.85)", fontFamily: "'HarmonyOS Sans', sans-serif" }}>
                  {user?.name ?? t("account.guest")}
                </Text>
                <Text style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.35)", fontFamily: "'HarmonyOS Sans', sans-serif" }}>
                  {user?.email ?? t("account.demoMode")}
                </Text>
              </Box>
            </Flex>

            {/* Type toggle */}
            <Flex
              mb={3} borderRadius="9px" overflow="hidden"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", padding: 3, gap: 3 }}
            >
              {(["feedback", "bug"] as FeedbackType[]).map((opt) => (
                <Box
                  key={opt}
                  as="button"
                  border="none"
                  cursor="pointer"
                  flex={1}
                  py="6px"
                  borderRadius="7px"
                  onClick={() => setType(opt)}
                  style={{
                    background: type === opt ? "rgba(255,255,255,0.11)" : "transparent",
                    color: type === opt ? "rgba(255,255,255,0.92)" : "rgba(255,255,255,0.38)",
                    fontSize: "0.78rem",
                    fontWeight: type === opt ? 600 : 400,
                    fontFamily: "'HarmonyOS Sans', sans-serif",
                    transition: "all 0.15s",
                  }}
                >
                  {t(opt === "feedback" ? "feedbackPanel.typeFeedback" : "feedbackPanel.typeBug")}
                </Box>
              ))}
            </Flex>

            {/* Email — guest only */}
            {isGuest && (
              <Box mb={3}>
                <input
                  type="email"
                  placeholder={t("feedbackPanel.emailPlaceholder")}
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onPointerDown={e => e.stopPropagation()}
                  style={inputStyle}
                />
              </Box>
            )}

            {/* Content */}
            <Box mb={4}>
              <Box
                as="textarea"
                rows={5}
                placeholder={t(type === "feedback"
                  ? "feedbackPanel.contentPlaceholder_feedback"
                  : "feedbackPanel.contentPlaceholder_bug"
                )}
                value={content}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setContent(e.target.value)}
                onPointerDown={(e: React.PointerEvent) => e.stopPropagation()}
                style={{
                  ...inputStyle,
                  height: "auto",
                  padding: "10px",
                  resize: "none",
                  lineHeight: 1.6,
                }}
              />
            </Box>

            {/* Image upload */}
            <Box mb={3}>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                style={{ display: "none" }}
                onChange={handleImageChange}
                onPointerDown={e => e.stopPropagation()}
              />
              <Flex align="center" gap={2} mb={images.length > 0 ? 2 : 0}>
                <Box
                  as="button"
                  border="none"
                  onClick={() => { if (images.length < 5) fileInputRef.current?.click(); }}
                  onPointerDown={e => (e as React.PointerEvent).stopPropagation()}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    height: 30,
                    padding: "0 10px",
                    borderRadius: 7,
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    color: "rgba(255,255,255,0.5)",
                    fontSize: "0.75rem",
                    fontFamily: "'HarmonyOS Sans', sans-serif",
                    cursor: images.length >= 5 ? "not-allowed" : "pointer",
                    opacity: images.length >= 5 ? 0.45 : 1,
                    transition: "background 0.15s",
                  }}
                >
                  <ImagePlus size={13} />
                  {t("feedbackPanel.attachImages")}
                </Box>
                {images.length > 0 && (
                  <Text style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.25)", fontFamily: "'HarmonyOS Sans', sans-serif" }}>
                    {images.length}/5
                  </Text>
                )}
              </Flex>

              {images.length > 0 && (
                <Flex gap={2} style={{ flexWrap: "wrap" }}>
                  {images.map((img, i) => (
                    <Box key={i} position="relative" style={{ width: 58, height: 58, borderRadius: 7, overflow: "hidden", flexShrink: 0 }}>
                      <img
                        src={img.preview}
                        alt=""
                        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                      />
                      <Box
                        as="button"
                        border="none"
                        onClick={() => removeImage(i)}
                        onPointerDown={e => (e as React.PointerEvent).stopPropagation()}
                        position="absolute"
                        top="2px"
                        right="2px"
                        style={{
                          width: 16,
                          height: 16,
                          borderRadius: "50%",
                          background: "rgba(0,0,0,0.7)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                          padding: 0,
                        }}
                      >
                        <X size={9} color="rgba(255,255,255,0.85)" />
                      </Box>
                    </Box>
                  ))}
                </Flex>
              )}
            </Box>

            {/* Submit */}
            <Box
              as="button"
              w="100%"
              onClick={handleSubmit}
              border="none"
              style={{
                height: 38,
                borderRadius: 10,
                background: canSubmit ? "rgba(78,124,106,0.85)" : "rgba(255,255,255,0.07)",
                color: canSubmit ? "white" : "rgba(255,255,255,0.28)",
                fontSize: "0.84rem",
                fontWeight: 600,
                fontFamily: "'HarmonyOS Sans', sans-serif",
                cursor: canSubmit ? "pointer" : "not-allowed",
                transition: "background 0.2s, color 0.2s",
                opacity: submitting ? 0.7 : 1,
              }}
            >
              {submitting
                ? "..."
                : t(type === "feedback" ? "feedbackPanel.submit_feedback" : "feedbackPanel.submit_bug")}
            </Box>
          </>
        )}
      </Box>
    </MotionBox>
  );
}
