# Update Server — Textbook (M12 · Installer Distribution)

> Port 8091 (nginx). Container `update-server`.

## 1. Manual upload & verify

```bash
mkdir -p dsh-updates/dsh
curl -L -o dsh-updates/dsh/dsh-desktop-windows-x64-setup.exe \
  https://github.com/dataelement/dsh-desktop/releases/download/v0.5.0/dsh-desktop-windows-x64-setup.exe
curl -I http://<SERVER_IP>:8091/dsh/dsh-desktop-windows-x64-setup.exe   # 200/206
```

- Supports .exe/.dmg/.AppImage; custom electron-builder builds put .exe + latest.yml here too.

## 2. FAQ

| Issue | Fix |
|---|---|
| :8091 returns 403 | normal (empty dir, no index.html); service is up |
| download 404 | filename/path wrong; installer not uploaded |
| no auto-update | latest.yml current & well-formed? publish.url reachable? |
| version rollback | sync only downloads newer; check version_source/keep_releases |
| slow in CN | sync-config.json download_prefix (e.g. ghproxy) |
