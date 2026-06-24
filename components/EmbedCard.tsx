"use client";

import { useState } from "react";
import { CardImageIcon } from "./icons";

const SITE = "https://githubstatss.vercel.app";
const THEMES = ["dark", "light", "midnight", "dracula", "forest", "sunset"];

export default function EmbedCard({ login }: { login: string }) {
  const [theme, setTheme] = useState("dark");
  const [copied, setCopied] = useState(false);

  const q = theme === "dark" ? "" : `?theme=${theme}`;
  const previewSrc = `/api/card/${login}.svg${q}`;
  const markdown = `[![${login}'s GitHub stats](${SITE}/api/card/${login}.svg${q})](${SITE}/${login})`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(markdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="card span-all">
      <div className="card-head">
        <span className="card-title">
          <CardImageIcon /> Embed in your README
        </span>
      </div>
      <p className="repos-sub">
        Add this live, auto-updating card to your GitHub profile README:
      </p>

      <div className="embed-themes" data-exclude="true">
        {THEMES.map((t) => (
          <button
            key={t}
            className={`embed-theme ${theme === t ? "active" : ""}`}
            onClick={() => setTheme(t)}
          >
            {t}
          </button>
        ))}
      </div>

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="embed-preview" src={previewSrc} alt={`${login} stats card`} />

      <div className="embed-code">
        <code>{markdown}</code>
        <button className="action-btn" onClick={copy}>
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
    </div>
  );
}
