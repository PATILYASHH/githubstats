# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Community health files: `CONTRIBUTING`, `CODE_OF_CONDUCT`, `SECURITY`,
  issue & pull request templates, and this changelog.

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
