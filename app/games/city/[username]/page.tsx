import type { Metadata } from "next";
import Link from "next/link";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import GamesNotConfigured from "@/components/GamesNotConfigured";
import PlotCityClient from "@/components/PlotCityClient";
import { BIcon } from "@/components/icons";
import { sanitizeLayout, layoutCost } from "@/lib/games/store";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ username: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  const handle = decodeURIComponent(username);
  return {
    title: `${handle}'s Git City`,
    description: `Explore the city ${handle} built from their GitHub contributions.`,
  };
}

export default async function CityView({ params }: Props) {
  if (!isSupabaseConfigured()) return <GamesNotConfigured />;

  const { username } = await params;
  const handle = decodeURIComponent(username);
  const supabase = await createClient();

  const [{ data: plotRow }, { data: stats }] = await Promise.all([
    supabase
      .from("plots")
      .select("layout, github_login")
      .ilike("github_login", handle)
      .maybeSingle(),
    supabase
      .from("user_stats")
      .select("contributions_total")
      .ilike("github_login", handle)
      .maybeSingle(),
  ]);

  const layout = sanitizeLayout(plotRow?.layout);
  const spent = layoutCost(layout);
  const coins = stats?.contributions_total ?? 0;

  return (
    <main className="container">
      <header className="games-subhero">
        <div>
          <Link href="/games/city" className="back-link">
            ← Git City
          </Link>
          <h1>
            <BIcon name="buildings-fill" size={24} /> {handle}&apos;s Git City
          </h1>
        </div>
      </header>

      {!plotRow || layout.length === 0 ? (
        <div className="games-empty">
          <p>{handle} hasn&apos;t built a city yet.</p>
        </div>
      ) : (
        <>
          <div className="city-stats">
            <span>
              <BIcon name="grid-3x3-gap-fill" size={14} /> <strong>{layout.length}</strong>{" "}
              structures
            </span>
            <span>
              <BIcon name="coin" size={14} /> <strong>{spent.toLocaleString("en-US")}</strong>{" "}
              of {coins.toLocaleString("en-US")} coins spent
            </span>
            <Link href={`/${handle}`} className="city-link">
              View full stats →
            </Link>
          </div>
          <PlotCityClient layout={layout} />
        </>
      )}
    </main>
  );
}
