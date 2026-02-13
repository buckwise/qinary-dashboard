"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import StatsBar from "@/components/StatsBar";
import ClientCard from "@/components/ClientCard";
import HolisticCharts from "@/components/HolisticCharts";
import SpotlightCard from "@/components/SpotlightCard";
import QinaryLogo from "@/components/QinaryLogo";
import DetailPanel from "@/components/DetailPanel";
import SearchFilterBar from "@/components/SearchFilterBar";
import EmptyFilterState from "@/components/EmptyFilterState";
import ContentGrid from "@/components/ContentGrid";
import { useFilteredBrands } from "@/hooks/useFilteredBrands";
import { useContentPerformance } from "@/hooks/useContentPerformance";
import type { ProcessedBrand, Platform } from "@/lib/metricool";
import type { BrandStatus } from "@/lib/types";

const CARDS_PER_PAGE = 8;
const SPOTLIGHT_DWELL = 6000; // 6s per spotlight card
const GRID_DWELL = 8000; // 8s per grid page
const CONTENT_DWELL = 8000; // 8s per content screen

/**
 * Display cycle:
 *   top-0 → top-1 → top-2 → best-content → grid pages… → worst-content → bottom-0 → bottom-1 → bottom-2 → repeat
 */
type CyclePhase =
  | { type: "top"; index: number }
  | { type: "best-content" }
  | { type: "grid"; page: number }
  | { type: "worst-content" }
  | { type: "bottom"; index: number };

