# TASK_鸣潮元宇宙重构 - 基于 Miniverse 架构

**状态**: ✅ 已完成（v2.0.0 MVP）
**创建时间**: 2026-03-22 22:52
**优先级**: 高

---

## 🎯 任务目标

参考 Miniverse 完整架构，将 Agent-Company 重构为**鸣潮世界观的 Agent 元宇宙**：

**核心能力**:
1. ✅ Canvas 像素渲染引擎（替代 DOM）
2. ✅ 后端心跳 API（Agent 状态接入）
3. ✅ WebSocket 实时同步
4. ✅ Sprite 动画系统（行走/工作/待机）
5. ✅ A* 寻路系统
6. ✅ 鸣潮世界观包装（菲比、共鸣者、隐海修会）

---

## 📁 新目录结构（参考 Miniverse）

```
Agent-Company/
├── server/                     # 后端（参考 miniverse/packages/server/）
│   ├── server.ts              # HTTP + WebSocket 服务器
│   ├── store.ts               # AgentStore 状态管理
│   ├── routes/
│   │   ├── heartbeat.ts       # POST /api/heartbeat
│   │   ├── agents.ts          # GET /api/agents
│   │   ├── act.ts             # POST /api/act
│   │   └── inbox.ts           # GET /api/inbox
│   └── index.ts
├── src/                        # 前端（参考 miniverse/packages/core/）
│   ├── canvas/
│   │   ├── Renderer.ts        # Canvas 渲染引擎
│   │   ├── Camera.ts          # 相机系统
│   │   └── index.ts
│   ├── scene/
│   │   ├── Scene.ts           # Tile 地图
│   │   └── Pathfinder.ts      # A* 寻路
│   ├── sprites/
│   │   ├── SpriteSheet.ts     # Sprite 精灵图
│   │   └── Animator.ts        # 动画状态机
│   ├── citizens/
│   │   └── Citizen.ts         # Agent 角色（鸣潮共鸣者）
│   ├── effects/
│   │   ├── Particles.ts       # 粒子特效（Zzz/感叹号/光噪）
│   │   └── SpeechBubble.ts    # 语音气泡
│   ├── signal/
│   │   └── Signal.ts          # WebSocket 连接
│   └── world/
│       ├── WuWaWorld.ts       # 鸣潮世界配置
│       └── rooms.ts           # 房间定义（主厅/共鸣室/休息室/训练场）
├── public/
│   ├── assets/
│   │   ├── sprites/           # 角色精灵图
│   │   │   ├── phoebe_walk.png
│   │   │   ├── phoebe_actions.png
│   │   │   └── ...
│   │   └── tiles/             # 地图瓦片
│   │       ├── floor.png
│   │       └── wall.png
│   └── worlds/
│       └── wuwa-base/         # 鸣潮基地世界
│           └── world.json
├── index.html
├── package.json
└── tsconfig.json
```

---

## 📋 执行步骤

### Phase 1: 后端搭建（2-3小时）

**1.1 初始化项目**
- [x] 创建 package.json（Node.js + TypeScript + ws）
- [x] 配置 tsconfig.json
- [x] 创建基本目录结构

**1.2 AgentStore 状态管理**
- [x] 复制 Miniverse 的 AgentStore 逻辑
- [x] 实现 heartbeat() - 更新 Agent 状态
- [x] 实现离线检测（30s sleeping / 60s offline）
- [x] 实现状态变更通知机制

**1.3 HTTP API 路由**
- [x] POST /api/heartbeat - Agent 状态上报
- [x] GET /api/agents - 查询所有 Agent
- [x] POST /api/act - 执行动作（说话/移动）
- [x] GET /api/inbox - 消息收件箱
- [x] GET /api/info - 服务器信息

**1.4 WebSocket 服务**
- [x] WebSocket 连接管理
- [x] 状态变化实时广播
- [x] 客户端消息处理

### Phase 2: 前端 Canvas 引擎（4-6小时）

**2.1 渲染引擎**
- [x] Renderer.ts - Canvas 分层渲染
- [x] Camera.ts - 相机跟随/缩放
- [x] 像素风格 imageRendering: pixelated

**2.2 场景系统**
- [x] Scene.ts - Tile 地图加载/渲染
- [x] Pathfinder.ts - A* 寻路算法
- [x] 16x12 网格地图（鸣潮修会基地）

