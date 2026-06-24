"use client";

import { useState } from "react";
import type { GithubStats } from "@/lib/types";
import { getAchievements, RARITY_COLORS } from "@/lib/achievements";
import { getIcon, ShareIcon, CheckIcon, TrophyIcon } from "./icons";
import ShareCard from "./ShareCard";

export default function Achievements({ stats }: { stats: GithubStats }) {
  const all = getAchievements(stats);
  const unlocked = all.filter((a) => a.unlocked);
  const [copied, setCopied] = useState<string | null>(null);

  async function shareBadge(id: string, title: string) {
    const url = `${window.location.origin}/badge/${stats.user.login}/${id}`;
    const navAny = navigator as Navigator;
    if (navAny.share) {
      try {
        await navAny.share({ title: `${title} — GitHubStats badge`, url });
        return;
      } catch {
        /* dismissed → fall through to copy */
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(id);
      setTimeout(() => setCopied((c) => (c === id ? null : c)), 1600);
    } catch {
      /* ignore */
    }
  }

  return (
    <ShareCard
      title={`Achievements · ${unlocked.length}/${all.length} unlocked`}
      icon={<TrophyIcon />}
      filename={`${stats.user.login}-achievements`}
      className="span-all"
    >
      {unlocked.length === 0 ? (
        <p className="repos-sub">No badges yet — start contributing to unlock them!</p>
      ) : (
        <div className="sticker-grid">
          {unlocked.map((a) => {
            const Ico = getIcon(a.icon);
            const col = RARITY_COLORS[a.rarity];
            return (
              <div className="sticker" key={a.id} title={a.desc}>
                <div
                  className="sticker-ring"
                  style={{
                    background: `conic-gradient(${col.ring}, #fff6, ${col.ring})`,
                    boxShadow: `0 0 22px ${col.glow}`,
                  }}
                >
                  <div className="sticker-core" style={{ color: col.ring }}>
                    <Ico size={30} />
                  </div>
                  <span className="sticker-check" style={{ color: col.ring }}>
                    <CheckIcon size={16} />
                  </span>
                </div>
                <div className="sticker-title">{a.title}</div>
                <div className="sticker-rarity" style={{ color: col.ring }}>
                  {a.rarity}
                </div>
                <button
                  className="sticker-share"
                  data-exclude="true"
                  onClick={() => shareBadge(a.id, a.title)}
                  aria-label={`Share ${a.title} badge`}
                >
                  <ShareIcon size={11} />
                  {copied === a.id ? "Copied!" : "Share"}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </ShareCard>
  );
}
