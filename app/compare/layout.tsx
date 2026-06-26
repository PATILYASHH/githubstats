import type { Metadata } from "next";

// The compare page itself is a client component, so its metadata lives here.
export const metadata: Metadata = {
  title: "Compare GitHub Developers",
  description:
    "Put two GitHub profiles head-to-head across contributions, streaks, stars, followers and dev rank — then share the result.",
  alternates: { canonical: "/compare" },
  openGraph: {
    title: "Compare GitHub Developers — GitHubStats",
    description:
      "See how two GitHub developers stack up across contributions, streaks, stars and more.",
    url: "/compare",
    type: "website",
  },
};

export default function CompareLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
