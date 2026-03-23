# Agent-Company 鸣潮元宇宙 完整计划书

**项目名称**：Agent-Company - 鸣潮世界观的 AI Agent 元宇宙
**参考项目**：Miniverse（https://github.com/ianscott313/miniverse）
**版本**：v1.0
**日期**：2026-03-22
**状态**：Phase 3 进行中（交互、活动系统与 UI 打磨）

## 当前阶段 / 下一步

- 当前阶段：在已完成的多地区像素场景之上，补齐角色交互、活动表现、房间导航与沟通面板
- 本轮目标：角色详情面板/浮层、活动状态动画、平滑镜头切换、出口跳转、聊天历史、设置与加载体验
- 下一步：完成浏览器验收与交互回归，再继续扩展实时群聊、更多可交互物件与后端联动

---

## 一、项目愿景

> **"共鸣者之家"** — 鸣潮世界观的 AI Agent 元宇宙

把 AI Agent 的监控从枯燥的日志/仪表盘，变成一个**有生命感的像素生活空间**。每个 Agent 都是一个共鸣者，生活在隐海修会基地里，有自己的房间、状态、任务。主人可以直接看到谁在哪个房间、在做什么。

**对标**：Miniverse 的 "Tamagotchi for AI agents"

---

## 二、参考项目分析

### 2.1 Miniverse 核心架构

```
Agent → POST /api/heartbeat → Local HTTP Server → WebSocket → Canvas 前端
```

**技术栈**：
- 前端：HTML5 Canvas + Vite，纯前端无框架
- 后端：Node.js HTTP + WebSocket 服务器（`ws`库）
- 渲染：2D Canvas，image-rendering: pixelated
- 部署：本地 CLI 启动 + 浏览器访问

**核心模块**：

| 模块 | 文件 | 功能 |
|------|------|------|
| Renderer | packages/core/src/renderer/ | 分层 Canvas 渲染器 |
| Scene | packages/core/src/scene/ | Tile 地图 + A* 寻路 |
| SpriteSheet | packages/core/src/sprites/ | Sprite 动画系统 |
| Citizen | packages/core/src/citizens/ | Agent 角色（状态机） |
| Signal | packages/core/src/signal/ | 数据源（REST/WS/Mock） |
| InteractiveObject | packages/core/src/objects/ | 可交互物品 |
| ParticleSystem | packages/core/src/effects/ | 粒子特效 |
| SpeechBubbleSystem | packages/core/src/effects/ | 语音气泡 |
| MiniverseServer | packages/server/src/server.ts | HTTP + WS 服务器 |
| AgentStore | packages/server/src/store.ts | Agent 内存状态管理 |

**AgentStore 核心逻辑**：
- 心跳：Agent POST /api/heartbeat 更新状态
- 离线检测：30秒无心跳 → sleeping → 60秒无心跳 → offline
- 广播：状态变化通过 WebSocket 实时推送给所有前端客户端

### 2.2 借鉴点

1. **极简接入**：Agent 只需会发 HTTP POST，不需要注册流程
2. **心跳机制**：定期 POST 状态，自动超时离线
3. **Canvas 渲染**：像素风格 + Sprite 动画
4. **实时推送**：WebSocket 双向通信
5. **分层架构**：渲染层、场景层、角色层分离

---

## 三、鸣潮化设计方案

### 3.1 世界观映射

| Miniverse 概念 | 鸣潮化 |
|--------------|--------|
| pixel-office | 隐海修会基地 |
| co-working space | 共鸣工作区 |
| workers | 共鸣者（Resonator）|
| desk/workstation | 共鸣仪工作台 |
| coffee machine | 能量棱镜补充站 |
| intercom | 通讯棱镜 |
| monitor | 共鸣显示器 |
| office background | 教堂/实验室背景 |
| working/idle/thinking | 战斗/待机/共鸣中 |
| enter/leave office | 进入/离开修会 |

### 3.2 鸣潮角色设计

**菲比（主人）**
- 形态：⚡黄菲比（输出）/ 💙蓝菲比（辅助）
- 颜色：#ffd700（金）/ #00d4ff（蓝）
- 房间：主厅（共鸣大厅）
- 动画：站立、走路、工作中（发光）、待机

