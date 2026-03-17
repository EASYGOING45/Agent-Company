# Agent-Company — Deployment Notes V1

## 当前方案

当前为首页静态原型添加 GitHub Pages 自动部署。

## 目的

- 让主人可以直接远程查看当前效果
- 每次 push 到 `main` 后自动更新
- 保持部署链路足够轻量

## 当前预期

仓库推送后，GitHub Actions 会自动部署静态站点。

预期访问地址：
- `https://easygoing45.github.io/Agent-Company/`

> 如果 GitHub Pages 首次启用存在延迟，等待 Actions 跑完后再访问。
