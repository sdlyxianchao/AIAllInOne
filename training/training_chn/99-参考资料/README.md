# 参考资料目录说明

本目录存放培训配套的通用参考资料；各产品的官方资料与链接见各产品文件夹下的 `参考资料/` 目录。

## 各产品「参考资料/」目录的用途
- 存放可离线查阅的**官方文档快照**（下载成功的 md/html 文件，如 `04-dify/参考资料/dify-selfhosted.md`）。
- 各产品官方文档完整 URL 见：
  - 各产品《教材.md》末尾「延伸学习」节；
  - `../../../../docs/i18n/admin-manual-zh-cn/ch30-appendix.md`（原厂文档索引总表）。

> 说明：官方文档多为在线站点，本项目已尽力抓取关键页面离线保存（受网络限制，仅部分成功）。在线文档链接均可直接访问；如需整站离线，可在内网可达环境自行使用文档站导出/镜像工具。

## 本目录文件
| 文件 | 说明 |
|---|---|
| `视频教程索引.md` | B 站 / YouTube 视频按模块归类（课后自学用） |
| `培训配套制度与FAQ.md` | 管理制度、环境准备清单、FAQ、结业跟踪 |
| `download_official_docs_v2.sh` | 官方文档抓取脚本（含 .md 导出技巧，可重跑补充快照） |

## 官方文档下载脚本用法（可选）
```
bash /c/AIAllInOne/trainning/99-参考资料/download_official_docs_v2.sh
```
脚本对 Mintlify 站点（docs.dify.ai / langfuse.com / modelcontextprotocol.io 等）使用「URL 加 .md」方式导出 Markdown；已成功示例：Dify 安装自托管文档。可自行补充各站 sitemap 中的页面路径重跑。
