<!-- 本文件由 windows-deploy-guide-v2.html 转换生成，内容与 HTML 版一致；修改时请同步两个文件 -->

# AI AllInOne 本地部署指南 — Windows 11 + Docker Desktop

**目标：**在单台 Windows 11 机器上，通过 Docker Desktop 部署全部 9 个产品， 使用 `<服务器IP>:端口` 访问，无需域名和 SSL 证书，走通完整的 AI 平台链路。（Docker Desktop WSL2 对 IPv6 `::1` 的支持不稳定，请始终用 `<服务器IP>` 而非 `localhost`）

**软硬件要求：**

| 项目 | 最低要求 | 推荐配置 |
|---|---|---|
| 操作系统 | Windows 11（Docker Desktop + WSL2 后端） | Windows 11 Pro / 企业版（额外支持 Hyper-V 跑 AD 域控） |
| CPU | 4 核 / 8 线程 | 8 核 / 16 线程 |
| 内存 | 16 GB | 32 GB |
| 磁盘 | 60 GB 可用 SSD | 150 GB+ 可用 SSD |
| GPU | 无需独立显卡 | 无需独立显卡 |

**依据实测**（约 30 个容器空闲时全部合计约 5 GB 内存；Dify 处理/索引、Keycloak JVM、MySQL/Postgres 缓存等峰值再增 3–5 GB，加 Docker Desktop 的 WSL2 虚拟内存，16 GB 为最低、32 GB 为舒适值）。磁盘主要被 Docker 镜像（约 10–15 GB）与 DeepChat 安装包（每版本约 740 MB，按保留版本数累积）占用。本方案所有大模型走外部 API（deepseek-chat 等），本地不做推理，因此**无需 GPU**。