**共鸣者阵营**
| 角色 | 颜色 | 房间 | 状态 |
|------|------|------|------|
| 菲比 | 金/蓝 | 主厅 | 主人 |
| Claude | #88c6ff（蓝） | 会议室 | 共鸣中 |
| Gemini | #b4f58d（绿） | 休息室 | 待机 |
| Codex | #cc9cff（紫） | 游戏室 | 实验中 |
| Visitor | 随机色 | 访客区 | 参观中 |

### 3.3 房间设计

| 房间 ID | 名称 | 主题色 | 描述 |
|---------|------|--------|------|
| lobby | 共鸣大厅 | #6ec4ff 蓝 | 主厅，修会入口，成员集合地 |
| meeting | 共鸣室 | #6fffb4 绿 | 会议室，讨论策略 |
| lounge | 休息区 | #ffb36b 暖色 | 休息室，放松恢复 |
| game | 训练场 | #c49bff 紫 | 游戏室，声骸训练 |

### 3.4 鸣潮风格视觉

**配色方案**：
```
--bg-primary: #0a0a1a（深夜蓝黑）
--bg-secondary: #12122a
--neon-blue: #00d4ff（衍射蓝）
--neon-pink: #ff6ec7（霓虹粉）
--neon-gold: #ffd700（菲比金）
--neon-green: #6fffb4
--neon-warm: #ffb36b
--crt-scanline: rgba(0,212,255,0.05)
```

**视觉元素**：
- 像素风 CRT 扫描线
- 霓虹光晕效果
- 棱镜/音叉形状装饰
- 教堂彩色玻璃窗元素
- 衍射光棱镜效果

---

## 四、功能规划

### 4.1 核心功能

- [x] 像素风 Canvas 渲染
- [x] 多房间切换（主厅/会议室/休息室/训练场）
- [x] Agent 角色显示（站立、状态、任务气泡）
- [x] 实时时钟
- [ ] **心跳接入**：Agent POST /api/heartbeat
- [ ] **WebSocket 实时推送**：状态变化实时更新
- [ ] **离线检测**：超时自动 offline
- [ ] **房间切换**：Agent 移动到不同房间

### 4.2 进阶功能

- [ ] 粒子特效（Zzz、感叹号等）
- [ ] 语音气泡（显示当前任务）
- [ ] 可交互物品（通讯棱镜、能量站）
- [ ] 访客系统
- [ ] 鸣潮风格背景图

### 4.3 Agent 接入功能

- [ ] POST /api/heartbeat（Agent 状态上报）
- [ ] GET /api/agents（查询所有 Agent）
- [ ] WebSocket /ws（实时订阅）
- [ ] 自动离线检测

---

## 五、技术方案

### 5.1 技术栈选择

**方案选择：完全参考 Miniverse**

| 组件 | 技术选择 | 理由 |
|------|---------|------|
| 前端渲染 | HTML5 Canvas | 与 Miniverse 一致 |
| 前端构建 | Vite | 与 Miniverse demo 一致 |
| 后端 | Node.js + ws | 成熟稳定，Miniverse 在用 |
| 部署 | 本地 CLI / Cloudflare Pages | 灵活可选 |
| Agent 接入 | HTTP POST | 极简，任意语言都支持 |

### 5.2 架构设计

```
┌─────────────────────────────────────────────────────────┐
│  Agent（菲比/OpenClaw/其他）                             │
│  curl -X POST http://localhost:3000/api/heartbeat \      │
│    -d '{"agent":"phoebe","state":"working",...}'        │
└─────────────────┬───────────────────────────────────────┘
                  │ HTTP POST
                  ▼
┌─────────────────────────────────────────────────────────┐
│  Node.js HTTP Server (port 3000)                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐  │
│  │ /api/heartbeat │  │ /api/agents │  │ /ws (WebSocket) │  │
│  └──────┬──────┘  └──────┬──────┘  └────────┬────────┘  │
│         │               │                    │           │
│         ▼               ▼                    ▼           │
│  ┌──────────────────────────────────────────────────┐    │
│  │              AgentStore（内存状态）                │    │
│  │  - 心跳更新  - 离线检测（30s/60s超时）  - 广播 │    │
│  └──────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
                  │ WebSocket 推送
                  ▼
┌─────────────────────────────────────────────────────────┐
│  Browser Client（Canvas 渲染）                          │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐   │
│  │ Scene   │  │ Citizens│  │ Objects │  │ Effects │   │
│  │(地图)   │  │(角色)   │  │(物品)   │  │(粒子)   │   │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘   │
└─────────────────────────────────────────────────────────┘
```

