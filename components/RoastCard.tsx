"use client";

import { useState } from "react";
import type { GithubStats } from "@/lib/types";
import { getRoasts, getHypes } from "@/lib/roast";
import ShareCard from "./ShareCard";
import { FireIcon, HeartIcon } from "./icons";

export default function RoastCard({ stats }: { stats: GithubStats }) {
  const [mode, setMode] = useState<"roast" | "hype">("roast");
  const lines = mode === "roast" ? getRoasts(stats) : getHypes(stats);

  return (
    <ShareCard
      title={mode === "roast" ? "Roast me" : "Hype me"}
      icon={mode === "roast" ? <FireIcon /> : <HeartIcon />}
      filename={`${stats.user.login}-${mode}`}
      className="span-all"
    >
      <div className="breakdown-tabs" data-exclude="true">
        <button
          className={`breakdown-tab ${mode === "roast" ? "active" : ""}`}
          onClick={() => setMode("roast")}
        >
          🔥 Roast
        </button>
        <button
          className={`breakdown-tab ${mode === "hype" ? "active" : ""}`}
          onClick={() => setMode("hype")}
        >
          💪 Hype
        </button>
      </div>
      <ul className="roast-list">
        {lines.map((l, i) => (
          <li className="roast-line" key={i}>
            <span className="roast-bullet" style={{ color: mode === "roast" ? "#ff7b72" : "#39d353" }}>
              {mode === "roast" ? "🔥" : "✨"}
            </span>
            {l}
          </li>
        ))}
      </ul>
    </ShareCard>
  );
}
