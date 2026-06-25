import type { Metadata } from "next";
import Link from "next/link";
import { getGithubStats, GithubError } from "@/lib/github";
import Dashboard from "@/components/Dashboard";

interface Props {
  params: Promise<{ username: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  const handle = decodeURIComponent(username);
  const title = `${handle}'s GitHub stats`;
  const description = `${handle}'s GitHub contributions, streaks, dev rank, top languages and more — on GitHubStats.`;
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `/${handle}`,
      type: "profile",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function UserPage({ params }: Props) {
  const { username } = await params;
  const handle = decodeURIComponent(username);

  let stats = null;
  let error: string | null = null;
  try {
    stats = await getGithubStats(handle);
  } catch (err) {
    error =
      err instanceof GithubError ? err.message : "Something went wrong.";
  }

  return (
    <>
      <main className="container">
        {error ? (
          <div className="page-error">
            <div className="page-error-emoji">🔍</div>
            <h2>{error}</h2>
            <p>Double-check the username and try again.</p>
            <Link href="/" className="btn">
              ← Back to search
            </Link>
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
          · <Link href="/compare">Compare developers</Link>
        </p>
      </footer>
    </>
  );
}
