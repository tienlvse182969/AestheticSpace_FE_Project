import { useState, useEffect } from "react";
import { Box, Flex } from "@chakra-ui/react";
import { motion, useMotionValue } from "motion/react";
import { GripHorizontal, X } from "lucide-react";

const MotionBox = motion.create(Box);

interface DraggableWidgetProps {
  children: React.ReactNode;
  initialX: number;
  initialY: number;
  onRemove: () => void;
  onDragStart?: () => void;
  onDragEnd?: (x: number, y: number) => void;
  extraControls?: React.ReactNode;
  floatingPanel?: React.ReactNode;
  containerRef?: React.RefObject<HTMLDivElement | null>;
  locked?: boolean;
  width?: number;
}

export function DraggableWidget({ children, initialX, initialY, onRemove, onDragStart, onDragEnd, extraControls, floatingPanel, containerRef, locked, width = 240 }: DraggableWidgetProps) {
  const [hovered, setHovered] = useState(false);
  const x = useMotionValue(initialX);
  const y = useMotionValue(initialY);

  useEffect(() => { x.set(initialX); y.set(initialY); }, [initialX, initialY]);

  return (
    <MotionBox
      ref={containerRef as any}
      drag={!locked}
      dragMomentum={false}
      dragElastic={0}
      position="fixed"
      top={0}
      left={0}
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.14, ease: [0.4, 0, 1, 1] } } as any}
      whileDrag={locked ? undefined : ({ scale: 1.015, zIndex: 50 } as any)}
      transition={{
        opacity: { duration: 0.12 },
        scale: { type: "spring", stiffness: 500, damping: 24, mass: 0.9 },
      } as any}
      style={{ x, y, width, cursor: locked ? "default" : "grab", userSelect: "none", zIndex: 10 }}
      onDragStart={() => !locked && onDragStart?.()}
      onDragEnd={() => !locked && onDragEnd?.(Math.round(x.get()), Math.round(y.get()))}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Top bar: grip handle + extra controls + remove button — hidden when locked */}
      {!locked && (
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
      )}
      {locked && <Box style={{ height: 20 }} />}

      {/* Widget content */}
      {children}

      {/* Floating panel (e.g. settings) — absolutely positioned, moves with widget */}
      {floatingPanel}
    </MotionBox>
  );
}
