"use client";

import { motion } from "framer-motion";

interface QinaryLogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  className?: string;
}

export default function QinaryLogo({
  size = "sm",
  showText = true,
  className = "",
}: QinaryLogoProps) {
  const sizes = {
    sm: { icon: 20, text: "text-sm" },
    md: { icon: 28, text: "text-lg" },
    lg: { icon: 36, text: "text-2xl" },
  };

  const s = sizes[size];

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <svg
        viewBox="0 0 40 40"
        width={s.icon}
        height={s.icon}
        fill="none"
        className="shrink-0"
      >
        <rect
          width="40"
          height="40"
          rx="8"
          fill="white"
          fillOpacity="0.04"
        />
        <path
          d="M12 28L20 12L28 28"
          stroke="white"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeOpacity="0.4"
        />
        <circle cx="20" cy="22" r="1.5" fill="white" fillOpacity="0.3" />
      </svg>
      {showText && (
        <span
          className={`${s.text} font-semibold tracking-tight text-white/30`}
        >
          Qinary
        </span>
      )}
    </div>
  );
}
