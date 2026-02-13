"use client";

import { useState, useEffect, useRef } from "react";
import type { ContentPerformanceData } from "@/lib/content-types";

const EMPTY: ContentPerformanceData = {
  best: [],
  worst: [],
  fetchedAt: "",
  postCount: 0,
};

let cached: ContentPerformanceData | null = null;
let cachedDate: string | null = null; // YYYY-MM-DD of when cache was set

function getTodayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export function useContentPerformance(): {
  data: ContentPerformanceData;
  loading: boolean;
} {
  const today = getTodayStr();
  const isCacheValid = cached && cachedDate === today;

  const [data, setData] = useState<ContentPerformanceData>(
    isCacheValid ? cached! : EMPTY
  );
  const [loading, setLoading] = useState(!isCacheValid);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    // If cache is from today, use it
    if (cached && cachedDate === getTodayStr()) {
      setData(cached);
      setLoading(false);
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);

    fetch("/api/content/performance", { signal: controller.signal })
      .then((res) => res.json())
      .then((result: ContentPerformanceData) => {
        if (controller.signal.aborted) return;
        cached = result;
        cachedDate = getTodayStr();
        setData(result);
        setLoading(false);
      })
      .catch((err) => {
        if (err.name === "AbortError") return;
        setLoading(false);
      });

    return () => controller.abort();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Midnight refresh: check every minute if the date has changed
  useEffect(() => {
    const interval = setInterval(() => {
      const now = getTodayStr();
      if (cachedDate && cachedDate !== now) {
        // Date changed — invalidate cache and refetch
        cached = null;
        cachedDate = null;
        setLoading(true);

        fetch("/api/content/performance")
          .then((res) => res.json())
          .then((result: ContentPerformanceData) => {
            cached = result;
            cachedDate = getTodayStr();
            setData(result);
            setLoading(false);
          })
          .catch(() => setLoading(false));
      }
    }, 60_000); // Check every minute

    return () => clearInterval(interval);
  }, []);

  return { data, loading };
}
