"use client";

import { useRef } from "react";
import { PLATFORM_CONFIG, ALL_PLATFORMS } from "./PlatformIcons";
import type { Platform } from "@/lib/metricool";
import type { BrandStatus } from "@/lib/types";

interface SearchFilterBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedPlatforms: Platform[];
  onPlatformsChange: (platforms: Platform[]) => void;
  selectedStatuses: BrandStatus[];
  onStatusesChange: (statuses: BrandStatus[]) => void;
  totalCount: number;
  filteredCount: number;
  hasActiveFilters: boolean;
  onClearAll: () => void;
  onFocusChange: (focused: boolean) => void;
}

const STATUS_CONFIG: Record<BrandStatus, { color: string; bg: string }> = {
  Active: { color: "text-emerald-400", bg: "bg-emerald-500" },
  Growing: { color: "text-amber-400", bg: "bg-amber-500" },
  Setup: { color: "text-red-400", bg: "bg-red-500" },
};

export default function SearchFilterBar({
  searchQuery,
  onSearchChange,
  selectedPlatforms,
  onPlatformsChange,
  selectedStatuses,
  onStatusesChange,
  totalCount,
  filteredCount,
  hasActiveFilters,
  onClearAll,
  onFocusChange,
}: SearchFilterBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const togglePlatform = (platform: Platform) => {
    if (selectedPlatforms.includes(platform)) {
      onPlatformsChange(selectedPlatforms.filter((p) => p !== platform));
    } else {
      onPlatformsChange([...selectedPlatforms, platform]);
    }
  };

  const toggleStatus = (status: BrandStatus) => {
    if (selectedStatuses.includes(status)) {
      onStatusesChange(selectedStatuses.filter((s) => s !== status));
    } else {
      onStatusesChange([...selectedStatuses, status]);
    }
  };

  return (
    <div className="mb-4 space-y-3">
      {/* Search input */}
      <div className="relative">
        <svg
          viewBox="0 0 20 20"
          className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/20"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="8.5" cy="8.5" r="5.5" />
          <path d="M12.5 12.5L17 17" />
        </svg>
        <input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          onFocus={() => onFocusChange(true)}
          onBlur={() => onFocusChange(false)}
          placeholder="Search clients..."
          className="w-full pl-9 pr-8 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06]
                     text-sm text-white/80 placeholder-white/20
                     focus:outline-none focus:border-white/[0.12] focus:bg-white/[0.05]
                     transition-all duration-200"
        />
        {searchQuery && (
          <button
            onClick={() => {
              onSearchChange("");
              inputRef.current?.focus();
            }}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-white/[0.06] transition-colors"
          >
            <svg
              viewBox="0 0 16 16"
              className="w-3 h-3 text-white/30 hover:text-white/50"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M4 4l8 8M12 4L4 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Filter pills row */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Platform pills */}
        {ALL_PLATFORMS.map((p) => {
          const config = PLATFORM_CONFIG[p];
          const isSelected = selectedPlatforms.includes(p);
          return (
            <button
              key={p}
              onClick={() => togglePlatform(p)}
              className={`px-2 py-1 rounded-full text-[10px] font-medium uppercase tracking-wider
                          border transition-all duration-200 ${
                            isSelected
                              ? "border-white/20 bg-white/[0.08] text-white/80"
                              : "border-white/[0.04] bg-white/[0.02] text-white/25 hover:text-white/40 hover:border-white/[0.08]"
                          }`}
              style={
                isSelected
                  ? { borderColor: config.color + "40", color: config.color }
                  : undefined
              }
            >
              {config.abbr}
            </button>
          );
        })}

        <span className="w-px h-4 bg-white/[0.06] mx-1" />

        {/* Status pills */}
        {(["Active", "Growing", "Setup"] as BrandStatus[]).map((s) => {
          const config = STATUS_CONFIG[s];
          const isSelected = selectedStatuses.includes(s);
          return (
            <button
              key={s}
              onClick={() => toggleStatus(s)}
              className={`px-2 py-1 rounded-full text-[10px] font-medium uppercase tracking-wider
                          border transition-all duration-200 ${
                            isSelected
                              ? `border-white/20 bg-white/[0.08] ${config.color}`
                              : "border-white/[0.04] bg-white/[0.02] text-white/25 hover:text-white/40 hover:border-white/[0.08]"
                          }`}
            >
              {s}
            </button>
          );
        })}

        {/* Spacer + result count + clear all */}
        {hasActiveFilters && (
          <>
            <span className="w-px h-4 bg-white/[0.06] mx-1" />
            <span className="text-[10px] text-white/30">
              {filteredCount} of {totalCount}
            </span>
            <button
              onClick={onClearAll}
              className="text-[10px] text-white/30 hover:text-white/50 underline underline-offset-2 transition-colors"
            >
              Clear all
            </button>
          </>
        )}
      </div>
    </div>
  );
}
