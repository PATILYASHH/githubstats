"use client";

/* eslint-disable @next/next/no-img-element */

import type { GithubStats } from "@/lib/types";
import {
  aboutItems,
  activityGraphUrl,
  featuredRepos,
  headerCardUrl,
  socialBadges,
  statsCardUrl,
  streakCardUrl,
  techBadges,
  topLangsUrl,
  trophyUrl,
  type ReadmeOptions,
} from "@/lib/readme";

// Live preview rendered from the same stats + options as buildReadme(), using
// the same self-hosted card/badge endpoints. base = "" → relative URLs hit the
// current origin (works in dev and prod), so what you see is what you copy.
const BASE = "";

export default function ReadmePreview({
  stats,
  opts,
}: {
  stats: GithubStats;
  opts: ReadmeOptions;
}) {
  const u = stats.user.login;
  const name = stats.user.name?.trim() || u;
  const socials = socialBadges(BASE, u, opts);
  const tech = techBadges(BASE, stats);
  const about = aboutItems(stats, opts);
  const repos = featuredRepos(BASE, stats, opts.theme);
  const pins = repos.filter((r) => r.pinUrl);
  const links = repos.filter((r) => !r.pinUrl);

  return (
    <div className="md-preview">
      <div className="md-center">
        {opts.animatedHeader ? (
          <img src={headerCardUrl(BASE, `Hi 👋, I'm ${name}`, opts.theme)} alt="header" />
        ) : (
          <h1>Hi 👋, I&apos;m {name}</h1>
        )}
        {opts.tagline.trim() && <h3>{opts.tagline}</h3>}
        <p className="md-badges">
          {socials.map((s) => (
            <a key={s.key} href={s.href} target="_blank" rel="noreferrer">
              <img src={s.img} alt={s.label} />
            </a>
          ))}
        </p>
      </div>

      {opts.showAbout && (
        <section>
          <h2>🚀 About Me</h2>
          <ul>
            {about.map((it, i) => (
              <li key={i}>
                {it.emoji} {it.label && <span>{it.label} </span>}
                {it.value && <strong>{it.value}</strong>}
              </li>
            ))}
          </ul>
        </section>
      )}

      {opts.showTechStack && tech.length > 0 && (
        <section>
          <h2>🛠️ Tech Stack</h2>
          <p className="md-badges">
            {tech.map((b) => (
              <img key={b.name} src={b.url} alt={b.name} />
            ))}
          </p>
        </section>
      )}

      {(opts.showStats || opts.showStreak || opts.showTopLangs) && (
        <section>
          <h2>📊 GitHub Stats</h2>
          <div className="md-center md-cards">
            {opts.showStats && (
              <img src={statsCardUrl(BASE, u, opts.theme)} alt="GitHub stats" />
            )}
            {opts.showStreak && (
              <img src={streakCardUrl(BASE, u, opts.theme)} alt="GitHub streak" />
            )}
            {opts.showTopLangs && (
              <img src={topLangsUrl(BASE, u, opts.theme)} alt="Top languages" />
            )}
          </div>
        </section>
      )}

      {opts.showTrophies && (
        <section>
          <h2>🏆 Trophies</h2>
          <div className="md-center">
            <img src={trophyUrl(BASE, u, opts.theme)} alt="Trophies" />
          </div>
        </section>
      )}

      {opts.showActivity && (
        <section>
          <h2>📈 Activity Graph</h2>
          <img
            className="md-wide"
            src={activityGraphUrl(BASE, u, opts.theme)}
            alt="Activity graph"
          />
        </section>
      )}

      {opts.showFeatured && repos.length > 0 && (
        <section>
          <h2>📌 Featured Projects</h2>
          {pins.length > 0 && (
            <div className="md-center md-cards">
              {pins.map((r) => (
                <a key={r.name} href={r.url} target="_blank" rel="noreferrer">
                  <img src={r.pinUrl} alt={r.repo} />
                </a>
              ))}
            </div>
          )}
          {links.length > 0 && (
            <ul>
              {links.map((r) => (
                <li key={r.name}>
                  <a href={r.url} target="_blank" rel="noreferrer">
                    <strong>{r.name}</strong>
                  </a>
                  {r.language ? ` — ${r.language}` : ""}
                  {typeof r.stars === "number"
                    ? ` · ⭐ ${r.stars.toLocaleString("en-US")}`
                    : ""}
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      <hr />
      <div className="md-center">
        <sub>✨ Generated with GitHubStats</sub>
      </div>
    </div>
  );
}
