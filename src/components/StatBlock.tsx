"use client";

import { motion } from "framer-motion";
import AnimatedNumber from "./AnimatedNumber";

interface StatBlockProps {
  label: string;
  value: number;
  color: string;
  delay: number;
  formatFn?: (n: number) => string;
  rawNumber?: boolean;
  isEstimated?: boolean;
}

const defaultFmt = (n: number) => {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(n >= 10_000 ? 0 : 1) + "K";
  return n.toLocaleString();
};

export default function StatBlock({
  label,
  value,
  color,
  delay,
  formatFn,
  rawNumber = true,
  isEstimated,
}: StatBlockProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="rounded-xl bg-white/[0.02] border border-white/[0.04] p-3"
    >
      <div className="flex items-center gap-1.5 mb-1.5">
        <p className="text-[9px] uppercase tracking-[0.15em] text-white/30 font-medium">
          {label}
        </p>
        {isEstimated && (
          <span className="text-[8px] uppercase tracking-wider text-white/20 bg-white/[0.04] px-1 py-0.5 rounded">
            Est.
          </span>
        )}
      </div>
      {rawNumber ? (
        <AnimatedNumber
          value={value}
          className="text-xl font-bold text-white/90"
          formatFn={formatFn || defaultFmt}
          duration={2}
        />
      ) : (
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: delay + 0.3 }}
          className="text-xl font-bold text-white/90"
        >
          {formatFn ? formatFn(value) : value}
        </motion.span>
      )}
    </motion.div>
  );
}
