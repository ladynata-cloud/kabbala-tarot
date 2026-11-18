'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const one = (text, snippet) => text.split(snippet).length - 1 === 1;

test('first-circle short route survives the generated books page', () => {
  const source = read('content/books.html');
  const page = read('course/books/index.html');
  const route1 = 'href="#rose">перейдите сразу к примеру с розой →</a>';
  const route2 = 'href="#intro-done">отметьте первую встречу →</a>';
  for (const html of [source, page]) {
    assert.ok(one(html, route1), 'map must link to the rose exactly once');
    assert.ok(one(html, route2), 'rose must link to completion exactly once');
    assert.ok(html.indexOf('id="map"') < html.indexOf(route1));
    assert.ok(html.indexOf(route1) < html.indexOf('id="rose"'));
    assert.ok(html.indexOf('id="rose"') < html.indexOf(route2));
  }
  assert.ok(one(page, 'id="intro-done"'), 'completion anchor remains unique');
  assert.ok(page.indexOf(route2) < page.indexOf('id="intro-done"'));
  assert.ok(page.includes('<link rel="canonical" href="https://kabbala-tarot.online/course/books/"'));
  assert.ok(page.includes('<meta name="robots" content="index,follow'));
  assert.ok(source.includes('<meta name="robots" content="noindex">'));
});
