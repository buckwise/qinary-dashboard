"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { PLATFORM_CONFIG } from "./PlatformIcons";
import type { ContentPost } from "@/lib/content-types";

interface ContentCardProps {
  post: ContentPost;
  index: number;
  accentColor: string;
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return n.toLocaleString();
}

export default function ContentCard({
  post,
  index,
  accentColor,
}: ContentCardProps) {
  const platformConfig = PLATFORM_CONFIG[post.platform];
  const hasImage = post.thumbnail && post.thumbnail.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: 0.5,
        delay: index * 0.08,
        ease: [0.16, 1, 0.3, 1],
      }}
      className="relative rounded-xl border border-white/[0.06] bg-[#0a0a0a] overflow-hidden group"
    >
      {/* Thumbnail area — fixed aspect ratio container */}
      <div className="relative aspect-[4/5] bg-black overflow-hidden">
        {hasImage ? (
          <Image
            src={post.thumbnail!}
            alt={post.caption || "Post content"}
            fill
            className="object-cover"
            unoptimized
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-white/[0.02]">
            <div
              className="text-4xl font-bold opacity-10"
              style={{ color: accentColor }}
            >
              {post.platform.charAt(0).toUpperCase()}
            </div>
          </div>
        )}

        {/* Gradient overlay at bottom for readability */}
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />

        {/* Platform badge — top left */}
        <div
          className="absolute top-2 left-2 px-1.5 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider backdrop-blur-sm"
          style={{
            backgroundColor: "rgba(0,0,0,0.6)",
            color: platformConfig.color,
          }}
        >
          <span className="flex items-center gap-1">
            <span className="scale-75 inline-block">
              {platformConfig.icon}
            </span>
            {platformConfig.abbr}
          </span>
        </div>

        {/* Score badge — top right */}
        <div
          className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-bold backdrop-blur-sm"
          style={{
            backgroundColor: "rgba(0,0,0,0.6)",
            color: accentColor,
          }}
        >
          {post.score.toFixed(0)}
        </div>

        {/* Post type badge */}
        {post.type && post.type !== "post" && (
          <div className="absolute top-2 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded text-[8px] uppercase tracking-wider font-semibold bg-black/60 text-white/60 backdrop-blur-sm">
            {post.type}
          </div>
        )}

        {/* Brand + metrics overlay at bottom */}
        <div className="absolute inset-x-0 bottom-0 p-2.5">
          {/* Brand row */}
          <div className="flex items-center gap-2 mb-1.5">
            <div className="w-5 h-5 rounded-full overflow-hidden bg-white/10 shrink-0 ring-1 ring-white/10">
              {post.brandPicture &&
              post.brandPicture !== "/default-avatar.svg" ? (
                <Image
                  src={post.brandPicture}
                  alt={post.brandName}
                  width={20}
                  height={20}
                  className="w-full h-full object-cover"
                  unoptimized
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[8px] text-white/40 font-semibold">
                  {post.brandName.charAt(0)}
                </div>
              )}
            </div>
            <span className="text-[11px] font-medium text-white/90 truncate drop-shadow-lg">
              {post.brandName}
            </span>
          </div>

          {/* Metrics row */}
          <div className="flex items-center gap-3 text-[10px] text-white/70">
            {post.likes > 0 && (
              <span className="flex items-center gap-1">
                <span className="text-[9px]">❤️</span>
                {formatNumber(post.likes)}
              </span>
            )}
            {post.comments > 0 && (
              <span className="flex items-center gap-1">
                <span className="text-[9px]">💬</span>
                {formatNumber(post.comments)}
              </span>
            )}
            {post.shares > 0 && (
              <span className="flex items-center gap-1">
                <span className="text-[9px]">🔄</span>
                {formatNumber(post.shares)}
              </span>
            )}
            {post.reach > 0 && (
              <span className="flex items-center gap-1 ml-auto">
                <span className="text-[9px]">👁</span>
                {formatNumber(post.reach)}
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
