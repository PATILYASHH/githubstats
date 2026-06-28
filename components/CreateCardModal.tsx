"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { toPng } from "html-to-image";
import type { GithubStats } from "@/lib/types";
import { getAchievements, RARITY_COLORS } from "@/lib/achievements";
import { availableYears, computeYearStats, ALL_TIME } from "@/lib/yearStats";
import MiniHeatmap from "./MiniHeatmap";
import { getIcon, DownloadIcon, ShareIcon, CloseIcon } from "./icons";

function fmt(n: number) {
  return n.toLocaleString("en-US");
}

function shortDay(iso: string) {
  return new Date(iso + "T00:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export default function CreateCardModal({
  stats,
  onClose,
}: {
  stats: GithubStats;
  onClose: () => void;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [img, setImg] = useState<string | null>(null);
  const [error, setError] = useState(false);

  const { user, contributions: c, rank } = stats;
  const badges = getAchievements(stats).filter((a) => a.unlocked).slice(0, 12);

  // Year picker — defaults to the most recent year so the card opens on the
  // current year's streak report, with an "All time" fallback.
  const years = useMemo(() => availableYears(c.days), [c.days]);
  const [scope, setScope] = useState<string>(years[0] ?? ALL_TIME);
  const ys = useMemo(() => computeYearStats(c.days, scope), [c.days, scope]);

  const STATS = ys.isAll
    ? [
        { v: fmt(ys.total), l: "contributions" },
        { v: `${ys.longestStreak}d`, l: "longest streak" },
        { v: `${ys.activePct}%`, l: "active rate" },
        { v: fmt(stats.totalStars), l: "stars" },
        { v: fmt(user.followers), l: "followers" },
        { v: fmt(user.publicRepos), l: "repos" },
      ]
    : [
        { v: fmt(ys.total), l: "contributions" },
        { v: `${ys.longestStreak}d`, l: "biggest streak" },
        { v: `${ys.activePct}%`, l: "active rate" },
        { v: fmt(ys.activeDays), l: "active days" },
        { v: `${ys.busiestDay?.count ?? 0}`, l: "best day" },
        ys.isCurrentYear
          ? { v: `${ys.currentStreak}d`, l: "current streak" }
          : { v: `${ys.avgPerActiveDay}`, l: "avg / active day" },
      ];

  // Render the hidden card to a PNG once it's mounted (and on every year change).
  useEffect(() => {
    let active = true;
    setImg(null);
    setError(false);
    const gen = async () => {
      if (!cardRef.current) return;
      try {
        const imgs = Array.from(cardRef.current.querySelectorAll("img"));
        await Promise.all(
          imgs.map((im) =>
            im.complete
              ? Promise.resolve()
              : new Promise((r) => {
                  im.onload = r;
                  im.onerror = r;
                })
          )
        );
        const url = await toPng(cardRef.current, {
          pixelRatio: 2,
          cacheBust: true,
          backgroundColor: "#0d1117",
        });
        if (active) setImg(url);
      } catch (e) {
        console.error("card generation failed", e);
        if (active) setError(true);
      }
    };
    const t = setTimeout(gen, 100);
    return () => {
      active = false;
      clearTimeout(t);
    };
  }, [scope]);

  // Close on Escape.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const filename = `${user.login}-githubstats-${ys.isAll ? "all-time" : ys.year}-card.png`;

  function download() {
    if (!img) return;
    const a = document.createElement("a");
    a.href = img;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  async function share() {
    if (!img) return;
    try {
      const blob = await (await fetch(img)).blob();
      const file = new File([blob], filename, { type: "image/png" });
      const navAny = navigator as Navigator & {
        canShare?: (d?: ShareData) => boolean;
      };
      if (navAny.share && navAny.canShare && navAny.canShare({ files: [file] })) {
        await navAny.share({
          files: [file],
          title: `${user.login}'s GitHub ${ys.isAll ? "stats" : `${ys.year} streak`} card`,
          text: "Made with githubstatss.vercel.app",
        });
        return;
      }
      download();
    } catch (e) {
      if ((e as Error)?.name !== "AbortError") download();
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <span>Your shareable card</span>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            <CloseIcon size={16} />
          </button>
        </div>

        {years.length > 0 && (
          <div className="modal-toolbar">
            <label htmlFor="card-year" className="modal-toolbar-label">
              📅 Period
            </label>
            <select
              id="card-year"
              className="year-select"
              value={scope}
              onChange={(e) => setScope(e.target.value)}
              aria-label="Select year for the card"
            >
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
              <option value={ALL_TIME}>All time</option>
            </select>
          </div>
        )}

        <div className="modal-body">
          {error ? (
            <div className="modal-error">
              Couldn&apos;t generate the image. Please try again.
            </div>
          ) : img ? (
            <img className="modal-preview" src={img} alt="Shareable GitHub stats card" />
          ) : (
            <div className="modal-loading">
              <div className="spinner" />
              <span>Generating your card…</span>
            </div>
          )}
        </div>

        <div className="modal-actions">
          <button className="action-btn" onClick={download} disabled={!img}>
            <DownloadIcon size={15} /> Download
          </button>
          <button className="action-btn primary" onClick={share} disabled={!img}>
            <ShareIcon size={14} /> Share
          </button>
        </div>
      </div>

      {/* Hidden capture target — laid out off-screen. */}
      <div className="capture-holder" aria-hidden="true">
        <div className="showcase-card" ref={cardRef}>
          <div className="showcase-head">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              className="showcase-avatar"
              src={user.avatarUrl}
              alt=""
              crossOrigin="anonymous"
            />
            <div className="showcase-id">
              <div className="showcase-name">{user.name || user.login}</div>
              <div className="showcase-handle">@{user.login}</div>
            </div>
            <div className="showcase-rank" style={{ borderColor: rank.color }}>
              <span style={{ fontSize: 26 }}>{rank.emoji}</span>
              <span className="showcase-rank-title" style={{ color: rank.color }}>
                {rank.title}
              </span>
            </div>
          </div>

          <div className="showcase-period">
            {ys.isAll
              ? "📊 All-time stats"
              : `🔥 ${ys.year} streak report${ys.isCurrentYear ? " · year to date" : ""}`}
          </div>

          <div className="showcase-stats">
            {STATS.map((s) => (
              <div className="showcase-stat" key={s.l}>
                <div className="showcase-stat-v">{s.v}</div>
                <div className="showcase-stat-l">{s.l}</div>
              </div>
            ))}
          </div>

          <div className="showcase-heatmap">
            <MiniHeatmap
              days={ys.days}
              weeks={ys.isAll ? 32 : 53}
              cell={ys.isAll ? undefined : 8}
            />
          </div>

          {!ys.isAll && (
            <div className="showcase-highlights">
              <div className="showcase-hl">
                <span className="showcase-hl-ico">🔥</span>
                <span className="showcase-hl-text">
                  <b>{ys.longestStreak}-day</b> biggest streak
                  {ys.longestStart && ys.longestEnd && (
                    <span className="showcase-hl-dim">
                      {" "}
                      · {shortDay(ys.longestStart)} – {shortDay(ys.longestEnd)}
                    </span>
                  )}
                </span>
              </div>
              {ys.bestMonth && (
                <div className="showcase-hl">
                  <span className="showcase-hl-ico">📈</span>
                  <span className="showcase-hl-text">
                    <b>{ys.bestMonth.label}</b> was the busiest month
                    <span className="showcase-hl-dim"> · {fmt(ys.bestMonth.count)} contributions</span>
                  </span>
                </div>
              )}
              {ys.busiestDay && (
                <div className="showcase-hl">
                  <span className="showcase-hl-ico">⭐</span>
                  <span className="showcase-hl-text">
                    <b>{ys.busiestDay.count}</b> on the best day
                    <span className="showcase-hl-dim"> · {shortDay(ys.busiestDay.date)}</span>
                  </span>
                </div>
              )}
            </div>
          )}

          {ys.isAll && badges.length > 0 && (
            <>
              <div className="showcase-badges-title">
                🏅 {badges.length} achievement{badges.length === 1 ? "" : "s"} unlocked
              </div>
              <div className="showcase-badges">
                {badges.map((b) => {
                  const Ico = getIcon(b.icon);
                  const col = RARITY_COLORS[b.rarity];
                  return (
                    <div className="showcase-badge" key={b.id} title={b.title}>
                      <div
                        className="showcase-badge-ring"
                        style={{ background: `conic-gradient(${col.ring}, #ffffff55, ${col.ring})` }}
                      >
                        <div className="showcase-badge-core" style={{ color: col.ring }}>
                          <Ico size={20} />
                        </div>
                      </div>
                      <span className="showcase-badge-label">{b.title}</span>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          <div className="showcase-foot">
            <span>📊 GitHubStats</span>
            <span>githubstatss.vercel.app/{user.login}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
