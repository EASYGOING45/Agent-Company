// @ts-nocheck

export function jsonResponse(data, init = {}) {
  const headers = new Headers(init.headers || {});
  headers.set('content-type', 'application/json; charset=UTF-8');
  return new Response(JSON.stringify(data), {
    ...init,
    headers,
  });
}

export async function readJson(request) {
  const raw = await request.text();
  if (!raw) return {};
  return JSON.parse(raw);
}

export function createWebSocketResponse() {
  const pair = new WebSocketPair();
  const client = pair[0];
  const server = pair[1];
  server.accept();

  return {
    client,
    server,
    response: new Response(null, {
      status: 101,
      webSocket: client,
    }),
  };
}

export function safeSend(socket, payload) {
  try {
    socket.send(JSON.stringify(payload));
  } catch (_error) {
    try {
      socket.close(1011, 'send_failed');
    } catch (_closeError) {
      // Ignore.
    }
  }
}
