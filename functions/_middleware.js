const ALLOWED_ORIGINS = new Set([
  'https://d384486a.agent-company.pages.dev',
  'http://localhost:4173',
  'http://127.0.0.1:4173',
  'http://localhost:8788',
  'http://127.0.0.1:8788',
]);

function withCors(request, response) {
  const headers = new Headers(response.headers);
  const origin = request.headers.get('Origin');

  headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type');
  headers.set('Access-Control-Max-Age', '86400');
  headers.set('Vary', 'Origin');

  if (origin && ALLOWED_ORIGINS.has(origin)) {
    headers.set('Access-Control-Allow-Origin', origin);
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export async function onRequest(context) {
  globalThis.AGENTS_KV = context.env.AGENTS_KV;

  if (context.request.method === 'OPTIONS') {
    return withCors(context.request, new Response(null, { status: 204 }));
  }

  const response = await context.next();
  return withCors(context.request, response);
}
