import type { Metadata } from "next";
import Link from "next/link";
import { getGithubStats, GithubError } from "@/lib/github";
import Dashboard from "@/components/Dashboard";
import { DEFAULT_USER } from "@/lib/config";

const description = `${DEFAULT_USER}'s GitHub contributions, streaks, dev rank, top languages and more. Search any other developer from the top bar.`;

export const metadata: Metadata = {
  title: `${DEFAULT_USER}'s GitHub stats`,
  description,
  alternates: { canonical: "/" },
  openGraph: {
    title: `${DEFAULT_USER}'s GitHub stats`,
    description,
    url: "/",
    type: "profile",
  },
  twitter: {
    card: "summary_large_image",
    title: `${DEFAULT_USER}'s GitHub stats`,
    description,
  },
};

// Render on demand (like /[username]) so we never prerender stale stats.
export const dynamic = "force-dynamic";

const EXAMPLES = ["torvalds", "gaearon", "sindresorhus"];

export default async function Home() {
  let stats = null;
  let error: string | null = null;
  try {
    stats = await getGithubStats(DEFAULT_USER);
  } catch (err) {
    error = err instanceof GithubError ? err.message : "Something went wrong.";
  }

  return (
    <>
      <main className="container">
        {error ? (
          <div className="page-error">
            <div className="page-error-emoji">⚠️</div>
            <h2>{error}</h2>
            <p>Try another developer — search in the top bar, or pick one:</p>
            <div className="examples">
              {EXAMPLES.map((ex, i) => (
                <span key={ex}>
                  <Link href={`/${ex}`}>{ex}</Link>
                  {i < EXAMPLES.length - 1 ? " · " : ""}
                </span>
              ))}
            </div>
          </div>
        ) : (
          stats && <Dashboard stats={stats} />
        )}
      </main>
      <footer className="footer">
        <p>
          Built with Next.js · Open source on{" "}
          <a
            href="https://github.com/PATILYASHH/githubstats"
            target="_blank"
            rel="noreferrer"
          >
            GitHub
          </a>{" "}
          · <Link href="/compare">Compare developers</Link> ·{" "}
          <Link href="/games">Games</Link>
        </p>
      </footer>
    </>
  );
}
