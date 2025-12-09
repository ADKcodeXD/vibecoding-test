# Vibecoding web launcher

一个简单的 GitHub Pages 主页，用来列出并跳转到 `web/` 目录下的 HTML 页面（无需额外配置或后端）。

## 使用
1. 在 `web/` 目录放入你的页面，例如 `web/AudioVisulize.html`。
2. 在 `pages.json` 里添加描述（`title`、`file`、`description`、`tags`）。如果不改，首页会使用代码里的默认列表。
3. 推送到 GitHub 仓库，并在 Settings → Pages 启用 GitHub Pages（`main` / `/`）。
4. 访问仓库主页即可看到主页面导航，点击卡片即可打开对应的 `web/xxx.html`。

## 说明
- 首页不再依赖 GitHub API，适合本地预览或直接挂在 Pages。
- `pages.json` 支持 CDN 缓存刷新（脚本使用 `cache: no-store`），改完即可重新加载。
- 想要增加新页面：把 HTML 放入 `web/`，并补充 `pages.json`，提交后即可显示。
