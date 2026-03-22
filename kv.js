export const HEARTBEAT_WINDOW_MS = 5 * 60 * 1000;

const AGENT_PREFIX = 'agent:';
const ROOM_PREFIX = 'room:';
const API_KEY_PREFIX = 'api_key:';

function getKv() {
  if (!globalThis.AGENTS_KV) {
    throw new Error('AGENTS_KV binding is not available on globalThis.');
  }

  return globalThis.AGENTS_KV;
}

function keyForAgent(agentId) {
  return `${AGENT_PREFIX}${agentId}`;
}

function keyForRoom(roomId) {
  return `${ROOM_PREFIX}${roomId}`;
}

function keyForApiKey(apiKey) {
  return `${API_KEY_PREFIX}${apiKey}`;
}

function createToken(prefix) {
  return `${prefix}${crypto.randomUUID().replace(/-/g, '')}`;
}

function nowIso() {
  return new Date().toISOString();
}

function cleanString(value, fallback = '') {
  if (typeof value !== 'string') {
    return fallback;
  }

  return value.trim();
}

function isExpired(agent, now = Date.now()) {
  const lastSeen = Date.parse(agent.last_heartbeat_at || agent.updated_at || agent.registered_at || 0);
  return Number.isNaN(lastSeen) || now - lastSeen > HEARTBEAT_WINDOW_MS;
}

function withComputedStatus(agent, now = Date.now()) {
  const computedStatus = isExpired(agent, now) ? 'offline' : agent.status || 'online';
  return {
    ...agent,
    status: computedStatus,
  };
}

async function getJson(key) {
  const kv = getKv();
  return kv.get(key, 'json');
}

async function putJson(key, value) {
  const kv = getKv();
  await kv.put(key, JSON.stringify(value));
}

async function deleteKey(key) {
  const kv = getKv();
  await kv.delete(key);
}

async function listAllKeys(prefix) {
  const kv = getKv();
  const keys = [];
  let cursor;

  do {
    const page = await kv.list({ prefix, cursor });
    keys.push(...page.keys.map((entry) => entry.name));
    cursor = page.list_complete ? undefined : page.cursor;
  } while (cursor);

  return keys;
}

async function getRoomMembers(roomId) {
  const members = await getJson(keyForRoom(roomId));
  return Array.isArray(members) ? members : [];
}

async function setRoomMembers(roomId, agentIds) {
  const unique = [...new Set(agentIds.filter(Boolean))];
  await putJson(keyForRoom(roomId), unique);
}

export async function readJsonBody(request) {
  const raw = await request.text();
  if (!raw) {
    return {};
  }

  try {
    return JSON.parse(raw);
  } catch (error) {
    throw new Error('Request body must be valid JSON.');
  }
}

export function json(data, status = 200, init = {}) {
  const headers = new Headers(init.headers || {});
  headers.set('content-type', 'application/json; charset=UTF-8');
  return new Response(JSON.stringify(data), {
    ...init,
    status,
    headers,
  });
}

export function errorJson(message, status = 400, extra = {}) {
  return json(
    {
      success: false,
      error: message,
      ...extra,
    },
    status,
  );
}

export async function getAgent(agentId) {
  const agent = await getJson(keyForAgent(agentId));
  if (!agent) {
    return null;
  }

  return withComputedStatus(agent);
}

export async function verifyAgentApiKey(agentId, apiKey) {
  if (!cleanString(apiKey)) {
    return false;
  }

  const storedAgentId = await getKv().get(keyForApiKey(apiKey));
  return storedAgentId === agentId;
}

export async function createAgent(input) {
  const name = cleanString(input.name);
  const role = cleanString(input.role);
  const avatar = cleanString(input.avatar);
  const roomId = cleanString(input.room_id);
  const accent = cleanString(input.accent);

  if (!name || !role || !avatar || !roomId || !accent) {
    throw new Error('name, role, avatar, room_id, accent are required.');
  }

  const agentId = createToken('agent_');
  const apiKey = createToken('ak_');
  const timestamp = nowIso();
  const agent = {
    agent_id: agentId,
    name,
    role,
    avatar,
    room_id: roomId,
    accent,
    status: 'online',
    behavior: cleanString(input.behavior, '已注册'),
    workspace: cleanString(input.workspace, '待分配'),
    duration: cleanString(input.duration, '刚刚上线'),
    note: cleanString(input.note),
    registered_at: timestamp,
    last_heartbeat_at: timestamp,
    updated_at: timestamp,
  };

  await putJson(keyForAgent(agentId), agent);
  await getKv().put(keyForApiKey(apiKey), agentId);

  const roomMembers = await getRoomMembers(roomId);
  roomMembers.push(agentId);
  await setRoomMembers(roomId, roomMembers);

  return { agent, apiKey };
}

export async function updateAgent(agentId, updates) {
  const existing = await getJson(keyForAgent(agentId));
  if (!existing) {
    return null;
  }

  const { bumpHeartbeat = true, ...rawUpdates } = updates;
  const nextRoomId = cleanString(updates.room_id, existing.room_id);
  const previousRoomId = existing.room_id;
  const timestamp = nowIso();
  const nextAgent = {
    ...existing,
    ...rawUpdates,
    room_id: nextRoomId,
    behavior: cleanString(rawUpdates.behavior, existing.behavior),
    workspace: cleanString(rawUpdates.workspace, existing.workspace),
    duration: cleanString(rawUpdates.duration, existing.duration),
    note: cleanString(rawUpdates.note, existing.note),
    status: cleanString(rawUpdates.status, existing.status || 'online'),
    updated_at: timestamp,
  };

  if (bumpHeartbeat) {
    nextAgent.last_heartbeat_at = timestamp;
  }

  await putJson(keyForAgent(agentId), nextAgent);

  if (previousRoomId !== nextRoomId) {
    const previousMembers = (await getRoomMembers(previousRoomId)).filter((memberId) => memberId !== agentId);
    const nextMembers = await getRoomMembers(nextRoomId);
    nextMembers.push(agentId);
    await setRoomMembers(previousRoomId, previousMembers);
    await setRoomMembers(nextRoomId, nextMembers);
  }

  return withComputedStatus(nextAgent);
}

export async function deleteAgent(agentId) {
  const existing = await getJson(keyForAgent(agentId));
  if (!existing) {
    return false;
  }

  const roomMembers = (await getRoomMembers(existing.room_id)).filter((memberId) => memberId !== agentId);
  await setRoomMembers(existing.room_id, roomMembers);
  await deleteKey(keyForAgent(agentId));

  const apiKeyNames = await listAllKeys(API_KEY_PREFIX);
  await Promise.all(
    apiKeyNames.map(async (key) => {
      const boundAgentId = await getKv().get(key);
      if (boundAgentId === agentId) {
        await deleteKey(key);
      }
    }),
  );

  return true;
}

export async function listAgents(roomId) {
  const agentKeys = await listAllKeys(AGENT_PREFIX);
  const agents = (
    await Promise.all(agentKeys.map((key) => getJson(key)))
  )
    .filter(Boolean)
    .map((agent) => withComputedStatus(agent));

  const filteredAgents = roomId
    ? agents.filter((agent) => agent.room_id === roomId)
    : agents;

  const roomCounts = agents.reduce((counts, agent) => {
    const currentRoomId = agent.room_id || 'unknown';
    counts[currentRoomId] = (counts[currentRoomId] || 0) + 1;
    return counts;
  }, {});

  return {
    agents: filteredAgents,
    room_counts: roomCounts,
  };
}
