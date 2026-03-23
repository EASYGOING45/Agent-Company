// @ts-nocheck

import { createWebSocketResponse, jsonResponse, readJson, safeSend } from './websocket';

const OFFLINE_TIMEOUT_MS = 30_000;
const SLEEPING_TIMEOUT_MS = 15_000;

function nowIso() {
  return new Date().toISOString();
}

function clean(value, fallback = '') {
  return typeof value === 'string' ? value.trim() : fallback;
}

function createToken(prefix) {
  return `${prefix}${crypto.randomUUID().replace(/-/g, '')}`;
}

function normalizeRegion(value) {
  const raw = clean(value);
  if (raw === 'huanglong' || raw === 'blackshores' || raw === 'rinascita' || raw === 'frontier') {
    return raw;
  }
  if (raw.startsWith('huanglong_')) return 'huanglong';
  if (raw.startsWith('blackshores_')) return 'blackshores';
  if (raw.startsWith('rinascita_')) return 'rinascita';
  return raw ? 'frontier' : 'rinascita';
}

export class AgentWorldDurableObject {
  constructor(state, env) {
    this.state = state;
    this.env = env;
    this.sessions = new Map();
    this.ready = this.load();
    this.state.getWebSockets().forEach((socket) => {
      const meta = socket.deserializeAttachment() || { id: crypto.randomUUID() };
      this.sessions.set(meta.id, socket);
    });
  }

  async load() {
    const stored = (await this.state.storage.get('state')) || {};
    this.agents = new Map(Object.entries(stored.agents || {}));
    this.apiKeys = new Map(Object.entries(stored.apiKeys || {}));
    this.inbox = new Map(
      Object.entries(stored.inbox || {}).map(([key, value]) => [key, Array.isArray(value) ? value : []])
    );
  }

  async persist() {
    await this.state.storage.put('state', {
      agents: Object.fromEntries(this.agents),
      apiKeys: Object.fromEntries(this.apiKeys),
      inbox: Object.fromEntries(this.inbox),
    });
  }

  async fetch(request) {
    await this.ready;
    await this.sweepAgents();

    const url = new URL(request.url);
    const path = url.pathname;

    if (path === '/api/ws') {
      return this.handleWebSocket(request);
    }

    if (request.method === 'GET' && path === '/api/agents') {
      const roomId = url.searchParams.get('room_id') || '';
      const region = url.searchParams.get('region') || '';
      return jsonResponse(this.listAgents(roomId || region));
    }

    if (request.method === 'POST' && path === '/api/heartbeat') {
      const body = await readJson(request);
      if (!body.agent) {
        return jsonResponse({ success: false, error: 'agent is required' }, { status: 400 });
      }
      const agent = this.upsertHeartbeat(body);
      await this.persist();
      this.broadcastAgents();
      return jsonResponse({
        ok: true,
        success: true,
        agent,
        serverTime: Date.now(),
      });
    }

    if (request.method === 'POST' && path === '/api/agents/register') {
      const body = await readJson(request);
      const result = this.registerAgent(body);
      await this.persist();
      this.broadcastAgents();
      return jsonResponse({
        success: true,
        agent_id: result.agent.agent_id,
        api_key: result.apiKey,
      });
    }

    if (request.method === 'POST' && path === '/api/act') {
      const body = await readJson(request);
      const result = this.handleAction(body.agent, body.action || {});
      await this.persist();
      this.broadcastAgents();
      return jsonResponse({ ok: true, ...result });
    }

    if (request.method === 'GET' && path === '/api/inbox') {
      const agentId = url.searchParams.get('agent');
      if (!agentId) {
        return jsonResponse({ error: '缺少 agent 查询参数' }, { status: 400 });
      }
      const messages = this.inbox.get(agentId) || [];
      this.inbox.delete(agentId);
      await this.persist();
      return jsonResponse({ agent: agentId, messages });
    }

    const match = path.match(/^\/api\/agents\/([^/]+)(?:\/(heartbeat|room))?$/);
    if (match) {
      const agentId = decodeURIComponent(match[1]);
      const action = match[2];
      if (request.method === 'DELETE' && !action) {
        return this.deleteAgent(agentId, request);
      }
      if (request.method === 'PUT' && action === 'heartbeat') {
        return this.heartbeatWithApiKey(agentId, request);
      }
      if (request.method === 'GET' && action === 'room') {
        const agent = this.agents.get(agentId);
        if (!agent) return jsonResponse({ error: 'Agent not found.' }, { status: 404 });
        return jsonResponse({ room_id: agent.room_id, region: agent.region });
      }
    }

    if (request.method === 'GET' && path === '/api/info') {
      const agents = this.getPublicAgents();
      return jsonResponse({
        wuwa: true,
        version: '3.0.0',
        name: '鸣潮元宇宙 - 索拉里斯大陆',
        agents: {
          online: agents.filter((agent) => agent.state !== 'offline').length,
          total: agents.length,
        },
        grid: { cols: 16, rows: 12 },
        deployment: 'cloudflare-workers-durable-objects',
      });
    }

    return jsonResponse({ error: 'Not found' }, { status: 404 });
  }

