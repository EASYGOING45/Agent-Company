# Agent-Company — Deployment Notes V1

## 当前方案

已通过 Cloudflare Pages (wrangler) 部署，实时生效，无需等待 CI/CD 排队。

## 部署记录

### 2026-03-17 (修复白屏)
- 修复白屏问题：将 ES modules 改为纯静态 HTML，内联 CSS/JS
- 重新部署地址：**https://81d9d505.agent-company.pages.dev**

> 后续如有需要，可配置自定义域名
