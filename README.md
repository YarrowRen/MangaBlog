# 次元编辑室 / PANEL LOG

首轮漫画博客设计原型。包含响应式首页、四篇示例文章、分类筛选、站内搜索、文章目录、阅读模式及代码复制。内容和看板角色为设计演示。

## 运行与构建

需要 Node.js 24 和 Python 3。无第三方前端依赖。

```sh
cd /workspace/MangaBlog
npm run dev
npm run build
```

`dist/` 是独立静态产物，支持 GitHub Pages 项目子路径。首轮先用原生 HTML/CSS/JS 验证美术与交互；正式内容系统可在确认视觉后迁移至 Astro/MDX。

## 浏览器验证

先启动静态服务，再执行 `npm test`。验证工具需要 Python Playwright 与 Chromium；当前云环境已提供。测试覆盖 1440、768、390、320 像素宽度、分类、搜索、文章切换、阅读模式、素材与减少动效。截图输出至 `/tmp/panel-log-review/`。

## GitHub Pages

已有 `.github/workflows/pages.yml`。在仓库 Settings → Pages 中将 Source 设为 GitHub Actions。工作流在 master 分支推送或手动触发后构建、发布。需要 GitHub 写入权限及 Pages 启用；本地构建不表示已部署。

## 审阅重点

1. 首页标题、黑白漫画与珊瑚红的比例。
2. 大分镜与辅助格的节奏，以及手机重排。
3. 长文阅读、目录与阅读模式是否舒适。
4. 看板角色与场景是否适合继续发展为完整美术设定。

## 素材说明

`assets/manga-sheet.webp` 为本轮 AI 生成的原创概念图集，包含编辑室、人物特写、街角与书桌四格。当前以单张图集的背景位置复用来保持风格一致。它是首轮美术占位，尚未进行逐格独立精修或专门的手机构图制作；后续可通过 Imagen 按 `docs/art-direction.md` 分别重制。气泡与文字均由 HTML/CSS 实现，图片里不嵌文字。
