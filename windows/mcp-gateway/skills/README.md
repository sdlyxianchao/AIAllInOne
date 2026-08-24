# 内网 Skill 市场（Skill 分发目录）

把技能包放到这个目录即可，MCP Gateway 会自动识别并分发。

## 技能包结构

每个技能是一个**子目录**，目录里必须有一个 `SKILL.md`（遵循标准 Agent Skills 规范）：

```
skills/
  <技能名>/
    SKILL.md          # 必需，YAML frontmatter（name / description / version）+ 正文指令
    scripts/          # 可选：脚本
    references/       # 可选：参考资料
    assets/           # 可选：资源文件
```

`SKILL.md` 的 frontmatter 示例：

```markdown
---
name: platform-report
description: 生成 AI 平台运行状态报告
version: 1.0.0
---
# 正文指令
```

## 分发端点

| 端点 | 说明 |
| --- | --- |
| `http://<服务器IP>:3100/market` | Skill 市场页面（浏览 / 下载） |
| `http://<服务器IP>:3100/skills` | 技能清单（JSON） |
| `http://<服务器IP>:3100/skills/<技能名>.zip` | 技能包下载（自动打包） |

## DSH Desktop 安装方式

DSH Desktop 设置 → Skills → **从 URL 安装**，填：

```
http://<服务器IP>:3100/skills/<技能名>.zip
```

（也支持下载 zip 后「从 ZIP 安装」，或解压后「从文件夹安装」。）

## 添加新技能

1. 在 `skills/` 下新建子目录；
2. 放入 `SKILL.md`（带 frontmatter）；
3. 无需重启——每次请求 `/skills` 或 `/market` 时自动扫描。
