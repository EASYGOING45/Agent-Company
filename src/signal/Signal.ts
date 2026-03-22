/**
 * 鸣潮元宇宙 - WebSocket 信号系统
 * 连接后端，实时同步 Agent 状态
 */

export interface AgentStatus {
  id: string;
  name: string;
  state: string;
  task: string | null;
  energy: number;
  color?: string;
  room?: string;
  role?: string;
}

export interface SignalConfig {
  url: string;
  reconnectInterval?: number;
}

type AgentUpdateCallback = (agents: AgentStatus[]) => void;
type EventCallback = (event: { agentId: string; action: { type: string; [key: string]: unknown } }) => void;

export class Signal {
  private config: SignalConfig;
  private ws: WebSocket | null = null;
  private agents: AgentStatus[] = [];
  private updateListeners: Set<AgentUpdateCallback> = new Set();
  private eventListeners: Set<EventCallback> = new Set();
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private isRunning = false;

  constructor(config: SignalConfig) {
    this.config = {
      reconnectInterval: 5000,
      ...config,
    };
  }

  start() {
    this.isRunning = true;
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
  }

  private connect() {
    if (!this.isRunning) return;

    try {
      this.ws = new WebSocket(this.config.url);

      this.ws.onopen = () => {
        console.log('[WuWa Signal] 已连接到隐海修会基地');
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleMessage(data);
        } catch (err) {
          console.error('[WuWa Signal] 消息解析失败:', err);
        }
      };

      this.ws.onclose = () => {
        console.log('[WuWa Signal] 连接断开，准备重连...');
        this.scheduleReconnect();
      };

      this.ws.onerror = (err) => {
        console.error('[WuWa Signal] WebSocket 错误:', err);
      };
    } catch (err) {
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
      console.log('[WuWa Signal] 尝试重连...');
      this.connect();
    }, this.config.reconnectInterval);
  }

  private handleMessage(data: any) {
    if (data.type === 'agents') {
      this.agents = data.agents || [];
      for (const listener of this.updateListeners) {
        listener(this.agents);
      }
    } else if (data.type === 'event') {
      for (const listener of this.eventListeners) {
        listener(data.event);
      }
    }
  }

  onUpdate(callback: AgentUpdateCallback) {
    this.updateListeners.add(callback);
    return () => this.updateListeners.delete(callback);
  }

  onEvent(callback: EventCallback) {
    this.eventListeners.add(callback);
    return () => this.eventListeners.delete(callback);
  }

  getAgents(): AgentStatus[] {
    return [...this.agents];
  }

  /**
   * 发送心跳（用于直接 WebSocket 连接的 Agent）
   */
  sendHeartbeat(agentId: string, state: string, task?: string) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'action',
        agent: agentId,
        action: { type: 'status', state, task },
      }));
    }
  }
}
