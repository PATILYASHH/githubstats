// Identity of this project's own GitHub repo. Kept dependency-free so it's safe
// to import from both server code (lib/github.ts) and client code (NavBar).
export const GITHUB_REPO = "PATILYASHH/githubstats";
export const GITHUB_REPO_URL = `https://github.com/${GITHUB_REPO}`;

// Canonical production origin — used for metadata, sitemap, robots and manifest.
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://githubstatss.vercel.app";
export const SITE_NAME = "GitHubStats";
export const AUTHOR = "Yash Patil";
