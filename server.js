/**
 * LANDWISE Render adapter (Node 20+).
 * Flat layout: every file lives in the repo root (GitHub "Add files via upload" friendly).
 * Only the files listed in PUBLIC are served, so server code and config never become public.
 */
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import worker from './worker.js';

const root = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC = {
  '/': ['index.html', 'text/html; charset=utf-8'],
  '/index.html': ['index.html', 'text/html; charset=utf-8'],
  '/app.js': ['app.js', 'text/javascript; charset=utf-8'],
  '/style.css': ['style.css', 'text/css; charset=utf-8'],
  '/listings.js': ['listings.js', 'text/javascript; charset=utf-8'],
  '/data/listings.js': ['listings.js', 'text/javascript; charset=utf-8'],
};

/** Static file handler with the same interface as Cloudflare's env.ASSETS binding. */
const assets = {
  async fetch(request) {
    const entry = PUBLIC[new URL(request.url).pathname];
    if (!entry) return new Response('Not found', { status: 404, headers: { 'content-type': 'text/plain; charset=utf-8' } });
    try {
      return new Response(await readFile(path.join(root, entry[0])), {
        status: 200,
        headers: { 'content-type': entry[1], 'cache-control': 'public, max-age=300', 'x-content-type-options': 'nosniff' },
      });
    } catch (e) {
      return new Response(e?.code === 'ENOENT' ? 'Not found' : 'Asset error', { status: e?.code === 'ENOENT' ? 404 : 500 });
    }
  },
};

export async function handle(request) {
  return worker.fetch(request, { ASSETS: assets });
}

export function createAppServer() {
  return http.createServer(async (req, res) => {
    try {
      if (!['GET', 'HEAD'].includes(req.method)) {
        res.writeHead(405, { allow: 'GET, HEAD' });
        return res.end();
      }
      const request = new Request(new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`), { method: req.method });
      const response = await handle(request);
      res.writeHead(response.status, Object.fromEntries(response.headers.entries()));
      if (req.method === 'HEAD') return res.end();
      res.end(Buffer.from(await response.arrayBuffer()));
    } catch (e) {
      console.error('Request failed:', e?.message || e);
      if (!res.headersSent) res.writeHead(500, { 'content-type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ ok: false, error: 'Internal server error' }));
    }
  });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.PORT || 10000);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Invalid PORT');
  createAppServer().listen(port, '0.0.0.0', () => console.log(`LANDWISE Render service listening on 0.0.0.0:${port}`));
}
