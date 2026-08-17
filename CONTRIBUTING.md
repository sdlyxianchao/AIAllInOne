# Contributing to AI AllInOne

Thanks for your interest in co-building AI AllInOne! This project is **open source and free** — it only grows through people like you. No matter your skill level, there's a way to help.

## Ways to contribute

| Role | What you do | Skill needed |
|---|---|---|
| ⭐ Star & share | Star the repo, share it with colleagues / communities | none |
| 🐛 Bug reporter | Open issues with clear reproduction steps | basic |
| 📝 Documenter | Deployment guides, troubleshooting, best practices | technical writing |
| 🌐 Translator | Improve the 9-language manuals, or add a new language | language skills |
| 🧪 Tester | Deploy it, report what worked / what didn't, share your case | basic Docker |
| 💻 Code contributor | Improve the integration layer (unified SSO, admin portal, monitoring, backup, scripts) | any language you like |

The **integration layer** is the easiest place to start contributing — it's our own code (not upstream open-source components), so you don't need to understand the whole stack to make a meaningful PR.

## Getting started

1. **Fork** the repo and `git clone` your fork.
2. Pick something to work on: browse [Issues](https://github.com/sdlyxianchao/AIAllInOne/issues) (labels: `good first issue`, `documentation`, `help wanted`) or check the Roadmap in the README.
3. Create a branch: `git checkout -b feat/your-change`.
4. Make your change, test it, and open a **Pull Request** with a clear description.

## PR guidelines

- One PR = one logical change. Small PRs get merged faster.
- Describe **what** and **why** in the PR body; add screenshots for UI changes.
- Keep secrets out: never commit real `.env` values, keys, passwords, or intranet IPs — use `CHANGE_ME` placeholders.
- If your change touches docs, update both the English source and note which other languages need re-translation.

## Issue guidelines

- Search existing issues first to avoid duplicates.
- For bugs: include platform (Windows/Linux), Docker version, steps to reproduce, and relevant logs (strip sensitive data).
- For feature requests: describe the problem you're solving, not just the solution you want.

## Communication

- Public discussion: [GitHub Discussions](https://github.com/sdlyxianchao/AIAllInOne/discussions)
- WeChat group: scan the QR code in the README (Chinese-speaking community).

## Recognition

Every merged contribution is acknowledged in the README's contributors section. Active contributors may be invited to become **core maintainers** — and later, certified **deployment partners** for paid on-prem services.

Happy hacking!