  async alarm() {
    await this.ready;
    await this.sweepAgents();
    await this.persist();
    this.broadcastAgents();
  }

  async webSocketMessage(ws, message) {
    try {
      const data = JSON.parse(typeof message === 'string' ? message : message.toString());
      if (data.type === 'action') {
        this.handleAction(data.agent, data.action || {});
        await this.persist();
        this.broadcastAgents();
      }
    } catch (_error) {
      safeSend(ws, { type: 'event', event: { type: 'error', message: 'invalid_json' } });
    }
  }

  webSocketClose(ws) {
    for (const [id, socket] of this.sessions.entries()) {
      if (socket === ws) {
        this.sessions.delete(id);
        break;
      }
    }
  }

  async handleWebSocket(request) {
    const upgrade = request.headers.get('Upgrade');
    if (upgrade !== 'websocket') {
      return jsonResponse({ error: 'Expected websocket' }, { status: 426 });
    }

    const { server, response } = createWebSocketResponse();
    const attachment = { id: crypto.randomUUID() };
    server.serializeAttachment(attachment);
    this.sessions.set(attachment.id, server);
    safeSend(server, { type: 'agents', agents: this.getPublicAgents() });
    return response;
  }

  registerAgent(input) {
    const name = clean(input.name);
    const role = clean(input.role, 'member');
    const avatar = clean(input.avatar, 'resonator');
    const roomId = normalizeRegion(input.room_id || input.region);
    const accent = clean(input.accent, '#64d5ff');

    if (!name) {
      throw new Error('name is required.');
    }

    const agentId = createToken('agent_');
    const apiKey = createToken('ak_');
    const timestamp = nowIso();
    const agent = {
      agent_id: agentId,
      agent: agentId,
      id: agentId,
      name,
      role,
      avatar,
      room_id: roomId,
      region: roomId,
      room: roomId,
      color: accent,
      accent,
      state: 'idle',
      status: 'online',
      behavior: clean(input.behavior, '已注册'),
      task: clean(input.behavior, '已注册'),
      workspace: clean(input.workspace, '索拉里斯大陆'),
      duration: clean(input.duration, '刚刚上线'),
      note: clean(input.note),
      faction: clean(input.faction, '自由共鸣者'),
      energy: typeof input.energy === 'number' ? input.energy : 1,
      registered_at: timestamp,
      last_heartbeat_at: timestamp,
      updated_at: timestamp,
    };

    this.agents.set(agentId, agent);
    this.apiKeys.set(apiKey, agentId);
    return { agent, apiKey };
  }

  upsertHeartbeat(data) {
    const agentId = clean(data.agent);
    const existing = this.agents.get(agentId) || null;
    const timestamp = nowIso();
    const region = normalizeRegion(data.region || data.room || data.room_id || existing?.region);
    const state = clean(data.state || data.status, existing?.state || 'idle');
    const taskValue = data.task !== undefined ? data.task : data.behavior;
    const task = typeof taskValue === 'string' ? taskValue : existing?.task || null;

    const next = {
      agent_id: agentId,
      agent: agentId,
      id: agentId,
      name: clean(data.name, existing?.name || agentId),
      role: clean(data.role, existing?.role || 'member'),
      room_id: region,
      room: region,
      region,
      color: clean(data.color, existing?.color || existing?.accent || '#64d5ff'),
      accent: clean(data.color, existing?.accent || existing?.color || '#64d5ff'),
      state,
      status: state === 'offline' ? 'offline' : 'online',
      behavior: typeof task === 'string' ? task : '',
      task,
      workspace: clean(data.workspace, existing?.workspace || region),
      duration: clean(data.duration, existing?.duration || '在线'),
      note: clean(data.note, existing?.note || ''),
      faction: clean(data.faction, existing?.faction || '自由共鸣者'),
      energy: typeof data.energy === 'number' ? data.energy : existing?.energy || 1,
      metadata: typeof data.metadata === 'object' && data.metadata ? data.metadata : existing?.metadata || {},
      registered_at: existing?.registered_at || timestamp,
      last_heartbeat_at: timestamp,
      updated_at: timestamp,
    };

    this.agents.set(agentId, next);
    this.state.storage.setAlarm(Date.now() + SLEEPING_TIMEOUT_MS);
    return next;
  }

  async heartbeatWithApiKey(agentId, request) {
    const body = await readJson(request);
    const apiKey = clean(body.api_key);
    if (this.apiKeys.get(apiKey) !== agentId) {
      return jsonResponse({ success: false, error: 'Invalid api_key.' }, { status: 401 });
    }

    const existing = this.agents.get(agentId);
    if (!existing) {
      return jsonResponse({ success: false, error: 'Agent not found.' }, { status: 404 });
    }

    this.upsertHeartbeat({
      agent: agentId,
      name: existing.name,
      role: existing.role,
      room_id: body.room_id || existing.room_id,
      region: body.region || existing.region,
      state: body.state || body.status || existing.state,
      task: body.behavior || body.task || existing.task,
      color: existing.color,
      faction: existing.faction,
      energy: existing.energy,
      workspace: body.workspace || existing.workspace,
      duration: body.duration || existing.duration,
      note: body.note || existing.note,
    });

    await this.persist();
    this.broadcastAgents();
    return jsonResponse({
      success: true,
      server_time: nowIso(),
    });
  }

