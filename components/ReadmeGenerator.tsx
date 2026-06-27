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
  getTemplate,
  optionsForTemplate,
  TEMPLATES,
  THEMES,
  type ReadmeOptions,
} from "@/lib/readme";
import { createClient } from "@/lib/supabase/client";
import { colorForLanguage, LANGUAGE_COLORS } from "@/lib/colors";
import { BIcon } from "./icons";
import MarkdownPreview from "./MarkdownPreview";

interface Toggle {
  key: keyof ReadmeOptions;
  label: string;
}

type Field = { key: keyof ReadmeOptions; label: string; placeholder: string };

// Personal intro details (feed the About section). The headline lives in its
// own "Headline" panel — kept separate so nothing is entered twice.
const DETAILS: Field[] = [
  { key: "currentlyLearning", label: "Currently learning", placeholder: "Rust, k8s" },
  { key: "collaborateOn", label: "Looking to collaborate on", placeholder: "open-source AI tools" },
  { key: "askMeAbout", label: "Ask me about", placeholder: "React, Node, Tally" },
  { key: "funFact", label: "Fun fact", placeholder: "I love mechanical keyboards" },
  { key: "pronouns", label: "Pronouns", placeholder: "he/him" },
];

const SOCIALS: Field[] = [
  { key: "twitter", label: "X / Twitter", placeholder: "handle" },
  { key: "linkedin", label: "LinkedIn", placeholder: "in/your-name" },
  { key: "website", label: "Website", placeholder: "yoursite.com" },
  { key: "email", label: "Email", placeholder: "you@mail.com" },
  { key: "instagram", label: "Instagram", placeholder: "handle" },
  { key: "youtube", label: "YouTube", placeholder: "@channel" },
  { key: "devto", label: "Dev.to", placeholder: "username" },
  { key: "medium", label: "Medium", placeholder: "@username" },
  { key: "discord", label: "Discord", placeholder: "invite or user id" },
];

