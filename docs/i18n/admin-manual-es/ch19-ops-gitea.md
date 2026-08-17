# Capítulo 19: Administración diaria de Gitea

*Parte II · Administración (operaciones diarias de cada producto)*

> Git interno + CI/CD: repositorios, organizaciones, Runners y Actions.

[← Capítulo 18: Administración diaria de Ghost](ch18-ops-ghost.md) · [📖 Índice](index.md) · [Capítulo 20: Administración diaria de MCP Gateway →](ch20-ops-mcp.md)

---

**Entrada**: Web `http://<IP-del-servidor>:3002`; SSH `ssh://git@<IP-del-servidor>:2222`.

## 19.1 Repositorios y organizaciones

1. **Crear repositorio**: + en la esquina superior derecha → New repository;

2. **Crear organización**: + → New organization; dentro de la organización crea repositorios y gestiona equipos;

3. **Migrar un repositorio externo**: + → New migration; rellena la dirección de GitHub para hacer mirror (sincroniza el código fuente en solo lectura).

## 19.2 Usuarios y permisos

- **Añadir usuario**: Site Administration → User Accounts → Create user;

- **Permisos de repositorio**: repositorio → Settings → Collaborators;

- **Equipos de organización**: organización → Teams → crea un equipo → añade miembros → asigna permisos de repositorio.

## 19.3 Gestión de Actions / Runner

1. **Activar Actions**: Site Administration → Actions → Enabled;

2. **Registrar Runner**: Runners → Create new Runner → copia el Token → rellena `GITEA_RUNNER_TOKEN` de `.env` → `docker compose up -d gitea-runner`;

3. **Ver el estado del Runner**: la página Runners muestra Idle (verde), que es lo normal;

4. **Ejecutar un workflow**: repositorio → Actions → ejecución manual o disparada por push.

> ⚠️ Para cambiar el token del Runner debe usarse `up -d` (restart no relee .env).

## 19.4 Configuración del sitio

- **ROOT_URL**: `GITEA__server__ROOT_URL` debe ser la de intranet `http://<IP-del-servidor>:3002/`; de lo contrario, los enlaces de repositorio generados son localhost;

- **Política de registro**: Site Administration → Config para ajustar el interruptor de registro y la configuración del correo.

> ⚠️ Punto crítico: el error `readonly database` suele deberse a que `gitea.db` pertenece a root; elimina esa db de root para que se recree con el usuario git.

> 📖 Documentación oficial:Documentación oficial de Gitea (en chino) https://docs.gitea.com/zh-cn · Administración https://docs.gitea.com/zh-cn/category/administration · Actions https://docs.gitea.com/zh-cn/usage/actions/overview

---

[← Capítulo 18: Administración diaria de Ghost](ch18-ops-ghost.md) · [📖 Índice](index.md) · [Capítulo 20: Administración diaria de MCP Gateway →](ch20-ops-mcp.md)
