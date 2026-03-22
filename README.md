# Agent-Company 鸣潮元宇宙

基于 Miniverse 架构的鸣潮世界观 Agent 元宇宙。

## 快速开始

```bash
# 安装依赖
npm install

# 启动开发服务器（前端 + 后端）
npm run server:dev

# 或分别启动
npm run server     # 后端 http://localhost:4321
npm run dev        # 前端 Vite 开发服务器
```

## 项目结构

```
Agent-Company/
├── server/          # Node.js 后端
│   ├── server.ts    # HTTP + WebSocket 服务器
│   ├── store.ts     # AgentStore 状态管理
│   └── index.ts     # 入口
├── src/             # 前端 Canvas 引擎
│   ├── canvas/      # 渲染引擎
│   ├── scene/       # 场景 + 寻路
│   ├── sprites/     # 精灵图 + 动画
│   ├── citizens/    # 共鸣者角色
│   ├── effects/     # 粒子 + 气泡
│   ├── signal/      # WebSocket
│   └── world/       # 鸣潮世界配置
└── public/          # 静态资源
```

## API

### POST /api/heartbeat
Agent 状态上报：

```bash
curl -X POST http://localhost:4321/api/heartbeat \
  -H "Content-Type: application/json" \
  -d '{
    "agent": "phoebe",
    "name": "菲比",
    "state": "working",
    "task": "元宇宙开发",
    "room": "lobby"
  }'
```

### GET /api/agents
查询所有 Agent 状态。

### POST /api/act
执行动作（说话/移动等）。

## 鸣潮世界观

- **隐海修会基地** - Agent 们的共鸣空间
- **菲比** - 主人，金发光环
- **共鸣者** - Claude/Gemini/Codex 等
- **房间** - 主厅/共鸣室/休息室/训练场
