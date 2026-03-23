import { AgentStateDurableObject } from './durable-object.ts';

interface Env {
  AGENT_STATE: DurableObjectNamespace;
  ASSETS?: Fetcher;
}

interface Fetcher {
  fetch(request: Request): Promise<Response>;
}

const CORS_HEADERS = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET, POST, OPTIONS',
  'access-control-allow-headers': 'content-type',
};

export { AgentStateDurableObject };

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS' && (url.pathname.startsWith('/api/') || url.pathname === '/ws')) {
      return new Response(null, {
        status: 204,
        headers: CORS_HEADERS,
      });
    }

    if (
      isWebSocketUpgrade(request) &&
      (url.pathname === '/' || url.pathname === '/ws' || url.pathname === '/api/ws')
    ) {
      return withCors(await forwardToAgentState(request, env));
    }

    if (
      (request.method === 'GET' && url.pathname === '/api/agents') ||
      (request.method === 'POST' && url.pathname === '/api/heartbeat')
    ) {
      return withCors(await forwardToAgentState(request, env));
    }

    if (request.method === 'GET' && url.pathname === '/api/info') {
      const response = await forwardToAgentState(
        new Request(new URL('/api/agents', request.url), { method: 'GET' }),
        env,
      );
      const payload = (await response.json()) as { agents?: Array<{ state?: string }> };
      const agents = Array.isArray(payload.agents) ? payload.agents : [];

      return json({
        wuwa: true,
        runtime: 'cloudflare-workers',
        durableObject: 'AgentStateDurableObject',
        agents: {
          online: agents.filter((agent) => agent.state !== 'offline').length,
          total: agents.length,
        },
      });
    }

    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    return json({ error: 'Not found' }, 404);
  },
};

function forwardToAgentState(request: Request, env: Env): Promise<Response> {
  const id = env.AGENT_STATE.idFromName('global');
  const stub = env.AGENT_STATE.get(id);
  return stub.fetch(request);
}

function isWebSocketUpgrade(request: Request): boolean {
  return request.headers.get('Upgrade')?.toLowerCase() === 'websocket';
}

function withCors(response: Response): Response {
  const headers = new Headers(response.headers);
  for (const [key, value] of Object.entries(CORS_HEADERS)) {
    headers.set(key, value);
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
    webSocket: (response as Response & { webSocket?: WebSocket }).webSocket,
  } as ResponseInit);
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...CORS_HEADERS,
      'content-type': 'application/json; charset=utf-8',
    },
  });
}
