# SIDEQUEST — English Reading Club

一个面向考研英语（二）阅读练习的轻量静态网站。用真实娱乐事件、粉丝文化、真人秀、网络迷因和科技话题做阅读材料，尽量让英语学习像刷一份有趣的文化杂志。

## 功能

- **10 篇英文阅读文章**：主题包括 #FreeBritney、Taylor Swift Eras Tour 票务风波、Fyre Festival、GameStop 事件、《Love Is Blind》直播延迟、Barbenheimer、The Try Guys 事件、The Dress、BTS 粉丝公益募捐和 AI 模仿歌手声音。
- **阅读理解练习**：每篇 3 道单选题，提交后显示正确答案和解析。
- **沉浸式阅读**：独立阅读界面、隐藏侧栏、字体大小调节、深色模式。
- **ADHD 专注模式**：弱化非当前段落，鼠标移动时显示阅读尺；触屏设备可点击段落聚焦。
- **点击查词**：每篇内置重点词释义；其他单词尝试调用 Free Dictionary API，失败时可跳转有道词典。
- **全文翻译**：每篇提供逐段中文译文。
- **事实说明与参考资料线索**：每篇明确标注真实事件的边界，并列出可继续查找的报道或公开资料。
- **学习记录**：已读文章和收藏词汇保存在当前浏览器的 `localStorage` 中。
- **搜索与筛选**：按主题过滤文章，或搜索关键词。

## 本地预览

直接用浏览器打开 `index.html` 即可。建议使用 Chrome、Edge 或 Firefox 的近期版本。网络查词需要联网；内置文章、译文、题目和重点词不依赖后端。

## 部署到 GitHub Pages

1. 将本项目中的 `index.html`、`styles.css`、`app.js`、`articles.js` 和 `README.md` 放在仓库根目录。
2. 在 GitHub 仓库进入 **Settings → Pages**。
3. 在 **Build and deployment** 中选择 **Deploy from a branch**。
4. Branch 选择 `main`，目录选择 `/(root)`，保存。
5. 等待 GitHub Pages 完成首次部署后，页面地址会显示在 Pages 设置页。

## 技术说明

纯 HTML、CSS 和原生 JavaScript，无构建步骤、无数据库、无 API Key。学习进度仅保存在本地浏览器，不会自动跨设备同步。文章依据公开报道、当事人声明或官方记录改写。为增强可读性，使用了故事化的叙述结构，但不将未经证实的传闻当作事实；页面内附有参考资料线索，建议学习者进一步核对原始资料。
