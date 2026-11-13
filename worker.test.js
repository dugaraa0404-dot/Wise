import test from 'node:test';
import assert from 'node:assert/strict';
import worker from './worker.js';

const env = { ASSETS: { fetch: async () => new Response('STATIC') } };
const call = (path) => worker.fetch(new Request(`https://example.workers.dev${path}`), env);

test('health endpoint answers JSON', async () => {
  const res = await call('/api/health');
  assert.equal(res.status, 200);
  assert.equal((await res.json()).ok, true);
});
test('unknown API returns JSON 404', async () => {
  const res = await call('/api/missing');
  assert.equal(res.status, 404);
  assert.equal((await res.json()).code, 'NOT_FOUND');
});
test('non-api routes go to static assets', async () => {
  assert.equal(await (await call('/')).text(), 'STATIC');
  assert.equal(await (await call('/listings.js')).text(), 'STATIC');
});
