'use strict';
const assert=require('node:assert/strict');
const {BookWorkshops:{dignity}}=require('../assets/course/book-workshops-core.js');
const suits=['wands','cups','swords','pentacles'];
for(const s of suits)assert.equal(dignity(s,s,s).kind,'strengthened');
for(const [a,b] of [['wands','cups'],['cups','wands'],['swords','pentacles'],['pentacles','swords']])assert.equal(dignity(a,b,b).kind,'weakened');
for(const center of suits){
 assert.equal(dignity(center,'wands','cups').kind,'outer-opposites');
 assert.equal(dignity(center,'swords','pentacles').kind,'outer-opposites');
 for(const l of suits)for(const r of suits)assert.deepEqual(dignity(center,l,r).kind,dignity(center,r,l).kind);
}
assert.equal(dignity('wands','swords','pentacles').kind,'outer-opposites');
assert.equal(dignity('swords','pentacles','wands').kind,'mixed');
assert.equal(dignity('wands','wands','swords').kind,'mixed');
assert.throws(()=>dignity('unknown','wands','cups'));
console.log('Dignities: explicit cases, outer-opposite exception, mixed cases, symmetry and invalid inputs passed.');
