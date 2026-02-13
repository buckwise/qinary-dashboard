import type { Platform } from "./metricool";

export interface ContentPost {
  id: string;
  brandId: number;
  brandName: string;
  brandPicture: string;
  platform: Platform;
  type: string; // "post", "reel", "video", "carousel", etc.
  caption: string;
  thumbnail: string | null;
  mediaUrl: string | null; // direct video/image URL for <video> or <img>
  permalink: string | null; // link to original post (used to build embed URL)
  embedUrl: string | null; // ready-to-use iframe embed URL
  mediaType: "video" | "image" | "unknown";
  likes: number;
  comments: number;
  shares: number;
  reach: number;
  engagementRate: number;
  score: number;
  publishedAt: string;
}

export interface ContentPerformanceData {
  best: ContentPost[];
  worst: ContentPost[];
  fetchedAt: string;
  postCount: number;
}

/**
 * Extract a numeric value from an unknown object, trying multiple field names.
 */
export function extractNumber(
  obj: Record<string, unknown>,
  ...keys: string[]
): number {
  for (const key of keys) {
    const val = obj[key];
    if (typeof val === "number" && !isNaN(val)) return val;
    if (typeof val === "string") {
      const n = parseFloat(val);
      if (!isNaN(n)) return n;
    }
  }
  return 0;
}

/**
 * Extract a string value from an unknown object, trying multiple field names.
 */
export function extractString(
  obj: Record<string, unknown>,
  ...keys: string[]
): string {
  for (const key of keys) {
    const val = obj[key];
    if (typeof val === "string" && val.length > 0) return val;
  }
  return "";
}

/**
 * Build an iframe embed URL from a post permalink and platform.
 */
export function buildEmbedUrl(
  permalink: string,
  platform: Platform,
  postId?: string
): string | null {
  if (platform === "instagram" && permalink) {
    // Instagram embed: works for /p/ (posts) and /reel/ URLs
    return permalink.replace(/\/$/, "") + "/embed/";
  }
  if (platform === "tiktok" && postId) {
    return `https://www.tiktok.com/embed/v2/${postId}`;
  }
  if (platform === "youtube" && postId) {
    return `https://www.youtube.com/embed/${postId}?autoplay=1&mute=1&loop=1&controls=0&rel=0`;
  }
  if (platform === "facebook" && permalink) {
    return `https://www.facebook.com/plugins/post.php?href=${encodeURIComponent(permalink)}&show_text=false`;
  }
  return null;
}

/**
 * Detect media type from type string and other signals.
 */
export function detectMediaType(
  typeStr: string,
  platform: Platform
): "video" | "image" | "unknown" {
  const lower = typeStr.toLowerCase();
  if (
    lower.includes("video") ||
    lower.includes("reel") ||
    lower.includes("reels") ||
    platform === "tiktok" ||
    platform === "youtube"
  ) {
    return "video";
  }
  if (
    lower.includes("image") ||
    lower.includes("photo") ||
    lower.includes("carousel")
  ) {
    return "image";
  }
  return "unknown";
}
