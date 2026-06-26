import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/constants";

// Static, crawlable routes. Dynamic /[username] pages are effectively infinite,
// so they're left out — Google discovers them via links and the WebSite
// SearchAction in the layout's structured data.
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const entries: { path: string; priority: number; freq: MetadataRoute.Sitemap[number]["changeFrequency"] }[] = [
    { path: "", priority: 1, freq: "daily" },
    { path: "/readme", priority: 0.9, freq: "weekly" },
    { path: "/games", priority: 0.8, freq: "weekly" },
    { path: "/compare", priority: 0.8, freq: "weekly" },
    { path: "/games/streak", priority: 0.7, freq: "weekly" },
    { path: "/games/league", priority: 0.7, freq: "weekly" },
    { path: "/games/challenges", priority: 0.7, freq: "weekly" },
    { path: "/games/duel", priority: 0.6, freq: "weekly" },
    { path: "/games/city", priority: 0.6, freq: "weekly" },
  ];
  return entries.map((e) => ({
    url: `${SITE_URL}${e.path}`,
    lastModified: now,
    changeFrequency: e.freq,
    priority: e.priority,
  }));
}
