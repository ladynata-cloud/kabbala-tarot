'use strict';
const assert=require('node:assert/strict');
const {StudyState}=require('../assets/course/study-state.js');
const books=['shaarei-orah','mystical-qabalah','book-of-thoth','pardes-rimmonim','tanya','etz-chaim','book-t','daat-tevunot','tarot-bohemians','nefesh-hachaim','levi-dogma-ritual','shaarei-kedusha','pictorial-key','derekh-hashem','mathers-tarot','kalach-pitchei-chokhmah','kabbalah-unveiled'];
for(const book of books){
 const s=StudyState.create(book),data=s.empty();
 data.lessons['1']={before:'Первый вопрос',working:'Черновик',note:'Моя мысль',done:true};
 data.lessons['8']={before:'',working:'Итоговый комментарий',note:'',done:false};
 assert.deepEqual(s.normalize(JSON.parse(JSON.stringify(data))),data);
 const incoming=s.empty();incoming.lessons['1']={before:'Новое предположение',working:'Черновик',note:'',done:false};
 const merged=s.merge(data,incoming);
 assert.ok(merged.lessons['1'].before.startsWith('Первый вопрос'));
 assert.ok(merged.lessons['1'].before.endsWith('Новое предположение'));
 assert.equal(merged.lessons['1'].done,true);
 assert.equal(merged.lessons['1'].note,'Моя мысль');
 assert.deepEqual(s.merge(merged,incoming),merged);
 const other=StudyState.create(books.find(x=>x!==book)).empty();
 assert.throws(()=>s.merge(data,other));
 const invalid=s.empty();invalid.lessons['9']={note:'Чужое занятие'};
 assert.throws(()=>s.merge(data,invalid));
 invalid.lessons={'1':{note:42}};
 assert.throws(()=>s.merge(data,invalid));
 assert.deepEqual(s.normalize(other),s.empty());
}
assert.throws(()=>StudyState.create('unknown'));
console.log('Seventeen independent notebooks: JSON round trip, preserved earlier answers, idempotent merge, wrong-book and invalid-lesson rejection passed.');
