import Link from "next/link";

// Shown on game pages when Supabase env vars aren't set on the deployment yet.
export default function GamesNotConfigured() {
  return (
    <main className="container">
      <div className="games-empty" style={{ marginTop: 48 }}>
        <p style={{ fontSize: 18, fontWeight: 600 }}>🎮 Games are being set up</p>
        <p>
          The competition features need a one-time database setup before they go
          live. Check back soon!
        </p>
        <p style={{ marginTop: 16 }}>
          <Link href="/" className="back-link">
            ← Back home
          </Link>
        </p>
      </div>
    </main>
  );
}
