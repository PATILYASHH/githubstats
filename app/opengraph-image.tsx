import { renderStatsOgImage } from "@/lib/og";
import { DEFAULT_USER } from "@/lib/config";

export const runtime = "nodejs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "GitHub stats card";

// OG card for the home page — the site's featured developer.
export default async function Image() {
  return renderStatsOgImage(DEFAULT_USER);
}
