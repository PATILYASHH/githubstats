"use client";

import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { useSearchParams } from "next/navigation";
import type { GithubStats } from "@/lib/types";
import {
  buildReadme,
  defaultReadmeOptions,
  THEMES,
  type ReadmeOptions,
} from "@/lib/readme";
import { createClient } from "@/lib/supabase/client";
import { BIcon } from "./icons";
import ReadmePreview from "./ReadmePreview";

interface Toggle {
  key: keyof ReadmeOptions;
  label: string;
}

const SECTIONS: Toggle[] = [
  { key: "showAbout", label: "About Me" },
  { key: "showTechStack", label: "Tech Stack" },
  { key: "showStats", label: "Stats card" },
  { key: "showStreak", label: "Streak card" },
  { key: "showTopLangs", label: "Top languages" },
  { key: "showTrophies", label: "Trophies" },
  { key: "showActivity", label: "Activity graph" },
  { key: "showFeatured", label: "Featured projects" },
  { key: "showVisitors", label: "Visitor badge" },
  { key: "animatedHeader", label: "Animated header" },
];

const SOCIALS: { key: keyof ReadmeOptions; label: string; placeholder: string }[] = [
  { key: "twitter", label: "X / Twitter", placeholder: "handle" },
  { key: "linkedin", label: "LinkedIn", placeholder: "in/your-name" },
  { key: "website", label: "Website", placeholder: "yoursite.com" },
  { key: "email", label: "Email", placeholder: "you@mail.com" },
];

export default function ReadmeGenerator() {
  const params = useSearchParams();
  const [q, setQ] = useState(params.get("u") ?? "");
  const [stats, setStats] = useState<GithubStats | null>(null);
  const [opts, setOpts] = useState<ReadmeOptions | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<"preview" | "markdown">("preview");
  const [copied, setCopied] = useState(false);

  // Prefill the signed-in user's handle (unless one was passed via ?u=).
  useEffect(() => {
    if (params.get("u")) return;
    const supabase = createClient();
    if (!supabase) return;
    supabase.auth.getUser().then(({ data }) => {
      const meta = data.user?.user_metadata ?? {};
      const login = meta.user_name ?? meta.preferred_username;
      if (login) setQ((cur) => cur || login);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const markdown = useMemo(
    () => (stats && opts ? buildReadme(stats, opts) : ""),
    [stats, opts]
  );

  async function generate(name: string) {
    const clean = name.trim().replace(/^@/, "");
    if (!clean) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/stats?username=${encodeURIComponent(clean)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not load that profile.");
      const s = data as GithubStats;
      setStats(s);
      setOpts(defaultReadmeOptions(s));
    } catch (err) {
      setStats(null);
      setOpts(null);
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  // Auto-run if arriving with ?u=.
  useEffect(() => {
    const u = params.get("u");
    if (u) generate(u);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    generate(q);
  }

  function set<K extends keyof ReadmeOptions>(key: K, value: ReadmeOptions[K]) {
    setOpts((o) => (o ? { ...o, [key]: value } : o));
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(markdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      setError("Clipboard blocked — select the text and copy manually.");
    }
  }

  function download() {
    const blob = new Blob([markdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "README.md";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="container">
      <header className="games-hero">
        <h1>
          <BIcon name="markdown" size={36} />{" "}
          <span className="grad">Profile README</span>
        </h1>
        <p>
          Generate a personalized GitHub profile README from your real activity —
          stats, streaks, top languages and featured projects. Copy it into your{" "}
          <code>username/username</code> repo.
        </p>
        <form className="readme-form" onSubmit={onSubmit}>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="GitHub username"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            aria-label="GitHub username"
          />
          <button className="btn" type="submit" disabled={loading}>
            {loading ? "Loading…" : "Generate"}
          </button>
        </form>
        {error && <div className="error">{error}</div>}
      </header>

      {stats && opts && (
        <div className="readme-layout">
          {/* ---- controls ---- */}
          <aside className="readme-controls">
            <Panel title="Theme">
              <div className="readme-themes">
                {THEMES.map((t) => (
                  <button
                    key={t.key}
                    type="button"
                    className={`readme-chip${
                      opts.theme === t.key ? " active" : ""
                    }`}
                    onClick={() => set("theme", t.key)}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </Panel>

            <Panel title="Tagline">
              <input
                className="readme-input"
                value={opts.tagline}
                onChange={(e) => set("tagline", e.target.value)}
                placeholder="A short headline"
              />
            </Panel>

            <Panel title="Sections">
              <div className="readme-toggles">
                {SECTIONS.map((s) => (
                  <label key={s.key} className="readme-toggle">
                    <input
                      type="checkbox"
                      checked={Boolean(opts[s.key])}
                      onChange={(e) => set(s.key, e.target.checked as never)}
                    />
                    {s.label}
                  </label>
                ))}
              </div>
            </Panel>

            <Panel title="Social links">
              <div className="readme-socials">
                {SOCIALS.map((s) => (
                  <label key={s.key} className="readme-field">
                    <span>{s.label}</span>
                    <input
                      className="readme-input"
                      value={String(opts[s.key] ?? "")}
                      onChange={(e) => set(s.key, e.target.value as never)}
                      placeholder={s.placeholder}
                      autoCapitalize="off"
                      autoCorrect="off"
                      spellCheck={false}
                    />
                  </label>
                ))}
              </div>
            </Panel>
          </aside>

          {/* ---- output ---- */}
          <section className="readme-output">
            <div className="readme-tabs">
              <button
                className={`readme-tab${tab === "preview" ? " active" : ""}`}
                onClick={() => setTab("preview")}
                type="button"
              >
                <BIcon name="eye" size={15} /> Preview
              </button>
              <button
                className={`readme-tab${tab === "markdown" ? " active" : ""}`}
                onClick={() => setTab("markdown")}
                type="button"
              >
                <BIcon name="code-slash" size={15} /> Markdown
              </button>
              <div className="readme-actions">
                <button type="button" className="btn-ghost" onClick={copy}>
                  <BIcon name={copied ? "check2" : "clipboard"} size={15} />{" "}
                  {copied ? "Copied" : "Copy"}
                </button>
                <button type="button" className="btn" onClick={download}>
                  <BIcon name="download" size={15} /> README.md
                </button>
              </div>
            </div>

            {tab === "preview" ? (
              <div className="readme-pane">
                <ReadmePreview stats={stats} opts={opts} />
              </div>
            ) : (
              <pre className="readme-code">
                <code>{markdown}</code>
              </pre>
            )}

            <p className="readme-hint">
              <BIcon name="info-circle" size={14} /> Create a public repo named{" "}
              <code>{stats.user.login}/{stats.user.login}</code>, add this as{" "}
              <code>README.md</code>, and it shows on your profile. Stat cards are
              powered by open-source services and update automatically.
            </p>
          </section>
        </div>
      )}
    </main>
  );
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="readme-panel">
      <h3 className="readme-panel-title">{title}</h3>
      {children}
    </div>
  );
}
