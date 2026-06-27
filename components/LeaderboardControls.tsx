"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { BIcon } from "./icons";
import type { LeaderPeriod, LeaderScope } from "@/lib/games/types";

const SCOPE_OPTS: { key: LeaderScope; label: string; icon: string }[] = [
  { key: "global", label: "Global", icon: "globe2" },
  { key: "country", label: "Country", icon: "flag-fill" },
  { key: "city", label: "City", icon: "buildings-fill" },
];

const PERIOD_OPTS: { key: LeaderPeriod; label: string }[] = [
  { key: "month", label: "This month" },
  { key: "year", label: "This year" },
  { key: "all", label: "All-time" },
];

export default function LeaderboardControls({
  period,
  scope,
  country,
  city,
}: {
  period: LeaderPeriod;
  scope: LeaderScope;
  country: string | null;
  city: string | null;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  function setParam(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    next.set(key, value);
    router.push(`${pathname}?${next.toString()}`);
  }

  function scopeLabel(k: LeaderScope, fallback: string) {
    if (k === "country") return country ?? fallback;
    if (k === "city") return city ?? fallback;
    return fallback;
  }

  return (
    <div className="lb-controls">
      <div className="seg" role="group" aria-label="Scope">
        {SCOPE_OPTS.map((o) => (
          <button
            key={o.key}
            type="button"
            className={`seg-btn${scope === o.key ? " on" : ""}`}
            onClick={() => setParam("scope", o.key)}
          >
            <BIcon name={o.icon} size={14} /> {scopeLabel(o.key, o.label)}
          </button>
        ))}
      </div>
      <div className="seg" role="group" aria-label="Period">
        {PERIOD_OPTS.map((o) => (
          <button
            key={o.key}
            type="button"
            className={`seg-btn${period === o.key ? " on" : ""}`}
            onClick={() => setParam("period", o.key)}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}
