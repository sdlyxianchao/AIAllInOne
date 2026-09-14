# Capítulo 24: Registro unificado (Loki)

*Parte II · Administración (operaciones diarias de cada producto)*

> Agrega los registros de todos los contenedores y permite buscar por contenedor + palabra clave + tiempo.

[← Capítulo 23: Observabilidad de LLM (Langfuse)](ch23-ops-langfuse.md) · [📖 Índice](index.md) · [Capítulo 25: Enmascaramiento de PII (Presidio) →](ch25-ops-pii.md)

---

**Entrada**: página «📜 Registro unificado» del Centro de administración de IA (la más cómoda), o Loki `http://<IP-del-servidor>:3110`.

## 24.1 Componentes

| Componente | Puerto | Uso |
| --- | --- | --- |
| Loki | 3110 | Almacenamiento y consulta de registros (monomáquina, sistema de archivos local) |
| Promtail | — (interno) | Descubre contenedores mediante docker.sock, recolecta los registros json y los envía a Loki |

## 24.2 Consultar registros

1. Centro de administración de IA → Registro unificado;

2. Elige el contenedor (desplegable) → rellena la palabra clave → elige el rango de tiempo → consulta;

3. El backend `/api/logs/query` consulta Loki con LogQL.

## 24.3 Referencia rápida de LogQL

```
{container="new-api"} |= "error"              # líneas de un contenedor que contienen error
{container=~".+"} |~ "(?i)error|exception"      # coincide en todos los contenedores
{service="litellm"} |= "EMAIL"                  # consulta por servicio
```

> 📌 Las labels de Loki son `container / project / service`, **no hay `job`**. Consulta con `{container=~".+"}` y no con `{job="docker"}`.

> ⚠️ Punto crítico (montajes de Docker Desktop): Promtail debe montar `/var/run/docker.sock` y `/var/lib/docker/containers` (en WSL2 apuntan al interior de la VM de Docker Desktop, que es precisamente donde están los registros); no uses la ruta `C:\...\containers` del Windows host. Loki monomáquina usa `store: tsdb` + filesystem.

> 📖 Documentación oficial:Documentación oficial de Loki https://grafana.com/docs/loki/latest/

---

[← Capítulo 23: Observabilidad de LLM (Langfuse)](ch23-ops-langfuse.md) · [📖 Índice](index.md) · [Capítulo 25: Enmascaramiento de PII (Presidio) →](ch25-ops-pii.md)
