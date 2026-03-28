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

export interface AgentStateChange {
  agent: string;
  previousState: string | null;
  currentState: string;
  timestamp: number;
  reason: 'heartbeat' | 'timeout';
}

export class AgentStore {
  private agents: Map<string, AgentState> = new Map();
  private listeners: Set<(agents: AgentState[]) => void> = new Set();
  private stateListeners: Set<(change: AgentStateChange, agent: AgentState) => void> = new Set();
  private sweepInterval: ReturnType<typeof setInterval> | null = null;
  private sleepingTimeout: number;
  private offlineTimeout: number;

  constructor(offlineTimeout = 30000) { // 30秒休眠，60秒离线
    this.sleepingTimeout = offlineTimeout;
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
    const previousState = existing?.state ?? null;
    const isWakingUp = previousState === 'sleeping' || previousState === 'offline';
    const nextState = data.state ?? (isWakingUp ? 'idle' : existing?.state ?? 'idle');
    const now = Date.now();

    const agent: AgentState = {
      agent: data.agent,
      name: data.name ?? existing?.name ?? data.agent,
      state: nextState,
      task: data.task !== undefined ? data.task : (isWakingUp ? null : (existing?.task ?? null)),
      energy: data.energy ?? existing?.energy ?? 1,
      metadata: data.metadata ?? existing?.metadata ?? {},
      lastSeen: now,
      color: data.color ?? existing?.color,
      room: data.room ?? existing?.room ?? 'lobby',
      role: data.role ?? existing?.role ?? 'member',
    };

    this.agents.set(data.agent, agent);
    if (previousState !== agent.state) {
      this.notifyStateChange(previousState, agent, 'heartbeat', now);
    }
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

  onStateChange(listener: (change: AgentStateChange, agent: AgentState) => void) {
    this.stateListeners.add(listener);
    return () => this.stateListeners.delete(listener);
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
  sweepOnce(now = Date.now()) {
    let changed = false;

    for (const agent of this.agents.values()) {
      const elapsed = now - agent.lastSeen;
      const previousState = agent.state;

      // 60秒无心跳 → offline
      if (agent.state !== 'offline' && elapsed >= this.offlineTimeout * 2) {
        agent.state = 'offline';
        agent.task = null;
        changed = true;
      }
      // 30秒无心跳 → sleeping
      else if (agent.state !== 'offline' && agent.state !== 'sleeping' && elapsed >= this.sleepingTimeout) {
        agent.state = 'sleeping';
        agent.task = '休眠中...';
        changed = true;
      }

      if (previousState !== agent.state) {
        this.notifyStateChange(previousState, agent, 'timeout', now);
      }
    }

    if (changed) this.notify();
    return changed;
  }

  private sweep() {
    return this.sweepOnce();
  }

  private notifyStateChange(
    previousState: string | null,
    agent: AgentState,
    reason: AgentStateChange['reason'],
    timestamp: number,
  ) {
    const change: AgentStateChange = {
      agent: agent.agent,
      previousState,
      currentState: agent.state,
      timestamp,
      reason,
    };

    for (const listener of this.stateListeners) {
      listener(change, agent);
    }
  }
}

// 单例导出
export const agentStore = new AgentStore();
