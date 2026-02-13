"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { PLATFORM_CONFIG } from "./PlatformIcons";
import Sparkline, { generateTrendData } from "./Sparkline";
import StatBlock from "./StatBlock";
import { useStats } from "@/hooks/useStats";
import { getGrowthPercent } from "@/lib/estimations";
import type { ProcessedBrand } from "@/lib/metricool";
import type { ContentPost } from "@/lib/content-types";

interface SpotlightCardProps {
  brand: ProcessedBrand;
  rank: number;
  mode: "celebrate" | "support";
  brandPosts?: ContentPost[];
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return n.toLocaleString();
}

function generateInsight(
  brand: ProcessedBrand,
  mode: "celebrate" | "support",
  stats: { followers: number; reach: number; engagement: number; contentPublished: number },
  postCount: number
): string {
  const isCelebrate = mode === "celebrate";
  const platformNames = brand.platforms
    .map((p) => PLATFORM_CONFIG[p].label)
    .join(", ");

  if (isCelebrate) {
    if (brand.platforms.length >= 5) {
      return `${brand.name} maintains a strong multi-platform presence across ${platformNames}. With ${brand.daysSinceJoin} days under management and ${postCount > 0 ? postCount + " tracked posts" : "consistent activity"}, this brand shows solid cross-channel momentum. Their ${stats.engagement.toFixed(1)}% engagement rate reflects meaningful audience connection.`;
    }
    if (brand.platforms.length >= 3) {
      return `${brand.name} is performing well across ${brand.platforms.length} platforms (${platformNames}). After ${brand.daysSinceJoin} days of management, this brand demonstrates healthy growth patterns with an estimated reach of ${formatNumber(stats.reach)}. ${postCount > 0 ? `Their top content has driven strong engagement across ${postCount} tracked posts.` : "Consistent posting cadence is key to their success."}`;
    }
    return `${brand.name} is showing strong results on ${platformNames}. With ${brand.daysSinceJoin} days managed and an engagement rate of ${stats.engagement.toFixed(1)}%, this brand is maximizing its focused platform strategy. ${postCount > 0 ? `${postCount} tracked posts show consistent audience resonance.` : "Consider expanding to additional platforms to amplify reach."}`;
  }

  // Support mode
  if (brand.platforms.length <= 1) {
    return `${brand.name} is currently active on ${brand.platforms.length === 0 ? "no platforms" : platformNames} — expanding to additional channels could significantly boost visibility. With only ${brand.daysSinceJoin} days of management, there's strong potential for growth once a multi-platform strategy is established.`;
  }
  if (brand.daysSinceJoin < 60) {
    return `${brand.name} is a newer account with ${brand.daysSinceJoin} days under management across ${platformNames}. Early-stage brands typically take 60-90 days to build momentum. Focus on consistent posting cadence and audience engagement to accelerate growth.`;
  }
  return `${brand.name} has room for improvement across ${platformNames}. After ${brand.daysSinceJoin} days of management, consider refreshing the content strategy — experimenting with different formats (reels, carousels, stories) and posting times could help boost the ${stats.engagement.toFixed(1)}% engagement rate.`;
}

