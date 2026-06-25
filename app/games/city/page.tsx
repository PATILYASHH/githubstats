import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import GamesNotConfigured from "@/components/GamesNotConfigured";
import { BIcon } from "@/components/icons";

export const metadata: Metadata = {
  title: "Git City — your contributions as a 3D city",
  description: "Explore your GitHub contribution history as an explorable 3D city.",
};

export const dynamic = "force-dynamic";

export default async function CityHome() {
  if (!isSupabaseConfigured()) return <GamesNotConfigured />;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const login = user?.user_metadata?.user_name as string | undefined;

  if (login) redirect(`/games/city/${login}`);

  return (
    <main className="container">
      <header className="games-subhero">
        <div>
          <Link href="/games" className="back-link">
            ← Games
          </Link>
          <h1>
            <BIcon name="buildings-fill" size={24} /> Git City
          </h1>
          <p>Your GitHub contributions, rebuilt as an explorable 3D city.</p>
        </div>
      </header>
      <div className="games-empty">
        <p>
          <strong>Sign in with GitHub</strong> (top bar) to build your city — or
          explore anyone&apos;s by visiting{" "}
          <code>/games/city/their-username</code>.
        </p>
      </div>
    </main>
  );
}
