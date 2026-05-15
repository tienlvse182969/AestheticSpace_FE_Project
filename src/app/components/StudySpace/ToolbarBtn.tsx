import { Box } from "@chakra-ui/react";

interface ToolbarBtnProps {
  icon: React.ReactNode;
  active: boolean;
  onClick: () => void;
  tooltip: string;
}

export function ToolbarBtn({ icon, active, onClick, tooltip }: ToolbarBtnProps) {
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
      style={{
        color: active ? "#7aab97" : "rgba(255,255,255,0.55)",
        transform: active ? "scale(1.15) translateY(-2px)" : "scale(1)",
      }}
      _hover={{
        color: active ? "#8abfac" : "rgba(255,255,255,0.88)",
        transform: "scale(1.15) translateY(-2px)",
      }}
    >
      {icon}
      {active && (
        <Box
          mt="4px"
          w="4px"
          h="4px"
          borderRadius="full"
          style={{ background: "#7aab97" }}
        />
      )}
    </Box>
  );
}