export default function DashboardPage() {
  const [brands, setBrands] = useState<ProcessedBrand[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [manualTab, setManualTab] = useState<"dashboard" | "overview">(
    "dashboard"
  );

  // Cycle state
  const [phase, setPhase] = useState<CyclePhase>({ type: "top", index: 0 });

  // Detail panel state
  const [selectedBrand, setSelectedBrand] = useState<ProcessedBrand | null>(
    null
  );

  // Search & filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState<Platform[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<BrandStatus[]>([]);
  const [searchFocused, setSearchFocused] = useState(false);

  // Filter hook
  const { filtered, hasActiveFilters } = useFilteredBrands(brands, {
    searchQuery,
    selectedPlatforms,
    selectedStatuses,
  });

  // Content performance data
  const { data: contentData, loading: contentLoading } =
    useContentPerformance();

  // Display brands: filtered when filters active, full list otherwise
  const displayBrands = hasActiveFilters ? filtered : brands;

  const clearAllFilters = useCallback(() => {
    setSearchQuery("");
    setSelectedPlatforms([]);
    setSelectedStatuses([]);
  }, []);

  // Fetch brands
  const fetchBrands = useCallback(async () => {
    try {
      const res = await fetch("/api/brands");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setBrands(data);
      setLastUpdate(new Date());
      setError(null);
    } catch (err) {
      setError("Unable to load client data");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBrands();
    const interval = setInterval(fetchBrands, 15 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchBrands]);

  // Ranking: top performers = most platforms + oldest; bottom = fewest/newest
  // Always uses unfiltered brands
  const { topPerformers, bottomPerformers } = useMemo(() => {
    if (brands.length === 0)
      return { topPerformers: [], bottomPerformers: [] };

    const scored = brands.map((b) => ({
      brand: b,
      score:
        b.platforms.length * 1000 +
        b.daysSinceJoin +
        (b.id % 5000) * 0.1,
    }));
    scored.sort((a, b) => b.score - a.score);

    return {
      topPerformers: scored.slice(0, 3).map((s) => s.brand),
      bottomPerformers: scored
        .slice(-3)
        .reverse()
        .map((s) => s.brand),
    };
  }, [brands]);

  // Grid pagination based on displayBrands
  const totalGridPages = Math.max(
    1,
    Math.ceil(displayBrands.length / CARDS_PER_PAGE)
  );

  // Clamp grid page when filters reduce page count
  useEffect(() => {
    if (phase.type === "grid" && phase.page >= totalGridPages) {
      setPhase({ type: "grid", page: Math.max(0, totalGridPages - 1) });
    }
  }, [totalGridPages, phase]);

  // Auto-scroll pauses when detail panel open, filters active, or search focused
  const effectiveAutoScroll =
    autoScroll &&
    selectedBrand === null &&
    !hasActiveFilters &&
    !searchFocused;

  // Auto-cycle logic
  useEffect(() => {
    if (
      !effectiveAutoScroll ||
      manualTab === "overview" ||
      brands.length === 0
    )
      return;

    const dwell =
      phase.type === "grid"
        ? GRID_DWELL
        : phase.type === "best-content" || phase.type === "worst-content"
        ? CONTENT_DWELL
        : SPOTLIGHT_DWELL;

    const timer = setTimeout(() => {
      setPhase((prev) => {
        if (prev.type === "top") {
          if (prev.index < 2) return { type: "top", index: prev.index + 1 };
          return { type: "best-content" };
        }
        if (prev.type === "best-content") {
          return { type: "grid", page: 0 };
        }
        if (prev.type === "grid") {
          if (prev.page < totalGridPages - 1)
            return { type: "grid", page: prev.page + 1 };
          return { type: "worst-content" };
        }
        if (prev.type === "worst-content") {
          return { type: "bottom", index: 0 };
        }
        if (prev.type === "bottom") {
          if (prev.index < 2)
            return { type: "bottom", index: prev.index + 1 };
          return { type: "top", index: 0 };
        }
        return { type: "top", index: 0 };
      });
    }, dwell);

    return () => clearTimeout(timer);
  }, [effectiveAutoScroll, phase, totalGridPages, brands.length, manualTab]);

  // Computed stats
  const stats = useMemo(() => {
    const totalPlatforms = brands.reduce(
      (sum, b) => sum + b.platforms.length,
      0
    );
    const activeThisWeek = brands.filter(
      (b) => b.platforms.length > 0
    ).length;
    return { totalPlatforms, activeThisWeek };
  }, [brands]);

  // Visible brands for grid phase
  const visibleBrands =
    phase.type === "grid"
      ? displayBrands.slice(
          phase.page * CARDS_PER_PAGE,
          (phase.page + 1) * CARDS_PER_PAGE
        )
      : [];

  // Fullscreen toggle
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  }, []);

  useEffect(() => {
    const handleFs = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handleFs);
    return () => document.removeEventListener("fullscreenchange", handleFs);
  }, []);

  // Keyboard shortcuts — guarded when detail panel open or input focused
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      // Skip shortcuts when detail panel is open or search input focused
      if (selectedBrand !== null || searchFocused) return;

      if (e.key === "f") toggleFullscreen();
      if (e.key === " ") {
        e.preventDefault();
        setAutoScroll((prev) => !prev);
      }
      if (e.key === "ArrowRight") {
        setPhase((prev) => {
          if (prev.type === "top" && prev.index < 2)
            return { type: "top", index: prev.index + 1 };
          if (prev.type === "top") return { type: "best-content" };
          if (prev.type === "best-content") return { type: "grid", page: 0 };
          if (prev.type === "grid" && prev.page < totalGridPages - 1)
            return { type: "grid", page: prev.page + 1 };
          if (prev.type === "grid") return { type: "worst-content" };
          if (prev.type === "worst-content")
            return { type: "bottom", index: 0 };
          if (prev.type === "bottom" && prev.index < 2)
            return { type: "bottom", index: prev.index + 1 };
          return { type: "top", index: 0 };
        });
      }
      if (e.key === "ArrowLeft") {
        setPhase((prev) => {
          if (prev.type === "bottom" && prev.index > 0)
            return { type: "bottom", index: prev.index - 1 };
          if (prev.type === "bottom") return { type: "worst-content" };
          if (prev.type === "worst-content")
            return { type: "grid", page: totalGridPages - 1 };
          if (prev.type === "grid" && prev.page > 0)
            return { type: "grid", page: prev.page - 1 };
          if (prev.type === "grid") return { type: "best-content" };
          if (prev.type === "best-content")
            return { type: "top", index: 2 };
          if (prev.type === "top" && prev.index > 0)
            return { type: "top", index: prev.index - 1 };
          return { type: "bottom", index: 2 };
        });
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [toggleFullscreen, totalGridPages, selectedBrand, searchFocused]);

  // Section label
  const sectionLabel = (() => {
    if (manualTab === "overview") return "Overview";
    if (phase.type === "top") return `Top Performer #${phase.index + 1}`;
    if (phase.type === "best-content") return "Top Content";
    if (phase.type === "worst-content") return "Lowest Content";
    if (phase.type === "bottom")
      return `Needs Support #${phase.index + 1}`;
    return `Clients — Page ${phase.page + 1} of ${totalGridPages}`;
  })();

  // Cycle progress: top(3) + best-content(1) + grid(N) + worst-content(1) + bottom(3)
  const totalSteps = 3 + 1 + totalGridPages + 1 + 3;
  const currentStep = (() => {
    if (phase.type === "top") return phase.index;
    if (phase.type === "best-content") return 3;
    if (phase.type === "grid") return 4 + phase.page;
    if (phase.type === "worst-content") return 4 + totalGridPages;
    if (phase.type === "bottom")
      return 4 + totalGridPages + 1 + phase.index;
    return 0;
  })();

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <motion.div
            className="w-8 h-8 border-2 border-white/10 border-t-white/40 rounded-full mx-auto mb-4"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
          <p className="text-white/20 text-xs uppercase tracking-widest">
            Loading analytics
          </p>
        </motion.div>
      </div>
    );
  }

  if (error && brands.length === 0) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400/60 text-sm mb-4">{error}</p>
          <button
            onClick={fetchBrands}
            className="px-4 py-2 rounded-lg bg-white/5 text-white/50 text-xs hover:bg-white/10 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* ─── Header ─── */}
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-50 bg-black/90 backdrop-blur-xl border-b border-white/[0.03]"
      >
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-5">
            <QinaryLogo size="sm" />

            {/* Tabs */}
            <div className="flex items-center gap-1 bg-white/[0.03] rounded-lg p-0.5">
              <button
                onClick={() => setManualTab("dashboard")}
                className={`px-3 py-1 rounded-md text-[11px] font-medium transition-all duration-200 ${
                  manualTab === "dashboard"
                    ? "bg-white/[0.08] text-white/80"
                    : "text-white/25 hover:text-white/40"
                }`}
              >
                Dashboard
              </button>
              <button
                onClick={() => setManualTab("overview")}
                className={`px-3 py-1 rounded-md text-[11px] font-medium transition-all duration-200 ${
                  manualTab === "overview"
                    ? "bg-white/[0.08] text-white/80"
                    : "text-white/25 hover:text-white/40"
                }`}
              >
                Overview
              </button>
            </div>

            {/* Section label */}
            {manualTab !== "overview" && (
              <span className="text-[10px] text-white/20 hidden md:block">
                {sectionLabel}
              </span>
            )}
          </div>

          <div className="flex items-center gap-4">
            {/* Live / Paused */}
            <button
              onClick={() => setAutoScroll(!autoScroll)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium
                          uppercase tracking-wider transition-all duration-300 ${
                            effectiveAutoScroll
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : "bg-white/[0.03] text-white/30 border border-white/[0.06] hover:text-white/50"
                          }`}
            >
              {effectiveAutoScroll && (
                <span
                  className="live-dot"
                  style={{ width: 4, height: 4 }}
                />
              )}
              {effectiveAutoScroll ? "Live" : "Paused"}
            </button>

            <span className="text-[10px] text-white/15 hidden sm:block">
              {lastUpdate.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>

            {/* Fullscreen */}
            <button
              onClick={toggleFullscreen}
              className="p-1.5 rounded-lg hover:bg-white/[0.04] transition-colors group"
              title="Toggle fullscreen (F)"
            >
              <svg
                viewBox="0 0 20 20"
                className="w-4 h-4 text-white/20 group-hover:text-white/40 transition-colors"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                {isFullscreen ? (
                  <path d="M4 14h2v2M14 4h2v2M4 6h2V4M14 16h2v-2" />
                ) : (
                  <path d="M3 7V3h4M13 3h4v4M17 13v4h-4M7 17H3v-4" />
                )}
              </svg>
            </button>

            <button
              onClick={async () => {
                await fetch("/api/auth", { method: "DELETE" });
                window.location.href = "/login";
              }}
              className="text-[10px] text-white/15 hover:text-white/30 transition-colors uppercase tracking-wider hidden sm:block"
            >
              Sign out
            </button>
          </div>
        </div>

        {/* Progress bar */}
        {manualTab !== "overview" && effectiveAutoScroll && (
          <div className="h-[2px] bg-white/[0.02] relative overflow-hidden">
            <motion.div
              className="absolute left-0 top-0 h-full"
              style={{
                background:
                  phase.type === "top" || phase.type === "best-content"
                    ? "linear-gradient(90deg, #00ff88, #00cc66)"
                    : phase.type === "bottom" || phase.type === "worst-content"
                    ? "linear-gradient(90deg, #ff4444, #cc3333)"
                    : "linear-gradient(90deg, rgba(255,255,255,0.3), rgba(255,255,255,0.15))",
              }}
              initial={false}
              animate={{
                width: `${((currentStep + 1) / totalSteps) * 100}%`,
              }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
            />
          </div>
        )}
      </motion.header>

      {/* ─── Stats bar ─── */}
      <StatsBar
        totalClients={brands.length}
        totalPlatforms={stats.totalPlatforms}
        activeThisWeek={stats.activeThisWeek}
      />

      {/* ─── Main content ─── */}
      <main className="flex-1 max-w-7xl mx-auto px-4 py-6 w-full">
        <AnimatePresence mode="wait">
          {manualTab === "overview" ? (
            /* ─── Overview tab ─── */
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
            >
              <HolisticCharts brands={brands} />
            </motion.div>
          ) : phase.type === "top" ? (
            /* ─── Top Performer spotlight ─── */
            <motion.div
              key={`top-${phase.index}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              {topPerformers[phase.index] && (
                <SpotlightCard
                  brand={topPerformers[phase.index]}
                  rank={phase.index}
                  mode="celebrate"
                />
              )}
            </motion.div>
          ) : phase.type === "best-content" ? (
            /* ─── Best performing content ─── */
            <motion.div
              key="best-content"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <ContentGrid
                posts={contentData.best}
                mode="best"
                loading={contentLoading}
                totalPostCount={contentData.postCount}
              />
            </motion.div>
          ) : phase.type === "worst-content" ? (
            /* ─── Lowest performing content ─── */
            <motion.div
              key="worst-content"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <ContentGrid
                posts={contentData.worst}
                mode="worst"
                loading={contentLoading}
                totalPostCount={contentData.postCount}
              />
            </motion.div>
          ) : phase.type === "bottom" ? (
            /* ─── Needs Support spotlight ─── */
            <motion.div
              key={`bottom-${phase.index}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              {bottomPerformers[phase.index] && (
                <SpotlightCard
                  brand={bottomPerformers[phase.index]}
                  rank={phase.index}
                  mode="support"
                />
              )}
            </motion.div>
          ) : (
            /* ─── Client grid ─── */
            <motion.div
              key={`grid-${phase.page}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            >
              {/* Search & filter bar */}
              <SearchFilterBar
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                selectedPlatforms={selectedPlatforms}
                onPlatformsChange={setSelectedPlatforms}
                selectedStatuses={selectedStatuses}
                onStatusesChange={setSelectedStatuses}
                totalCount={brands.length}
                filteredCount={filtered.length}
                hasActiveFilters={hasActiveFilters}
                onClearAll={clearAllFilters}
                onFocusChange={setSearchFocused}
              />

              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xs font-semibold text-white/40 uppercase tracking-wider">
                    {hasActiveFilters ? "Filtered Clients" : "All Clients"}
                  </h2>
                  <p className="text-[10px] text-white/15 mt-0.5">
                    {displayBrands.length} brands &middot; Page{" "}
                    {phase.page + 1} of {totalGridPages}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalGridPages }).map((_, i) => (
                    <button
                      key={i}
                      onClick={() =>
                        setPhase({ type: "grid", page: i })
                      }
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        i === phase.page
                          ? "bg-white/50 w-4"
                          : "bg-white/10 w-1.5 hover:bg-white/20"
                      }`}
                    />
                  ))}
                </div>
              </div>

              {visibleBrands.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {visibleBrands.map((brand, i) => (
                    <ClientCard
                      key={brand.id}
                      brand={brand}
                      index={i}
                      onClick={() => setSelectedBrand(brand)}
                    />
                  ))}
                </div>
              ) : hasActiveFilters ? (
                <EmptyFilterState onClearAll={clearAllFilters} />
              ) : null}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* ─── Detail Panel (outside phase AnimatePresence) ─── */}
      <DetailPanel
        brand={selectedBrand}
        onClose={() => setSelectedBrand(null)}
      />

      {/* ─── Watermark ─── */}
      <div className="fixed bottom-3 right-4 z-30 opacity-15">
        <QinaryLogo size="sm" />
      </div>
    </div>
  );
}
