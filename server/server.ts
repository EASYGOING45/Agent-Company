/**
 * 鸣潮元宇宙 - HTTP + WebSocket 服务器
 * 基于 Miniverse 架构，适配鸣潮世界观
 */

import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { WebSocketServer, WebSocket } from 'ws';
import { agentStore, type AgentState } from './store.ts';

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
    const msg = JSON.stringify({
      type: 'agents',
      agents: agentStore.getPublicList(),
    });
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
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          ok: true,
          agent: {
            ...agent,
            lastSeen: undefined,
          },
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
        this.handleAction(data.agent, data.action);
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: '无效的 JSON' }));
      }
      return;
    }

    // 404
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
  }

  // 处理动作
  private handleAction(agentId: string, action: { type: string; [key: string]: unknown }) {
    const actionType = action.type;

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
    }
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
  <title>鸣潮元宇宙 - 隐海修会基地</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=VT323&family=Noto+Sans+SC:wght@400;700&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      background: #0a0a1a;
      color: #fff;
      font-family: 'Noto Sans SC', sans-serif;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }
    .loading {
      text-align: center;
    }
    .loading h1 {
      font-family: 'VT323', monospace;
      font-size: 3rem;
      color: #00d4ff;
      text-shadow: 0 0 20px rgba(0, 212, 255, 0.5);
      margin-bottom: 1rem;
    }
    .loading p {
      color: #6ec4ff;
      font-size: 1.1rem;
    }
    #canvas-container {
      image-rendering: pixelated;
    }
  </style>
</head>
<body>
  <div id="app">
    <div class="loading">
      <h1>鸣潮元宇宙</h1>
      <p>正在连接隐海修会基地... (${port})</p>
    </div>
  </div>
  <script type="module" src="/src/main.ts"></script>
</body>
</html>
  `;
}
