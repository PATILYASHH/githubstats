# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **Create Card** — a one-click button that generates a single shareable image
  (profile + key stats + mini heatmap + unlocked badges) and shows a **preview
  modal** with Download and Share, instead of sharing directly.
- **Premium icon set** — switched to inlined Bootstrap Icons (render in shared
  images); replaced remaining emoji UI icons with consistent SVG icons.
- **Holopin-style shareable badges** — each achievement has its own page
  (`/badge/username/id`) with a dynamic sticker OG image and per-badge share/copy.
- **Rarity system** — badges are common / rare / epic / legendary with colored
  rings and glow.
- **Missions** card — locked achievements shown as goals with progress bars.
- **Charts** — a donut chart for languages and an area "Contribution trend"
  chart for monthly activity.
- Restructured the dashboard into **Overview / Activity / Code / Achievements**
  sections.

### Previously added
- **Shareable profile pages** at `/username` with dynamic OpenGraph images so
  links auto-unfurl on social media.
- **Dev Card** — a combined hero card with a developer rank/tier and 5 gradient
  share themes.
- **Achievements** card with unlockable badges.
- **Compare two developers** at `/compare` (deep-linkable via `?a=&b=`).
- **When you code** weekday-rhythm card.
- UI polish: count-up numbers, animated bars, card hover, a confetti burst,
  copy-link / share buttons with toasts, and custom scrollbars.
- **Contribution breakdown** card with a year / month / week / day toggle.
- **Top repositories** card ranking your top 5 repos by commits (accurate
  all-time counts via GraphQL when `GITHUB_TOKEN` is set, recent public push
  activity otherwise).
- Community health files: `CONTRIBUTING`, `CODE_OF_CONDUCT`, `SECURITY`,
  issue & pull request templates, and this changelog.

### Fixed
- Contribution days are now sorted chronologically and future dates are
  excluded — fixes the **current streak** (previously always 0) and the
  active-days percentage.

## [1.0.0] - 2026-06-24

### Added
- Initial release of GitHubStats.
- Username search with profile header (avatar, name, bio).
- Contribution graph (full account history) with a **year selector** dropdown.
- Stat cards: total contributions, account age, active days %, followers,
  total stars, and top languages.
- Streaks (longest & current) and busiest day.
- **Share any card as an image** — native share sheet with a 2× PNG download
  fallback.
- JSON API at `/api/stats?username=...`.
- GitHub dark theme, responsive layout.
- Optional `GITHUB_TOKEN` to raise API rate limits.

[Unreleased]: https://github.com/PATILYASHH/githubstats/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/PATILYASHH/githubstats/releases/tag/v1.0.0
