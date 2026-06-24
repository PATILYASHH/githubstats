"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ContribDay } from "@/lib/types";
import { LEVEL_COLORS } from "@/lib/colors";

const ALL = "all";

export default function ContributionGraph({ days }: { days: ContribDay[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Available years, newest first.
  const years = useMemo(() => {
    const set = new Set<string>();
    for (const d of days) set.add(d.date.slice(0, 4));
    return [...set].sort((a, b) => b.localeCompare(a));
  }, [days]);

  const [year, setYear] = useState<string>(ALL);

  // Default to the most recent year once data arrives.
  useEffect(() => {
    if (years.length > 0) setYear(years[0]);
  }, [years]);

  const shown = useMemo(
    () => (year === ALL ? days : days.filter((d) => d.date.startsWith(year))),
    [days, year]
  );

  const yearTotal = useMemo(
    () => shown.reduce((sum, d) => sum + d.count, 0),
    [shown]
  );

  // Keep the scroll pinned to the most recent contributions.
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
    }
  }, [shown]);

  if (days.length === 0) {
    return <p className="stat-sub">No contribution data available.</p>;
  }

  // Pad the front so the first column starts on the correct weekday (Sun=0).
  const firstWeekday = new Date(shown[0].date + "T00:00:00").getDay();
  const cells: (ContribDay | null)[] = [
    ...Array(firstWeekday).fill(null),
    ...shown,
  ];

  return (
    <>
      <div className="contrib-bar">
        <span className="contrib-count">
          <strong>{yearTotal.toLocaleString("en-US")}</strong> contributions{" "}
          {year === ALL ? "all time" : `in ${year}`}
        </span>
        <select
          className="year-select"
          data-exclude="true"
          value={year}
          onChange={(e) => setYear(e.target.value)}
          aria-label="Select year"
        >
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
          <option value={ALL}>All time</option>
        </select>
      </div>

      <div className="contrib-scroll" ref={scrollRef}>
        <div className="contrib-grid">
          {cells.map((d, i) =>
            d ? (
              <div
                key={d.date}
                className="contrib-cell"
                style={{ backgroundColor: LEVEL_COLORS[d.level] }}
                title={`${d.count} contribution${d.count === 1 ? "" : "s"} on ${
                  d.date
                }`}
              />
            ) : (
              <div
                key={`pad-${i}`}
                className="contrib-cell"
                style={{ backgroundColor: "transparent" }}
              />
            )
          )}
        </div>
      </div>
    </>
  );
}
