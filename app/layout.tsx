import type { Metadata, Viewport } from "next";
import "./globals.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import NavBar from "@/components/NavBar";
import { getRepoStars } from "@/lib/github";
import { AUTHOR, GITHUB_REPO_URL, SITE_NAME, SITE_URL } from "@/lib/constants";

const DESCRIPTION =
  "GitHubStats turns your GitHub activity into shareable stats, a personalized profile README, and competitive dev games. Track contributions, streaks, languages and dev rank, generate a README.md, and compete on streak leaderboards and 1v1 duels — all from your real GitHub data.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default:
      "GitHubStats — GitHub Stats Tracker, Profile README Generator & Dev Games",
    template: "%s · GitHubStats",
  },
  description: DESCRIPTION,
  applicationName: SITE_NAME,
  authors: [{ name: AUTHOR, url: GITHUB_REPO_URL }],
  creator: AUTHOR,
  publisher: AUTHOR,
  category: "technology",
  keywords: [
    "github stats",
    "github profile readme generator",
    "profile readme generator",
    "readme generator",
    "github readme",
    "github contribution graph",
    "github streak",
    "developer stats",
    "github stats tracker",
    "github games",
    "contribution leaderboard",
    "compare github profiles",
    "dev card",
    "github profile",
  ],
  alternates: { canonical: "/" },
  verification: {
    google: "WAS2f7jnX5YxUBIXxbid23arE0_KYn75v_7I45wmETI",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    locale: "en_US",
    url: SITE_URL,
    title: "GitHubStats — Stats, Profile README Generator & Dev Games",
    description: DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: "GitHubStats — Stats, Profile README Generator & Dev Games",
    description:
      "Track your GitHub stats, generate a profile README, and compete in dev games — all from your real activity.",
  },
};

export const viewport: Viewport = {
  themeColor: "#0d1117",
  colorScheme: "dark",
};

// Structured data: a searchable site (username search box) + an app listing.
const jsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    description: DESCRIPTION,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/{search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  },
  {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: SITE_NAME,
    url: SITE_URL,
    applicationCategory: "DeveloperApplication",
    operatingSystem: "Web",
    description: DESCRIPTION,
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    author: { "@type": "Person", name: AUTHOR, url: GITHUB_REPO_URL },
    featureList: [
      "GitHub stats tracker",
      "Profile README generator",
      "Developer games and leaderboards",
      "1v1 contribution duels",
      "Compare developers",
    ],
  },
];

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const repoStars = await getRepoStars();
  return (
    <html lang="en">
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <NavBar repoStars={repoStars} />
        {children}
      </body>
    </html>
  );
}
