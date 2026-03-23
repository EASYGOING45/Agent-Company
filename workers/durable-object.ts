import type { AgentStateChange } from '../server/store.ts';

export interface AgentState {
  agent: string;
  name: string;
  state: string;
  task: string | null;
  energy: number;
  metadata: Record<string, unknown>;
  lastSeen: number;
  color?: string;
  room?: string;
  role?: string;
  faction?: string;
}

interface HeartbeatPayload {
  agent: string;
  name?: string;
  state?: string;
  task?: string | null;
  energy?: number;
  metadata?: Record<string, unknown>;
  color?: string;
  room?: string;
  role?: string;
  faction?: string;
}

const JSON_HEADERS = {
  'content-type': 'application/json; charset=utf-8',
};

export class AgentStateDurableObject {
  private agents = new Map<string, AgentState>();
  private readonly sleepingTimeout = 30_000;
  private readonly offlineTimeout = 30_000;
  private readonly initialized: Promise<void>;

  constructor(private readonly state: DurableObjectState) {
    this.initialized = this.state.blockConcurrencyWhile(async () => {
      const persisted = await this.state.storage.get<AgentState[]>('agents');
      if (!persisted) return;
      for (const agent of persisted) {
        this.agents.set(agent.agent, agent);
      }
    });
  }

  async fetch(request: Request): Promise<Response> {
    await this.initialized;
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204 });
    }

    if (this.isWebSocketUpgrade(request) && this.isWebSocketPath(url.pathname)) {
      return this.handleWebSocketUpgrade();
    }

    if (request.method === 'GET' && url.pathname === '/api/agents') {
      return this.json({
        total: this.getPublicList().length,
        agents: this.getPublicList(),
      });
    }

    if (request.method === 'POST' && url.pathname === '/api/heartbeat') {
      const data = (await request.json()) as HeartbeatPayload;
      if (!data.agent) {
        return this.json({ error: '缺少 agent 字段' }, 400);
      }

      const agent = this.heartbeat(data);
      return this.json({
        ok: true,
        agent: this.toPublicAgent(agent),
        serverTime: Date.now(),
      });
    }

    return this.json({ error: 'Not found' }, 404);
  }

  async alarm(): Promise<void> {
    await this.initialized;
    const changed = this.sweep();
    if (changed) {
      await this.persist();
      await this.broadcastAgents();
    }

    if (this.agents.size > 0 || this.state.getWebSockets().length > 0) {
      await this.state.setAlarm(Date.now() + 5_000);
    }
  }

  webSocketMessage(_webSocket: WebSocket, message: string | ArrayBuffer): void {
    const raw = typeof message === 'string' ? message : new TextDecoder().decode(message);

    try {
      const data = JSON.parse(raw) as {
        type?: string;
        agent?: string;
        action?: {
          type?: string;
          state?: string;
          task?: string | null;
          energy?: number;
          room?: string;
          region?: string;
        };
      };

      if (data.type === 'action' && data.action?.type === 'status' && data.agent) {
        this.heartbeat({
          agent: data.agent,
          state: data.action.state,
          task: data.action.task,
          energy: data.action.energy,
          room: data.action.room ?? data.action.region,
        });
        return;
      }

      if (data.type === 'action' && data.action?.type === 'move' && data.agent) {
        this.heartbeat({
          agent: data.agent,
          room: data.action.room ?? data.action.region,
        });
      }
    } catch {
      // Ignore malformed client messages and keep the socket open.
    }
  }

  private heartbeat(data: HeartbeatPayload): AgentState {
    const existing = this.agents.get(data.agent);
    const previousState = existing?.state ?? null;
    const isWakingUp = previousState === 'sleeping' || previousState === 'offline';
    const nextState = data.state ?? (isWakingUp ? 'idle' : existing?.state ?? 'idle');
    const now = Date.now();

    const agent: AgentState = {
      agent: data.agent,
      name: data.name ?? existing?.name ?? data.agent,
      state: nextState,
      task: data.task !== undefined ? data.task : (isWakingUp ? null : existing?.task ?? null),
      energy: data.energy ?? existing?.energy ?? 1,
      metadata: data.metadata ?? existing?.metadata ?? {},
      lastSeen: now,
      color: data.color ?? existing?.color,
      room: data.room ?? existing?.room ?? 'rinascita',
      role: data.role ?? existing?.role ?? 'member',
      faction: data.faction ?? existing?.faction,
    };

    this.agents.set(agent.agent, agent);
    void this.persist();
    void this.state.setAlarm(Date.now() + 5_000);

    if (previousState !== agent.state) {
      const change: AgentStateChange = {
        agent: agent.agent,
        previousState,
        currentState: agent.state,
        timestamp: now,
        reason: 'heartbeat',
      };
      void this.broadcast({
        type: 'agent_state',
        change,
        agent: this.toPublicAgent(agent),
      });
    }

    void this.broadcastAgents();
    return agent;
  }

  private sweep(): boolean {
    const now = Date.now();
    let changed = false;

    for (const agent of this.agents.values()) {
      const elapsed = now - agent.lastSeen;
      const previousState = agent.state;

      if (agent.state !== 'offline' && agent.state !== 'sleeping' && elapsed >= this.sleepingTimeout) {
        agent.state = 'sleeping';
        agent.task = '休眠中...';
        changed = true;
      } else if (agent.state !== 'offline' && elapsed >= this.offlineTimeout * 2) {
        agent.state = 'offline';
        agent.task = null;
        changed = true;
      }

      if (previousState !== agent.state) {
        const change: AgentStateChange = {
          agent: agent.agent,
          previousState,
          currentState: agent.state,
          timestamp: now,
          reason: 'timeout',
        };
        void this.broadcast({
          type: 'agent_state',
          change,
          agent: this.toPublicAgent(agent),
        });
      }
    }

    return changed;
  }

  private async handleWebSocketUpgrade(): Promise<Response> {
    const pair = new WebSocketPair();
    const client = pair[0];
    const server = pair[1];

    this.state.acceptWebSocket(server);
    server.send(JSON.stringify({
      type: 'agents',
      agents: this.getPublicList(),
    }));

    return new Response(null, {
      status: 101,
      webSocket: client,
    } as ResponseInit);
  }

  private getPublicList(): Array<Omit<AgentState, 'lastSeen'>> {
    return [...this.agents.values()].map(({ lastSeen, ...agent }) => agent);
  }

  private toPublicAgent(agent: AgentState): Omit<AgentState, 'lastSeen'> {
    const { lastSeen, ...publicAgent } = agent;
    return publicAgent;
  }

  private async persist(): Promise<void> {
    await this.state.storage.put('agents', [...this.agents.values()]);
  }

  private async broadcastAgents(): Promise<void> {
    await this.broadcast({
      type: 'agents',
      agents: this.getPublicList(),
    });
  }

  private async broadcast(payload: Record<string, unknown>): Promise<void> {
    const message = JSON.stringify(payload);
    for (const socket of this.state.getWebSockets()) {
      try {
        socket.send(message);
      } catch {
        try {
          socket.close(1011, 'broadcast failed');
        } catch {
          // Ignore close failures.
        }
      }
    }
  }

  private isWebSocketUpgrade(request: Request): boolean {
    return request.headers.get('Upgrade')?.toLowerCase() === 'websocket';
  }

  private isWebSocketPath(pathname: string): boolean {
    return pathname === '/' || pathname === '/ws' || pathname === '/api/ws';
  }

  private json(body: unknown, status = 200): Response {
    return new Response(JSON.stringify(body), {
      status,
      headers: JSON_HEADERS,
    });
  }
}
