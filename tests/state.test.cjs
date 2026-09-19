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
console.log('State, import preservation, completion gates and grading for all course questions: passed.');
// Old exports remain usable after the expansion; readings survive ordinary lesson saves.
const expandedMeta=require('../content/course.json').lessons;
const oldState={version:2,lessons:{24:{done:true,checked:true,score:3}},notes:{24:'Сохранённая мысль до расширения'}};
const expanded=C.normalize(oldState,expandedMeta);assert.equal(expanded.notes[24],oldState.notes[24]);assert.equal(expanded.lessons[24].done,true);
expanded.readings[1]={note:'Первое чтение',done:true};expanded.readings[88]={note:'Последняя заметка',done:false};
assert.deepEqual(C.normalize(expanded,expandedMeta).readings,expanded.readings);
const readImport={...oldState,course:'eliora-kabbalah-v2',readings:{1:{note:'Другая мысль',done:false},88:{note:'Последняя заметка',done:true}}};
const readMerged=C.merge(expanded,readImport,expandedMeta);assert.equal(readMerged.readings[1].done,true);assert.ok(readMerged.readings[1].note.includes('Первое чтение'));assert.ok(readMerged.readings[1].note.includes('Другая мысль'));assert.equal(readMerged.readings[88].done,true);
assert.deepEqual(C.merge(readMerged,readImport,expandedMeta).readings,readMerged.readings);
assert.deepEqual(C.merge(readMerged,{...oldState,course:'eliora-kabbalah-v2'},expandedMeta).readings,readMerged.readings);
assert.throws(()=>C.merge(expanded,{...readImport,readings:{1:{note:{bad:true}}}},expandedMeta));
const {CourseGematria:G}=require('../assets/course/extensions.js');
assert.equal(G.calculate('חי').total,18);assert.equal(G.calculate('חַי').total,18);assert.equal(G.calculate('אהבה').total,13);assert.equal(G.calculate('אחד').total,13);
assert.equal(G.calculate('מלך').total,90);assert.equal(G.calculate('ךםןףץ').total,280);assert.ok(G.calculate('Наталья').error);assert.ok(G.calculate('חי18').error);assert.ok(G.calculate('').error);
assert.equal(G.calculate('שלום').total,376);
console.log('Expanded progress, Zohar note merging, old imports and Hebrew gematria: passed.');
// A notebook made before the expansion must not discard newer reading records.
const thousand=C.empty();thousand.readings[88]={note:'Старая запись',done:true};thousand.readings[89]={note:'Новая запись',done:false};thousand.readings[888]={note:'Последняя из 888',done:true};
const restored888=C.normalize(JSON.parse(JSON.stringify(thousand)),expandedMeta);
assert.deepEqual(restored888.readings,thousand.readings);
const merged888=C.merge(restored888,{version:2,course:'eliora-kabbalah-v2',lessons:{},notes:{},readings:{88:{note:'Ещё одна старая мысль',done:false}}},expandedMeta);
assert.equal(merged888.readings[888].note,'Последняя из 888');assert.equal(merged888.readings[89].note,'Новая запись');assert.ok(merged888.readings[88].note.includes('Старая запись'));
assert.throws(()=>C.merge(thousand,{version:2,course:'eliora-kabbalah-v2',lessons:{},notes:{},readings:{888:{note:42}}},expandedMeta));
// Course v3: quiz version, per-question resolution, intro flag, scaffold notes; old v2 exports still import.
{
const v3meta=[{id:1,qv:3},{id:2,qv:3},{id:3}];
// An old v2 saved state (live site before v3): answers without qv, done lessons and notes.
const oldV2={version:2,large:true,lessons:{1:{done:true,checked:true,score:3,stage:3,reflection:false,answers:{0:1,1:0,2:2}},2:{done:false,checked:true,score:2,stage:2,answers:{0:0,1:1,2:2}},3:{done:false,score:1,checked:true,answers:{0:2}}},notes:{1:'Запись из старой версии',2:'Черновик'}};
const n=C.normalize(oldV2,v3meta);
assert.equal(n.lessons[1].done,true);assert.equal(n.notes[1],'Запись из старой версии');assert.equal(n.notes[2],'Черновик');assert.equal(n.large,true);
assert.deepEqual(n.lessons[1].answers,{});assert.deepEqual(n.lessons[1].res,{});assert.equal(n.lessons[1].score,0);assert.equal(n.lessons[1].checked,false);assert.equal(n.lessons[1].qv,3);assert.equal(n.lessons[1].stage,3);
assert.deepEqual(n.lessons[2].answers,{});assert.equal(n.lessons[2].done,false);
assert.deepEqual(n.lessons[3].answers,{0:2},'a lesson without quizVersion keeps its answers');
assert.equal(n.intro,false);
// A v3 record survives a round trip; garbage in res/miss is dropped.
const v3={version:2,intro:true,lessons:{1:{qv:3,answers:{0:1,1:2,2:0},res:{0:1,1:2,2:7},miss:{1:2,2:'x'},score:2,checked:false,stage:2}},notes:{}};
const n3=C.normalize(v3,v3meta);assert.equal(n3.intro,true);assert.deepEqual(n3.lessons[1].res,{0:1,1:2});assert.deepEqual(n3.lessons[1].miss,{1:2});assert.deepEqual(n3.lessons[1].answers,{0:1,1:2,2:0});
assert.deepEqual(C.normalize(JSON.parse(JSON.stringify(n3)),v3meta),n3);
// A stale quiz version clears answers but keeps done, notes and reflection.
const stale=C.normalize({version:2,lessons:{1:{qv:2,done:true,reflection:true,res:{0:1,1:1,2:1},answers:{0:1}}},notes:{1:'Моя мысль'}},v3meta);
assert.equal(stale.lessons[1].done,true);assert.equal(stale.lessons[1].reflection,true);assert.deepEqual(stale.lessons[1].res,{});assert.equal(stale.notes[1],'Моя мысль');
// Completion: all three resolved (correct or via hint) and a note or the tick.
assert.equal(C.resolved({res:{0:1,1:2,2:1}}),true);assert.equal(C.resolved({res:{0:1,1:2}}),false);assert.equal(C.resolved({res:{0:1,1:0,2:1}}),false);
assert.equal(C.canComplete({res:{0:1,1:2,2:1}},'Одна строка',false),true);
assert.equal(C.canComplete({res:{0:1,1:2,2:1}},'   ',false),false);
assert.equal(C.canComplete({res:{0:1,1:2,2:1}},'',true),true);
assert.equal(C.canComplete({res:{0:1,1:2}},'Длинная и подробная запись',true),false);
assert.equal(C.canComplete({score:3,checked:true},'Коротко',false),true,'a record saved before v3 still counts as resolved');
// Import of an old v2 export (course marker, no qv/res/intro) into a v3 state.
const cur=C.normalize({version:2,intro:true,lessons:{2:{qv:3,res:{0:1,1:1,2:2},score:3,checked:true,done:true}},notes:{2:'Новая запись'}},v3meta);
const imported=C.merge(cur,{...oldV2,course:'eliora-kabbalah-v2'},v3meta);
assert.equal(imported.lessons[1].done,true,'old done lesson kept on import');assert.equal(imported.notes[1],'Запись из старой версии');
assert.ok(imported.notes[2].startsWith('Новая запись')&&imported.notes[2].endsWith('Черновик'));
assert.equal(imported.lessons[2].done,true);assert.deepEqual(imported.lessons[2].res,{0:1,1:1,2:2});assert.equal(imported.intro,true);
assert.deepEqual(C.merge(imported,{...oldV2,course:'eliora-kabbalah-v2'},v3meta).notes,imported.notes,'repeated import is idempotent');
// An incoming v3 export with res marks a lesson done; intro flag travels.
const fresh=C.merge(C.empty(),{version:2,course:'eliora-kabbalah-v2',intro:true,lessons:{2:{qv:3,res:{0:1,1:2,2:1},done:true}},notes:{2:'Строка'}},v3meta);
assert.equal(fresh.lessons[2].done,true);assert.equal(fresh.intro,true);
// Scaffold fields ↔ one note string with labelled lines.
const labels=C.scaffoldLabels(['Текст: …','Обсуждение: …','Ближе всего карта… потому что на рисунке…','32 = …','Сефирот здесь — …, а на Древе — …','Текст: …','Запомнилось']);
assert.deepEqual(labels,['Текст','Обсуждение','Ближе всего карта','32','Сефирот здесь','Текст 2','Запомнилось']);
const vals=['«Помни день субботний»','сорок без одной\nработ','','','Тиферет','','суббота'];
const joined=C.joinNote(labels,vals,'Свободная мысль\nв две строки');
assert.equal(joined,'Текст: «Помни день субботний»\nОбсуждение: сорок без одной\n  работ\nСефирот здесь: Тиферет\nЗапомнилось: суббота\n\nСвободная мысль\nв две строки');
const back=C.parseNote(labels,joined);assert.deepEqual(back.values,vals);assert.equal(back.free,'Свободная мысль\nв две строки');
assert.deepEqual(C.parseNote(labels,'Старая запись без подписей\nвторая строка'),{values:labels.map(()=>''),free:'Старая запись без подписей\nвторая строка'});
assert.equal(C.joinNote(labels,labels.map(()=>''),''),'');
assert.equal(C.parseNote(['Текст'],C.joinNote(['Текст'],['а'],'')).values[0],'а');
// Every v3 lesson in the course: quiz grading and a meta list with quiz versions.
const course=require('../content/course.json');
const pageMeta=course.lessons.map(l=>({id:l.id,qv:l.quizVersion}));
const all=C.normalize({version:2,lessons:Object.fromEntries(course.lessons.map(l=>[l.id,{done:true,answers:{0:0}}])),notes:{}},pageMeta);
assert.ok(course.lessons.every(l=>all.lessons[l.id].done&&(l.quizVersion===undefined||Object.keys(all.lessons[l.id].answers).length===0)));
for(const l of course.lessons)if(l.quizVersion===3)assert.ok(l.quiz.every(q=>q.feedback.length===3&&q.hint));
console.log('Quiz v3 storage: old v2 state and exports keep done lessons and notes, stale answers cleared, resolution gate, intro flag, scaffold notes: passed.');
}
