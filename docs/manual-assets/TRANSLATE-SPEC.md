# AI AllInOne 手册电子书 · 翻译规范

你是翻译执行者。目标：把指定目录下的**中文**电子书翻译成目标语言，**就地覆盖**文件内容（保留文件路径与文件名不变）。

## 一、需要翻译的内容（全部中文可见文字）
- `<title>` 标签文字、`<h1>/<h2>/<h3>/<h4>` 标题、`<p>` 段落、`<li>` 列表项、表格 `<th>/<td>` 单元格文字；
- `.chapter-head` 里的 `.part-label`（如「第一部分 · 部署篇」）和 `.sub` 副标题；
- 提示框 `.note/.warn/.tip/.example/.danger` 里的文字、`.docbox` 里的「📖 原厂文档」标签、`.muted` 说明文字；
- 封面 `index.html` 里的标题、副标题、封面元信息、目录章节名、「▶ 开始阅读」等；
- `nav.js` 里的 `title`、`subtitle`、`parts[].label`、`items[].title`（**`id`、`file`、`n`、`home`、`icon` 字段保持原样**，文件名必须用英文/ASCII）；
- 图片 `alt` 文字、SVG 里的 `<text>` 中文文字。

## 二、严禁改动（原样保留）
- 所有 HTML 标签、属性、`class`、锚点 `id`；
- 所有 `<code>` 与 `<pre>` 内的**命令、配置、代码、JSON、SQL、URL**（如 `docker compose up -d`、`http://litellm:4000`、`sAMAccountName` 等）；
- 所有 URL（含 `.docbox` 里的「原厂文档」地址，如 `https://docs.dify.ai`）；
- 产品/技术专有名词：Keycloak、NewAPI、LiteLLM、Dify、Ghost、Gitea、DeepChat、MCP、Prometheus、Grafana、Alertmanager、Langfuse、Loki、Presidio、MailHog、Docker、GitHub、Gitee、MySQL、Redis、PostgreSQL、SQLite、OIDC、SSO、LDAP、AD、WebSocket、TOTP、HTTP、API、JVM、WSL2 等；
- 图片路径 `src="../../images/xxx"`（或 `../images/xxx`）、样式/脚本路径 `../../manual-assets/`（或 `../manual-assets/`）、`src="nav.js"`；
- 代码里的中文注释（`#`、`//`、`<!-- -->` 后的中文）**要翻译**，但命令本身不动。

## 三、占位符（尖括号内中文 → 翻译，保留尖括号）
| 中文占位符 | 英文 |
|---|---|
| `<服务器IP>` | `<server-IP>` |
| `<公司域名>` | `<company-domain>` |
| `<市场主机名>` | `<market-hostname>` |
| `<新密码>` | `<new-password>` |
| `<日期>` | `<date>` |

非中文占位符（`<LITELLM_MASTER_KEY>` 等）保持原样。其他语言按同样思路翻译尖括号内的词。

## 四、HTML 根标签
把 `<html lang="zh-CN">` 改成目标语言：`en`→`lang="en"`、`zh-TW`→`lang="zh-TW"`、`fr`→`lang="fr"`、`es`→`lang="es"`、`pt`→`lang="pt"`、`ja`→`lang="ja"`、`ko`→`lang="ko"`、`ar`→`lang="ar"`。

## 五、质量要求
- 翻译自然、专业、符合目标语言习惯；专有名词和英文技术词保留英文；
- 保持原有段落/列表/表格结构，不增删内容；
- 阿拉伯语注意 RTL 语境，但 HTML 结构不变（CSS 会处理方向）；
- 繁体中文（zh-TW）只做简→繁转换 + 用词本地化，专有名词不变。

## 六、完成后自检
翻译完成后，对每个文件确认：① 无残留简体中文字符（zh-TW 无简体、其余语言无任何中文）；② HTML 标签闭合完整；③ `src="nav.js"`、`../../manual-assets/`、`../../images/` 等路径未被改动。
