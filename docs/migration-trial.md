# 原博客试迁移（20 篇 + About）

来源：https://github.com/YarrowRen/YarrowRen.github.io，提交 `4a937531b48f25c3a74c65739a7b5f5cf7a25ea5`。

按 `pubDatetime` 从新到旧选取最新 20 篇已发布文章，排除草稿与未来文章。原站共 155 篇已发布文章，本次不迁移另外 135 篇，也不迁移相册、Character 页面、评论与统计脚本。原仓库和原域名配置未修改。

## 保留内容

- 每篇 Markdown/MDX 原文件均保留，SHA-256 记录于 `content/migration.json`。About 原文件同样保留并校验哈希。
- 保留标题、作者、发布时间、标签、摘要和正文；发布日期以 Asia/Shanghai 显示，原始时间戳保留。
- 74 张正文图片本地化；15 个 Mermaid 流程图离线 SVG；数学公式、代码高亮、表格、日语 ruby 注音与交互幻灯片保留。
- Google Maps 位置保留为可打开的地图链接；幻灯片使用本地脚本和系统字体，不依赖字体 CDN。
- 指向已迁移文章的交叉链接改为新站路径，其余文章链接仍指向原站。
- 默认目录为 20 篇真实内容（4 页），移除此前的虚构样刊和百篇排版样稿入口。

## 站点信息

网站署名使用 Boyu(Yarrow) Ren；头像、NLP/RAG/LLM/Multi-Agent 简介、教育经历、工作经历与联系信息来自原站 About 与首页。未使用原模板 constants.ts 中的 satnaing/username/yourmail 示例社交链接。

分类是针对试迁移内容新增的展示分组：AI / Agent（6 篇）、工程手记（5 篇）、算法与安全（7 篇）、兴趣手记（2 篇）；原始 tags 单独完整保留。

## 文章清单

| # | 发布日期（上海） | 标题 | 分组 |
|---|---|---|---|
| 1 | 2026-04-09 | [演示PPT：从泄漏源码看 Claude Code - Memory 系统与 AutoDream 深度解析](https://yarrowren.github.io/MangaBlog/posts/claude-code-memory-slides.html) | AI |
| 2 | 2026-04-02 | [从泄漏源码看 Claude Code：KAIROS模式-永久助理](https://yarrowren.github.io/MangaBlog/posts/claude-code-kairos.html) | AI |
| 3 | 2026-04-02 | [从泄漏源码看 Claude Code：Memory系统深度解析](https://yarrowren.github.io/MangaBlog/posts/claude-code-memory.html) | AI |
| 4 | 2026-04-01 | [从泄漏源码看 Claude Code：AutoDream 自进化记忆机制](https://yarrowren.github.io/MangaBlog/posts/claude-code-autodream.html) | AI |
| 5 | 2026-03-24 | [新标日初级上册知识点总结（JLPT-N5）](https://yarrowren.github.io/MangaBlog/posts/jlpt-n5.html) | 兴趣 |
| 6 | 2026-03-23 | [从微信 ClawBot 到 iLink：解析官方 Bot 协议，构建独立 WeChat-Bot](https://yarrowren.github.io/MangaBlog/posts/wechat-ilink-llm-bridge-guide.html) | AI |
| 7 | 2026-01-25 | [日本同人志OFFLINE购物指南（秋叶原篇）](https://yarrowren.github.io/MangaBlog/posts/jp-manga-guide.html) | 兴趣 |
| 8 | 2026-01-20 | [Planner: 从 Chatbot 到可规划 Agent](https://yarrowren.github.io/MangaBlog/posts/from-chatbot-to-plannable-llm-agents.html) | AI |
| 9 | 2025-05-26 | [理解Dify的Token解密与Workflow执行机制](https://yarrowren.github.io/MangaBlog/posts/dify-token-decryption-workflow-execution.html) | 工程 |
| 10 | 2025-05-19 | [Dify 角色权限管理与校验机制详解](https://yarrowren.github.io/MangaBlog/posts/dify-role-permission-management.html) | 工程 |
| 11 | 2025-04-25 | [奥克兰腾讯光子工作室群 - 一面 - 面试总结](https://yarrowren.github.io/MangaBlog/posts/akl-tencent-1st-round.html) | 工程 |
| 12 | 2025-04-25 | [奥克兰腾讯光子工作室群 - 三面 - 面试总结](https://yarrowren.github.io/MangaBlog/posts/akl-tencent-3rd-round.html) | 工程 |
| 13 | 2025-04-23 | [奥克兰腾讯光子工作室群 - 二面 - 面试总结](https://yarrowren.github.io/MangaBlog/posts/akl-tencent-2nd-round.html) | 工程 |
| 14 | 2023-08-08 | [Dijkstra算法详解与实现](https://yarrowren.github.io/MangaBlog/posts/dijkstra-algorithm-explained.html) | 算法 |
| 15 | 2023-08-06 | [贪心算法及其应用场景分析](https://yarrowren.github.io/MangaBlog/posts/greedy-algorithm-and-applications.html) | 算法 |
| 16 | 2023-08-03 | [算术级数图的定义与判定问题解析](https://yarrowren.github.io/MangaBlog/posts/arithmetic-progression-graphs-analysis.html) | 算法 |
| 17 | 2023-07-30 | [佩林数列与伪素数的计算方法](https://yarrowren.github.io/MangaBlog/posts/perrin-numbers-and-pseudo-primes.html) | 算法 |
| 18 | 2023-07-30 | [访问控制系统与模型解析](https://yarrowren.github.io/MangaBlog/posts/access-control-systems-and-models.html) | 算法 |
| 19 | 2023-07-26 | [身份认证与密码保护策略详解](https://yarrowren.github.io/MangaBlog/posts/identity-authentication-password-strategies.html) | 算法 |
| 20 | 2023-07-23 | [GDPR与DPD：欧盟数据保护法规全面解析](https://yarrowren.github.io/MangaBlog/posts/gdpr-vs-dpd-eu-data-protection.html) | 算法 |

## 构建与验证

`npm ci && npm run build` 将原文预渲染为 `dist/posts/*.html` 与 `dist/about.html`。构建不需要源仓库、浏览器或 Python；已下载图片及预渲染图表随项目保存。

`npm test` 验证原文哈希、全部正文、本地图片、公式图表、ruby、幻灯片、代码复制、About、大小屏与无 JavaScript 阅读。`test:pagination`、`test:layout`、`test:page-height` 已更新为真实目录。

重新选择试迁移内容时可运行 `python3 scripts/import-trial.py /path/to/original-checkout`，再运行 `python3 scripts/render-diagrams.py`；脚本硬性只选 20 篇，不会自动扩展为全量迁移。
