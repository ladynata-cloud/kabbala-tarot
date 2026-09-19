// Design layer (tools/design.py): every browser asset parses, the lightbox carries all 78 cards,
// the service worker precaches only files that exist, and the manifest icons are present.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ROOT = path.resolve(__dirname, '..');

const walk = (d, out = []) => { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); e.isDirectory() ? walk(p, out) : out.push(p); } return out; };
const scripts = [...walk(path.join(ROOT, 'assets')).filter(f => f.endsWith('.js')), path.join(ROOT, 'sw.js')];
for (const f of scripts) {
  try { new vm.Script(fs.readFileSync(f, 'utf8'), { filename: f }); }
  catch (e) { assert.fail(`${path.relative(ROOT, f)}: ${e.message}`); }
}

const tv = fs.readFileSync(path.join(ROOT, 'assets/course/tarot-view.js'), 'utf8');
assert.ok(!tv.includes('/*__CARDS_JSON__*/'), 'tarot-view.js: card data not filled in');
const slugs = [...tv.matchAll(/"slug":"([a-z]+-\d\d)"/g)].map(m => m[1]);
assert.equal(slugs.length, 78); assert.equal(new Set(slugs).size, 78);
for (const s of slugs) for (const w of [240, 480, 960]) assert.ok(fs.existsSync(path.join(ROOT, 'assets/tarot', `${s}-${w}.webp`)), `${s}-${w}.webp`);
const tarot = require('../content/tarot.json').cards;
assert.ok(tarot.every(c => /^\/assets\/tarot\/[a-z]+-\d\d-240\.webp$/.test(c.image)), 'content/tarot.json: card images must be self-hosted');

const sw = fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8');
assert.match(sw, /const VERSION = 'kt-[0-9a-f]{10}';/);
const pre = /const PRECACHE = \[([\s\S]*?)\];/.exec(sw)[1];
for (const [, url] of pre.matchAll(/'(\/[^']*)'/g)) {
  const f = path.join(ROOT, url.endsWith('/') ? url + 'index.html' : url);
  assert.ok(fs.existsSync(f), `sw.js precaches a missing file: ${url}`);
}
const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'site.webmanifest'), 'utf8'));
for (const i of manifest.icons) assert.ok(fs.existsSync(path.join(ROOT, i.src)), i.src);

const sprite = fs.readFileSync(path.join(ROOT, 'assets/emblems/emblems.svg'), 'utf8');
const ids = new Set([...sprite.matchAll(/<symbol\b[^>]*\bid="([^"]+)"/g)].map(m => m[1]));
for (const e of require('../tools/design/course/line-emblems.json')) assert.ok(ids.has(e.emblem), e.emblem);
console.log(`Design: ${scripts.length} scripts parse, 78 cards × 3 sizes, offline precache and emblem ids verified.`);