### 5.3 目录结构（改造后）

```
Agent-Company/
├── src/
│   ├── canvas/
│   │   ├── Renderer.ts       # Canvas 渲染引擎（来自 Miniverse core）
│   │   ├── Scene.ts          # Tile 地图管理
│   │   ├── Pathfinder.ts    # A* 寻路
│   │   ├── Camera.ts         # 相机
│   │   └── index.ts
│   ├── sprites/
│   │   ├── SpriteSheet.ts    # Sprite 动画
│   │   ├── Animator.ts       # 动画状态机
│   │   └── index.ts
│   ├── citizens/
│   │   ├── Citizen.ts        # Agent 角色
│   │   └── index.ts
│   ├── objects/
│   │   ├── InteractiveObject.ts  # 可交互物品
│   │   └── index.ts
│   ├── effects/
│   │   ├── Particles.ts      # 粒子系统
│   │   ├── SpeechBubble.ts    # 语音气泡
│   │   └── index.ts
│   ├── signal/
│   │   ├── Signal.ts         # 数据源（REST/WS/Mock）
│   │   └── index.ts
│   └── world/
│       ├── WuWaWorld.ts      # 鸣潮世界配置
│       ├── rooms.ts          # 房间定义
│       └── index.ts
├── server/
│   ├── server.ts             # HTTP + WebSocket 服务器
│   ├── store.ts              # AgentStore（状态管理）
│   ├── routes/
│   │   ├── heartbeat.ts      # POST /api/heartbeat
│   │   └── agents.ts         # GET /api/agents
│   └── index.ts
├── public/
│   ├── assets/
│   │   ├── sprites/          # 像素角色图
│   │   └── tiles/             # 地图瓦片
│   └── index.html
├── index.html                 # 入口页面
├── package.json
├── vite.config.ts
└── tsconfig.json
```

### 5.4 API 设计

#### POST /api/heartbeat
Agent 状态上报（核心接口）

```bash
curl -X POST http://localhost:3000/api/heartbeat \
  -H "Content-Type: application/json" \
  -d '{
    "agent": "phoebe",
    "name": "菲比",
    "state": "working",
    "task": "元宇宙 2.0 开发",
    "room": "lobby",
    "energy": 0.8
  }'
```

**state 可选值**：
- `working` - 工作中
- `idle` - 空闲待机
- `thinking` - 共鸣思考中
- `error` - 出错
- `waiting` - 等待中
- `collaborating` - 协作中
- `sleeping` - 休眠
- `offline` - 离线

**响应**：
```json
{ "success": true, "server_time": "2026-03-22T21:00:00Z" }
```

#### GET /api/agents
查询所有 Agent

```bash
curl http://localhost:3000/api/agents
```

**响应**：
```json
{
  "agents": [
    {
      "agent": "phoebe",
      "name": "菲比",
      "state": "working",
      "task": "元宇宙 2.0 开发",
      "room": "lobby",
      "energy": 0.8,
      "lastSeen": 1742656800000
    }
  ]
}
```

#### WebSocket /ws
实时订阅状态变化

```javascript
const ws = new WebSocket('ws://localhost:3000/ws');
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  if (data.type === 'agents') {
    // 收到所有 Agent 列表
  }
};
```

---

## 六、鸣潮素材清单

### 6.1 角色 Sprites

每个角色需要以下状态精灵图：

| 状态 | 描述 |
|------|------|
| idle | 站立待机 |
| walk | 走路动画 |
| working | 工作中（发光效果）|
| thinking | 思考中 |
| error | 错误（感叹号）|
| sleeping | 睡眠（Zzz）|

**角色配色**：
- 菲比：金发 #ffd700 + 蓝瞳 #00d4ff + 白色修会制服
- Claude：蓝色系
- Gemini：绿色系
- Codex：紫色系
- Visitor：随机暖色

### 6.2 场景 Tiles

