import type { Metadata } from "next";
import "./globals.css";
import NavBar from "@/components/NavBar";

const SITE = "https://githubstatss.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: "GitHubStats — Showcase your GitHub contributions",
  description:
    "Enter any GitHub username to see contributions, account age, active days, language stats and more. Share any card as an image.",
  keywords: [
    "github",
    "github stats",
    "contribution graph",
    "github profile",
    "developer stats",
  ],
  openGraph: {
    title: "GitHubStats — Showcase your GitHub contributions",
    description:
      "Contribution graph, total contributions, active days and language stats for any GitHub user. Share any card as an image.",
    url: SITE,
    siteName: "GitHubStats",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "GitHubStats",
    description:
      "Showcase and share your GitHub contributions, stats and languages.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <NavBar />
        {children}
      </body>
    </html>
  );
}
