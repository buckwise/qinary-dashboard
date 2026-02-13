import type { Platform } from "./metricool";

export interface ContentPost {
  id: string;
  brandId: number;
  brandName: string;
  brandPicture: string;
  platform: Platform;
  type: string;
  caption: string;
  thumbnail: string | null;
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
 * Returns 0 if none found.
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
