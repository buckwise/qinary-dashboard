"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import StatsBar from "@/components/StatsBar";
import ClientCard from "@/components/ClientCard";
import HolisticCharts from "@/components/HolisticCharts";
import AutoScroller from "@/components/AutoScroller";
import QinaryLogo from "@/components/QinaryLogo";
import type { ProcessedBrand } from "@/lib/metricool";

const CARDS_PER_PAGE = 8;

export default function DashboardPage() {
  const [brands, setBrands] = useState<ProcessedBrand[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [autoScroll, setAutoScroll] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeTab, setActiveTab] = useState<"clients" | "overview">("clients");
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

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
    // Refresh every 15 minutes
    const interval = setInterval(fetchBrands, 15 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchBrands]);

  // Computed stats
  const stats = useMemo(() => {
    const totalPlatforms = brands.reduce(
      (sum, b) => sum + b.platforms.length,
      0
    );
    const activeThisWeek = brands.filter((b) => b.platforms.length > 0).length;
    return { totalPlatforms, activeThisWeek };
  }, [brands]);

  // Pagination
  const totalPages = Math.ceil(brands.length / CARDS_PER_PAGE);
  const visibleBrands = brands.slice(
    currentPage * CARDS_PER_PAGE,
    (currentPage + 1) * CARDS_PER_PAGE
  );

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

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

  // Keyboard shortcuts
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "f") toggleFullscreen();
      if (e.key === " ") {
        e.preventDefault();
        setAutoScroll((prev) => !prev);
      }
      if (e.key === "ArrowRight")
        setCurrentPage((p) => (p + 1) % totalPages);
      if (e.key === "ArrowLeft")
        setCurrentPage((p) => (p - 1 + totalPages) % totalPages);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [toggleFullscreen, totalPages]);

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
            className="px-4 py-2 rounded-lg bg-white/5 text-white/50 text-xs
                       hover:bg-white/10 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-50 bg-black/90 backdrop-blur-xl border-b border-white/[0.03]"
      >
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <QinaryLogo size="sm" />
            {/* Tab switcher */}
            <div className="flex items-center gap-1 bg-white/[0.03] rounded-lg p-0.5">
              <button
                onClick={() => setActiveTab("clients")}
                className={`px-3 py-1 rounded-md text-[11px] font-medium transition-all duration-200 ${
                  activeTab === "clients"
                    ? "bg-white/[0.08] text-white/80"
                    : "text-white/25 hover:text-white/40"
                }`}
              >
                Clients
              </button>
              <button
                onClick={() => setActiveTab("overview")}
                className={`px-3 py-1 rounded-md text-[11px] font-medium transition-all duration-200 ${
                  activeTab === "overview"
                    ? "bg-white/[0.08] text-white/80"
                    : "text-white/25 hover:text-white/40"
                }`}
              >
                Overview
              </button>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Last updated */}
            <span className="text-[10px] text-white/15">
              {lastUpdate.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>

            {/* Fullscreen button */}
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
                  <>
                    <path d="M4 14h2v2M14 4h2v2M4 6h2V4M14 16h2v-2" />
                  </>
                ) : (
                  <>
                    <path d="M3 7V3h4M13 3h4v4M17 13v4h-4M7 17H3v-4" />
                  </>
                )}
              </svg>
            </button>

            {/* Logout */}
            <button
              onClick={async () => {
                await fetch("/api/auth", { method: "DELETE" });
                window.location.href = "/login";
              }}
              className="text-[10px] text-white/15 hover:text-white/30 transition-colors uppercase tracking-wider"
            >
              Sign out
            </button>
          </div>
        </div>
      </motion.header>

      {/* Stats bar */}
      <StatsBar
        totalClients={brands.length}
        totalPlatforms={stats.totalPlatforms}
        activeThisWeek={stats.activeThisWeek}
      />

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        <AnimatePresence mode="wait">
          {activeTab === "clients" ? (
            <motion.div
              key="clients"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.2 }}
            >
              {/* Controls */}
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-xs font-semibold text-white/40 uppercase tracking-wider">
                    Client Brands
                  </h2>
                  <p className="text-[10px] text-white/15 mt-0.5">
                    {brands.length} active &middot; Page{" "}
                    {currentPage + 1} of {totalPages}
                  </p>
                </div>
                <AutoScroller
                  enabled={autoScroll}
                  onToggle={() => setAutoScroll(!autoScroll)}
                  totalItems={brands.length}
                  visibleCount={CARDS_PER_PAGE}
                  currentPage={currentPage}
                  onPageChange={handlePageChange}
                />
              </div>

              {/* Client grid */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentPage}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  className="grid grid-cols-1 sm:grid-cols-2 gap-3"
                >
                  {visibleBrands.map((brand, i) => (
                    <ClientCard key={brand.id} brand={brand} index={i} />
                  ))}
                </motion.div>
              </AnimatePresence>
            </motion.div>
          ) : (
            <motion.div
              key="overview"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
            >
              <div className="mb-5">
                <h2 className="text-xs font-semibold text-white/40 uppercase tracking-wider">
                  Overview
                </h2>
                <p className="text-[10px] text-white/15 mt-0.5">
                  Aggregate performance across all clients
                </p>
              </div>
              <HolisticCharts brands={brands} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Watermark footer */}
      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="fixed bottom-3 right-4 z-30"
      >
        <QinaryLogo size="sm" showText={false} className="opacity-20" />
      </motion.footer>
    </div>
  );
}
