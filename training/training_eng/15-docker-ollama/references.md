# Docker + Compose + Ollama — References (learning resources)

> Covers Docker Desktop / Docker Compose / Ollama (platform foundation).

## Local (read first)
| Doc | Location |
|---|---|
| Admin Manual ch02 (prereq) | `../../docs/admin-manual/ch02-prereq.md` |
| Admin Manual ch04 (start) | `../../docs/admin-manual/ch04-start.md` |
| Admin Manual ch05 (Dify deploy) | `../../docs/admin-manual/ch05-dify-deploy.md` |
| Deployment Guide §2–§5 | `../../windows/windows-deploy-guide-v2.en.html` |
| Compose file | `../../windows/docker-compose.yml` (read it over any tutorial) |
| Training package | `package.md` |

## Official
| Doc | Link |
|---|---|
| Docker docs | https://docs.docker.com/ |
| Compose file reference | https://docs.docker.com/compose/compose-file/ |
| Docker Desktop (Windows) | https://docs.docker.com/desktop/install/windows-install/ |
| Ollama docs | https://docs.ollama.com |
| Ollama model library | https://ollama.com/search |

## Videos / articles
| Resource | Link |
|---|---|
| Docker 1-Hour Course (compose, Desktop) | https://www.bilibili.com/video/BV1Kg411D78F/ |
| Docker beginner→practice (KuangShen) | https://www.bilibili.com/video/BV1kv411q7Qc |
| Compose microservice deployment (20 min) | https://www.bilibili.com/video/BV1Cp4y1F7eA/ |
| Windows Ollama install & deploy | https://www.cnblogs.com/hanshuixin/articles/-/windows-ollama-local-llm-deployment-guide-setup |
| Ollama kindergarten tutorial | https://my.feishu.cn/wiki/Yzrbw6AcjikiwqkDyHbcjcM9nVf |
| Ollama + Open WebUI (Bilibili) | https://www.bilibili.com/video/BV1hLqCYGESx/ |

## Self-study path
1. `package.md` → 8 port conflicts, 🔴 .env vars, up -d vs restart; 2. labs (install → .wslconfig → core services → Dify → Ollama bge-m3); 3. Docker 1-Hour video (1.5×) + Windows Ollama article; 4. Compose reference on demand (volumes/networks/depends_on); 5. Ollama: Modelfile + REST API (the semantic cache relies on bge-m3).
