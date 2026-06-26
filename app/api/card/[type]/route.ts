import { getCoreStats, getRepoCard, GithubError } from "@/lib/github";
import { renderStatsCard } from "@/lib/cards/stats";
import { renderStreakCard } from "@/lib/cards/streak";
import { renderTopLangsCard } from "@/lib/cards/langs";
import { renderActivityCard } from "@/lib/cards/activity";
import { renderTrophyCard } from "@/lib/cards/trophies";
import { renderPinCard } from "@/lib/cards/pin";
import { renderHeader } from "@/lib/cards/header";
import { errorCard } from "@/lib/cards/svg";

export const runtime = "nodejs";

function svg(body: string, status = 200): Response {
  return new Response(body, {
    status,
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      // GitHub proxies (camo) cache aggressively; keep it fresh-ish but cheap.
      "Cache-Control":
        "public, max-age=1800, s-maxage=1800, stale-while-revalidate=86400",
    },
  });
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ type: string }> }
) {
  const { type } = await params;
  const { searchParams } = new URL(request.url);
  const theme = searchParams.get("theme") ?? undefined;

  try {
    // Header is text-only — no GitHub fetch needed.
    if (type === "header") {
      const text = searchParams.get("text") || "Hello 👋";
      return svg(renderHeader(text, theme));
    }

    if (type === "pin") {
      const username = searchParams.get("username");
      const repo = searchParams.get("repo");
      if (!username || !repo) {
        return svg(errorCard("Missing username or repo."), 400);
      }
      const data = await getRepoCard(username, repo);
      return svg(renderPinCard(data, theme));
    }

    const username = searchParams.get("username");
    if (!username) return svg(errorCard("Missing ?username."), 400);

    const stats = await getCoreStats(username);

    switch (type) {
      case "stats":
        return svg(renderStatsCard(stats, theme));
      case "streak":
        return svg(renderStreakCard(stats, theme));
      case "top-langs":
        return svg(renderTopLangsCard(stats, theme));
      case "activity":
        return svg(renderActivityCard(stats, theme));
      case "trophies":
        return svg(renderTrophyCard(stats, theme));
      default:
        return svg(errorCard(`Unknown card type "${type}".`), 404);
    }
  } catch (err) {
    const msg =
      err instanceof GithubError ? err.message : "Something went wrong.";
    // Return a styled SVG (200) so the README shows the reason, not a broken image.
    return svg(errorCard(msg));
  }
}
