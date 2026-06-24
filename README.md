# GitHubStats

> Showcase your GitHub story — contributions, account age, active days, top languages and more. Share any card as an image.

🔗 **Live:** [githubstatss.vercel.app](https://githubstatss.vercel.app)

![open source](https://img.shields.io/badge/open%20source-MIT-39d353) ![next.js](https://img.shields.io/badge/Next.js-15-000000)

## What it does

Enter any GitHub username and instantly get a shareable dashboard:

- **Contribution graph** — full account history, GitHub-style heatmap
- **Total contributions** across commits, PRs, issues & reviews
- **Account age** — years and total days since the account was created
- **Active days** — how many days actually had contributions (the "green" days), as a percentage
- **Longest / current streak** and your busiest day ever
- **Followers, repos & total stars** earned
- **Top languages** with the official GitHub color palette

Every card has a **Share** button. On mobile (and supported desktop browsers) it opens the native share sheet with the card rendered as a PNG — perfect for stories, posts, or even app/store screenshots. Everywhere else it downloads a crisp 2× PNG you can share anywhere.

## How it works

- **Profile, repos & languages** come from the public GitHub REST API.
- **Contribution calendar** comes from the free [`github-contributions-api`](https://github.com/grubersjoe/github-contributions-api) (no auth needed).
- Card → image conversion is done client-side with [`html-to-image`](https://github.com/bubkoo/html-to-image).

No login, no database. Works with zero secrets.

### Optional: higher rate limits

The unauthenticated GitHub API allows ~60 requests/hour per IP. To raise this on your own deployment, set a token:

```
GITHUB_TOKEN=ghp_your_personal_access_token
```

A classic token with **no scopes** (public data only) is enough.

## Run locally

```bash
git clone https://github.com/PATILYASHH/Githubstats.git
cd Githubstats
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploy

This is a standard Next.js App Router project — deploy to Vercel in one click:

1. Push to GitHub.
2. Import the repo at [vercel.com/new](https://vercel.com/new).
3. (Optional) add `GITHUB_TOKEN` in **Project → Settings → Environment Variables**.

## Tech stack

- [Next.js 15](https://nextjs.org/) (App Router) + React 19 + TypeScript
- Plain CSS, GitHub dark theme
- `html-to-image` for share-as-image

## Contributing

Issues and PRs welcome. This is built to be hacked on — add new cards, themes, or data sources.

## License

[MIT](./LICENSE)
