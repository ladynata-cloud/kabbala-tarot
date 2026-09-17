'use strict';
const assert=require('node:assert/strict');
const {reduction,arithmetic,frame}=require('../assets/course/book-inquiry-core.js');
assert.deepEqual(reduction(2488),[2488,22,4]);
assert.deepEqual(reduction(126),[126,9]);
assert.deepEqual(arithmetic(4),{n:4,reduced:[4],sum:10,sumReduced:[10,1]});
assert.deepEqual(arithmetic(7),{n:7,reduced:[7],sum:28,sumReduced:[28,10,1]});
assert.deepEqual(arithmetic(5),{n:5,reduced:[5],sum:15,sumReduced:[15,6]});
assert.deepEqual(arithmetic(1),{n:1,reduced:[1],sum:1,sumReduced:[1]});
// Papus changes operations in 13 → 4 → 10 → 1; reduction alone stops at 4.
assert.deepEqual(reduction(13),[13,4]);
assert.deepEqual(arithmetic(reduction(13).at(-1)).sumReduced,[10,1]);
const upper=arithmetic(9999);assert.equal(upper.sum,49995000);assert.equal(upper.sumReduced.at(-1),9);
for(const n of [0,-1,1.5,NaN,Infinity,10000,'4',null])assert.throws(()=>arithmetic(n),RangeError);
assert.equal(frame(4,1).position,4);assert.equal(frame(4,4).position,1);
assert.equal(frame(7,4).position,4);assert.equal(frame(7,7).position,1);
assert.equal(frame(8,7).position,2);assert.equal(frame(10,7).position,4);
for(const [n,start] of [[5,1],[3,4],[6,7],[4,2],[4.5,4]])assert.throws(()=>frame(n,start),RangeError);
console.log('Papus: distinct operations, multi-step reductions, combined 13 example, bounds and overlapping group roles passed.');
