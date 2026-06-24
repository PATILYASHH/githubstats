"use client";

import { useMemo, useState } from "react";
import type { ContribDay } from "@/lib/types";

type Granularity = "year" | "month" | "week" | "day";

const TABS: { key: Granularity; label: string }[] = [
  { key: "year", label: "Year" },
  { key: "month", label: "Month" },
  { key: "week", label: "Week" },
  { key: "day", label: "Day" },
];

// How many of the most recent buckets to show per granularity.
const CAPS: Record<Granularity, number> = {
  year: 100,
  month: 240,
  week: 104,
  day: 90,
};

interface Bucket {
  key: string;
  label: string;
  count: number;
}

function startOfWeek(date: Date): Date {
  const d = new Date(date);
  d.setDate(d.getDate() - d.getDay()); // back to Sunday
  return d;
}

function aggregate(days: ContribDay[], g: Granularity): Bucket[] {
  const map = new Map<string, Bucket>();

  for (const day of days) {
    const d = new Date(day.date + "T00:00:00");
    let key: string;
    let label: string;

    if (g === "year") {
      key = String(d.getFullYear());
      label = key;
    } else if (g === "month") {
      key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      label = d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
    } else if (g === "week") {
      const s = startOfWeek(d);
      key = s.toISOString().slice(0, 10);
      label = `Wk ${s.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
    } else {
      key = day.date;
      label = d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    }

    const existing = map.get(key);
    if (existing) existing.count += day.count;
    else map.set(key, { key, label, count: day.count });
  }

  // Chronological, most recent first, then cap.
  const all = [...map.values()].sort((a, b) => b.key.localeCompare(a.key));
  return all.slice(0, CAPS[g]);
}

export default function ActivityBreakdown({ days }: { days: ContribDay[] }) {
  const [g, setG] = useState<Granularity>("month");

  const buckets = useMemo(() => aggregate(days, g), [days, g]);
  const max = useMemo(
    () => buckets.reduce((m, b) => Math.max(m, b.count), 0) || 1,
    [buckets]
  );
  const totalBuckets = useMemo(() => {
    // recompute uncapped count for the "showing X of Y" note
    const keys = new Set<string>();
    for (const day of days) {
      const d = new Date(day.date + "T00:00:00");
      if (g === "year") keys.add(String(d.getFullYear()));
      else if (g === "month")
        keys.add(`${d.getFullYear()}-${d.getMonth()}`);
      else if (g === "week") keys.add(startOfWeek(d).toISOString().slice(0, 10));
      else keys.add(day.date);
    }
    return keys.size;
  }, [days, g]);

  return (
    <>
      <div className="breakdown-tabs" data-exclude="true">
        {TABS.map((t) => (
          <button
            key={t.key}
            className={`breakdown-tab ${g === t.key ? "active" : ""}`}
            onClick={() => setG(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="breakdown-list">
        {buckets.map((b) => (
          <div className="breakdown-row" key={b.key}>
            <span className="breakdown-label">{b.label}</span>
            <span className="breakdown-track">
              <span
                className="breakdown-fill"
                style={{ width: `${Math.max((b.count / max) * 100, b.count > 0 ? 2 : 0)}%` }}
              />
            </span>
            <span className="breakdown-count">
              {b.count.toLocaleString("en-US")}
            </span>
          </div>
        ))}
      </div>

      {totalBuckets > buckets.length && (
        <p className="breakdown-note">
          Showing the most recent {buckets.length} of {totalBuckets} {g}s.
        </p>
      )}
    </>
  );
}
