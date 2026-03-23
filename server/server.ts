/**
 * 鸣潮元宇宙 - HTTP + WebSocket 服务器
 * 基于 Miniverse 架构，适配鸣潮世界观
 */

import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { WebSocketServer, WebSocket } from 'ws';
import { agentStore } from './store.ts';

interface InboxMessage {
  from: string;
  action: { type: string; [key: string]: unknown };
  timestamp: number;
}

// CORS 头
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// 读取请求体
function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks).toString()));
    req.on('error', reject);
  });
}

// 鸣潮元宇宙服务器
export class WuWaServer {
  private httpServer: ReturnType<typeof createServer>;
  private wss: WebSocketServer;
  private port: number;
  private clients: Set<WebSocket> = new Set();
  private inbox: Map<string, InboxMessage[]> = new Map();

  constructor(port = 4321) {
    this.port = port;

    // HTTP 服务器
    this.httpServer = createServer((req, res) => this.handleHttp(req, res));

    // WebSocket 服务器
    this.wss = new WebSocketServer({ server: this.httpServer });

    this.wss.on('connection', (ws) => {
      this.clients.add(ws);
      
      // 发送当前状态
      ws.send(JSON.stringify({
        type: 'agents',
        agents: agentStore.getPublicList(),
      }));

      ws.on('close', () => {
        this.clients.delete(ws);
      });
    });

    // AgentStore 更新时广播
    agentStore.onUpdate(() => this.broadcast());
    agentStore.onStateChange((change, agent) => {
      this.broadcastMessage({
        type: 'agent_state',
        change,
        agent: this.toPublicAgent(agent),
      });
    });
  }

  async start(): Promise<number> {
    agentStore.start();

    return new Promise((resolve, reject) => {
      this.httpServer.on('error', (err: NodeJS.ErrnoException) => {
        if (err.code === 'EADDRINUSE') {
          this.port++;
          this.httpServer.listen(this.port, () => resolve(this.port));
        } else {
          reject(err);
        }
      });
      this.httpServer.listen(this.port, () => resolve(this.port));
    });
  }

  stop() {
    agentStore.stop();
    for (const ws of this.clients) ws.close();
    this.wss.close();
    this.httpServer.close();
  }

  getPort(): number {
    return this.port;
  }

  // 广播状态给所有客户端
  private broadcast() {
    this.broadcastMessage({
      type: 'agents',
      agents: agentStore.getPublicList(),
    });
  }

