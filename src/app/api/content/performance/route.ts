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
  type ContentPost,
} from "@/lib/content-types";

export const dynamic = "force-dynamic"; // always fetch fresh — client hook handles daily caching
export const revalidate = 0;

// Normalize a raw Metricool post object into our ContentPost shape
function normalizePost(
  raw: Record<string, unknown>,
  brandId: number,
  brandName: string,
  brandPicture: string,
  platform: Platform
): ContentPost {
  const likes = extractNumber(
    raw,
    "likes",
    "likeCount",
    "reactions",
    "favoriteCount"
  );
  const comments = extractNumber(
    raw,
    "comments",
    "commentCount",
    "replies",
    "replyCount"
  );
  const shares = extractNumber(
    raw,
    "shares",
    "shareCount",
    "retweets",
    "retweetCount",
    "reposts"
  );
  const reach = extractNumber(
    raw,
    "reach",
    "impressions",
    "views",
    "viewCount",
    "plays"
  );

  const totalInteractions = likes + comments + shares;
  const engagementRate =
    reach > 0 ? (totalInteractions / reach) * 100 : 0;

  const caption = extractString(
    raw,
    "caption",
    "text",
    "message",
    "description",
    "title",
    "content"
  );

  const thumbnail = extractString(
    raw,
    "thumbnail",
    "thumbnailUrl",
    "imageUrl",
    "mediaUrl",
    "image",
    "pictureUrl",
    "coverImage"
  ) || null;

  const publishedAt = extractString(
    raw,
    "publishDate",
    "publishedAt",
    "date",
    "timestamp",
    "createdAt",
    "created",
    "postedAt"
  );

  const type = extractString(
    raw,
    "type",
    "mediaType",
    "postType",
    "contentType"
  ) || "post";

  const postId = extractString(raw, "id", "postId", "mediaId") ||
    `${brandId}-${platform}-${publishedAt || Math.random()}`;

  return {
    id: postId,
    brandId,
    brandName,
    brandPicture,
    platform,
    type,
    caption,
    thumbnail,
    likes,
    comments,
    shares,
    reach,
    engagementRate,
    score: 0, // computed after normalization
    publishedAt,
  };
}

// Compute combined score: 60% engagement rate + 40% reach (both normalized 0-100)
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

    // Build fetch tasks: one per (brand, platform) pair
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

    // Fetch in parallel with concurrency batching (10 at a time)
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

    // Filter out posts with zero interactions (likely no data)
    const postsWithData = allPosts.filter(
      (p) => p.likes + p.comments + p.shares + p.reach > 0
    );

    // Score and rank
    const scored = scorePosts(postsWithData);
    scored.sort((a, b) => b.score - a.score);

    const best = scored.slice(0, 6);
    const worst = scored.length > 6
      ? scored.slice(-6).reverse()
      : [];

    console.log(
      `[content-perf] ${allPosts.length} total posts, ${postsWithData.length} with data, returning ${best.length} best / ${worst.length} worst`
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
