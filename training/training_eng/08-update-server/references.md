# Update Server — References (learning resources)

## Local (read first)
| Doc | Location |
|---|---|
| Admin Manual ch21 (ops) | `../../docs/admin-manual/ch21-ops-update.md` |
| Admin Manual ch10 (distribution) | `../../docs/admin-manual/ch10-deepchat.md` |
| Deployment Guide §7, §9 | `../../windows/windows-deploy-guide-v2.en.html` |
| Nginx config | `../../windows/update-server-nginx.conf` |
| Installer dir | `../../windows/deepchat-updates/` |
| Training package | `package.md` |

## Official
| Doc | Link |
|---|---|
| Nginx docs | https://nginx.org/en/docs/ |
| electron-builder Generic provider (latest.yml mechanics) | https://www.electron.build/configuration/publish#GenericOptions |
| DeepChat docs | https://deepchatai.cn/docs/ |

## Note
Update Server is plain **nginx static hosting** — no dedicated tutorial exists. The real knowledge = static serving + electron-builder auto-update. Study path: 1. `package.md` (chain; version.txt / latest.yml / publish.url); 2. lab (upload → curl -I → check latest.yml); 3. electron-builder publish docs; 4. ties: deepchat-sync (M08) + Ghost download page (M07).
