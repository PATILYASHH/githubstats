"use client";

import type { GithubStats } from "@/lib/types";
import { getAchievements, RARITY_COLORS } from "@/lib/achievements";
import { getIcon, BullseyeIcon } from "./icons";
import ShareCard from "./ShareCard";

function fmt(n: number) {
  return n.toLocaleString("en-US");
}

export default function Missions({ stats }: { stats: GithubStats }) {
  // Show the closest-to-complete locked achievements as active missions.
  const missions = getAchievements(stats)
    .filter((a) => !a.unlocked)
    .slice(0, 6);

  if (missions.length === 0) {
    return (
      <ShareCard
        title="Missions"
        icon={<BullseyeIcon />}
        filename={`${stats.user.login}-missions`}
        className="span-all"
      >
        <p className="repos-sub">🎉 Every achievement unlocked — you legend!</p>
      </ShareCard>
    );
  }

  return (
    <ShareCard
      title="Missions · next goals"
      icon={<BullseyeIcon />}
      filename={`${stats.user.login}-missions`}
      className="span-all"
    >
      <div className="mission-list">
        {missions.map((m) => {
          const Ico = getIcon(m.icon);
          const col = RARITY_COLORS[m.rarity];
          const pct = Math.min((m.current / m.target) * 100, 100);
          return (
            <div className="mission" key={m.id}>
              <div className="mission-icon" style={{ color: col.ring }}>
                <Ico size={22} />
              </div>
              <div className="mission-body">
                <div className="mission-head">
                  <span className="mission-title">{m.title}</span>
                  <span className="mission-prog">
                    {fmt(m.current)} / {fmt(m.target)}
                  </span>
                </div>
                <div className="mission-desc">{m.desc}</div>
                <div className="mission-track">
                  <div
                    className="mission-fill animate-bar"
                    style={{ width: `${pct}%`, background: col.ring }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </ShareCard>
  );
}
