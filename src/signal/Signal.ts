/**
 * 鸣潮元宇宙 - WebSocket 信号系统
 * 兼容 Cloudflare Workers Durable Objects 与旧版本地服务。
 */

export interface AgentStatus {
  id?: string;
  agent: string;
  name: string;
  state: string;
  task: string | null;
  energy: number;
  color?: string;
  room?: string;
  region?: string;
  role?: string;
  faction?: string;
}

export interface SignalConfig {
  url: string;
  reconnectInterval?: number;
  agentsUrl?: string;
  heartbeatUrl?: string;
  websocketPath?: string;
}

export type ConnectionState = 'idle' | 'connecting' | 'connected' | 'reconnecting' | 'disconnected' | 'error';

type AgentUpdateCallback = (agents: AgentStatus[]) => void;
type EventCallback = (event: { agentId?: string; action?: { type: string; [key: string]: unknown } }) => void;
type ConnectionStateCallback = (state: ConnectionState) => void;

export class Signal {
  private config: Required<Pick<SignalConfig, 'reconnectInterval'>> & SignalConfig;
  private ws: WebSocket | null = null;
  private agents: AgentStatus[] = [];
  private updateListeners: Set<AgentUpdateCallback> = new Set();
  private eventListeners: Set<EventCallback> = new Set();
  private connectionListeners: Set<ConnectionStateCallback> = new Set();
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private isRunning = false;
  private connectionState: ConnectionState = 'idle';

  constructor(config: SignalConfig) {
    this.config = {
      reconnectInterval: 5000,
      websocketPath: '/ws',
      ...config,
    };
  }

  start() {
    this.isRunning = true;
    void this.fetchInitialAgents();
    this.connect();
  }

  stop() {
    this.isRunning = false;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.setConnectionState('disconnected');
  }

  private async fetchInitialAgents() {
    if (!this.config.agentsUrl) return;

    try {
      const response = await fetch(this.config.agentsUrl);
      if (!response.ok) return;
      const payload = await response.json();
      const agents = Array.isArray(payload.agents) ? payload.agents : [];
      this.agents = agents.map((agent: unknown) => this.normalizeAgent(agent as Record<string, unknown>));
      this.notifyAgents();
    } catch (error) {
      console.warn('[WuWa Signal] 初始 agents 拉取失败:', error);
    }
  }

  private connect() {
    if (!this.isRunning) return;

    try {
      this.setConnectionState(this.connectionState === 'connected' ? 'reconnecting' : 'connecting');
      this.ws = new WebSocket(this.resolveWebSocketUrl());

      this.ws.onopen = () => {
        this.setConnectionState('connected');
        console.log('[WuWa Signal] 已连接到索拉里斯大陆同步网');
      };

      this.ws.onmessage = (event) => {
        try {
          const raw = typeof event.data === 'string' ? event.data : '';
          const data = JSON.parse(raw);
          this.handleMessage(data);
        } catch (err) {
          console.error('[WuWa Signal] 消息解析失败:', err);
        }
      };

      this.ws.onclose = () => {
        this.ws = null;
        this.setConnectionState(this.isRunning ? 'reconnecting' : 'disconnected');
        console.log('[WuWa Signal] 连接断开，准备重连...');
        this.scheduleReconnect();
      };

      this.ws.onerror = (err) => {
        this.setConnectionState('error');
        console.error('[WuWa Signal] WebSocket 错误:', err);
      };
    } catch (err) {
      this.setConnectionState('error');
      console.error('[WuWa Signal] 连接失败:', err);
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (!this.isRunning) return;

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    this.reconnectTimer = setTimeout(() => {
      void this.fetchInitialAgents();
      console.log('[WuWa Signal] 尝试重连...');
      this.connect();
    }, this.config.reconnectInterval);
  }

  private handleMessage(data: any) {
    if (data.type === 'agents') {
      const agents = Array.isArray(data.agents) ? data.agents : [];
      this.agents = agents.map((agent: unknown) => this.normalizeAgent(agent as Record<string, unknown>));
      this.notifyAgents();
      return;
    }

    if (data.type === 'event' || data.type === 'action' || data.type === 'agent_state') {
      for (const listener of this.eventListeners) {
        listener(data.event ?? data);
      }
    }
  }

  private notifyAgents() {
    for (const listener of this.updateListeners) {
      listener(this.agents);
    }
  }

  private normalizeAgent(agent: Record<string, unknown>): AgentStatus {
    const agentId = String(agent.agent ?? agent.agent_id ?? agent.id ?? '');
    return {
      id: typeof agent.id === 'string' ? agent.id : agentId,
      agent: agentId,
      name: String(agent.name ?? agentId),
      state: String(agent.state ?? agent.status ?? 'idle'),
      task: typeof agent.task === 'string'
        ? agent.task
        : typeof agent.behavior === 'string'
          ? agent.behavior
          : null,
      energy: typeof agent.energy === 'number' ? agent.energy : 1,
      color: typeof agent.color === 'string'
        ? agent.color
        : typeof agent.accent === 'string'
          ? agent.accent
          : undefined,
      room: typeof agent.room === 'string'
        ? agent.room
        : typeof agent.room_id === 'string'
          ? agent.room_id
          : undefined,
      region: typeof agent.region === 'string'
        ? agent.region
        : typeof agent.room === 'string'
          ? agent.room
          : typeof agent.room_id === 'string'
            ? agent.room_id
            : undefined,
      role: typeof agent.role === 'string' ? agent.role : undefined,
      faction: typeof agent.faction === 'string' ? agent.faction : undefined,
    };
  }

  onUpdate(callback: AgentUpdateCallback) {
    this.updateListeners.add(callback);
    return () => this.updateListeners.delete(callback);
  }

  onEvent(callback: EventCallback) {
    this.eventListeners.add(callback);
    return () => this.eventListeners.delete(callback);
  }

  onConnectionStateChange(callback: ConnectionStateCallback) {
    this.connectionListeners.add(callback);
    callback(this.connectionState);
    return () => this.connectionListeners.delete(callback);
  }

  getAgents(): AgentStatus[] {
    return [...this.agents];
  }

  getConnectionState(): ConnectionState {
    return this.connectionState;
  }

  async sendHeartbeat(agentId: string, state: string, task?: string, extra: Record<string, unknown> = {}) {
    const payload = {
      agent: agentId,
      state,
      task,
      ...extra,
    };

    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'action',
        agent: agentId,
        action: { type: 'status', state, task, ...extra },
      }));
      return;
    }

    if (!this.config.heartbeatUrl) return;

    await fetch(this.config.heartbeatUrl, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    });
  }

  private resolveWebSocketUrl(): string {
    const url = new URL(this.config.url, window.location.href);

    if (url.protocol === 'http:') {
      url.protocol = 'ws:';
    } else if (url.protocol === 'https:') {
      url.protocol = 'wss:';
    }

    if ((url.pathname === '/' || url.pathname === '') && this.config.websocketPath) {
      url.pathname = this.config.websocketPath;
    }

    return url.toString();
  }

  private setConnectionState(state: ConnectionState) {
    if (this.connectionState === state) return;
    this.connectionState = state;
    for (const listener of this.connectionListeners) {
      listener(state);
    }
  }
}
