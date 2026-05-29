import { useState } from "react";
import { Box } from "@chakra-ui/react";
import { motion, useMotionValue } from "motion/react";
import { X } from "lucide-react";
import type { PlacedSticker } from "../types";

const MotionBox = motion.create(Box);

interface DraggableStickerProps {
  sticker: PlacedSticker;
  onRemove: () => void;
  onDragStart?: () => void;
  onDragEnd?: (x: number, y: number) => void;
  locked?: boolean;
}

export function DraggableSticker({ sticker, onRemove, onDragStart, onDragEnd, locked }: DraggableStickerProps) {
  const [hovered, setHovered] = useState(false);
  const x = useMotionValue(sticker.x);
  const y = useMotionValue(sticker.y);

  return (
    <MotionBox
      drag={!locked}
      dragMomentum={false}
      dragElastic={0}
      position="fixed"
      top={0}
      left={0}
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.4 }}
      whileDrag={locked ? undefined : ({ scale: 1.08, zIndex: 60 } as any)}
      transition={{ type: "spring", stiffness: 300, damping: 22 } as any}
      style={{ x, y, width: sticker.size, height: sticker.size, zIndex: 15, cursor: locked ? "default" : "grab", userSelect: "none" }}
      onDragStart={() => !locked && onDragStart?.()}
      onDragEnd={() => !locked && onDragEnd?.(Math.round(x.get()), Math.round(y.get()))}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Box position="relative" w="100%" h="100%">
        <img
          src={sticker.src}
          alt="sticker"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
            pointerEvents: "none",
            filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.45))",
          }}
          draggable={false}
        />
        {!locked && (
          <Box
            as="button"
            onClick={(e: React.MouseEvent) => { e.stopPropagation(); onRemove(); }}
            position="absolute"
            top="-6px"
            right="-6px"
            display="flex"
            alignItems="center"
            justifyContent="center"
            w="18px"
            h="18px"
            borderRadius="full"
            border="none"
            cursor="pointer"
            style={{
              background: "rgba(239,68,68,0.9)",
              color: "white",
              opacity: hovered ? 1 : 0,
              transition: "opacity 0.15s",
              boxShadow: "0 2px 8px rgba(0,0,0,0.5)",
            }}
          >
            <X size={10} />
          </Box>
        )}
      </Box>
    </MotionBox>
  );
}