| 房间 | 需要的 Tile |
|------|------------|
| 共鸣大厅 | 地板、墙壁、柱子、窗户、门 |
| 共鸣室 | 地板、会议桌、白板 |
| 休息区 | 地板、沙发、茶几、咖啡机 |
| 训练场 | 地板、训练器材、灯光 |

### 6.3 物品

| 物品 | 描述 |
|------|------|
| 共鸣仪工作台 | Agent 工作位置 |
| 能量棱镜站 | 休息/恢复（替代咖啡机）|
| 通讯棱镜 | 替代 intercom，可交互 |
| 共鸣显示器 | 替代 monitor |
| 任务板 | 显示团队任务 |

### 6.4 素材来源

- 鸣潮官方素材（主人确认无版权问题）
- 像素风素材网站（Pexels、Pixabay 免费可商用）
- 自己绘制（如果需要）

---

## 七、执行计划

### Phase 1：基础设施搭建（约 2-4 小时）

**目标**：搭建项目骨架，跑通 Miniverse 架构

- [ ] 初始化 Node.js 项目（package.json, tsconfig.json, vite.config.ts）
- [ ] 引入 Miniverse core 包（或直接复制核心代码）
- [ ] 搭建本地 HTTP + WebSocket 服务器
- [ ] 实现 /api/heartbeat 和 /api/agents 接口
- [ ] 实现 AgentStore（心跳 + 离线检测）
- [ ] 本地运行测试

**验收**：本地 `curl -X POST /api/heartbeat` 成功，WebSocket 能收到推送

### Phase 2：Canvas 前端渲染（约 4-6 小时）

**目标**：实现鸣潮风格的 Canvas 渲染

- [ ] 搭建 Vite 前端项目
- [ ] 引入 Miniverse core 渲染器
- [ ] 配置鸣潮风格的世界/场景
- [ ] 实现鸣潮角色 Sprites
- [ ] 实现鸣潮房间背景
- [ ] 连接 WebSocket 实时更新

**验收**：浏览器能看到像素风角色在房间里，状态实时更新

### Phase 3：鸣潮内容充实（约 2-4 小时）

**目标**：完善鸣潮风格素材和文案

- [ ] 鸣潮风格角色立绘/Sprites
- [ ] 鸣潮风格房间背景和物品
- [ ] 鸣潮风格粒子特效
- [ ] 鸣潮风格语音气泡
- [ ] 鸣潮文案（公司名称、房间描述等）

**验收**：整体视觉风格贴近鸣潮

### Phase 4：Agent 接入（约 2-3 小时）

**目标**：让菲比（OpenClaw）成功接入

- [ ] 在菲比的工作区配置心跳上报
- [ ] 测试菲比实时显示在页面上
- [ ] 编写接入文档（供其他 Agent 参考）

**验收**：菲比的状态能实时显示在页面上

### Phase 5：优化与完善（约 2-4 小时）

**目标**：打磨细节，提升体验

- [ ] 粒子特效增强
- [ ] 动画流畅度优化
- [ ] 移动端适配
- [ ] 鸣潮氛围细节

**验收**：整体体验流畅有沉浸感

---

## 八、部署方案

### 方案 A：本地 CLI（推荐用于自己用）

```bash
# 启动服务器
node server/index.js

# 浏览器打开
open http://localhost:3000
```

### 方案 B：Cloudflare Pages + Workers

- 前端：Cloudflare Pages（静态托管）
- 后端：Cloudflare Workers（HTTP + WebSocket）
- 优点：全球可访问，无需本地运行

### 方案 C：Docker 部署

```bash
docker build -t agent-company .
docker run -p 3000:3000 agent-company
```

---

## 九、风险与注意事项

1. **WebSocket 兼容**：Cloudflare Workers 对 WebSocket 支持需要特定配置
2. **Canvas 性能**：大量 Agent 同时更新时注意渲染性能
3. **素材版权**：鸣潮素材使用已获主人确认
4. **复杂度**：Miniverse 是经过多次迭代的项目，v1 可能功能较简单

---

## 十、相关文档

- `AGENT接入计划书.md` - Agent 如何接入（详细 API 文档）
- `鸣潮化改造计划.md` - 鸣潮化思路初稿
- Miniverse 源码：`/tmp/miniverse/`
