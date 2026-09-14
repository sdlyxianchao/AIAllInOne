# Docker + Compose + Ollama — Training Plan (M02, 6 h, D1–D2)

## 1. Schedule

| Slot | Content | Method |
|---|---|---|
| D1 AM 1 | Concepts + commands | lecture+demo |
| D1 AM 2-3 | Lab: Docker Desktop config + command drills | lab |
| D1 PM 1 | Env prep: .wslconfig/dirs/.env/network | lecture |
| D1 PM 2-3 | Lab: edit .env (🔴 8 vars), create network, fix IP | lab |
| D2 AM 1 | Compose syntax + port table | lecture |
| D2 AM 2-3 | Lab: start core services + per-service verify (S) | lab |
| D2 PM 1 | Dify deploy + troubleshooting | lecture |
| D2 PM 2-3 | Lab: Dify 15 containers + Ollama + bge-m3 | lab |

## 2. Lab Checklist

- [ ] `docker ps` all core Up (S)
- [ ] Explain any compose service block
- [ ] 🔴 8 .env vars set
- [ ] ai-platform exists
- [ ] Dify 15 containers Up (S)
- [ ] `ollama pull bge-m3` OK
- [ ] Fixed one container issue with docker logs