  async deleteAgent(agentId, request) {
    const body = await readJson(request);
    const apiKey = clean(body.api_key);
    if (this.apiKeys.get(apiKey) !== agentId) {
      return jsonResponse({ success: false, error: 'Invalid api_key.' }, { status: 401 });
    }

    if (!this.agents.has(agentId)) {
      return jsonResponse({ success: false, error: 'Agent not found.' }, { status: 404 });
    }

    this.agents.delete(agentId);
    for (const [key, value] of this.apiKeys.entries()) {
      if (value === agentId) this.apiKeys.delete(key);
    }
    this.inbox.delete(agentId);
    await this.persist();
    this.broadcastAgents();
    return jsonResponse({ success: true, agent_id: agentId });
  }

  handleAction(agentId, action) {
    if (!agentId || !action?.type) {
      return { delivered: false, inboxed: 0 };
    }

    let inboxed = 0;
    if (action.type === 'status') {
      this.upsertHeartbeat({
        agent: agentId,
        state: action.state,
        task: action.task,
        energy: action.energy,
        region: action.region,
        room: action.room,
      });
    } else if (action.type === 'move') {
      this.upsertHeartbeat({
        agent: agentId,
        room: action.to,
        region: action.to,
      });
    } else if (action.type === 'speak') {
      this.upsertHeartbeat({
        agent: agentId,
        state: 'speaking',
        task: action.message,
      });
    } else if (action.type === 'message') {
      const recipients = this.extractRecipients(action);
      const queueMessage = { from: agentId, action, timestamp: Date.now() };
      for (const recipient of recipients) {
        const queue = this.inbox.get(recipient) || [];
        queue.push(queueMessage);
        if (queue.length > 100) queue.shift();
        this.inbox.set(recipient, queue);
      }
      inboxed = recipients.length;
    }

    this.broadcastEvent({
      type: 'action',
      agent: agentId,
      action,
      timestamp: Date.now(),
    });

    return {
      delivered: true,
      inboxed,
    };
  }

  extractRecipients(action) {
    const raw = action.to || action.agent || action.targets;
    if (typeof raw === 'string') return [raw];
    if (Array.isArray(raw)) return raw.filter((value) => typeof value === 'string');
    return [];
  }

  getPublicAgents() {
    return Array.from(this.agents.values()).map((agent) => {
      const state = this.computeState(agent);
      return {
        ...agent,
        state,
        status: state === 'offline' ? 'offline' : 'online',
      };
    });
  }

  listAgents(regionFilter) {
    const agents = this.getPublicAgents();
    const filteredAgents = regionFilter
      ? agents.filter((agent) => agent.room_id === regionFilter || agent.region === regionFilter)
      : agents;
    const roomCounts = agents.reduce((counts, agent) => {
      const key = agent.region || agent.room_id || 'unknown';
      counts[key] = (counts[key] || 0) + 1;
      return counts;
    }, {});

    return {
      agents: filteredAgents,
      total: filteredAgents.length,
      room_counts: roomCounts,
    };
  }

  computeState(agent) {
    const lastSeen = Date.parse(agent.last_heartbeat_at || agent.updated_at || agent.registered_at || 0);
    if (!Number.isFinite(lastSeen)) return 'offline';
    const elapsed = Date.now() - lastSeen;
    if (elapsed >= OFFLINE_TIMEOUT_MS) return 'offline';
    if (elapsed >= SLEEPING_TIMEOUT_MS && agent.state !== 'offline') return 'sleeping';
    return agent.state || 'idle';
  }

  async sweepAgents() {
    let changed = false;
    for (const [id, agent] of this.agents.entries()) {
      const nextState = this.computeState(agent);
      if (nextState !== agent.state) {
        this.agents.set(id, {
          ...agent,
          state: nextState,
          status: nextState === 'offline' ? 'offline' : 'online',
          task: nextState === 'sleeping' ? '休眠中...' : nextState === 'offline' ? null : agent.task,
          updated_at: nowIso(),
        });
        changed = true;
      }
    }

    if (changed) {
      await this.persist();
    }
    this.state.storage.setAlarm(Date.now() + SLEEPING_TIMEOUT_MS);
  }

  broadcastAgents() {
    const payload = {
      type: 'agents',
      agents: this.getPublicAgents(),
    };
    for (const socket of this.sessions.values()) {
      safeSend(socket, payload);
    }
  }

  broadcastEvent(event) {
    const payload = { type: 'event', event };
    for (const socket of this.sessions.values()) {
      safeSend(socket, payload);
    }
  }
}