// Section toggles relevant to the chosen template (so you can only turn off
// what the template actually arranges — no confusing dead switches).
function availableToggles(opts: ReadmeOptions): Toggle[] {
  const tpl = getTemplate(opts.template);
  const list: Toggle[] = [];
  for (const key of tpl.order) {
    if (key === "about") list.push({ key: "showAbout", label: "About Me" });
    else if (key === "tech") list.push({ key: "showTechStack", label: "Tech Stack" });
    else if (key === "stats") {
      list.push({ key: "showStats", label: "Stats card" });
      if (tpl.statsLayout === "row") {
        list.push({ key: "showStreak", label: "Streak card" });
        list.push({ key: "showTopLangs", label: "Top languages" });
      }
    } else if (key === "trophies") list.push({ key: "showTrophies", label: "Trophies" });
    else if (key === "activity") list.push({ key: "showActivity", label: "Activity graph" });
    else if (key === "featured") list.push({ key: "showFeatured", label: "Featured projects" });
  }
  list.push({ key: "animatedHeader", label: "Animated header" });
  return list;
}

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

  // Export markdown uses the absolute origin (for GitHub); the preview uses
  // relative URLs so cards resolve against the current origin in dev + prod.
  const exportMd = useMemo(
    () => (stats && opts ? buildReadme(stats, opts) : ""),
    [stats, opts]
  );
  const previewMd = useMemo(
    () => (stats && opts ? buildReadme(stats, opts, "") : ""),
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

  function pickTemplate(id: string) {
    if (!stats) return;
    setOpts((o) => (o ? optionsForTemplate(stats, id, o) : o));
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(exportMd);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      setError("Clipboard blocked — select the text and copy manually.");
    }
  }

  function download() {
    const blob = new Blob([exportMd], { type: "text/markdown" });
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
          Generate a personalized GitHub profile README from your real activity.
          Pick a layout, tweak it, then copy it into your{" "}
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
            <Panel title="Template">
              <div className="readme-template-list">
                {TEMPLATES.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    className={`readme-template${
                      opts.template === t.id ? " active" : ""
                    }`}
                    onClick={() => pickTemplate(t.id)}
                  >
                    <span className="readme-template-name">
                      {t.name}
                      {opts.template === t.id && <BIcon name="check-circle-fill" size={14} />}
                    </span>
                    <span className="readme-template-blurb">{t.blurb}</span>
                  </button>
                ))}
              </div>
            </Panel>

            <Panel title="Theme">
              <div className="readme-themes">
                {THEMES.map((t) => (
                  <button
                    key={t.key}
                    type="button"
                    className={`readme-chip${opts.theme === t.key ? " active" : ""}`}
                    onClick={() => set("theme", t.key)}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </Panel>

            <Panel title="Headline">
              <input
                className="readme-input"
                value={opts.tagline}
                onChange={(e) => set("tagline", e.target.value)}
                placeholder="A short headline or tagline"
              />
            </Panel>

            <Panel title="About you">
              <div className="readme-socials">
                {DETAILS.map((s) => (
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

            {getTemplate(opts.template).order.includes("tech") && (
              <Panel title="Tech stack">
                <TechStackEditor
                  value={opts.techStack}
                  onChange={(v) => set("techStack", v)}
                />
              </Panel>
            )}

            <Panel title="Sections">
              <div className="readme-toggles">
                {availableToggles(opts).map((s) => (
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
                <MarkdownPreview markdown={previewMd} />
              </div>
            ) : (
              <pre className="readme-code">
                <code>{exportMd}</code>
              </pre>
            )}

            <p className="readme-hint">
              <BIcon name="info-circle" size={14} /> Create a public repo named{" "}
              <code>{stats.user.login}/{stats.user.login}</code>, add this as{" "}
              <code>README.md</code>, and it shows on your profile. Every card is
              served by GitHubStats itself — no third-party widgets — and refreshes
              automatically.
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

// Tech-stack picker: removable chips for the current stack, a free-text add for
// anything, and a palette of known languages (colored) that aren't added yet.
const KNOWN_LANGS = Object.keys(LANGUAGE_COLORS).sort((a, b) =>
  a.localeCompare(b)
);

function TechStackEditor({
  value,
  onChange,
}: {
  value: string[];
  onChange: (v: string[]) => void;
}) {
  const [custom, setCustom] = useState("");

  const has = (name: string) =>
    value.some((v) => v.toLowerCase() === name.toLowerCase());
  const available = useMemo(
    () => KNOWN_LANGS.filter((k) => !has(k)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [value]
  );

  function add(name: string) {
    const n = name.trim();
    if (!n || has(n)) return;
    onChange([...value, n]);
  }
  function remove(name: string) {
    onChange(value.filter((v) => v !== name));
  }
  function addCustom(e: FormEvent) {
    e.preventDefault();
    add(custom);
    setCustom("");
  }

  return (
    <div className="tech-editor">
      {value.length > 0 ? (
        <div className="tech-selected">
          {value.map((name) => (
            <button
              type="button"
              key={name}
              className="tech-tag"
              onClick={() => remove(name)}
              title={`Remove ${name}`}
            >
              <span
                className="tech-dot"
                style={{ backgroundColor: colorForLanguage(name) }}
              />
              {name}
              <BIcon name="x" size={14} />
            </button>
          ))}
        </div>
      ) : (
        <p className="tech-empty">No tech added yet — pick from below.</p>
      )}

      <form className="tech-add" onSubmit={addCustom}>
        <input
          className="readme-input"
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
          placeholder="Add a language or tool…"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          aria-label="Add a language or tool"
        />
        <button type="submit" className="tech-add-btn">
          Add
        </button>
      </form>

      {available.length > 0 && (
        <div className="tech-palette">
          {available.map((name) => (
            <button
              type="button"
              key={name}
              className="tech-chip"
              onClick={() => add(name)}
              title={`Add ${name}`}
            >
              <span
                className="tech-dot"
                style={{ backgroundColor: colorForLanguage(name) }}
              />
              {name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
