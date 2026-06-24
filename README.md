<div align="center">

# 📊 GitHubStats

### Showcase and share your GitHub story — as beautiful, downloadable images.

Enter any GitHub username to reveal contributions, account age, active days, streaks, top languages and more. Every card can be shared or exported as an image.

[![Live](https://img.shields.io/badge/live-githubstatss.vercel.app-39d353?style=flat-square&logo=vercel&logoColor=white)](https://githubstatss.vercel.app)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square)](./LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-15-000000?style=flat-square&logo=nextdotjs)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61dafb?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](./CONTRIBUTING.md)

[**Live demo**](https://githubstatss.vercel.app) · [Report a bug](https://github.com/PATILYASHH/githubstats/issues/new?template=bug_report.md) · [Request a feature](https://github.com/PATILYASHH/githubstats/issues/new?template=feature_request.md)

</div>

---

## Table of contents

- [Features](#features)
- [Screenshots](#screenshots)
- [How it works](#how-it-works)
- [Tech stack](#tech-stack)
- [Getting started](#getting-started)
- [Configuration](#configuration)
- [Deploy](#deploy)
- [API](#api)
- [Project structure](#project-structure)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)
- [Acknowledgements](#acknowledgements)

## Features

- 🟩 **Contribution graph** — full account history, GitHub-style heatmap with a **year selector** dropdown
- 🔢 **Total contributions** across commits, PRs, issues & reviews
- 📅 **Account age** — years and exact days since the account was created
- 🔥 **Active days** — how many days actually had contributions (the "green" days), shown as a percentage
- ⚡ **Streaks** — longest and current streak, plus your busiest day ever
- 👥 **Followers, repos & total stars** earned across public repositories
- 🧩 **Top languages** with the official GitHub color palette and a proportional bar
- 🖼️ **Share any card as an image** — native share sheet on supported devices, crisp 2× PNG download everywhere else
- 🌙 **GitHub dark theme** UI, fully responsive
- 🔓 **No login, no database** — works with zero secrets

## Screenshots

> _Add screenshots or a GIF here once deployed._
>
> ```
> docs/screenshot-dashboard.png
> docs/screenshot-card.png
> ```

## How it works

- **Profile, repos & languages** come from the public [GitHub REST API](https://docs.github.com/rest).
- **Contribution calendar** comes from the free [`github-contributions-api`](https://github.com/grubersjoe/github-contributions-api) (no auth required, full history).
- **Card → image** conversion happens entirely client-side with [`html-to-image`](https://github.com/bubkoo/html-to-image).

The data is fetched server-side in a Next.js Route Handler and cached at the edge, so repeat lookups are fast and rate-limit friendly.

## Tech stack

| Layer        | Choice                                             |
| ------------ | -------------------------------------------------- |
| Framework    | [Next.js 15](https://nextjs.org/) (App Router)     |
| UI           | React 19, TypeScript, plain CSS (GitHub dark)      |
| Data         | GitHub REST API + github-contributions-api         |
| Image export | `html-to-image`                                    |
| Hosting      | [Vercel](https://vercel.com)                       |

## Getting started

### Prerequisites

- [Node.js](https://nodejs.org/) 18.18 or newer
- npm (ships with Node)

### Installation

```bash
# 1. Clone
git clone https://github.com/PATILYASHH/githubstats.git
cd githubstats

# 2. Install dependencies
npm install

# 3. Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and enter a username.

### Scripts

| Command         | Description                       |
| --------------- | --------------------------------- |
| `npm run dev`   | Start the development server      |
| `npm run build` | Create a production build         |
| `npm start`     | Run the production build          |
| `npm run lint`  | Lint the codebase                 |

## Configuration

The app works with **no environment variables**. The only optional setting raises GitHub's unauthenticated rate limit (~60 requests/hour per IP):

| Variable       | Required | Description                                                        |
| -------------- | -------- | ------------------------------------------------------------------ |
| `GITHUB_TOKEN` | No       | A GitHub token (no scopes needed) to raise the API rate limit.     |

Create a `.env.local` file for local development:

```bash
GITHUB_TOKEN=ghp_your_personal_access_token
```

> A **classic token with no scopes** (public data only) is enough.

## Deploy

This is a standard Next.js App Router project. Deploy to Vercel in a few clicks:

1. Push your fork to GitHub.
2. Import the repository at [vercel.com/new](https://vercel.com/new).
3. _(Optional)_ add `GITHUB_TOKEN` under **Project → Settings → Environment Variables**.
4. Deploy. 🎉

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/PATILYASHH/githubstats)

## API

A single JSON endpoint powers the dashboard.

```http
GET /api/stats?username=<github-username>
```

**Example**

```bash
curl "https://githubstatss.vercel.app/api/stats?username=torvalds"
```

**Response (truncated)**

```jsonc
{
  "user": { "login": "torvalds", "name": "Linus Torvalds", "createdAt": "2011-09-03T..." },
  "contributions": {
    "total": 37404,
    "activeDays": 5109,
    "trackedDays": 5844,
    "accountAgeDays": 5407,
    "longestStreak": 98,
    "currentStreak": 0,
    "days": [{ "date": "2011-09-03", "count": 0, "level": 0 }]
  },
  "languages": [{ "name": "C", "count": 8, "percentage": 88.9, "color": "#555555" }],
  "totalStars": 248732
}
```

**Errors** return `{ "error": "message" }` with an appropriate status (`400`, `404`, `403`, `500`).

## Project structure

```
githubstats/
├── app/
│   ├── api/stats/route.ts     # JSON endpoint (server-side GitHub fetch)
│   ├── globals.css            # GitHub dark theme styles
│   ├── layout.tsx             # Root layout + metadata
│   └── page.tsx               # Home page + dashboard
├── components/
│   ├── ContributionGraph.tsx  # Heatmap + year selector
│   ├── ShareCard.tsx          # Card wrapper + share-as-image
│   └── icons.tsx              # Inline SVG icons
├── lib/
│   ├── colors.ts              # Language & heatmap color palettes
│   ├── github.ts              # Data fetching & aggregation
│   └── types.ts               # Shared TypeScript types
└── ...
```

## Roadmap

- [ ] Light theme toggle
- [ ] Per-card theme/color customization
- [ ] Compare two users side by side
- [ ] OG image generation for shared profile links
- [ ] More cards (top repos, commit-time heatmap)

See [open issues](https://github.com/PATILYASHH/githubstats/issues) for the full list.

## Contributing

Contributions are what make open source great. Please read [CONTRIBUTING.md](./CONTRIBUTING.md) and our [Code of Conduct](./CODE_OF_CONDUCT.md) before opening a PR.

1. Fork the project
2. Create your branch (`git checkout -b feature/amazing-card`)
3. Commit your changes (`git commit -m 'Add amazing card'`)
4. Push (`git push origin feature/amazing-card`)
5. Open a Pull Request

## License

Distributed under the **MIT License**. See [LICENSE](./LICENSE) for details.

## Acknowledgements

- [github-contributions-api](https://github.com/grubersjoe/github-contributions-api) — contribution calendar data
- [html-to-image](https://github.com/bubkoo/html-to-image) — DOM-to-PNG export
- [GitHub Linguist](https://github.com/github-linguist/linguist) — language color palette
- [Next.js](https://nextjs.org/) & [Vercel](https://vercel.com/)

---

<div align="center">

Built with ❤️ by [Yash Patil](https://github.com/PATILYASHH) · [githubstatss.vercel.app](https://githubstatss.vercel.app)

</div>
