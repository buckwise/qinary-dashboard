"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import PlatformIcons from "./PlatformIcons";
import Sparkline, { generateTrendData } from "./Sparkline";
import { getEstFollowers } from "@/lib/estimations";
import { getBrandStatus } from "@/lib/types";
import type { ProcessedBrand } from "@/lib/metricool";

interface ClientCardProps {
  brand: ProcessedBrand;
  index: number;
  onClick?: () => void;
}

function getSparklineColor(status: "growing" | "stable" | "new"): string {
  switch (status) {
    case "growing":
      return "#00ff88";
    case "stable":
      return "#ffbb00";
    case "new":
      return "#ff4444";
  }
}

export default function ClientCard({ brand, index, onClick }: ClientCardProps) {
  const { border, glow, status: brandStatus, statusClass } = getBrandStatus(brand.platforms);
  const sparkData = generateTrendData(brand.id, 14);
  const sparkColor = getSparklineColor(statusClass);
  const estFollowers = getEstFollowers(brand);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: 0.45,
        delay: index * 0.04,
        ease: [0.16, 1, 0.3, 1],
      }}
      whileHover={{ scale: 1.01, y: -2 }}
      onClick={onClick}
      className={`relative rounded-xl border ${border} bg-[#0a0a0a] p-5
                  hover:bg-[#0f0f0f] transition-all duration-300 ${glow}
                  overflow-hidden group cursor-pointer`}
    >
      {/* Subtle gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.01] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-xl" />

      <div className="relative z-10">
        {/* Top row: avatar, name, status */}
        <div className="flex items-start gap-4 mb-4">
          {/* Profile pic */}
          <div className="relative shrink-0">
            <div className="w-14 h-14 rounded-full overflow-hidden bg-white/5 ring-2 ring-white/[0.06]">
              {brand.picture && brand.picture !== "/default-avatar.svg" ? (
                <Image
                  src={brand.picture}
                  alt={brand.name}
                  width={56}
                  height={56}
                  className="w-full h-full object-cover"
                  unoptimized
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white/20 text-lg font-semibold">
                  {brand.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            {/* Online indicator */}
            {brand.platforms.length > 0 && (
              <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#0a0a0a] flex items-center justify-center">
                <div className="live-dot" style={{ width: 6, height: 6 }} />
              </div>
            )}
          </div>

          {/* Name + platforms */}
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold text-white/90 truncate leading-tight">
              {brand.name}
            </h3>
            <div className="mt-2">
              <PlatformIcons connected={brand.platforms} showAll />
            </div>
          </div>

          {/* Status badge */}
          <div
            className={`shrink-0 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
              statusClass === "growing"
                ? "bg-emerald-500/10 text-emerald-400"
                : statusClass === "stable"
                ? "bg-amber-500/10 text-amber-400"
                : "bg-red-500/10 text-red-400"
            }`}
          >
            {brandStatus}
          </div>
        </div>

        {/* Metrics row */}
        <div className="flex items-end justify-between gap-3">
          <div className="flex flex-col gap-1.5">
            {/* Follower estimate */}
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold text-white/90 tabular-nums">
                {estFollowers.toLocaleString()}
              </span>
              <span className="text-[10px] uppercase tracking-wider text-white/25">
                est. reach
              </span>
            </div>

            {/* Platforms count + days */}
            <div className="flex items-center gap-3 text-[11px] text-white/30">
              <span>
                {brand.platforms.length} platform
                {brand.platforms.length !== 1 ? "s" : ""}
              </span>
              <span className="text-white/10">|</span>
              <span>{brand.daysSinceJoin}d managed</span>
            </div>
          </div>

          {/* Sparkline */}
          <div className="shrink-0 opacity-70 group-hover:opacity-100 transition-opacity duration-300">
            <Sparkline
              data={sparkData}
              color={sparkColor}
              width={90}
              height={34}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
