# 异见 VARIANT · 文艺媒体门户

「异见（VARIANT）」是一个独立文艺媒体网站，包含影评、书评、艺术观察、影像等栏目。

## 技术栈
- 纯前端（HTML + CSS + JavaScript），无后端
- 内容由 `data/*.json` 数据文件驱动
- [Decap CMS](https://decapcms.org) 提供可视化后台（`/admin`）

## 本地预览
```bash
# 方式一：双击 start.command（Mac）
# 方式二：手动启动
python3 -m http.server 8080
# 浏览器打开 http://localhost:8080/index.html
```
注意：不能直接双击 index.html（浏览器禁止 file:// 读取本地 JSON）。

## 内容管理
所有内容在 `data/` 目录：
- `config.json` — 全站配置（品牌、关于、页脚）
- `works.json` — 影像作品
- `articles.json` — 影评 / 书评 / 艺术观察文章

部署到 Netlify 后，可访问 `/admin` 通过浏览器后台编辑，保存后自动提交到 GitHub 并触发重新部署。

## 部署
- 平台：Netlify（连接 GitHub 仓库自动部署）
- 配置：`netlify.toml`（纯静态，发布根目录）
