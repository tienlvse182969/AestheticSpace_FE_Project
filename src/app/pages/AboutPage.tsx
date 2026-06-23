import { Box, Flex, Text } from "@chakra-ui/react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { Users } from "lucide-react";
import { useTranslation } from "react-i18next";
import { APP_VERSION } from "../../version";

const MotionBox = motion.create(Box);

const CONTRIBUTORS = [
  { name: "Phạm Thu Hiền",    avatar: "/assets/ContributorAvatar/PhamThuHien.jpg" },
  { name: "Nguyễn Hồng Ngọc", avatar: "/assets/ContributorAvatar/NguyenHongNgoc.jpg" },
  { name: "Trần Hoàng Duy",   avatar: "/assets/ContributorAvatar/TranHoangDuy.jpg" },
  { name: "Lê Văn Tiến",      avatar: "/assets/ContributorAvatar/LeVanTien.jpg" },
  { name: "Trần Quốc Nam",    avatar: "/assets/ContributorAvatar/TranQuocNam.jpg" },
];

export function AboutPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <Box
      minH="100vh"
      style={{
        background: "#080e12",
        fontFamily: "'HarmonyOS Sans', sans-serif",
      }}
    >
      {/* Hero image */}
      <Box
        position="relative"
        style={{
          height: "clamp(300px, 48vh, 440px)",
          overflow: "hidden",
        }}
      >
        <img
          src="/assets/AboutWallpaper/dan-otis-OYFHT4X5isg-unsplash.jpg"
          alt=""
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />
        {/* Gradient overlay — bottom fade + top fade for navbar */}
        <Box
          position="absolute"
          style={{
            inset: 0,
            background: "linear-gradient(to bottom, rgba(8,14,18,0.72) 0%, transparent 28%), linear-gradient(to top, rgba(8,14,18,1) 0%, rgba(8,14,18,0.35) 55%, transparent 100%)",
          }}
        />
        {/* Logo + version — same horizontal container as content below */}
        <MotionBox
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.4, 0, 0.2, 1] } as any}
          position="absolute"
          style={{ bottom: 36, left: 0, right: 0 }}
        >
          <Box style={{ maxWidth: 860, margin: "0 auto", padding: "0 clamp(24px, 6vw, 100px)" }}>
          <Flex align="center" gap="10px" mb="8px">
            <Text
              style={{
                fontSize: "clamp(2rem, 4.5vw, 3rem)",
                color: "rgba(255,255,255,0.95)",
                letterSpacing: "-0.01em",
                lineHeight: 1,
              }}
            >
              <span style={{ fontFamily: "'Manrope', sans-serif" }}>Aēsthetic</span>
              <span style={{ fontFamily: "'HarmonyOS Sans', sans-serif" }}> Space</span>
            </Text>
            <Box
              style={{
                fontSize: "0.7rem",
                color: "rgba(94,234,212,0.8)",
                fontFamily: "'HarmonyOS Sans', sans-serif",
                letterSpacing: "0.08em",
                background: "rgba(94,234,212,0.12)",
                border: "1px solid rgba(94,234,212,0.25)",
                borderRadius: "6px",
                padding: "3px 9px",
                lineHeight: 1.4,
                flexShrink: 0,
                alignSelf: "flex-end",
                marginBottom: "4px",
              }}
            >
              {APP_VERSION}
            </Box>
          </Flex>
          <Text
            style={{
              fontSize: "0.92rem",
              color: "rgba(255,255,255,0.48)",
              maxWidth: 500,
              lineHeight: 1.65,
              fontFamily: "'HarmonyOS Sans', sans-serif",
            }}
          >
            {t("about.desc")}
          </Text>
          </Box>
        </MotionBox>
      </Box>

      {/* Content */}
      <Box
        style={{
          maxWidth: 860,
          margin: "0 auto",
          padding: "48px clamp(24px, 6vw, 100px) 80px",
        }}
      >
        {/* Contributors */}
        <MotionBox
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.15, ease: [0.4, 0, 0.2, 1] } as any}
          mb={10}
        >
          <Flex align="center" gap={2} mb={5}>
            <Users size={14} style={{ color: "rgba(94,234,212,0.55)" }} />
            <Text
              style={{
                fontSize: "0.65rem",
                color: "rgba(255,255,255,0.28)",
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                fontFamily: "'HarmonyOS Sans', sans-serif",
              }}
            >
              {t("about.contributors")}
            </Text>
          </Flex>
          <Flex wrap="wrap" gap="24px">
            {CONTRIBUTORS.map(({ name, avatar }) => (
              <Flex key={name} direction="column" align="center" gap="8px" style={{ width: 76 }}>
                <Box
                  style={{
                    width: 58,
                    height: 58,
                    borderRadius: "50%",
                    overflow: "hidden",
                    border: "1.5px solid rgba(94,234,212,0.28)",
                    flexShrink: 0,
                  }}
                >
                  <img
                    src={avatar}
                    alt={name}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                </Box>
                <Text
                  style={{
                    fontSize: "0.68rem",
                    color: "rgba(255,255,255,0.52)",
                    fontFamily: "'HarmonyOS Sans', sans-serif",
                    textAlign: "center",
                    lineHeight: 1.35,
                  }}
                >
                  {name}
                </Text>
              </Flex>
            ))}
          </Flex>
        </MotionBox>

        {/* Divider */}
        <Box mb={10} style={{ height: 1, background: "rgba(255,255,255,0.06)" }} />

        {/* CTA + copyright */}
        <MotionBox
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.45, delay: 0.3 } as any}
        >
          <Flex align="center" justify="space-between" wrap="wrap" gap={4}>
            <Box
              as="button"
              onClick={() => navigate("/space")}
              style={{
                background: "rgba(94,234,212,0.1)",
                backdropFilter: "blur(12px)",
                WebkitBackdropFilter: "blur(12px)",
                border: "1px solid rgba(94,234,212,0.25)",
                borderRadius: "10px",
                color: "rgba(255,255,255,0.85)",
                fontSize: "0.88rem",
                padding: "10px 28px",
                cursor: "pointer",
                transition: "all 0.2s",
                letterSpacing: "0.03em",
                fontFamily: "'HarmonyOS Sans', sans-serif",
              }}
            >
              {t("about.openSpace")}
            </Box>
            <Text
              style={{
                fontSize: "0.72rem",
                color: "rgba(255,255,255,0.2)",
                fontFamily: "'HarmonyOS Sans', sans-serif",
                letterSpacing: "0.05em",
              }}
            >
              {t("about.copyright")}
            </Text>
          </Flex>
        </MotionBox>
      </Box>
    </Box>
  );
}
