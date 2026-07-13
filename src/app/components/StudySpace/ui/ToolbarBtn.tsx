import { forwardRef } from "react";
import { Box } from "@chakra-ui/react";
import { Lock } from "lucide-react";

type ToolbarPosition = "bottom" | "left" | "right";

interface ToolbarBtnProps {
  icon: React.ReactNode;
  active: boolean;
  onClick: () => void;
  tooltip: string;
  locked?: boolean;
  position?: ToolbarPosition;
}

function getActiveTransform(position: ToolbarPosition) {
  if (position === "left")  return "scale(1.15) translateX(2px)";
  if (position === "right") return "scale(1.15) translateX(-2px)";
  return "scale(1.15) translateY(-2px)";
}

export const ToolbarBtn = forwardRef<HTMLButtonElement, ToolbarBtnProps>(function ToolbarBtn(
  { icon, active, onClick, tooltip, locked = false, position = "bottom" },
  ref,
) {
  const activeTransform = getActiveTransform(position);
  const dotProps =
    position === "left"  ? { mr: "4px", w: "4px", h: "4px" } :
    position === "right" ? { ml: "4px", w: "4px", h: "4px" } :
                           { mt: "4px", w: "4px", h: "4px" };
  const flexDir =
    position === "left"  ? "row-reverse" :
    position === "right" ? "row" :
                           "column";
  return (
    <Box
      ref={ref}
      as="button"
      onClick={onClick}
      display="flex"
      flexDirection={flexDir as any}
      alignItems="center"
      justifyContent="center"
      bg="transparent"
      border="none"
      cursor="pointer"
      title={tooltip}
      transition="all 0.2s"
      position="relative"
      style={{
        color: locked ? "rgba(255,255,255,0.28)" : active ? "var(--accent)" : "rgba(255,255,255,0.55)",
        transform: (!locked && active) ? activeTransform : "scale(1)",
        opacity: locked ? 0.55 : 1,
      }}
      _hover={locked ? {} : {
        color: active ? "rgba(var(--accent-light-rgb), 1)" : "rgba(255,255,255,0.88)",
        transform: activeTransform,
      }}
    >
      {icon}
      {!locked && active && (
        <Box
          {...dotProps}
          borderRadius="full"
          style={{ background: "var(--accent)" }}
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
});
