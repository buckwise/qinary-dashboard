const BASE_URL = "https://app.metricool.com/api";
const USER_ID = "4156115";
const MASTER_BLOG_ID = "5351634";

function getToken(): string {
  const token = process.env.METRICOOL_TOKEN;
  if (!token) throw new Error("METRICOOL_TOKEN not configured");
  return token;
}

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10).replace(/-/g, "");
}

async function metricoolFetch<T>(
  path: string,
  params: Record<string, string> = {}
): Promise<T> {
  const url = new URL(`${BASE_URL}${path}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

  const res = await fetch(url.toString(), {
    headers: { "X-Mc-Auth": getToken() },
    next: { revalidate: 900 }, // Cache for 15 minutes
  });

  if (!res.ok) {
    const text = await res.text();
    console.error(`Metricool API error: ${res.status} ${path}`, text.slice(0, 200));
    throw new Error(`Metricool API error: ${res.status}`);
  }

  return res.json();
}

export interface Brand {
  id: number;
  userId: number;
  label: string;
  picture: string | null;
  instagram: string | null;
  instagramPicture: string | null;
  facebook: string | null;
  facebookPageId: string | null;
  facebookPicture: string | null;
  twitter: string | null;
  twitterPicture: string | null;
  tiktok: string | null;
  tiktokPicture: string | null;
  linkedinCompany: string | null;
  linkedInCompanyPicture: string | null;
  linkedInCompanyName: string | null;
  youtubeChannelName: string | null;
  youtubeChannelPicture: string | null;
  threads: string | null;
  threadsAccountName: string | null;
  threadsPicture: string | null;
  bluesky: string | null;
  blueskyHandle: string | null;
  blueskyPicture: string | null;
  pinterest: string | null;
  pinterestBusiness: string | null;
  pinterestPicture: string | null;
  joinDate: number;
  firstConnectionDate: number;
  timezone: string;
  isDemo: boolean;
  deleted: boolean;
}

export type Platform =
  | "instagram"
  | "facebook"
  | "twitter"
  | "tiktok"
  | "linkedin"
  | "youtube"
  | "threads"
  | "bluesky"
  | "pinterest";

export interface ProcessedBrand {
  id: number;
  name: string;
  picture: string;
  platforms: Platform[];
  joinDate: Date;
  daysSinceJoin: number;
}

export function processBrand(brand: Brand): ProcessedBrand {
  const platforms: Platform[] = [];
  if (brand.instagram) platforms.push("instagram");
  if (brand.facebook || brand.facebookPageId) platforms.push("facebook");
  if (brand.twitter) platforms.push("twitter");
  if (brand.tiktok) platforms.push("tiktok");
  if (brand.linkedinCompany) platforms.push("linkedin");
  if (brand.youtubeChannelName) platforms.push("youtube");
  if (brand.threads || brand.threadsAccountName) platforms.push("threads");
  if (brand.bluesky || brand.blueskyHandle) platforms.push("bluesky");
  if (brand.pinterest || brand.pinterestBusiness) platforms.push("pinterest");

  const joinDate = new Date(brand.joinDate);
  const now = new Date();
  const daysSinceJoin = Math.floor(
    (now.getTime() - joinDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  return {
    id: brand.id,
    name: brand.label,
    picture: brand.picture || "/default-avatar.svg",
    platforms,
    joinDate,
    daysSinceJoin,
  };
}

export async function fetchBrands(): Promise<Brand[]> {
  return metricoolFetch<Brand[]>("/admin/profiles", {
    blogId: MASTER_BLOG_ID,
    userId: USER_ID,
  });
}

export async function fetchAllBrandsProcessed(): Promise<ProcessedBrand[]> {
  const brands = await fetchBrands();
  return brands
    .filter((b) => !b.deleted && !b.isDemo)
    .map(processBrand)
    .sort((a, b) => a.name.localeCompare(b.name));
}

// Stats fetching - these will be activated once we confirm the correct API endpoints
export async function fetchBrandStats(
  blogId: number,
  initDate?: string,
  endDate?: string
) {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const params: Record<string, string> = {
    blogId: blogId.toString(),
    userId: USER_ID,
    initDate: initDate || formatDate(thirtyDaysAgo),
    endDate: endDate || formatDate(now),
  };

  try {
    const data = await metricoolFetch<Record<string, unknown>>(
      "/stats/aggregations/instagram",
      params
    );
    return data;
  } catch {
    return null;
  }
}

export async function fetchInstagramPosts(blogId: number) {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  try {
    const data = await metricoolFetch<unknown[]>(
      "/stats/instagram/posts",
      {
        blogId: blogId.toString(),
        userId: USER_ID,
        initDate: formatDate(thirtyDaysAgo),
        endDate: formatDate(now),
      }
    );
    return data;
  } catch {
    return [];
  }
}

// v2 analytics API paths (these actually work, unlike the /stats/* paths)
const V2_POST_PATHS: Partial<Record<Platform, string[]>> = {
  instagram: ["/v2/analytics/posts/instagram", "/v2/analytics/reels/instagram"],
  facebook: ["/v2/analytics/posts/facebook", "/v2/analytics/reels/facebook"],
  twitter: ["/v2/analytics/posts/twitter"],
  tiktok: ["/v2/analytics/posts/tiktok"],
  linkedin: ["/v2/analytics/posts/linkedin"],
  threads: ["/v2/analytics/posts/threads"],
  pinterest: ["/v2/analytics/posts/pinterest"],
  bluesky: ["/v2/analytics/posts/bluesky"],
};

/** Format as yyyy-MM-dd'T'HH:mm:ss (no millis, no Z) — required by v2 API */
function formatV2Date(date: Date): string {
  return date.toISOString().replace(/\.\d{3}Z$/, "");
}

export async function fetchPlatformPosts(
  blogId: number,
  platform: Platform
): Promise<Record<string, unknown>[]> {
  const paths = V2_POST_PATHS[platform];
  if (!paths) return [];

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const allPosts: Record<string, unknown>[] = [];

  for (const path of paths) {
    try {
      const data = await metricoolFetch<{ data?: unknown[] }>(path, {
        blogId: blogId.toString(),
        userId: USER_ID,
        from: formatV2Date(thirtyDaysAgo),
        to: formatV2Date(now),
      });

      const posts = Array.isArray(data?.data) ? data.data : [];
      if (posts.length > 0) {
        console.log(
          `[content] ${path} brand=${blogId}: ${posts.length} posts`
        );
      }
      allPosts.push(...(posts as Record<string, unknown>[]));
    } catch {
      // Silently continue — some platforms may not have data
    }
  }

  return allPosts;
}
