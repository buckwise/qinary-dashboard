import { NextResponse } from "next/server";
import {
  fetchBrands,
  processBrand,
  fetchPlatformPosts,
} from "@/lib/metricool";
import type { Platform } from "@/lib/metricool";
import {
  extractNumber,
  extractString,
  buildEmbedUrl,
  detectMediaType,
  type ContentPost,
} from "@/lib/content-types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * Extract a date string from the v2 API response.
 * v2 returns publishedAt/created as { dateTime, timezone } objects.
 */
function extractDate(raw: Record<string, unknown>): string {
  for (const key of [
    "publishedAt",
    "created",
    "createTime",
    "publicationDate",
  ]) {
    const val = raw[key];
    if (typeof val === "string" && val.length > 0) return val;
    if (val && typeof val === "object" && "dateTime" in (val as object)) {
      return (val as { dateTime: string }).dateTime;
    }
  }
  return "";
}

function normalizePost(
  raw: Record<string, unknown>,
  brandId: number,
  brandName: string,
  brandPicture: string,
  platform: Platform
): ContentPost {
  // v2 field names per platform:
  // Instagram posts: likes, comments, shares, reach, impressions, url, imageUrl, content, postId
  // Instagram reels: likes, comments, shares, reach, views, url, imageUrl, content, reelId
  // TikTok: likeCount, commentCount, shareCount, viewCount, shareUrl, coverImageUrl, videoDescription, videoId, embedLink
  // Facebook: reactions, comments, shares, impressions, link, picture, text, postId
  // LinkedIn: likes, comments, shares, impressions, url, picture, description, postId
  // Twitter: likes (via like), comments, shares (via retweets), impressions, url, text, postId

  const likes = extractNumber(
    raw,
    "likes",
    "likeCount",
    "reactions",
    "like"
  );
  const comments = extractNumber(raw, "comments", "commentCount");
  const shares = extractNumber(
    raw,
    "shares",
    "shareCount",
    "retweets",
    "reposts"
  );
  const reach = extractNumber(
    raw,
    "reach",
    "impressions",
    "impressionsTotal",
    "views",
    "viewCount"
  );

  const totalInteractions = likes + comments + shares;
  const engagementRate = reach > 0 ? (totalInteractions / reach) * 100 : 0;

  const caption = extractString(
    raw,
    "content",
    "text",
    "videoDescription",
    "description",
    "title",
    "caption",
    "message"
  );

  const thumbnail =
    extractString(
      raw,
      "imageUrl",
      "coverImageUrl",
      "picture",
      "thumbnail",
      "thumbnailUrl"
    ) || null;

  const mediaUrl = null; // v2 API doesn't provide direct video URLs

  // Permalink to original post
  const permalink =
    extractString(raw, "url", "shareUrl", "link", "permalink") || null;

  const publishedAt = extractDate(raw);

  const typeStr =
    extractString(raw, "type", "mediaType", "postType") || "post";

  const postId =
    extractString(
      raw,
      "postId",
      "reelId",
      "videoId",
      "id",
      "mediaId",
      "shortcode"
    ) || `${brandId}-${platform}-${publishedAt || Math.random()}`;

  const mediaType = detectMediaType(typeStr, platform);

  // TikTok provides embedLink directly from the API
  const tiktokEmbed = extractString(raw, "embedLink") || null;
  const embedUrl =
    tiktokEmbed ||
    (permalink ? buildEmbedUrl(permalink, platform, postId) : null);

  return {
    id: postId,
    brandId,
    brandName,
    brandPicture,
    platform,
    type: typeStr,
    caption,
    thumbnail,
    mediaUrl,
    permalink,
    embedUrl,
    mediaType,
    likes,
    comments,
    shares,
    reach,
    engagementRate,
    score: 0,
    publishedAt,
  };
}

function scorePosts(posts: ContentPost[]): ContentPost[] {
  if (posts.length === 0) return [];
  const maxEngagement = Math.max(...posts.map((p) => p.engagementRate), 1);
  const maxReach = Math.max(...posts.map((p) => p.reach), 1);
  return posts.map((post) => ({
    ...post,
    score:
      (post.engagementRate / maxEngagement) * 60 +
      (post.reach / maxReach) * 40,
  }));
}

export async function GET() {
  try {
    const rawBrands = await fetchBrands();
    const brands = rawBrands
      .filter((b) => !b.deleted && !b.isDemo)
      .map(processBrand);

    const tasks: {
      brandId: number;
      brandName: string;
      brandPicture: string;
      platform: Platform;
    }[] = [];

    for (const brand of brands) {
      for (const platform of brand.platforms) {
        tasks.push({
          brandId: brand.id,
          brandName: brand.name,
          brandPicture: brand.picture,
          platform,
        });
      }
    }

    console.log(
      `[content-perf] Fetching posts for ${brands.length} brands, ${tasks.length} platform connections`
    );

    const BATCH_SIZE = 10;
    const allPosts: ContentPost[] = [];

    for (let i = 0; i < tasks.length; i += BATCH_SIZE) {
      const batch = tasks.slice(i, i + BATCH_SIZE);
      const results = await Promise.allSettled(
        batch.map(async (task) => {
          const rawPosts = await fetchPlatformPosts(
            task.brandId,
            task.platform
          );
          return rawPosts.map((raw) =>
            normalizePost(
              raw,
              task.brandId,
              task.brandName,
              task.brandPicture,
              task.platform
            )
          );
        })
      );
      for (const result of results) {
        if (result.status === "fulfilled") {
          allPosts.push(...result.value);
        }
      }
    }

    const postsWithData = allPosts.filter(
      (p) => p.likes + p.comments + p.shares + p.reach > 0
    );

    const scored = scorePosts(postsWithData);
    scored.sort((a, b) => b.score - a.score);

    // Top 12 best, bottom 12 worst (for grid display on portrait TV)
    const best = scored.slice(0, 12);
    const worst = scored.length > 12 ? scored.slice(-12).reverse() : [];

    console.log(
      `[content-perf] ${allPosts.length} total, ${postsWithData.length} with data → ${best.length} best / ${worst.length} worst`
    );

    return NextResponse.json({
      best,
      worst,
      fetchedAt: new Date().toISOString(),
      postCount: postsWithData.length,
    });
  } catch (error) {
    console.error("[content-perf] Error:", error);
    return NextResponse.json({
      best: [],
      worst: [],
      fetchedAt: new Date().toISOString(),
      postCount: 0,
    });
  }
}