export default function SpotlightCard({
  brand,
  rank,
  mode,
  brandPosts = [],
}: SpotlightCardProps) {
  const isCelebrate = mode === "celebrate";
  const sparkData = generateTrendData(brand.id, 20);
  const growth = getGrowthPercent(brand);
  const { stats } = useStats(brand);

  const accentColor = isCelebrate ? "#00ff88" : "#ff4444";
  const accentColorMuted = isCelebrate
    ? "rgba(0,255,136,0.1)"
    : "rgba(255,68,68,0.1)";
  const glowClass = isCelebrate ? "glow-green" : "glow-red";

  const rankLabels = isCelebrate
    ? ["\u{1F3C6}", "\u{1F948}", "\u{1F949}"]
    : ["\u26A0\uFE0F", "\u26A0\uFE0F", "\u26A0\uFE0F"];

  const insight = generateInsight(brand, mode, stats, brandPosts.length);

  // Get platform handles to display
  const handleEntries = brand.platforms
    .filter((p) => brand.handles[p])
    .slice(0, 5);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 30 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: -30 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className={`relative rounded-2xl border ${
        isCelebrate ? "border-emerald-500/15" : "border-red-500/15"
      } bg-[#060606] overflow-hidden ${glowClass} flex flex-col`}
      style={{ minHeight: "calc(100vh - 180px)" }}
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

      <div className="relative z-10 p-6 md:p-10 flex flex-col flex-1">
        {/* Section header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{rankLabels[rank] || rankLabels[0]}</span>
            <span
              className="text-base font-bold uppercase tracking-[0.2em]"
              style={{ color: accentColor, opacity: 0.7 }}
            >
              {isCelebrate ? "Top Performer" : "Needs Support"}
            </span>
            <span className="text-sm text-white/15 ml-1">#{rank + 1}</span>
          </div>

          {/* Growth badge */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
            className="px-4 py-1.5 rounded-full text-base font-bold"
            style={{
              backgroundColor: accentColorMuted,
              color: accentColor,
            }}
          >
            {growth >= 0 ? "+" : ""}
            {growth}%
          </motion.div>
        </div>

        {/* Main content: profile + info */}
        <div className="flex gap-8 items-start mb-8">
          {/* Large profile image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15, duration: 0.5 }}
            className="shrink-0"
          >
            <div
              className={`w-40 h-40 md:w-48 md:h-48 rounded-2xl overflow-hidden ring-2 ${
                isCelebrate ? "ring-emerald-500/40" : "ring-red-500/40"
              }`}
              style={{
                boxShadow: `0 0 60px ${
                  isCelebrate
                    ? "rgba(0,255,136,0.2)"
                    : "rgba(255,68,68,0.2)"
                }`,
              }}
            >
              {brand.picture && brand.picture !== "/default-avatar.svg" ? (
                <Image
                  src={brand.picture}
                  alt={brand.name}
                  width={192}
                  height={192}
                  className="w-full h-full object-cover"
                  unoptimized
                />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center text-5xl font-bold"
                  style={{
                    backgroundColor: accentColorMuted,
                    color: accentColor,
                  }}
                >
                  {brand.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
          </motion.div>

          {/* Name + handles + sparkline */}
          <div className="flex-1 min-w-0">
            <motion.h2
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="text-4xl md:text-5xl font-bold text-white/95 truncate leading-tight mb-4"
            >
              {brand.name}
            </motion.h2>

            {/* Platform handles */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="flex flex-wrap items-center gap-2 mb-5"
            >
              {handleEntries.map((platform) => {
                const config = PLATFORM_CONFIG[platform];
                const handle = brand.handles[platform];
                return (
                  <div
                    key={platform}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/[0.06]"
                  >
                    <span style={{ color: config.color }} className="opacity-80">
                      {config.icon}
                    </span>
                    <span className="text-xs text-white/50 truncate max-w-[140px]">
                      @{handle}
                    </span>
                  </div>
                );
              })}
              {brand.platforms.length > handleEntries.length && (
                <span className="text-xs text-white/20">
                  +{brand.platforms.length - handleEntries.length} more
                </span>
              )}
            </motion.div>

            {/* Sparkline - large */}
            <motion.div
              initial={{ opacity: 0, scaleX: 0 }}
              animate={{ opacity: 1, scaleX: 1 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              style={{ transformOrigin: "left" }}
            >
              <Sparkline
                data={sparkData}
                color={accentColor}
                width={320}
                height={56}
                strokeWidth={2.5}
              />
            </motion.div>
          </div>
        </div>

        {/* Stats grid */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
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

        {/* Brand's top content */}
        {brandPosts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.85 }}
            className="mb-8"
          >
            <div className="flex items-center gap-2 mb-4">
              <span className="text-lg">
                {isCelebrate ? "\u{1F4CA}" : "\u{1F4C9}"}
              </span>
              <span
                className="text-xs font-bold uppercase tracking-[0.15em]"
                style={{ color: accentColor, opacity: 0.6 }}
              >
                {isCelebrate ? "Top Content" : "Recent Content"}
              </span>
              <span className="text-[11px] text-white/20 ml-1">
                Last 30 days
              </span>
            </div>

            <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
              {brandPosts.slice(0, 6).map((post, i) => {
                const platformConfig = PLATFORM_CONFIG[post.platform];
                return (
                  <motion.div
                    key={post.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.9 + i * 0.08 }}
                    className="relative rounded-xl border border-white/[0.06] bg-[#0a0a0a] overflow-hidden"
                  >
                    <div className="relative aspect-[4/5] bg-black overflow-hidden">
                      {post.thumbnail ? (
                        <Image
                          src={post.thumbnail}
                          alt={post.caption || "Post"}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-white/[0.02]">
                          <span
                            className="text-2xl font-bold opacity-10"
                            style={{ color: accentColor }}
                          >
                            {post.platform.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}

                      {/* Gradient overlay */}
                      <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />

                      {/* Platform badge */}
                      <div
                        className="absolute top-2 left-2 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider backdrop-blur-sm"
                        style={{
                          backgroundColor: "rgba(0,0,0,0.6)",
                          color: platformConfig.color,
                        }}
                      >
                        {platformConfig.abbr}
                      </div>

                      {/* Score */}
                      <div
                        className="absolute top-2 right-2 px-1.5 py-0.5 rounded-full text-[10px] font-bold backdrop-blur-sm"
                        style={{
                          backgroundColor: "rgba(0,0,0,0.6)",
                          color: accentColor,
                        }}
                      >
                        {post.score.toFixed(0)}
                      </div>

                      {/* Metrics overlay */}
                      <div className="absolute inset-x-0 bottom-0 p-2">
                        <div className="flex items-center gap-2 text-[10px] text-white/70">
                          {post.likes > 0 && (
                            <span className="flex items-center gap-0.5">
                              <span className="text-[9px]">{"\u2764\uFE0F"}</span>
                              {formatNumber(post.likes)}
                            </span>
                          )}
                          {post.reach > 0 && (
                            <span className="flex items-center gap-0.5 ml-auto">
                              <span className="text-[9px]">{"\u{1F441}"}</span>
                              {formatNumber(post.reach)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Performance insight */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1 }}
          className="rounded-xl bg-white/[0.02] border border-white/[0.04] p-5 mb-6 flex-1"
        >
          <div className="flex items-center gap-2 mb-3">
            <span className="text-base">
              {isCelebrate ? "\u{1F4A1}" : "\u{1F527}"}
            </span>
            <span
              className="text-xs font-bold uppercase tracking-[0.15em]"
              style={{ color: accentColor, opacity: 0.6 }}
            >
              Performance Insight
            </span>
          </div>
          <p className="text-sm leading-relaxed text-white/40">{insight}</p>
        </motion.div>

        {/* Bottom detail row */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="flex items-center justify-between pt-4 border-t border-white/[0.04] mt-auto"
        >
          <div className="flex items-center gap-4 text-xs text-white/25">
            <span>
              {brand.platforms.length} platform
              {brand.platforms.length !== 1 ? "s" : ""} connected
            </span>
            <span className="text-white/10">{"\u2022"}</span>
            <span>{brand.daysSinceJoin} days managed</span>
            <span className="text-white/10">{"\u2022"}</span>
            <span>
              Joined{" "}
              {new Date(brand.joinDate).toLocaleDateString("en-US", {
                month: "short",
                year: "numeric",
              })}
            </span>
          </div>
          <div
            className="text-[11px] font-semibold uppercase tracking-wider"
            style={{ color: accentColor, opacity: 0.5 }}
          >
            {isCelebrate ? "Keep it up" : "Action needed"}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
