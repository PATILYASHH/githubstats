"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GithubIcon } from "./icons";

export default function TopBar({ initial = "" }: { initial?: string }) {
  const router = useRouter();
  const [q, setQ] = useState(initial);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const clean = q.trim().replace(/^@/, "");
    if (clean) router.push(`/${encodeURIComponent(clean)}`);
  }

  return (
    <div className="topbar">
      <Link href="/" className="topbar-logo">
        <GithubIcon size={18} /> <span>GitHubStats</span>
      </Link>
      <form className="topbar-search" onSubmit={onSubmit}>
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search a username…"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          aria-label="GitHub username"
        />
      </form>
      <Link href="/compare" className="topbar-link">
        Compare
      </Link>
    </div>
  );
}
