"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import ContentEmbed from "./ContentEmbed";
import type { ContentPost } from "@/lib/content-types";

interface ContentSpotlightProps {
  post: ContentPost | null;
  rank: number; // 0, 1, 2
  mode: "best" | "worst";
  loading?: boolean;
  totalPostCount?: number;
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return n.toLocaleString();
}

export default function ContentSpotlight({
  post,
  rank,
  mode,
  loading,
  totalPostCount = 0,
}: ContentSpotlightProps) {
  const isBest = mode === "best";
  const accentColor = isBest ? "#00ff88" : "#ff4444";
  const accentColorMuted = isBest
    ? "rgba(0,255,136,0.1)"
    : "rgba(255,68,68,0.1)";
  const glowClass = isBest ? "glow-green" : "glow-red";

  const rankLabels = isBest ? ["🔥", "⚡", "✨"] : ["📉", "📉", "📉"];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 30 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: -30 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className={`relative rounded-2xl border ${
        isBest ? "border-emerald-500/15" : "border-red-500/15"
      } bg-[#060606] overflow-hidden ${glowClass}`}
    >
      {/* Ambient glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: isBest
            ? "radial-gradient(ellipse at 30% 20%, rgba(0,255,136,0.04) 0%, transparent 60%), radial-gradient(ellipse at 70% 80%, rgba(0,255,136,0.02) 0%, transparent 50%)"
            : "radial-gradient(ellipse at 30% 20%, rgba(255,68,68,0.04) 0%, transparent 60%), radial-gradient(ellipse at 70% 80%, rgba(255,68,68,0.02) 0%, transparent 50%)",
        }}
      />

      <div className="relative z-10 p-6 md:p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <span className="text-lg">
              {rankLabels[rank] || rankLabels[0]}
            </span>
            <span
              className="text-[10px] font-bold uppercase tracking-[0.2em]"
              style={{ color: accentColor, opacity: 0.7 }}
            >
              {isBest ? "Top Content" : "Lowest Content"}
            </span>
            <span className="text-[10px] text-white/15 ml-1">
              #{rank + 1}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {totalPostCount > 0 && (
              <span className="text-[10px] text-white/20">
                from {totalPostCount} posts
              </span>
            )}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
              className="px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider"
              style={{
                backgroundColor: accentColorMuted,
                color: accentColor,
              }}
            >
              Last 30d
            </motion.div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <motion.div
              className="w-6 h-6 border-2 border-white/10 border-t-white/30 rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
            <span className="ml-3 text-xs text-white/20">
              Fetching content...
            </span>
          </div>
        ) : post ? (
          /* Split layout: embed left, metrics right */
          <div className="flex gap-6 items-stretch">
            {/* Content embed — takes 60% */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.15, duration: 0.5 }}
              className="flex-[3] min-w-0 rounded-xl overflow-hidden"
              style={{ minHeight: 320 }}
            >
              <ContentEmbed post={post} size="large" />
            </motion.div>

            {/* Metrics panel — takes 40% */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="flex-[2] flex flex-col justify-between min-w-[200px]"
            >
              {/* Brand info */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-white/5 ring-1 ring-white/[0.08] shrink-0">
                    {post.brandPicture &&
                    post.brandPicture !== "/default-avatar.svg" ? (
                      <Image
                        src={post.brandPicture}
                        alt={post.brandName}
                        width={40}
                        height={40}
                        className="w-full h-full object-cover"
                        unoptimized
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white/20 text-sm font-semibold">
                        {post.brandName.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white/90">
                      {post.brandName}
                    </h3>
                    <p className="text-[10px] text-white/30 uppercase tracking-wider">
                      {post.type !== "post" ? post.type : post.platform}
                    </p>
                  </div>
                </div>

                {/* Score */}
                <div
                  className="text-4xl font-black mb-1 tabular-nums"
                  style={{ color: accentColor }}
                >
                  {post.score.toFixed(0)}
                </div>
                <p className="text-[9px] uppercase tracking-[0.15em] text-white/25 mb-5">
                  Performance Score
                </p>

                {/* Engagement metrics */}
                <div className="space-y-3">
                  <MetricRow
                    icon="❤️"
                    label="Likes"
                    value={formatNumber(post.likes)}
                    accentColor={accentColor}
                  />
                  <MetricRow
                    icon="💬"
                    label="Comments"
                    value={formatNumber(post.comments)}
                    accentColor={accentColor}
                  />
                  <MetricRow
                    icon="🔄"
                    label="Shares"
                    value={formatNumber(post.shares)}
                    accentColor={accentColor}
                  />
                  <MetricRow
                    icon="👁"
                    label="Reach"
                    value={formatNumber(post.reach)}
                    accentColor={accentColor}
                  />
                  <MetricRow
                    icon="📊"
                    label="Engagement"
                    value={post.engagementRate.toFixed(1) + "%"}
                    accentColor={accentColor}
                  />
                </div>
              </div>

              {/* Caption preview */}
              {post.caption && (
                <div className="mt-4 pt-3 border-t border-white/[0.04]">
                  <p className="text-[11px] text-white/30 leading-relaxed line-clamp-3 italic">
                    &ldquo;{post.caption}&rdquo;
                  </p>
                </div>
              )}
            </motion.div>
          </div>
        ) : (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-full bg-white/[0.03] flex items-center justify-center mb-4">
              <span className="text-2xl opacity-20">
                {isBest ? "🔥" : "📉"}
              </span>
            </div>
            <p className="text-sm text-white/30 mb-1">
              No content data available yet
            </p>
            <p className="text-[11px] text-white/15 max-w-sm">
              Real posts, reels, and videos with engagement metrics will appear
              here once Metricool returns content data
            </p>
          </div>
        )}

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="flex items-center justify-between mt-5 pt-4 border-t border-white/[0.04]"
        >
          <div className="text-[11px] text-white/25">
            Score = engagement rate (60%) + reach (40%)
          </div>
          <div
            className="text-[10px] font-semibold uppercase tracking-wider"
            style={{ color: accentColor, opacity: 0.5 }}
          >
            {isBest ? "This is working" : "Needs attention"}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

function MetricRow({
  icon,
  label,
  value,
  accentColor,
}: {
  icon: string;
  label: string;
  value: string;
  accentColor: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="text-xs">{icon}</span>
        <span className="text-[11px] text-white/40">{label}</span>
      </div>
      <span
        className="text-sm font-bold tabular-nums"
        style={{ color: accentColor }}
      >
        {value}
      </span>
    </div>
  );
}
