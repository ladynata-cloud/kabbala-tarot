'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {formula}=require('../assets/course/book-close-core.js').BookClose;
// Three worked cases are explicitly given in Lévi, Doctrine X, printed p. 96.
assert.equal(formula(5,'wands').formula,'Гвура Йод');
assert.equal(formula(7,'cups').formula,'Нецах первого Хе');
assert.equal(formula(8,'swords').formula,'Ход Вав');
assert.match(formula(8,'swords').example,/равновесие/);
// Keep the two axes independent; do not invent authorial prose for an unprovided case.
assert.equal(formula(5,'cups').sephira,formula(5,'wands').sephira);
assert.notEqual(formula(5,'cups').letter,formula(5,'wands').letter);
assert.equal(formula(5,'cups').letter,formula(7,'cups').letter);
assert.equal(formula(5,'cups').example,null);
assert.equal(formula(1,'pentacles').formula,'Кетер заключительного Хе');
assert.equal(formula(10,'swords').formula,'Малхут Вав');
const all=[];for(let n=1;n<=10;n++)for(const s of ['wands','cups','swords','pentacles'])all.push(formula(n,s));
assert.equal(new Set(all.map(x=>x.formula)).size,40);
assert.equal(all.filter(x=>x.example!==null).length,3);
for(const [n,s]of [[0,'wands'],[11,'wands'],[1.5,'cups'],[5,'toString'],['5','wands'],[NaN,'cups']])assert.throws(()=>formula(n,s),RangeError);
for(const slug of ['nefesh-hachaim','levi-dogma-ritual']){
 const d=JSON.parse(fs.readFileSync('content/'+slug+'.json','utf8'));
 for(const l of d.lessons){
  assert.ok(l.closeReading.original&&l.closeReading.translation&&l.closeReading.focus&&l.closeReading.ref.url);
  const html=fs.readFileSync('course/'+slug+'/'+l.slug+'/index.html','utf8');
  assert.ok(html.includes('book-close.css')&&html.includes('book-close-core.js')&&html.includes('study-state.js?v=5'));
  assert.ok(html.includes('lang="'+l.closeReading.lang+'"'));
  assert.equal(l.pedagogy.rubric.length,3);
 }
}
console.log('Lévi: 40 distinct formulas, 3 attributed examples, independent axes and invalid inputs passed. Close reading and new notebook assets present in all 16 lessons.');
