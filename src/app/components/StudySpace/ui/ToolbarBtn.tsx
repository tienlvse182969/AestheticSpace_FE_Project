import { Box } from "@chakra-ui/react";
import { Lock } from "lucide-react";

interface ToolbarBtnProps {
  icon: React.ReactNode;
  active: boolean;
  onClick: () => void;
  tooltip: string;
  locked?: boolean;
}

export function ToolbarBtn({ icon, active, onClick, tooltip, locked = false }: ToolbarBtnProps) {
  return (
    <Box
      as="button"
      onClick={onClick}
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      bg="transparent"
      border="none"
      cursor="pointer"
      title={tooltip}
      transition="all 0.2s"
      position="relative"
      style={{
        color: locked ? "rgba(255,255,255,0.28)" : active ? "#7aab97" : "rgba(255,255,255,0.55)",
        transform: (!locked && active) ? "scale(1.15) translateY(-2px)" : "scale(1)",
        opacity: locked ? 0.55 : 1,
      }}
      _hover={locked ? {} : {
        color: active ? "#8abfac" : "rgba(255,255,255,0.88)",
        transform: "scale(1.15) translateY(-2px)",
      }}
    >
      {icon}
      {!locked && active && (
        <Box
          mt="4px"
          w="4px"
          h="4px"
          borderRadius="full"
          style={{ background: "#7aab97" }}
        />
      )}
      {locked && (
        <Box
          position="absolute"
          bottom="-1px"
          right="-3px"
          display="flex"
          alignItems="center"
          justifyContent="center"
          style={{
            width: 13,
            height: 13,
            borderRadius: "50%",
            background: "rgba(10,15,22,0.9)",
            border: "1px solid rgba(255,255,255,0.18)",
          }}
        >
          <Lock size={7} style={{ color: "rgba(255,255,255,0.55)" }} />
        </Box>
      )}
    </Box>
  );
}
