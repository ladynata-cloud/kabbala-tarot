'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const {records,version,site} = require('../assistant/v1/symbols.json');
const {respond} = require('../assets/course/symbols-assistant.js');
const rawCards = require('../content/tarot.json').cards;
const byId = id => records.find(r=>r.id===id);

test('the public catalogue reproduces all 78 reviewed scenes and 78 source pairs',()=>{
  assert.equal(site,'tarot');assert.equal(version,1);
  assert.equal(new Set(records.map(r=>r.id)).size,records.length);
  assert.equal(records.filter(r=>r.kind==='card').length,78);
  for (const card of rawCards) {
    const r=byId('rws-'+card.id);
    assert.equal(r.observation,card.scene);assert.equal(r.commentary,card.reading);
    assert.equal(r.question,card.question);
    assert.deepEqual(r.sources.map(x=>x.url),[card.imageSource,card.source]);
  }
});
test('every public entity and deep link refers to a real course page or anchor',()=>{
  const canon = require('../content/site.json').origin.replace(/\/$/u,'');
  for(const r of records){
    const url=new URL(r.url);assert.equal(url.origin,canon);
    assert.ok(!url.pathname.includes('notebook'),r.id);
    const html=fs.readFileSync(path.join(root,url.pathname,'index.html'),'utf8');
    if(url.hash)assert.ok(html.includes('id="'+url.hash.slice(1)+'"'),r.url);
    for(const s of r.sources){assert.ok(s.label && s.role);assert.match(s.url,/^https?:\/\//);}
  }
});
test('a question about authorship keeps the chosen card; explicitly naming another card changes it',()=>{
  const a=respond(records,'Отшельник');assert.equal(a.state.entityId,'rws-9');
  assert.match(a.reply,/фонарь/u);
  const b=respond(records,'Это слова Уэйта?',{},a.state);assert.equal(b.state.entityId,'rws-9');
  assert.match(b.reply,/пересказ/u);assert.deepEqual(b.links.slice(1).map(l=>l.url),byId('rws-9').sources.map(l=>l.url));
  const c=respond(records,'А источник у карты Башня?',{},b.state);assert.equal(c.state.entityId,'rws-16');
  assert.deepEqual(c.links.slice(1).map(l=>l.url),byId('rws-16').sources.map(l=>l.url));
});
test('schools, personal interpretation and unknown coverage remain distinguishable',()=>{
  assert.match(respond(records,'Отшельник в Марсельском Таро').reply,/пока нет/u);
  const different=respond(records,'Сравним Уэйта и Кроули');
  assert.deepEqual(different.links.map(x=>x.id),['study-pictorial-key','study-book-of-thoth']);
  assert.equal(respond(records,'роза в Зоаре').state.entityId,'study-zohar-rose');
  assert.equal(respond(records,'четыре мира').state.entityId,'practice-spread-workshop');
  assert.deepEqual(respond(records,'аэродинамика катамарана').links,[]);
  const guess=respond(records,'Что со мной случится?',{entityId:'rws-9'});
  assert.match(guess.reply,/нельзя установить/u);assert.ok(guess.reply.includes(byId('rws-9').question));
});

test('a request to extract private notes never fabricates or requests browser storage',()=>{
  const before=respond(records,'Отшельник').state;
  for(const q of ['Прочитай мою тетрадь', 'Что я записала вчера в личном дневнике?', 'Покажи мои записи', 'Найди в тетради описание расклада']) {
    const answer=respond(records,q,{},before);
    assert.match(answer.reply,/нет доступа/u);assert.match(answer.reply,/вставьте выбранный Вами фрагмент/u);
    assert.deepEqual(answer.links,[]);assert.equal(answer.state.entityId,'rws-9');
  }
  const source=fs.readFileSync(path.join(root,'assets/course/symbols-assistant.js'),'utf8');
  assert.doesNotMatch(source,/localStorage|sessionStorage|indexedDB/u);
});
