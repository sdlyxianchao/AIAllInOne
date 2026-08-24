# Gitea + Runner — References (learning resources)

## Local (read first)
| Doc | Location |
|---|---|
| Admin Manual ch09 (products) | `../../docs/admin-manual/ch09-products.md` |
| Admin Manual ch10 (dsh-sync) | `../../docs/admin-manual/ch10-dsh.md` |
| Admin Manual ch19 (ops) | `../../docs/admin-manual/ch19-ops-gitea.md` |
| Deployment Guide §6.6, §9 | `../../windows/windows-deploy-guide-v2.en.html` |
| Runner config | `../../windows/gitea-runner-config.yaml` |
| Training package | `package.md` |

## Official
| Doc | Link |
|---|---|
| Gitea docs (zh) | https://docs.gitea.com/zh-cn |
| Actions quickstart (zh) | https://docs.gitea.com/zh-cn/usage/actions/quickstart |
| Actions overview | https://docs.gitea.com/zh-cn/usage/actions/overview |
| act_runner | https://docs.gitea.com/zh-cn/usage/actions/act-runner |
| Source | https://github.com/go-gitea/gitea |

## Videos / articles
| Resource | Link |
|---|---|
| Gitea setup/use tutorial (Bilibili column) | https://www.bilibili.com/read/cv25247185/ |
| Gitea — Go open-source project (Bilibili, incl. Actions) | https://www.bilibili.com/video/BV143411x7DW |
| 5-min Gitea quickstart (CSDN) | https://blog.csdn.net/gitblog_00225/article/details/151537211 |
| Gitea CI/CD pipeline (CSDN) | https://blog.csdn.net/gitblog_00768/article/details/151824873 |
| Automating release versioning with Gitea Actions (official EN) | https://about.gitea.com/resources/tutorials/automating-release-versioning-with-gitea-actions-to-the-gitea-package-registry |

## Self-study path
1. `package.md` → Runner 4 pitfalls + dsh-sync; 2. labs (init→register→trigger→write workflow); 3. official quickstart + CSDN pipeline (on/jobs/steps/containers); 4. pitfalls: readonly database / ROOT_URL / force_pull (§6.6).