**2.3 角色系统（鸣潮共鸣者）**
- [x] Citizen.ts - 共鸣者角色
- [x] 状态机：working/idle/thinking/sleeping/error/speaking
- [x] 自动寻路到工位/休息区
- [x] NPC 自动行为循环

**2.4 动画系统**
- [x] SpriteSheet.ts - 精灵图加载
- [x] Animator.ts - 动画播放（行走/待机/工作）
- [x] 方向控制（上下左右）

**2.5 特效系统**
- [x] Particles.ts - 粒子效果
  - Zzz（睡眠）
  - 感叹号（错误）
  - 思考气泡（thinking）
  - 光噪粒子（鸣潮特色）
- [x] SpeechBubble.ts - 语音气泡

**2.6 信号同步**
- [x] Signal.ts - WebSocket 客户端
- [x] 状态更新处理
- [x] 重连机制

### Phase 3: 鸣潮世界观包装（2-3小时）

**3.1 世界配置**
- [ ] WuWaWorld.ts - 鸣潮世界定义
- [ ] 隐海修会基地场景
- [ ] 4个房间：主厅/共鸣室/休息室/训练场

**3.2 角色设计**
- [ ] 菲比（主人）- 金发光环
- [ ] Claude-Dev - 蓝色系
- [ ] Gemini-Research - 绿色系
- [ ] Codex-Builder - 紫色系

**3.3 视觉风格**
- [ ] 鸣潮配色（深夜蓝黑 + 衍射蓝 + 霓虹粉 + 菲比金）
- [ ] CRT 扫描线效果
- [ ] 棱镜/光噪装饰元素
- [ ] 像素风 Tile 地图

### Phase 4: 集成与测试（2小时）

**4.1 集成测试**
- [x] 本地启动服务器
- [x] curl 测试 heartbeat API
- [x] 浏览器查看 Canvas 渲染
- [x] 多 Agent 同时在线测试

**4.2 Agent 接入**
- [x] 心跳上报脚本 examples/heartbeat.sh ✅ (2026-03-23)
- [ ] 菲比（OpenClaw）接入测试
- [ ] 实时状态验证

**4.3 部署**
- [x] Cloudflare Workers 适配
- [x] 前端静态部署
- [x] 线上验证

---

## ✅ 验收标准

- [ ] 后端 API 完整可用（heartbeat/agents/act/inbox）
- [ ] Canvas 渲染正常工作（像素风 + 动画）
- [ ] Agent 能在房间里行走、工作、待机
- [ ] WebSocket 实时同步状态
- [ ] 鸣潮世界观视觉风格统一
- [ ] 菲比能成功接入并实时显示

---

## 🎮 鸣潮化映射

| Miniverse | 鸣潮元宇宙 |
|-----------|-----------|
| pixel-office | 隐海修会基地 |
| co-working space | 共鸣工作区 |
| workers | 共鸣者（Resonator）|
| desk/workstation | 共鸣仪工作台 |
| coffee machine | 能量棱镜补充站 |
| intercom | 通讯棱镜 |
| monitor | 共鸣显示器 |

---

## 📝 执行记录

**2026-03-23 中段巡检总结**:
- ✅ Phase 1 后端搭建：HTTP + WebSocket 服务器、AgentStore、完整 API（/api/heartbeat, /api/agents, /api/act, /api/inbox, /api/info）
- ✅ Phase 2 前端 Canvas 引擎：Renderer, Camera, Scene, Pathfinder, Citizen, SpriteSheet, Particles, SpeechBubble, Signal 全部实现
- ✅ Phase 3 鸣潮世界观：WuWaWorld 配置、9位共鸣者角色（菲比、今汐、长离、忌炎、相里要、珂莱塔、洛可可、赞妮、布兰特）、配色方案、像素风格
- ✅ Phase 4 集成部署：Cloudflare Workers 适配、前端构建部署、线上验证通过
- ⏳ 待办：菲比（OpenClaw）Agent 接入测试、心跳上报脚本编写

**技术参考**: `/tmp/miniverse/packages/` 源码
**鸣潮素材**: 使用官方素材（主人已确认无版权问题）
**开发顺序**: 后端 → 前端引擎 → 鸣潮包装 → 集成测试
**线上地址**: https://5d579f91.agent-company.pages.dev

---

**当前执行**: ✅ v2.0.0 MVP 已完成，进入稳定运行阶段
**下一步**: Phase 4.2 - 菲比 Agent 接入测试（心跳脚本已完成 ✅，待实际集成验证）
