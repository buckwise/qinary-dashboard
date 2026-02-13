import type { ProcessedBrand } from "./metricool";
import type { BrandStats } from "./types";

export function getEstFollowers(brand: ProcessedBrand): number {
  return Math.floor(
    brand.platforms.length * 1200 +
      (brand.id % 5000) +
      brand.daysSinceJoin * 3.5
  );
}

export function getEstReach(brand: ProcessedBrand): number {
  return Math.floor(
    getEstFollowers(brand) * 1.8 + brand.platforms.length * 800
  );
}

export function getEstEngagement(brand: ProcessedBrand): number {
  const base = 2.5 + brand.platforms.length * 0.6;
  const variance = ((brand.id % 30) - 15) * 0.1;
  return Math.max(0.8, Math.min(8.5, base + variance));
}

export function getEstContentPieces(brand: ProcessedBrand): number {
  return Math.floor(
    brand.daysSinceJoin * 0.35 * Math.max(1, brand.platforms.length * 0.6)
  );
}

export function getGrowthPercent(brand: ProcessedBrand): number {
  if (brand.platforms.length >= 4) return 12 + (brand.id % 18);
  if (brand.platforms.length >= 3) return 6 + (brand.id % 12);
  if (brand.platforms.length >= 1) return 1 + (brand.id % 5);
  return -(brand.id % 4);
}

export function getEstimatedStats(brand: ProcessedBrand): BrandStats {
  return {
    followers: getEstFollowers(brand),
    reach: getEstReach(brand),
    engagement: getEstEngagement(brand),
    contentPublished: getEstContentPieces(brand),
    growthPercent: getGrowthPercent(brand),
    isEstimated: true,
  };
}
