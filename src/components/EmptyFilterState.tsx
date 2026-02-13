"use client";

interface EmptyFilterStateProps {
  onClearAll: () => void;
}

export default function EmptyFilterState({ onClearAll }: EmptyFilterStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-12 h-12 rounded-full bg-white/[0.03] flex items-center justify-center mb-4">
        <svg
          viewBox="0 0 24 24"
          className="w-5 h-5 text-white/15"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="M16 16l5 5" />
          <path d="M8 11h6" />
        </svg>
      </div>
      <p className="text-sm text-white/30 mb-1">
        No clients match your filters
      </p>
      <p className="text-[11px] text-white/15 mb-4">
        Try adjusting your search or filter criteria
      </p>
      <button
        onClick={onClearAll}
        className="px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06]
                   text-[11px] text-white/40 hover:text-white/60 hover:bg-white/[0.06]
                   transition-all duration-200"
      >
        Clear all filters
      </button>
    </div>
  );
}
