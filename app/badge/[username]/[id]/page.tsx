import type { Metadata } from "next";
import Link from "next/link";
import { getCoreStats, GithubError } from "@/lib/github";
import { getAchievement, RARITY_COLORS, ICON_EMOJI } from "@/lib/achievements";
import BadgeShare from "@/components/BadgeShare";

interface Props {
  params: Promise<{ username: string; id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username, id } = await params;
  const handle = decodeURIComponent(username);
  let title = `${handle}'s badge`;
  let description = `A GitHubStats achievement badge earned by ${handle}.`;
  try {
    const stats = await getCoreStats(handle);
    const a = getAchievement(stats, id);
    if (a) {
      title = `${handle} unlocked "${a.title}" 🏅`;
      description = `${a.title} — ${a.desc}. Earned by ${handle} on GitHubStats.`;
    }
  } catch {
    /* fall back to defaults */
  }
  return {
    title,
    description,
    openGraph: { title, description, type: "article" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function BadgePage({ params }: Props) {
  const { username, id } = await params;
  const handle = decodeURIComponent(username);

  let stats = null;
  let error: string | null = null;
  try {
    stats = await getCoreStats(handle);
  } catch (err) {
    error = err instanceof GithubError ? err.message : "Something went wrong.";
  }

  const achievement = stats ? getAchievement(stats, id) : undefined;

  return (
    <>
      <main className="container">
        {error || !achievement ? (
          <div className="page-error">
            <div className="page-error-emoji">🔍</div>
            <h2>{error || "Badge not found"}</h2>
            <Link href="/" className="btn">
              ← Back to search
            </Link>
          </div>
        ) : (
          <div className="badge-page">
            <BadgeSticker
              emoji={ICON_EMOJI[achievement.icon] ?? "🏅"}
              color={RARITY_COLORS[achievement.rarity].ring}
              glow={RARITY_COLORS[achievement.rarity].glow}
              locked={!achievement.unlocked}
            />
            <div className="badge-page-rarity" style={{ color: RARITY_COLORS[achievement.rarity].ring }}>
              {achievement.rarity} badge
            </div>
            <h1 className="badge-page-title">{achievement.title}</h1>
            <p className="badge-page-desc">{achievement.desc}</p>
            {achievement.unlocked ? (
              <p className="badge-page-by">
                Unlocked by{" "}
                <Link href={`/${handle}`}>
                  <strong>@{handle}</strong>
                </Link>{" "}
                {stats && (
                  <img
                    className="badge-page-avatar"
                    src={stats.user.avatarUrl}
                    alt=""
                  />
                )}
              </p>
            ) : (
              <p className="badge-page-by">
                <strong>@{handle}</strong> is{" "}
                {Math.round((achievement.current / achievement.target) * 100)}% of
                the way there ({achievement.current.toLocaleString("en-US")}/
                {achievement.target.toLocaleString("en-US")})
              </p>
            )}

            <BadgeShare title={achievement.title} />

            <Link href={`/${handle}`} className="badge-page-profile">
              View full profile →
            </Link>
          </div>
        )}
      </main>
      <footer className="footer">
        <p>
          <Link href="/">GitHubStats</Link> · collect &amp; share your dev badges
        </p>
      </footer>
    </>
  );
}

function BadgeSticker({
  emoji,
  color,
  glow,
  locked,
}: {
  emoji: string;
  color: string;
  glow: string;
  locked: boolean;
}) {
  return (
    <div
      className="badge-page-sticker"
      style={{
        background: `conic-gradient(${color}, #ffffff66, ${color})`,
        boxShadow: `0 0 60px ${glow}`,
        opacity: locked ? 0.5 : 1,
        filter: locked ? "grayscale(0.7)" : "none",
      }}
    >
      <div className="badge-page-core">
        <span style={{ fontSize: 72 }}>{locked ? "🔒" : emoji}</span>
      </div>
    </div>
  );
}
