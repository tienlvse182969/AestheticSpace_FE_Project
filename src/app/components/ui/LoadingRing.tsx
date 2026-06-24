import React from "react";

interface LoadingRingProps {
  size?: number;
  color?: string;
  trackColor?: string;
  speed?: string;
  style?: React.CSSProperties;
}

export function LoadingRing({
  size = 20,
  color = "rgba(255,255,255,0.85)",
  trackColor = "rgba(255,255,255,0.15)",
  speed = "0.8s",
  style,
}: LoadingRingProps) {
  const thickness = size >= 30 ? 3 : size >= 18 ? 2 : 1.5;
  return (
    <>
      <div
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          border: `${thickness}px solid ${trackColor}`,
          borderTopColor: color,
          animation: `lr-spin ${speed} linear infinite`,
          flexShrink: 0,
          boxSizing: "border-box",
          ...style,
        }}
      />
      <style>{`@keyframes lr-spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
}
