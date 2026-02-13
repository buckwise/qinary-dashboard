"use client";

import { useState } from "react";
import Image from "next/image";
import { PLATFORM_CONFIG } from "./PlatformIcons";
import type { ContentPost } from "@/lib/content-types";

interface ContentEmbedProps {
  post: ContentPost;
  size?: "large" | "small";
}

/**
 * Smart content embed component.
 * Priority: direct video → platform iframe → thumbnail image → placeholder
 */
export default function ContentEmbed({ post, size = "large" }: ContentEmbedProps) {
  const [iframeError, setIframeError] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const platformConfig = PLATFORM_CONFIG[post.platform];
  const isLarge = size === "large";
  const containerClass = isLarge
    ? "w-full h-full min-h-[300px]"
    : "w-full h-full min-h-[140px]";

  // Priority 1: Direct video URL → <video> with autoplay
  if (post.mediaUrl && post.mediaType === "video" && !videoError) {
    return (
      <div className={`relative ${containerClass} bg-black rounded-xl overflow-hidden`}>
        <video
          src={post.mediaUrl}
          autoPlay
          muted
          loop
          playsInline
          className="w-full h-full object-cover"
          onError={() => setVideoError(true)}
        />
        <PlatformBadge config={platformConfig} />
      </div>
    );
  }

  // Priority 2: Platform iframe embed (Instagram /embed/, TikTok, YouTube)
  if (post.embedUrl && !iframeError) {
    return (
      <div className={`relative ${containerClass} bg-black rounded-xl overflow-hidden`}>
        <iframe
          src={post.embedUrl}
          className="w-full h-full border-0"
          allow="autoplay; encrypted-media"
          allowFullScreen
          loading="lazy"
          onError={() => setIframeError(true)}
          style={{ minHeight: isLarge ? 400 : 200 }}
        />
        <PlatformBadge config={platformConfig} />
      </div>
    );
  }

  // Priority 3: Thumbnail / media image
  if (post.thumbnail || (post.mediaUrl && post.mediaType === "image")) {
    const imgSrc = post.thumbnail || post.mediaUrl!;
    return (
      <div className={`relative ${containerClass} bg-black rounded-xl overflow-hidden`}>
        <Image
          src={imgSrc}
          alt={post.caption || "Post content"}
          fill
          className="object-cover"
          unoptimized
        />
        <PlatformBadge config={platformConfig} />
        {post.mediaType === "video" && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-14 h-14 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="w-7 h-7 text-white/80 ml-1" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Priority 4: Styled placeholder
  return (
    <div
      className={`relative ${containerClass} bg-gradient-to-br from-white/[0.03] to-white/[0.01] rounded-xl overflow-hidden flex items-center justify-center`}
    >
      <div className="text-center">
        <div className="scale-[2.5] mb-4 opacity-20" style={{ color: platformConfig.color }}>
          {platformConfig.icon}
        </div>
        <p className="text-[10px] text-white/20 uppercase tracking-wider font-medium mt-6">
          {platformConfig.label} Content
        </p>
      </div>
      <PlatformBadge config={platformConfig} />
    </div>
  );
}

function PlatformBadge({
  config,
}: {
  config: { color: string; abbr: string; icon: React.ReactElement };
}) {
  return (
    <div
      className="absolute top-3 left-3 px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider backdrop-blur-md flex items-center gap-1.5 z-10"
      style={{ backgroundColor: "rgba(0,0,0,0.7)", color: config.color }}
    >
      <span className="scale-90">{config.icon}</span>
      {config.abbr}
    </div>
  );
}
