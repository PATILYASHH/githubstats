"use client";

/* eslint-disable @next/next/no-img-element */

import type { GithubStats } from "@/lib/types";
import {
  aboutItems,
  activityGraphUrl,
  featuredRepos,
  socialBadges,
  statsCardUrl,
  streakCardUrl,
  techBadges,
  topLangsUrl,
  trophyUrl,
  typingHeaderUrl,
  visitorBadgeUrl,
  type ReadmeOptions,
} from "@/lib/readme";

// A representative, GitHub-flavored render of the generated README. Driven by
// the same stats + options as buildReadme(), using the same live widget URLs,
// so what you see maps directly to what you copy.
export default function ReadmePreview({
  stats,
  opts,
}: {
  stats: GithubStats;
  opts: ReadmeOptions;
}) {
  const u = stats.user.login;
  const name = stats.user.name?.trim() || u;
  const socials = socialBadges(u, opts);
  const tech = techBadges(stats);
  const about = aboutItems(stats, opts);
  const repos = featuredRepos(stats, opts.theme);
  const pins = repos.filter((r) => r.pinUrl);
  const links = repos.filter((r) => !r.pinUrl);

  return (
    <div className="md-preview">
      <div className="md-center">
        {opts.animatedHeader ? (
          <img
            src={typingHeaderUrl([
              `Hi 👋, I'm ${name}`,
              opts.tagline.slice(0, 40) || u,
            ])}
            alt="header"
          />
        ) : (
          <h1>Hi 👋, I&apos;m {name}</h1>
        )}
        {opts.tagline.trim() && <h3>{opts.tagline}</h3>}
        {opts.showVisitors && (
          <p>
            <img src={visitorBadgeUrl(u)} alt="Profile views" />
          </p>
        )}
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
              <img src={statsCardUrl(u, opts.theme)} alt="GitHub stats" />
            )}
            {opts.showStreak && (
              <img src={streakCardUrl(u, opts.theme)} alt="GitHub streak" />
            )}
            {opts.showTopLangs && (
              <img src={topLangsUrl(u, opts.theme)} alt="Top languages" />
            )}
          </div>
        </section>
      )}

      {opts.showTrophies && (
        <section>
          <h2>🏆 Trophies</h2>
          <div className="md-center">
            <img src={trophyUrl(u, opts.theme)} alt="Trophies" />
          </div>
        </section>
      )}

      {opts.showActivity && (
        <section>
          <h2>📈 Activity Graph</h2>
          <img
            className="md-wide"
            src={activityGraphUrl(u, opts.theme)}
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
