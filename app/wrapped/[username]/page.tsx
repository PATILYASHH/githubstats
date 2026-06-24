import type { Metadata } from "next";
import Link from "next/link";
import { getGithubStats, GithubError } from "@/lib/github";
import WrappedStory from "@/components/WrappedStory";

interface Props {
  params: Promise<{ username: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  const handle = decodeURIComponent(username);
  const title = `${handle}'s GitHub Wrapped`;
  const description = `${handle}'s year on GitHub, wrapped — contributions, top language, streaks and more.`;
  return {
    title,
    description,
    openGraph: { title, description, type: "article" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function WrappedPage({ params }: Props) {
  const { username } = await params;
  const handle = decodeURIComponent(username);

  let stats = null;
  let error: string | null = null;
  try {
    stats = await getGithubStats(handle);
  } catch (err) {
    error = err instanceof GithubError ? err.message : "Something went wrong.";
  }

  if (error || !stats) {
    return (
      <main className="container">
        <div className="page-error">
          <div className="page-error-emoji">🔍</div>
          <h2>{error || "Couldn't load that profile"}</h2>
          <Link href="/" className="btn">
            ← Back to search
          </Link>
        </div>
      </main>
    );
  }

  return <WrappedStory stats={stats} />;
}
