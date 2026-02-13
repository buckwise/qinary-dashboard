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
      className="relative rounded-xl border border-white/[0.06] bg-[#0a0a0a] overflow-hidden group hover:bg-[#0f0f0f] transition-all duration-300"
    >
      {/* Thumbnail area */}
      <div className="relative h-36 bg-white/[0.02] overflow-hidden">
        {hasImage ? (
          <Image
            src={post.thumbnail!}
            alt={post.caption || "Post content"}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            unoptimized
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div
              className="text-4xl font-bold opacity-10"
              style={{ color: accentColor }}
            >
              {post.platform.charAt(0).toUpperCase()}
            </div>
          </div>
        )}

        {/* Platform badge */}
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

        {/* Score badge */}
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
          <div className="absolute bottom-2 left-2 px-1.5 py-0.5 rounded text-[8px] uppercase tracking-wider font-semibold bg-black/60 text-white/60 backdrop-blur-sm">
            {post.type}
          </div>
        )}
      </div>

      {/* Content area */}
      <div className="p-3">
        {/* Brand row */}
        <div className="flex items-center gap-2 mb-2">
          <div className="w-5 h-5 rounded-full overflow-hidden bg-white/5 shrink-0">
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
              <div className="w-full h-full flex items-center justify-center text-[8px] text-white/20 font-semibold">
                {post.brandName.charAt(0)}
              </div>
            )}
          </div>
          <span className="text-[11px] font-medium text-white/60 truncate">
            {post.brandName}
          </span>
        </div>

        {/* Caption */}
        {post.caption && (
          <p className="text-[11px] text-white/40 leading-relaxed line-clamp-2 mb-2.5">
            {post.caption}
          </p>
        )}

        {/* Metrics row */}
        <div className="flex items-center gap-3 text-[10px] text-white/30">
          {post.likes > 0 && (
            <span className="flex items-center gap-1">
              <svg
                viewBox="0 0 16 16"
                className="w-3 h-3"
                fill="currentColor"
              >
                <path d="M8 14s-5.5-3.5-5.5-7.5C2.5 4 4.5 2.5 6.5 2.5c1.1 0 2.1.5 2.5 1.3.4-.8 1.4-1.3 2.5-1.3 2 0 4 1.5 4 4S8 14 8 14z" />
              </svg>
              {formatNumber(post.likes)}
            </span>
          )}
          {post.comments > 0 && (
            <span className="flex items-center gap-1">
              <svg
                viewBox="0 0 16 16"
                className="w-3 h-3"
                fill="currentColor"
              >
                <path d="M1 3.5C1 2.67 1.67 2 2.5 2h11c.83 0 1.5.67 1.5 1.5v7c0 .83-.67 1.5-1.5 1.5H5l-3 3v-3H2.5C1.67 12 1 11.33 1 10.5v-7z" />
              </svg>
              {formatNumber(post.comments)}
            </span>
          )}
          {post.reach > 0 && (
            <span className="flex items-center gap-1 ml-auto">
              <svg
                viewBox="0 0 16 16"
                className="w-3 h-3"
                fill="currentColor"
              >
                <path d="M8 3C4.36 3 1.26 5.28 0 8.5c1.26 3.22 4.36 5.5 8 5.5s6.74-2.28 8-5.5C14.74 5.28 11.64 3 8 3zm0 9.17c-2.58 0-4.67-1.19-4.67-2.67S5.42 6.83 8 6.83s4.67 1.19 4.67 2.67S10.58 12.17 8 12.17zM8 8a1.5 1.5 0 100 3 1.5 1.5 0 000-3z" />
              </svg>
              {formatNumber(post.reach)}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
