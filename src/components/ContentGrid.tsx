"use client";

import { motion } from "framer-motion";
import ContentCard from "./ContentCard";
import type { ContentPost } from "@/lib/content-types";

interface ContentGridProps {
  posts: ContentPost[];
  mode: "best" | "worst";
  loading?: boolean;
  totalPostCount?: number;
}

export default function ContentGrid({
  posts,
  mode,
  loading,
  totalPostCount = 0,
}: ContentGridProps) {
  const isBest = mode === "best";
  const accentColor = isBest ? "#00ff88" : "#ff4444";
  const accentColorMuted = isBest
    ? "rgba(0,255,136,0.1)"
    : "rgba(255,68,68,0.1)";
  const glowClass = isBest ? "glow-green" : "glow-red";

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
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{isBest ? "🔥" : "📉"}</span>
            <span
              className="text-sm font-bold uppercase tracking-[0.2em]"
              style={{ color: accentColor, opacity: 0.7 }}
            >
              {isBest ? "Top Performing Content" : "Lowest Performing Content"}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {totalPostCount > 0 && (
              <span className="text-xs text-white/20">
                from {totalPostCount} posts
              </span>
            )}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
              className="px-3.5 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider"
              style={{
                backgroundColor: accentColorMuted,
                color: accentColor,
              }}
            >
              Last 30d
            </motion.div>
          </div>
        </div>

        {/* Content grid */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <motion.div
              className="w-6 h-6 border-2 border-white/10 border-t-white/30 rounded-full"
              animate={{ rotate: 360 }}
              transition={{
                duration: 1,
                repeat: Infinity,
                ease: "linear",
              }}
            />
            <span className="ml-3 text-xs text-white/20">
              Fetching content data...
            </span>
          </div>
        ) : posts.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {posts.map((post, i) => (
              <ContentCard
                key={post.id}
                post={post}
                index={i}
                accentColor={accentColor}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-12 h-12 rounded-full bg-white/[0.03] flex items-center justify-center mb-4">
              <span className="text-xl opacity-30">
                {isBest ? "📊" : "📉"}
              </span>
            </div>
            <p className="text-sm text-white/30 mb-1">
              No content data available yet
            </p>
            <p className="text-[11px] text-white/15">
              Content performance will appear once Metricool returns post data
            </p>
          </div>
        )}

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="flex items-center justify-between mt-6 pt-4 border-t border-white/[0.04]"
        >
          <div className="flex items-center gap-4 text-xs text-white/25">
            <span>
              {posts.length} piece{posts.length !== 1 ? "s" : ""} of content
            </span>
            <span className="text-white/10">•</span>
            <span>Combined score: engagement (60%) + reach (40%)</span>
          </div>
          <div
            className="text-[11px] font-semibold uppercase tracking-wider"
            style={{ color: accentColor, opacity: 0.5 }}
          >
            {isBest ? "Keep creating" : "Review strategy"}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
