"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface AutoScrollerProps {
  enabled: boolean;
  onToggle: () => void;
  totalItems: number;
  visibleCount: number;
  currentPage: number;
  onPageChange: (page: number) => void;
}

export default function AutoScroller({
  enabled,
  onToggle,
  totalItems,
  visibleCount,
  currentPage,
  onPageChange,
}: AutoScrollerProps) {
  const totalPages = Math.ceil(totalItems / visibleCount);

  useEffect(() => {
    if (!enabled) return;

    const interval = setInterval(() => {
      onPageChange((currentPage + 1) % totalPages);
    }, 8000); // 8 seconds per page

    return () => clearInterval(interval);
  }, [enabled, currentPage, totalPages, onPageChange]);

  return (
    <div className="flex items-center gap-3">
      {/* Page dots */}
      <div className="flex items-center gap-1">
        {Array.from({ length: totalPages }).map((_, i) => (
          <button
            key={i}
            onClick={() => onPageChange(i)}
            className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
              i === currentPage
                ? "bg-white/60 w-4"
                : "bg-white/10 hover:bg-white/20"
            }`}
          />
        ))}
      </div>

      {/* Auto-scroll toggle */}
      <button
        onClick={onToggle}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium
                    uppercase tracking-wider transition-all duration-300 ${
                      enabled
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        : "bg-white/[0.03] text-white/30 border border-white/[0.06] hover:text-white/50"
                    }`}
      >
        {enabled && <span className="live-dot" style={{ width: 4, height: 4 }} />}
        {enabled ? "Live" : "Paused"}
      </button>
    </div>
  );
}
