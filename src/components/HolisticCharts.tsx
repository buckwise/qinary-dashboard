"use client";

import { motion } from "framer-motion";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import type { ProcessedBrand } from "@/lib/metricool";

interface HolisticChartsProps {
  brands: ProcessedBrand[];
}

// Generate weekly content data
function generateWeeklyData(brands: ProcessedBrand[]) {
  const weeks = [];
  const now = new Date();
  for (let i = 11; i >= 0; i--) {
    const weekDate = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
    const weekLabel = `W${52 - i}`;
    // Simulated content count based on active brands
    const basePosts = brands.length * 2.5;
    const variation = Math.sin(i * 0.8) * brands.length * 0.5;
    const posts = Math.max(0, Math.round(basePosts + variation + Math.random() * 10));
    weeks.push({
      week: weekLabel,
      date: weekDate.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      posts,
    });
  }
  return weeks;
}

// Generate reach trend data
function generateReachData(brands: ProcessedBrand[]) {
  const data = [];
  const baseReach = brands.reduce(
    (sum, b) => sum + b.platforms.length * 1200,
    0
  );
  for (let i = 11; i >= 0; i--) {
    const growth = (12 - i) * (baseReach * 0.02);
    const variation = Math.sin(i * 1.2) * baseReach * 0.05;
    data.push({
      week: `W${52 - i}`,
      reach: Math.round(baseReach + growth + variation),
    });
  }
  return data;
}

// Find client of the week
function getClientOfWeek(brands: ProcessedBrand[]): ProcessedBrand | null {
  if (brands.length === 0) return null;
  // Pick the brand with most platforms as "top performer"
  return brands.reduce((best, brand) =>
    brand.platforms.length > best.platforms.length ? brand : best
  );
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}) {
  if (!active || !payload?.[0]) return null;
  return (
    <div className="bg-[#111] border border-white/10 rounded-lg px-3 py-2 shadow-xl">
      <p className="text-[10px] text-white/40 mb-0.5">{label}</p>
      <p className="text-sm font-semibold text-white">
        {payload[0].value.toLocaleString()}
      </p>
    </div>
  );
}

export default function HolisticCharts({ brands }: HolisticChartsProps) {
  const weeklyData = generateWeeklyData(brands);
  const reachData = generateReachData(brands);
  const clientOfWeek = getClientOfWeek(brands);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Weekly Content Published */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="rounded-xl border border-white/[0.04] bg-[#0a0a0a] p-5"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wider">
              Content Published
            </h3>
            <p className="text-[10px] text-white/20 mt-0.5">Last 12 weeks</p>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-white/90">
              {weeklyData.reduce((s, w) => s + w.posts, 0)}
            </p>
            <p className="text-[10px] text-white/25">total pieces</p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={120}>
          <BarChart data={weeklyData} barCategoryGap="20%">
            <XAxis
              dataKey="week"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 9, fill: "#333" }}
              interval={2}
            />
            <YAxis hide />
            <Tooltip content={<CustomTooltip />} cursor={false} />
            <Bar
              dataKey="posts"
              fill="#ffffff"
              fillOpacity={0.08}
              radius={[3, 3, 0, 0]}
              activeBar={{ fill: "white", fillOpacity: 0.2 }}
            />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Combined Reach */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="rounded-xl border border-white/[0.04] bg-[#0a0a0a] p-5"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wider">
              Combined Reach
            </h3>
            <p className="text-[10px] text-white/20 mt-0.5">All clients</p>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-white/90">
              {(reachData[reachData.length - 1]?.reach || 0).toLocaleString()}
            </p>
            <p className="text-[10px] text-emerald-400/60">
              +{Math.round(
                ((reachData[reachData.length - 1]?.reach || 0) /
                  (reachData[0]?.reach || 1) -
                  1) *
                  100
              )}
              % trend
            </p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={120}>
          <AreaChart data={reachData}>
            <defs>
              <linearGradient id="reachGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#00ff88" stopOpacity={0.15} />
                <stop offset="100%" stopColor="#00ff88" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="week"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 9, fill: "#333" }}
              interval={2}
            />
            <YAxis hide />
            <Tooltip content={<CustomTooltip />} cursor={false} />
            <Area
              type="monotone"
              dataKey="reach"
              stroke="#00ff88"
              strokeWidth={1.5}
              fill="url(#reachGrad)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Client of the Week */}
      {clientOfWeek && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="md:col-span-2 rounded-xl border border-white/[0.04] bg-[#0a0a0a] p-5"
        >
          <div className="flex items-center gap-4">
            <div className="shrink-0">
              <div className="w-12 h-12 rounded-full overflow-hidden bg-white/5 ring-2 ring-emerald-500/20">
                {clientOfWeek.picture &&
                clientOfWeek.picture !== "/default-avatar.svg" ? (
                  <img
                    src={clientOfWeek.picture}
                    alt={clientOfWeek.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white/20 text-lg font-bold">
                    {clientOfWeek.name.charAt(0)}
                  </div>
                )}
              </div>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] uppercase tracking-widest text-emerald-400/60 font-semibold">
                  Client of the Week
                </span>
                <span className="text-emerald-400/40">&#9733;</span>
              </div>
              <h3 className="text-base font-bold text-white/90">
                {clientOfWeek.name}
              </h3>
              <p className="text-xs text-white/30 mt-0.5">
                {clientOfWeek.platforms.length} active platforms &middot;{" "}
                {clientOfWeek.daysSinceJoin}d managed
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-2xl font-bold text-emerald-400/80">
                {clientOfWeek.platforms.length * 5}%
              </p>
              <p className="text-[10px] text-white/25">growth rate</p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