- [0. 用 AI Agent 工具自动部署（推荐）](#agent-deploy)
- [1. 环境概览与端口分配](#overview)
- [2. 前置准备（Docker Desktop + 目录 + 网络）](#prereq)
- [3. 配置文件说明](#files)
- [4. 启动核心服务](#start)
- [5. Dify 独立部署](#dify)
- [6. 各产品 Web UI 配置](#config)
- [7. DeepChat 安装与配置](#deepchat)
- [8. MCP Gateway — Skill / MCP 管理 Hub](#mcp)
- [9. CI/CD — DeepChat 自动构建与发布](#cicd)
- [10. 互连配置验证](#interconnect)
- [11. AI 管理中心 — 统一管理员门户](#admin-portal)
- [12. 运维 — 健康检查与开机自检](#ops)
- [13. 安全合规与可观测](#security)
- [N. 附录：Keycloak 企业身份源集成](#identity-sources)

<a id="agent-deploy"></a>

## 0. 用 AI Agent 工具自动部署（推荐）

本指南既可**人工逐章执行**，也可**交给 AI Agent 工具自动执行**。如果你使用 OpenClaw / Microsoft Scout / WorkBuddy 这类工具，把本目录（含本文档、`windows-checklist.html`、`docker-compose.yml`、`.env.example`、`scripts/`）提供给 Agent，再粘贴下面的提示词，Agent 会：判断平台 → 向你收集参数 → 生成本地进度文件 → 按本指南逐步配置 → 遇到问题反复测试解决 → 全程更新进度 → 最后做一次完整测试并汇报结果。

**复制给 Agent 的提示词（Windows 平台）**

```
你是企业内网 AI 平台的部署工程师。请根据本目录下的《windows-deploy-guide-v2.html》部署指南、windows-checklist.html 进度清单、docker-compose.yml 与 .env.example 配置，在当前这台 Windows 机器上完整部署并验证这套「AI AllInOne」平台。全程用中文与我沟通。

## 第一步：收集必要参数（逐项问我，不要跳过、不要擅自猜测）
开始前向我收集：1) 对外服务的内网 IP；2) Skill 市场主机名（域名，用于替换 mcp-gateway/skills/skill-market/config.json 与 SKILL.md 里的 <市场主机名>，并在 hosts/DNS 里解析）；3) 身份源（接 AD 域控则要域名/域控 IP/LDAP base DN/bind DN/bind 密码/sAMAccountName，或接其他 IdP 的配置，不接则确认）；4) 统一管理员账号密码；5) 大模型 API Key（DeepSeek/OpenAI/Claude 等）；6) 按需询问告警 webhook、HTTPS、备份保留策略。

## 第二步：生成本地进度文件
基于 windows-checklist.html 的内容，在本目录生成「部署进度-<日期>.md」，所有条目复制为未完成（- [ ]）。每完成一项、每解决一个问题就更新它并简要汇报。

## 第三步：按部署指南逐步执行
精读《windows-deploy-guide-v2.html》——这是本次部署唯一的权威指南，严格按它的第 1~13 章顺序执行（不要用 windows-checklist.html 或任何旧文档替代），特别注意各章「⚠️ 关键坑」。优先用 scripts/ 下的自动化脚本（bootstrap.ps1、ghost-setup.ps1、ghost-theme-setup.ps1、ghost-content-import.ps1、keycloak-realm-init.ps1、backup.ps1、restore.ps1 等），能自动化的不要手工点 UI。其中 Ghost 门户（6.5 章）必须：①部署项目自带的 Corp Portal 主题，跑 scripts\ghost-theme-setup.ps1 自动装好并激活，不要停留在官方默认主题；②导入示例内容：先问用户「门户及各产品的对外发布地址（内网 IP 或域名，如 192.168.1.10 或 portal.company.com）」——用它替换 seed 里的 <服务器IP> 占位符（文章正文里的 NewAPI / MCP / Dify 等访问地址也一并替换，注意别把 host.docker.internal 这类容器内固定地址改掉）；再问用户「门户示例内容用什么语言」，中文则直接跑 scripts\ghost-content-import.ps1 -ServerAddr "发布地址" 导入；选其他语言时，先把 ghost-content-seed/content.json 里的 title / html / plaintext / custom_excerpt 字段翻译成目标语言（保留 <服务器IP> 占位符和所有 URL 结构不动），再导入。

## 第四步：反复测试解决
出错先查日志（docker logs、健康端点、配置）定位根因再修，不要盲目重试；需要管理员权限或我手动确认时，明确告诉我「做什么、为什么」；解决后回写进度文件并简要汇报。

## 第五步：全流程验证
全部完成后做端到端测试：容器全 Up、Keycloak SSO 登录、经 NewAPI/LiteLLM 发真实对话验证 PII 脱敏、身份源登录、监控/日志/告警、备份恢复。最后逐项汇总 ✅/❌ 结果，失败项给根因和建议。
```

💡 即使你**不用 Agent**，上面这段提示词也清楚地列出了部署前需要准备的全部参数，可当作「部署前信息核对清单」使用。

<a id="overview"></a>

## 1. 环境概览与端口分配

### 1.1 架构总览

<div style="margin: 12px 24px;">
<svg style="width:100%; max-width:1200px;" viewBox="0 0 1200 1000" xmlns="http://www.w3.org/2000/svg">
<!-- ====== Layer Background Bands ====== -->
<rect fill="#d2a8ff08" height="90" rx="4" stroke="#d2a8ff22" stroke-width="0.5" width="1200" x="0" y="30"></rect>
<rect fill="#d2992208" height="95" rx="4" stroke="#d2992222" stroke-width="0.5" width="1200" x="0" y="140"></rect>
<rect fill="#1f6feb08" height="90" rx="4" stroke="#1f6feb22" stroke-width="0.5" width="1200" x="0" y="255"></rect>
<rect fill="#39c5cf08" height="60" rx="4" stroke="#39c5cf22" stroke-width="0.5" width="1200" x="0" y="365"></rect>
<rect fill="#6e40c908" height="100" rx="4" stroke="#6e40c922" stroke-width="0.5" width="1200" x="0" y="545"></rect>
<rect fill="#58a6ff08" height="75" rx="4" stroke="#58a6ff22" stroke-width="0.5" width="1200" x="0" y="665"></rect>
<!-- ====== Layer Labels ====== -->
<rect fill="#d2a8ff22" height="18" rx="9" width="56" x="8" y="36"></rect><text fill="#d2a8ff" font-size="10" font-weight="600" text-anchor="middle" x="36" y="49">用户层</text>
<rect fill="#d2992222" height="18" rx="9" width="76" x="8" y="146"></rect><text fill="#d29922" font-size="10" font-weight="600" text-anchor="middle" x="46" y="159">门户&amp;应用</text>
<rect fill="#1f6feb22" height="18" rx="9" width="66" x="8" y="261"></rect><text fill="#58a6ff" font-size="10" font-weight="600" text-anchor="middle" x="41" y="274">LLM路由</text>
<rect fill="#39c5cf22" height="18" rx="9" width="76" x="8" y="371"></rect><text fill="#39c5cf" font-size="10" font-weight="600" text-anchor="middle" x="46" y="384">可观测</text>
<rect fill="#6e40c922" height="18" rx="9" width="66" x="8" y="551"></rect><text fill="#d2a8ff" font-size="10" font-weight="600" text-anchor="middle" x="41" y="564">基础设施</text>
<rect fill="#58a6ff22" height="18" rx="9" width="56" x="8" y="671"></rect><text fill="#58a6ff" font-size="10" font-weight="600" text-anchor="middle" x="36" y="684">统一管理</text>
<!-- ====== Layer 1: User ====== -->
<g filter="url(#sh)"><rect fill="url(#g-purple)" height="55" rx="10" stroke="#d2a8ff" stroke-width="1.5" width="260" x="120" y="50"></rect><rect fill="#d2a8ff" height="55" rx="2" width="4" x="120" y="50"></rect></g>
<text fill="#d2a8ff" font-size="13" font-weight="700" x="140" y="73">🖥️ DeepChat 桌面客户端</text>
<text fill="#8b949e" font-size="10" x="140" y="90">Win/Mac/Linux · 本地文件读写 · MCP/Skill</text>
<g filter="url(#sh)"><rect fill="url(#g-purple)" height="55" rx="10" stroke="#d2a8ff" stroke-width="1.5" width="260" x="820" y="50"></rect><rect fill="#d2a8ff" height="55" rx="2" width="4" x="820" y="50"></rect></g>
<text fill="#d2a8ff" font-size="13" font-weight="700" x="840" y="73">🌐 浏览器用户</text>
<text fill="#8b949e" font-size="10" x="840" y="90">访问企业门户 / Dify Web / Grafana / Langfuse</text>
<!-- ====== Layer 2: Portal & App ====== -->
<g filter="url(#sh)"><rect fill="url(#g-amber)" height="70" rx="10" stroke="#d29922" stroke-width="2" width="300" x="300" y="160"></rect><rect fill="#d29922" height="70" rx="2" width="4" x="300" y="160"></rect></g>
<text fill="#d29922" font-size="14" font-weight="700" x="320" y="183">📰 Ghost 企业门户</text>
<text fill="#8b949e" font-size="11" x="320" y="200">新闻发布 · 下载中心 · Dify入口 · 帮助文档</text>
<g filter="url(#sh)"><rect fill="url(#g-blue)" height="70" rx="10" stroke="#1f6feb" stroke-width="2" width="300" x="700" y="160"></rect><rect fill="#58a6ff" height="70" rx="2" width="4" x="700" y="160"></rect></g>
<text fill="#58a6ff" font-size="14" font-weight="700" x="720" y="183">🤖 Dify</text>
<text fill="#8b949e" font-size="11" x="720" y="200">Web AI 应用 · 知识库(RAG) · Agent/Workflow</text>
<!-- ====== Layer 3: LLM Routing ====== -->
<g filter="url(#sh)"><rect fill="url(#g-blue)" height="60" rx="10" stroke="#1f6feb" stroke-width="1.5" width="220" x="130" y="275"></rect><rect fill="#58a6ff" height="60" rx="2" width="4" x="130" y="275"></rect></g>
<text fill="#58a6ff" font-size="13" font-weight="600" x="150" y="297">🔀 NewAPI</text>
<text fill="#8b949e" font-size="10" x="150" y="314">LLM Router · 计费 · 限流</text>
<g filter="url(#sh)"><rect fill="url(#g-green)" height="60" rx="10" stroke="#1a7f37" stroke-width="1.5" width="240" x="440" y="275"></rect><rect fill="#56d364" height="60" rx="2" width="4" x="440" y="275"></rect></g>
<text fill="#56d364" font-size="13" font-weight="600" x="460" y="297">🛡️ LiteLLM + Presidio</text>
<text fill="#8b949e" font-size="10" x="460" y="314">PII 脱敏 → 还原（内置正则 + Presidio）</text>
<path d="M 780 280 Q 755 280 755 305 Q 755 323 770 327 Q 775 340 800 340 Q 815 347 845 347 Q 880 347 895 340 Q 920 340 925 327 Q 940 323 940 305 Q 940 280 915 280 Q 905 270 880 270 Q 860 267 845 270 Q 820 270 810 275 Q 800 275 780 280 Z" fill="url(#g-cloud)" stroke="#484f58" stroke-dasharray="5" stroke-width="1.5"></path>
<text fill="#8b949e" font-size="13" font-weight="600" text-anchor="middle" x="847" y="303">☁️ 外部大模型</text>
<text fill="#8b949e" font-size="10" text-anchor="middle" x="847" y="320">GPT-4 · Claude · DeepSeek</text>
<!-- ====== Layer 4: Observability (Langfuse) ====== -->
<g filter="url(#sh)"><rect fill="#0d2b33" height="50" rx="10" stroke="#39c5cf" stroke-width="1.5" width="260" x="440" y="380"></rect><rect fill="#39c5cf" height="50" rx="2" width="4" x="440" y="380"></rect></g>
<text fill="#39c5cf" font-size="13" font-weight="600" x="460" y="401">🔍 Langfuse 可观测</text>
<text fill="#8b949e" font-size="10" x="460" y="418">提示词/响应/延迟/token/成本 追踪</text>
<!-- LiteLLM -> Langfuse 旁路 -->
<path d="M 560 335 L 560 380" fill="none" marker-end="url(#at)" stroke="#39c5cf" stroke-dasharray="4" stroke-width="1.5"></path>
<text fill="#39c5cf" font-size="8" font-weight="600" x="568" y="360">上报</text>
<!-- ====== Layer 5: Infrastructure ====== -->
<g filter="url(#sh)"><rect fill="url(#g-purple)" height="60" rx="10" stroke="#6e40c9" stroke-width="1.5" width="205" x="60" y="565"></rect><rect fill="#d2a8ff" height="60" rx="2" width="4" x="60" y="565"></rect></g>
<text fill="#d2a8ff" font-size="13" font-weight="600" x="80" y="588">🔐 Keycloak</text>
<text fill="#8b949e" font-size="10" x="80" y="605">SSO / OIDC / RBAC</text>
<g filter="url(#sh)"><rect fill="url(#g-purple)" height="60" rx="10" stroke="#6e40c9" stroke-width="1.5" width="205" x="285" y="565"></rect><rect fill="#d2a8ff" height="60" rx="2" width="4" x="285" y="565"></rect></g>
<text fill="#d2a8ff" font-size="13" font-weight="600" x="305" y="588">🔌 MCP Gateway</text>
<text fill="#8b949e" font-size="10" x="305" y="605">Skill / MCP Hub · search_knowledge 检索</text>
<g filter="url(#sh)"><rect fill="url(#g-red)" height="60" rx="10" stroke="#da3633" stroke-width="1.5" width="205" x="510" y="565"></rect><rect fill="#f85149" height="60" rx="2" width="4" x="510" y="565"></rect></g>
<text fill="#f85149" font-size="13" font-weight="600" x="530" y="588">🔧 Gitea</text>
<text fill="#8b949e" font-size="10" x="530" y="605">源码 + Actions CI/CD</text>
<g filter="url(#sh)"><rect fill="url(#g-green)" height="60" rx="10" stroke="#1a7f37" stroke-width="1.5" width="205" x="735" y="565"></rect><rect fill="#56d364" height="60" rx="2" width="4" x="735" y="565"></rect></g>
<text fill="#56d364" font-size="13" font-weight="600" x="755" y="588">📦 更新服务器</text>
<text fill="#8b949e" font-size="10" x="755" y="605">DeepChat 安装包托管</text>
<g filter="url(#sh)"><rect fill="url(#g-amber)" height="60" rx="10" stroke="#d29922" stroke-width="1.5" width="205" x="960" y="565"></rect><rect fill="#d29922" height="60" rx="2" width="4" x="960" y="565"></rect></g>
<text fill="#d29922" font-size="13" font-weight="600" x="980" y="588">📈 监控 · 日志</text>
<text fill="#8b949e" font-size="10" x="980" y="605">Prometheus · Grafana · cadvisor · Loki</text>
<!-- ====== Layer 6: Management ====== -->
<g filter="url(#sh)"><rect fill="url(#g-blue)" height="55" rx="10" stroke="#58a6ff" stroke-width="2" width="1040" x="80" y="675"></rect><rect fill="#58a6ff" height="55" rx="2" width="4" x="80" y="675"></rect></g>
<text fill="#58a6ff" font-size="15" font-weight="700" text-anchor="middle" x="600" y="698">🏢 AI 管理中心（统一管理员门户 + Keycloak 鉴权）</text>
<text fill="#8b949e" font-size="11" text-anchor="middle" x="600" y="718">Dashboard 容器状态/业务指标 · 产品内嵌统计页 · 审计/成本报表 · Keycloak SSO</text>
<!-- ====== Connections ====== -->
<path d="M 250 105 L 250 275" fill="none" marker-end="url(#ar)" stroke="#58a6ff" stroke-width="2"></path>
<text fill="#58a6ff" font-size="9" font-weight="600" x="258" y="190">LLM 请求</text>
<path d="M 850 230 L 850 247 L 240 247 L 240 275" fill="none" marker-end="url(#ar)" stroke="#58a6ff" stroke-width="2"></path>
<path d="M 350 305 L 440 305" fill="none" marker-end="url(#ar)" stroke="#58a6ff" stroke-width="2"></path>
<text fill="#58a6ff" font-size="8" font-weight="600" text-anchor="middle" x="395" y="299">① 转发</text>
<path d="M 680 305 L 750 305" fill="none" marker-end="url(#ar)" stroke="#58a6ff" stroke-width="2"></path>
<text fill="#58a6ff" font-size="8" font-weight="600" text-anchor="middle" x="718" y="299">② 脱敏后</text>
<path d="M 750 323 L 680 320" fill="none" marker-end="url(#ag)" stroke="#56d364" stroke-dasharray="4" stroke-width="1.5"></path>
<text fill="#56d364" font-size="8" font-weight="600" text-anchor="middle" x="718" y="337">③ 响应</text>
<path d="M 440 320 L 350 320" fill="none" marker-end="url(#ag)" stroke="#56d364" stroke-dasharray="4" stroke-width="1.5"></path>
<text fill="#56d364" font-size="8" font-weight="600" text-anchor="middle" x="395" y="337">④ 还原PII</text>
<!-- 门户流 -->
<path d="M 950 105 L 950 135 L 450 135 L 450 160" fill="none" marker-end="url(#ay)" stroke="#d29922" stroke-dasharray="5" stroke-width="1.5"></path>
<text fill="#d29922" font-size="8" font-weight="600" text-anchor="middle" x="700" y="128">门户入口</text>
<path d="M 600 195 L 700 195" fill="none" marker-end="url(#ay)" stroke="#d29922" stroke-dasharray="5" stroke-width="1.5"></path>
<path d="M 880 105 L 880 130 L 850 130 L 850 160" fill="none" marker-end="url(#ay)" stroke="#d29922" stroke-dasharray="5" stroke-width="1.5"></path>
<!-- 可观测：浏览器 -> Langfuse -->
<path d="M 950 105 L 950 370 L 700 370 L 700 380" fill="none" marker-end="url(#at)" stroke="#39c5cf" stroke-dasharray="5" stroke-width="1.5"></path>
<text fill="#39c5cf" font-size="8" font-weight="600" x="960" y="240">查看追踪</text>
<!-- 监控：浏览器 -> Grafana -->
<path d="M 1080 105 L 1080 400 L 1062 400 L 1062 565" fill="none" marker-end="url(#ay)" stroke="#d29922" stroke-dasharray="5" stroke-width="1.5"></path>
<!-- CI/CD -->
<path d="M 612 565 L 735 565" fill="none" marker-end="url(#ag)" stroke="#56d364" stroke-dasharray="5" stroke-width="1.5"></path>
<text fill="#56d364" font-size="7" font-weight="600" text-anchor="middle" x="674" y="558">构建产物</text>
<path d="M 1062 565 L 1175 565 L 1175 15 L 250 15 L 250 50" fill="none" marker-end="url(#ag)" stroke="#56d364" stroke-dasharray="5" stroke-width="1.5"></path>
<text fill="#56d364" font-size="9" font-weight="600" text-anchor="middle" x="700" y="11">⓵ DeepChat 自动更新（检查 version.txt → 下载安装）</text>
<!-- Keycloak OIDC -->
<path d="M 162 565 L 162 445" fill="none" opacity="0.85" stroke="#d2a8ff" stroke-dasharray="4" stroke-width="2"></path>
<path d="M 162 445 Q 162 435 600 435 L 850 435 L 850 230" fill="none" marker-end="url(#ap)" opacity="0.3" stroke="#d2a8ff" stroke-dasharray="2,4" stroke-width="1"></path>
<text fill="#d2a8ff" font-size="10" font-weight="700" text-anchor="middle" x="162" y="442">↑ OIDC SSO → 全部 Web 产品</text>
<!-- MCP -->
<path d="M 387 565 L 387 455" fill="none" opacity="0.85" stroke="#d2a8ff" stroke-dasharray="4" stroke-width="2"></path>
<path d="M 387 455 L 250 455 L 250 105" fill="none" marker-end="url(#ap)" opacity="0.9" stroke="#d2a8ff" stroke-dasharray="5,3" stroke-width="2.5"></path>
<text fill="#d2a8ff" font-size="10" font-weight="700" text-anchor="middle" x="387" y="448">↑ Skill/MCP → DeepChat · Dify</text>
<!-- RAG 检索链路：MCP Gateway → Dify 知识库 -->
<path d="M 430 565 L 430 505 L 725 505 L 725 230" fill="none" marker-end="url(#at)" stroke="#39c5cf" stroke-dasharray="7" stroke-width="2.5"></path>
<text fill="#39c5cf" font-size="10" font-weight="700" text-anchor="middle" x="577" y="498">RAG 检索：search_knowledge → Dify 知识库</text>
<!-- 管理 bracket -->
<path d="M 80 675 L 80 645 L 1120 645 L 1120 675" fill="none" opacity="0.5" stroke="#58a6ff" stroke-dasharray="4" stroke-width="1"></path>
<text fill="#58a6ff" font-size="9" font-weight="600" text-anchor="middle" x="600" y="641">↑ AI 管理中心（Keycloak 鉴权 → Dashboard → 全部产品入口 + 审计/成本）</text>
<!-- ====== Legend ====== -->
<rect fill="#161b22" height="205" rx="8" stroke="#30363d" stroke-width="1" width="1160" x="20" y="770"></rect>
<text fill="#58a6ff" font-size="13" font-weight="700" x="40" y="795">📊 数据流说明</text>
<line stroke="#58a6ff" stroke-width="2" x1="40" x2="80" y1="815" y2="815"></line>
<text fill="#c9d1d9" font-size="11" x="90" y="819">LLM 请求流：DeepChat / Dify → NewAPI → LiteLLM 脱敏 → 外部模型 → 响应还原 PII → 返回</text>
<line stroke="#39c5cf" stroke-dasharray="5" stroke-width="1.5" x1="40" x2="80" y1="840" y2="840"></line>
<text fill="#c9d1d9" font-size="11" x="90" y="844">可观测流：LiteLLM success_callback → Langfuse 追踪每次调用（提示词/响应/延迟/token/成本）</text>
<line stroke="#56d364" stroke-dasharray="5" stroke-width="1.5" x1="40" x2="80" y1="865" y2="865"></line>
<text fill="#c9d1d9" font-size="11" x="90" y="869">自动更新流：Gitea Actions 构建 → 更新服务器 → DeepChat 自动下载安装</text>
<line stroke="#d29922" stroke-dasharray="5" stroke-width="1.5" x1="620" x2="660" y1="815" y2="815"></line>
<text fill="#c9d1d9" font-size="11" x="670" y="819">门户流：浏览器 → Ghost 门户 → 浏览新闻/下载/跳转 Dify</text>
<line stroke="#d29922" stroke-width="1.5" x1="620" x2="660" y1="840" y2="840"></line>
<text fill="#c9d1d9" font-size="11" x="670" y="844">监控流：浏览器 → Grafana 大盘（Prometheus + cadvisor 容器资源/告警）</text>
<line opacity="0.7" stroke="#d2a8ff" stroke-dasharray="3" stroke-width="1" x1="620" x2="660" y1="865" y2="865"></line>
<text fill="#c9d1d9" font-size="11" x="670" y="869">认证流：Keycloak OIDC SSO 统一登录（全部 Web 产品共用 ai_all_in_one_admin）</text>
<line opacity="0.7" stroke="#39c5cf" stroke-dasharray="3" stroke-width="1.5" x1="40" x2="80" y1="890" y2="890"></line>
<text fill="#c9d1d9" font-size="11" x="90" y="894">统一日志流：Promtail 采集各容器日志 → Loki 聚合 → AI 管理中心「统一日志」页查询</text>
<line stroke="#30363d" stroke-width="0.5" x1="40" x2="1160" y1="895" y2="895"></line>
<text fill="#d2a8ff" font-size="10" font-weight="700" x="40" y="912">🔐 组件交互：</text>
<text fill="#8b949e" font-size="9" x="40" y="927">Keycloak OIDC SSO → 全部 Web 产品　　MCP Gateway 提供 Skill/MCP → DeepChat/Dify　　LiteLLM 上报 → Langfuse　　Prometheus/cadvisor → Grafana　　Promtail → Loki</text>
<text fill="#8b949e" font-size="9" x="40" y="942">Gitea 构建 → 更新服务器 + Ghost 公告　　AI 管理中心 — 统一管理门户（Dashboard + 产品内嵌页 + 审计/成本报表 + 备份恢复 + 统一日志）</text>
<rect fill="#1c2331" height="24" rx="6" stroke="#30363d" width="1120" x="40" y="950"></rect>
<text fill="#8b949e" font-size="10" text-anchor="middle" x="600" y="966">16 个独立开源组件 · 全部 Docker 部署 · 零代码开发 · 通过 URL + API Key / OIDC 互连 · Keycloak 统一 SSO</text>
</svg></div>

### 1.2 端口分配表

**内网访问地址：**下文用 `<服务器IP>` 表示宿主机「服务器对外地址」（例如当前环境为 `192.168.31.117`，部署时替换成你自己的内网 IP 或域名）。公司内部员工从自己电脑访问时，用「内网访问」列地址；在宿主机本机调试时用「本机访问」列地址（`127.0.0.1`）。两者指向同一服务，只是访问来源不同。

| # | 产品 | 用途 | 本机访问（宿主机） | 内网访问（员工） | 容器名 |
|---|---|---|---|---|---|
| 1 | **AI 管理中心** | 统一管理员门户 / Keycloak 鉴权 | `http://127.0.0.1:10086` | `http://<服务器IP>:10086` | admin-portal |
| 2 | **Keycloak** | 用户认证 / SSO | `http://127.0.0.1:9090` | `http://<服务器IP>:9090` | keycloak |
| 3 | **NewAPI** | LLM Router / API 网关 | `http://127.0.0.1:3000` | `http://<服务器IP>:3000` | new-api |
| 4 | **LiteLLM** | PII 脱敏代理 | `http://<服务器IP>:4001` | —（内部服务，仅被 NewAPI 调用） | litellm |
| 5 | **Dify** | Web AI 应用平台 | `http://127.0.0.1` | `http://<服务器IP>` | dify-* (多容器) |
| 6 | **Ghost** | 企业门户 | `http://127.0.0.1:8090` | `http://<服务器IP>:8090` | ghost |
| 7 | **Gitea** | 源码管理 + CI/CD | `http://127.0.0.1:3002` | `http://<服务器IP>:3002` | gitea |
| 8 | **Update Server** | DeepChat 安装包托管 | `http://127.0.0.1:8091` | `http://<服务器IP>:8091` | update-server |
| 9 | **DeepChat** | 本地 AI 桌面客户端 | 桌面应用，API 地址填 `http://<服务器IP>:3000`（员工电脑上） | — |  |
| 10 | **Grafana** | 监控可视化大盘 | `http://127.0.0.1:3030` | `http://<服务器IP>:3030` | grafana |
| 11 | **Prometheus** | 监控指标采集 / 告警 | `http://127.0.0.1:9091` | `http://<服务器IP>:9091` | prometheus |
| 12 | **Langfuse** | LLM 可观测 / 调用追踪 | `http://127.0.0.1:3010` | `http://<服务器IP>:3010` | langfuse |
| 13 | **cadvisor** | 容器资源监控（内部） | `http://127.0.0.1:8080` | —（仅被 Prometheus 抓取） | cadvisor |
| 14 | **Loki** | 统一日志聚合（内部） | `http://127.0.0.1:3110` | —（经 AI 管理中心「统一日志」查看） | loki |
| 15 | **Promtail** | 容器日志采集（内部） | — | —（推送到 Loki） | promtail |
| 16 | **MailHog** | 本地邮件接收器（Ghost 验证码/通知） | `http://127.0.0.1:8025` | `http://<服务器IP>:8025` | mailhog |

**容器间通信：**所有容器通过 `ai-platform` Docker 网络互访，使用容器名作为主机名。 例如 NewAPI 访问 LiteLLM 用 `http://litellm:4000`，不经过 localhost。  
**数据库/缓存（MySQL、Redis、PostgreSQL）不对用户开放**，仅在 Docker 网络内部通信。

### 1.3 数据流说明

#### LLM 请求流（核心链路）

<div style="margin: 12px 24px;"><svg style="width:100%; max-width:1000px;" viewBox="0 0 1000 170" xmlns="http://www.w3.org/2000/svg"><defs>
<linearGradient id="g-host" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stop-color="#1a2333"></stop><stop offset="100%" stop-color="#0d1117"></stop></linearGradient>
<linearGradient id="g-docker" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stop-color="#1c2a3e"></stop><stop offset="100%" stop-color="#141d2e"></stop></linearGradient>
<linearGradient id="g-purple" x1="0" x2="1" y1="0" y2="1"><stop offset="0%" stop-color="#2d1b4e"></stop><stop offset="100%" stop-color="#1a1030"></stop></linearGradient>
<linearGradient id="g-blue" x1="0" x2="1" y1="0" y2="1"><stop offset="0%" stop-color="#0d2b4e"></stop><stop offset="100%" stop-color="#0a1e3a"></stop></linearGradient>
<linearGradient id="g-green" x1="0" x2="1" y1="0" y2="1"><stop offset="0%" stop-color="#0d3b2e"></stop><stop offset="100%" stop-color="#0a2a20"></stop></linearGradient>
<linearGradient id="g-amber" x1="0" x2="1" y1="0" y2="1"><stop offset="0%" stop-color="#3b2e0d"></stop><stop offset="100%" stop-color="#2a210a"></stop></linearGradient>
<linearGradient id="g-red" x1="0" x2="1" y1="0" y2="1"><stop offset="0%" stop-color="#3b0d0d"></stop><stop offset="100%" stop-color="#2a0a0a"></stop></linearGradient>
<linearGradient id="g-cloud" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stop-color="#1a2a3a"></stop><stop offset="100%" stop-color="#0f1a26"></stop></linearGradient>
<filter height="130%" id="sh" width="120%" x="-10%" y="-10%"><feGaussianBlur in="SourceAlpha" stdDeviation="2"></feGaussianBlur><feOffset dx="0" dy="2"></feOffset><feComponentTransfer><feFuncA slope="0.4" type="linear"></feFuncA></feComponentTransfer><feMerge><feMergenode></feMergenode><feMergenode in="SourceGraphic"></feMergenode></feMerge></filter>
<marker id="ar" markerHeight="8" markerWidth="8" orient="auto" refX="7" refY="3"><path d="M0,0 L0,6 L7,3 z" fill="#58a6ff"></path></marker>
<marker id="ag" markerHeight="8" markerWidth="8" orient="auto" refX="7" refY="3"><path d="M0,0 L0,6 L7,3 z" fill="#56d364"></path></marker>
<marker id="ay" markerHeight="8" markerWidth="8" orient="auto" refX="7" refY="3"><path d="M0,0 L0,6 L7,3 z" fill="#d29922"></path></marker>
<marker id="ap" markerHeight="8" markerWidth="8" orient="auto" refX="7" refY="3"><path d="M0,0 L0,6 L7,3 z" fill="#d2a8ff"></path></marker>
<marker id="at" markerHeight="8" markerWidth="8" orient="auto" refX="7" refY="3"><path d="M0,0 L0,6 L7,3 z" fill="#39c5cf"></path></marker>
</defs>
<!-- Step 1: DeepChat/Dify -->
<g filter="url(#sh)"><rect fill="url(#g-purple)" height="58" rx="10" stroke="#d2a8ff" stroke-width="0.8" width="135" x="8" y="18"></rect><rect fill="#d2a8ff" height="58" rx="2" width="4" x="8" y="18"></rect></g>
<text fill="#d2a8ff" font-size="11" font-weight="700" x="24" y="40">💬 DeepChat</text>
<text fill="#d2a8ff" font-size="11" font-weight="700" x="24" y="54">/ Dify</text>
<text fill="#8b949e" font-size="8" x="24" y="68">发起请求</text>
<path d="M 143 47 L 170 47" fill="none" marker-end="url(#ar)" stroke="#58a6ff" stroke-width="2"></path>
<circle cx="156" cy="35" fill="#1f6feb" r="9"></circle><text fill="#fff" font-size="9" font-weight="700" text-anchor="middle" x="156" y="39">1</text>
<!-- Step 2: NewAPI -->
<g filter="url(#sh)"><rect fill="url(#g-blue)" height="58" rx="10" stroke="#58a6ff" stroke-width="0.8" width="135" x="172" y="18"></rect><rect fill="#58a6ff" height="58" rx="2" width="4" x="172" y="18"></rect></g>
<text fill="#58a6ff" font-size="11" font-weight="700" x="188" y="40">🔀 NewAPI</text>
<text fill="#8b949e" font-size="8" x="188" y="56">路由/计费/限流</text>
<rect fill="#1f6feb33" height="13" rx="3" width="34" x="188" y="60"></rect><text fill="#58a6ff" font-family="monospace" font-size="7" text-anchor="middle" x="205" y="70">:3000</text>
<path d="M 307 47 L 334 47" fill="none" marker-end="url(#ar)" stroke="#58a6ff" stroke-width="2"></path>
<circle cx="320" cy="35" fill="#1f6feb" r="9"></circle><text fill="#fff" font-size="9" font-weight="700" text-anchor="middle" x="320" y="39">2</text>
<!-- Step 3: LiteLLM (mask) -->
<g filter="url(#sh)"><rect fill="url(#g-green)" height="58" rx="10" stroke="#56d364" stroke-width="0.8" width="155" x="336" y="18"></rect><rect fill="#56d364" height="58" rx="2" width="4" x="336" y="18"></rect></g>
<text fill="#56d364" font-size="11" font-weight="700" x="352" y="40">🛡️ LiteLLM</text>
<text fill="#56d364" font-size="8" font-weight="600" x="352" y="56">Presidio PII 脱敏</text>
<rect fill="#1a7f3733" height="13" rx="3" width="34" x="352" y="60"></rect><text fill="#56d364" font-family="monospace" font-size="7" text-anchor="middle" x="369" y="70">:4000</text>
<path d="M 491 47 L 518 47" fill="none" marker-end="url(#ar)" stroke="#58a6ff" stroke-width="2"></path>
<circle cx="504" cy="35" fill="#1f6feb" r="9"></circle><text fill="#fff" font-size="9" font-weight="700" text-anchor="middle" x="504" y="39">3</text>
<!-- Step 4: External LLM -->
<g filter="url(#sh)"><rect fill="url(#g-cloud)" height="58" rx="10" stroke="#484f58" stroke-dasharray="4" stroke-width="1" width="135" x="520" y="18"></rect></g>
<text fill="#8b949e" font-size="11" font-weight="700" x="536" y="40">☁️ 外部大模型</text>
<text fill="#8b949e" font-size="8" x="536" y="56">GPT-4o/Claude</text>
<text fill="#8b949e" font-size="8" x="536" y="68">/DeepSeek</text>
<path d="M 655 47 L 682 47" fill="none" marker-end="url(#ag)" stroke="#56d364" stroke-dasharray="4" stroke-width="2"></path>
<circle cx="668" cy="35" fill="#56d364" r="9"></circle><text fill="#fff" font-size="9" font-weight="700" text-anchor="middle" x="668" y="39">4</text>
<!-- Step 5: LiteLLM (restore) -->
<g filter="url(#sh)"><rect fill="url(#g-green)" height="58" rx="10" stroke="#56d364" stroke-width="0.8" width="145" x="684" y="18"></rect><rect fill="#56d364" height="58" rx="2" width="4" x="684" y="18"></rect></g>
<text fill="#56d364" font-size="11" font-weight="700" x="700" y="40">🛡️ LiteLLM</text>
<text fill="#56d364" font-size="8" font-weight="600" x="700" y="56">PII 还原</text>
<path d="M 829 47 L 856 47" fill="none" marker-end="url(#ag)" stroke="#56d364" stroke-dasharray="4" stroke-width="2"></path>
<circle cx="842" cy="35" fill="#56d364" r="9"></circle><text fill="#fff" font-size="9" font-weight="700" text-anchor="middle" x="842" y="39">5</text>
<!-- Step 6: Return -->
<g filter="url(#sh)"><rect fill="url(#g-purple)" height="58" rx="10" stroke="#d2a8ff" stroke-width="0.8" width="95" x="858" y="18"></rect><rect fill="#d2a8ff" height="58" rx="2" width="4" x="858" y="18"></rect></g>
<text fill="#d2a8ff" font-size="11" font-weight="700" x="874" y="42">✅ 返回</text>
<text fill="#8b949e" font-size="8" x="874" y="58">显示回复</text>
<!-- Direction labels -->
<text fill="#58a6ff" font-size="8" font-weight="600" text-anchor="middle" x="426" y="12">━━ 请求方向 ━━→</text>
<text fill="#56d364" font-size="8" font-weight="600" text-anchor="middle" x="770" y="12">←━━ 响应方向 ━━</text>
<!-- Step labels -->
<text fill="#8b949e" font-size="8" text-anchor="middle" x="253" y="100">① 转发</text>
<text fill="#56d364" font-size="8" text-anchor="middle" x="413" y="100">② 自动脱敏 PII</text>
<text fill="#8b949e" font-size="8" text-anchor="middle" x="587" y="100">③ 处理请求</text>
<text fill="#56d364" font-size="8" text-anchor="middle" x="756" y="100">④ 自动还原 PII</text>
<text fill="#8b949e" font-size="8" text-anchor="middle" x="905" y="100">⑤ 返回结果</text>
<!-- 旁路：LLM 可观测（Langfuse）-->
<path d="M 413 76 L 413 118" fill="none" marker-end="url(#at)" stroke="#39c5cf" stroke-dasharray="4" stroke-width="1.5"></path>
<text fill="#39c5cf" font-size="8" font-weight="600" x="425" y="98">success_callback 上报</text>
<g filter="url(#sh)"><rect fill="#0d2b33" height="40" rx="10" stroke="#39c5cf" stroke-width="0.8" width="266" x="280" y="122"></rect><rect fill="#39c5cf" height="40" rx="2" width="4" x="280" y="122"></rect></g>
<text fill="#39c5cf" font-size="11" font-weight="700" x="330" y="139">🔍 Langfuse 可观测</text>
<text fill="#8b949e" font-size="8" x="330" y="154">每次调用的提示词/响应/延迟/token/成本追踪</text>
</svg></div>

#### 用户访问流

<div style="margin: 12px 24px;"><svg style="width:100%; max-width:900px;" viewBox="0 0 900 160" xmlns="http://www.w3.org/2000/svg"><defs>
<linearGradient id="g-host" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stop-color="#1a2333"></stop><stop offset="100%" stop-color="#0d1117"></stop></linearGradient>
<linearGradient id="g-docker" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stop-color="#1c2a3e"></stop><stop offset="100%" stop-color="#141d2e"></stop></linearGradient>
<linearGradient id="g-purple" x1="0" x2="1" y1="0" y2="1"><stop offset="0%" stop-color="#2d1b4e"></stop><stop offset="100%" stop-color="#1a1030"></stop></linearGradient>
<linearGradient id="g-blue" x1="0" x2="1" y1="0" y2="1"><stop offset="0%" stop-color="#0d2b4e"></stop><stop offset="100%" stop-color="#0a1e3a"></stop></linearGradient>
<linearGradient id="g-green" x1="0" x2="1" y1="0" y2="1"><stop offset="0%" stop-color="#0d3b2e"></stop><stop offset="100%" stop-color="#0a2a20"></stop></linearGradient>
<linearGradient id="g-amber" x1="0" x2="1" y1="0" y2="1"><stop offset="0%" stop-color="#3b2e0d"></stop><stop offset="100%" stop-color="#2a210a"></stop></linearGradient>
<linearGradient id="g-red" x1="0" x2="1" y1="0" y2="1"><stop offset="0%" stop-color="#3b0d0d"></stop><stop offset="100%" stop-color="#2a0a0a"></stop></linearGradient>
<linearGradient id="g-cloud" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stop-color="#1a2a3a"></stop><stop offset="100%" stop-color="#0f1a26"></stop></linearGradient>
<filter height="130%" id="sh" width="120%" x="-10%" y="-10%"><feGaussianBlur in="SourceAlpha" stdDeviation="2"></feGaussianBlur><feOffset dx="0" dy="2"></feOffset><feComponentTransfer><feFuncA slope="0.4" type="linear"></feFuncA></feComponentTransfer><feMerge><feMergenode></feMergenode><feMergenode in="SourceGraphic"></feMergenode></feMerge></filter>
<marker id="ar" markerHeight="8" markerWidth="8" orient="auto" refX="7" refY="3"><path d="M0,0 L0,6 L7,3 z" fill="#58a6ff"></path></marker>
<marker id="ag" markerHeight="8" markerWidth="8" orient="auto" refX="7" refY="3"><path d="M0,0 L0,6 L7,3 z" fill="#56d364"></path></marker>
<marker id="ay" markerHeight="8" markerWidth="8" orient="auto" refX="7" refY="3"><path d="M0,0 L0,6 L7,3 z" fill="#d29922"></path></marker>
<marker id="ap" markerHeight="8" markerWidth="8" orient="auto" refX="7" refY="3"><path d="M0,0 L0,6 L7,3 z" fill="#d2a8ff"></path></marker>
<marker id="at" markerHeight="8" markerWidth="8" orient="auto" refX="7" refY="3"><path d="M0,0 L0,6 L7,3 z" fill="#39c5cf"></path></marker>
</defs>
<!-- Flow 1: Browser -> Ghost -> Dify -->
<g filter="url(#sh)"><rect fill="url(#g-purple)" height="28" rx="8" stroke="#d2a8ff" stroke-width="0.8" width="115" x="8" y="8"></rect><rect fill="#d2a8ff" height="28" rx="2" width="4" x="8" y="8"></rect></g>
<text fill="#d2a8ff" font-size="10" font-weight="600" text-anchor="middle" x="65" y="26">🌐 浏览器</text>
<path d="M 123 22 L 150 22" fill="none" marker-end="url(#ay)" stroke="#d29922" stroke-width="1.5"></path>
<g filter="url(#sh)"><rect fill="url(#g-amber)" height="28" rx="8" stroke="#d29922" stroke-width="0.8" width="145" x="152" y="8"></rect><rect fill="#d29922" height="28" rx="2" width="4" x="152" y="8"></rect></g>
<text fill="#d29922" font-size="10" font-weight="600" text-anchor="middle" x="224" y="26">📰 Ghost :8090</text>
<path d="M 297 22 L 324 22" fill="none" marker-end="url(#ay)" stroke="#d29922" stroke-width="1.5"></path>
<text fill="#d29922" font-size="7" font-weight="600" text-anchor="middle" x="310" y="15">AI工作台</text>
<g filter="url(#sh)"><rect fill="url(#g-blue)" height="28" rx="8" stroke="#58a6ff" stroke-width="0.8" width="145" x="326" y="8"></rect><rect fill="#58a6ff" height="28" rx="2" width="4" x="326" y="8"></rect></g>
<text fill="#58a6ff" font-size="10" font-weight="600" text-anchor="middle" x="398" y="26">🤖 Dify :80</text>
<text fill="#8b949e" font-size="9" x="490" y="26">← Web AI 应用</text>
<!-- Flow 2: Browser -> AI Admin Center -->
<g filter="url(#sh)"><rect fill="url(#g-purple)" height="28" rx="8" stroke="#d2a8ff" stroke-width="0.8" width="115" x="8" y="48"></rect><rect fill="#d2a8ff" height="28" rx="2" width="4" x="8" y="48"></rect></g>
<text fill="#d2a8ff" font-size="10" font-weight="600" text-anchor="middle" x="65" y="66">🌐 浏览器</text>
<path d="M 123 62 L 150 62" fill="none" marker-end="url(#ar)" stroke="#58a6ff" stroke-width="1.5"></path>
<g filter="url(#sh)"><rect fill="url(#g-blue)" height="28" rx="8" stroke="#58a6ff" stroke-width="0.8" width="165" x="152" y="48"></rect><rect fill="#58a6ff" height="28" rx="2" width="4" x="152" y="48"></rect></g>
<text fill="#58a6ff" font-size="10" font-weight="600" text-anchor="middle" x="234" y="66">📊 AI 管理中心 :10086</text>
<text fill="#8b949e" font-size="9" x="335" y="66">← 管理所有 Docker 容器（启动/停止/日志/监控）</text>
<!-- Flow 3: Browser -> Grafana (监控) -->
<g filter="url(#sh)"><rect fill="url(#g-purple)" height="28" rx="8" stroke="#d2a8ff" stroke-width="0.8" width="115" x="8" y="88"></rect><rect fill="#d2a8ff" height="28" rx="2" width="4" x="8" y="88"></rect></g>
<text fill="#d2a8ff" font-size="10" font-weight="600" text-anchor="middle" x="65" y="106">🌐 浏览器</text>
<path d="M 123 102 L 150 102" fill="none" marker-end="url(#at)" stroke="#39c5cf" stroke-width="1.5"></path>
<g filter="url(#sh)"><rect fill="#0d2b33" height="28" rx="8" stroke="#39c5cf" stroke-width="0.8" width="185" x="152" y="88"></rect><rect fill="#39c5cf" height="28" rx="2" width="4" x="152" y="88"></rect></g>
<text fill="#39c5cf" font-size="10" font-weight="600" text-anchor="middle" x="244" y="106">📈 Grafana 监控 :3030</text>
<text fill="#8b949e" font-size="9" x="355" y="106">← Prometheus + cadvisor 容器资源/告警大盘</text>
<!-- Flow 4: Browser -> Langfuse (可观测) -->
<g filter="url(#sh)"><rect fill="url(#g-purple)" height="28" rx="8" stroke="#d2a8ff" stroke-width="0.8" width="115" x="8" y="128"></rect><rect fill="#d2a8ff" height="28" rx="2" width="4" x="8" y="128"></rect></g>
<text fill="#d2a8ff" font-size="10" font-weight="600" text-anchor="middle" x="65" y="146">🌐 浏览器</text>
<path d="M 123 142 L 150 142" fill="none" marker-end="url(#at)" stroke="#39c5cf" stroke-width="1.5"></path>
<g filter="url(#sh)"><rect fill="#0d2b33" height="28" rx="8" stroke="#39c5cf" stroke-width="0.8" width="185" x="152" y="128"></rect><rect fill="#39c5cf" height="28" rx="2" width="4" x="152" y="128"></rect></g>
<text fill="#39c5cf" font-size="10" font-weight="600" text-anchor="middle" x="244" y="146">🔍 Langfuse 可观测 :3010</text>
<text fill="#8b949e" font-size="9" x="355" y="146">← 每次模型调用的提示词/响应/延迟/成本追踪</text>
</svg></div>

### 1.4 内网访问地址清单（员工使用）

公司内部员工从自己电脑访问各产品时，用下面这些「内网地址」。把 `<服务器IP>` 换成宿主机实际对外地址（当前环境为 `192.168.31.117`，固定方法见 [2. 前置准备](#prereq)）。

#### 员工日常使用

| 产品 | 内网地址 | 谁用 | 说明 |
|---|---|---|---|
| **Dify** | `http://<服务器IP>` | 全体员工 | AI 应用平台（聊天 / 工作流 / 知识库） |
| **Ghost 门户** | `http://<服务器IP>:8090` | 全体员工 | 企业门户、公告、下载中心 |
| **NewAPI** | `http://<服务器IP>:3000` | 全体员工 | 查看 / 申请自己的 API 密钥、游乐场测试 |
| **Gitea** | `http://<服务器IP>:3002` | 开发团队 | 源码管理 + CI/CD |

#### 客户端与特殊用途

| 用途 | 地址 | 说明 |
|---|---|---|
| DeepChat 客户端 API | `http://<服务器IP>:3000/v1` | 员工电脑上 DeepChat 的 API Base URL |
| DeepChat 下载 | `http://<服务器IP>:8091` | 安装包托管，点链接下载 |
| AI 管理中心 | `http://<服务器IP>:10086` | 仅管理员，统一管理入口 |
| Grafana 监控 | `http://<服务器IP>:3030` | 仅管理员，容器资源监控 / 告警大盘 |
| Langfuse 可观测 | `http://<服务器IP>:3010` | 仅管理员，LLM 调用追踪 / 成本 / 质量分析 |

#### 内部服务（不对用户开放）

| 产品 | 端口 | 说明 |
|---|---|---|
| LiteLLM | 4001 | 仅被 NewAPI 调用（PII 脱敏代理） |
| MySQL / Redis / PostgreSQL | — | 数据库 / 缓存，仅 Docker 网络内部通信 |

#### 本机访问地址（宿主机调试用，127.0.0.1）

管理员在宿主机本机操作、调试、排错时用下面这些 `127.0.0.1` 地址（仅宿主机本机有效，员工电脑访问不到）。

| 产品 | 本机地址 | 说明 |
|---|---|---|
| Keycloak 管理后台 | `http://127.0.0.1:9090` | SSO 配置、Realm / 用户 / OIDC Client 管理 |
| NewAPI | `http://127.0.0.1:3000` | API 网关管理界面 |
| Dify | `http://127.0.0.1` | AI 应用平台（80 端口） |
| Ghost 门户 | `http://127.0.0.1:8090` | 企业门户后台 |
| Gitea | `http://127.0.0.1:3002`<br>`ssh://git@127.0.0.1:2222` | 源码管理（Web + Git SSH） |
| Update Server | `http://127.0.0.1:8091` | DeepChat 安装包分发 |
| AI 管理中心 | `http://127.0.0.1:10086` | 统一管理入口 |
| LiteLLM | `http://<服务器IP>:4001` | PII 脱敏代理（内部） |
| Grafana | `http://127.0.0.1:3030` | 监控大盘 |
| Prometheus | `http://127.0.0.1:9091` | 指标采集 / 告警规则 |
| Langfuse | `http://127.0.0.1:3010` | LLM 可观测 |

**登录说明：**员工不需要记 Keycloak 地址。任何产品点「登录」都会自动跳转到 Keycloak（`http://<服务器IP>:9090`），用域账号登录后自动跳回原产品。

<a id="prereq"></a>

## 2. 前置准备

1 **Docker Desktop 配置**

Docker Desktop 安装后默认使用 WSL2 后端（无需额外配置）。如需手动调整资源限制，在用户目录下创建 `.wslconfig` 文件：

```
# %UserProfile%\.wslconfig（例如 C:\Users\你的用户名\.wslconfig）
[wsl2]
memory=24GB       # Docker 最大内存（最低 16GB，推荐 24~32GB；按宿主机内存一半左右分配）
processors=8      # CPU 核心数（按宿主机物理核数）
swap=4GB
```

保存后 PowerShell 执行 `wsl --shutdown` 然后重启 Docker Desktop 生效。

**✅ 验证：**Docker Desktop 状态栏显示 "Engine running"（绿色）

2 **创建工作目录**

```
# 在 PowerShell 中执行
mkdir deepchat-updates
```

目录结构：

<div style="margin: 8px 0; padding: 16px; background: #161b22; border: 1px solid #30363d; border-radius: 8px; font-family: 'Cascadia Code', Consolas, monospace; font-size: 0.85em; line-height: 2;">
<div><span style="color:#58a6ff">📁</span> <span style="color:#c9d1d9">C:\ai-platform\windows\</span>   <span style="color:#8b949e"># 假设的部署根目录</span></div>
<div style="padding-left: 28px;"><span style="color:#d29922">📄</span> <span style="color:#c9d1d9">docker-compose.yml</span>   <span style="color:#8b949e"># 核心服务编排（已生成）</span></div>
<div style="padding-left: 28px;"><span style="color:#d29922">📄</span> <span style="color:#c9d1d9">.env.windows</span>   <span style="color:#8b949e"># 环境变量（已生成，需填入 API Key）</span></div>
<div style="padding-left: 28px;"><span style="color:#d29922">📄</span> <span style="color:#c9d1d9">litellm-config.yaml</span>   <span style="color:#8b949e"># LiteLLM PII 脱敏配置（已生成）</span></div>
<div style="padding-left: 28px;"><span style="color:#58a6ff">📁</span> <span style="color:#c9d1d9">deepchat-updates\</span>   <span style="color:#8b949e"># DeepChat 安装包托管目录</span></div>
<div style="padding-left: 28px;"><span style="color:#58a6ff">📁</span> <span style="color:#c9d1d9">admin-portal\</span>   <span style="color:#8b949e"># AI 管理中心实现</span></div>
</div>

3 **编辑 .env.windows 填入 API Key**

打开 `.env.windows`，复制为 `.env`，修改以下项：

```
# 默认已配 DeepSeek（取消注释并填入你的 Key 即可）
DEEPSEEK_API_KEY=sk-你的真实DeepSeek密钥

# 如需 OpenAI 或 Claude，取消对应注释并填入 Key
# 同时需要取消 litellm-config.yaml 中对应 model 块的注释
# OPENAI_API_KEY=sk-你的真实OpenAI密钥
# ANTHROPIC_API_KEY=sk-ant-你的真实Claude密钥
```

**注意：**至少需要一个外部模型 API Key 才能走通 LLM 链路。 默认使用 DeepSeek（最便宜）。加了新 provider 后，**必须同步修改 `litellm-config.yaml`**，取消对应 model 块的注释。

4 **创建 Docker 共享网络**

```
# 在 PowerShell 中执行
docker network create ai-platform

# 验证
docker network ls | findstr ai-platform
```

**✅ 验证：**输出包含 `ai-platform` 网络

5 **固定宿主机内网 IP（推荐，否则对外地址会变）**

宿主机通过 WiFi 接入公司内网时，IP 由路由器 DHCP 动态分配，重启或租约到期后会变。变掉后，员工访问各产品的地址（见 [1.4 内网访问地址清单](#overview)）就全失效了。建议在路由器上做 **DHCP 保留（MAC 绑定）**固定 IP：

1. 查 WiFi 网卡 MAC：PowerShell 执行 `ipconfig /all`，找「无线局域网适配器 WLAN」的物理地址（如 `60-A3-E3-41-8F-61`）
2. 登录路由器管理后台（如小米路由器 `http://192.168.31.1`）→ 局域网设置 / DHCP 静态 IP 分配
3. 添加规则：MAC `60-A3-E3-41-8F-61` → IP `192.168.31.117`，保存
4. 重连 WiFi 或重启路由器，确认 IP 固定为 `192.168.31.117`

DHCP 保留比在 Windows 里设静态 IP 更稳（路由器统一管理、不会 IP 冲突、Windows 无感）。若换成有线网卡，同样可对有线网卡的 MAC 做保留。

<a id="files"></a>

## 3. 配置文件说明

三个核心配置文件已生成在 目录下：

| 文件 | 用途 | 需要修改吗 |
|---|---|---|
| `.env.windows` | 所有密码和外部 API Key | **必须修改**：填入 DeepSeek API Key（其他 provider 按需取消注释） |
| `litellm-config.yaml` | LiteLLM 模型列表 + Presidio PII 脱敏规则 | 通常不需要改（如只用 DeepSeek，删除 OpenAI/Claude 条目即可） |
| `docker-compose.yml` | 7 个核心服务的 Docker 编排 | 已预配置（含 Keycloak `KC_HOSTNAME=<服务器IP>` + `keycloak-data` 持久化卷） |

**litellm-config.yaml 说明：**

- `model_list` — 定义可用外部模型，NewAPI 通过 LiteLLM 调用它们。默认仅启用 `deepseek-chat`，其他模型按需取消注释 + 配 .env
- `general_settings.master_key` — LiteLLM 管理员密钥，读取 `.env` 中的 `LITELLM_MASTER_KEY`
- PII 脱敏（Presidio）已临时注释。新版 LiteLLM 的 guardrail API 变更导致不兼容。后需启用时参考 [LiteLLM 官方文档](https://docs.litellm.ai/docs/proxy/guardrails/presidio)
- 当前使用稳定版本 `v1.95.1`（`main-latest` 存在已知 bug）

### 3.1 环境变量配置指南（哪些现在配，哪些以后配）

#### 变量分类总览

| 变量 | 类型 | 说明 |
|---|---|---|
| `DEEPSEEK_API_KEY` | 🔴 立即 | 外部 LLM API Key，不配则链路不通 |
| `LITELLM_MASTER_KEY` | 🔴 立即 | LiteLLM 内部鉴权密钥，NewAPI 需要用 |
| `OLLAMA_API_BASE` | ⚪ 默认 | 本地 embedding 地址（语义缓存向量化），默认 `http://host.docker.internal:11434`（宿主机 Ollama 的 bge-m3） |
| `LITELLM_REDIS_PASSWORD` | ⚪ 默认 | litellm-redis 密码（语义缓存要求该变量存在，内网无鉴权留空即可） |
| `NEWAPI_DB_PASSWORD` | 🔴 立即 | MySQL root 密码，首次创建后不宜改 |
| `KEYCLOAK_ADMIN_PASSWORD` | 🔴 立即 | Keycloak 管理员密码 |
| `NEWAPI_SESSION_SECRET` | 🔴 立即 | NewAPI 会话加密，随机字符串即可 |
| `NEWAPI_CRYPTO_SECRET` | 🔴 立即 | NewAPI 数据加密，随机字符串即可 |
| `GLOBAL_WEB_RATE_LIMIT` | ⚪ 默认 | Web 登录限流（次/分钟），测试期设 999999，生产酌情调低 |
| `GLOBAL_API_RATE_LIMIT` | ⚪ 默认 | API 路由限流（次/3分钟），测试期设 999999 |
| `CRITICAL_RATE_LIMIT_ENABLE` | ⚪ 默认 | 关键接口限流开关（登录/OAuth 回调），默认 20 次/20分钟易触发 429，测试期设 false |
| `CRITICAL_RATE_LIMIT` | ⚪ 默认 | 关键接口限流阈值，测试期设 999999 |
| `DEFAULT_QUOTA` | ⚪ 默认 | 新用户默认额度（美元），默认 0（无法调用模型）。设 100 = 新用户送 100 美元额度 |
| `GENERATE_DEFAULT_TOKEN` | ⚪ 默认 | 新用户注册时自动生成初始 API Key，默认 false。设 true 让用户登录即可用 |
| `ADMIN_PASSWORD` | 🔴 立即 | AI 管理中心 Global Admin 密码 |
| `SESSION_SECRET` | 🔴 立即 | AI 管理中心会话加密，随机字符串即可 |
| `KEYCLOAK_CLIENT_SECRET` | 🟡 可后配 | 需先在 Keycloak 创建 OIDC Client，拿到 Secret 后填入（见步骤 11.6） |
| `GITEA_RUNNER_TOKEN` | 🟡 可后配 | 需先启动 Gitea，在后台获取 Token 后填入（见步骤 6.6） |
| `OPENAI_API_KEY` / `ANTHROPIC_API_KEY` | 🟢 按需 | 需要用时取消注释并填入。同时取消 `litellm-config.yaml` 中对应 model 块的注释 |
| `TZ` / `KEYCLOAK_ADMIN` / `ADMIN_USERNAME` / `ADMIN_EMAIL` | ⚪ 默认 | 默认值即可，无需修改 |

#### 立即配置（首次启动前必须完成）

打开 `.env`，以下 🔴 标记项必须在首次启动前配置好。每个值都有 `.env` 文件中行内注释说明如何生成/获取。

| 变量 | 说明 | 如何获取/生成 | 格式示例 |
|---|---|---|---|
| `DEEPSEEK_API_KEY` | DeepSeek 云端 LLM API 密钥 | 注册 [platform.deepseek.com](https://platform.deepseek.com) → API Keys | `sk-xxxxxxxxxxxxxxxx` |
| `LITELLM_MASTER_KEY` | LiteLLM **内部**管理员密钥（不是外部 LLM Key！） | PowerShell: `-join ((48..57)+(65..90)+(97..122) \| Get-Random -Count 32 \| % {[char]$_})`<br>NewAPI 用这个密钥连接 LiteLLM | `sk-litellm-xxxx` |
| `NEWAPI_DB_PASSWORD` | MySQL 数据库密码 | 自己设定，首次创建后**不宜再改**（改需删库） | 任意字符串 |
| `KEYCLOAK_ADMIN_PASSWORD` | Keycloak 管理员密码 | 自己设定，至少 8 位 | 任意字符串 |
| `NEWAPI_SESSION_SECRET` | NewAPI Web 界面会话加密密钥 | 随机生成：Windows PowerShell:<br>`-join ((48..57)+(65..90)+(97..122) \| Get-Random -Count 32 \| % {[char]$_})` | 32 位随机字符串 |
| `NEWAPI_CRYPTO_SECRET` | NewAPI 存储的 API Key 加密密钥 | 同上：PowerShell: `-join ((48..57)+(65..90)+(97..122) \| Get-Random -Count 32 \| % {[char]$_})` | 32 位随机字符串 |
| `ADMIN_PASSWORD` | AI 管理中心 Global Admin 密码 | 自己设定，至少 8 位 | 任意字符串 |
| `SESSION_SECRET` | AI 管理中心会话加密密钥 | 同上：PowerShell: `-join ((48..57)+(65..90)+(97..122) \| Get-Random -Count 32 \| % {[char]$_})` | 64 位随机字符串 |

完整配置查看 `.env.windows` 文件，每个变量都有行内注释说明用途、用法和格式。

#### 密码修改策略

⚠️ `NEWAPI_DB_PASSWORD` 涉及已创建的数据库，修改后需要删除对应 volume 重新创建（数据会丢失）。建议首次就定好，不要后续改。

`KEYCLOAK_ADMIN_PASSWORD`、`ADMIN_PASSWORD`、`ADMIN_PASSWORD` 等管理密码可以在各产品的后台界面修改，改完后同步更新 `.env`（不影响运行，只是备忘）。

<a id="start"></a>

## 4. 启动核心服务

1 **复制 .env.windows 为 .env**

Docker Compose 默认读取 `.env` 文件：

```
# PowerShell
copy .env.windows .env
```

2 **启动全部核心服务**

```
# PowerShell
docker compose -f docker-compose.yml up -d
```

首次启动会拉取所有镜像（约 5-10 分钟，取决于网速）。

**首次拉取镜像（约 3-4GB 磁盘空间）：**

| Image | Container | Size |
|---|---|---|
| `quay.io/keycloak/keycloak:25.0` | keycloak | ~600MB |
| `calciumion/new-api` | new-api | ~200MB |
| `mysql:8.0` | new-api-db | ~600MB |
| `redis:7-alpine` | new-api-redis | ~40MB |
| `ghcr.io/berriai/litellm:v1.95.1` | litellm | ~1GB |
| `ghost:5-alpine` | ghost | ~150MB |
| `gitea/gitea` | gitea | ~300MB |
| `gitea/act_runner` | gitea-runner | ~100MB |
| `nginx:alpine` | update-server | ~50MB |
| `node:20-alpine` | admin-portal | ~50MB |

3 **检查所有容器状态**

```
# 查看运行中的容器（预期 10 个全部 Up）
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# 预期输出
NAME              STATUS         PORTS
admin-portal      Up             0.0.0.0:10086->3000/tcp
keycloak          Up             0.0.0.0:9090->8080/tcp
new-api           Up             0.0.0.0:3000->3000/tcp
new-api-db        Up (healthy)   3306/tcp
new-api-redis     Up             6379/tcp
litellm           Up             0.0.0.0:4000->4000/tcp
ghost             Up             0.0.0.0:8090->2368/tcp
gitea             Up             0.0.0.0:3002->3000/tcp, 0.0.0.0:2222->22/tcp
gitea-runner      Up             
update-server     Up             0.0.0.0:8091->80/tcp
```

**✅ 验证：**所有容器状态为 `Up`。如果有容器持续 Restarting，查看日志：`docker logs 容器名`

3.5 **已知问题修复：Ghost 强制 SQLite**

如果上一步看到 `ghost` 容器一直 `Restarting`，执行 `docker logs ghost` 看到 `Error: connect ECONNREFUSED <服务器IP>:3306` —— 说明数据卷 `ghost-data` 里残留了一份指向 MySQL 的 `config.production.json`（旧版部署遗留），Ghost 启动时读这份残档而不是走默认 SQLite。windows 栈没有 MySQL 给 Ghost 用，所以连不上。

修复方法：在 `docker-compose.yml` 的 ghost 服务 `environment` 下显式声明 SQLite，用环境变量覆盖卷内残留配置：

```
# docker-compose.yml 中 ghost 服务块的 environment 部分
  ghost:
    image: ghost:5-alpine
    container_name: ghost
    restart: always
    ports:
      - "8090:2368"
    environment:
      url: http://127.0.0.1:8090
      # 强制 SQLite，覆盖可能残留的旧 MySQL config.production.json
      database__client: sqlite3
      database__connection__filename: /var/lib/ghost/content/data/ghost.db
      database__use_null_pool: "true"
    volumes:
      - ghost-data:/var/lib/ghost/content
    networks:
      - ai-platform
```

修改后重建容器：

```
docker compose up -d ghost

# 等待 10 秒后查看日志，确认 SQLite 启动成功
docker logs ghost --tail 20
```

**⚠️ 注意 Docker Desktop 卷不可见：**Windows + Docker Desktop WSL2 下，`/var/lib/docker/volumes/windows_ghost-data/_data/` 在宿主机 git bash 里**不可见**（卷数据被封在 WSL2 虚拟磁盘内），所以无法直接删除卷内的 `config.production.json`。必须走"环境变量覆盖"路线，让 Ghost 启动时优先读环境变量。

**📌 为什么不直接删数据卷？**删卷 `docker volume rm windows_ghost-data` 也能解决，但会丢失所有已发布的文章/主题/上传文件。环境变量覆盖方式保留数据，只改数据库连接路径。Ghost 5.x 默认 SQLite 完全够企业门户用，无需引入额外 MySQL。

**✅ 验证：**日志出现 `Ghost database ready in X.Xs` + `Ghost booted in X.Xs` + `Database is in a ready state` 表示修复成功。`curl.exe -I http://127.0.0.1:8090` 返回 `HTTP 200`。

4 **逐服务验证可访问**

#### 外部可访问的服务（浏览器 / curl 测试）

```
# Keycloak — 返回 302 表示 OK
curl.exe -I http://127.0.0.1:9090/admin/

# NewAPI — 返回 200
curl.exe -I http://127.0.0.1:3000

# Ghost 企业门户 — 返回 302（重定向到 /ghost/ 初始化页）
curl.exe -I http://127.0.0.1:8090

# Gitea — 返回 200
curl.exe -s -o NUL -w "%{http_code}" http://127.0.0.1:3002

# Update Server — 返回 403（空目录，表示 nginx 在运行）
curl.exe -I http://127.0.0.1:8091

# AI 管理中心 — 返回 200
curl.exe -s -o NUL -w "%{http_code}" http://127.0.0.1:10086
```

#### Docker 内网服务（通过容器间通信验证）

**说明：**LiteLLM 是纯 API 服务，不提供 Web 界面。它通过 Docker 内网供 NewAPI 调用（`http://litellm:4000`），宿主机不需要直接访问。Docker Desktop WSL2 的 HTTP 代理可能导致 LiteLLM 在宿主机上无法访问（返回 HEART 或空响应），这是已知 bug，不影响实际功能。

```
# LiteLLM 模型列表（读 Key → 存变量 → 一键调用）
$K = docker exec litellm printenv LITELLM_MASTER_KEY
docker exec gitea wget -qO- --header="Authorization: Bearer $K" http://litellm:4000/v1/models

# 预期返回 JSON：{"data":[{"id":"deepseek-chat",...}]}
```

**✅ 验证：**Keycloak 302 / NewAPI 200 / Gitea 200 / Admin Center 200 = 通过。LiteLLM 从容器内部调用返回模型列表 = 通过。  
更简单：浏览器打开 `http://127.0.0.1:3000`（NewAPI）、`http://127.0.0.1:9090`（Keycloak）、`http://127.0.0.1:8090`（Ghost）。

<a id="dify"></a>

## 5. Dify 独立部署（官方 Docker Compose）

Dify 使用官方 docker-compose（含 ~15 个容器），独立部署避免端口冲突。Dify 容器使用自己的默认网络。

1 **克隆 Dify**

二选一（GitHub 需翻墙，Gitee 国内直达）：

```
# 方案 A：GitHub
$tag = (Invoke-RestMethod https://api.github.com/repos/langgenius/dify/releases/latest).tag_name
git clone --branch $tag https://github.com/langgenius/dify.git

# 方案 B：Gitee 官方镜像（推荐）
git clone https://gitee.com/dify_ai/dify.git
```

方案 A 还需要 `jq`：`winget install jqlang.jq`。

2 **修复 Yaml 兼容性 + 复制环境变量**

Dify 用了新版 Docker Compose 的 `env_file` 语法，如果你版本较老需要修复。同时把所有 `.env.example` 模板复制为 `.env`：

```
# 进入 Docker 目录
cd dify\docker

# 修复 env_file 格式（兼容老版本 Docker Compose）
python -c "import re; c=open(r'C:\AIAllInOne\windows\dify\docker\docker-compose.yaml').read(); c=re.sub(r'  - path: (\./envs/[^\n]+\.env)\n\s+required: (?:true|false)', r'  - \1', c); open(r'C:\AIAllInOne\windows\dify\docker\docker-compose.yaml','w').write(c); print('Fixed')"

# 复制主环境变量
copy .env.example .env

# 复制所有子模板（sandbox.env、local-sandbox.env 等）
Get-ChildItem envs -Recurse -Filter *.example | ForEach-Object {
    $target = $_.FullName -replace '\.example$', ''
    if (-not (Test-Path $target)) { Copy-Item $_.FullName $target }
}

# 修复 Dify 1.16.1 上游校验问题（必需）
# 1.16.1 镜像把 GRAPH_ENGINE_SCALE_UP_THRESHOLD 字段从 NonNegativeInt 升级为 PositiveInt，
# 但 shared.env 里默认值仍是 0，会导致 api/worker/worker_beat/api_websocket 4 个容器启动即崩溃，
# 日志报 ValidationError: Input should be greater than 0
(Get-Content envs\core-services\shared.env) -replace 'GRAPH_ENGINE_SCALE_UP_THRESHOLD=0', 'GRAPH_ENGINE_SCALE_UP_THRESHOLD=50' | Set-Content envs\core-services\shared.env

# 验证 Yaml 无错误
docker compose config --quiet

# 验证 GRAPH_ENGINE 修改成功
findstr "GRAPH_ENGINE_SCALE_UP_THRESHOLD" envs\core-services\shared.env
# 期望输出：GRAPH_ENGINE_SCALE_UP_THRESHOLD=50
```

**⚠️ 为什么必须改这一行：**Dify 1.16.1 镜像把 `GRAPH_ENGINE_SCALE_UP_THRESHOLD` 字段类型从 `NonNegativeInt`（允许 0）升级为 `PositiveInt`（必须 > 0），但 `shared.env` 模板还停留在 `=0`。不改的话，`docker-api-1` / `docker-worker-1` / `docker-worker_beat-1` / `docker-api_websocket-1` 会一直 `Restarting (1)`，`docker logs docker-api-1` 能看到 `pydantic_core._pydantic_core.ValidationError`。这是上游版本升级的破坏性默认值变更，跟你的本地配置无关。

3 **启动 Dify**

```
# 启动全部容器（首次约 5-10 分钟，15 个容器）
docker compose up -d

# 检查状态
docker compose ps
```

**✅ 验证：**所有容器 `Up`（`init_permissions` 显示 `Exited` 是正常的）。浏览器打开 `http://127.0.0.1/install` 初始化管理员账号。

**⚠️ WebSocket 地址配置（不改会导致创建应用时反复连接 `ws://localhost`）：**Dify 的 `.env` 里 `NEXT_PUBLIC_SOCKET_URL` 默认是 `ws://localhost`，内网部署时浏览器里的 `localhost` 指向用户自己电脑（不是服务器），导致前端反复连接 `ws://localhost/socket.io`、响应一直为空（创建应用 / 工作流调试等需要实时功能的场景会卡住）。修复：

```
# .env 里把 WebSocket 地址改成内网 IP（与访问地址一致）
NEXT_PUBLIC_SOCKET_URL=ws://<服务器IP>

# docker-compose.yaml 里 web 服务的 fallback 也同步改
NEXT_PUBLIC_SOCKET_URL: ${NEXT_PUBLIC_SOCKET_URL:-ws://<服务器IP>}

# 重建 web 容器生效
docker compose up -d web
```

改完强刷浏览器（`Ctrl+F5`），WebSocket 会变成 `ws://<服务器IP>/socket.io` 并正常连上（nginx 已内置 `/socket.io/` → `api_websocket:5001` 代理）。该变量是**运行时读取**的（web 镜像 entrypoint 会 export），改 `.env` + 重启 web 容器即可，无需重建镜像。

Dify 的 Keycloak SSO 配置：Dify 设置 → 登录方式 → OIDC → 填入 Keycloak OIDC 端点。Dify 添加模型供应商时，**API Base URL 填写 `http://host.docker.internal:3000/v1`**，通过 NewAPI 路由。

**⚠️ 踩坑：Dify 登录密码是 base64 传输，不是明文/RSA：**Dify 1.16.x 的登录接口 `POST /console/api/login` 里 `password` 字段是 **base64 编码后的密码**（`/app/api/libs/encryption.py` 注释明确是「Base64 混淆，非加密」）。所以：① 用脚本/接口登录时要先 `base64(密码)`；② 前端「点了登录没反应」时，console 里 `GET /console/api/account/profile 401` + `POST /console/api/refresh-token 401` 是**未登录时的正常现象**，不代表后端坏（换浏览器/清缓存/重试）。

**⚠️ 踩坑：Dify 忘记管理员密码时的重置方法：**Dify 密码哈希是 `pbkdf2_hmac('sha256', password, salt, 10000)`（**迭代 10000，不是常见的 100000**），无法直接反解。忘记密码用容器内命令重置（**新密码必须 ≥ 8 位**）：

```
docker exec docker-api-1 flask reset-password \
  --email ai_all_in_one_admin@<公司域名> \
  --new-password '<新密码>' \
  --password-confirm '<新密码>'
```

另注意：Dify `.env` 里 `SECRET_KEY` 若为空，不影响密码登录（密码走 PBKDF2+salt），但影响 provider 凭据加密（encrypted_config），一般无需处理。

<a id="config"></a>

## 6. 各产品 Web UI 配置

所有服务已启动，现在通过浏览器配置各产品的互连关系。按以下顺序操作：

<a id="config-keycloak"></a>

### 6.1 Keycloak — 创建 Realm 和用户

**Keycloak 配置说明：**

- **访问地址：**宿主机本机用 `http://127.0.0.1:9090`，公司内网员工用 `http://<服务器IP>:9090`。compose 已将 `KC_HOSTNAME` 设为 `<服务器IP>`（内网 IP），并开启 `KC_HOSTNAME_STRICT=false` 让两种地址都能正常跳转，避免 Docker Desktop WSL2 IPv6 兼容性导致的 `localhost` 重定向空白页。
- **数据持久化：**H2 数据库存储在命名卷 `keycloak-data`（映射 `/opt/keycloak/data`），容器重建不会丢失 Realm、用户、OIDC 客户端等配置。
- **凭据：**用户名和密码见 `.env.windows` 中的 `KEYCLOAK_ADMIN` 和 `KEYCLOAK_ADMIN_PASSWORD`。

1 浏览器打开 `http://127.0.0.1:9090`

- 用户名和密码见 `.env.windows` 中的 `KEYCLOAK_ADMIN` 和 `KEYCLOAK_ADMIN_PASSWORD`

2 **创建 Realm**

- 左上角下拉 → **Create Realm**
- Realm name：`enterprise-ai` → Create

#### 6.1.1 方式 A：本地创建账号（默认）

适用于无企业 AD 的小团队或开发测试场景，直接在 Keycloak 内管理用户。

3a **创建用户组和用户**

- **Groups** → Create Group → `ai-admin`
- 再创建 `ai-user`
- **Users** → Add user → 用户名（自定义）→ Create
- Credentials 标签 → 设置密码 → Temporary 关闭
- Groups 标签 → 加入 `ai-user` 组

**✅ 验证：**可以用刚创建的本地用户在 Keycloak 登录页面登录成功。

#### 6.1.2 方式 B：从 Active Directory 导入账号

适用于公司已有 Windows AD 域控的环境。员工用域账号登录，无需在 Keycloak 中手动创建账号。

**前置条件：**Docker 容器到 DC 域控的网络已互通。如未配置网络（端口转发、防火墙），先参考独立文档： [📄 Keycloak AD 集成完整指南 — 含网络拓扑、Hyper-V Internal Switch、端口转发、故障排查](windows-ad-integration.html)

**需要的 AD 账号：**

| 账号 | 类型 | 说明 |
|---|---|---|
| `svc_keycloak` | 服务账号（必须，密码永不过期） | Keycloak LDAP 绑定用，密码见 `.env.windows` |
| 2 个普通域用户 | 测试用（按需创建） | 用于验证 Keycloak 用户同步和域账号登录是否正常 |

3b-1 **创建 LDAP 用户联合**

1. Keycloak 管理后台 → 选择 **enterprise-ai** Realm
2. 左侧 **User Federation** → **Add provider** → 选择 **ldap**
3. 填写以下配置：

| 配置项 | 值 | 说明 |
|---|---|---|
| UI display name | `Company AD` | Keycloak 界面显示名称，随意填 |
| Vendor | **Active Directory** | 选 AD（不要选 Other，否则 objectGUID 不识别） |
| Connection URL | `ldap://host.docker.internal:389` | Hyper-V 经端口转发；生产填 `ldap://dc.company.com:389` |
| Enable StartTLS | **Off** | 不走 StartTLS，直接用 LDAP 389 或 LDAPS 636 |
| Use Truststore SPI | **Always** | 仅 LDAPS 有用；LDAP 明文不影响 |
| Connection pooling | **Off** | 默认关，高并发时可按需开启 |
| Connection timeout | *留空* | Keycloak 默认超时 |
| Bind type | **simple** | 用户名+密码认证 |
| Bind DN | `CN=svc_keycloak,CN=Users,DC=testcompany,DC=local` | **必须 LDAP DN 格式！**不要用 ~~DOMAIN\用户~~ |
| Bind credentials | `svc_keycloak 密码` | 见 `.env.windows` |
| Edit mode | **READ_ONLY** | 只读，不写回 AD |
| Users DN | `CN=Users,DC=testcompany,DC=local` | 用户所在容器。有子 OU 时改 `DC=testcompany,DC=local` |
| Username LDAP attribute | `sAMAccountName` | **不要填 cn** — 这是 AD 登录名 |
| RDN LDAP attribute | `cn` | 条目命名属性 |
| UUID LDAP attribute | `objectGUID` | AD 不可变唯一标识 |
| User object classes | `person, organizationalPerson, user` | AD 用户对象类，逗号分隔 |
| User LDAP filter | *留空* | 需要过滤时可填 `(department=IT)` |
| Search scope | **Subtree** | **不要选 One Level** — 否则子 OU 用户搜不到 |
| Read timeout | *留空* | 默认值 |
| Pagination | **On** | 用户多时分批拉取 |
| Referral | **ignore** | 避免 Keycloak 跟到不存在的域控 |
| Import users | **On** | 全量同步时导入 |
| Sync Registrations | **On** | 首登即时同步 |
| Batch size / Periodic sync | *留空 / Off* | 测试阶段手动同步 |
| Kerberos (两项) | **Off / Off** | 不用 Kerberos |
| Cache policy | **DEFAULT** | 默认缓存 |
| Advanced (3 项) | **Off / Off / Off** | READ_ONLY 模式无需 |

4. 点击 **Save**
5. 点击 **Synchronize all users** → 等待同步完成

**常见填错：**

- **Bind DN = LDAP 格式**（`CN=svc_keycloak,CN=Users,DC=xxx`），不要用 ~~DOMAIN\用户~~
- **Username LDAP attribute = `sAMAccountName`**，不是 `cn`
- **Search scope = Subtree**，不要选 One Level
- **⚠️ CN 带空格要原样保留：**若绑定账号的显示名带空格（如统一账号显示名是 `ai all in one admin`，中间是**空格**不是下划线），Bind DN 必须写成 `CN=ai all in one admin,CN=Users,DC=xxx`（**空格原样保留**），写成 `ai_all_in_one_admin` 会连不上域控。改了域控显示名后要同步更新这里的 Bind DN。

3b-2 **配置 LDAP 组映射（可选）**

将 AD 组映射为 Keycloak 角色：

1. 在 User Federation 列表点击刚创建的 LDAP Provider
2. **Mappers** 标签 → 添加 `group-ldap-mapper`
3. 设置 Groups DN：`CN=Users,DC=testcompany,DC=local`
4. 保存后会自动将 AD 组映射到 Keycloak

**✅ 验证：**在 Keycloak **Users** 列表中可看到从 AD 同步过来的域用户。用以下方式测试登录：

##### 方式 A：Keycloak Account Console 登录测试（推荐，无需配置下游应用）

1. 打开浏览器（推荐隐私/无痕窗口，避免 Session 缓存干扰）
2. 访问 `http://127.0.0.1:9090/realms/enterprise-ai/account`
3. 输入 AD 域用户凭证：
    - 用户名：`aitest1`（sAMAccountName）或 `aitest1@<公司域名>`（UPN），两种格式均可
    - 密码：域用户 AD 密码
4. 点击 **Sign In** → 预期跳转到 **Account Console**，显示用户名和个人信息

**排错：**  
`Invalid username or password` → 密码错误或用户不在 Users DN 范围内  
`Account is disabled` → AD 用户已被禁用  
 无反应 → F12 看 Console/Network 面板

##### 方式 B：Admin Console 查看用户来源

1. Keycloak 管理后台 → **Users** → 搜索 `aitest1`
2. 点击用户 → **Attributes**：有 `LDAP_ID` / `LDAP_ENTRY_DN` 即来源为 AD 同步
3. **Sessions**：方式 A 登录成功后此处有一条活跃会话

##### 方式 C：下游应用 SSO（后续配置完 Dify 等应用的 OIDC 后）

打开 `http://127.0.0.1/apps` → 自动跳转到 Keycloak 登录页 → 输入域账号 → 登录成功进入 Dify 工作台。

<a id="config-newapi"></a>

### 6.2 NewAPI — 初始安装 + 配置 LLM 渠道和 API 密钥

#### 初始安装向导（首次访问）

NewAPI 首次启动时会弹出 4 步系统设置向导。按以下配置完成：

1 **数据库检查**

点击 **"验证数据库连接"**，系统自动检测 MySQL 是否可连通。

**预期：**绿色勾 + "数据库连接正常"。如失败，检查 `docker logs new-api` 看 MySQL 连接错误。

2 **管理员账户**

| 配置项 | 推荐值 | 说明 |
|---|---|---|
| 管理员用户名 | **`ai_all_in_one_admin`** | 统一管理员账号（见账号密码清单 `credentials.html`） |
| 管理员邮箱 | `ai_all_in_one_admin@<公司域名>` | `<公司域名>` 改成公司域名 |
| 管理员密码 | **统一管理员密码** | ≥ 8 位，见账号密码清单 `credentials.html` |

**为什么要创建本地管理员？**此时 OIDC 还没配，NewAPI 不认识 Keycloak，必须有一个本地账号先"进门"完成配置。注册完这个管理员后，去系统设置打开 OIDC，后续所有人（含 AD 用户）就能用 Keycloak 账号登录了。

3 **使用模式**

选择 **"个人使用"**。

**三个选项的区别：**

- **个人使用：**不限制用户注册，API 日志按用户隔离，配置简单。适合开发测试和公司内部使用
- **对外运营：**面向外部用户，多了充值/定价/用户套餐/计费等模块。适合商业化对外经营
- **演示站点：**只读模式，仅用于展示，不能修改任何配置

**选择建议：**公司内部使用选 **个人使用**——员工能注册、用量能分开看、没有充值计费等用不到的模块，界面更干净。将来如果有对外经营需求，再转为对外运营。后续随时可在系统设置中切换。

4 **审核并初始化**

- 确认前三步的配置无误
- 点击 **"确认并完成初始化"**（或类似按钮）
- 系统自动创建数据库表 → 跳转到登录页 → 用第一步创建的管理员账号登录

#### 配置 LLM 渠道

1 **添加 LLM 渠道（指向 LiteLLM）**

- **渠道** → **添加新的渠道**
- 类型：`OpenAI`
- 名称：`LiteLLM-OpenAI`
- Base URL：`http://litellm:4000`（容器名，走 Docker 网络）
- 密钥：**⚠️ 见 `.env` 中 `LITELLM_MASTER_KEY` 的值**（不是文档示例值，必须用实际运行的密钥，否则报 `No connected db`）
- 模型：`gpt-4o, gpt-4o-mini`
- 保存

重复添加其他模型渠道（如果配了对应 API Key）：

- Claude：类型 `Anthropic Claude`，Base URL `http://litellm:4000`，模型 `claude-3-5-sonnet-20241022`
- DeepSeek：类型 `OpenAI`，Base URL `http://litellm:4000`，模型 `deepseek-chat`

**关键：**所有渠道 Base URL 都填 `http://litellm:4000`（容器名），不是 localhost。 NewAPI 和 LiteLLM 在同一个 Docker 网络中，通过容器名互访。

2 **测试渠道连通性**

- 渠道列表 → 点击刚创建的渠道 → **测试** 按钮
- 选择一个模型 → 如果返回正常回复，说明 NewAPI → LiteLLM → 外部模型 链路通了

如果测试失败：检查 `docker logs litellm` 看是否有 API Key 错误。 确认 `.env` 中的 `OPENAI_API_KEY` 等已填入真实密钥。

3 **创建 API 密钥**

为 Dify 和 DeepChat 各创建一个独立密钥，方便后续分开管理用量：

- 左侧菜单 **API 密钥** → **新建**
- 名称：`dify-key` → 保存 → 复制 `sk-xxx`，后续填到 Dify 模型供应商
- 再新建一个，名称：`deepchat-key` → 保存 → 复制 `sk-xxx`，后续分发给 DeepChat 用户

**为什么要分开？**Dify 是服务端调用，DeepChat 是客户端调用，两把 key 分开后可以在 NewAPI 用量统计里分别查看各自消耗，出问题也容易定位。

#### 允许普通用户自助申请 API Key

员工（含 AD 同步用户）登录后，默认在 **API 密钥** 页面可以自己"新建"密钥，这是内置功能、无需额外开关。但要能真正调用模型，还需满足两点：

1. **用户有额度**：新用户默认额度是 `0`（无法调用）。已在 `.env` 设置 `DEFAULT_QUOTA=100`，让新用户注册即送 100 美元额度。
2. **用户有 token**：设置 `GENERATE_DEFAULT_TOKEN=true` 后，新用户注册时自动生成一个初始 token；用户也可自己在 API 密钥页新建。

**⚠️ 只对"新注册"用户生效：**`DEFAULT_QUOTA` 和 `GENERATE_DEFAULT_TOKEN` 只在用户**首次注册/首次 OIDC 登录**时起作用。已经登录过的用户（如 `aitest1`）不会自动补发，需管理员在 **用户** → 编辑该用户 → 手动设置额度，或让用户自己在 API 密钥页创建 token。

**✅ 验证：**普通用户在游乐场选择自己的 token 后，可以正常发送消息收到回复。

**✅ 验证：**NewAPI 仪表盘显示请求次数 > 0。渠道测试返回 AI 回复。

#### 接入 Keycloak OIDC（让 AD 用户直接登录）

完成上述初始化和渠道配置后，可以让员工用 AD 域账号直接登录 NewAPI，无需再手动注册本地账号。

1 **在 Keycloak 中创建 NewAPI OIDC Client**

1. Keycloak 管理后台 → `enterprise-ai` Realm → **Clients** → **Create client**
2. Client ID：`newapi`，Client type：**OpenID Connect** → Next
3. **Client authentication：On**（⚠️ 必开，否则没有 Credentials 标签）
4. Standard flow：**On**，Direct access grants：**On** → Next
5. Valid redirect URIs：`http://<服务器IP>:3000/*`（内网）和 `http://127.0.0.1:3000/*`（本机调试），两个都加上
6. Web origins：`http://<服务器IP>:3000` 和 `http://127.0.0.1:3000` → Save
7. 保存后页面顶部出现 **Credentials** 标签 → 点进去 → 复制 **Client secret**

2 **在 NewAPI 中开启 OIDC**

1. NewAPI 管理后台 → **系统设置** → **身份验证** → **自定义 OAuth** → **添加 OAuth 提供商**
2. 按以下分组填写：

**快速设置**

| 配置项 | 推荐值 |
|---|---|
| 预设模板 | `Keycloak` |
| API 地址 | `http://127.0.0.1:9090` |

**基本信息**

| 配置项 | 推荐值 |
|---|---|
| 已启用 | 开启 |
| 提供商名称 | `Keycloak` |
| 标识符 | `keycloak` |
| 图标 | `keycloak`（可选） |

**凭证**

| 配置项 | 推荐值 |
|---|---|
| Client ID | `newapi` |
| Client Secret | Keycloak Credentials 复制的值 |
| 认证方式 | 默认（Auto Detect） |

**端点（先自动发现，再手动修正）**

| 配置项 | 推荐值 |
|---|---|
| Well-Known URL | `http://host.docker.internal:9090/realms/enterprise-ai/.well-known/openid-configuration` |
| 点 **"自动发现"** → 三个端点自动填好（都带 `<服务器IP>:9090` 前缀）→ **然后手动改**： |  |
| 授权端点 | **保持 `<服务器IP>:9090` 不动**（浏览器跳转用，能直接访问） |
| 令牌端点 | 把 `<服务器IP>:9090` 改成 **`host.docker.internal:9090`**（NewAPI 容器内部调 Keycloak 换 token） |
| 用户信息端点 | 把 `<服务器IP>:9090` 改成 **`host.docker.internal:9090`**（NewAPI 容器内部拿用户信息） |

**为什么不能用 <服务器IP>？**NewAPI 是 Docker 容器，`<服务器IP>` 指向容器自己而非宿主机，必须用 `host.docker.internal` （Docker Desktop 自动解析到宿主机）。自动发现后授权端点也被自动填为 `http://host.docker.internal:9090/...`，浏览器端也能访问，无需额外修改。

**作用域**

| 配置项 | 推荐值 |
|---|---|
| 作用域 | `openid profile email` |

**字段映射**

| 配置项 | 推荐值 |
|---|---|
| 用户 ID 字段 | `sub` |
| 用户名字段 | `preferred_username` |
| 显示名称字段 | `name` |
| 邮箱字段 | `email` |

**高级**

| 配置项 | 推荐值 |
|---|---|
| 访问策略 (JSON) | 留空（允许所有用户） |
| 访问被拒绝消息 | 留空 |

**⚠️ 保存后必须补一步：**回到 Keycloak → `newapi` Client → Settings → Valid redirect URIs，把自动生成的**授权回调 URL**（内网 `http://<服务器IP>:3000/oauth/keycloak`，本机 `http://127.0.0.1:3000/oauth/keycloak`）加进去，Save。否则回调失败。

**⚠️ 必改：NewAPI 服务器地址必须设为员工能访问的地址（否则换 token 报 invalid_grant / Incorrect redirect_uri）**  
 NewAPI 后端用 authorization code 换 token 时，会用系统设置的**"服务器地址"**拼 redirect_uri。默认值是 `http://localhost:3000`，与浏览器访问地址不一致 → Keycloak 报 `invalid_grant - Incorrect redirect_uri`。  
  
 内网部署时设为内网地址 `http://<服务器IP>:3000`（本机调试可设为 `http://127.0.0.1:3000`），设置方法：NewAPI 后台 → **设置 → 系统设置 → 通用设置 → 服务器地址**。  
**⚠️ 关键：服务器地址设成内网 IP 后，本机也要用内网 IP 访问（`http://<服务器IP>:3000`），不能再点 `127.0.0.1:3000`。**因为授权阶段 redirect_uri 取浏览器地址（127.0.0.1）、换 token 取服务器地址（内网 IP），两者不一致会再次报 `invalid_grant - Incorrect redirect_uri`。  
 或直接改数据库：  
`docker exec new-api-db mysql -uroot -p... new-api -e "INSERT INTO options (\`key\`, value) VALUES ('ServerAddress','http://<服务器IP>:3000') ON DUPLICATE KEY UPDATE value='http://<服务器IP>:3000';"` 然后 `docker compose restart new-api`

4. 退出 NewAPI → 登录页出现 **Keycloak** 按钮 → 用域账号测试登录

3 **用 AD 账号测试登录**

1. 打开 `http://127.0.0.1:3000` → 登录页应出现 **Keycloak/OIDC 登录** 按钮
2. 点击 → 跳转到 Keycloak 登录页 → 输入 AD 域账号（如 `aitest1` + 域密码）
3. 登录成功 → 回到 NewAPI，用户名显示为 AD 账号

**✅ 验证：**AD 用户 `aitest1` 可以在 NewAPI 登录页通过 OIDC 按钮直接登录，无需在 NewAPI 中额外注册。

**⚠️ SSO 登录的管理员默认是普通角色，访问管理页会 403：**通过 OIDC 登录的用户在 NewAPI 里是 **common 角色（role=1）**，点开「渠道 / 用户 / 令牌」等管理页会报 403（前端要求 `role ≥ 10`）。  
  
**修复：**把 SSO 映射的本地用户提升为 root。先查出绑定关系，再改角色：  
`docker exec new-api-db mysql -uroot -p... new-api -e "SELECT user_id, provider_user_id FROM user_oauth_bindings;"`  
 找到管理员对应的 `user_id`（其 `provider_user_id` 即 Keycloak 用户的 sub）后：  
`docker exec new-api-db mysql -uroot -p... new-api -e "UPDATE users SET role=100 WHERE id=<user_id>;"`  
 然后 `docker restart new-api`。之后管理员用 Keycloak 账号登录即可访问全部管理页。

**排错：登录返回 429 (Too Many Requests)**  
 NewAPI 默认限流很严格，OIDC 调试期间连续失败容易触发。登录/OAuth 回调走的是 **CriticalRateLimit（关键接口限流）**，默认 **20 次 / 20 分钟**，与全局限流（GW/GA）是独立开关。环境变量：`CRITICAL_RATE_LIMIT_ENABLE` / `CRITICAL_RATE_LIMIT`（非系统设置里的"速率限制"页面）。  
  
**临时解除：**  
`docker exec new-api-redis redis-cli --scan --pattern "rateLimit:*" | xargs -r docker exec new-api-redis redis-cli DEL`  
  
**永久方案：**已在 `.env.windows` 预设四组变量：`GLOBAL_WEB_RATE_LIMIT=999999`、`GLOBAL_API_RATE_LIMIT=999999`、`CRITICAL_RATE_LIMIT_ENABLE=false`、`CRITICAL_RATE_LIMIT=999999`，docker-compose.yml 引用这些变量。重新创建容器后生效。

<a id="config-litellm"></a>

### 6.3 LiteLLM — 验证（PII 脱敏暂时禁用）

**⚠️ PII 脱敏（Presidio guardrail）暂时禁用：**新版 LiteLLM 的 guardrail 配置格式变更，`litellm-config.yaml` 里该段已注释掉。当前 LiteLLM 仅做 LLM 代理转发（不脱敏）。**此步可跳过**，待 guardrail 兼容后重新启用。

1 **验证 LiteLLM 基本可用**

```
# 发送一条测试消息
curl -X POST http://<服务器IP>:4001/v1/chat/completions ^
  -H "Authorization: Bearer <LITELLM_MASTER_KEY>" ^
  -H "Content-Type: application/json" ^
  -d "{\"model\":\"deepseek-chat\",\"messages\":[{\"role\":\"user\",\"content\":\"say hi\"}]}"
```

**✅ 验证：**

- 返回正常 AI 回复（如 `Hi there...`）即通过
- **⚠️ `<LITELLM_MASTER_KEY>` 是 LiteLLM 管理员密钥**：取 `.env` 里 `LITELLM_MASTER_KEY` 的实际值（见账号密码清单 `credentials.html`），不要用占位符本身，否则返回 `401 Unauthorized`
- **⚠️ 必须用内网 IP**`<服务器IP>:4001`，不能用 `127.0.0.1:4001`（WSL2 端口转发问题，实测 127.0.0.1 不通）
- 模型只启用了 `deepseek-chat`（`gpt-4o-mini` 等未配置）

2 **启用 Redis 语义缓存（redis-semantic，推荐）**

LiteLLM 已启用 **Redis 语义缓存**（`type: redis-semantic`）：请求先由本地 `bge-m3` 向量化，与缓存中的历史请求做相似度比对，**意思相近即命中**（相似度 ≥ `similarity_threshold`），跨用户共享、直接省外部 LLM 费用（实测命中请求 `Key-Spend: 0.0`）。语义命中响应带 `x-litellm-semantic-similarity` 头，可据此调阈值。

```
# litellm-config.yaml 末尾
litellm_settings:
  cache: true
  cache_params:
    type: redis-semantic
    host: litellm-redis   # 独立缓存 Redis（compose 的 litellm-redis 已用 redis-stack-server 镜像，自带 RediSearch 向量检索）
    port: 6379
    ttl: 3600            # 缓存 1 小时，按数据更新频率调
    similarity_threshold: 0.8
    # 0.9+ 接近精确匹配；0.7~0.8 推荐平衡点；0.6~0.7 更激进省钱
    redis_semantic_cache_embedding_model: bge-m3  # 本地 embedding（model_list 已注册，走宿主机 Ollama）
    redis_semantic_cache_index_name: litellm_semantic_cache_index
```

**✅ 验证：**

- **前置（3 步）**：① `docker-compose.yml` 的 `litellm-redis` 镜像换成 `redis/redis-stack-server`（原生 redis 兼容，RediSearch 提供向量检索）；② 宿主机装 Ollama 并 `ollama pull bge-m3`，`.env` 设 `OLLAMA_API_BASE=http://host.docker.internal:11434`（容器经 `host.docker.internal` 访问宿主机，完全本地免费）；③ litellm 容器环境变量补 `REDIS_PASSWORD=${LITELLM_REDIS_PASSWORD:-}`——**RedisSemanticCache 强制要求该变量（可空）**，不补会启动报 `Missing required Redis configuration: REDIS_PASSWORD`
- **验证命中**：连续两次**语义相近但措辞不同**的请求（如「介绍一下公司AI平台有哪些功能」vs「平台有哪些主要功能」），第二次响应带 `X-Litellm-Cache-Key` + `X-Litellm-Semantic-Similarity`（实测 0.92），耗时从十几秒降到 <0.5 秒
- **适用建议**：确定性任务（知识库问答 / 固定模板 / `temperature=0`）收益最大；需要实时/个性化内容用请求头 `no-cache` 绕过
- **关闭缓存**：`cache: false` 或注释整块，重启 `litellm`

**扩展：添加更多 LLM 提供商**（例如 OpenAI / Claude，按需）：

1. `.env` 中取消 `# OPENAI_API_KEY=` 的注释，填入真实 Key
2. `litellm-config.yaml` 中取消对应 model 块的注释
3. 重启 LiteLLM：`docker compose up -d litellm`

<a id="config-dify"></a>

### 6.4 Dify — 配置模型供应商

1 浏览器打开 `http://<服务器IP>`

- 首次访问 → 设置管理员邮箱和密码 → 登录
- **统一账号建议：**邮箱用 `ai_all_in_one_admin@<公司域名>`（把 `<公司域名>` 改成你公司域名，如 `company.com`）；如产品有「用户名/账号」字段则填 `ai_all_in_one_admin`；密码用统一管理员密码（见账号密码清单 `credentials.html`）

2 **添加模型供应商（指向 NewAPI）**

- **设置** → **模型供应商**
- 找到 **OpenAI-API-compatible** → **添加模型**
- 配置（**以下以 DeepSeek 为例，请按你实际在 NewAPI 里配置的渠道和模型名填写**）：
    - 模型名称：`deepseek-chat`（示例，改成你实际的模型名）
    - API Key：`dify-key` 的 `sk-xxx`（在 NewAPI API 密钥中复制）
    - API endpoint：`http://host.docker.internal:3000/v1`
- 如需更多模型，重复添加（如 `gpt-4o`、`claude-3-5-sonnet` 等，取决于你在 NewAPI 里配了哪些渠道）

**注意：**Dify 使用 `host.docker.internal` 而不是容器名， 因为 Dify 在自己的 Docker 网络中，与 NewAPI 不在同一网络。 `host.docker.internal` 在 Docker Desktop for Windows 上自动可用。

3 **创建测试应用**

- **工作室** → **创建空白应用** → 选"聊天助手"
- 右上角选择模型 `deepseek-chat`（示例，选你实际配置的模型）
- 发送消息 → 收到 AI 回复 → 链路验证成功

**✅ 验证：**Dify 中 AI 正常回复消息。查看 `docker logs new-api` 能看到 Dify 的请求记录。

**🔍 用 Dify 承载统一知识库（RAG）：**如需让 DeepChat 通过 MCP 检索 Dify 知识库，除上面的 LLM 供应商外，还需在「模型供应商」里加一个 **embedding 模型**（如 `bge-m3`）并设为默认，再创建知识库 + Knowledge API Key。完整步骤见 [8.9 RAG — 统一知识库检索](#mcp-rag)。

<a id="config-ghost"></a>

### 6.5 Ghost — 配置门户

1 浏览器打开后台入口 `http://<服务器IP>:8090/ghost/`（**注意 /ghost/ 后缀，这是管理员后台**）

- 首次访问 → Ghost setup 向导 → 设置站点标题 + 姓名 + 邮箱 + 密码（创建管理员账号）。**注意：Ghost 5 后台登录是免密的**——之后每次登录输入邮箱，Ghost 会发 6 位验证码到 MailHog（`:8025`）里；或在 AI 管理中心点「Ghost 后台」的「打开」直接免登录（见 13.10）。
- **统一账号建议：**邮箱用 `ai_all_in_one_admin@<公司域名>`（`<公司域名>` 改成公司域名），密码用统一管理员密码（见 `credentials.html`，需至少 10 位）
- **⚠️ 别在门户首页（`/`）点「注册」：**那是给访客用的 **订阅者（members）注册**，走 magic link 邮箱验证，未配置 SMTP 邮件服务会报 500。管理员入口是 `/ghost/`。

**🤖 自动化（可选）：**不用在浏览器里点向导，直接跑 `scripts\ghost-setup.ps1` 即可用 setup API 一次性创建管理员（从 `.env` 读 `GHOST_ADMIN_EMAIL` / `ADMIN_PASSWORD`），等效于走完向导：`powershell -File .\scripts\ghost-setup.ps1`（已初始化时自动跳过）。

2 **安装并激活项目自带主题 Corp Portal**

项目自带一个定制好的 Ghost 主题 `ghost-theme-corp-portal/`（稳重专业的企业风格：首页含 Hero + 平台能力卡片 + 新闻列表，移动端自适应，中文宋体/黑体），用它替换官方默认主题：

**🤖 自动化（推荐）：**直接跑一键脚本 `scripts\ghost-theme-setup.ps1`，它会自动完成「复制主题进容器 → 改 `settings.active_theme` 激活 → 重启 Ghost」：

```
powershell -File .\scripts\ghost-theme-setup.ps1
```

等价的手工步骤（脚本内部做的事，便于排障）：

```
# 复制主题进容器
docker cp .\ghost-theme-corp-portal\. ghost:/var/lib/ghost/content/themes/corp-portal-theme/
# 激活（改 active_theme，免后台点选）
docker cp .\scripts\ghost-activate-theme.js ghost:/tmp/
docker exec ghost node /tmp/ghost-activate-theme.js corp-portal-theme
# 重启生效
docker restart ghost
```

- 激活后无需再手动选主题；想换回官方主题时，后台 **外观 → 主题** 激活 Casper / Source 即可。
- **⚠️ 别从 GitHub 直接装最新版主题：**部分官方主题（如 `Journal`）的 main 分支已适配 Ghost 6.x，在 Ghost 5.x 上会报 `Theme is not compatible or contains errors`（invalid Handlebars syntax）。本主题 `ghost-theme-corp-portal` 已针对 Ghost 5.x 验证，直接用即可。

3 **导入示例内容（可选，含发布地址 + 语言选择）**

项目自带一份门户示例内容种子 `ghost-content-seed/content.json`（站点标题/描述、主导航、4 篇示例文章 + 1 个 DeepChat 下载页）。导入后门户开箱即有内容，无需从零建页面。

**🤖 自动化（推荐）：**部署 Agent 会先问你两件事，再生成真正的内容：

1. **对外发布地址**（内网 IP 或域名，如 `192.168.1.10` 或 `portal.company.com`）：内容里的文章正文也含各产品访问地址（NewAPI / MCP / Dify 等），Agent 会用这个地址替换 seed 里的 `<服务器IP>` 占位符（注意保留 `host.docker.internal` 这类容器内固定地址不动）。
2. **内容语言**：中文（默认）直接导入；其他语言先把 seed 里的 `title` / `html` / `plaintext` / `custom_excerpt` 翻译成目标语言，再导入。

导入命令（Agent 自动执行）：

```
powershell -File .\scripts\ghost-content-import.ps1 -ServerAddr "<对外发布地址>"
```

脚本内部做的事：把 `ghost-content-seed/content.json` 复制进容器 → 在容器内执行 `node /tmp/ghost-content-import.js /tmp/content.json <对外发布地址>` → 自动替换 `<服务器IP>` 占位符、创建文章/页面、写入导航和站点设置（已存在的 slug 自动跳过，幂等）。

导入后门户首页即为新闻列表，导航含 Home / DeepChat / Dify，下载页 `/deepchat/` 已有完整下载链接——原「配置导航菜单」「创建下载页」两步由种子自动完成，无需手工再配。

**✅ 验证：**Ghost 首页显示主题样式 + 示例新闻列表，导航含 Home / DeepChat / Dify，下载页 /deepchat/ 有安装包链接。

<a id="config-gitea"></a>

### 6.6 Gitea — 初始化和 Runner 注册

1 浏览器打开 `http://<服务器IP>:3002`

- 完成安装向导（数据库选 SQLite，已预配）
- 创建管理员账号
- **统一账号建议：**用户名用 `ai_all_in_one_admin`，邮箱用 `ai_all_in_one_admin@<公司域名>`（`<公司域名>` 改成公司域名），密码用统一管理员密码（见 `credentials.html`）

2 **启用 Actions 并获取 Runner Token**

- 右上角头像 → **Site Administration** → **Actions**
- 确认 `Enabled Actions` 已开启
- **Runners** → **Create new Runner** → 复制 Registration Token

3 **用 Token 重启 Runner 容器**

```
# 编辑 .env 文件，填入 Runner Token
# .env
GITEA_RUNNER_TOKEN=你从Gitea复制的Token

# 重新创建 Runner 容器（⚠️ 必须用 up -d，不能用 restart：
# restart 只重启进程，不会重新读取 .env 的环境变量，token 变了也不会生效）
docker compose -f docker-compose.yml up -d gitea-runner

# 等待几秒后检查 Runner 状态（看到 "Runner registered successfully." 即成功）
docker logs gitea-runner 2>&1 | findstr "Runner registered"
```

**✅ 验证：**Gitea → Site Administration → Runners 页面显示 Runner 状态为 **Idle**（绿色）。

**⚠️ 踩坑 1：Gitea 报 `readonly database` / 页面打不开：**通常是因为 `gitea-data` 卷里的 `gitea.db` 被 root 用户创建（而非容器内的 `git` 用户），导致 Gitea 无法写入。修复：停 Gitea 后删除那个空/root 属主的 `gitea.db`（在宿主机 `gitea-data/git/gitea.db` 或通过 `docker exec` 定位），再 `docker compose up -d gitea` 让它以 git 用户重建。

**⚠️ 踩坑 2：Gitea 的 `ROOT_URL` 要设成内网地址：**docker-compose 里 `GITEA__server__ROOT_URL` 若还是 `http://localhost:3002/`，则 Gitea 生成的仓库链接、API 返回的 `html_url` 都会是 `localhost`/容器地址（内网员工点开失效）。改为 `http://<服务器IP>:3002/` 后 `docker compose up -d gitea` 重建生效。

**🔐 Gitea Keycloak SSO 自动注册（v0.91）：**Gitea 已接 Keycloak OIDC（`/user/login` 页有「Sign in with keycloak」按钮）。为让新 SSO 用户首次登录**自动建号、不再跳 `link_account`**（关联账号）页，需在 `app.ini` 追加 `[oauth2_client]` 段（docker-compose 已配 `GITEA__oauth2_client__*` 环境变量）：`ENABLE_AUTO_REGISTRATION=true`、`ACCOUNT_LINKING=auto`、`USERNAME=preferred_username`。⚠️ Gitea 本地管理员邮箱必须与 Keycloak/AD 一致（`@<公司域名>`），否则 SSO 按邮箱匹配不到会「串号」或生成重复账号。

<a id="deepchat"></a>

## 7. DeepChat 安装与配置

DeepChat 是桌面端 AI 对话客户端，通过 NewAPI 统一调用后端大模型。下面三种方式任选其一。

### 7.1 方式 A：内网分发（推荐，员工从内网下载）

**说明：**分发链路 = GitHub Releases 安装包 → `deepchat-sync` 仓库的 Gitea Actions 工作流 → Update Server(8091) → Ghost 下载页 → 员工下载。**不再需要 Gitea 源码镜像仓库**（`deepchat` mirror 已删除）——镜像只同步 git 源码、**不同步 release 安装包**，且每天 8 小时同步一次、占 ~107 MB，对「分发安装包」没有任何帮助。若将来要做源码审计/二次开发再单独建。

1 **（可选）建源码镜像仓库，仅供源码审计/二次开发**

仅当需要在内网看 DeepChat 源码、做安全审查或自建打包时才有用，与「分发安装包」无关，可跳过：

```
curl -X POST "http://<服务器IP>:3002/api/v1/repos/migrate" \
  -u "ai_all_in_one_admin:<密码>" \
  -H "Content-Type: application/json" \
  -d '{"clone_addr":"https://github.com/ThinkInAIXYZ/deepchat","repo_name":"deepchat","mirror":true}'
```

2 **下载安装包到 Update Server**

```
# 从 GitHub release 下载（以 v1.1.0 为例，替换成最新版本号）
mkdir -p deepchat-updates/deepchat
curl -L -o deepchat-updates/deepchat/DeepChat-1.1.0-windows-x64.exe \
  https://github.com/ThinkInAIXYZ/deepchat/releases/download/v1.1.0/DeepChat-1.1.0-windows-x64.exe
curl -L -o deepchat-updates/deepchat/DeepChat-1.1.0-mac-x64.dmg \
  https://github.com/ThinkInAIXYZ/deepchat/releases/download/v1.1.0/DeepChat-1.1.0-mac-x64.dmg
```

**✅ 验证：**下载链接可访问：`curl -I http://<服务器IP>:8091/deepchat/DeepChat-1.1.0-windows-x64.exe` → HTTP 200/206。

3 **更新 Ghost 下载中心页面**

在 Ghost 的 `downloads` 页面放上内网下载链接（见 6.5 步骤 4）。员工打开 `http://<服务器IP>:8090/downloads/` 即可下载。

#### 自动同步（Gitea Actions，可选）

上面的三步可以固化成 Gitea Actions 工作流，每天自动检查 GitHub 新版本并同步。已实现：

| 组件 | 说明 |
|---|---|
| `deepchat-sync` 仓库 | Gitea 普通仓库（**不能**用 mirror 仓库，mirror 只读），放 `.gitea/workflows/sync.yml` + `update_ghost.py` |
| workflow 触发 | `schedule`（每天 UTC 2 点）+ `workflow_dispatch`（手动） |
| 同步逻辑 | 查 GitHub API 最新 tag → 对比 `version.txt` → 有新版则下载安装包 + 更新 Ghost 下载页 + 写版本 |
| runner 配置 | `gitea-runner-config.yaml` 挂载到 runner，加 `CONFIG_FILE` 环境变量；`container.network: ai-platform`（让 job 容器解析 gitea 容器名） |

```
# 手动触发一次同步
curl -X POST "http://<服务器IP>:3002/api/v1/repos/ai_all_in_one_admin/deepchat-sync/actions/workflows/sync.yml/dispatches" \
  -u "ai_all_in_one_admin:<密码>" -H "Content-Type: application/json" -d '{"ref":"main"}'

# 或 Gitea Web UI：deepchat-sync → Actions → 运行工作流
```

关键坑：① act_runner 的 `container.network` 必须通过 `config.yaml`（+ `CONFIG_FILE` 环境变量）配置，否则 job 容器在独立网络解析不了 `gitea` 主机名；② docker.sock 由 act_runner 自动挂载，不要在 `options` 里再挂一次（会报 Duplicate mount point）；③ 下载 docker CLI 时偶发 `curl (18) HTTP/2 stream` 网络瞬断，workflow 已给该下载加 `--http1.1 --retry 5`；④ **内网 Docker daemon 通常访问不了 Docker Hub**（`registry-1.docker.io` 超时），而 runner 默认 `force_pull: true` 会每次强制拉取 job 镜像 `node:20`，导致 job 在跑任何 step 之前就失败——需在 `gitea-runner-config.yaml` 里设 `force_pull: false`，并在宿主机先 `docker pull node:20` 预置镜像（或给 Docker Desktop 配镜像加速器）。

#### 国内下载源配置（`sync-config.json`）

**⚠️ 国内访问 GitHub 基本不通，官方「下载页」其实不解决下载问题：**官网 `deepchatai.cn` 的下载数据来自它自己服务器上的 `https://deepchatai.cn/download-cache.json`（国内可达），但里面的安装包 `browser_download_url`**仍指向 `github.com/.../releases/download/...`**，前端点「下载」就是直接跳 GitHub，没有任何国内镜像/加速改写。而且这份缓存**会滞后**（官网 stable 显示 v1.0.7 时，GitHub 实际已是 v1.1.0）。

所以真正解决国内下载靠 `deepchat-sync` 仓库根目录的 `sync-config.json`，两个开关：

| 字段 | 作用 | 默认 |
|---|---|---|
| `version_source` | 查版本走哪：`github`（GitHub API，最准）或 `official`（官网 download-cache.json，国内可达但滞后） | `github` |
| `download_prefix` | 下载加速前缀，下载链接变成 `前缀 + github.com/...`，留空直连 | `""` |
| `keep_releases` | 下载页版本历史最多保留几个（最新在前，超出自动裁剪） | `5` |
| `market_url` | 下载页「先装技能管家」提示里的内网 Skill 市场地址 | `http://<服务器IP>:3100` |

```
# ① 能连 GitHub：默认不改
{ "version_source": "github", "download_prefix": "" }
# ② GitHub 加速代理（最常用）
{ "version_source": "github", "download_prefix": "https://ghproxy.com/" }
# ③ GitHub API 完全不通：官网查版本 + 代理下载
{ "version_source": "official", "download_prefix": "https://ghproxy.com/" }
```

工作流内置 `version_cmp.py` 做版本号比较，**只有「最新版 > 本地已部署版」才下载**——因为官网缓存滞后（v1.0.7 < 本地 v1.1.0），若按「版本不同就下载」会把员工客户端**回退到旧版**。同时 `update_ghost.py` 会自动维护下载页：新版本累积成时间轴、按 `keep_releases` 裁剪、同版本幂等（不重复追加）、页面被误删时自动重建（UPSERT）。

### 7.2 方式 B：用 Docker 构建自定义版本

1 **用 Docker 临时容器构建**

```
# PowerShell
mkdir deepchat-build

# 启动临时 Node.js 容器进行构建
docker run -it --rm ^
  -v ${PWD}/deepchat-build:/app ^
  -w /app ^
  node:20 bash

# === 容器内执行 ===
git clone https://github.com/ThinkInAIXYZ/deepchat.git .
npm ci

# 构建 Windows 安装包
npx electron-builder --win --x64

# 构建产物在 dist/ 目录
ls dist/
# DeepChat-Setup-0.0.1.exe  latest.yml

# 退出容器
exit

# === 回到 PowerShell ===
# 将安装包复制到 Update Server 目录
mkdir deepchat-updates
copy deepchat-build\dist\*.exe windows\deepchat-updates\
copy deepchat-build\dist\latest.yml windows\deepchat-updates\
```

**✅ 验证：**浏览器打开 `http://127.0.0.1:8091/deepchat/latest.yml` 能看到 YAML 文件内容。

### 7.3 配置 DeepChat 客户端

1 **配置 LLM Provider**

- 打开 DeepChat → **设置** → **模型服务**
- 选择"自定义 Provider" 或 "OpenAI 兼容"
- API Base URL：`http://<服务器IP>:3000/v1`（NewAPI，员工电脑上必须用内网 IP，不能用 <服务器IP>）
- API Key：`deepchat-key` 的 `sk-xxx`（在 NewAPI API 密钥中复制）
- 模型选择：`gpt-4o-mini`（或 `deepseek-chat`）
- 保存

2 **测试对话**

- 新建对话 → 发送 "你好" → 收到 AI 回复
- 发送 "我的邮箱是 test@example.com" → 查看回复

3 **验证 PII 脱敏**

```
# 查看 LiteLLM 日志确认脱敏
docker logs litellm 2>&1 | findstr "EMAIL"
```

**✅ 验证：**日志显示 `EMAIL_ADDRESS` 被检测到并替换为 `[EMAIL]`。 DeepChat 收到的回复中邮箱地址被还原。

4 **配置 MCP Server（可选）**

- DeepChat → **设置** → **MCP**
- 添加 MCP Server：名称 `filesystem`
- 命令：`npx -y @modelcontextprotocol/server-filesystem C:\Users`
- 保存 → 在对话中测试 "列出我的文件"

<a id="mcp"></a>

## 8. MCP Gateway — Skill / MCP 管理 Hub

**说明：**MCP Gateway 是 Skill 和 MCP 工具的集中管理网关，基于官方 `@modelcontextprotocol/sdk` 实现，暴露标准 Streamable HTTP `/mcp` 端点。DeepChat 和 Dify 连这一个地址即可获取所有工具（内置平台工具 + 聚合的外部 MCP Server）。已并入主 docker-compose.yml，随核心服务一起启动。

### 8.1 部署（已并入主 docker-compose.yml）

MCP Gateway 已作为 `mcp-gateway` 服务加入主 `docker-compose.yml`，端口 `3100`，随核心服务 `docker compose up -d` 一起启动。源码在 `mcp-gateway/` 目录（gateway.js + package.json + mcp-servers.json）。

**⚠️ 前置步骤（一次性）：**网关依赖 `@modelcontextprotocol/sdk`（`node_modules` 不随仓库发布），首次部署前先装依赖：

```
cd mcp-gateway
npm install
```

否则 `node gateway.js` 会报 `Cannot find module '@modelcontextprotocol/sdk'`。

### 8.2 内置平台工具

| 工具 | 用途 |
|---|---|
| `platform_time` | 返回服务器当前时间 |
| `platform_echo` | 回显文本（连通性测试） |
| `platform_services` | 列出平台服务清单 |
| `search_knowledge` | 检索 Dify 统一知识库，返回最相关文本片段（RAG，见 8.9） |

### 8.3 聚合外部 MCP Server

编辑 `mcp-gateway/mcp-servers.json`，添加 stdio 或 http 类型的 MCP Server，重启 `mcp-gateway` 生效。参考 `mcp-servers.example.json`：

```
{
  "servers": [
    { "name": "filesystem", "type": "stdio", "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/data"] },
    { "name": "github", "type": "http", "url": "https://api.githubcopilot.com/mcp" }
  ]
}
```

聚合的工具会自动加 `{serverName}_` 前缀，避免与内置工具重名冲突。

### 8.4 客户端接入（DeepChat / Dify）

1. DeepChat：设置 → MCP → **新增** → 点 **「跳过至手动配置」** → 类型选 **可流式传输的 HTTP 请求（HTTP）**
2. 基础 URL 填：`http://<服务器IP>:3100/mcp`
3. Dify 工作流：自定义工具 / MCP 工具配置同样指向 `http://<服务器IP>:3100/mcp`

**⚠️ 关键：**DeepChat 点「新增」后默认进入模板/预设选择页，**必须点「跳过至手动配置」**才会出现手动填类型和基础 URL 的界面（否则找不到「可流式传输的 HTTP 请求」类型）。

**一键接入 vs 手动配置：**① **一键接入**（`/market` 页顶部或 AI 管理中心 MCP 页的「复制 DeepChat 一键接入链接」）走 **SSE 端点 `/sse`**——因为 DeepChat 的 `deepchat://mcp/install` 处理器**只接受 stdio/sse，不接受 Streamable HTTP**，SSE 会显示「SSE is legacy-only」提示，**属正常、不影响使用**。② **手动配置**走 Streamable HTTP `/mcp`（无该提示，推荐）。两者连的是同一个网关、同一套工具（含 `search_knowledge`）。

### 8.5 验证

1. `curl http://<服务器IP>:3100/health` → 返回 `{"status":"ok"}`
2. `curl -X POST http://<服务器IP>:3100/mcp -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'` → 返回内置工具列表

MCP Gateway 运行后，DeepChat 客户端在 MCP 设置中添加 `http://<服务器IP>:3100/mcp` 即可使用平台工具。Dify 工作流也可通过 MCP 工具配置接入同一地址。

### 8.6 扩展：添加自定义内置工具

在 `mcp-gateway/gateway.js` 中加两步：先往 `builtinTools` 数组加工具定义，再在 `callBuiltin` 加执行逻辑。

```
// ① 工具定义（builtinTools 数组里加一项）
{ name: 'platform_health', description: '查询服务健康状态',
  inputSchema: { type: 'object', properties: {} } }

// ② 执行逻辑（callBuiltin 函数里加一个分支）
if (name === 'platform_health') {
  return '所有服务运行正常';
}
```

修改后重启生效：`docker compose restart mcp-gateway`。之后 DeepChat 里重新连接该 MCP 服务器即可看到新工具。

### 8.7 Skill 市场（内网技能包分发）

MCP Gateway 同时托管内网 Skill（技能包），提供浏览、下载、安装三个端点：

| 端点 | 作用 |
|---|---|
| `/market` | Skill 市场页面（浏览器打开，卡片式浏览 + 下载 ZIP + 复制安装地址） |
| `/skills` | 技能清单（JSON，含 name/description/version） |
| `/skills/<名称>.zip` | 技能包下载（`adm-zip` 动态打包） |

技能放在 `mcp-gateway/skills/` 目录下（含 `SKILL.md` 的子目录），**每次请求自动扫描，无需重启**。内置示例：`platform-report`（生成平台状态报告）。

**DeepChat 装 Skill：**设置 → Skills → **从 URL 安装**，填 `http://<服务器IP>:3100/skills/<名称>.zip`。  
**关键认知：**DeepChat 里 MCP 和 Skill 是两个独立概念——MCP 是「工具」（function calling），Skill 是「智能体技能包」（SKILL.md 指令 + 脚本）。DeepChat 的 Skill **没有「自定义市场 URL」**，官方只支持「文件夹 / ZIP / URL」三种安装方式，所以内网分发只能靠「URL 安装」变相实现（网关托管 zip + 市场页）。

#### 「技能管家」Skill（先装，供员工找/装/更新技能）

内置一个引导型 `skill-market` 技能，员工先装它，之后在对话里问「有哪些技能 / 帮我装 X / 更新技能」即可。它不碰 DeepChat 内部目录（100% 可靠），只负责：读 `config.json` 里的 `market_url` → 请求 `/skills` 清单 → 筛选/推荐 → 给安装指引 → 比 version 提示更新。Ghost 下载页顶部已置顶「首次使用先装技能管家」提示。

```
# 技能管家自己的市场地址（打包进 zip 分发给员工）
# mcp-gateway/skills/skill-market/config.json
# ⚠️ 用主机名，不要用 IP（DeepChat 会脱敏 IP）
# ⚠️ <市场主机名> 是部署参数，必须替换（见下方「自动 / 手动」）
{ "market_url": "http://<市场主机名>:3100" }
```

**⚠️ 重要：`market_url` 用主机名，且 `<市场主机名>` 是**部署参数，必须替换**。**DeepChat 的 agent 环境会把 IP 地址脱敏成 `[IP_ADDRESS_REDACTED]`，导致「技能管家」读不到真实 IP、无法请求 `/skills` 清单；主机名不受脱敏影响。但主机名是**每套部署都不同的本地值**，不能照抄（每套部署换成自己的域名，例如 `skillmarket.<公司域名>`）。

- **自动（推荐，用 Agent 部署）：**Agent 会在「第 0 章 · 第一步收集参数」时问你「Skill 市场主机名（域名）」，然后自动把 `mcp-gateway/skills/skill-market/config.json` 和同目录 `SKILL.md` 里的 `<市场主机名>` 全部替换成你的值。
- **手动：**编辑 `mcp-gateway/skills/skill-market/config.json`（及 `SKILL.md` 兜底地址），把 `<市场主机名>` 换成你的主机名；再让该主机名可解析——单机在 `C:\Windows\System32\drivers\etc\hosts` 加一行 `<服务器IP>  <你的主机名>`（本机调试也可用 `127.0.0.1`），公司内网则在 DNS 加 A 记录。

**主机名取值建议**：用「服务名 + 公司域」的 FQDN，如 `skillmarket.<公司域名>`。DNS 加 A 记录：域控「服务器管理器 → DNS → 正向查找区域 → 你的域 → 新建主机(A) → 名称 `skillmarket`、IP `<服务器IP>`」；或 PowerShell：`Add-DnsServerResourceRecordA -Name "skillmarket" -ZoneName "你的域" -IPv4Address "<服务器IP>"`。

### 8.8 管理 API（供 AI 管理中心增删改）

网关暴露管理 API（需 `X-Admin-Token` 头，值来自 `.env` 的 `MCP_ADMIN_TOKEN`；未配返回 503、错 token 返回 401）。公开的 `/mcp`、`/skills`、`/market` 不受影响：

| 端点 | 作用 |
|---|---|
| `GET/POST /api/servers`、`PUT/DELETE /api/servers/:name` | MCP Server 增删改查（写回 `mcp-servers.json` + 自动重连） |
| `POST /api/skills/upload` | 上传技能 zip（校验含 SKILL.md、防路径穿越、解压到 `skills/`） |
| `DELETE /api/skills/:name` | 删除技能 |

这些接口由 AI 管理中心（第 11 章）的「MCP Gateway」页面通过代理端点调用（Keycloak `ai-platform-admin` 角色保护），管理员在 UI 上即可增删 MCP Server、上传/删除 Skill，员工看到的 `/market` 仍是只读市场。

<a id="mcp-rag"></a>

### 8.9 RAG — 统一知识库检索（search_knowledge 内置工具）

**说明：**MCP Gateway 内置 `search_knowledge` 工具，转发调用 Dify 的 Knowledge API（Service API，`POST /v1/datasets/{id}/hit-testing`）做知识库检索。DeepChat 通过 MCP 调这一个工具即可用上 Dify 承载的统一知识库（RAG），无需 DeepChat 直连 Dify。

#### 整体链路

```
DeepChat ──MCP──> MCP Gateway (:3100/mcp) ──HTTP──> Dify Knowledge API
                                                      POST /v1/datasets/{id}/hit-testing
```

#### 第 1 步：Dify 侧准备（embedding 模型 + 知识库 + Knowledge Key）

1. **配 embedding 模型**：Dify 后台 → 设置 → 模型供应商 → **OpenAI-API-compatible** → 添加一个 embedding 模型（内网无 embedding 时可用宿主机本地 Ollama 跑 `bge-m3`，1024 维中文 embedding），再在「模型供应商」里把它设为**默认 text-embedding 模型**（不设默认会报「Default model not found for text-embedding」）。
2. **创建知识库**：知识库 → 创建 → 索引方式选**高质量（High quality）** → 上传文档 → 按需配检索参数（混合检索、top_k、score_threshold）。
3. **建 Knowledge API Key**：知识库 → **API 访问** → 创建「Knowledge API Key」，记下：
    - key：`dataset-...` 前缀的 Bearer token
    - `dataset_id`：知识库 URL 里 `/datasets/` 与 `/documents` 之间的 UUID

#### 第 2 步：配置环境变量

在 `.env` 中填写（Key 进 .env，不硬编码进 `gateway.js`，随仓库发布需脱敏）：

```
# --- Dify Knowledge API（MCP Gateway search_knowledge 检索用）---
DIFY_API_BASE=http://<服务器IP>/v1
DIFY_KNOWLEDGE_API_KEY=dataset-xxxxx
DIFY_DEFAULT_DATASET_ID=<知识库 UUID>
```

`DIFY_API_BASE` 已注入 `mcp-gateway` 容器（compose 里 `DIFY_API_BASE=${DIFY_API_BASE}`），同时注入 `admin-portal`（供 AI 管理中心「Dify」页的 RAG 检索卡片用）。

#### 第 3 步：重启并验证

1. `docker compose up -d mcp-gateway`（或 `docker restart mcp-gateway`）
2. DeepChat 设置 → MCP → 连 `http://<服务器IP>:3100/mcp`，在对话里调用 `search_knowledge`，传 `query`（可选 `dataset_id`、`top_k`），返回最相关的文本片段（每条含 `content` + `score`）。
3. AI 管理中心 →「Dify」页 →「🔍 RAG 知识库检索」卡片，输入问题即可检索并展示片段（后端 `POST /api/dify/retrieve`，见 11.5）。

**⚠️ 关键坑：**

- **网络打通**：MCP Gateway 在 `ai-platform` 网络，Dify 在它自己的 `docker_default` 网络（compose 项目名 `docker`），两者默认不通。用宿主机内网 IP `http://<服务器IP>/v1` 从容器访问 Dify 的 80 端口即可。
- **Knowledge Key 是账号级**：一个 key 可访问该账号所有知识库；如需「按用户分库」，Dify Knowledge API 不直接支持，需在 MCP 工具层做「用户 → dataset_id」映射。
- **`GET /v1` 会 308**：检索请求必须用完整路径 `/v1/datasets/{id}/hit-testing`，不要只写 `/v1`。
- **中文 query 用 curl `-d` 直传会 400**（编码问题）：用 `--data-binary @文件` 或脚本（Python/Node）发 UTF-8 请求。

#### 备选接入方式：DeepChat 内置 difyKnowledge（不经 MCP Gateway）

DeepChat 客户端内置了一个 `difyKnowledge`（InMemory）MCP 服务器，可直接连 Dify 知识库做检索，**不经过本平台的 MCP Gateway**。适合个人或极少数人使用；企业统一发布仍建议走网关的 `search_knowledge`（密钥不落地、可审计、可统一切换数据集）。

1. DeepChat → 设置 → **MCP 设置** → 找到内置的 **`difyKnowledge`** → 点其 **编辑** 按钮 → **添加 Dify 配置**。
2. 填三项（用第 1 步生成的值）：
    - **API 服务器地址 (endpoint)**：`http://<服务器IP>/v1`（务必带 `/v1`）
    - **API 密钥 (apiKey)**：`dataset-...` 前缀的 Knowledge API Key
    - **数据集 ID (datasetId)**：知识库 UUID
3. 回到对话界面，**启用 Dify 知识库 MCP** 开关。

**⚠️ 注意事项：**

- **模型必须支持工具调用（function calling）**，否则检索不会被触发。
- **密钥下发风险**：`difyKnowledge` 把 Knowledge API Key 直接存在每个客户端本地；key 是**账号级**的，散到各客户端后会失去统一管控。企业对外发布建议用网关 `search_knowledge`（key 只留在服务器 `.env`）。

<a id="cicd"></a>

## 9. CI/CD — DeepChat 自动构建与发布

### 9.1 Fork DeepChat 源码到 Gitea

```
git clone https://github.com/ThinkInAIXYZ/deepchat.git
cd deepchat
# 在 Gitea 中创建空仓库 deepchat 后：
git remote add internal http://127.0.0.1:3002/你的组织/deepchat.git
git push -u internal main
```

### 9.2 配置 DeepChat 发布地址

在 Gitea Web UI 中编辑 `package.json`，修改 `publish.url` 指向更新服务器：

```
"build": {
  "publish": [{
    "provider": "generic",
    "url": "http://<服务器IP>:8091/deepchat/"
  }]
}
```

### 9.3 创建 CI/CD 工作流

.gitea/workflows/release.yml

```
name: Build & Release DeepChat

on:
  push:
    tags: ['v*.*.*']

jobs:
  build:
    runs-on: ubuntu-latest
    container: node:20
    steps:
      - uses: actions/checkout@v4
      - name: Install deps
        run: npm ci
      - name: Build Linux
        run: npx electron-builder --linux --x64
      - name: Build Windows
        run: npx electron-builder --win --x64
      - name: Upload to update server
        run: |
          cp dist/*.exe dist/*.AppImage dist/latest*.yml /tmp/
          curl -X PUT -T /tmp/latest.yml http://update-server/deepchat/latest.yml || true
```

**说明：**Gitea Runner 需要能访问 Docker（已挂载 `docker.sock`）。构建产物需手动或通过脚本上传到 `update-server` 容器（端口 8091）。

### 9.4 Ghost 生成 API Token（供 Gitea 发布公告用）

1. Ghost 后台 → **Integrations** → 添加自定义集成 → 生成 Admin API Key（格式 `id:secret`）
2. 在 Gitea Actions 工作流中添加公告发布步骤：

```
      - name: Post release announcement to Ghost
        run: |
          curl -X POST http://ghost:8090/ghost/api/admin/posts/ \
            -H "Authorization: Ghost ${{ secrets.GHOST_ADMIN_API_KEY }}" \
            -H "Content-Type: application/json" \
            -d '{"posts":[{"title":"DeepChat 新版本发布","status":"published","html":"新版本已发布，请前往下载中心更新。"}]}'
```

<a id="interconnect"></a>

## 10. 互连配置验证（12 项）

1. ☑ NewAPI → LiteLLM：在 NewAPI 渠道测试中收到 OK
2. ☑ Dify → NewAPI：在 Dify 模型供应商测试中收到回复
3. ☑ DeepChat → NewAPI：在 DeepChat 中发送消息收到回复
4. ☑ Keycloak → NewAPI：用 Keycloak 账号登录 NewAPI 管理后台（OIDC 模式）
5. ☑ Keycloak → Dify：用 Keycloak 账号 SSO 登录 Dify
6. ☑ MCP Gateway → DeepChat：DeepChat 获取 MCP 工具列表并调用
7. ☑ MCP Gateway → Dify：Dify 工作流中调用 MCP Gateway 工具
8. ☑ Gitea Runner → Docker：Runner 可执行 CI/CD 任务
9. ☑ Gitea → 更新服务器：CI/CD 产物可上传到更新服务器
10. ☑ Ghost API → Gitea：Gitea Actions 可调用 Ghost API 发布公告
11. ☑ Ghost → Dify 跳转：门户 AI 工作台链接正确跳转 Dify
12. ☑ AI 管理中心 → Dashboard 显示全部容器状态 + 左侧菜单可访问所有产品

<a id="identity-sources"></a>

## N. Keycloak 企业身份源集成（AD / Entra ID / LDAP / SAML / OIDC）

**说明：**Keycloak 支持对接多种企业身份源，用户无需额外创建账号即可使用公司现有账号登录 Dify、Ghost 等所有已接入 Keycloak SSO 的应用。

### N.1 Active Directory (LDAP) — 本地域控对接

**适用场景：**公司有本地 Windows Active Directory 域控，希望员工用域账号登录所有 AI 平台应用。

**网络 + 部署部分**（Hyper-V 搭建、Internal Switch、端口转发、防火墙）详见独立文档。Keycloak LDAP 用户联合的配置步骤已整合到 [6.1.2 方式 B](#config-keycloak)。

[📄 Keycloak AD 集成完整指南 — windows-ad-integration.html](windows-ad-integration.html)（含一键检测修复脚本 `scripts\setup-hyperv-dc-network.ps1`）

### N.2 Microsoft Entra ID（原 Azure AD）— 云目录对接

**适用场景：**公司使用 Microsoft 365 / Azure，员工账号在 Entra ID 中管理。通过 OpenID Connect 协议对接。

#### 步骤 1：在 Entra ID 中注册应用

1. [Azure Portal](https://portal.azure.com) → **Microsoft Entra ID** → **App registrations** → **New registration**
2. Name：`AI-Platform-Keycloak`
3. Supported account types：**Accounts in this organizational directory only**
4. Redirect URI：**Web**，URL 填 `http://127.0.0.1:9090/realms/enterprise-ai/broker/entra-id/endpoint`
5. 点击 **Register**
6. 记下 **Application (client) ID** 和 **Directory (tenant) ID**
7. **Certificates & secrets** → New client secret → 记下 **Secret Value**

#### 步骤 2：在 Keycloak 中添加 Entra ID 身份提供者

1. Keycloak → enterprise-ai Realm → **Identity Providers** → **Add provider** → **OpenID Connect v1.0**
2. Alias：`entra-id`
3. Display Name：`Microsoft Entra ID`
4. 填写配置：

| 配置项 | 值 |
|---|---|
| Authorization URL | `https://login.microsoftonline.com/{tenant-id}/oauth2/v2.0/authorize` |
| Token URL | `https://login.microsoftonline.com/{tenant-id}/oauth2/v2.0/token` |
| Client ID | `{application-client-id}` |
| Client Secret | `{client-secret-value}` |
| Default Scopes | `openid profile email` |
| Client Authentication | **Client secret sent as post** |

4. 点击 **Save**

#### 步骤 3：配置属性映射（可选）

在 Identity Provider → **Mappers** 中可添加属性映射，例如：

```
Mapper Type: Attribute Importer
Claim: preferred_username  →  User Attribute: username
Claim: email               →  User Attribute: email
Claim: name                →  User Attribute: firstName
```

#### 验证

1. 打开 Dify 登录页面 → 应出现 **Microsoft Entra ID** 登录按钮
2. 点击后跳转到 Microsoft 登录页面 → 用公司 Entra ID 账号登录
3. 首次登录后，在 Keycloak **Users** 列表中能看到从 Entra ID 同步的用户

### N.3 Google Workspace (OpenID Connect)

**适用场景：**公司使用 Google Workspace，员工用 Google 账号登录。

1. [Google Cloud Console](https://console.cloud.google.com) → APIs & Services → Credentials → Create OAuth 2.0 Client ID
2. Authorized redirect URI：`http://127.0.0.1:9090/realms/enterprise-ai/broker/google/endpoint`
3. 记下 **Client ID** 和 **Client Secret**
4. Keycloak → Identity Providers → Add **Google**（内置）
5. 填入 Client ID 和 Client Secret → Save
6. 如需限制域名：进入 Identity Provider → **Mappers** → 添加 `Hardcoded Attribute` → 只在 `hd=你的域名.com` 时允许登录

### N.4 GitHub (OAuth2)

1. GitHub → Settings → Developer settings → OAuth Apps → New OAuth App
2. Authorization callback URL：`http://127.0.0.1:9090/realms/enterprise-ai/broker/github/endpoint`
3. 记下 Client ID 和 Client Secret
4. Keycloak → Identity Providers → Add **GitHub**（内置）
5. 填入 Client ID/Secret → Save
6. 可选：在 Mappers 中添加 `Attribute Importer` 将 GitHub 组织/团队映射为 Keycloak 角色

### N.5 通用 LDAP（OpenLDAP / FreeIPA / 389 DS）

1. Keycloak → User Federation → Add **ldap**
2. Vendor 选择 **Other**（非 Active Directory）
3. Connection URL：`ldap://openldap-server:389`
4. Users DN：`ou=users,dc=company,dc=com`
5. Username LDAP attribute：`uid`（OpenLDAP 用 uid，AD 用 sAMAccountName）
6. RDN LDAP attribute：`uid`
7. UUID LDAP attribute：`entryUUID`
8. User Object Classes：`inetOrgPerson, organizationalPerson`
9. Save → Synchronize all users

### N.6 通用 SAML 2.0（Okta / PingFederate / ADFS / Shibboleth）

**适用场景：**对接任意支持 SAML 2.0 的身份提供商（Okta、Ping、ADFS、Shibboleth 等）。

1. 在目标 IdP（如 Okta）中创建 SAML 应用：
    - ACS URL：`http://127.0.0.1:9090/realms/enterprise-ai/broker/saml/endpoint`
    - Entity ID：`http://127.0.0.1:9090/realms/enterprise-ai`
    - 导出 IdP 元数据 XML 文件
2. Keycloak → Identity Providers → Add **SAML v2.0**
3. Alias：`okta-saml`
4. 两种配置方式：
    - **方式 A：**粘贴 IdP 元数据 URL（推荐，自动填充所有字段）
    - **方式 B：**导入 IdP 元数据 XML 文件
5. Service Provider Entity ID：`http://127.0.0.1:9090/realms/enterprise-ai`
6. Save → 即可使用 SAML 登录

### N.7 多身份源共存策略

**最佳实践：**Keycloak 支持同时配置多个身份源（AD + Entra ID + Google + GitHub）。所有身份源共享同一个 Realm，用户在登录页面可选择使用哪个身份源登录。建议：

1. 在 **Authentication** → **Browser flow** 中添加 **Identity Provider Redirector**，根据用户邮箱域名自动选择 IdP
2. 例如：`@company.com` → AD；`@company.onmicrosoft.com` → Entra ID
3. 外部合作方用 GitHub / Google 账号 → 单独配置权限较低的 Keycloak 角色

### N.8 验证清单

1. ☑ LDAP 用户已同步到 Keycloak Users 列表
2. ☑ 用 AD 域账号成功登录 Dify
3. ☑ 用 Entra ID 账号成功登录 Dify
4. ☑ Dify / Ghost 登录页面显示多个 IdP 按钮（AD、Entra ID、Google 等）
5. ☑ 首次登录自动创建 Keycloak 用户，后续登录直接识别
6. ☑ IdP 用户的角色/权限正确映射
7. ☑ AD 组 → Keycloak 角色映射生效

<a id="admin-portal"></a>

## 11. AI 管理中心 — 统一管理员门户

**定位：**不是 Docker 管理平台（1Panel/Portainer 那种），而是一个面向管理员的统一后台——用 Keycloak 鉴权，左侧菜单链接全部产品，Dashboard 展示集群状态，统一管理所有平台的管理员账号。

### 11.1 为什么不自建不可

调研了 Organizr、Dashy、Homarr、Heimdall 等开源面板，它们都不满足以下核心需求：

| 需求 | Organizr | Dashy | AI Admin Center |
|---|---|---|---|
| Keycloak OIDC 登录 | 插件支持（非原生） | 支持 | ☑ 原生 |
| 侧边栏菜单 + iframe 嵌入 | ☑ | 部分 | ☑ |
| Docker 容器状态监控 | 不支持 | Widget | ☑ 实时 |
| 统一管理 Keycloak 管理员账号 | 不支持 | 不支持 | ☑ |
| Global Admin 初始配置 | 不支持 | 不支持 | ☑ |
| 所有产品统一入口 + 鉴权 | 部分 | 部分 | ☑ |

### 11.2 架构设计

```
用户浏览器 → AI 管理中心 (<服务器IP>:10086)
                  │
    ┌─────────────┼─────────────┐
    │  Keycloak    │  Admin API  │  Docker API
    │  OIDC 登录   │  (用户管理)  │  (容器状态)
    │             │             │
    ▼             ▼             ▼
 Keycloak     Keycloak      Docker
 (9090)       Admin REST    Socket
```

#### 左侧菜单结构

| 图标 | 菜单项 | 行为 | 目标 |
|---|---|---|---|
| 📊 | **总览仪表板** | 内嵌页面 | 8 个产品业务指标 + Docker 服务（按产品分组）+ 系统信息 |
| 📰 | Ghost 后台 | 内嵌统计页 | 文章/页面/订阅者/标签统计 + 「打开 Ghost 后台」按钮 → `:8090/ghost/` |
| 🤖 | Dify AI 平台 | 内嵌统计页 | 应用/工作空间/版本统计 + 「打开 Dify 平台」按钮 |
| 📦 | Gitea 源码管理 | 内嵌统计页 | 仓库列表（名称/描述/语言/大小/更新时间）+ deepchat-sync 同步脚本上次执行 + 「打开 Gitea」按钮 |
| 🔀 | NewAPI 管理 | 内嵌页面 | 渠道/用户/密钥（含已使用配额）+ 💰 成本报表（按用户/模型/日期）+ 📋 审计日志（最近调用记录），Admin API，仅管理员 |
| 🔐 | Keycloak 认证 | 内嵌统计页 | 用户/客户端/角色/身份源统计 + 「打开 Keycloak」按钮 |
| 🔌 | MCP Gateway | 内嵌管理页 | 端点信息 + 增删 MCP Server + 上传/删除 Skill（仅 ai-platform-admin） |
| 🛡️ | LiteLLM+PII | 内嵌页 | 复制 Master Key + 打开 LiteLLM 管理中心 |
| ⬇️ | 更新服务器 | 内嵌统计页 | DeepChat 版本 + 安装包清单（文件名/大小/更新时间） |
| 📈 | 监控告警 | 新标签页 | Grafana 大盘 → `:3030` |
| 🔍 | LLM 可观测 | 新标签页 | Langfuse 追踪 → `:3010` |
| 🔐 | **集中认证** | 内嵌页面 | 统一账号体系（仅 ai-platform-admin 可见） |
| 👥 | **管理员账号管理** | 内嵌页面 | Keycloak Admin API |
| ⚙️ | **系统设置** | 内嵌页面 | 基础配置 + 界面语言（9 种） |

### 11.3 初始化：Global Administrator

首次启动时，AI 管理中心通过环境变量配置 Global Admin：

```
# .env 中新增：
ADMIN_USERNAME=ai_all_in_one_admin
ADMIN_PASSWORD=见账号密码清单
ADMIN_EMAIL=ai_all_in_one_admin@<公司域名>
```

启动后自动在 Keycloak 中创建 `ai_all_in_one_admin` 用户（如有则跳过），并分配 `ai-platform-admin` Realm Role。所有接入 Keycloak SSO 的产品（Dify、NewAPI、Ghost）可通过此角色识别管理员。

**核心理念：**一个 Global Admin 账号管理所有平台。每个产品的管理员角色通过 Keycloak Realm Role `ai-platform-admin` 统一控制。

**统一管理员账号（全局约定）：**所有平台的应用管理员统一用用户名 `ai_all_in_one_admin`（Keycloak / NewAPI / AI 管理中心 / Ghost / Gitea / Dify），AD 域控的 LDAP 绑定服务账号也叫 `ai_all_in_one_admin`。**⚠️ 邮箱也必须与 AD 中定义的全局管理员邮箱**完全一致**，统一为 `ai_all_in_one_admin@<公司域名>`**——各产品本地管理员账号若邮箱与 Keycloak/AD 不一致，SSO 登录时按邮箱匹配不到，就会「串号」或生成重复账号。因此建号、配 `ADMIN_EMAIL`、初始化各产品时，务必都填同一个邮箱。**具体密码见独立的账号密码清单文档**（`credentials.html`，内部机密，不随本部署指南外传）。

### 11.4 Docker Compose 部署

**前置步骤：**先进入 `admin-portal/` 目录安装 Node.js 依赖，只需执行一次。

```
cd admin-portal
npm install
cd ..
```

然后在 `docker-compose.yml` 中新增：

```
  # ═══ AI 管理中心 ═══
  admin-portal:
    image: node:20-alpine
    container_name: admin-portal
    restart: always
    ports:
      - "10086:3000"
    working_dir: /app
    command: sh -c "node server.js"
    environment:
      - PORT=3000
      - KEYCLOAK_URL=http://192.168.31.117:9090
      - KEYCLOAK_REALM=enterprise-ai
      - KEYCLOAK_CLIENT_ID=AI-all-in-one-admin-portal
      - KEYCLOAK_CLIENT_SECRET=${KEYCLOAK_CLIENT_SECRET}
      - ADMIN_USERNAME=${ADMIN_USERNAME:-ai_all_in_one_admin}
      - ADMIN_PASSWORD=${ADMIN_PASSWORD}
      - ADMIN_EMAIL=${ADMIN_EMAIL:-ai_all_in_one_admin@<公司域名>}
      - SESSION_SECRET=${SESSION_SECRET:-random-secret-change-me}
      - LITELLM_MASTER_KEY=${LITELLM_MASTER_KEY}
      - LITELLM_URL=http://<服务器IP>:4001
    volumes:
      - ./admin-portal:/app
      - /var/run/docker.sock:/var/run/docker.sock
    networks:
      - ai-platform
```

### 11.5 管理中心的代码实现（要点）

源码在 `admin-portal/`（`server.js` + `public/index.html`），依赖 `express` / `keycloak-connect` / `dockerode` / `@keycloak/keycloak-admin-client`。功能远超最初的「容器状态看板」，完整能力如下：

- **总览仪表板**：8 个产品业务指标（NewAPI/Gitea/Ghost/Dify/Keycloak/MCP/LiteLLM/Update Server，各产品独立聚合端点、单个失败不影响整体）+ Docker 服务（按产品分组圈）+ 系统信息。
- **产品统计页**：Ghost/Dify/Gitea/Keycloak/更新服务器点击后先展示关键统计 + 「打开后台」按钮（见 11.2 菜单表）。数据来源：Gitea REST API（Basic Auth + X-Total-Count）、Keycloak Admin API、Dify console API（base64 密码 + cookie/CSRF）、Ghost 容器内 sqlite（docker exec）、Update Server 的 version.txt + stat。
- **MCP Gateway 管理**：增删 MCP Server、上传/删除 Skill（代理网关 `/api/*` 管理端点，注入 `X-Admin-Token`）。
- **🔍 Dify RAG 检索**：Dify 页内置「RAG 知识库检索」卡片——展示知识库列表（`/api/dify/overview` 返回 `dataset_list` + `rag_ready`）+ 输入查询词检索片段（后端 `POST /api/dify/retrieve`，调 Dify Knowledge API `hit-testing`，见 8.9）。
- **👥 管理员分模块授权**：全局管理员 `ai_all_in_one_admin` 在「管理员账号管理」里，从 Keycloak 关联的 IdP 中搜索添加其他管理员，按 15 个模块（`admin:<产品>` Realm Role）分模块授权；全局管理员（`ai-platform-admin`）看全部。添加/追加模块时会**真实开通到对应产品**（SSO 优先、API 兜底）：Gitea / NewAPI / Dify / Ghost / Grafana / LiteLLM / Keycloak / Langfuse 逐个 provision，失败不阻塞其它产品；撤销模块或删除管理员时从产品**删除该账号**（SSO 产品撤销授权、API 产品删账号）。无 SSO 产品建号时生成临时密码，列表 🔑 图标可回看（仅全局管理员）。非管理员登录直接弹「你不是管理员」并退出。
- **🔐 Keycloak 认证页管理**：用户列表支持 **LDAP 全量/增量同步**（AD 改了账号属性后一键拉取到 Keycloak）、**删除账号**（AD 联邦用户删除后下次同步/SSO 登录会重新出现，彻底移除需在 AD 禁用）、**角色管理**（列表带用户数 / 新建 / 删除 / 查看成员）。同步/删除/角色操作仅全局管理员可见。
- **集中认证 / SSO 机制**：统一账号、各平台登录方式说明（仅 ai-platform-admin 可见）。
- **系统设置**：环境变量说明 + 产品入口 URL + **界面语言（9 种：简中/繁中/英/法/西/葡/日/韩/阿，阿拉伯语支持 RTL 从右到左）**。
- **🧬 PII 脱敏**：展示 Presidio analyzer/anonymizer 健康状态 + LiteLLM guardrails（content-safety-filter / presidio-pii-mask）规则清单 + 已接入模型。
- **📜 统一日志**：按容器下拉 + 关键字 + 时间范围查 Loki 聚合日志（后端 `/api/logs/query`）。
- **💾 备份与恢复**：备份列表 + 「立即备份」+ 一键恢复（后端 `/api/backup/list|run|restore`，经 docker.sock + `C:\AIAllInOne\backups` 挂载实现，与 backup.ps1 同格式）。
- **📄 报告生成**：按条件（统计周期 1/7/30/90 天 + 勾选包含模块）生成系统详细报告，覆盖系统总览、产品健康状态、使用统计（调用/Token/成本，按用户·模型·天）、客户端统计（按 IP 地址 + 按 API Key 应用）、最近问题（Loki 错误日志汇总 + 可用性失败项 + 停止容器）、可用性测试、备份状态、PII 脱敏状态；报告语言与当前界面语言一致（zh/en，其他语言回退英文）；可导出 `.md` 文件（后端 `/api/report?days=⟨=&sections=`）。
- **监控告警 / LLM 可观测**：内嵌统计页（Prometheus targets/告警数、Langfuse 版本/trace 数）+ 打开大盘按钮。
- **🩺 可用性测试**：定时（默认每 10 分钟，`AVAILABILITY_INTERVAL_MIN` 可调）+ 手动「测试所有」+ 每项单独测试；覆盖 Keycloak 认证 / NewAPI / LiteLLM / DeepChat·Dify 聊天（经 NewAPI 发真实对话）/ Ghost / Gitea / MCP / Prometheus / Grafana / Langfuse / Loki / Presidio / SSO / 更新服务器 / 备份 / Docker / Redis；每项卡片下方小窗口输出结果与关键日志。后端 `/api/availability|run|test/:id`。Dashboard 产品指标区追加「可用性测试」汇总卡。
- **📰 Ghost 免登录**：点「Ghost 后台」的「打开」按钮时，后端 `/api/ghost/auto-login` 自动完成——密码登录（`POST /session/`）→ 读 Ghost 库的 `admin_session_secret` 本地算 6 位 TOTP 验证码（`HMAC-SHA1(secret+userId)`，与邮件里的码一致，免读 MailHog）→ `PUT /session/verify` 验证会话 → 把 `ghost-admin-api-session` cookie 写进浏览器 → 跳转 Ghost 后台，全程无感。详情见 13.10。

**⚠️ 部署/排错要点：**

- admin-portal 会话存 **Redis**（`admin-session-redis`，Keycloak 同款），重启容器不再清空登录会话；临时密码等敏感状态也存同一 Redis（`pcred:*` key）。
- 首页 `/` 必须走 Keycloak 保护：`express.static(..., { index:false })` 不放行 index.html + 显式 `app.get('/', keycloak.protect(), ...)`，否则未登录会直接渲染空看板、接口全 401（表现为「打开没有登录界面、各页大量失败」）。
- 统计 Dify 数据时邮箱必须用 Dify 实际管理员邮箱（`ai_all_in_one_admin@<公司域名>`，与 AD 全局管理员一致），不要用旧的 `@company.com` 域名邮箱。

### 11.6 Keycloak 客户端配置

在 Keycloak 中为 AI 管理中心创建 OIDC Client：

1. Keycloak → enterprise-ai Realm → **Clients** → Create
2. Client ID：`AI-all-in-one-admin-portal`，类型：**OpenID Connect** → Next
3. **Client authentication：On**（⚠️ 必开，否则没有 Credentials 标签）
4. **Standard flow：On**（⚠️ 必开，否则登录无法回调）
5. Valid Redirect URIs：`http://127.0.0.1:10086/*` 和 `http://<服务器IP>:10086/*`，Web origins：`http://127.0.0.1:10086` 和 `http://<服务器IP>:10086` → Save
6. 保存后出现 **Credentials** 标签 → 复制 **Client Secret**
7. 将 Secret 填入 `.env` 的 `KEYCLOAK_CLIENT_SECRET`，重启 admin-portal：`docker compose up -d admin-portal`
8. 创建 Realm Role：**ai-platform-admin**
9. 将 `ai_all_in_one_admin` 用户分配此角色
10. 对于其他平台（Dify、Ghost、NewAPI），也创建相同的 `ai-platform-admin` 角色，实现跨平台统一管理员

### 11.7 验证

1. 浏览器打开 **http://<服务器IP>:10086** → 自动跳转 Keycloak 登录（未登录不会显示空看板，而是 302 到登录页）
2. 用 Global Admin 账号 `ai_all_in_one_admin` 登录 → 进入总览仪表板
3. Dashboard 顶部「产品业务指标」显示 8 个产品真实统计；下方「Docker 服务」按产品分组展示所有容器
4. 点击左侧菜单 Ghost/Dify/Gitea/Keycloak → 先显示各自统计卡片，点「打开后台」按钮才跳转对应后台
5. NewAPI 管理 → 显示渠道/用户/密钥（密钥含「已使用配额」）；MCP Gateway → 可增删 MCP Server、上传/删除 Skill
6. 管理员管理 → 显示拥有 ai-platform-admin 角色的用户列表
7. 系统设置 → 可切换界面语言（简中/繁中/英/法/西/葡/日/韩/阿）
8. 未登录用户访问 http://<服务器IP>:10086 → 被重定向到 Keycloak 登录页

**对比旧方案：**之前在架构图中用了 1Panel/Portainer 作为"统一管理平台"。但它们只是 Docker 容器管理工具，不能做应用层的统一鉴权和管理。AI 管理中心填补了这个空缺：对外提供统一入口，对内通过 Keycloak 控制所有产品的管理员权限。

### 11.8 管理员分模块授权 + Keycloak 认证页管理（v0.91 新增）

进入「管理员账号管理」页（左侧菜单），全局管理员可完成以下操作：

- **添加管理员**：从 Keycloak 关联的 IdP 搜索已有账号（AD/LDAP 用户，无需新建、无需密码）→ 勾选要授权的模块 → 确定。系统会：①给该账号加 `admin:<产品>` Realm Role（控制其在 AI 管理中心能看到/操作哪些模块）；②真实开通到产品侧（见下表）。
- **编辑权限**：追加 / 撤销单个模块。
- **删除管理员**：二次确认后，撤销所有模块角色，并从各产品删除该账号。

| 产品 | 授权方式 | 撤销（删除管理员时） |
|---|---|---|
| Gitea | Keycloak SSO（`ENABLE_AUTO_REGISTRATION=true`，SSO 首登自动建号并设为管理员） | 删 Gitea 账号 |
| NewAPI | Keycloak SSO 自动建号 + DB 提权 `role=10` | 删 NewAPI 账号 |
| Dify | Console API 邀请为 admin（无 SSO） | 删 Dify 成员 |
| Ghost | Admin API 邀请 staff（Administrator，无 SSO） | 删 Ghost staff / 撤销邀请 |
| Grafana（监控） | 建全局号 + org 设 Admin（SSO） | 删 Grafana 账号 |
| LiteLLM | master key 建号 `proxy_admin`（SSO） | 删 LiteLLM 账号 |
| Keycloak | 授 `realm-management` 的 `realm-admin` 复合角色 | 撤销该角色（Keycloak 是身份源，不删账号） |
| Langfuse（可观测） | 直接写 Postgres（`organization_memberships`=ADMIN；未登录过则插邀请） | 删 membership / 邀请 |

**🔐 Keycloak 认证页（左侧菜单 → Keycloak）：**用户列表上方有「全部同步 / 增量同步」按钮（AD 里改了账号属性后一键拉取到 Keycloak）；每行用户有「编辑」（跳 Keycloak 管理中心）和「删除」；角色区块可新建 / 删除角色、查看角色成员。同步 / 删除 / 角色操作仅全局管理员可见。**注意**：Keycloak 无「单用户同步」端点，增量同步会同步 AD 里所有有变更的账号；AD 联邦用户从 Keycloak 删除后，下次全量同步或该用户再次 SSO 登录会重新出现，彻底移除请在 AD 里禁用 / 删除该账号。

<a id="ops"></a>

## 12. 运维 — 健康检查与开机自检

**脚本位置：**`C:\AIAllInOne\windows\scripts\health-check.ps1`  
**结果输出：**`C:\AIAllInOne\windows\scripts\health_check_<年月日_时分秒>.log`（每次运行生成独立报告，不覆盖历史）  
**覆盖范围：**41 个容器（25 Windows 核心 + 16 Dify），分 9 个阶段检查（含 LLM 全链路、AD 账号认证 + 管理员登录、MCP/Skill 功能验证、磁盘空间）。凭据从同目录 `.env` 读取，脚本不硬编码密码。

### 12.1 检查范围

| 阶段 | 检查项 | 方式 |
|---|---|---|
| Stage 1 | Docker Daemon 是否运行（等待就绪，适配开机自检） | `docker info` |
| Stage 2 | 41 个容器状态（Up/Exited/Restarting） | `docker ps -a` |
| Stage 3 | 10 个 HTTP 端点响应（含 MCP Gateway） | `curl.exe 127.0.0.1:端口` |
| Stage 4 | LiteLLM /readiness + **模型注册**、litellm-redis PING、Dify API /health、MySQL/PostgreSQL/Redis/Sandbox 健康状态 | `docker exec` + `docker inspect` |
| Stage 5 | **LLM 全链路**：NewAPI 渠道状态 + 以 DeepChat 和 Dify 名义各发一个真实请求（NewAPI → LiteLLM → DeepSeek） | `curl /v1/chat/completions` |
| Stage 6 | **AD 账号认证链路**：Keycloak well-known + AD 用户同步（aitest1）+ NewAPI OIDC 配置 + OIDC clients 完整性 + **NewAPI 管理员登录** | curl + Admin API + mysql |
| Stage 7 | **MCP Gateway + Skill**：/health + tools/list + tools/call + 外部 Skill 聚合 | curl MCP 协议 |
| Stage 8 | **DeepChat / Dify 登录前置条件**：NewAPI 服务可用 + Dify 已初始化 | curl + psql |
| Stage 9 | **磁盘空间**：系统盘剩余 + Docker 磁盘占用 | `Get-PSDrive` + `docker system df` |

### 12.2 手动执行

1 打开 PowerShell 终端

```
# 直接运行
C:\AIAllInOne\windows\scripts\health-check.ps1

# 查看结果文件（文件名带时间戳，如 health_check_2026_08_13_10_05_31.log）
dir C:\AIAllInOne\windows\scripts\health_check_*.log
notepad C:\AIAllInOne\windows\scripts\health_check_<最新时间戳>.log
```

**✅ 验证：**输出末尾显示 `ALL CLEAR` 且 `Fail: 0` 表示全部正常。

### 12.3 开机自动运行（计划任务）

1 以管理员身份打开 PowerShell，执行：

```
# 创建开机自启计划任务
$action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-NoProfile -ExecutionPolicy Bypass -File C:\AIAllInOne\windows\scripts\health-check.ps1"
$trigger = New-ScheduledTaskTrigger -AtLogOn
$trigger.Delay = "PT2M"   # 登录后延迟 2 分钟，等 Docker Desktop + 容器启动
Register-ScheduledTask -TaskName "AI-Platform-HealthCheck" -Action $action -Trigger $trigger -RunLevel Highest

# 验证已创建
Get-ScheduledTask -TaskName "AI-Platform-HealthCheck"

# 手动触发一次测试
Start-ScheduledTask -TaskName "AI-Platform-HealthCheck"
```

**📌 注意事项：**

- 脚本使用 `127.0.0.1` 而非 `localhost`，避免 Docker Desktop WSL2 IPv6 兼容性问题
- 凭据从同目录 `.env` 读取（Keycloak 管理员、NewAPI DB/管理员密码），脚本本身不硬编码密码
- LiteLLM 内部健康检查使用 `/health/readiness`（无需认证）而非 `/health`（需要 Bearer token）
- `docker-init_permissions-1` 容器 Exited (0) 是正常的一次性初始化任务
- Update Server 返回 HTTP 403 也是正常的（无默认 index.html，但服务在运行）
- 脚本 exit code：0 = 全部通过，1 = 有失败项

### 12.4 常见问题排查

```
# 如果某个容器持续 Restarting
docker logs <容器名> --tail 30

# 如果 HTTP 端点无响应
docker ps --filter "name=<容器名>" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# 重建单个服务
docker compose up -d <服务名>

# 重新运行健康检查
C:\AIAllInOne\windows\scripts\health-check.ps1
```

<a id="security"></a>

## 13. 安全合规与可观测

本章覆盖企业 AI 落地的**安全合规、数据治理、可运维**三大块，是「能用」到「企业级落地」的关键增量。

### 13.1 PII 脱敏与内容安全（LiteLLM Guardrails）

所有发给外部大模型的请求都经过 LiteLLM 的 guardrails 预处理，敏感信息**在出内网前就已被脱敏**。

1 **内置内容过滤器（默认启用，无需外部服务）**

使用 `litellm_content_filter`，正则脱敏以下类型（action = MASK，命中即替换为 `[xxx_REDACTED]`）：

| 规则 | 正则 | 类型 |
|---|---|---|
| 中国手机号 | `\b1[3-9]\d{9}\b` | cn_mobile |
| 身份证号 | `\b\d{17}[\dXx]\b` | cn_id |
| 银行卡号 | `\b\d{16,19}\b` | bank_card |
| 邮箱 | prebuilt `email` | email |
| 统一社会信用代码 | `\b[0-9A-HJ-NPQRTUWXY]{18}\b` | cn_credit_code |
| 护照号 | `\b[EG]\d{8}\b` | cn_passport |
| IPv4 地址 | `\b\d{1,3}(\.\d{1,3}){3}\b` | ip_address |

另有敏感词黑名单（命中即 **BLOCK** 拒绝请求）：`内部机密`、`商业机密` 等，按公司实际敏感词在 `litellm-config.yaml` 的 `blocked_words` 增删。

⚠️ **关键坑**：guardrails 注册后默认**不全局生效**，必须加 `default_on: true`，否则只有请求体显式传 `guardrails` 字段才触发。

2 **Presidio 高级实体识别（已启用）**

Microsoft Presidio（`presidio-analyzer` / `presidio-anonymizer`）识别英文人名、邮箱等更细粒度实体，与上方内置正则互补。端点由环境变量 `PRESIDIO_ANALYZER_API_BASE` / `PRESIDIO_ANONYMIZER_API_BASE` 指定。

⚠️ **关键坑（端点格式）**：LiteLLM 会自动在 base URL 后面拼 `/analyze`、`/anonymize`，所以环境变量**必须填 base URL**（如 `http://presidio-analyzer:3000`），**不能**带 `/analyze` 路径，否则会变成 `/analyze/analyze` 返回 404。此外 analyzer 的 `/analyze` 必须带 `language` 字段（LiteLLM 会自动带）。

⚠️ **镜像拉取慢**：presidio-analyzer 约 965MB，国内 MCR 直连很慢（实测约 1 小时）。如拉不动，可先用内置正则（已覆盖中文核心 PII），Presidio 作为可选增强。

验证：发含手机号/邮箱的请求 → 模型回复中原始值被替换为 `[REDACTED]`；发含「内部机密」的请求 → 直接返回 `Content blocked`。

### 13.2 数据备份与恢复

备份脚本 `scripts\backup.ps1` 每日备份所有关键数据，输出到 `C:\AIAllInOne\backups\`，自动保留最近 7 天。

| 备份项 | 内容 | 方式 |
|---|---|---|
| NewAPI | MySQL（new-api 库：用户/渠道/密钥/日志） | `mysqldump` |
| Dify | PostgreSQL（dify 库：应用/知识库/工作流） | `pg_dump` |
| Ghost | SQLite（ghost.db：文章/页面/设置） | 文件复制 |
| Gitea | SQLite（gitea.db：仓库元数据） | 文件复制 |
| 配置 | .env / docker-compose.yml / litellm-config.yaml 等 | 文件复制 |

1 **手动执行一次**

```
powershell -NoProfile -ExecutionPolicy Bypass -File C:\AIAllInOne\windows\scripts\backup.ps1
```

2 **定时执行（Windows 任务计划）**

已注册计划任务 `AI-Platform-Backup`（每天 02:00，当前用户）。如未自动注册，可手动在「任务计划程序」创建：操作 → 新建 → 程序 `powershell.exe`，参数 `-NoProfile -ExecutionPolicy Bypass -File C:\AIAllInOne\windows\scripts\backup.ps1`，触发器每天 02:00。

⚠️ 备份文件默认在 C 盘，建议定期把 `C:\AIAllInOne\backups\` 同步到另一块盘或对象存储，实现异地容灾。

3 **恢复（`scripts\restore.ps1`）**

从某次备份目录恢复全部数据（MySQL / PostgreSQL / SQLite / 配置）：

```
powershell -NoProfile -ExecutionPolicy Bypass -File C:\AIAllInOne\windows\scripts\restore.ps1 -BackupDir C:\AIAllInOne\backups\backup_20260814_020001
```

脚本会要求输入 `yes` 确认后执行（加 `-Force` 跳过确认，仅脚本/CI 用）。

4 **AI 管理中心「💾 备份与恢复」页**

登录 AI 管理中心即可看到备份列表、点击「立即备份」、点某次备份的「恢复」按钮一键恢复（后端经 `docker.sock` + 挂载的 `C:\AIAllInOne\backups` 实现，与 backup.ps1 产出同格式备份）。需要 `ai-platform-admin` 角色。

⚠️ **关键坑**：旧版 backup.ps1 用 `Copy-Item` 批量复制配置文件时，点号文件 `.env` 会导致整批静默失败（`-ErrorAction SilentlyContinue` 吞错），实测备份里 `config/` 只有 `dify.env` + `mcp-servers.json`。已改为逐文件 `-LiteralPath` 复制 + 校验。另：AI 管理中心备份用 `base64` 中转 + `tar-fs`/`putArchive` 保证二进制安全（`docker exec` 的 stdout 走 utf8 会损坏 SQLite .db）。

### 13.3 监控告警（Prometheus + Grafana + cadvisor）

三个容器提供容器级资源监控与告警：

| 组件 | 端口 | 用途 |
|---|---|---|
| cadvisor | 8080（内部） | 采集每个容器的 CPU/内存/网络/磁盘指标 |
| Prometheus | 9091 | 汇聚指标 + 告警规则（`monitoring/alerts.yml`） |
| Grafana | 3030 | 可视化大盘（已预置「AI All In One — 容器监控」面板） |

登录 Grafana：`http://<服务器IP>:3030`，账号 `ai_all_in_one_admin` / 统一密码。已预置的告警规则：容器宕机（critical）、容器内存 >90%（warning）、容器 CPU >80%（warning）。

⚠️ **端口冲突**：Prometheus 默认 9090 被 Keycloak 占用，故改为 **9091**；Grafana 默认 3000 与 NewAPI 冲突、3001 也被占用，故改为 **3030**。

⚠️ **告警误报坑**：cadvisor 会上报宿主机**所有 cgroup**（systemd 服务如 snap、docker 等），这些 cgroup 没有 `name` 标签。若告警规则不写 `{name!=""}`，会对 systemd 服务误报；内存告警还要加 `container_spec_memory_limit_bytes > 0`（否则 limit=0 的容器除零产生 `+Inf` 恒触发）。`alerts.yml` 已修复这些过滤。

**🔔 告警通知（企业 IM）：**告警链路为 **Prometheus → Alertmanager → AI 管理中心（`/api/alert-webhook`）→（可选）企业 IM**。默认告警只在 AI 管理中心「监控告警」页展示；要推送到企业 IM，在 AI 管理中心的 **「系统运维 → 企业 IM 告警」** 菜单里配置（配置存 Redis，重启不丢），支持：

- **多接收人**：群机器人（钉钉/企微/飞书，填 webhook 地址）或企业应用（钉钉/企微，发到个人）；
- **发送规则**：总开关、最低告警级别（严重/警告/信息）、是否发送「触发 firing」/「恢复 resolved」通知；
- **发送历史**：记录每次发送的时间/接收人/类型/告警名/级别/结果，支持翻页、调整页大小、关键字检索、按类型/结果/级别分类筛选。

群机器人 webhook 只能发到**群聊**；要发到**个人**，需选「钉钉企业应用（发个人）」（填 AppKey/AppSecret/AgentId/userid）或「企微企业应用（发个人）」（填 corpId/secret/agentid/userid）。也可继续用 `.env` 的 `ALERT_IM_WEBHOOK_URL` 作为默认接收人（向后兼容）。

### 13.4 LLM 可观测（Langfuse）

Langfuse v4 自托管，追踪每一次模型调用的**提示词、响应、模型、延迟、token、成本**，出问题可回溯定位。

| 组件 | 用途 |
|---|---|
| langfuse | Web UI + 追踪展示（端口 3010） |
| langfuse-worker | 异步事件处理 |
| langfuse-postgres | 元数据存储 |
| langfuse-clickhouse | 事件/追踪数据存储 |
| langfuse-minio | S3 附件/媒体存储 |
| langfuse-redis | 队列 |

LiteLLM 通过 `success_callback: ["langfuse"]` 自动上报（`.env` 里的 `LANGFUSE_PUBLIC_KEY` / `LANGFUSE_SECRET_KEY` / `LANGFUSE_HOST`）。

登录 Langfuse：`http://<服务器IP>:3010`，账号 `ai_all_in_one_admin@<公司域名>` / 统一密码。首次启动已通过 headless 初始化自动创建组织 `AI All In One` 和项目 `AI Platform`。

⚠️ **关键坑**：Langfuse v4 默认 `LANGFUSE_MIGRATION_V4_WRITE_MODE=events_only`，旧客户端（LiteLLM 的 langfuse SDK）会上报 `trace-create` 失败。必须设 `LANGFUSE_MIGRATION_V4_WRITE_MODE=dual`（web 和 worker 都要设），否则看不到任何追踪数据。

⚠️ **SSO 登录看不到数据的坑**：headless 初始化的组织 `AI All In One` 只绑定了初始化账号（早期误用的 `ai_all_in_one_admin@company.com`）。若用 Keycloak SSO 登录（AD 邮箱为 `ai_all_in_one_admin@<公司域名>`），Langfuse 会**自动新建一个独立账号且不属于任何组织**，导致进去后看不到任何 trace 数据。修复：把 SSO 用户加进组织——（现已统一邮箱为 `ai_all_in_one_admin@<公司域名>`，此坑不再发生）

```
docker exec langfuse-postgres psql -U langfuse -d langfuse -c \
"INSERT INTO organization_memberships (id, org_id, user_id, role) \
SELECT gen_random_uuid()::text, 'ai-all-in-one', id, 'ADMIN' FROM users WHERE email='ai_all_in_one_admin@<公司域名>' \
ON CONFLICT (org_id, user_id) DO UPDATE SET role='ADMIN';"
```

### 13.5 审计日志与成本报表（AI 管理中心内嵌）

在 AI 管理中心 → 「🔀 NewAPI 管理」页，新增了两块：

- **💰 成本报表**：最近 N 天总成本/总调用/总 Token，按用户、按模型、按日期三个维度聚合（数据来自 NewAPI logs 表，1 美元 = 500000 额度）。
- **📋 审计日志**：最近 100 条模型调用记录（用户、模型、Token、额度、成本、IP、时间），用于合规审计与追溯。

⚠️ **关键坑**：直接用 `mysql -p"密码"` 会向 stderr 输出 `Using a password on the command line` 警告，被后端误判为错误返回 500。已改用 `MYSQL_PWD` 环境变量 + `2>/dev/null` 抑制。

### 13.6 组织架构与配额映射

按部门/角色管控模型权限与额度的机制：

1. **NewAPI 分组**：后台「分组管理」按部门创建分组，设置模型倍率/配额；用户归入对应分组即按部门管控。AI 管理中心 NewAPI 页的用户表已展示 `group` 字段。
2. **Keycloak 角色**：用 realm role（如 `ai-platform-admin`）控制管理权限；可扩展部门角色（`ai-dept-研发` 等）映射到 NewAPI 分组。
3. **映射链路**：AD 组 → Keycloak 角色 → NewAPI 分组 → 模型权限/配额。

具体按部门配额调整在 NewAPI 后台完成（AI 管理中心「打开 NewAPI 后台 ↗」）。

### 13.7 员工培训与制度

培训手册已拆分为两本**多页电子书**，并翻译成 **9 种语言**（与 AI 管理中心一致）：**管理员手册**（30 章：部署篇 + 13 个产品的日常操作 + 运维篇）、**普通用户手册**（8 章：平台简介、AI All In One Hub（门户）使用、DeepChat/Dify 上手步骤、**数据分级规范**、API Key 申请、常见问题、行为准则）。语言分布：英文版在 `docs/admin-manual/` 与 `docs/user-manual/`；简体中文在 `docs/i18n/admin-manual-zh-cn/` 与 `docs/i18n/user-manual-zh-cn/`；其余 7 种（繁体中文 / 法 / 西 / 葡 / 日 / 韩 / 阿）在 `docs/i18n/` 对应目录。每本都是「封面 + 目录 + 每章一页 + 翻页导航」的电子书，可直接发员工，或后续搬到 Ghost 门户。

**数据分级建议**：公开信息可直接用外部模型；内部信息（项目文档）可用但需脱敏；机密信息（客户数据/源代码/身份证号）禁止上传外部模型，应走本地模型或人工处理。

### 13.8 统一 SSO 登录（Keycloak）

所有带 Web UI 的产品都通过 Keycloak 实现单点登录，统一使用管理员账号 `ai_all_in_one_admin`。

| 产品 | 接入方式 | Keycloak Client | 登录方式 |
|---|---|---|---|
| AI 管理中心 | keycloak-connect (OIDC) | AI-all-in-one-admin-portal | 强制 SSO（未登录自动跳 Keycloak） |
| NewAPI | OIDC | newapi | 登录页点「OIDC 登录」 |
| Ghost | —（本地账号） | — | 统一账号 `ai_all_in_one_admin@<公司域名>` |
| Dify | OIDC（可选） | — | 统一账号 `ai_all_in_one_admin@<公司域名>` |
| Gitea | —（本地账号） | — | 统一账号 `ai_all_in_one_admin` |
| Grafana | OAuth2 generic OIDC | grafana | 自动登录（`GF_AUTH_OAUTH_AUTO_LOGIN=true`，点链接直进，无需点按钮） |
| Langfuse | Keycloak provider | langfuse | 自动登录（AI 管理中心入口指向 `/auth/sso-initiate?provider=KEYCLOAK`，IdP 发起式 SSO） |

1 **Grafana SSO**

通过 `GF_AUTH_GENERIC_OAUTH_*` 环境变量接入（client id `grafana`，redirect URI `http://<服务器IP>:3030/login/generic_oauth`）。

2 **Langfuse SSO**

通过 `AUTH_KEYCLOAK_*` 环境变量接入（client id `langfuse`，redirect URI `http://<服务器IP>:3010/api/auth/callback/keycloak`）。

⚠️ **关键坑**：Keycloak 里的 `ai_all_in_one_admin` 通过 LDAP 联合到 AD 域控，密码验证走 AD。如果 AD 域控（Hyper-V DC VM）未开机，SSO 登录时密码验证会报 `unknown_error`（LDAP Connection refused）。需确保 DC VM 开机并可达（见第 2 章 Hyper-V 网络配置）。

3 **去掉「点按钮」步骤（自动登录）**

目标：在 AI 管理中心已登录的前提下，点 Grafana / Langfuse 入口**直接进管理界面**，不经过各产品登录页点「Sign in with Keycloak」。

- **Grafana**：设 `GF_AUTH_OAUTH_AUTO_LOGIN=true`（`docker-compose.yml` 已设）。未登录访问任意页面 → 自动 302 `/login` → 307 `/login/generic_oauth` → Keycloak（已登录则直接回调进入）。
- **Langfuse**：Auth.js 无原生 auto-login，改用**IdP 发起式 SSO**——把 AI 管理中心「LLM 可观测」的打开按钮指向 `http://<服务器IP>:3010/auth/sso-initiate?provider=KEYCLOAK`，浏览器打开即自动发起 Keycloak 认证。

⚠️ **关键坑**：Langfuse 的 `/auth/sso-initiate` 返回的是 Next.js 应用壳（HTTP 200），重定向在浏览器端完成，curl 看不到 302。属正常，浏览器打开即可。若仍想完全服务端跳转，可保留登录页（至少已去掉重复输密码）。

### 13.9 统一日志（Loki + Promtail）

新增 Loki（聚合）+ Promtail（采集）两个容器，把**所有容器的应用日志**汇聚到一处，AI 管理中心「📜 统一日志」页可按容器筛选 + 关键字搜索。

| 组件 | 端口 | 用途 |
|---|---|---|
| Loki | 3110 | 日志存储与查询（单机、本地文件系统） |
| Promtail | —（内部） | 经 docker.sock 发现容器并采集 `/var/lib/docker/containers/*/*-json.log` 推给 Loki |

配置：`monitoring/loki.yml`（Loki 存储/表结构）、`monitoring/promtail.yml`（docker_sd 发现 + `container`/`service`/`project` 标签）。AI 管理中心后端 `/api/logs/query` 用 LogQL 查 Loki，前端提供容器下拉 + 关键字 + 时间范围。

⚠️ **关键坑（Docker Desktop 挂载）**：Promtail 需挂载 `/var/run/docker.sock` 和 `/var/lib/docker/containers`。在 Docker Desktop（WSL2）下这两个路径指向 Docker Desktop 虚拟机内部，正好是容器日志所在，可直接读取（与 cadvisor 同理）；但**别**用宿主机 Windows 的 `C:\...\containers` 路径映射。Loki 单机用 `store: tsdb` + `filesystem` 对象存储，2.9.x 版本稳定。

### 13.10 MailHog 邮件接收器 + Ghost 免登录

Ghost 5 后台是**免密登录**（前端没有密码框）：输入邮箱后 Ghost 会发一封带 6 位验证码的邮件。内网没有 SMTP 时这个邮件发不出去，登录就报 `Failed to send email`。解决方案是加一个本地邮件接收器 **MailHog** 当「邮件出口」，并让 AI 管理中心自动完成登录。

**管理员创建（自动化）：**免登录的前提是 Ghost 已有管理员。跑 `scripts\ghost-setup.ps1` 即可用 setup API（`POST /ghost/api/admin/authentication/setup`）一次性创建管理员（邮箱 `GHOST_ADMIN_EMAIL`、密码 `ADMIN_PASSWORD`，从 `.env` 读），等效于浏览器向导，已初始化时自动跳过。

| 组件 | 端口 | 用途 |
|---|---|---|
| MailHog | 8025（Web UI，SMTP 1025 仅内部） | 接收 Ghost 发出的验证码/通知邮件，可在浏览器里查看 |

Ghost 侧环境变量（`docker-compose.yml`）：

```
# Ghost 邮件 → 本地 MailHog（SMTP 1025，无需认证）
mail__transport: SMTP
mail__from: noreply@company.com
mail__options__host: mailhog
mail__options__port: 1025
```

**Ghost 免登录（AI 管理中心自动登录，免看 MailHog）：**Ghost 的 6 位验证码本质是 **TOTP**——`TOTP(admin_session_secret + userId)`，6 位 / 60 秒 / HMAC-SHA1。所以 AI 管理中心可以直接本地算出验证码，不用去 MailHog 里翻邮件。点「Ghost 后台」的「打开」按钮时，后端 `POST /api/ghost/auto-login` 依次做：

1. 密码登录 `POST /ghost/api/admin/session/`（邮箱 + 密码）→ 拿到未验证的会话 cookie（此时会触发发码邮件，被 MailHog 吞掉，我们忽略它）；
2. 读 Ghost 库 `settings` 表的 `admin_session_secret` + 管理员 `userId`，本地算 TOTP 验证码；
3. `PUT /ghost/api/admin/session/verify`（带 cookie + 算出的码）→ 会话验证通过；
4. 把 `ghost-admin-api-session` cookie 写进浏览器（`Path=/ghost`，同 host 不同端口 cookie 按域名共享），跳转 `:8090/ghost/` 直接进后台。

⚠️ **关键坑**：① Ghost 5 后端**仍支持密码登录**（`POST /session/`），但密码对后会触发「新设备 2FA」（返回 403 `Needs2FAError` + 发码），所以必须补验证码这步；② 验证码就是 TOTP，可用 `crypto.createHmac('sha1', secret+userId)` 精确复现，实测与邮件里的码逐位一致；③ 就算自己算码，Ghost 仍会真的「发邮件」，因此 MailHog（或任意 SMTP）必须保留，否则登录报 `Failed to send email`；④ `/session/verify` 有 brute 限流，正常单次点击不会触发，但别短时间反复刷。
