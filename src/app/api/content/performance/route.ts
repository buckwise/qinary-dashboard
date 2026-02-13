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

function normalizePost(
  raw: Record<string, unknown>,
  brandId: number,
  brandName: string,
  brandPicture: string,
  platform: Platform
): ContentPost {
  const likes = extractNumber(raw, "likes", "likeCount", "reactions", "favoriteCount");
  const comments = extractNumber(raw, "comments", "commentCount", "replies", "replyCount");
  const shares = extractNumber(raw, "shares", "shareCount", "retweets", "retweetCount", "reposts");
  const reach = extractNumber(raw, "reach", "impressions", "views", "viewCount", "plays", "playCount");

  const totalInteractions = likes + comments + shares;
  const engagementRate = reach > 0 ? (totalInteractions / reach) * 100 : 0;

  const caption = extractString(raw, "caption", "text", "message", "description", "title", "content");

  const thumbnail =
    extractString(raw, "thumbnail", "thumbnailUrl", "imageUrl", "image", "pictureUrl", "coverImage", "coverImageUrl") ||
    null;

  // Direct media URL (video or full-res image)
  const mediaUrl =
    extractString(raw, "mediaUrl", "videoUrl", "video_url", "media_url", "sourceUrl") || null;

  // Permalink to original post
  const permalink =
    extractString(raw, "permalink", "url", "postUrl", "link", "shortLink") || null;

  const publishedAt = extractString(
    raw, "publishDate", "publishedAt", "date", "timestamp", "createdAt", "created", "postedAt"
  );

  const typeStr =
    extractString(raw, "type", "mediaType", "postType", "contentType") || "post";

  const postId =
    extractString(raw, "id", "postId", "mediaId", "videoId", "shortcode") ||
    `${brandId}-${platform}-${publishedAt || Math.random()}`;

  const mediaType = detectMediaType(typeStr, platform);
  const embedUrl = permalink ? buildEmbedUrl(permalink, platform, postId) : null;

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
          const rawPosts = await fetchPlatformPosts(task.brandId, task.platform);
          return rawPosts.map((raw) =>
            normalizePost(raw, task.brandId, task.brandName, task.brandPicture, task.platform)
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

    // Top 3 best, bottom 3 worst (for spotlight cycling)
    const best = scored.slice(0, 3);
    const worst = scored.length > 3 ? scored.slice(-3).reverse() : [];

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
