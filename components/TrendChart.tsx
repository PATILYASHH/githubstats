"use client";

import { useMemo } from "react";
import type { ContribDay } from "@/lib/types";
import ShareCard from "./ShareCard";
import { GraphIcon } from "./icons";

interface Point {
  label: string;
  short: string;
  value: number;
}

function monthly(days: ContribDay[], maxMonths: number): Point[] {
  const map = new Map<string, number>();
  for (const d of days) {
    const key = d.date.slice(0, 7); // YYYY-MM
    map.set(key, (map.get(key) ?? 0) + d.count);
  }
  const keys = [...map.keys()].sort();
  const sliced = keys.slice(-maxMonths);
  return sliced.map((k) => {
    const [y, m] = k.split("-");
    const dt = new Date(Number(y), Number(m) - 1, 1);
    return {
      label: dt.toLocaleDateString("en-US", { month: "short", year: "numeric" }),
      short: dt.toLocaleDateString("en-US", { month: "short" }),
      value: map.get(k) ?? 0,
    };
  });
}

export default function TrendChart({
  days,
  login,
}: {
  days: ContribDay[];
  login: string;
}) {
  const points = useMemo(() => monthly(days, 24), [days]);

  if (points.length < 2) return null;

  const W = 760;
  const H = 220;
  const padX = 16;
  const padTop = 16;
  const padBottom = 34;
  const max = Math.max(...points.map((p) => p.value), 1);
  const n = points.length;

  const x = (i: number) => padX + (i * (W - 2 * padX)) / (n - 1);
  const y = (v: number) =>
    H - padBottom - (v / max) * (H - padTop - padBottom);

  const linePath = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${x(i).toFixed(1)} ${y(p.value).toFixed(1)}`)
    .join(" ");
  const areaPath = `${linePath} L ${x(n - 1).toFixed(1)} ${H - padBottom} L ${x(
    0
  ).toFixed(1)} ${H - padBottom} Z`;

  const peakIdx = points.reduce((m, p, i) => (p.value > points[m].value ? i : m), 0);
  const total = points.reduce((a, p) => a + p.value, 0);

  // sparse x labels
  const labelEvery = Math.ceil(n / 6);

  return (
    <ShareCard
      title="Contribution trend"
      icon={<GraphIcon />}
      filename={`${login}-trend`}
      className="span-all"
    >
      <p className="repos-sub">
        Monthly contributions over the last {n} months ·{" "}
        <strong style={{ color: "var(--green)" }}>
          peak {points[peakIdx].value.toLocaleString("en-US")}
        </strong>{" "}
        in {points[peakIdx].label} · {total.toLocaleString("en-US")} total
      </p>
      <svg
        className="trend-svg"
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        role="img"
      >
        <defs>
          <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#39d353" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#39d353" stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* gridlines */}
        {[0.25, 0.5, 0.75, 1].map((g) => (
          <line
            key={g}
            x1={padX}
            x2={W - padX}
            y1={y(max * g)}
            y2={y(max * g)}
            stroke="#21262d"
            strokeWidth="1"
          />
        ))}
        <path d={areaPath} fill="url(#trendFill)" />
        <path
          d={linePath}
          fill="none"
          stroke="#39d353"
          strokeWidth="2.5"
          strokeLinejoin="round"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
        {/* peak dot */}
        <circle cx={x(peakIdx)} cy={y(points[peakIdx].value)} r="4" fill="#39d353" />
        {/* x labels */}
        {points.map((p, i) =>
          i % labelEvery === 0 || i === n - 1 ? (
            <text
              key={i}
              x={x(i)}
              y={H - 12}
              textAnchor="middle"
              fontSize="11"
              fill="#8b949e"
            >
              {p.short}
            </text>
          ) : null
        )}
      </svg>
    </ShareCard>
  );
}
