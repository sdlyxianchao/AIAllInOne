# Capítulo 27: Backup e recuperação

*Parte 3 · Operações*

> Backup diário de todos os dados e recuperação com um clique.

[← Capítulo 26: MailHog: receptor de e-mails](ch26-ops-mailhog.md) · [📖 Índice](index.md) · [Capítulo 28: Verificação de integridade e autoteste na inicialização →](ch28-healthcheck.md)

---

**Entrada**: página «💾 Backup e recuperação» da Central de Administração de IA, ou pela linha de comando `scripts/backup.ps1` / `restore.ps1`. Backup automático diário às 02:00 via tarefa agendada, retendo 7 dias.

## 27.1 Itens de backup

| Item de backup | Método |
| --- | --- |
| MySQL do NewAPI | `mysqldump` |
| PostgreSQL do Dify | `pg_dump` |
| PostgreSQL do Langfuse | `pg_dump` |
| SQLite do Ghost / Gitea / Grafana | Cópia de arquivo |
| Keycloak | **realm export (JSON)** |
| Arquivos de configuração | Cópia de arquivo |

## 27.2 Backup manual

```
powershell -NoProfile -ExecutionPolicy Bypass -File C:\AIAllInOne\windows\scripts\backup.ps1
```

## 27.3 Backup agendado (tarefa agendada)

A tarefa agendada `AI-Platform-Backup` (diariamente às 02:00) já está registrada. Se não estiver registrada automaticamente, crie manualmente: Agendador de Tarefas → criar → programa `powershell.exe`, argumentos `-NoProfile -ExecutionPolicy Bypass -File C:\AIAllInOne\windows\scripts\backup.ps1`, gatilho diário às 02:00.

> 📌 O backup fica no disco C por padrão; recomenda-se sincronizar periodicamente `C:\AIAllInOne\backups\` para outro disco ou armazenamento de objetos como recuperação de desastre off-site.

## 27.4 Recuperação

```
powershell -NoProfile -ExecutionPolicy Bypass -File C:\AIAllInOne\windows\scripts\restore.ps1 -BackupDir C:\AIAllInOne\backups\backup_20260814_020001
```

O script pede a confirmação `yes` (adicione `-Force` para pular, somente para scripts/CI). Também é possível clicar em «Recuperar» de um backup na página «Backup e recuperação» da Central de Administração de IA.

## 27.5 Armadilhas críticas (validadas em simulações)

> ⚠️
> - O Keycloak deve usar **realm export/import (JSON)**; restaurar via pg_dump perde a associação de default role e não sobe;
> - Após restaurar o SQLite, o dono é root; faça chown para o uid correspondente (grafana=472, gitea=1000), senão dá readonly;
> - O pg_dump deve usar `--clean --if-exists` para evitar conflito na restauração;
> - No backup.ps1 antigo, o `Copy-Item` em lote falhava silenciosamente por causa do arquivo de ponto `.env`; já foi alterado para copiar arquivo por arquivo com `-LiteralPath`;
> - O backup da Central de Administração de IA usa base64 como intermediário + tar-fs para garantir segurança binária (o stdout do docker exec passa por utf8 e corromperia o SQLite .db).

---

[← Capítulo 26: MailHog: receptor de e-mails](ch26-ops-mailhog.md) · [📖 Índice](index.md) · [Capítulo 28: Verificação de integridade e autoteste na inicialização →](ch28-healthcheck.md)
