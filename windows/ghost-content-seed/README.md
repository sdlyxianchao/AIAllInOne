# Ghost 示例内容种子（Content Seed）

这是 AI All In One Hub 门户的示例内容快照，供新部署时一键导入，让你的门户开箱就有「平台上线公告、DSH Desktop/Dify 使用指南、下载中心」等示例内容。

## 内容

`content.json` 包含：

| 部分 | 说明 |
|------|------|
| `site` | 站点标题 `AI All In One Hub` + 描述 |
| `navigation` | 主导航（Home / DSH Desktop / Dify） |
| `posts` | 5 条内容：1 个 DSH Desktop 下载页 + 4 篇示例文章（上线公告、DSH Desktop 使用指南、Dify 使用指南、v0.5.0 发布公告） |

## 占位符

内容里所有内网 IP 已替换成占位符 `<服务器IP>`，导入时由脚本替换成实际部署 IP。

## 导入方式

由部署 Agent 自动完成（见 `windows-deploy-guide-v2.html` 第 6.5 章），或手动：

```powershell
powershell -File .\scripts\ghost-content-import.ps1 -ServerIp "192.168.1.10"
```

## 语言

种子默认是中文。部署 Agent 在导入前会询问用户语言，若用户选择非中文，Agent 会先把 `title` / `html` / `plaintext` / `custom_excerpt` 字段翻译成目标语言，再调用导入脚本。
