# Yarrow 的次元编辑室 / MangaBlog

Boyu(Yarrow) Ren 的漫画风博客试迁移版本。已从 [原博客](https://github.com/YarrowRen/YarrowRen.github.io) 迁移最新 **20 篇已发布文章与 About 页**；其余文章和原站保持不变。

支持不规则漫画分镜、六套版式、每页六篇、分类、跨页搜索、桌面共同高度、动态翻页、完整静态文章、目录、阅读模式与代码复制。原有虚构样刊已从默认目录移除。20 篇内容目前形成四页，六套模板库继续保留，后续更多页数会使用完整循环。

## 运行与构建

需要 Node.js 24。开发预览另需 Python 3。

```sh
npm ci
npm run dev
```

`npm run dev` 先构建，再服务 `dist/`。单独运行 `npm run build` 生成可部署到 GitHub Pages 项目子路径的静态产物。普通文章正文预渲染，关闭 JavaScript 仍能阅读；幻灯片、站内搜索和分页交互需要 JavaScript。构建无需连接原博客或图片托管站。

构建依赖为 Markdown 渲染、KaTeX、代码高亮和 HTML 清理，版本及校验值由 package-lock.json 锁定。GitHub Actions 在推送 master 后先执行 npm ci，再构建部署；仓库 Pages 的 Source 应为 GitHub Actions。

## 内容与试迁移范围

- [试迁移清单与保留情况](docs/migration-trial.md)
- `content/posts/`：20 篇原始 Markdown / MDX。
- `content/about.md`：原 About 文件。
- `content/migration.json`：来源提交、原文哈希、完整元信息、原站链接和图片映射。
- `assets/imported/`：74 张正文图片、原站头像、本地幻灯片及 15 个流程图 SVG。

首页作者身份、简介和联系方式来自原站；展示分组为 AI / Agent、工程手记、算法与安全、兴趣手记，原始标签完整保留。没有修改原站 CNAME、原仓库或全量迁移其余内容。

## 验证

先运行 `npm run dev`，再在另一个终端执行：

```sh
npm test
npm run test:pagination
npm run test:layout
npm run test:page-height
```

浏览器验证依赖 Python Playwright 与 Chromium，当前云环境已提供。覆盖原文一致性、全部文章与图片、公式、流程图、日语注音、幻灯片交互、About、大小屏、分页历史及动态切换、25 档屏宽与文字安全、桌面统一高度。截图保存在 `/tmp/panel-log-review/`。

## 分镜与素材

[布局算法](docs/layout-algorithm.md) · [桌面模板](docs/review/page-templates.svg) · [手机模板](docs/review/page-templates-mobile.svg) · [结构对照](docs/review/page-templates-comparison.svg)

前六篇已采用按文章主题独立制作的黑白漫画封面，完整版本可在 `/covers.html` 查看。原始 PNG 保存在 `docs/artwork/covers/`，网页使用同尺寸 WebP；首页按焦点等比裁切，文章页保留完整比例。详见 [封面说明](docs/artwork/covers/BRIEF.md)。其余文章暂用首轮概念场景，正文图片仍为原博客素材。

`npm run test:covers` 验证六档屏宽、图片比例、文字与封面分区、旧图集统一缩放和阅读模式。
