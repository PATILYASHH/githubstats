"use client";

import type { GithubStats } from "@/lib/types";
import { getAchievements } from "@/lib/achievements";
import ShareCard from "./ShareCard";

export default function Achievements({ stats }: { stats: GithubStats }) {
  const list = getAchievements(stats);
  const unlockedCount = list.filter((a) => a.unlocked).length;

  return (
    <ShareCard
      title={`Achievements · ${unlockedCount}/${list.length}`}
      icon={<span>🏅</span>}
      filename={`${stats.user.login}-achievements`}
      className="span-all"
    >
      <div className="badge-grid">
        {list.map((a) => (
          <div
            key={a.id}
            className={`badge ${a.unlocked ? "unlocked" : "locked"}`}
            title={a.desc}
          >
            <span className="badge-icon">{a.unlocked ? a.icon : "🔒"}</span>
            <span className="badge-title">{a.title}</span>
            <span className="badge-desc">{a.desc}</span>
          </div>
        ))}
      </div>
    </ShareCard>
  );
}
