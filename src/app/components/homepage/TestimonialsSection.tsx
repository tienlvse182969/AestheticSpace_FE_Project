import { motion } from "motion/react";
import { Box, Flex, Heading, Text } from "@chakra-ui/react";
import { Star } from "lucide-react";
import { useTranslation } from "react-i18next";

const MotionBox = motion.create(Box);

export function TestimonialsSection() {
  const { t } = useTranslation();
  const testimonials = [
    { id: 1, name: "Minh Anh", avatar: "MA", content: t("testimonials.t1text"), role: t("testimonials.t1role"), rating: 5 },
    { id: 2, name: "Thanh Hà", avatar: "TH", content: t("testimonials.t2text"), role: t("testimonials.t2role"), rating: 5 },
    { id: 3, name: "Duy Khang", avatar: "DK", content: t("testimonials.t3text"), role: t("testimonials.t3role"), rating: 5 },
    { id: 4, name: "Linh Chi", avatar: "LC", content: t("testimonials.t4text"), role: t("testimonials.t4role"), rating: 5 },
  ];
  return (
    <Box as="section" bg="white" py={24} px={{ base: 6, lg: 10 }}>
      <Box maxW="1280px" mx="auto">
        <MotionBox
          textAlign="center"
          mb={16}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 } as any}
        >
          <Box
            as="span"
            display="inline-block"
            px={4}
            py={1}
            borderRadius="full"
            fontSize="sm"
            mb={4}
            bg="#4e7c6a20"
            color="#4e7c6a"
            fontWeight="600"
            letterSpacing="0.1em"
          >
            {t("testimonials.sectionLabel")}
          </Box>
          <Heading
            as="h2"
            color="#1a3c34"
            fontWeight="900"
            style={{ fontSize: "clamp(1.8rem, 4vw, 2.8rem)" }}
          >
            {t("testimonials.title")}
          </Heading>
        </MotionBox>

        <Box
          display="grid"
          gridTemplateColumns={{ base: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(4, 1fr)" }}
          gap={5}
        >
          {testimonials.map((t, index) => (
            <MotionBox
              key={t.id}
              p={6}
              borderRadius="2xl"
              border="1px solid"
              borderColor="rgba(78,124,106,0.1)"
              bg="#f5f0e8"
              transition="box-shadow 0.2s"
              _hover={{ boxShadow: "md" }}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              {...({ transition: { duration: 0.5, delay: index * 0.1 } } as any)}
            >
              {/* Stars */}
              <Flex gap={1} mb={4}>
                {Array.from({ length: t.rating }).map((_, i) => (
                  <Star key={i} size={14} fill="#4e7c6a" color="#4e7c6a" />
                ))}
              </Flex>

              {/* Content */}
              <Text fontSize="sm" color="#1a3c34/70" lineHeight="relaxed" mb={5}>
                "{t.content}"
              </Text>

              {/* Author */}
              <Flex align="center" gap={3}>
                <Flex
                  w="40px"
                  h="40px"
                  borderRadius="full"
                  align="center"
                  justify="center"
                  bg="#1a3c34"
                  color="white"
                  fontSize="xs"
                  fontWeight="700"
                  flexShrink={0}
                >
                  {t.avatar}
                </Flex>
                <Box>
                  <Text fontSize="sm" color="#1a3c34" fontWeight="600">
                    {t.name}
                  </Text>
                  <Text fontSize="xs" color="#1a3c34/50">
                    {t.role}
                  </Text>
                </Box>
              </Flex>
            </MotionBox>
          ))}
        </Box>
      </Box>
    </Box>
  );
}