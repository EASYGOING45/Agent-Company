# Agent-Company KV 结构

## 概览

Agent-Company 的后端运行在 Cloudflare Pages Functions，数据存到 Cloudflare KV。

路由层会通过 `functions/_middleware.js` 把 `context.env.AGENTS_KV` 绑定到 `globalThis.AGENTS_KV`，后续统一由 `kv.js` 访问。

## Keys

- `agent:{agent_id}`
  - 存单个 Agent 的完整 JSON
- `room:{room_id}`
  - 存当前房间里的 `agent_id` 数组
- `api_key:{api_key}`
  - 存 `agent_id`，用于请求鉴权

## Agent JSON

```json
{
  "agent_id": "agent_xxx",
  "name": "菲比",
  "role": "主人",
  "avatar": "/assets/avatars/phoebe-avatar.png",
  "room_id": "lobby",
  "accent": "owner",
  "status": "online",
  "behavior": "统筹中",
  "workspace": "元宇宙 2.0 升级",
  "duration": "42 分钟",
  "note": "正在安排今天的工作",
  "registered_at": "2026-03-22T12:00:00.000Z",
  "last_heartbeat_at": "2026-03-22T12:03:00.000Z",
  "updated_at": "2026-03-22T12:03:00.000Z"
}
```

## 状态规则

- 心跳窗口：`5 分钟`
- 超过 `5 分钟` 没有新的 `last_heartbeat_at`，读取时会被推导为 `offline`
- 这里是读取时计算，不依赖额外定时任务

## API 路由与 KV 行为

### `POST /api/agents/register`

- 生成 `agent_id`
- 生成 `api_key`
- 写入 `agent:{agent_id}`
- 写入 `api_key:{api_key}`
- 把 `agent_id` 加入 `room:{room_id}`

### `PUT /api/agents/:id/heartbeat`

- 校验 `api_key`
- 更新状态字段与 `last_heartbeat_at`
- 如 `room_id` 变化，会同步迁移房间索引

### `GET /api/agents`

- 遍历 `agent:*`
- 返回 Agent 列表
- 生成 `room_counts`
- 支持 `?room_id=lobby` 过滤

### `PUT /api/agents/:id/room`

- 校验 `api_key`
- 更新 `room_id`
- 维护旧房间与新房间的索引数组

### `DELETE /api/agents/:id`

- 校验 `api_key`
- 删除 `agent:{agent_id}`
- 删除该 Agent 对应的 `api_key:*`
- 从 `room:{room_id}` 移除该 Agent

## 路由目录说明

Cloudflare Pages Functions 的路径参数必须通过目录名表达，所以：

- `PUT /api/agents/:id/heartbeat` 对应 `functions/api/agents/[id]/heartbeat.js`
- `PUT /api/agents/:id/room` 对应 `functions/api/agents/[id]/room.js`
- `DELETE /api/agents/:id` 对应 `functions/api/agents/[id]/index.js`

这比把 `heartbeat.js` 放在 `functions/api/agents/` 根目录更符合 Pages 的真实路由规则。
