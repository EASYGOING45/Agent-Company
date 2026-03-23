// @ts-nocheck

import { AgentWorldDurableObject } from './durable-object';
import { jsonResponse } from './websocket';

export { AgentWorldDurableObject };

function getAgentWorldStub(env, shard = 'solaris-main') {
  const id = env.AGENT_WORLD.idFromName(shard);
  return env.AGENT_WORLD.get(id);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS' && url.pathname.startsWith('/api/')) {
      return new Response(null, {
        status: 204,
        headers: corsHeaders(),
      });
    }

    if (url.pathname.startsWith('/api/')) {
      const shard = url.searchParams.get('instance') || 'solaris-main';
      const stub = getAgentWorldStub(env, shard);
      const response = await stub.fetch(request);
      return withCors(response);
    }

    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    return jsonResponse({ error: 'Static assets binding not configured.' }, { status: 404, headers: corsHeaders() });
  },
};

function corsHeaders() {
  return {
    'access-control-allow-origin': '*',
    'access-control-allow-methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'access-control-allow-headers': 'content-type,authorization',
  };
}

function withCors(response) {
  const headers = new Headers(response.headers);
  Object.entries(corsHeaders()).forEach(([key, value]) => headers.set(key, value));
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
    webSocket: response.webSocket,
  });
}
