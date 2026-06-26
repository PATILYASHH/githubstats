"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { GITHUB_REPO_URL } from "@/lib/constants";
import { GithubIcon, BIcon } from "./icons";
import AuthButton, { type SessionUser } from "./AuthButton";

const LINKS = [
  { href: "/", label: "Home", icon: "house-door-fill" },
  { href: "/readme", label: "Readme", icon: "markdown" },
  { href: "/games", label: "Games", icon: "controller" },
];

function formatStars(n: number): string {
  if (n < 1000) return String(n);
  return (Math.round(n / 100) / 10).toFixed(1).replace(/\.0$/, "") + "k";
}

export default function NavBar({ repoStars }: { repoStars?: number | null }) {
  const router = useRouter();
  const pathname = usePathname();
  const [q, setQ] = useState("");
  const [user, setUser] = useState<SessionUser | null>(null);

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) return; // Supabase not configured — render nav without auth

    supabase.auth.getUser().then(({ data }) => {
      const u = data.user;
      if (u) {
        const meta = u.user_metadata ?? {};
        setUser({
          login: meta.user_name ?? meta.preferred_username ?? "you",
          avatarUrl: meta.avatar_url ?? null,
        });
      }
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      const u = session?.user;
      if (!u) {
        setUser(null);
        return;
      }
      const meta = u.user_metadata ?? {};
      setUser({
        login: meta.user_name ?? meta.preferred_username ?? "you",
        avatarUrl: meta.avatar_url ?? null,
      });
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  function onSearch(e: FormEvent) {
    e.preventDefault();
    const clean = q.trim().replace(/^@/, "");
    if (clean) router.push(`/${encodeURIComponent(clean)}`);
  }

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(href + "/");
  }

  return (
    <nav className="nav">
      <Link href="/" className="nav-logo">
        <GithubIcon size={18} /> <span>GitHubStats</span>
      </Link>

      <div className="nav-links">
        {LINKS.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={`nav-link${isActive(l.href) ? " active" : ""}`}
          >
            <BIcon name={l.icon} size={15} /> {l.label}
          </Link>
        ))}
      </div>

      <form className="nav-search" onSubmit={onSearch}>
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search a username, then ↵"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          aria-label="GitHub username"
        />
      </form>

      <a
        className="nav-star"
        href={GITHUB_REPO_URL}
        target="_blank"
        rel="noreferrer"
        title="Star GitHubStats on GitHub"
        aria-label="Star GitHubStats on GitHub"
      >
        <GithubIcon size={16} />
        <span className="nav-star-text">Star</span>
        {repoStars != null && (
          <span className="nav-star-count">
            <BIcon name="star-fill" size={12} /> {formatStars(repoStars)}
          </span>
        )}
      </a>

      <AuthButton user={user} />
    </nav>
  );
}
