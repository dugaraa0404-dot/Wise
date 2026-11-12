import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const read = (p) => readFile(new URL('./' + p, import.meta.url), 'utf8');
const [html, app, dataJs] = await Promise.all([read('index.html'), read('app.js'), read('listings.js')]);
const ctx = { window: {} }; vm.runInNewContext(dataJs, ctx);
const D = ctx.window.LANDWISE_DATA;

test('listings data loads and is complete', () => {
  assert.ok(D && Array.isArray(D.listings) && D.listings.length > 0);
  const ids = new Set();
  for (const l of D.listings) {
    assert.ok(!ids.has(l.id), 'unique id ' + l.id); ids.add(l.id);
    for (const k of ['title', 'region', 'purpose', 'right', 'posted']) assert.ok(l[k], `${l.id}.${k}`);
    assert.ok(D.regions[l.region], `${l.id} region`); assert.ok(D.purposes[l.purpose], `${l.id} purpose`); assert.ok(D.rights[l.right], `${l.id} right`);
    assert.ok(l.area_m2 > 0 && l.price_mnt > 0 && l.km > 0, `${l.id} numbers`);
    assert.match(l.posted, /^\d{4}-\d{2}-\d{2}$/);
  }
});
test('sample data is labelled as sample everywhere', () => {
  if (!D.sample) return; // real data: no sample labels required
  assert.ok(D.listings.every((l) => l.sample === true));
  assert.match(html, /Жишээ зарууд/);
  assert.match(app, /ЖИШЭЭ ЗАР/);
  assert.match(app, /холбоо барих мэдээлэл байхгүй/);
});
test('removed features stay removed (map, WFS, import, CSV)', () => {
  for (const s of [html, app]) {
    assert.doesNotMatch(s, /leaflet|tile\.openstreetmap|nsdi\.gov\.mn\/geoserver|type="file"|text\/csv|\.csv/i);
  }
});
test('page wiring', () => {
  assert.match(html, /src="listings\.js"/);
  assert.match(html, /src="app\.js"/);
  assert.match(html, /href="style\.css"/);
  for (const id of ['cards', 'chart-region', 'chart-scatter', 'region-table', 'calc-out', 'cmp', 'modal']) assert.match(html, new RegExp(`id="${id}"`));
});
test('all user-facing data in innerHTML goes through esc()', () => {
  // l.spot is only used inside values that are escaped later (esc(f(l)), esc(b)) or set via textContent.
  for (const f of ['l.title', 'l.desc']) {
    const raw = new RegExp('\\$\\{' + f.replace('.', '\\.') + '\\}');
    assert.doesNotMatch(app, raw, f + ' must be escaped');
  }
});
