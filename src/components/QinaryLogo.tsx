"use client";

import Image from "next/image";

interface QinaryLogoProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export default function QinaryLogo({
  size = "sm",
  className = "",
}: QinaryLogoProps) {
  const heights = {
    sm: 18,
    md: 26,
    lg: 36,
  };

  const h = heights[size];

  return (
    <div className={`relative ${className}`} style={{ height: h }}>
      <Image
        src="/qinary-logo.png"
        alt="Qinary"
        width={Math.round(h * 2.7)}
        height={h}
        className="object-contain mix-blend-screen"
        style={{ height: h, width: "auto" }}
        unoptimized
        priority
      />
    </div>
  );
}
