import { getCoreStats } from "@/lib/github";
import { renderCardSVG, errorCardSVG } from "@/lib/svgCard";

export const runtime = "nodejs";

interface Ctx {
  params: Promise<{ username: string }>;
}

export async function GET(request: Request, { params }: Ctx) {
  const { username } = await params;
  const handle = decodeURIComponent(username).replace(/\.svg$/i, "");
  const theme = new URL(request.url).searchParams.get("theme") ?? "dark";

  try {
    const stats = await getCoreStats(handle);
    const svg = renderCardSVG(stats, theme);
    return new Response(svg, {
      headers: {
        "Content-Type": "image/svg+xml; charset=utf-8",
        // README images are proxied by GitHub's camo — keep it fresh-ish.
        "Cache-Control":
          "public, max-age=1800, s-maxage=1800, stale-while-revalidate=86400",
      },
    });
  } catch {
    return new Response(errorCardSVG(handle), {
      status: 200,
      headers: {
        "Content-Type": "image/svg+xml; charset=utf-8",
        "Cache-Control": "public, max-age=300",
      },
    });
  }
}
