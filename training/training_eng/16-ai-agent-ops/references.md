# AI Agent Operations — References (learning resources)

> Covers WorkBuddy / OpenClaw / Microsoft Scout for agent-driven platform ops.

## Local (read first — authoritative)
| Doc | Location |
|---|---|
| AI Agent Operations Guide (9 languages) | `../../AI-AGENT-OPS.md` |
| Deployment Guide chapter 0 (full agent-driven deploy prompt) | `../../windows/windows-deploy-guide-v2.en.html` |
| Training package | `package.md` |

## Agent product docs
| Product | Docs |
|---|---|
| WorkBuddy (this tool) | built-in help / settings |
| OpenClaw | https://docs.openclaw.ai / https://github.com/openclaw/openclaw |
| Microsoft Scout | per official Microsoft site (latest) |

## Note
This module's "materials" are really **a set of reusable prompts & habits** — practice over watching:
1. Read `AI-AGENT-OPS.md` fully → the "everything is files/commands/APIs" principle;
2. Labs (D9 PM, instructor plants faults): health check → fault locate → backup → trigger sync → release;
3. Internalize the 6 best practices (frontend/backend reload, Ctrl+F5, no secrets, verify-don't-believe, backup before destructive, ask params first);
4. Turn the ops playbooks into Skills (SKILL.md + scripts) distributed via the Skill marketplace (M10).

## Advanced
- Fix the "platform health check / backup / release" playbooks as Skills for employee DSH Desktop — see M10.
- Watch each agent product's official updates (OpenClaw iterates fast; follow its releases).
