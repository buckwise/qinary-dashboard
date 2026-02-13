"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import PlatformIcons, { PLATFORM_CONFIG } from "./PlatformIcons";
import Sparkline, { generateTrendData } from "./Sparkline";
import StatBlock from "./StatBlock";
import { useStats } from "@/hooks/useStats";
import { getGrowthPercent } from "@/lib/estimations";
import { getBrandStatus } from "@/lib/types";
import type { ProcessedBrand } from "@/lib/metricool";

interface DetailPanelProps {
  brand: ProcessedBrand | null;
  onClose: () => void;
}

export default function DetailPanel({ brand, onClose }: DetailPanelProps) {
  // Escape key dismissal
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && brand) onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [brand, onClose]);

  return (
    <AnimatePresence>
      {brand && <DetailPanelContent brand={brand} onClose={onClose} />}
    </AnimatePresence>
  );
}

function DetailPanelContent({
  brand,
  onClose,
}: {
  brand: ProcessedBrand;
  onClose: () => void;
}) {
  const { stats } = useStats(brand);
  const growth = getGrowthPercent(brand);
  const sparkData = generateTrendData(brand.id, 20);
  const { status, statusClass } = getBrandStatus(brand.platforms);

  const statusColors = {
    growing: { bg: "bg-emerald-500/10", text: "text-emerald-400", accent: "#00ff88" },
    stable: { bg: "bg-amber-500/10", text: "text-amber-400", accent: "#ffbb00" },
    new: { bg: "bg-red-500/10", text: "text-red-400", accent: "#ff4444" },
  };
  const sc = statusColors[statusClass];

  return (
    <>
      {/* Backdrop */}
      <motion.div
        key="detail-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <motion.div
        key="detail-panel"
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="fixed right-0 top-0 bottom-0 z-[70] w-[480px] max-w-[90vw] bg-[#0a0a0a] border-l border-white/[0.06] overflow-y-auto"
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] transition-colors"
        >
          <svg
            viewBox="0 0 20 20"
            className="w-4 h-4 text-white/40"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M5 5l10 10M15 5L5 15" />
          </svg>
        </button>

        <div className="p-6 pt-8">
          {/* Avatar + name */}
          <div className="flex items-start gap-4 mb-6">
            <div className="w-20 h-20 rounded-2xl overflow-hidden ring-1 ring-white/[0.08] shrink-0">
              {brand.picture && brand.picture !== "/default-avatar.svg" ? (
                <Image
                  src={brand.picture}
                  alt={brand.name}
                  width={80}
                  height={80}
                  className="w-full h-full object-cover"
                  unoptimized
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-2xl font-bold bg-white/[0.04] text-white/30">
                  {brand.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0 pt-1">
              <h2 className="text-xl font-bold text-white/95 truncate mb-2">
                {brand.name}
              </h2>
              <PlatformIcons connected={brand.platforms} showAll size="md" />
            </div>
          </div>

          {/* Status + growth row */}
          <div className="flex items-center gap-3 mb-6">
            <span
              className={`px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider ${sc.bg} ${sc.text}`}
            >
              {status}
            </span>
            <span
              className="px-2.5 py-1 rounded-full text-[10px] font-bold"
              style={{
                backgroundColor:
                  growth >= 0 ? "rgba(0,255,136,0.1)" : "rgba(255,68,68,0.1)",
                color: growth >= 0 ? "#00ff88" : "#ff4444",
              }}
            >
              {growth >= 0 ? "+" : ""}
              {growth}% growth
            </span>
          </div>

          {/* Large sparkline */}
          <div className="mb-6 p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
            <Sparkline
              data={sparkData}
              color={sc.accent}
              width={380}
              height={60}
              strokeWidth={2}
            />
          </div>

          {/* 2x2 stats grid */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <StatBlock
              label="Followers"
              value={stats.followers}
              color={sc.accent}
              delay={0.1}
              isEstimated={stats.isEstimated}
            />
            <StatBlock
              label="Reach"
              value={stats.reach}
              color={sc.accent}
              delay={0.15}
              isEstimated={stats.isEstimated}
            />
            <StatBlock
              label="Engagement"
              value={stats.engagement}
              color={sc.accent}
              delay={0.2}
              formatFn={(n) => n.toFixed(1) + "%"}
              rawNumber={false}
              isEstimated={stats.isEstimated}
            />
            <StatBlock
              label="Content Published"
              value={stats.contentPublished}
              color={sc.accent}
              delay={0.25}
              formatFn={(n) => n.toString()}
              isEstimated={stats.isEstimated}
            />
          </div>

          {/* Platform breakdown */}
          <div className="mb-6">
            <h3 className="text-[10px] uppercase tracking-[0.15em] text-white/30 font-medium mb-3">
              Platform Breakdown
            </h3>
            <div className="space-y-2">
              {brand.platforms.map((p) => {
                const config = PLATFORM_CONFIG[p];
                return (
                  <div
                    key={p}
                    className="flex items-center gap-3 p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.03]"
                  >
                    <div style={{ color: config.color }}>{config.icon}</div>
                    <span className="text-sm text-white/70 font-medium">
                      {config.label}
                    </span>
                    <span className="ml-auto text-[10px] text-white/30 uppercase tracking-wider">
                      Connected
                    </span>
                  </div>
                );
              })}
              {brand.platforms.length === 0 && (
                <p className="text-xs text-white/20 italic">
                  No platforms connected
                </p>
              )}
            </div>
          </div>

          {/* Meta info */}
          <div className="pt-4 border-t border-white/[0.04] space-y-2">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-white/30">Platforms connected</span>
              <span className="text-white/60">{brand.platforms.length}</span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-white/30">Days managed</span>
              <span className="text-white/60">{brand.daysSinceJoin}</span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-white/30">Joined</span>
              <span className="text-white/60">
                {new Date(brand.joinDate).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </div>
          </div>
        </div>
      </motion.div>
    </>
  );
}
