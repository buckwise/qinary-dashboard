"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import PlatformIcons from "./PlatformIcons";
import Sparkline, { generateTrendData } from "./Sparkline";
import AnimatedNumber from "./AnimatedNumber";
import StatBlock from "./StatBlock";
import { useStats } from "@/hooks/useStats";
import { getGrowthPercent } from "@/lib/estimations";
import type { ProcessedBrand } from "@/lib/metricool";

interface SpotlightCardProps {
  brand: ProcessedBrand;
  rank: number;
  mode: "celebrate" | "support";
}

export default function SpotlightCard({ brand, rank, mode }: SpotlightCardProps) {
  const isCelebrate = mode === "celebrate";
  const sparkData = generateTrendData(brand.id, 20);
  const growth = getGrowthPercent(brand);
  const { stats } = useStats(brand);

  const accentColor = isCelebrate ? "#00ff88" : "#ff4444";
  const accentColorMuted = isCelebrate ? "rgba(0,255,136,0.1)" : "rgba(255,68,68,0.1)";
  const glowClass = isCelebrate ? "glow-green" : "glow-red";

  const rankLabels = isCelebrate
    ? ["🏆", "🥈", "🥉"]
    : ["⚠️", "⚠️", "⚠️"];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 30 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: -30 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className={`relative rounded-2xl border ${
        isCelebrate ? "border-emerald-500/15" : "border-red-500/15"
      } bg-[#060606] overflow-hidden ${glowClass}`}
    >
      {/* Ambient glow background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: isCelebrate
            ? "radial-gradient(ellipse at 30% 20%, rgba(0,255,136,0.04) 0%, transparent 60%), radial-gradient(ellipse at 70% 80%, rgba(0,255,136,0.02) 0%, transparent 50%)"
            : "radial-gradient(ellipse at 30% 20%, rgba(255,68,68,0.04) 0%, transparent 60%), radial-gradient(ellipse at 70% 80%, rgba(255,68,68,0.02) 0%, transparent 50%)",
        }}
      />

      <div className="relative z-10 p-6 md:p-8">
        {/* Section header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <span className="text-lg">{rankLabels[rank] || rankLabels[0]}</span>
            <span
              className="text-[10px] font-bold uppercase tracking-[0.2em]"
              style={{ color: accentColor, opacity: 0.7 }}
            >
              {isCelebrate ? "Top Performer" : "Needs Support"}
            </span>
            <span className="text-[10px] text-white/15 ml-1">
              #{rank + 1}
            </span>
          </div>

          {/* Growth badge */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
            className="px-3 py-1 rounded-full text-sm font-bold"
            style={{
              backgroundColor: accentColorMuted,
              color: accentColor,
            }}
          >
            {growth >= 0 ? "+" : ""}{growth}%
          </motion.div>
        </div>

        {/* Main content: profile + stats */}
        <div className="flex gap-6 items-start">
          {/* Large profile image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15, duration: 0.5 }}
            className="shrink-0"
          >
            <div
              className={`w-24 h-24 md:w-28 md:h-28 rounded-2xl overflow-hidden ring-2 ${
                isCelebrate ? "ring-emerald-500/40" : "ring-red-500/40"
              }`}
              style={{
                boxShadow: `0 0 40px ${isCelebrate ? "rgba(0,255,136,0.15)" : "rgba(255,68,68,0.15)"}`,
              }}
            >
              {brand.picture && brand.picture !== "/default-avatar.svg" ? (
                <Image
                  src={brand.picture}
                  alt={brand.name}
                  width={112}
                  height={112}
                  className="w-full h-full object-cover"
                  unoptimized
                />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center text-3xl font-bold"
                  style={{ backgroundColor: accentColorMuted, color: accentColor }}
                >
                  {brand.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
          </motion.div>

          {/* Name + platforms + sparkline */}
          <div className="flex-1 min-w-0">
            <motion.h2
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="text-2xl md:text-3xl font-bold text-white/95 truncate leading-tight mb-2"
            >
              {brand.name}
            </motion.h2>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mb-4"
            >
              <PlatformIcons connected={brand.platforms} showAll size="md" />
            </motion.div>

            {/* Sparkline - bigger */}
            <motion.div
              initial={{ opacity: 0, scaleX: 0 }}
              animate={{ opacity: 1, scaleX: 1 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              style={{ transformOrigin: "left" }}
            >
              <Sparkline
                data={sparkData}
                color={accentColor}
                width={200}
                height={40}
                strokeWidth={2}
              />
            </motion.div>
          </div>
        </div>

        {/* Stats grid */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6"
        >
          <StatBlock
            label="Followers"
            value={stats.followers}
            color={accentColor}
            delay={0.5}
            isEstimated={stats.isEstimated}
          />
          <StatBlock
            label="Reach"
            value={stats.reach}
            color={accentColor}
            delay={0.6}
            isEstimated={stats.isEstimated}
          />
          <StatBlock
            label="Engagement"
            value={stats.engagement}
            color={accentColor}
            delay={0.7}
            formatFn={(n) => n.toFixed(1) + "%"}
            rawNumber={false}
            isEstimated={stats.isEstimated}
          />
          <StatBlock
            label="Content Published"
            value={stats.contentPublished}
            color={accentColor}
            delay={0.8}
            formatFn={(n) => n.toString()}
            isEstimated={stats.isEstimated}
          />
        </motion.div>

        {/* Bottom detail row */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="flex items-center justify-between mt-5 pt-4 border-t border-white/[0.04]"
        >
          <div className="flex items-center gap-4 text-[11px] text-white/25">
            <span>
              {brand.platforms.length} platform{brand.platforms.length !== 1 ? "s" : ""} connected
            </span>
            <span className="text-white/10">•</span>
            <span>{brand.daysSinceJoin} days managed</span>
            <span className="text-white/10">•</span>
            <span>
              Joined{" "}
              {new Date(brand.joinDate).toLocaleDateString("en-US", {
                month: "short",
                year: "numeric",
              })}
            </span>
          </div>
          <div
            className="text-[10px] font-semibold uppercase tracking-wider"
            style={{ color: accentColor, opacity: 0.5 }}
          >
            {isCelebrate ? "Keep it up" : "Action needed"}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
