/**
 * LANDWISE request handler, shared by both deploy targets:
 *   - Render:      server.js -> worker.js -> this file
 *   - Cloudflare:  worker.js -> this file
 * The site is static (public/). The API only exposes a health check; listings
 * are read by the browser from public/data/listings.js.
 */
const HEADERS = { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' };
const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: HEADERS });

export async function handleRequest(request, env) {
  const url = new URL(request.url);
  if (!url.pathname.startsWith('/api/')) return env.ASSETS.fetch(request);
  if (url.pathname === '/api/health') return json({ ok: true, service: 'landwise', checkedAt: new Date().toISOString() });
  return json({ ok: false, error: 'API олдсонгүй', code: 'NOT_FOUND' }, 404);
}
