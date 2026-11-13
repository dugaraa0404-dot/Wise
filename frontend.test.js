import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const read = (p) => readFile(new URL('./' + p, import.meta.url), 'utf8');
const [html, app, dataJs, freeJs] = await Promise.all([read('index.html'), read('app.js'), read('listings.js'), read('freeland.js')]);
const ctx = { window: {} }; vm.runInNewContext(dataJs, ctx); vm.runInNewContext(freeJs, ctx);
const D = ctx.window.LANDWISE_DATA, F = ctx.window.LANDWISE_FREE;

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
  assert.match(html, /src="freeland\.js"/);
  assert.match(html, /src="app\.js"/);
  assert.match(html, /href="style\.css"/);
  for (const id of ['fz-list', 'elig-out', 'fz-deadline', 'cards', 'chart-region', 'chart-scatter', 'region-table', 'calc-out', 'cmp', 'modal']) assert.match(html, new RegExp(`id="${id}"`));
});
test('all user-facing data in innerHTML goes through esc()', () => {
  // l.spot is only used inside values that are escaped later (esc(f(l)), esc(b)) or set via textContent.
  for (const f of ['l.title', 'l.desc']) {
    const raw = new RegExp('\\$\\{' + f.replace('.', '\\.') + '\\}');
    assert.doesNotMatch(app, raw, f + ' must be escaped');
  }
});

test('free-land zones are complete and sourced', () => {
  assert.ok(F && F.zones.length >= 3);
  assert.deepEqual({ ...F.sizes }, { capital: 0.07, aimag: 0.35, soum: 0.5 });
  assert.equal(F.deadline, '2028-05-01');
  const ids = new Set();
  for (const z of F.zones) {
    assert.ok(!ids.has(z.id)); ids.add(z.id);
    assert.ok(F.typeLabel[z.type], z.id + ' type');
    assert.ok(['open', 'limited'].includes(z.status), z.id + ' status');
    for (const k of ['location', 'infra', 'outlook']) {
      assert.ok(Number.isInteger(z.scores[k]) && z.scores[k] >= 1 && z.scores[k] <= 5, `${z.id}.${k}`);
      assert.ok(z.why[k], `${z.id} why.${k}`);
    }
    for (const p of z.projects) assert.match(p.src, /^https:\/\//);
    assert.ok(z.risks.length > 0, z.id + ' risks');
  }
  for (const r of F.rules) assert.match(r.src, /^https:\/\//);
});
test('central UB districts are not offered as free-land zones', () => {
  const central = /Сүхбаатар|Чингэлтэй|Баянгол|Баянзүрх|Хан-Уул|Сонгинохайрхан/;
  for (const z of F.zones.filter((z) => z.type === 'capital')) assert.doesNotMatch(z.admin, central, z.id);
});
