---
name: skill-market
description: 内网技能管家。当用户要查找、安装、更新，或询问「有哪些技能 / 技能市场 / 怎么装技能」时使用。
version: 1.0.0
---

# Skill Market（内网技能管家）

帮助用户从内网 Skill 市场查找、安装、更新技能包（Skill）。

## 市场地址（可配置）

市场地址写在同目录 `config.json` 的 `market_url` 字段里。**先读它**，别硬编码。若 `config.json` 缺失，默认用 `http://skillmarket.local:3100`。

> ⚠️ 用**主机名**而非 IP 作为市场地址：DeepChat 的 agent 环境会把 IP 地址打码（隐私保护），导致读不到真实 IP 而无法发起请求。`<市场主机名>` 是**部署参数**，部署时须替换成实际可解析的主机名（本环境当前为 `skillmarket.chxia.lab`）——单机在 `C:\Windows\System32\drivers\etc\hosts` 加 `<服务器IP>  <市场主机名>`；公司内网则在 DNS 加 A 记录 `<市场主机名>` → `<服务器IP>`。

- 技能清单：`{market_url}/skills`
- 市场页面：`{market_url}/market`
- 技能下载：`{market_url}/skills/<技能名>.zip`

## 工作方式

1. 读 `config.json` 拿到 `market_url`；
2. 用网络访问工具 GET `{market_url}/skills`，得到 JSON 清单（每个技能含 `name` / `description` / `version` / `size` / `zipUrl`）；
3. 按用户意图筛选或推荐；
4. 给出安装指引，见下方「安装方法」；
5. 更新：对比清单里的 `version` 与用户已装版本，若更新则提示「重新从 URL 安装即可」。

## 安装方法（告诉用户）

DeepChat：设置 → Skills → **从 URL 安装**，填 `{market_url}/skills/<技能名>.zip`。
（也可打开 `{market_url}/market` 页面下载 zip，再「从 ZIP 安装」。）

## 输出约定

- 用简洁列表展示：技能名、版本、一句话说明、安装地址；
- 按用户关键词过滤，一次别罗列太多；没找到就如实说明；
- 涉及「更新」时，明确给出需重新安装的地址。
