# Corp Portal — 公司内部门户主题（Ghost）

面向企业内网 AI 平台（AI All In One Hub，8090 端口）定制的 Ghost 主题，稳重专业的企业品牌风格。内置平台介绍区（Hero + 能力卡片）与新闻文章列表，移动端自适应。

## 特性

- **顶部导航**：读取 Ghost 后台的导航设置（Home / News / DeepChat / Dify 等），通过 `partials/navigation.hbs` 渲染。
- **首页 Hero + 能力卡片**：统一认证 / 大模型网关 / 模型代理 / AI 应用编排 / 桌面客户端 / 源码管理 六大能力介绍。
- **最新动态**：首页直接展示全部文章（带分页），发新文章即出现在首页。
- **中文字体**：思源宋体（Noto Serif SC）+ 思源黑体（Noto Sans SC）。
- **响应式**：移动端折叠菜单 + 回到顶部按钮。

## 安装

### 方式一：Ghost 后台（推荐）

1. 把本目录打包成 zip（根目录直接是 `package.json`、`default.hbs` 等，不要多套一层文件夹）：

   ```bash
   cd ghost-theme-corp-portal
   zip -r ../corp-portal-theme.zip .
   ```

2. Ghost 后台 → Settings → Design → 上传 zip → 激活 **Corp Portal**。

### 方式二：直接复制到容器（Docker）

```bash
docker cp ./ghost-theme-corp-portal/. ghost:/var/lib/ghost/content/themes/corp-portal-theme/
docker restart ghost
```

> 主题目录挂载在 `ghost-data` 命名卷，容器重建不丢失；只有手动删卷或重装主题才需重新复制。

## 文件结构

| 文件 | 作用 |
|------|------|
| `default.hbs` | 页面骨架（header + body + footer） |
| `index.hbs` | 首页：Hero + 能力卡片 + 文章列表 |
| `page.hbs` / `post.hbs` / `tag.hbs` / `author.hbs` | 单页 / 文章 / 标签归档 / 作者归档 |
| `partials/navigation.hbs` | 导航循环（`{{navigation}}` helper 专用模板） |
| `partials/header.hbs` / `footer.hbs` | 页头 / 页脚 |
| `assets/css/screen.css` | 全部样式 |
| `assets/js/main.js` | 移动端菜单 + 回到顶部 |

## 注意

- 导航循环**必须在 `partials/navigation.hbs` 里**用 `{{#foreach navigation}}`（不带 `@site.` 前缀），在其他模板里用 `{{#foreach @site.navigation}}` 会失效（所有链接都指向首页）。
- 首页路由建议在 Ghost 的 `routes.yaml` 里把 `/` 指向 `index`（文章列表），这样新闻直接在首页展示。参考：

  ```yaml
  routes:

  collections:
    /:
      permalink: /{slug}/
      template: index

  taxonomies:
    tag: /tag/{slug}/
    author: /author/{slug}/
  ```
