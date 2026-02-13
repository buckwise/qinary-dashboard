"use client";

import { useState, useEffect, useRef } from "react";
import type { ProcessedBrand } from "@/lib/metricool";
import type { BrandStats } from "@/lib/types";
import { getEstimatedStats } from "@/lib/estimations";

interface CacheEntry {
  stats: BrandStats;
  fetchedAt: number;
}

const CACHE_TTL = 15 * 60 * 1000; // 15 minutes
const cache = new Map<number, CacheEntry>();

function getCached(brandId: number): BrandStats | null {
  const entry = cache.get(brandId);
  if (!entry) return null;
  if (Date.now() - entry.fetchedAt > CACHE_TTL) {
    cache.delete(brandId);
    return null;
  }
  return entry.stats;
}

export function useStats(brand: ProcessedBrand): {
  stats: BrandStats;
  loading: boolean;
} {
  const estimated = getEstimatedStats(brand);
  const cached = getCached(brand.id);
  const [stats, setStats] = useState<BrandStats>(cached || estimated);
  const [loading, setLoading] = useState(!cached);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const cached = getCached(brand.id);
    if (cached) {
      setStats(cached);
      setLoading(false);
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);

    fetch(`/api/brands/${brand.id}/stats`, { signal: controller.signal })
      .then((res) => res.json())
      .then((data) => {
        if (controller.signal.aborted) return;

        if (data.raw) {
          // Attempt to normalize real Metricool data
          const raw = data.raw as Record<string, unknown>;
          const realStats: BrandStats = {
            followers:
              typeof raw.followers === "number"
                ? raw.followers
                : estimated.followers,
            reach:
              typeof raw.reach === "number" ? raw.reach : estimated.reach,
            engagement:
              typeof raw.engagementRate === "number"
                ? raw.engagementRate
                : estimated.engagement,
            contentPublished:
              typeof data.posts === "number" && data.posts > 0
                ? data.posts
                : estimated.contentPublished,
            growthPercent: estimated.growthPercent,
            isEstimated: false,
          };
          cache.set(brand.id, {
            stats: realStats,
            fetchedAt: Date.now(),
          });
          setStats(realStats);
        } else {
          // No real data available — cache the estimate to avoid refetching
          cache.set(brand.id, {
            stats: estimated,
            fetchedAt: Date.now(),
          });
          setStats(estimated);
        }
        setLoading(false);
      })
      .catch((err) => {
        if (err.name === "AbortError") return;
        setStats(estimated);
        setLoading(false);
      });

    return () => controller.abort();
  }, [brand.id]); // eslint-disable-line react-hooks/exhaustive-deps

  return { stats, loading };
}
