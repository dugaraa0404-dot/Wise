'use strict';
/* LANDWISE — газрын зар, шинжилгээ. Өгөгдөл: data/listings.js (window.LANDWISE_DATA). */
const D = window.LANDWISE_DATA || { listings: [], regions: {}, purposes: {}, rights: {} };
const $ = (id) => document.getElementById(id);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const RES = new Set(['summer', 'family', 'commercial']);
const RIGHT_COLOR = { ownership: 'var(--series-1)', possession: 'var(--series-2)', use: 'var(--series-3)' };
const ROAD = { paved: 'Засмал зам', gravel: 'Хайрган зам', dirt: 'Шороон зам' };
const WATER = { central: 'Төвийн ус', well: 'Худагтай', none: 'Усгүй' };
const REF = D.sample && D.generatedAt ? new Date(D.generatedAt + 'T12:00:00') : new Date();

const L = D.listings.map((l) => ({ ...l, ppm: l.price_mnt / l.area_m2, res: RES.has(l.purpose) }));
const byId = new Map(L.map((l) => [l.id, l]));

/* ---------- number formatting ---------- */
const median = (a) => { if (!a.length) return null; const s = [...a].sort((x, y) => x - y), m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
const fmtN = (n) => (n == null || !Number.isFinite(n) ? '—' : Math.round(n).toLocaleString('en-US'));
const trim1 = (n) => (Math.round(n * 10) / 10).toString();
const fmtMoney = (n) => (n == null ? '—' : n >= 1e9 ? trim1(n / 1e9) + ' тэрбум ₮' : trim1(n / 1e6) + ' сая ₮');
const fmtHa = (m2) => { const ha = m2 / 10000; return (ha < 1 ? ha.toFixed(2).replace(/0$/, '') : trim1(ha)) + ' га'; };
const fmtK = (n) => (n >= 1000 ? trim1(n / 1000) + 'k' : String(Math.round(n)));
const daysAgo = (iso) => { const d = Math.round((REF - new Date(iso + 'T12:00:00')) / 864e5); return d <= 0 ? 'Өнөөдөр' : d === 1 ? 'Өчигдөр' : d + ' хоногийн өмнө'; };
const rName = (k) => D.regions[k]?.name || k;

/* ---------- statistics ---------- */
const stats = {};
for (const k of Object.keys(D.regions)) {
  const all = L.filter((l) => l.region === k), res = all.filter((l) => l.res), farm = all.filter((l) => l.purpose === 'farm');
  stats[k] = {
    count: all.length, resCount: res.length,
    resMed: median(res.map((l) => l.ppm)), resMin: res.length ? Math.min(...res.map((l) => l.ppm)) : null, resMax: res.length ? Math.max(...res.map((l) => l.ppm)) : null,
    priceMed: median(res.map((l) => l.price_mnt)), kmMed: median(all.map((l) => l.km)),
    farmHa: median(farm.map((l) => l.ppm * 10000)),
  };
}
const farmMedAll = median(L.filter((l) => l.purpose === 'farm').map((l) => l.ppm));
const resMedAll = median(L.filter((l) => l.res).map((l) => l.ppm));
function deal(l) {
  const m = l.res ? stats[l.region]?.resMed : farmMedAll;
  if (!m) return null;
  const d = (l.ppm - m) / m;
  return { d, m, cls: d <= -0.07 ? 'good' : d >= 0.07 ? 'high' : 'mid', icon: d <= -0.07 ? '▼' : d >= 0.07 ? '▲' : '≈',
    text: Math.abs(d) < 0.07 ? (l.res ? 'Бүсийн медиантай ойролцоо' : 'Тариалангийн медиантай ойролцоо') : `${l.res ? 'Бүсийн' : 'Тариалангийн'} медианаас ${Math.round(Math.abs(d) * 100)}% ${d < 0 ? 'доогуур' : 'дээгүүр'}` };
}

/* ---------- illustrated thumbnails (no remote images) ---------- */
function hash(s) { let h = 2166136261; for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0; }
function thumb(l) {
  const r = hash(l.id), rnd = (i) => ((r >>> (i % 24)) & 255) / 255;
  const pal = { summer: ['#cfe8f2', '#8fc5a6', '#4f9a74', '#2f6e52'], family: ['#dbe9f5', '#b9d7c0', '#86b796', '#5a8f6c'], farm: ['#e8eedb', '#d6cf8e', '#b8ad5e', '#8f8a3d'], commercial: ['#e3e8ee', '#c6d0c9', '#9aab9f', '#6e8076'] }[l.purpose] || ['#dfe', '#9c9', '#686', '#454'];
  const hill = (base, amp, ph) => { let d = `M0 128 L0 ${base}`; for (let x = 0; x <= 400; x += 20) d += ` L${x} ${(base - amp * Math.sin((x / 400) * Math.PI * (1.2 + rnd(ph)) + ph)).toFixed(1)}`; return d + ' L400 128 Z'; };
  let extra = '';
  if (l.purpose === 'summer') for (let i = 0; i < 9; i++) { const x = 20 + ((r >> i) % 360), y = 78 + ((r >> (i + 3)) % 22); extra += `<path d="M${x} ${y - 16} L${x - 6} ${y} L${x + 6} ${y} Z" fill="#2c5f45" opacity=".85"/>`; }
  if (l.purpose === 'family') { const x = 70 + (r % 220); extra = `<rect x="${x}" y="80" width="34" height="22" rx="2" fill="#f4efe6"/><path d="M${x - 4} 81 L${x + 17} 66 L${x + 38} 81 Z" fill="#b5634b"/><rect x="${x + 13}" y="89" width="8" height="13" fill="#8a5a3c"/>`; }
  if (l.purpose === 'farm') for (let i = 0; i < 7; i++) extra += `<path d="M${-40 + i * 70} 128 L${150 + i * 25} 84" stroke="#a69b4f" stroke-width="3" opacity=".55"/>`;
  if (l.purpose === 'commercial') extra = `<path d="M0 112 L400 98" stroke="#55605a" stroke-width="12"/><path d="M0 112 L400 98" stroke="#f2e6a0" stroke-width="1.5" stroke-dasharray="14 10"/>`;
  return `<svg viewBox="0 0 400 128" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><rect width="400" height="128" fill="${pal[0]}"/><circle cx="${300 + (r % 70)}" cy="30" r="13" fill="#fff6d8"/><path d="${hill(70, 16, 1)}" fill="${pal[1]}"/><path d="${hill(88, 12, 2.3)}" fill="${pal[2]}"/><path d="${hill(104, 8, 4)}" fill="${pal[3]}"/>${extra}</svg>`;
}

/* ---------- compare selection (remembered per browser when storage exists) ---------- */
let cmp = [];
try { cmp = JSON.parse(localStorage.getItem('lw-compare') || '[]').filter((id) => byId.has(id)).slice(0, 3); } catch { cmp = []; }
const saveCmp = () => { try { localStorage.setItem('lw-compare', JSON.stringify(cmp)); } catch {} };
function toast(msg) { const t = $('toast'); t.textContent = msg; t.hidden = false; clearTimeout(toast.t); toast.t = setTimeout(() => (t.hidden = true), 2200); }
function toggleCmp(id) {
  if (cmp.includes(id)) cmp = cmp.filter((x) => x !== id);
  else if (cmp.length >= 3) { toast('Хамгийн ихдээ 3 газар харьцуулна.'); return; }
  else { cmp.push(id); toast('Харьцуулалтад нэмлээ (' + cmp.length + '/3)'); }
  saveCmp(); renderCards(false); renderCompare(); if (!$('modal').hidden) openModal(id);
}

/* ---------- filters & cards ---------- */
function fillSelect(id, entries) { const s = $(id); for (const [v, t] of entries) { const o = document.createElement('option'); o.value = v; o.textContent = t; s.append(o); } }
const regionEntries = Object.entries(D.regions).map(([k, v]) => [k, `${v.name} · ${v.aimag}`]);
fillSelect('f-region', regionEntries); fillSelect('q-region', regionEntries.map(([k]) => [k, rName(k)]));
fillSelect('f-purpose', Object.entries(D.purposes)); fillSelect('q-purpose', Object.entries(D.purposes));
fillSelect('f-right', Object.entries(D.rights));

const PAGE = 12; let shown = PAGE, filtered = [];
const numv = (id) => { const v = $(id).value.trim(); return v === '' ? null : Number(v); };
function applyFilters() {
  const region = $('f-region').value, purpose = $('f-purpose').value, right = $('f-right').value;
  const pmin = numv('f-pmin'), pmax = numv('f-pmax'), amin = numv('f-amin'), amax = numv('f-amax'), km = Number($('f-km').value);
  const q = $('f-text').value.trim().toLowerCase();
  filtered = L.filter((l) => (region === 'all' || l.region === region) && (purpose === 'all' || l.purpose === purpose) && (right === 'all' || l.right === right)
    && (pmin == null || l.price_mnt >= pmin * 1e6) && (pmax == null || l.price_mnt <= pmax * 1e6)
    && (amin == null || l.area_m2 >= amin) && (amax == null || l.area_m2 <= amax) && l.km <= km
    && (!$('f-power').checked || l.power) && (!$('f-paved').checked || l.road === 'paved') && (!$('f-water').checked || l.water !== 'none') && (!$('f-fenced').checked || l.fenced)
    && (!q || (l.title + ' ' + l.desc + ' ' + rName(l.region) + ' ' + l.id).toLowerCase().includes(q)));
  const s = $('sort').value, dv = (l) => deal(l)?.d ?? 0;
  const cmpf = { new: (a, b) => b.posted.localeCompare(a.posted), 'price-asc': (a, b) => a.price_mnt - b.price_mnt, 'price-desc': (a, b) => b.price_mnt - a.price_mnt,
    'ppm-asc': (a, b) => a.ppm - b.ppm, deal: (a, b) => dv(a) - dv(b), 'area-desc': (a, b) => b.area_m2 - a.area_m2, 'km-asc': (a, b) => a.km - b.km }[s];
  filtered.sort(cmpf);
}
function card(l) {
  const d = deal(l), on = cmp.includes(l.id);
  const chips = [[l.power, 'Цахилгаан'], [l.road === 'paved', ROAD[l.road]], [l.water !== 'none', WATER[l.water]], [l.fenced, 'Хашаатай']]
    .map(([ok, t]) => (l.road !== 'paved' && t === ROAD[l.road] ? `<span class="chip">${esc(t)}</span>` : `<span class="chip${ok ? '' : ' off'}">${esc(t)}</span>`)).join('');
  return `<article class="card">
    <button class="thumb" data-open="${esc(l.id)}" aria-label="${esc(l.title)} — дэлгэрэнгүй">${thumb(l)}<span class="badge">ЖИШЭЭ ЗАР</span><span class="badge right">${esc(D.rights[l.right])}</span></button>
    <div class="card-body">
      <button class="card-title" data-open="${esc(l.id)}">${esc(l.title)}</button>
      <div class="loc">${esc(D.regions[l.region]?.aimag)} · УБ-аас ${l.km} км · ${esc(fmtHa(l.area_m2))} (${fmtN(l.area_m2)} м²)</div>
      <div class="price-row"><span class="price">${esc(fmtMoney(l.price_mnt))}</span><span class="ppm">${fmtN(l.ppm)} ₮/м²</span></div>
      ${d ? `<div class="deal ${d.cls}"><i aria-hidden="true">${d.icon}</i>${esc(d.text)}</div>` : ''}
      <div class="facts">${chips}</div>
      <div class="posted">${esc(daysAgo(l.posted))} · ${l.seller === 'owner' ? 'Эзэмшигч өөрөө' : 'Зуучлагч'}${l.negotiable ? ' · Үнэ тохиролцоно' : ''}${l.loan ? ' · Зээлтэй' : ''}</div>
      <div class="card-actions"><button class="primary" data-open="${esc(l.id)}">Дэлгэрэнгүй</button><button class="${on ? 'on' : ''}" data-cmp="${esc(l.id)}" aria-pressed="${on}">${on ? '✓ Харьцуулж байна' : '+ Харьцуулах'}</button></div>
    </div></article>`;
}
function renderCards(reset = true) {
  if (reset) { applyFilters(); shown = PAGE; }
  $('res-count').textContent = filtered.length;
  $('cards').innerHTML = filtered.length ? filtered.slice(0, shown).map(card).join('')
    : '<div class="empty"><strong>Тохирох зар олдсонгүй</strong><p>Шүүлтүүрээ сулруулж үзнэ үү.</p></div>';
  $('more').hidden = filtered.length <= shown;
  $('more').textContent = `Цааш үзэх (${filtered.length - shown} үлдсэн)`;
  $('nav-compare').textContent = cmp.length;
}

/* ---------- detail modal ---------- */
function openModal(id) {
  const l = byId.get(id); if (!l) return;
  const d = deal(l), st = stats[l.region], on = cmp.includes(l.id);
  const lo = l.res ? st.resMin : Math.min(...L.filter((x) => x.purpose === 'farm').map((x) => x.ppm));
  const hi = l.res ? st.resMax : Math.max(...L.filter((x) => x.purpose === 'farm').map((x) => x.ppm));
  const pos = (v) => (hi > lo ? ((v - lo) / (hi - lo)) * 100 : 50);
  const rows = [['Үнэ', fmtMoney(l.price_mnt)], ['₮ / м²', fmtN(l.ppm) + ' ₮'], ['Талбай', `${fmtN(l.area_m2)} м² · ${fmtHa(l.area_m2)}`], ['Зориулалт', D.purposes[l.purpose]],
    ['Эрхийн төрөл', D.rights[l.right]], ['Байршил', `${rName(l.region)}, ${l.spot}`], ['УБ-аас', l.km + ' км'], ['Зам', ROAD[l.road]], ['Цахилгаан', l.power ? 'Байгаа' : 'Байхгүй'],
    ['Ус', WATER[l.water]], ['Хашаа', l.fenced ? 'Хашаатай' : 'Хашаагүй'], ['Нийтэлсэн', daysAgo(l.posted) + ' · ' + l.id]];
  $('modal-body').innerHTML = `<div class="m-thumb">${thumb(l)}</div>
  <div class="m-body"><div>
    <span class="eyebrow">ЖИШЭЭ ЗАР · ${esc(D.regions[l.region]?.aimag)}</span>
    <h2 id="m-title">${esc(l.title)}</h2>
    <p class="sub">${esc(l.desc)} ${l.negotiable ? 'Үнэ тохиролцоно.' : ''} ${l.loan ? 'Зээлтэй (үлдэгдэлтэй) — худалдан авахаас өмнө барьцааг заавал шалгана.' : ''}</p>
    <dl class="m-grid">${rows.map(([a, b]) => `<div><dt>${esc(a)}</dt><dd>${esc(b)}</dd></div>`).join('')}</dl>
  </div><div class="m-side">
    <div class="m-box"><h4>Үнийн шинжилгээ</h4>
      ${d ? `<div class="deal ${d.cls}"><i aria-hidden="true">${d.icon}</i>${esc(d.text)}</div>` : ''}
      <div class="range" role="img" aria-label="${esc(`₮/м² ${fmtN(l.ppm)}, хүрээ ${fmtN(lo)}–${fmtN(hi)}, медиан ${fmtN(d?.m)}`)}"><span class="med" style="left:${pos(d?.m ?? lo)}%"></span><span class="me" style="left:${pos(l.ppm)}%"></span></div>
      <div class="range-l"><span>${fmtN(lo)}</span><span>медиан ${fmtN(d?.m)}</span><span>${fmtN(hi)} ₮/м²</span></div>
      <p style="margin:10px 0 0">${l.res ? `${esc(rName(l.region))} бүсийн ${st.resCount} суурьшлын зартай харьцуулав.` : 'Бүх газар тариалангийн зартай харьцуулав.'} Медиан үнээр энэ талбай ≈ <b>${esc(fmtMoney(d ? d.m * l.area_m2 : null))}</b>.</p>
    </div>
    <div class="m-box"><h4>Шалгах зүйлс</h4><ul>
      <li>Гэрчилгээ, нэгж талбарын дугаарыг eGazar-аас тулгах</li><li>Өмчлөгч, барьцааг улсын бүртгэлээс лавлах</li>
      ${l.right !== 'ownership' ? '<li>Эзэмших/ашиглах эрхийн хугацаа, шилжүүлэх нөхцөлийг газрын албанаас асуух</li>' : ''}
      <li>Газар чөлөөлөлт, төлөвлөлтөд хамрагдсан эсэх</li></ul></div>
    <div class="m-box contact"><h4>Холбоо барих</h4>Энэ бол жишээ зар — худалдагчийн холбоо барих мэдээлэл байхгүй.</div>
    <button class="btn ${on ? 'subtle' : 'outline'}" data-cmp="${esc(l.id)}">${on ? '✓ Харьцуулалтаас хасах' : '+ Харьцуулалтад нэмэх'}</button>
  </div></div>`;
  const m = $('modal'); if (m.hidden) { m.hidden = false; openModal.prev = document.activeElement; $('modal-x').focus(); document.body.style.overflow = 'hidden'; }
}
function closeModal() { $('modal').hidden = true; document.body.style.overflow = ''; openModal.prev?.focus?.(); }

/* ---------- compare ---------- */
function renderCompare() {
  $('nav-compare').textContent = cmp.length;
  const items = cmp.map((id) => byId.get(id)).filter(Boolean);
  if (!items.length) { $('cmp').innerHTML = '<div class="cmp-empty">Харьцуулах газар сонгоогүй байна. Зарын “+ Харьцуулах” товчийг дарна уу.</div>'; return; }
  const cols = [...items, ...Array(3 - items.length).fill(null)];
  const best = (f, dir) => { const v = items.map(f); const b = dir < 0 ? Math.min(...v) : Math.max(...v); return items.length > 1 ? (l) => f(l) === b : () => false; };
  const rows = [
    ['Үнэ', (l) => fmtMoney(l.price_mnt), best((l) => l.price_mnt, -1)],
    ['₮ / м²', (l) => fmtN(l.ppm) + ' ₮', best((l) => l.ppm, -1)],
    ['Медиантай харьцуулахад', (l) => deal(l)?.text ?? '—', best((l) => deal(l)?.d ?? 0, -1)],
    ['Талбай', (l) => `${fmtN(l.area_m2)} м² (${fmtHa(l.area_m2)})`, best((l) => l.area_m2, 1)],
    ['Бүс', (l) => `${rName(l.region)}, ${l.spot}`], ['УБ-аас', (l) => l.km + ' км', best((l) => l.km, -1)],
    ['Эрхийн төрөл', (l) => D.rights[l.right]], ['Зориулалт', (l) => D.purposes[l.purpose]],
    ['Зам', (l) => ROAD[l.road]], ['Цахилгаан', (l) => (l.power ? '✓ Байгаа' : '✗ Байхгүй')], ['Ус', (l) => WATER[l.water]], ['Хашаа', (l) => (l.fenced ? '✓' : '✗')],
    ['Үнэ тохиролцох', (l) => (l.negotiable ? 'Тийм' : 'Үгүй')], ['Зээлтэй', (l) => (l.loan ? 'Тийм — барьцаа шалгах' : 'Үгүй')], ['Нийтэлсэн', (l) => daysAgo(l.posted)],
  ];
  let h = '<div class="lab head">Газар</div>' + cols.map((l) => (l ? `<div class="head">${esc(l.title)}<button data-cmp="${esc(l.id)}">Хасах ×</button></div>` : '<div class="head" style="color:#9aa69f">— хоосон —</div>')).join('');
  for (const [lab, f, isBest] of rows) h += `<div class="lab">${esc(lab)}</div>` + cols.map((l) => (l ? `<div class="${isBest && isBest(l) ? 'best' : ''}">${esc(f(l))}</div>` : '<div></div>')).join('');
  $('cmp').innerHTML = h;
}

/* ---------- tooltip ---------- */
const tip = $('tip');
function showTip(e, title, lines, color) {
  tip.replaceChildren();
  const t = document.createElement('strong'); t.textContent = title; tip.append(t);
  for (const ln of lines) { const d = document.createElement('div'); if (color && ln === lines[0]) { const k = document.createElement('span'); k.className = 'k'; k.style.background = color; d.append(k); } d.append(document.createTextNode(ln)); tip.append(d); }
  tip.hidden = false;
  const x = Math.min(e.clientX + 14, innerWidth - tip.offsetWidth - 10), y = Math.min(e.clientY + 14, innerHeight - tip.offsetHeight - 10);
  tip.style.left = x + 'px'; tip.style.top = y + 'px';
}
const hideTip = () => (tip.hidden = true);

/* ---------- analysis ---------- */
function renderKpis() {
  const regs = Object.keys(stats).filter((k) => stats[k].resMed);
  const cheap = regs.reduce((a, b) => (stats[a].resMed < stats[b].resMed ? a : b)), dear = regs.reduce((a, b) => (stats[a].resMed > stats[b].resMed ? a : b));
  const k = [
    ['Нийт зар', fmtN(L.length), `${Object.keys(D.regions).length} бүс`],
    ['Суурьшлын газрын медиан', fmtN(resMedAll), '₮ / м²'],
    ['Хамгийн хямд бүс', rName(cheap), fmtN(stats[cheap].resMed) + ' ₮/м²'],
    ['Хамгийн үнэтэй бүс', rName(dear), fmtN(stats[dear].resMed) + ' ₮/м²'],
    ['Газар тариалан, медиан', fmtMoney(farmMedAll * 10000), '1 га тутамд'],
  ];
  $('kpis').innerHTML = k.map(([a, b, c]) => `<div class="kpi"><span>${esc(a)}</span><strong>${esc(b)}</strong><small>${esc(c)}</small></div>`).join('');
  $('h-count').textContent = L.length;
  $('h-median').textContent = fmtN(resMedAll);
  $('h-007').textContent = fmtMoney(median(L.filter((l) => l.res && l.area_m2 >= 600 && l.area_m2 <= 800).map((l) => l.price_mnt)));
}
const NS = 'http://www.w3.org/2000/svg';
function svgEl(tag, attrs, parent) { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); parent?.append(e); return e; }
function renderRegionChart() {
  const regs = Object.keys(stats).filter((k) => stats[k].resMed).sort((a, b) => stats[b].resMed - stats[a].resMed);
  const W = 560, rowH = 34, top = 6, left = 118, right = 96, H = top + regs.length * rowH + 22;
  const max = Math.max(...regs.map((k) => stats[k].resMed)) * 1.05, x = (v) => left + (v / max) * (W - left - right);
  const svg = svgEl('svg', { viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': 'Бүсийн медиан ₮/м² баганан диаграм' });
  const g = svgEl('g', { class: 'grid' }, svg);
  for (const t of [0, 50000, 100000, 150000, 200000, 250000].filter((t) => t <= max)) {
    svgEl('line', { x1: x(t), x2: x(t), y1: top, y2: H - 20 }, g);
    svgEl('text', { x: x(t), y: H - 6, 'text-anchor': 'middle' }, svg).textContent = t ? fmtK(t) : '0';
  }
  regs.forEach((k, i) => {
    const s = stats[k], y = top + i * rowH, bh = 14, by = y + (rowH - bh) / 2, w = Math.max(4, x(s.resMed) - left);
    svgEl('text', { x: left - 10, y: by + 11, 'text-anchor': 'end' }, svg).textContent = rName(k);
    svgEl('path', { d: `M${left} ${by} H${left + w - 4} Q${left + w} ${by} ${left + w} ${by + 4} V${by + bh - 4} Q${left + w} ${by + bh} ${left + w - 4} ${by + bh} H${left} Z`, fill: 'var(--teal)' }, svg);
    const v = svgEl('text', { x: left + w + 8, y: by + 11, class: 'val' }, svg); v.textContent = fmtN(s.resMed) + ' ₮';
    const c = svgEl('tspan', { fill: '#8a958f', 'font-weight': 400 }, v); c.textContent = `  (${s.resCount})`;
    const hit = svgEl('rect', { x: 0, y, width: W, height: rowH, class: 'hit' }, svg);
    const lines = [`Медиан ${fmtN(s.resMed)} ₮/м²`, `Хүрээ ${fmtN(s.resMin)} – ${fmtN(s.resMax)} ₮/м²`, `${s.resCount} суурьшлын зар · УБ-аас ~${Math.round(s.kmMed)} км`];
    hit.addEventListener('pointermove', (e) => showTip(e, rName(k), lines, 'var(--teal)')); hit.addEventListener('pointerleave', hideTip);
  });
  $('chart-region').replaceChildren(svg);
}
function renderScatter() {
  const pts = L.filter((l) => l.res), W = 560, H = 300, m = { l: 56, r: 14, t: 10, b: 34 };
  const yMin = 5000, yMax = 500000, ly = (v) => Math.log10(v);
  const x = (v) => m.l + (v / 140) * (W - m.l - m.r), y = (v) => H - m.b - ((ly(v) - ly(yMin)) / (ly(yMax) - ly(yMin))) * (H - m.t - m.b);
  const svg = svgEl('svg', { viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': 'УБ-аас зай ба ₮/м² цэгэн диаграм' });
  const g = svgEl('g', { class: 'grid' }, svg);
  for (const t of [5000, 10000, 20000, 50000, 100000, 200000, 500000]) { svgEl('line', { x1: m.l, x2: W - m.r, y1: y(t), y2: y(t) }, g); svgEl('text', { x: m.l - 8, y: y(t) + 4, 'text-anchor': 'end' }, svg).textContent = fmtK(t); }
  for (const t of [0, 20, 40, 60, 80, 100, 120, 140]) svgEl('text', { x: x(t), y: H - m.b + 18, 'text-anchor': 'middle' }, svg).textContent = t;
  svgEl('text', { x: W - m.r, y: H - 2, 'text-anchor': 'end' }, svg).textContent = 'УБ-аас зай, км →';
  for (const l of pts) {
    const c = svgEl('circle', { cx: x(l.km), cy: y(Math.min(yMax, Math.max(yMin, l.ppm))), r: 5, fill: RIGHT_COLOR[l.right], stroke: 'var(--surface-1)', 'stroke-width': 2, tabindex: 0, style: 'cursor:pointer' }, svg);
    const lines = [D.rights[l.right], `${fmtN(l.ppm)} ₮/м² · ${fmtMoney(l.price_mnt)}`, `${fmtN(l.area_m2)} м² · УБ-аас ${l.km} км`];
    c.addEventListener('pointermove', (e) => showTip(e, `${rName(l.region)}, ${l.spot}`, lines, RIGHT_COLOR[l.right]));
    c.addEventListener('pointerleave', hideTip); c.addEventListener('click', () => { hideTip(); openModal(l.id); });
    c.addEventListener('keydown', (e) => { if (e.key === 'Enter') openModal(l.id); });
  }
  $('chart-scatter').replaceChildren(svg);
  $('legend-scatter').innerHTML = Object.entries(D.rights).map(([k, v]) => `<span><i style="background:${RIGHT_COLOR[k]}"></i>${esc(v)} (${pts.filter((l) => l.right === k).length})</span>`).join('');
}
function renderTable() {
  const regs = Object.keys(stats).sort((a, b) => (stats[b].resMed ?? 0) - (stats[a].resMed ?? 0));
  document.querySelector('#region-table tbody').innerHTML = regs.map((k) => { const s = stats[k];
    return `<tr><td>${esc(rName(k))}</td><td>${s.count}</td><td>${fmtN(s.resMed)}</td><td>${s.resMin ? fmtN(s.resMin) + ' – ' + fmtN(s.resMax) : '—'}</td><td>${esc(fmtMoney(s.priceMed))}</td><td>~${Math.round(s.kmMed)} км</td><td>${s.farmHa ? esc(fmtMoney(s.farmHa)) : '—'}</td></tr>`; }).join('');
}
function renderCalc() {
  const budget = Math.max(0, Number($('c-budget').value) || 0) * 1e6, want = Math.max(1, Number($('c-area').value) || 700);
  const regs = Object.keys(stats).filter((k) => stats[k].resMed).map((k) => ({ k, area: budget / stats[k].resMed, fits: L.filter((l) => l.region === k && l.res && l.price_mnt <= budget).length }))
    .sort((a, b) => b.area - a.area);
  $('calc-out').innerHTML = `<div class="calc-head"><span>Бүс</span><span>Хүссэн ${fmtN(want)} м²-ийн хэдэн хувийг авах вэ</span><span>Төсөвт багтах зар</span></div>` + regs.map((r) => {
    const pct = Math.min(1, r.area / want);
    return `<div class="crow" title="${esc(`Медиан үнээр ≈ ${fmtN(r.area)} м²`)}"><span>${esc(rName(r.k))}</span><span class="bar"><b class="${pct < 1 ? 'short' : ''}" style="width:${(pct * 100).toFixed(1)}%"></b></span><em>≈ ${fmtN(r.area)} м² · ${r.fits} зар</em></div>`;
  }).join('');
}

/* ---------- events ---------- */
document.addEventListener('click', (e) => {
  const o = e.target.closest('[data-open]'); if (o) { openModal(o.dataset.open); return; }
  const c = e.target.closest('[data-cmp]'); if (c) { toggleCmp(c.dataset.cmp); return; }
});
$('modal').addEventListener('click', (e) => { if (e.target === $('modal')) closeModal(); });
$('modal-x').addEventListener('click', closeModal);
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !$('modal').hidden) closeModal(); });
for (const id of ['f-region', 'f-purpose', 'f-right', 'sort', 'f-power', 'f-paved', 'f-water', 'f-fenced']) $(id).addEventListener('change', () => renderCards());
for (const id of ['f-pmin', 'f-pmax', 'f-amin', 'f-amax', 'f-text']) $(id).addEventListener('input', () => renderCards());
$('f-km').addEventListener('input', () => { $('f-km-v').textContent = $('f-km').value + ' км'; renderCards(); });
$('f-reset').addEventListener('click', () => {
  for (const id of ['f-region', 'f-purpose', 'f-right']) $(id).value = 'all';
  for (const id of ['f-pmin', 'f-pmax', 'f-amin', 'f-amax', 'f-text']) $(id).value = '';
  for (const id of ['f-power', 'f-paved', 'f-water', 'f-fenced']) $(id).checked = false;
  $('f-km').value = 140; $('f-km-v').textContent = '140 км'; renderCards();
});
$('more').addEventListener('click', () => { shown += PAGE; renderCards(false); });
$('quick').addEventListener('submit', (e) => {
  e.preventDefault(); $('f-region').value = $('q-region').value; $('f-purpose').value = $('q-purpose').value; $('f-pmax').value = $('q-budget').value; renderCards();
  $('listings').scrollIntoView({ behavior: 'smooth' });
});
$('cmp-clear').addEventListener('click', () => { cmp = []; saveCmp(); renderCards(false); renderCompare(); });
for (const id of ['c-budget', 'c-area']) $(id).addEventListener('input', renderCalc);

renderKpis(); renderCards(); renderCompare(); renderRegionChart(); renderScatter(); renderTable(); renderCalc();
