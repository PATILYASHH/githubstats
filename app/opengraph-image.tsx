import { ImageResponse } from "next/og";

export const runtime = "nodejs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "GitHubStats — Showcase your GitHub story";

// Branded card for the landing page.
export default function Image() {
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
          background: "linear-gradient(135deg, #0d1117 0%, #161b2e 100%)",
          color: "#e6edf3",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", fontSize: 96 }}>📊</div>
        <div style={{ display: "flex", fontSize: 76, fontWeight: 800, marginTop: 12 }}>
          GitHubStats
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 34,
            color: "#8b949e",
            marginTop: 18,
            textAlign: "center",
            maxWidth: 880,
          }}
        >
          Showcase your GitHub story — contributions, streaks, rank & games
        </div>
        <div style={{ display: "flex", fontSize: 26, color: "#39d353", marginTop: 36 }}>
          githubstatss.vercel.app
        </div>
      </div>
    ),
    { ...size }
  );
}
