"use client";

import type { GithubStats } from "@/lib/types";
import { computePersonality } from "@/lib/personality";
import ShareCard from "./ShareCard";
import { StarsIcon } from "./icons";

export default function PersonalityCard({ stats }: { stats: GithubStats }) {
  const p = computePersonality(stats);
  return (
    <ShareCard
      title="Coding personality"
      icon={<StarsIcon />}
      filename={`${stats.user.login}-personality`}
      className="span-all"
    >
      <div className="persona">
        <div className="persona-emoji" style={{ background: `${p.color}22` }}>
          {p.emoji}
        </div>
        <div className="persona-main">
          <div className="persona-type" style={{ color: p.color }}>
            {p.type}
          </div>
          <div className="persona-tag">{p.tagline}</div>
        </div>
      </div>
      <div className="persona-traits">
        {p.traits.map((t) => (
          <div className="persona-trait" key={t.label}>
            <span className="persona-trait-l">{t.label}</span>
            <span className="persona-trait-bar">
              <span
                className="persona-trait-fill animate-bar"
                style={{ width: `${t.value}%`, background: p.color }}
              />
            </span>
            <span className="persona-trait-v">{t.value}</span>
          </div>
        ))}
      </div>
    </ShareCard>
  );
}
