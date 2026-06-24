import { ImageResponse } from "next/og";
import { getCoreStats } from "@/lib/github";
import { getAchievement, RARITY_COLORS, ICON_EMOJI } from "@/lib/achievements";

export const runtime = "nodejs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "GitHubStats achievement badge";

export default async function Image({
  params,
}: {
  params: Promise<{ username: string; id: string }>;
}) {
  const { username, id } = await params;
  const handle = decodeURIComponent(username);

  let achievement = null;
  let avatar: string | null = null;
  try {
    const stats = await getCoreStats(handle);
    achievement = getAchievement(stats, id);
    avatar = stats.user.avatarUrl;
  } catch {
    achievement = null;
  }

  const color = achievement ? RARITY_COLORS[achievement.rarity].ring : "#39d353";
  const emoji = achievement ? ICON_EMOJI[achievement.icon] ?? "🏅" : "🏅";
  const title = achievement?.title ?? "Achievement";
  const rarity = achievement?.rarity ?? "";
  const unlocked = achievement?.unlocked ?? false;

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
          background: "radial-gradient(circle at 50% 35%, #1a2030 0%, #0d1117 70%)",
          color: "#e6edf3",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 230,
            height: 230,
            borderRadius: 130,
            border: `10px solid ${color}`,
            background: "#0d1117",
            boxShadow: `0 0 80px ${color}`,
            opacity: unlocked ? 1 : 0.6,
          }}
        >
          <div style={{ display: "flex", fontSize: 120 }}>
            {unlocked ? emoji : "🔒"}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            marginTop: 30,
            fontSize: 26,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: 4,
            color,
          }}
        >
          {rarity} badge
        </div>
        <div style={{ display: "flex", marginTop: 8, fontSize: 64, fontWeight: 800 }}>
          {title}
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            marginTop: 18,
            fontSize: 30,
            color: "#8b949e",
          }}
        >
          {avatar && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatar}
              width={44}
              height={44}
              style={{ borderRadius: 22, marginRight: 14 }}
              alt=""
            />
          )}
          {unlocked ? "unlocked by" : "in progress ·"} @{handle}
        </div>

        <div
          style={{
            display: "flex",
            position: "absolute",
            bottom: 36,
            fontSize: 24,
            color: "#8b949e",
          }}
        >
          📊 githubstatss.vercel.app
        </div>
      </div>
    ),
    { ...size }
  );
}
