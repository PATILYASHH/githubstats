import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import ReadmeGenerator from "@/components/ReadmeGenerator";

export const metadata: Metadata = {
  title: "Profile README Generator",
  description:
    "Generate a personalized GitHub profile README.md from your real activity: stats, streaks, top languages, trophies and featured projects. Copy or download in one click.",
  alternates: { canonical: "/readme" },
  openGraph: {
    title: "GitHub Profile README Generator",
    description:
      "Turn your real GitHub activity into a polished profile README.md — stats, streaks, languages and featured projects.",
    url: "/readme",
    type: "website",
  },
};

export default function ReadmePage() {
  return (
    <>
      <Suspense fallback={<main className="container" />}>
        <ReadmeGenerator />
      </Suspense>
      <footer className="footer">
        <p>
          <Link href="/">← Back to GitHubStats</Link> ·{" "}
          <Link href="/compare">Compare developers</Link>
        </p>
      </footer>
    </>
  );
}
