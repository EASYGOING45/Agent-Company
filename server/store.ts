/**
 * 鸣潮元宇宙 - AgentStore
 * 基于 Miniverse 的内存状态管理，适配鸣潮世界观
 */

export interface AgentState {
  agent: string;           // Agent ID
  name: string;            // 显示名称
  state: string;           // 状态: working/idle/thinking/sleeping/error/speaking/offline
  task: string | null;     // 当前任务
  energy: number;          // 能量值 0-1
  metadata: Record<string, unknown>;
  lastSeen: number;        // 上次心跳时间戳
  color?: string;          // 主题色
  room?: string;           // 所在房间
  role?: string;           // 角色: owner/member/guest
}

export class AgentStore {
  private agents: Map<string, AgentState> = new Map();
  private offlineTimeout: number;
  private listeners: Set<(agents: AgentState[]) => void> = new Set();
  private sweepInterval: ReturnType<typeof setInterval> | null = null;

  constructor(offlineTimeout = 30000) { // 30秒超时
    this.offlineTimeout = offlineTimeout;
  }

  start() {
    // 每5秒扫描一次离线Agent
    this.sweepInterval = setInterval(() => this.sweep(), 5000);
  }

  stop() {
    if (this.sweepInterval) {
      clearInterval(this.sweepInterval);
      this.sweepInterval = null;
    }
  }

  /**
   * Agent 心跳上报
   */
  heartbeat(data: {
    agent: string;
    name?: string;
    state?: string;
    task?: string | null;
    energy?: number;
    metadata?: Record<string, unknown>;
    color?: string;
    room?: string;
    role?: string;
  }): AgentState {
    const existing = this.agents.get(data.agent);

    const agent: AgentState = {
      agent: data.agent,
      name: data.name ?? existing?.name ?? data.agent,
      state: data.state ?? existing?.state ?? 'idle',
      task: data.task !== undefined ? data.task : (existing?.task ?? null),
      energy: data.energy ?? existing?.energy ?? 1,
      metadata: data.metadata ?? existing?.metadata ?? {},
      lastSeen: Date.now(),
      color: data.color ?? existing?.color,
      room: data.room ?? existing?.room ?? 'lobby',
      role: data.role ?? existing?.role ?? 'member',
    };

    this.agents.set(data.agent, agent);
    this.notify();
    return agent;
  }

  remove(agentId: string) {
    this.agents.delete(agentId);
    this.notify();
  }

  get(agentId: string): AgentState | undefined {
    return this.agents.get(agentId);
  }

  getAll(): AgentState[] {
    return Array.from(this.agents.values());
  }

  /**
   * 获取公开列表（移除 lastSeen 敏感信息）
   */
  getPublicList(): Omit<AgentState, 'lastSeen'>[] {
    return this.getAll().map(({ lastSeen, ...rest }) => rest);
  }

  /**
   * 获取在线Agent数量
   */
  getOnlineCount(): number {
    return this.getAll().filter(a => a.state !== 'offline').length;
  }

  onUpdate(listener: (agents: AgentState[]) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    const agents = this.getAll();
    for (const listener of this.listeners) {
      listener(agents);
    }
  }

  /**
   * 扫描离线Agent
   * 30秒无心跳 → sleeping
   * 60秒无心跳 → offline
   */
  private sweep() {
    const now = Date.now();
    let changed = false;

    for (const [id, agent] of this.agents) {
      const elapsed = now - agent.lastSeen;
      
      // 30秒无心跳 → sleeping
      if (agent.state !== 'offline' && agent.state !== 'sleeping' && elapsed > this.offlineTimeout) {
        agent.state = 'sleeping';
        agent.task = '休眠中...';
        changed = true;
      } 
      // 再30秒（共60秒）→ offline
      else if (agent.state === 'sleeping' && elapsed > this.offlineTimeout * 2) {
        agent.state = 'offline';
        agent.task = null;
        changed = true;
      }
    }

    if (changed) this.notify();
  }
}

// 单例导出
export const agentStore = new AgentStore();
