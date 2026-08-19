# Training Policies & FAQ (English)

## 1. Administration

- **Attendance & credits**: 1 credit per hour, 60 total; <80% attendance → no final exam. 3 late/absent marks = 1 absence; leave requires 1-day notice.
- **Homework & quizzes**: homework due before next session; 1 miss = −5 daily points. Phase quizzes (D2/D5/D8) count 10% toward daily score.
- **Lab discipline**: independent machines; no real enterprise data/keys on training machines; on failure self-diagnose 15 min (logs first), then ask with "symptom + what I tried".
- **Graduation**: all three assessments pass → certificate (template in exam package); number AIAIO-<session>-<no>; records archived.

## 2. Environment Prep Checklist (instructor)

- [ ] Machine: Windows 11 Pro + Docker Desktop (WSL2), ≥16 GB RAM, ≥60 GB SSD
- [ ] Docker Desktop running (`docker info`)
- [ ] Platform code at `C:\AIAllInOne` (windows/, docs/, training/)
- [ ] `.env` configured (🔴 8 vars); DeepSeek key with quota
- [ ] `ai-platform` network created; intranet IP fixed (DHCP reservation)
- [ ] Optional: Hyper-V DC VM (AD demo), Ollama (bge-m3)
- [ ] Printed: port card, sanitized credentials sheet, daily homework sheets
- [ ] Phase quiz papers & exam environment (D2/D5/D8)
- [ ] Final: papers A/B, hands-on scorecards, defense questions

## 3. FAQ

**1. No tech background — can I take it?** Basic IT literacy is enough. M01/M02 start from zero; core modules are "follow-along" labs. Tier C first, then move to Tier A.

**2. Do we really deploy?** Yes — the course centers on deploying the real platform once (~41 containers). No deploy, no graduation. One machine is enough.

**3. No AD domain to practice Keycloak?** Method A (local accounts) covers ~80%. For AD, use the instructor's Hyper-V DC VM or simulate with OpenLDAP per the docs.

**4. LLM API keys?** DeepSeek (platform.deepseek.com) is cheap and sufficient; OpenAI/Claude work too. At least 1 key to get the chain green.

**5. Ready to work after training?** Tier A pass covers independent deployment & ops; a 1-week supervised internship (daily inspection + support) is recommended.

**6. Platform upgraded?** This package is based on v0.9x (Windows). After upgrades, follow `windows-deploy-guide-v2.en.html` and `docs/`; watch GitHub Releases/changelogs.

**7. Training handbook PDF?** This package is Markdown + HTML: print `index.html` (has print CSS) or convert per chapter (Pandoc/Typora).

**8. Intranet can't reach the videos?** `video-index.md` links are public. To internalize, pre-download to a share/portal (mind copyright) and update the index.

## 4. Post-Graduation Follow-Up

| Period | Action |
|---|---|
| Week 1 | supervised internship: daily inspection + real support, output inspection reports |
| Month 1 | independent backup/restore drill; new-hire support session |
| Quarterly | re-train on upgrades; community exchange (WeChat group / GitHub Discussions) |

## 5. Instructor Materials
- This package (all folders)
- Phase quiz papers (drawn from module exams)
- Fault-planting script list for drills
- Final papers A/B, scorecards, certificate templates
