# Security Policy

## Supported Versions

This project is deployed continuously from the `master` branch. Only the latest
deployed version is supported with security updates.

| Version            | Supported          |
| ------------------ | ------------------ |
| Latest (`master`)  | :white_check_mark: |
| Older commits      | :x:                |

## Reporting a Vulnerability

If you discover a security vulnerability, **please do not open a public issue.**

Instead, report it privately:

- **Email:** patilyasshh@gmail.com
- Or use GitHub's [private vulnerability reporting](https://github.com/PATILYASHH/githubstats/security/advisories/new)

Please include:

- A description of the vulnerability and its impact
- Steps to reproduce (proof of concept if possible)
- Affected URL, browser, or environment

You can expect an initial response within a few days. Once the issue is
confirmed and fixed, we will coordinate disclosure with you.

## Scope & Notes

GitHubStats is a stateless front end. It stores no user data and requires no
login. It reads **public** GitHub data only. The optional `GITHUB_TOKEN` is used
solely server-side to raise API rate limits and is never exposed to the client.

Thank you for helping keep the project and its users safe. 🙏
