# Capítulo 28: Verificação de integridade e autoteste na inicialização

*Parte 3 · Operações*

> Exame completo de todos os 41 contêineres + cadeia completa de LLM + cadeia de autenticação com um clique.

[← Capítulo 27: Backup e recuperação](ch27-backup.md) · [📖 Índice](index.md) · [Capítulo 29: Manual de solução de problemas →](ch29-troubleshooting.md)

---

**Script**: `C:\AIAllInOne\windows\scripts\health-check.ps1`, saída `health_check_<timestamp>.log`. Cobre 41 contêineres (25 do núcleo Windows + 16 do Dify), lê as credenciais do `.env`, sem senhas fixas no código.

## 28.1 Escopo da verificação (9 estágios)

| Estágio | Item verificado |
| --- | --- |
| Stage 1 | Se o Docker Daemon está em execução (aguarda a prontidão, adequado ao autoteste na inicialização) |
| Stage 2 | Status dos 41 contêineres (Up/Exited/Restarting) |
| Stage 3 | Resposta de 10 endpoints HTTP |
| Stage 4 | Readiness do LiteLLM + registro de modelos, API do Dify, saúde de banco/Redis/Sandbox |
| Stage 5 | Cadeia completa de LLM (NewAPI → LiteLLM → DeepSeek com requisição real) |
| Stage 6 | Cadeia de autenticação da conta AD + login de administrador do NewAPI |
| Stage 7 | MCP Gateway + funcionalidade de Skill |
| Stage 8 | Pré-condições de login do DSH Desktop/Dify |
| Stage 9 | Espaço em disco |

## 28.2 Execução manual

```
C:\AIAllInOne\windows\scripts\health-check.ps1
dir C:\AIAllInOne\windows\scripts\health_check_*.log
```

> ✅ No final da saída, `ALL CLEAR` e `Fail: 0` indicam que tudo está normal.

## 28.3 Inicialização automática (tarefa agendada)

```
$action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-NoProfile -ExecutionPolicy Bypass -File C:\AIAllInOne\windows\scripts\health-check.ps1"
$trigger = New-ScheduledTaskTrigger -AtLogOn
$trigger.Delay = "PT2M"   # atraso de 2 minutos após o login para aguardar o Docker + contêineres iniciarem
Register-ScheduledTask -TaskName "AI-Platform-HealthCheck" -Action $action -Trigger $trigger -RunLevel Highest
```

> 📌 Atenção: o script usa `127.0.0.1`, não localhost; a saúde interna do LiteLLM usa `/health/readiness` (sem autenticação); `dify-init_permissions-1` Exited(0) é normal; o Servidor de Atualização retorna 403 normalmente (sem index.html padrão); exit code 0=aprovado, 1=com falhas.

---

[← Capítulo 27: Backup e recuperação](ch27-backup.md) · [📖 Índice](index.md) · [Capítulo 29: Manual de solução de problemas →](ch29-troubleshooting.md)
