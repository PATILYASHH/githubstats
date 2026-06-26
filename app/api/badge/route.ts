import { renderBadge } from "@/lib/cards/badge";

export const runtime = "nodejs";

// Self-hosted badge endpoint — replaces shields.io for the README's tech-stack
// and social badges. ?message=Label&color=hex&logo=brand&logoColor=hex
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const message = searchParams.get("message") || searchParams.get("label") || "badge";
  const color = (searchParams.get("color") || "555555").replace(/^#/, "");
  const logo = searchParams.get("logo") || undefined;
  const logoColor = searchParams.get("logoColor") || undefined;

  const body = renderBadge({ message, color, logo, logoColor });
  return new Response(body, {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "public, max-age=86400, s-maxage=86400, immutable",
    },
  });
}
