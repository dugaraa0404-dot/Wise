import test from 'node:test';
import assert from 'node:assert/strict';
import { createAppServer, handle } from './server.js';

test('serves the site, data and assets with the right types', async () => {
  for (const [p, type] of [['/', 'text/html'], ['/app.js', 'text/javascript'], ['/style.css', 'text/css'], ['/listings.js', 'text/javascript'], ['/data/listings.js', 'text/javascript']]) {
    const r = await handle(new Request(`http://localhost${p}`));
    assert.equal(r.status, 200, p); assert.match(r.headers.get('content-type'), new RegExp(type)); assert.ok((await r.text()).length > 200);
  }
});
test('no directory traversal; missing files 404', async () => {
  assert.equal((await handle(new Request('http://localhost/missing.xyz'))).status, 404);
  assert.equal((await handle(new Request('http://localhost/%2e%2e%2fworker.js'))).status, 404);
  for (const p of ['/server.js', '/package.json', '/worker.js', '/landwise-api.js', '/render.yaml', '/.gitignore'])
    assert.equal((await handle(new Request('http://localhost' + p))).status, 404, p + ' must not be public');
});
test('HTTP server responds on a dynamic port', async () => {
  const server = createAppServer(); await new Promise((r) => server.listen(0, '127.0.0.1', r));
  try {
    const base = `http://127.0.0.1:${server.address().port}`;
    assert.equal((await fetch(base + '/api/health')).status, 200);
    assert.equal((await fetch(base + '/')).status, 200);
    assert.equal((await fetch(base + '/api/missing')).status, 404);
    assert.equal((await fetch(base + '/', { method: 'POST' })).status, 405);
  } finally { await new Promise((r, j) => server.close((e) => (e ? j(e) : r()))); }
});
