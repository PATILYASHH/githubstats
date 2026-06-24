import { ImageResponse } from "next/og";
import { getCoreStats } from "@/lib/github";
import { LEVEL_COLORS } from "@/lib/colors";

export const runtime = "nodejs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "GitHub stats card";

function fmt(n: number) {
  return n.toLocaleString("en-US");
}

export default async function Image({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const handle = decodeURIComponent(username);

  let stats = null;
  try {
    stats = await getCoreStats(handle);
  } catch {
    stats = null;
  }

  const bg = "#0d1117";

  if (!stats) {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: bg,
            color: "#e6edf3",
            fontSize: 56,
            fontWeight: 800,
          }}
        >
          <div style={{ display: "flex" }}>📊 GitHubStats</div>
          <div style={{ display: "flex", fontSize: 28, color: "#8b949e", marginTop: 16 }}>
            githubstatss.vercel.app
          </div>
        </div>
      ),
      { ...size }
    );
  }

  const { user, contributions: c, rank } = stats;
  const recent = c.days.slice(-7 * 26); // ~26 weeks for a strip

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "linear-gradient(135deg, #0d1117 0%, #161b2e 100%)",
          color: "#e6edf3",
          padding: 64,
          fontFamily: "sans-serif",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={user.avatarUrl}
            width={140}
            height={140}
            style={{ borderRadius: 70, border: "3px solid #30363d" }}
            alt=""
          />
          <div style={{ display: "flex", flexDirection: "column", marginLeft: 32 }}>
            <div style={{ display: "flex", fontSize: 54, fontWeight: 800 }}>
              {user.name || user.login}
            </div>
            <div style={{ display: "flex", fontSize: 30, color: "#8b949e", marginTop: 4 }}>
              @{user.login}
            </div>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              marginLeft: "auto",
              border: `3px solid ${rank.color}`,
              borderRadius: 18,
              padding: "14px 24px",
            }}
          >
            <div style={{ display: "flex", fontSize: 48, marginRight: 14 }}>
              {rank.emoji}
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", fontSize: 30, fontWeight: 700, color: rank.color }}>
                {rank.title}
              </div>
              <div style={{ display: "flex", fontSize: 22, color: "#8b949e" }}>
                Level {rank.level}
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: "flex", marginTop: 56 }}>
          {[
            { v: fmt(c.total), l: "contributions", color: "#39d353" },
            { v: `${c.currentStreak}d`, l: "current streak", color: "#e6edf3" },
            { v: `${c.longestStreak}d`, l: "longest streak", color: "#e6edf3" },
            { v: fmt(stats.totalStars), l: "stars", color: "#e3b341" },
          ].map((s) => (
            <div
              key={s.l}
              style={{ display: "flex", flexDirection: "column", marginRight: 72 }}
            >
              <div style={{ display: "flex", fontSize: 64, fontWeight: 800, color: s.color }}>
                {s.v}
              </div>
              <div style={{ display: "flex", fontSize: 26, color: "#8b949e" }}>
                {s.l}
              </div>
            </div>
          ))}
        </div>

        {/* Heatmap strip */}
        <div style={{ display: "flex", flexWrap: "wrap", width: 1072, marginTop: 48, gap: 4 }}>
          {recent.map((d, i) => (
            <div
              key={i}
              style={{
                width: 14,
                height: 14,
                borderRadius: 3,
                background: LEVEL_COLORS[d.level],
              }}
            />
          ))}
        </div>

        {/* Footer */}
        <div style={{ display: "flex", alignItems: "center", marginTop: "auto" }}>
          <div style={{ display: "flex", fontSize: 28, fontWeight: 700 }}>
            📊 GitHubStats
          </div>
          <div style={{ display: "flex", fontSize: 26, color: "#8b949e", marginLeft: "auto" }}>
            githubstatss.vercel.app/{user.login}
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
