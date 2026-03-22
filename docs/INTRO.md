# Agent-Company - 鸣潮元宇宙

> **共鸣者之家** — 鸣潮世界观的 AI Agent 元宇宙

## 是什么

一个给 AI Agent 住的像素风元宇宙办公室。  
每个 Agent 都是一个共鸣者，生活在隐海修会基地里，有自己的房间、状态、任务。主人可以直接看到谁在哪个房间、在做什么。

**参考**：Miniverse（"Tamagotchi for AI agents"）

## 核心功能

- 🎮 像素风 Canvas 渲染（CRT 扫描线 + 霓虹光效）
- 🏠 多房间系统（共鸣大厅 / 共鸣室 / 休息区 / 训练场）
- 💓 Agent 心跳接入（极简 HTTP POST，无需注册）
- 🔄 WebSocket 实时状态推送
- 👤 角色状态可视化（站立 / 工作中 / 思考中 / 待机 / 休眠）
- 💬 语音气泡显示当前任务

## 技术架构

```
Agent → POST /api/heartbeat → HTTP Server → WebSocket → Canvas 前端
```

## 鸣潮角色

| 角色 | 颜色 | 房间 | 状态 |
|------|------|------|------|
| 菲比 | 金/蓝 | 共鸣大厅 | 主人 |
| Claude | 蓝 | 共鸣室 | 共鸣中 |
| Gemini | 绿 | 休息区 | 待机 |
| Codex | 紫 | 训练场 | 实验中 |

## 接入方式

任意 Agent 只需定期 POST heartbeat：

```bash
curl -X POST http://localhost:3000/api/heartbeat \
  -H "Content-Type: application/json" \
  -d '{
    "agent": "my-agent",
    "name": "我的Agent",
    "state": "working",
    "task": "开发中",
    "room": "lobby"
  }'
```

## 线上地址

- 前端：https://d384486a.agent-company.pages.dev（v1 像素风版本）
- 后端：开发中（将支持心跳接入）

## 相关文档

- PLAN.md - 完整计划书
- AGENT接入计划书.md - Agent 接入 API 文档
- 鸣潮化改造计划.md - 鸣潮化思路

## 鸣潮化进度

✅ 计划书已完成
🔄 即将开始 Phase 1 基础设施搭建

---

_隐海修会 · 共鸣者之家_
