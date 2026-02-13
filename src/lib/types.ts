import type { Platform } from "./metricool";

export interface BrandStats {
  followers: number;
  reach: number;
  engagement: number;
  contentPublished: number;
  growthPercent: number;
  isEstimated: boolean;
}

export type BrandStatus = "Active" | "Growing" | "Setup";

export function getBrandStatus(platforms: Platform[]): {
  status: BrandStatus;
  border: string;
  glow: string;
  statusClass: "growing" | "stable" | "new";
} {
  if (platforms.length >= 3) {
    return {
      status: "Active",
      border: "border-emerald-500/20",
      glow: "glow-green",
      statusClass: "growing",
    };
  }
  if (platforms.length >= 1) {
    return {
      status: "Growing",
      border: "border-amber-500/20",
      glow: "glow-yellow",
      statusClass: "stable",
    };
  }
  return {
    status: "Setup",
    border: "border-red-500/20",
    glow: "glow-red",
    statusClass: "new",
  };
}
