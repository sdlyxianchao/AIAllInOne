# Capítulo 22: Gestão de monitoramento e alertas

*Parte 2 · Gestão (operações diárias de cada produto)*

> Prometheus + Grafana + Alertmanager: monitoramento de recursos dos contêineres e notificação de alertas.

[← Capítulo 21: Gestão do Servidor de Atualização](ch21-ops-update.md) · [📖 Índice](index.md) · [Capítulo 23: Observabilidade de LLM (Langfuse) →](ch23-ops-langfuse.md)

---

**Entrada**: Grafana `http://<IP-do-servidor>:3030` (login automático via SSO); Prometheus `:9091`; Alertmanager `:9093`.

## 22.1 Componentes e portas

| Componente | Porta | Uso |
| --- | --- | --- |
| cadvisor | 8080 (interno) | Coleta CPU/memória/rede/disco de cada contêiner |
| Prometheus | 9091 | Agrega métricas + regras de alerta (`monitoring/alerts.yml`) |
| Grafana | 3030 | Painel de visualização (pré-configurado «AI All In One — monitoramento de contêineres») |
| Alertmanager | 9093 | Deduplicação/agrupamento/roteamento/notificação de alertas |

## 22.2 Ver o painel

1. Entre no Grafana (`ai_all_in_one_admin` / senha unificada, login automático via SSO);

2. Abra o painel «AI All In One — monitoramento de contêineres» e veja CPU/memória/rede de cada contêiner.

## 22.3 Regras de alerta

Regras pré-configuradas (`monitoring/alerts.yml`): contêiner fora do ar (critical), memória do contêiner >90% (warning), CPU do contêiner >80% (warning).

> ⚠️ Armadilha de falsos positivos: o cadvisor reporta todos os cgroups do host (incluindo systemd); a regra de alerta deve filtrar com `{name!=""}`, e o alerta de memória também precisa de `container_spec_memory_limit_bytes > 0` (senão, com limit=0, a divisão por zero dispara sempre).

## 22.4 Conectar a notificação de alertas (IM empresarial)

O caminho das alertas é **Prometheus → Alertmanager → AI Admin Center (`/api/alert-webhook`) → IM empresarial**. Configure-o no menu **« Operações → Alertas IM empresariais »** (a configuração fica no Redis e sobrevive a reinícios):

- **Destinatários**: adicione vários. Tipo « DingTalk/WeCom/Feishu » = bot de grupo (URL do webhook, envia para o grupo); tipo « DingTalk App (para pessoa) » (AppKey/AppSecret/AgentId/userid) ou « WeCom App (para pessoa) » (corpId/secret/agentid/userid) = app empresarial, envia para pessoas.

- **Regras de envio**: interruptor geral, severidade mínima (crítico/aviso/info), enviar ou não notificações « firing » / « resolved ».

- **Histórico de envio**: registra cada envio (hora/destinatário/tipo/nome da alerta/severidade/resultado), com paginação, tamanho de página ajustável, busca por palavra-chave e filtro por tipo/resultado/severidade.

- Cada destinatário tem um botão « Testar » para enviar mensagem de teste e um interruptor de ativação.

> ⚠️ Um webhook de bot de grupo só pode enviar para um **grupo**, não para uma pessoa. Para enviar a pessoas use os tipos « app empresarial » (DingTalk/WeCom), que exigem um app interno criado no console de administração com permissão de mensagens. Bots de grupo do DingTalk também precisam de « palavras-chave personalizadas » (ex. « AI 平台 » / « 告警 ») ou « assinatura », senão a mensagem é bloqueada pela política de segurança.

> 📌 Sobre conflito de portas: a porta 9090 padrão do Prometheus está ocupada pelo Keycloak, então foi alterada para 9091; a 3000/3001 padrão do Grafana está ocupada, então foi alterada para 3030.

> 📖 Documentação oficial:Grafana https://grafana.com/docs/grafana/latest/ · Prometheus https://prometheus.io/docs/ · Alertmanager https://prometheus.io/docs/alerting/latest/alertmanager/

---

[← Capítulo 21: Gestão do Servidor de Atualização](ch21-ops-update.md) · [📖 Índice](index.md) · [Capítulo 23: Observabilidade de LLM (Langfuse) →](ch23-ops-langfuse.md)
