"use client";

import { motion } from "framer-motion";
import AnimatedNumber from "./AnimatedNumber";

interface StatsBarProps {
  totalClients: number;
  totalPlatforms: number;
  activeThisWeek: number;
}

interface StatCardProps {
  label: string;
  value: number;
  suffix?: string;
  delay: number;
  formatFn?: (n: number) => string;
}

function StatCard({ label, value, suffix, delay, formatFn }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col items-center px-4 py-3 relative"
    >
      <div className="flex items-baseline gap-1">
        <AnimatedNumber
          value={value}
          className="text-2xl md:text-3xl font-bold tracking-tight text-white"
          formatFn={formatFn}
          duration={2.5}
        />
        {suffix && (
          <span className="text-xs text-white/30 font-medium">{suffix}</span>
        )}
      </div>
      <span className="text-[10px] uppercase tracking-[0.15em] text-white/30 mt-1 font-medium">
        {label}
      </span>
    </motion.div>
  );
}

export default function StatsBar({
  totalClients,
  totalPlatforms,
  activeThisWeek,
}: StatsBarProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="w-full border-b border-white/[0.04] bg-black/80 backdrop-blur-xl sticky top-0 z-40"
    >
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-0 divide-x divide-white/[0.04]">
          <StatCard
            label="Active Clients"
            value={totalClients}
            delay={0.1}
            formatFn={(n) => n.toString()}
          />
          <StatCard
            label="Platforms Managed"
            value={totalPlatforms}
            delay={0.2}
            formatFn={(n) => n.toString()}
          />
          <StatCard
            label="Active This Week"
            value={activeThisWeek}
            delay={0.3}
            formatFn={(n) => n.toString()}
          />
          <StatCard
            label="Total Reach"
            value={totalPlatforms * 2800}
            delay={0.4}
            suffix="est."
          />
        </div>
      </div>

      {/* Subtle gradient line at bottom */}
      <div className="h-[1px] bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
    </motion.div>
  );
}
