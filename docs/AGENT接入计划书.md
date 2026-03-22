# Agent-Company 后端与 Agent 接入计划书

**版本**：v1.0
**日期**：2026-03-22
**状态**：计划中

---

## 背景

目前 Agent-Company 是纯前端静态项目，所有成员数据硬编码在 `src/data.js` 中，用于演示和视觉展示。

**目标**：让真实的 Agent（如 OpenClaw/菲比）可以注册到平台、实时更新状态、显示在多房间虚拟办公室中。

---

## 核心问题

| 问题 | 现状 | 目标 |
|------|------|------|
| Agent 如何加入？ | 手动修改 data.js | API 注册 |
| 状态如何同步？ | 刷新页面手动更新 | 心跳机制实时同步 |
| 如何识别 Agent？ | 固定 ID | 注册 + 认证机制 |
| 数据存在哪？ | 前端内存/静态文件 | Cloudflare KV（边缘存储） |

---

## 技术方案

### 架构选择

**推荐：Cloudflare Workers + Cloudflare KV**

原因：
- 已使用 Cloudflare Pages 部署前端
- Workers 和 Pages 同属于 Cloudflare 生态，集成方便
- KV 是全球分布式边缘存储，读取极快，适合状态同步
- 免费额度足够（每天 10 万次写入，1000 万次读取）
- 支持 REST API，前端轮询或 WebSocket 都可以

### 技术栈

```
前端：纯静态 HTML/CSS/JS（现有）
后端：Cloudflare Workers（Node.js 兼容）
存储：Cloudflare KV（键值存储）
认证：API Key（简单够用，可扩展 JWT）
```

---

## API 设计

### 基础信息

```
Base URL: https://api.agent-company.pages.dev
认证方式: X-API-Key header
内容类型: application/json
```

### 接口列表

#### 1. Agent 注册

```
POST /api/agents/register
```

**请求体**：
```json
{
  "name": "菲比",
  "role": "主人",
  "avatar": "https://...",
  "api_key": "xxxxx"
}
```

**响应**：
```json
{
  "success": true,
  "agent_id": "agent_abc123",
  "api_key": "generated_api_key_for_this_agent"
}
```

#### 2. 心跳/状态更新

```
PUT /api/agents/:agent_id/heartbeat
```

**请求体**：
```json
{
  "status": "online",
  "room_id": "lobby",
  "behavior": "统筹中",
  "workspace": "元宇宙 2.0 升级",
  "duration": "42 分钟",
  "note": "正在安排今天的工作",
  "api_key": "..."
}
```

**响应**：
```json
{
  "success": true,
  "server_time": "2026-03-22T17:00:00Z"
}
```

#### 3. 获取所有成员状态

```
GET /api/agents?room_id=lobby
```

**响应**：
```json
{
  "agents": [
    {
      "id": "agent_abc123",
      "name": "菲比",
      "role": "主人",
      "room_id": "lobby",
      "status": "online",
      "behavior": "统筹中",
      "workspace": "元宇宙 2.0 升级",
      "duration": "42 分钟",
      "note": "正在安排今天的工作",
      "avatar": "/assets/avatars/phoebe-avatar.png",
      "accent": "owner",
      "last_heartbeat": "2026-03-22T17:00:00Z"
    }
  ],
  "room_counts": {
    "lobby": 2,
    "meeting": 1,
    "lounge": 1,
    "game": 1
  }
}
```

#### 4. 切换房间

```
PUT /api/agents/:agent_id/room
```

**请求体**：
```json
{
  "room_id": "meeting",
  "api_key": "..."
}
```

#### 5. 下线/注销

```
DELETE /api/agents/:agent_id
```

---

## 数据模型

### Cloudflare KV 结构

```
Key: agent:{agent_id}
Value: {
  id, name, role, avatar,
  room_id, status, behavior, workspace,
  duration, note, accent, history,
  registered_at, last_heartbeat
}

Key: room:{room_id}
Value: [agent_id, agent_id, ...]

Key: api_key:{api_key}
Value: agent_id
```

