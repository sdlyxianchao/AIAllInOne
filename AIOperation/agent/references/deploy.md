# 部署与初始化参考

> 通用部署流程，不绑定特定服务器。部署参数（内网 IP、AD 域控、管理员账号、模型 API Key）由
> 部署者提供，AI Agent 部署时**逐项向用户询问，不允许猜测**。详细端口表/数据流见各形态部署指南。

## 1. 部署形态选择

| 形态 | 适用 | 编排目录 |
|---|---|---|
| Windows | 单机、公司内网（Docker Desktop + WSL2），含 AD 域控对接示例 | `windows/` |
| Linux | 单机 Linux（Docker Engine） | `linux/` |
| Docker | 纯 Docker 编排参考 | `docker/` |

## 2. 标准部署流程（以 Windows 为例）

1. **前置**：机器装 Docker Desktop（WSL2 引擎），网络能访问镜像仓库
2. **取代码**：clone 项目或拷贝部署目录
3. **配 .env**：把 `.env.example` 复制为 `.env` 并填入全部凭据（各产品密码、API Key、AD/LDAP 配置、服务器内网 IP）
4. **起编排**：
   ```bash
   cd <形态目录>
   docker compose up -d
   ```
5. **初始化**（容器起来 ≠ 平台可用，必须初始化）：
   - Keycloak：创建 realm、OIDC client、`ai-platform-admin` 角色、统一管理员
   - NewAPI：配置渠道（LiteLLM/直连）、生成应用令牌（deepchat-key / dify-key）、SSO
   - Dify：独立 compose 启动、模型供应商指向 NewAPI、SSO
   - Ghost：初始化 + 部署 Corp Portal 主题 + 导入示例内容
   - Gitea：安装 + Runner 注册 + Actions 工作流
   - 监控/日志/可观测：确认抓取目标与日志管道
6. **验证**：跑健康检查脚本 → 9 阶段全过；Admin Center 可用性测试全测通过

> 初始化细节见 `<形态>/*-deploy-guide-v2.md`（含 AD 集成、端口表、许可审查）和
> `docs/admin-manual/`（30 章管理员手册，含运维/备份/故障排查，9 语言）。

## 3. AI Agent 部署（推荐）

项目提供**部署提示词**，把部署目录和提示词交给 AI Agent（WorkBuddy 等），它就能照着部署文档逐步配置：

1. Agent 先读部署指南、核对清单、docker-compose、.env 模板、自动化脚本
2. 提示词要求 Agent **逐项向用户要参数**：内网 IP、AD 域控配置、管理员账号、模型 API Key——一项都不许猜
3. 按章节推进，能用脚本用脚本；某步失败先查日志找原因再改
4. 最后端到端验证：SSO 登录、真实对话、监控、备份恢复，逐项报告结果

## 4. 部署后核对

- 核心容器全部 Up：Keycloak / NewAPI / LiteLLM / Ghost / Gitea / Update Server / Admin Center / MCP Gateway / 监控全家桶
- 用内网 IP 访问（不要用 127.0.0.1——OIDC redirect_uri 会报 `invalid_grant`）
- `*-checklist.html` 可作部署进度核对（浏览器勾选、自动保存）

## 5. 升级流程

1. 先备份（`scripts/backup.ps1`）
2. 更新代码/拉新镜像：`git pull`（或替换部署目录）→ `docker compose pull`
3. 重建受影响服务：`docker compose up -d`
4. 健康检查验证（`health-check.ps1` / Admin Center 可用性测试）
5. 升级后检查管理门户（Admin Center）功能完整性

## 6. 发布新版本（维护者）

```powershell
# 项目根目录
.\publish.ps1 -Gitee -CommitMessage "<说明>" -Version "vX.Y" -ReleaseNotes "<发布说明>"
```

- 自动同步 windows → windows-github（脱敏密码）、构建发布目录、推 GitHub（main）+ Gitee（master）、打 tag
- 不带 `-Version` 不更新版本号
- GitHub 推送依赖网络/代理；失败时用 PowerShell 环境补推（Bash 非交互取不到凭据）

## 7. 多语言文档

- README / AI-AGENT-OPS / 部署指南 / 管理员手册均支持 9 语言（zh/zh-TW/en/fr/es/pt/ja/ko/ar）
- 管理员手册在 `docs/admin-manual/`（英文主版）+ `docs/i18n/admin-manual-*`（翻译版）
