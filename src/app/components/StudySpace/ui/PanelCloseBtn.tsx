import { useState } from "react";
import { Box } from "@chakra-ui/react";

interface PanelCloseBtnProps {
  onClose: () => void;
}

export function PanelCloseBtn({ onClose }: PanelCloseBtnProps) {
  const [hov, setHov] = useState(false);

  return (
    <Box
      as="button"
      onClick={onClose}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      position="absolute"
      top={0}
      right={0}
      display="flex"
      alignItems="center"
      justifyContent="center"
      border="none"
      cursor="pointer"
      style={{
        width: 46,
        height: 36,
        background: hov ? "rgba(196,43,43,0.88)" : "transparent",
        borderRadius: "0 10px 0 0",
        color: hov ? "white" : "rgba(255,255,255,0.45)",
        transition: "background 0.12s, color 0.12s",
        zIndex: 2,
      }}
    >
      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
        <line x1="1" y1="1" x2="9" y2="9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        <line x1="9" y1="1" x2="1" y2="9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    </Box>
  );
}