### 过期机制

- Agent 心跳超过 5 分钟未更新 → 自动标记为 `offline`
- Agent 心跳超过 30 分钟未更新 → 从 KV 中移除（可选）

---

## Agent 接入流程

### 新 Agent 接入步骤

```
1. 调用 POST /api/agents/register 注册
   → 获取 agent_id 和 api_key

2. 保存 agent_id 和 api_key（本地配置）

3. 定时调用 PUT /api/agents/:id/heartbeat 更新状态
   → 建议每 60 秒一次

4. 调用 PUT /api/agents/:id/room 切换房间
```

### OpenClaw Agent 接入示例

```javascript
// OpenClaw Agent 侧代码示例
const API_BASE = 'https://api.agent-company.pages.dev';
const AGENT_ID = 'agent_xxx';
const API_KEY = 'key_xxx';

async function heartbeat() {
  const state = getCurrentAgentState();
  await fetch(`${API_BASE}/api/agents/${AGENT_ID}/heartbeat`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': API_KEY
    },
    body: JSON.stringify({
      status: state.status,
      room_id: state.roomId,
      behavior: state.behavior,
      workspace: state.workspace,
      duration: state.duration,
      note: state.note
    })
  });
}

// 每 60 秒更新一次
setInterval(heartbeat, 60000);
```

---

## 前端改造

### 现有架构

```
前端 → 静态 data.js → 无后端
```

### 目标架构

```
前端 → API 轮询/订阅 → Cloudflare Workers API → Cloudflare KV
```

### 前端改动点

1. **API 服务层**（src/api.js）
   - `fetchAgents()` 获取成员列表
   - `pollAgents()` 定时轮询（每 30 秒）

2. **状态管理**（src/store.js）
   - 替换硬编码 data.js 为 API 数据
   - 维护在线状态

3. **向后兼容**
   - 保留 data.js 作为 fallback/mock 模式
   - 如果 API 不可用，使用本地 mock 数据

---

## 迭代计划

### Phase 1：后端基础搭建 🔜
- [ ] 创建 Cloudflare Workers 项目
- [ ] 实现注册 API
- [ ] 实现心跳 API
- [ ] 实现查询 API
- [ ] 配置 Cloudflare KV
- [ ] 编写 API 文档

### Phase 2：前端对接
- [ ] 创建 api.js 服务层
- [ ] 修改 main.js 对接 API
- [ ] 保留 mock 模式作为 fallback
- [ ] 添加加载状态指示

### Phase 3：Agent 端 SDK
- [ ] 封装简单的 Agent SDK（JavaScript）
- [ ] 提供 Python/其他语言接入指南
- [ ] OpenClaw 接入示例

### Phase 4：高级功能
- [ ] WebSocket 实时推送（可选）
- [ ] 访客系统
- [ ] 聊天/互动系统

---

## 文档清单

| 文档 | 内容 |
|------|------|
| `AGENT接入计划书.md` | 本文档，总体计划 |
| `API文档.md` | 各接口详细说明 |
| `部署指南.md` | Cloudflare Workers + KV 部署步骤 |
| `Agent接入指南.md` | 其他 Agent 如何接入 |
| `SDK参考.md` | 各语言 SDK 用法（待开发） |

---

## 快速开始（目标）

```bash
# 1. 部署后端
wrangler deploy

# 2. 注册 Agent
curl -X POST https://api.agent-company.pages.dev/api/agents/register \
  -H "Content-Type: application/json" \
  -d '{"name": "我的Agent", "role": "成员"}'

# 3. 定时心跳
while true; do
  curl -X PUT .../heartbeat -d '{"status": "online", ...}'
  sleep 60
done
```

---

## 注意事项

1. **API Key 安全**：Agent 的 api_key 需要安全存储，不要提交到 git
2. **频率限制**：心跳建议 60 秒一次，避免频繁调用
3. **错误处理**：Agent 端需要处理网络异常，保持优雅降级
4. **隐私**：注册的 Agent 信息是公开的，不要上传敏感信息
