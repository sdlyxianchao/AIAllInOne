---
name: platform-report
description: 当用户需要 AI 平台运行状态报告时启用。调用 MCP 工具 platform_services 汇总各服务状态并生成报告。
version: 1.0.0
---

# Platform Report

## 用途

生成 AI 平台各服务（Keycloak / NewAPI / LiteLLM / Dify / Ghost / Gitea / Update Server / AI Admin Center / MCP Gateway）的运行状态报告。

## 使用步骤

1. 调用 MCP 工具 `platform_services` 获取服务清单；
2. 按名称、端口、用途整理；
3. 标注每项服务状态（正常 / 异常），异常时给出排查建议。

## 输出格式

用 Markdown 表格输出，列：服务名、端口、用途、状态。
