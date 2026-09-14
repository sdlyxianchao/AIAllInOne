# Capítulo 22: Administración de monitoreo y alertas

*Parte II · Administración (operaciones diarias de cada producto)*

> Prometheus + Grafana + Alertmanager: monitoreo de recursos de contenedores y notificaciones de alerta.

[← Capítulo 21: Administración del servidor de actualización](ch21-ops-update.md) · [📖 Índice](index.md) · [Capítulo 23: Observabilidad de LLM (Langfuse) →](ch23-ops-langfuse.md)

---

**Entrada**: Grafana `http://<IP-del-servidor>:3030` (inicio de sesión automático por SSO); Prometheus `:9091`; Alertmanager `:9093`.

## 22.1 Componentes y puertos

| Componente | Puerto | Uso |
| --- | --- | --- |
| cadvisor | 8080 (interno) | Recolecta CPU/memoria/red/disco de cada contenedor |
| Prometheus | 9091 | Agrega métricas + reglas de alerta (`monitoring/alerts.yml`) |
| Grafana | 3030 | Panel de visualización (precargado «AI All In One — Monitoreo de contenedores») |
| Alertmanager | 9093 | Deduplicación/agrupación/enrutamiento/notificación de alertas |

## 22.2 Ver el panel

1. Inicia sesión en Grafana (`ai_all_in_one_admin` / contraseña unificada, SSO automático);

2. Abre el panel «AI All In One — Monitoreo de contenedores» para ver la CPU/memoria/red de cada contenedor.

## 22.3 Reglas de alerta

Reglas preconfiguradas (`monitoring/alerts.yml`): contenedor caído (critical), memoria del contenedor > 90% (warning), CPU del contenedor > 80% (warning).

> ⚠️ Escollo de falsas alertas: cadvisor informa de todos los cgroup del host (incluido systemd); las reglas de alerta deben filtrar con `{name!=""}`, y la alerta de memoria debe añadir además `container_spec_memory_limit_bytes > 0` (de lo contrario, con limit=0 se divide por cero y se dispara siempre).

## 22.4 Conectar canales de notificación de alertas (IM empresarial)

La ruta de alertas es **Prometheus → Alertmanager → AI Admin Center (`/api/alert-webhook`) → IM empresarial**. Configúralo en el menú **« Operaciones → Alertas IM empresariales »** (la configuración se guarda en Redis y sobrevive al reinicio):

- **Destinatarios**: añade varios. Tipo « DingTalk/WeCom/Feishu » = bot de grupo (URL de webhook, envía al grupo); tipo « DingTalk App (a una persona) » (AppKey/AppSecret/AgentId/userid) o « WeCom App (a una persona) » (corpId/secret/agentid/userid) = app empresarial, envía a personas.

- **Reglas de envío**: interruptor general, severidad mínima (crítica/advertencia/info), enviar o no notificaciones « firing » / « resolved ».

- **Historial de envío**: registra cada envío (hora/destinatario/tipo/nombre de alerta/severidad/resultado), con paginación, tamaño de página ajustable, búsqueda por palabra clave y filtrado por tipo/resultado/severidad.

- Cada destinatario tiene un botón « Probar » para enviar un mensaje de prueba y un interruptor de activación.

> ⚠️ Un webhook de bot de grupo solo puede enviar a un **grupo**, no a una persona. Para enviar a personas usa los tipos « app empresarial » (DingTalk/WeCom), que requieren una app interna creada en la consola de administración con permiso de mensajes. Los bots de grupo de DingTalk también necesitan « palabras clave personalizadas » (ej. « AI 平台 » / « 告警 ») o « firma », de lo contrario el mensaje se bloquea por la política de seguridad.

> 📌 Nota sobre conflictos de puertos: el 9090 por defecto de Prometheus lo ocupa Keycloak, por eso se cambió a 9091; el 3000/3001 por defecto de Grafana está ocupado, por eso se cambió a 3030.

> 📖 Documentación oficial:Grafana https://grafana.com/docs/grafana/latest/ · Prometheus https://prometheus.io/docs/ · Alertmanager https://prometheus.io/docs/alerting/latest/alertmanager/

---

[← Capítulo 21: Administración del servidor de actualización](ch21-ops-update.md) · [📖 Índice](index.md) · [Capítulo 23: Observabilidad de LLM (Langfuse) →](ch23-ops-langfuse.md)
