import { useState } from "react";
import { Box, Flex } from "@chakra-ui/react";
import { motion } from "motion/react";
import { GripHorizontal, X } from "lucide-react";

const MotionBox = motion.create(Box);

interface DraggableWidgetProps {
  children: React.ReactNode;
  initialX: number;
  initialY: number;
  onRemove: () => void;
  extraControls?: React.ReactNode;
  floatingPanel?: React.ReactNode;
  containerRef?: React.RefObject<HTMLDivElement>;
}

export function DraggableWidget({ children, initialX, initialY, onRemove, extraControls, floatingPanel, containerRef }: DraggableWidgetProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <MotionBox
      ref={containerRef as any}
      drag
      dragMomentum={false}
      dragElastic={0}
      position="fixed"
      top={0}
      left={0}
      initial={{ x: initialX, y: initialY, opacity: 0, scale: 0.92 }}
      animate={{ x: initialX, y: initialY, opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.14, ease: [0.4, 0, 1, 1] } } as any}
      whileDrag={{ scale: 1.015, zIndex: 50 } as any}
      transition={{
        opacity: { duration: 0.12 },
        scale: { type: "spring", stiffness: 500, damping: 24, mass: 0.9 },
        x: { duration: 0 },
        y: { duration: 0 },
      } as any}
      style={{ width: 240, cursor: "grab", userSelect: "none", zIndex: 10 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Top bar: grip handle + extra controls + remove button */}
      <Flex
        justify="space-between"
        align="center"
        px="6px"
        pb="4px"
        style={{ height: 20, opacity: hovered ? 1 : 0, transition: "opacity 0.2s" }}
      >
        <GripHorizontal size={14} color="rgba(255,255,255,0.45)" />
        <Flex align="center" gap="4px">
          {extraControls}
          <Box
            as="button"
            onClick={(e: React.MouseEvent) => { e.stopPropagation(); onRemove(); }}
            display="flex"
            alignItems="center"
            justifyContent="center"
            w="18px"
            h="18px"
            borderRadius="full"
            border="none"
            cursor="pointer"
            style={{ background: "rgba(239,68,68,0.18)", color: "rgba(239,68,68,0.7)", transition: "all 0.15s" }}
            _hover={{ background: "rgba(239,68,68,0.85)", color: "white" }}
            title="Remove widget"
          >
            <X size={10} />
          </Box>
        </Flex>
      </Flex>

      {/* Widget content */}
      {children}

      {/* Floating panel (e.g. settings) — absolutely positioned, moves with widget */}
      {floatingPanel}
    </MotionBox>
  );
}