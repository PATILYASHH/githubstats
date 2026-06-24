# Contributing to GitHubStats

First off — thanks for taking the time to contribute! 🎉

This document explains how to propose changes, report bugs, and get your work merged.

## Table of contents

- [Code of conduct](#code-of-conduct)
- [Ways to contribute](#ways-to-contribute)
- [Development setup](#development-setup)
- [Project conventions](#project-conventions)
- [Commit messages](#commit-messages)
- [Pull request process](#pull-request-process)
- [Reporting bugs](#reporting-bugs)
- [Suggesting features](#suggesting-features)

## Code of conduct

This project is governed by our [Code of Conduct](./CODE_OF_CONDUCT.md). By participating, you are expected to uphold it. Please report unacceptable behavior to the maintainer.

## Ways to contribute

- 🐛 Report bugs
- 💡 Suggest features or new cards
- 📝 Improve documentation
- 🎨 Improve the UI / accessibility
- 🧹 Refactor or simplify code

You don't need permission to start — small PRs are very welcome.

## Development setup

```bash
git clone https://github.com/PATILYASHH/githubstats.git
cd githubstats
npm install
npm run dev
```

The app runs at [http://localhost:3000](http://localhost:3000). No environment variables are required (see [README → Configuration](./README.md#configuration) for the optional `GITHUB_TOKEN`).

Before pushing, make sure the project builds and lints:

```bash
npm run lint
npm run build
```

## Project conventions

- **Language:** TypeScript everywhere. Keep types in [`lib/types.ts`](./lib/types.ts).
- **Data fetching:** server-side only, in [`lib/github.ts`](./lib/github.ts) and the route handler. Never expose tokens to the client.
- **Styling:** plain CSS in [`app/globals.css`](./app/globals.css), GitHub dark theme variables. Reuse the CSS custom properties (`--bg`, `--border`, etc.).
- **Cards:** new cards should wrap their content in [`<ShareCard>`](./components/ShareCard.tsx) so they get the share-as-image button for free.
- Match the style of the surrounding code — naming, spacing, and comment density.

## Commit messages

Use clear, imperative-mood messages:

```
Add commit-time heatmap card
Fix year selector defaulting to oldest year
Refactor language aggregation
```

[Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `docs:`) are welcome but not required.

## Pull request process

1. Fork the repo and create a branch from `master`.
2. Make your change, keeping PRs focused and reasonably small.
3. Run `npm run lint` and `npm run build` — both must pass.
4. Update documentation (README, CHANGELOG) when behavior changes.
5. Fill out the PR template and link any related issue.
6. A maintainer will review; please be responsive to feedback.

By contributing, you agree that your contributions will be licensed under the [MIT License](./LICENSE).

## Reporting bugs

Open a [bug report](https://github.com/PATILYASHH/githubstats/issues/new?template=bug_report.md) and include:

- What you did and what you expected
- What actually happened (screenshots help)
- The GitHub username you tested with (if relevant)
- Browser / OS

## Suggesting features

Open a [feature request](https://github.com/PATILYASHH/githubstats/issues/new?template=feature_request.md) describing the problem you want solved and your proposed solution. Mockups and examples are appreciated.

---

Thanks again — happy hacking! 🚀
