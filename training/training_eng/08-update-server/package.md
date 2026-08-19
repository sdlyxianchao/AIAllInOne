# Update Server — Training Package (M12 · Installer Distribution)

## Outline & Textbook

**Positioning**: DeepChat installer hosting & auto-update (port 8091, nginx). Employees download installers here; the DeepChat client auto-updates from here.

**Distribution chain**:
```
GitHub Releases → deepchat-sync (Gitea Actions) → Update Server(:8091/deepchat/)
      └─ writes version.txt / updates Ghost download page(/deepchat/) ─> employees / DeepChat auto-update
```

**Manual upload & verify**:
```
mkdir -p deepchat-updates/deepchat
curl -L -o deepchat-updates/deepchat/DeepChat-1.1.0-windows-x64.exe \
  https://github.com/ThinkInAIXYZ/deepchat/releases/download/v1.1.0/DeepChat-1.1.0-windows-x64.exe
curl -I http://<SERVER_IP>:8091/deepchat/DeepChat-1.1.0-windows-x64.exe   # 200/206
```
- Supports .exe/.dmg/.AppImage; custom electron-builder builds put .exe + latest.yml here too.

**Auto-update mechanics**: DeepChat `build.publish.url = http://<SERVER_IP>:8091/deepchat/` (generic provider); client reads **latest.yml** at startup → compares local version → auto-download/install. **version.txt** is maintained by deepchat-sync to track "latest synced".

**FAQ**:
| Issue | Fix |
|---|---|
| :8091 returns 403 | normal (empty dir, no index.html); service is up |
| download 404 | filename/path wrong; installer not uploaded |
| no auto-update | latest.yml current & well-formed? publish.url reachable? |
| version rollback | sync only downloads newer; check version_source/keep_releases |
| slow in CN | sync-config.json download_prefix (e.g. ghproxy) |

**Platform docs**: `../../docs/admin-manual/ch21-ops-update.md`, `ch10-deepchat.md`; nginx config `../../windows/update-server-nginx.conf`.

## Training Plan (1 h, D8 PM)

| Time | Content | Method |
|---|---|---|
| 15:00-15:30 | chain + dir structure + mechanics | lecture |
| 15:30-16:00 | Lab: put an installer in deepchat-updates/deepchat → curl -I → Ghost /deepchat/ link works | lab |

**Lab checklist**: installer (+ latest.yml) present; curl -I 200/206; Ghost download page shows the version; can explain version.txt / latest.yml / publish.url.

## Exam (merged with M08/M09)

**Theory (4 pts × 5 = 20)**: 1. 403 on :8091 → B service up, normal; 2. auto-update manifest → B latest.yml; 3. employee download entry → B Ghost /deepchat/ page; 4. rollback guard → B only download when newer; 5. CN acceleration → B download_prefix.

**Hands-on (30)**: upload a new installer, verify 200, make Ghost download page show it.

**Defense (10)**: "Client never updates — debug?" (version.txt/latest.yml, publish.url, Update Server reachability, download page).

**Scorecard**: Theory(20) + Hands-on(30) + Defense(10).
