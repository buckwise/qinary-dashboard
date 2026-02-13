"use client";

import { useEffect, useState } from "react";

interface SparklineProps {
  data?: number[];
  color?: string;
  width?: number;
  height?: number;
  strokeWidth?: number;
  filled?: boolean;
  animated?: boolean;
}

// Generate deterministic pseudo-random data based on a seed
function generateTrendData(seed: number, length: number = 12): number[] {
  const data: number[] = [];
  let value = 50 + ((seed * 17) % 40);
  for (let i = 0; i < length; i++) {
    const change = Math.sin(seed * 0.1 + i * 0.8) * 15 + Math.cos(seed * 0.3 + i * 1.2) * 8;
    value = Math.max(10, Math.min(100, value + change));
    data.push(value);
  }
  return data;
}

export default function Sparkline({
  data,
  color = "#00ff88",
  width = 80,
  height = 24,
  strokeWidth = 1.5,
  filled = true,
  animated = true,
}: SparklineProps) {
  const [visible, setVisible] = useState(!animated);

  useEffect(() => {
    if (animated) {
      const timer = setTimeout(() => setVisible(true), 200);
      return () => clearTimeout(timer);
    }
  }, [animated]);

  const points = data || generateTrendData(42);
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;

  const svgPoints = points.map((val, i) => ({
    x: (i / (points.length - 1)) * width,
    y: height - ((val - min) / range) * (height - 4) - 2,
  }));

  // Create smooth curve path
  const linePath = svgPoints.reduce((path, point, i) => {
    if (i === 0) return `M ${point.x} ${point.y}`;
    const prev = svgPoints[i - 1];
    const cpx1 = prev.x + (point.x - prev.x) * 0.4;
    const cpx2 = point.x - (point.x - prev.x) * 0.4;
    return `${path} C ${cpx1} ${prev.y}, ${cpx2} ${point.y}, ${point.x} ${point.y}`;
  }, "");

  const fillPath = `${linePath} L ${width} ${height} L 0 ${height} Z`;

  const isUpTrend = points[points.length - 1] > points[0];

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="sparkline-container"
      style={{
        opacity: visible ? 1 : 0,
        transition: "opacity 0.6s ease",
      }}
    >
      <defs>
        <linearGradient id={`grad-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.15" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {filled && (
        <path
          d={fillPath}
          fill={`url(#grad-${color.replace("#", "")})`}
        />
      )}
      <path
        d={linePath}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{
          strokeDasharray: visible ? "none" : `${width * 3}`,
          strokeDashoffset: visible ? 0 : width * 3,
          transition: "stroke-dashoffset 1.5s ease",
        }}
      />
      {/* End dot */}
      <circle
        cx={svgPoints[svgPoints.length - 1]?.x}
        cy={svgPoints[svgPoints.length - 1]?.y}
        r={2}
        fill={isUpTrend ? "#00ff88" : "#ff4444"}
        opacity={visible ? 0.8 : 0}
        style={{ transition: "opacity 0.6s ease 1s" }}
      />
    </svg>
  );
}

export { generateTrendData };
