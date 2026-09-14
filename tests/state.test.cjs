const assert=require('node:assert/strict');
const {CourseState:C}=require('../assets/course/state.js');
const meta=[{id:1},{id:2}];
assert.deepEqual(C.normalize({version:2,lessons:null,notes:null},meta),C.empty());
assert.deepEqual(C.normalize({version:2,lessons:[],notes:[]},meta),C.empty());
const dirty=C.normalize({version:2,large:'yes',lessons:{1:{stage:'bad',answers:{0:2,1:100},score:NaN},7:{done:true}},notes:{1:42,2:'Мой вопрос',9:'ignored'}},meta);
assert.equal(dirty.lessons[1].stage,0);assert.equal(dirty.lessons[1].score,0);assert.deepEqual(dirty.lessons[1].answers,{0:2});assert.deepEqual(dirty.notes,{2:'Мой вопрос'});
const state=C.empty();state.notes[1]='Моя старая запись';state.lessons[1]={done:true,score:3,checked:true,answers:{0:1,1:0,2:2},reflection:true,stage:3};
const incoming={course:'eliora-kabbalah-v2',version:2,notes:{1:'Другая мысль',2:'Новая запись'},lessons:{1:{done:false,score:1},2:{done:true,score:1,checked:true}}};
const merged=C.merge(state,incoming,meta);assert.ok(merged.notes[1].startsWith(state.notes[1]));assert.ok(merged.notes[1].endsWith(incoming.notes[1]));assert.equal(merged.notes[2],'Новая запись');assert.equal(merged.lessons[1].done,true);assert.equal(merged.lessons[2].done,false);assert.equal(state.notes[1],'Моя старая запись');
assert.deepEqual(C.merge(merged,incoming,meta).notes,merged.notes);
assert.throws(()=>C.merge(state,{...incoming,notes:{1:{html:'bad'}}},meta));assert.throws(()=>C.merge(state,{...incoming,course:'other'},meta));
assert.equal(C.canComplete({score:3,checked:true},'Моя мысль о прочитанном отрывке',false),true);
assert.equal(C.canComplete({score:3,checked:false},'Моя мысль о прочитанном отрывке',true),false);
assert.equal(C.canComplete({score:2,checked:true},'Моя мысль о прочитанном отрывке',true),false);
assert.equal(C.canComplete({score:3,checked:true},'',false),false);assert.equal(C.canComplete({score:3,checked:true},'',true),true);
const data=require('../content/course.json');
for(const l of data.lessons){assert.ok(C.grade(l.quiz,l.quiz.map(q=>q.answer)).every(Boolean));assert.ok(C.grade(l.quiz,l.quiz.map(q=>(q.answer+1)%3)).every(v=>!v));}
console.log('State, import preservation, completion gates and grading for 72 questions: passed.');
