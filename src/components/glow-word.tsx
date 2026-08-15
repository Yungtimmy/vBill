"use client";

import { useState } from "react";

export function GlowWord({
  children,
  color = "#C9A227",
}: {
  children: React.ReactNode;
  color?: string;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <span
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        color,
        transition: "text-shadow 0.3s ease",
        textShadow: hovered
          ? `0 0 20px ${color}E6, 0 0 50px ${color}99, 0 0 100px ${color}4D`
          : "none",
      }}
    >
      {children}
    </span>
  );
}
