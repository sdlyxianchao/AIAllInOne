# 第2章：前置准备

*第一部分 · 部署篇*

> 安装 Docker Desktop、准备目录、打通网络、固定 IP——部署前必须完成的事。

[← 第1章：平台概览与架构](ch01-overview.md) · [📖 目录](index.md) · [第3章：配置文件与环境变量 →](ch03-env.md)

---

## 2.0 两种部署方式

本手册可**人工逐章执行**，也可**交给 AI Agent 工具自动执行**。用 Agent 时，把本目录（含本手册、`docker-compose.yml`、`.env.example`、`scripts/`）提供给 Agent，粘贴下面的提示词即可。

> **复制给 Agent 的部署提示词：**
> 你是企业内网 AI 平台的部署工程师。请根据本目录的《管理员手册》部署篇、docker-compose.yml 与 .env.example，在当前这台机器上完整部署并验证「AI AllInOne」平台。全程用中文沟通。
>
> 第一步 收集参数（逐项问我，不跳过、不猜测）：
> 1) 对外服务的内网 IP；2) Skill 市场主机名（域名，替换 mcp-gateway/skills/skill-market/config.json 与 SKILL.md 里的 <市场主机名>，并在 hosts/DNS 解析）；3) 身份源（接 AD 域控则要域名/域控 IP/LDAP base DN/bind DN/bind 密码/sAMAccountName）；4) 统一管理员账号密码；5) 大模型 API Key；6) 按需问告警 webhook、HTTPS、备份保留策略。
>
> 第二步 生成进度文件，每完成一项、每解决一个问题就更新并汇报。
>
> 第三步 严格按本手册第 1~13 章顺序执行，注意各章「⚠️ 关键坑」，优先用 scripts/ 下的脚本自动化。
>
> 第四步 出错先查日志（docker logs、健康端点、配置）定位根因再修，不盲目重试。
>
> 第五步 全流程验证：容器全 Up、Keycloak SSO、经 NewAPI/LiteLLM 发真实对话验证 PII 脱敏、身份源登录、监控/日志/告警、备份恢复，逐项汇总 ✅/❌。

> 💡 不用 Agent 的话，上面这段也能当「部署前信息核对清单」：部署前先想清楚内网 IP、身份源、管理员密码、模型 Key 这四件事。

## 2.1 安装并配置 Docker Desktop

Docker Desktop 安装后默认用 WSL2 后端，通常无需额外配置。若需手动调整资源上限，在用户目录建 `.wslconfig`：

```
# %UserProfile%\.wslconfig（例如 C:\Users\你的用户名\.wslconfig）
[wsl2]
memory=24GB       # Docker 最大内存（最低 16GB，推荐 24~32GB）
processors=8      # CPU 核心数（按物理核数）
swap=4GB
```

保存后 PowerShell 执行 `wsl --shutdown`，重启 Docker Desktop 生效。

> ✅ 验证：Docker Desktop 状态栏显示 "Engine running"（绿色）。

## 2.2 准备目录结构

```
# PowerShell
mkdir deepchat-updates
```

```
C:\ai-platform\windows\          # 假设的部署根目录
├─ docker-compose.yml           # 核心服务编排
├─ .env.windows                 # 环境变量（需填入 API Key）
├─ litellm-config.yaml          # LiteLLM PII 脱敏配置
├─ deepchat-updates\            # DeepChat 安装包托管目录
├─ admin-portal\                # AI 管理中心实现
├─ mcp-gateway\                 # Skill / MCP 网关
├─ monitoring\                  # Prometheus / Loki 配置
└─ scripts\                     # 备份 / 恢复 / 健康检查 / 初始化脚本
```

## 2.3 创建 Docker 共享网络

```
docker network create ai-platform
docker network ls | findstr ai-platform   # 验证
```

> 所有核心容器通过 `ai-platform` 网络用容器名互访（如 NewAPI 访问 LiteLLM 用 `http://litellm:4000`，不经过 localhost）。

## 2.4 固定宿主机内网 IP（重要）

宿主机走 WiFi 时 IP 由 DHCP 动态分配，重启或租约到期会变；变了员工访问各产品的地址就全失效。建议在路由器做 **DHCP 保留（MAC 绑定）**：

1. 查 WiFi 网卡 MAC：`ipconfig /all`，找「无线局域网适配器 WLAN」的物理地址（如 `60-A3-E3-41-8F-61`）；

2. 登录路由器后台（如 `http://192.168.31.1`）→ 局域网设置 / DHCP 静态 IP 分配；

3. 添加规则：MAC → IP（如 `192.168.31.117`），保存；

4. 重连 WiFi 确认 IP 固定。

> ✅ DHCP 保留比在 Windows 里设静态 IP 更稳（路由器统一管理、不冲突）。

## 2.5 打通网络（最容易卡住的一步）

- **能连 Docker 镜像仓库**：Docker Hub / quay.io / ghcr.io。不通则先配镜像加速器（如 DaoCloud）。

- **能连 GitHub**：克隆仓库、拉取公开依赖。不通则用代理或提前下载源码包。

- **目标机器可被内网访问**：确认要暴露的网段可达。

---

[← 第1章：平台概览与架构](ch01-overview.md) · [📖 目录](index.md) · [第3章：配置文件与环境变量 →](ch03-env.md)
