# Publish to ClawHub

Official docs: https://docs.openclaw.ai/clawhub/publishing · Skill format: https://documentation.openclaw.ai/clawhub/skill-format

## One-line summary

ClawHub (the OpenClaw skill marketplace) accepts the standard **SKILL.md** format — this folder is already compatible. Publish it directly with the CLI, no repackaging needed.

## Steps

```bash
# 1. Install OpenClaw (includes the clawhub CLI) and sign in
clawhub login

# 2. Publish this skill folder
clawhub skill publish ./clawhub \
  --slug ai-all-in-one-deploy-ops \
  --name "AI AllInOne Deploy & Ops" \
  --categories operations,development \
  --topics "ai-platform,self-hosted,docker,devops,llm"

# 3. First release starts at 1.0.0; later changes auto-bump the patch version.
#    Pass --version only when you need an explicit version.
#    Omit --owner to publish as yourself; add --owner <org> for an org.
```

## Recommended metadata

| Field | Value | Notes |
|---|---|---|
| slug | `ai-all-in-one-deploy-ops` | lowercase, npm-safe |
| name | `AI AllInOne Deploy & Ops` | |
| categories | `operations,development` | max 3; slugs must match the registry list exactly (`Operations`, `Development` are rejected) |
| topics | `ai-platform,self-hosted,docker,devops,llm` | max 5, ≤48 chars each; reserved words (approved/audited/official/verified/...) are rejected |
| version | `1.0.0` (auto) | omit `--version` unless you need a specific one |
| license | MIT-0 (ClawHub default) | declared in SKILL.md frontmatter; do NOT add conflicting license terms |

## Notes & rules

- **License**: everything on ClawHub is MIT-0. The skill's `license: MIT-0` in frontmatter matches that default. The platform (AI AllInOne) itself remains MIT — the two are separate.
- **No paid skills**: ClawHub has no paid/pricing/paywall support. Do not add pricing metadata.
- **Security scan**: every release runs automated security checks; new releases stay out of install/download surfaces until review finishes.
- **Content rules**: keep the description factual ("deploy & operate the AI AllInOne platform") — the skill is a legitimate DevOps/infra-operations listing, which is explicitly allowed ("Inspect, monitor, deploy, and operate local systems or infrastructure").
- **This is a doc-only skill** (no scripts, no credentials, no network callbacks) — the cleanest case for the security scanner.
- **Catalog repo alternative**: for CI publishing, use the reusable workflow `openclaw/clawhub/.github/workflows/skill-publish.yml@main` with a `CLAWHUB_TOKEN` secret.
