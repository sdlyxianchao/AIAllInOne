# Capítulo 27: Copia de seguridad y restauración

*Parte III · Operaciones*

> Copia de seguridad diaria de todos los datos y restauración con un clic.

[← Capítulo 26: Receptor de correo MailHog](ch26-ops-mailhog.md) · [📖 Índice](index.md) · [Capítulo 28: Verificación de estado y autocomprobación de arranque →](ch28-healthcheck.md)

---

**Entrada**: página «💾 Copia de seguridad y restauración» del Centro de administración de IA, o por línea de comandos `scripts/backup.ps1` / `restore.ps1`. La tarea programada hace una copia automática todos los días a las 02:00 y conserva 7 días.

## 27.1 Elementos de la copia

| Elemento | Método |
| --- | --- |
| NewAPI MySQL | `mysqldump` |
| Dify PostgreSQL | `pg_dump` |
| Langfuse PostgreSQL | `pg_dump` |
| Ghost / Gitea / Grafana SQLite | Copia de archivos |
| Keycloak | **realm export (JSON)** |
| Archivos de configuración | Copia de archivos |

## 27.2 Copia manual

```
powershell -NoProfile -ExecutionPolicy Bypass -File C:\AIAllInOne\windows\scripts\backup.ps1
```

## 27.3 Copia programada (tarea programada)

Ya está registrada la tarea programada `AI-Platform-Backup` (todos los días a las 02:00). Si no se registró automáticamente, créala manualmente: Programador de tareas → Nueva → programa `powershell.exe`, argumentos `-NoProfile -ExecutionPolicy Bypass -File C:\AIAllInOne\windows\scripts\backup.ps1`, desencadenador todos los días a las 02:00.

> 📌 Las copias están por defecto en el disco C; se recomienda sincronizar periódicamente `C:\AIAllInOne\backups\` a otro disco o a almacenamiento de objetos para recuperación ante desastres en otra ubicación.

## 27.4 Restauración

```
powershell -NoProfile -ExecutionPolicy Bypass -File C:\AIAllInOne\windows\scripts\restore.ps1 -BackupDir C:\AIAllInOne\backups\backup_20260814_020001
```

El script pide confirmar escribiendo `yes` (añade `-Force` para saltarlo; solo para scripts/CI). También puedes hacer clic en «Restaurar» de una copia en la página «Copia de seguridad y restauración» del Centro de administración de IA para restaurar con un clic.

## 27.5 Puntos críticos (verificados en simulacros)

> ⚠️
> - Keycloak debe usar **realm export/import (JSON)**; restaurar con pg_dump pierde la asociación del default role y no arranca;
> - Tras restaurar SQLite, el propietario es root; hay que hacer chown al uid correspondiente (grafana=472, gitea=1000); de lo contrario da readonly;
> - pg_dump con `--clean --if-exists` evita conflictos de restauración;
> - El backup.ps1 antiguo, al copiar por lotes con `Copy-Item`, fallaba silenciosamente en toda la tanda por el archivo de punto `.env`; ya se cambió a copia archivo a archivo con `-LiteralPath`;
> - La copia del Centro de administración de IA usa base64 como transporte + tar-fs para garantizar la seguridad binaria (la stdout de docker exec pasa por utf8 y corrompería los .db de SQLite).

---

[← Capítulo 26: Receptor de correo MailHog](ch26-ops-mailhog.md) · [📖 Índice](index.md) · [Capítulo 28: Verificación de estado y autocomprobación de arranque →](ch28-healthcheck.md)
