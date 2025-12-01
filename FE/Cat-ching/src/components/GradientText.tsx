import "./GradientText.css";
import React, { ReactNode } from "react";

interface GradientTextProps {
  children: ReactNode;
  className?: string;
  colors?: string[];
  animationSpeed?: number;
  showBorder?: boolean;
}

export default function GradientText({
  children,
  className = "",
  colors = [
    "#B3D4FF",
    "#004299",
    "#0058CC",
    "#0065FF",
    "#2684FF",
    "#6DACFF",
    "#6DACFF",
    "#B3D4FF",
    "#B3D4FF",
    "#004299",
    "#0058CC",
    "#0065FF",
    "#2684FF",
  ],
  animationSpeed = 3,
  showBorder = false,
}: GradientTextProps) {
  const gradientStyle = {
    backgroundImage: `linear-gradient(to right, ${colors.join(", ")})`,
    animationDuration: `${animationSpeed}s`,
  };

  return (
    <div className={`animated-gradient-text ${className}`}>
      {showBorder && (
        <div className="gradient-overlay" style={gradientStyle}></div>
      )}
      <div className="text-content" style={gradientStyle}>
        {children}
      </div>
    </div>
  );
}
