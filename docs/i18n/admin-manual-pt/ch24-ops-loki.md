# Capítulo 24: Logs unificados (Loki)

*Parte 2 · Gestão (operações diárias de cada produto)*

> Agregar logs de todos os contêineres, com busca por contêiner + palavra-chave + tempo.

[← Capítulo 23: Observabilidade de LLM (Langfuse)](ch23-ops-langfuse.md) · [📖 Índice](index.md) · [Capítulo 25: Anonimização de PII (Presidio) →](ch25-ops-pii.md)

---

**Entrada**: página «📜 Logs unificados» da Central de Administração de IA (mais conveniente), ou Loki `http://<IP-do-servidor>:3110`.

## 24.1 Componentes

| Componente | Porta | Uso |
| --- | --- | --- |
| Loki | 3110 | Armazenamento e consulta de logs (standalone, sistema de arquivos local) |
| Promtail | — (interno) | Descobre contêineres via docker.sock, coleta logs json e envia ao Loki |

## 24.2 Consultar logs

1. Central de Administração de IA → Logs unificados;

2. Selecione o contêiner (dropdown) → digite a palavra-chave → selecione o intervalo de tempo → consultar;

3. O backend `/api/logs/query` consulta o Loki com LogQL.

## 24.3 Consulta rápida de LogQL

```
{container="new-api"} |= "error"              # linhas com "error" em um contêiner
{container=~".+"} |~ "(?i)error|exception"      # corresponde a todos os contêineres
{service="litellm"} |= "EMAIL"                  # consulta por serviço
```

> 📌 Os labels do Loki são `container / project / service`, **sem `job`**. Use `{container=~".+"}` em vez de `{job="docker"}`.

> ⚠️ Armadilha crítica (montagem no Docker Desktop): o Promtail precisa montar `/var/run/docker.sock` e `/var/lib/docker/containers` (no WSL2, apontam para dentro da VM do Docker Desktop, que é exatamente onde ficam os logs); não use o caminho `C:\...\containers` do Windows do host. O Loki standalone usa `store: tsdb` + filesystem.

> 📖 Documentação oficial:documentação oficial do Loki https://grafana.com/docs/loki/latest/

---

[← Capítulo 23: Observabilidade de LLM (Langfuse)](ch23-ops-langfuse.md) · [📖 Índice](index.md) · [Capítulo 25: Anonimização de PII (Presidio) →](ch25-ops-pii.md)
