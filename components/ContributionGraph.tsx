"use client";

import { useEffect, useRef } from "react";
import type { ContribDay } from "@/lib/types";
import { LEVEL_COLORS } from "@/lib/colors";

export default function ContributionGraph({ days }: { days: ContribDay[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Default the scroll position to the most recent contributions.
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
    }
  }, [days]);

  if (days.length === 0) {
    return <p className="stat-sub">No contribution data available.</p>;
  }

  // Pad the front so the first column starts on the correct weekday (Sun=0).
  const firstWeekday = new Date(days[0].date + "T00:00:00").getDay();
  const cells: (ContribDay | null)[] = [
    ...Array(firstWeekday).fill(null),
    ...days,
  ];

  return (
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
  );
}
