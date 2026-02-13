import { NextResponse } from "next/server";
import { fetchBrandStats, fetchInstagramPosts } from "@/lib/metricool";

export const revalidate = 900; // 15 minutes

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const brandId = parseInt(id, 10);

  if (isNaN(brandId)) {
    return NextResponse.json({ error: "Invalid brand ID" }, { status: 400 });
  }

  try {
    const [statsResult, postsResult] = await Promise.allSettled([
      fetchBrandStats(brandId),
      fetchInstagramPosts(brandId),
    ]);

    const stats =
      statsResult.status === "fulfilled" ? statsResult.value : null;
    const posts =
      postsResult.status === "fulfilled" ? postsResult.value : [];

    if (stats) {
      console.log(
        `[brand-stats] Brand ${brandId} keys:`,
        Object.keys(stats)
      );
    }

    return NextResponse.json({
      raw: stats,
      posts: Array.isArray(posts) ? posts.length : 0,
      fetchedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error(`[brand-stats] Brand ${brandId} error:`, error);
    // Return 200 even on failure so the hook can fall back to estimates
    return NextResponse.json({
      raw: null,
      posts: 0,
      fetchedAt: new Date().toISOString(),
    });
  }
}