  private broadcastMessage(payload: Record<string, unknown>) {
    const msg = JSON.stringify(payload);
    for (const ws of this.clients) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(msg);
      }
    }
  }

  // HTTP 路由处理
  private async handleHttp(req: IncomingMessage, res: ServerResponse) {
    const url = new URL(req.url ?? '/', `http://localhost:${this.port}`);

    // CORS
    Object.entries(corsHeaders).forEach(([k, v]) => res.setHeader(k, v));
    
    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    // GET / - 首页
    if (req.method === 'GET' && url.pathname === '/') {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(getFrontendHtml(this.port));
      return;
    }

    // GET /api/info - 服务器信息
    if (req.method === 'GET' && url.pathname === '/api/info') {
      const agents = agentStore.getPublicList();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        wuwa: true,
        version: '2.0.0',
        name: '鸣潮元宇宙 - 隐海修会基地',
        agents: {
          online: agentStore.getOnlineCount(),
          total: agents.length,
        },
        grid: { cols: 16, rows: 12 },
      }));
      return;
    }

    // GET /api/agents - 获取所有 Agent
    if (req.method === 'GET' && url.pathname === '/api/agents') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        total: agentStore.getPublicList().length,
        agents: agentStore.getPublicList(),
      }));
      return;
    }

    // POST /api/heartbeat - Agent 心跳
    if (req.method === 'POST' && url.pathname === '/api/heartbeat') {
      try {
        const body = await readBody(req);
        const data = JSON.parse(body);

        if (!data.agent) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: '缺少 agent 字段' }));
          return;
        }

        const agent = agentStore.heartbeat(data);
        const publicAgent = this.toPublicAgent(agent);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          ok: true,
          agent: publicAgent,
          serverTime: Date.now(),
        }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: '无效的 JSON' }));
      }
      return;
    }

    // POST /api/act - 执行动作
    if (req.method === 'POST' && url.pathname === '/api/act') {
      try {
        const body = await readBody(req);
        const data = JSON.parse(body);

        if (!data.agent || !data.action?.type) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: '缺少 agent 或 action.type' }));
          return;
        }

        // 处理动作
        const result = this.handleAction(data.agent, data.action);
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          ok: true,
          delivered: result.delivered,
          inboxed: result.inboxed,
        }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: '无效的 JSON' }));
      }
      return;
    }

    // GET /api/inbox - 返回消息收件箱
    if (req.method === 'GET' && url.pathname === '/api/inbox') {
      const agentId = url.searchParams.get('agent');
      if (!agentId) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: '缺少 agent 查询参数' }));
        return;
      }

      const messages = this.drainInbox(agentId);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        agent: agentId,
        messages,
      }));
      return;
    }

    // 404
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
  }

  // 处理动作
  private handleAction(agentId: string, action: { type: string; [key: string]: unknown }) {
    const actionType = action.type;
    let inboxed = 0;

    this.broadcastMessage({
      type: 'action',
      agent: agentId,
      action,
      timestamp: Date.now(),
    });

    if (actionType === 'speak' && typeof action.message === 'string') {
      // 说话 - 更新状态为 speaking
      agentStore.heartbeat({
        agent: agentId,
        state: 'speaking',
        task: action.message as string,
      });
    } else if (actionType === 'move' && typeof action.to === 'string') {
      // 移动到其他房间
      agentStore.heartbeat({
        agent: agentId,
        room: action.to as string,
      });
    } else if (actionType === 'status') {
      // 更新状态
      agentStore.heartbeat({
        agent: agentId,
        state: action.state as string | undefined,
        task: action.task as string | null | undefined,
        energy: action.energy as number | undefined,
      });
    } else if (actionType === 'message') {
      inboxed = this.queueInbox(agentId, action);
    }

    return {
      delivered: true,
      inboxed,
    };
  }

  private queueInbox(from: string, action: { type: string; [key: string]: unknown }): number {
    const recipients = this.extractRecipients(action);
    const timestamp = Date.now();

    for (const recipient of recipients) {
      const queue = this.inbox.get(recipient) ?? [];
      queue.push({ from, action, timestamp });
      if (queue.length > 100) {
        queue.shift();
      }
      this.inbox.set(recipient, queue);
    }

    return recipients.length;
  }

  private extractRecipients(action: { type: string; [key: string]: unknown }): string[] {
    const raw = action.to ?? action.agent ?? action.targets;
    if (typeof raw === 'string') return [raw];
    if (Array.isArray(raw)) {
      return raw.filter((value): value is string => typeof value === 'string');
    }
    return [];
  }

  private drainInbox(agentId: string): InboxMessage[] {
    const messages = this.inbox.get(agentId) ?? [];
    this.inbox.delete(agentId);
    return messages;
  }

  private toPublicAgent(agent: ReturnType<typeof agentStore.heartbeat>) {
    const { lastSeen, ...rest } = agent;
    return rest;
  }
}

// 前端 HTML 模板
function getFrontendHtml(port: number): string {
  return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>鸣潮元宇宙后端</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: radial-gradient(circle at top, rgba(100, 213, 255, 0.15), transparent 32%), #050816;
      color: #eaf3ff;
      font-family: system-ui, sans-serif;
      min-height: 100vh;
      display: grid;
      place-items: center;
      padding: 24px;
    }
    .panel {
      max-width: 720px;
      padding: 24px;
      border-radius: 20px;
      background: rgba(11, 18, 38, 0.92);
      border: 1px solid rgba(100, 213, 255, 0.18);
      box-shadow: 0 24px 80px rgba(0, 0, 0, 0.35);
    }
    h1 {
      font-size: 2rem;
      color: #64d5ff;
      margin-bottom: 12px;
    }
    p, li {
      line-height: 1.6;
      color: rgba(234, 243, 255, 0.78);
    }
    ul {
      margin: 16px 0 0 18px;
    }
    code { color: #f3c56b; }
  </style>
</head>
<body>
  <main class="panel">
    <h1>鸣潮元宇宙后端已启动</h1>
    <p>当前端口: <code>${port}</code></p>
    <ul>
      <li>前端开发环境请使用 Vite: <code>http://localhost:5173</code></li>
      <li>API: <code>GET /api/info</code>, <code>GET /api/agents</code>, <code>POST /api/heartbeat</code></li>
      <li>WebSocket: <code>ws://localhost:${port}</code></li>
    </ul>
  </main>
</body>
</html>
  `;
}
