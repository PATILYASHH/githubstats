import type { Metadata } from "next";
import Link from "next/link";
import { getGithubStats, GithubError } from "@/lib/github";
import Dashboard from "@/components/Dashboard";
import Landing from "@/components/Landing";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";

export const metadata: Metadata = {
  // Absolute: the home page is the brand title, not "Home · GitHubStats".
  title: {
    absolute:
      "GitHubStats — GitHub Stats Tracker, Profile README Generator & Dev Games",
  },
  description:
    "See any GitHub profile's contributions, streaks, dev rank and top languages, generate a personalized profile README, and compete in games built on real activity.",
  alternates: { canonical: "/" },
};

export const dynamic = "force-dynamic";

export default async function Home() {
  // Signed-in users see their own dashboard; guests get the landing page.
  let login: string | undefined;
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    login = (user?.user_metadata?.user_name ??
      user?.user_metadata?.preferred_username) as string | undefined;
  }

  if (!login) return <Landing />;

  let stats = null;
  let error: string | null = null;
  try {
    stats = await getGithubStats(login);
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
            <p>We couldn&apos;t load your GitHub stats right now.</p>
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
          · <Link href="/compare">Compare</Link> · <Link href="/games">Games</Link>
        </p>
      </footer>
    </>
  );
}
