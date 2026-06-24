"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GithubIcon } from "@/components/icons";

const EXAMPLES = ["torvalds", "PATILYASHH", "gaearon", "sindresorhus"];

export default function Home() {
  const router = useRouter();
  const [username, setUsername] = useState("");

  function go(name: string) {
    const clean = name.trim().replace(/^@/, "");
    if (clean) router.push(`/${encodeURIComponent(clean)}`);
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    go(username);
  }

  return (
    <>
      <header className="hero">
        <div className="hero-mark">
          <GithubIcon /> open source · githubstatss.vercel.app
        </div>
        <h1>
          Showcase your <span className="grad">GitHub</span> story
        </h1>
        <p>
          Enter a GitHub username to reveal contributions, streaks, your dev
          rank, top languages and more — then share any card as an image.
        </p>

        <form className="search" onSubmit={onSubmit}>
          <input
            type="text"
            placeholder="GitHub username, e.g. torvalds"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            aria-label="GitHub username"
          />
          <button className="btn" type="submit">
            Get stats
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

        <div className="hero-links">
          <Link href="/compare">⚔️ Compare two developers →</Link>
        </div>
      </header>

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
          . No login required.
        </p>
      </footer>
    </>
  );
}
