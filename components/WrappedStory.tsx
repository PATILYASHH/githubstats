"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { toPng } from "html-to-image";
import type { GithubStats } from "@/lib/types";
import AnimatedNumber from "./AnimatedNumber";
import { DownloadIcon, LinkIcon } from "./icons";

interface Slide {
  bg: string;
  content: ReactNode;
}

function fmt(n: number) {
  return n.toLocaleString("en-US");
}

export default function WrappedStory({ stats }: { stats: GithubStats }) {
  const { user, contributions: c, languages, topRepos, rank } = stats;

  // Pick the most recent year that actually has contributions.
  const { year, yearTotal, busiestMonth, activeInYear } = useMemo(() => {
    const totals = new Map<string, number>();
    const monthTotals = new Map<string, number>();
    const activeByYear = new Map<string, number>();
    for (const d of c.days) {
      const y = d.date.slice(0, 4);
      totals.set(y, (totals.get(y) ?? 0) + d.count);
      if (d.count > 0)
        activeByYear.set(y, (activeByYear.get(y) ?? 0) + 1);
      const m = d.date.slice(0, 7);
      monthTotals.set(m, (monthTotals.get(m) ?? 0) + d.count);
    }
    const years = [...totals.keys()].sort();
    let chosen = years[years.length - 1] ?? `${new Date().getFullYear()}`;
    for (let i = years.length - 1; i >= 0; i--) {
      if ((totals.get(years[i]) ?? 0) > 0) {
        chosen = years[i];
        break;
      }
    }
    // busiest month within chosen year
    let bm: string | null = null;
    let max = 0;
    for (const [m, v] of monthTotals) {
      if (m.startsWith(chosen) && v > max) {
        max = v;
        const [yy, mm] = m.split("-");
        bm = new Date(Number(yy), Number(mm) - 1, 1).toLocaleDateString("en-US", {
          month: "long",
        });
      }
    }
    return {
      year: chosen,
      yearTotal: totals.get(chosen) ?? 0,
      busiestMonth: bm,
      activeInYear: activeByYear.get(chosen) ?? 0,
    };
  }, [c.days]);

  const topLang = languages[0];
  const topRepo = topRepos.items[0];

  const slides: Slide[] = [
    {
      bg: "linear-gradient(160deg,#1a1430,#0d1117)",
      content: (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="wr-avatar" src={user.avatarUrl} alt="" />
          <div className="wr-kicker">GitHub Wrapped</div>
          <div className="wr-big">{year}</div>
          <div className="wr-sub">Let&apos;s look back at your year, @{user.login} 👀</div>
        </>
      ),
    },
    {
      bg: "linear-gradient(160deg,#0d2818,#0d1117)",
      content: (
        <>
          <div className="wr-kicker">You made</div>
          <div className="wr-num" style={{ color: "#39d353" }}>
            <AnimatedNumber value={yearTotal} duration={1200} />
          </div>
          <div className="wr-sub">contributions in {year} 🎉</div>
        </>
      ),
    },
    {
      bg: "linear-gradient(160deg,#2a1f08,#0d1117)",
      content: (
        <>
          <div className="wr-kicker">Your busiest month was</div>
          <div className="wr-big" style={{ color: "#e3b341" }}>
            {busiestMonth ?? "—"}
          </div>
          <div className="wr-sub">🔥 You were on fire</div>
        </>
      ),
    },
    {
      bg: "linear-gradient(160deg,#0d1d33,#0d1117)",
      content: (
        <>
          <div className="wr-kicker">Your language of choice</div>
          <div className="wr-big" style={{ color: topLang?.color ?? "#58a6ff" }}>
            {topLang?.name ?? "—"}
          </div>
          <div className="wr-sub">
            {topLang ? `${topLang.percentage}% of your code` : "Polyglot mystery"}
          </div>
        </>
      ),
    },
    {
      bg: "linear-gradient(160deg,#2a0f0f,#0d1117)",
      content: (
        <>
          <div className="wr-kicker">Longest streak</div>
          <div className="wr-num" style={{ color: "#ff7b72" }}>
            <AnimatedNumber value={c.longestStreak} duration={1000} />
          </div>
          <div className="wr-sub">days in a row ⚡ ({fmt(activeInYear)} active days in {year})</div>
        </>
      ),
    },
    ...(topRepo
      ? [
          {
            bg: "linear-gradient(160deg,#1c0f2e,#0d1117)",
            content: (
              <>
                <div className="wr-kicker">Your top repository</div>
                <div className="wr-big" style={{ color: "#bc8cff" }}>
                  {topRepo.name.split("/").pop()}
                </div>
                <div className="wr-sub">{fmt(topRepo.contributions)} contributions 🏆</div>
              </>
            ),
          },
        ]
      : []),
    {
      bg: `linear-gradient(160deg,${rank.color}33,#0d1117)`,
      content: (
        <>
          <div className="wr-kicker">Your developer rank</div>
          <div className="wr-emoji">{rank.emoji}</div>
          <div className="wr-big" style={{ color: rank.color }}>
            {rank.title}
          </div>
          <div className="wr-sub">{rank.blurb}</div>
        </>
      ),
    },
  ];

  const lastIndex = slides.length; // summary is at index === slides.length
  const [i, setI] = useState(0);
  const isSummary = i === lastIndex;

  const next = () => setI((v) => Math.min(v + 1, lastIndex));
  const prev = () => setI((v) => Math.max(v - 1, 0));

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Summary share/download
  const summaryRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* ignore */
    }
  }
  async function download() {
    if (!summaryRef.current) return;
    try {
      const url = await toPng(summaryRef.current, {
        pixelRatio: 2,
        backgroundColor: "#0d1117",
      });
      const a = document.createElement("a");
      a.href = url;
      a.download = `${user.login}-wrapped-${year}.png`;
      a.click();
    } catch {
      /* ignore */
    }
  }

  const totalBars = lastIndex + 1;

  return (
    <div className="wrapped">
      <div className="wr-bars">
        {Array.from({ length: totalBars }).map((_, idx) => (
          <span key={idx} className={`wr-bar ${idx <= i ? "on" : ""}`} />
        ))}
      </div>

      <Link href={`/${user.login}`} className="wr-close" aria-label="Exit">
        ✕
      </Link>

      {!isSummary ? (
        <div className="wr-stage" style={{ background: slides[i].bg }}>
          <div className="wr-content" key={i}>
            {slides[i].content}
          </div>
        </div>
      ) : (
        <div className="wr-stage" style={{ background: "linear-gradient(160deg,#161b2e,#0d1117)" }}>
          <div className="wr-summary" ref={summaryRef}>
            <div className="wr-summary-head">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={user.avatarUrl} alt="" crossOrigin="anonymous" />
              <div>
                <div className="wr-summary-name">{user.name || user.login}</div>
                <div className="wr-summary-handle">GitHub Wrapped {year}</div>
              </div>
            </div>
            <div className="wr-summary-grid">
              <Sum v={fmt(yearTotal)} l="contributions" />
              <Sum v={`${c.longestStreak}d`} l="longest streak" />
              <Sum v={topLang?.name ?? "—"} l="top language" />
              <Sum v={busiestMonth ?? "—"} l="busiest month" />
            </div>
            <div className="wr-summary-rank" style={{ color: rank.color }}>
              {rank.emoji} {rank.title}
            </div>
            <div className="wr-summary-foot">githubstatss.vercel.app/{user.login}</div>
          </div>

          <div className="wr-actions" data-exclude="true">
            <button className="action-btn primary" onClick={copyLink}>
              <LinkIcon size={14} /> {copied ? "Copied!" : "Copy link"}
            </button>
            <button className="action-btn" onClick={download}>
              <DownloadIcon size={15} /> Download
            </button>
            <Link href={`/${user.login}`} className="action-btn">
              View profile →
            </Link>
          </div>
        </div>
      )}

      {/* tap zones */}
      {!isSummary && (
        <>
          <button className="wr-tap left" onClick={prev} aria-label="Previous" />
          <button className="wr-tap right" onClick={next} aria-label="Next" />
        </>
      )}
    </div>
  );
}

function Sum({ v, l }: { v: string; l: string }) {
  return (
    <div className="wr-sum">
      <div className="wr-sum-v">{v}</div>
      <div className="wr-sum-l">{l}</div>
    </div>
  );
}
