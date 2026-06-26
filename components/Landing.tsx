"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { GithubIcon, BIcon } from "./icons";

const EXAMPLES = ["torvalds", "PATILYASHH", "gaearon", "sindresorhus"];

export default function Landing() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);

  function go(name: string) {
    const clean = name.trim().replace(/^@/, "");
    if (clean) router.push(`/${encodeURIComponent(clean)}`);
  }
  function onSubmit(e: FormEvent) {
    e.preventDefault();
    go(q);
  }

  async function signIn() {
    const supabase = createClient();
    if (!supabase) {
      alert("Sign-in isn't configured yet (Supabase env vars missing).");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "github",
      options: { redirectTo: `${window.location.origin}/auth/callback?next=/` },
    });
    if (error) {
      setLoading(false);
      alert("Sign-in failed. Is GitHub OAuth configured in Supabase?");
    }
  }

  return (
    <>
      <main className="container">
        <header className="landing-hero">
          <div className="landing-mark">
            <GithubIcon /> open source · githubstatss.vercel.app
          </div>
          <h1>
            Showcase your <span className="grad">GitHub</span> story
          </h1>
          <p>
            Sign in to see your contributions, streaks, dev rank and top
            languages — then compete in games built on your real GitHub activity.
          </p>

          <button
            className="btn-signin-lg"
            onClick={signIn}
            disabled={loading}
          >
            <GithubIcon size={18} />
            {loading ? "Redirecting…" : "Sign in with GitHub"}
          </button>

          <form className="landing-search" onSubmit={onSubmit}>
            <input
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="…or look up any developer"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              aria-label="GitHub username"
            />
            <button className="btn" type="submit">
              View
            </button>
          </form>

          <div className="examples">
            Try:{" "}
            {EXAMPLES.map((ex, i) => (
              <span key={ex}>
                <button type="button" onClick={() => go(ex)}>
                  {ex}
                </button>
                {i < EXAMPLES.length - 1 ? " · " : ""}
              </span>
            ))}
          </div>

          <div className="landing-links">
            <Link href="/games">
              <BIcon name="controller" /> Games
            </Link>
            <Link href="/compare">
              <BIcon name="bar-chart-line-fill" /> Compare developers
            </Link>
          </div>
        </header>
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
          </a>
        </p>
      </footer>
    </>
  );
}
