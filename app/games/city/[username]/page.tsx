import type { Metadata } from "next";
import Link from "next/link";
import { fetchDays } from "@/lib/games/contributions";
import GitCityClient from "@/components/GitCityClient";
import { BIcon } from "@/components/icons";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ username: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  const handle = decodeURIComponent(username);
  return {
    title: `${handle}'s Git City`,
    description: `Explore ${handle}'s GitHub contributions as a 3D city.`,
  };
}

export default async function CityPage({ params }: Props) {
  const { username } = await params;
  const handle = decodeURIComponent(username);

  let days: { date: string; count: number }[] = [];
  let error: string | null = null;
  try {
    days = await fetchDays(handle);
  } catch {
    error = `Couldn't load contributions for "${handle}".`;
  }

  const total = days.reduce((a, d) => a + d.count, 0);
  const built = days.slice(-7 * 52).filter((d) => d.count > 0).length;

  return (
    <main className="container">
      <header className="games-subhero">
        <div>
          <Link href="/games" className="back-link">
            ← Games
          </Link>
          <h1>
            <BIcon name="buildings-fill" size={24} /> {handle}&apos;s Git City
          </h1>
          <p>
            Every contribution is a building — taller means a busier day. Drag to
            orbit, scroll to zoom.
          </p>
        </div>
      </header>

      {error ? (
        <div className="games-empty">
          <p>{error}</p>
        </div>
      ) : (
        <>
          <div className="city-stats">
            <span>
              <strong>{built}</strong> buildings (active days, last year)
            </span>
            <span>
              <strong>{total.toLocaleString("en-US")}</strong> total contributions
            </span>
            <Link href={`/${handle}`} className="city-link">
              View full stats →
            </Link>
          </div>

          <GitCityClient days={days} />

          <p className="city-roadmap">
            <BIcon name="cone-striped" size={14} /> Coming next: walk the streets
            in first person, a shared live city of every developer, and an economy
            where commits are currency to build and decorate.
          </p>
        </>
      )}
    </main>
  );
}
