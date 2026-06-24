"use client";

import type { GithubStats } from "@/lib/types";
import ShareCard from "./ShareCard";
import { CalendarIcon } from "./icons";

const LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function WeekdayCard({ stats }: { stats: GithubStats }) {
  const hist = stats.weekdayHistogram;
  const max = Math.max(...hist, 1);
  const total = hist.reduce((a, b) => a + b, 0);
  const bestIdx = hist.indexOf(Math.max(...hist));

  return (
    <ShareCard
      title="When you code"
      icon={<CalendarIcon />}
      filename={`${stats.user.login}-weekdays`}
      className="span-all"
    >
      <p className="repos-sub">
        Your contribution rhythm across the week
        {total > 0 && (
          <>
            {" "}
            · busiest on <strong style={{ color: "var(--green)" }}>
              {LABELS[bestIdx]}
            </strong>
          </>
        )}
      </p>
      <div className="weekday-chart">
        {hist.map((v, i) => (
          <div className="weekday-col" key={i}>
            <div className="weekday-bar-wrap">
              <div
                className={`weekday-bar ${i === bestIdx ? "best" : ""}`}
                style={{ height: `${Math.max((v / max) * 100, v > 0 ? 4 : 1)}%` }}
                title={`${v.toLocaleString("en-US")} contributions`}
              />
            </div>
            <span className="weekday-label">{LABELS[i]}</span>
          </div>
        ))}
      </div>
    </ShareCard>
  );
}
