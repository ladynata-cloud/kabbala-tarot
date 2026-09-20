'use strict';
// Lab self-checks (labs.js pure functions): the Hermit question filter, the observe label filter and verb check,
// the pair detail matcher. Examples come from QA: every one of them was once accepted or rejected wrongly.
const assert=require('node:assert/strict');
const {CourseLabs:L}=require('../assets/course/labs.js');
const lessonBad=['обязательно','точно','когда'];
// 22 · Отшельник: questions about the future or another person's head are turned back.
for(const q of ['Что меня ждёт?','Сможет ли он меня полюбить?','Что он на самом деле думает обо мне?','Почему мне одиноко?','Когда я выйду замуж?','Получится ли у меня?','Что будет с проектом?','Любит ли она меня?','Стоит ли мне увольняться?','Что мне ждать от разговора?'])
 assert.equal(L.questionVerdict(q,lessonBad).ok,false,q);
assert.equal(L.questionVerdict('Что меня ждёт?',lessonBad).kind,'future');
assert.equal(L.questionVerdict('Что он на самом деле думает обо мне?',lessonBad).kind,'mind');
assert.equal(L.questionVerdict('Почему мне одиноко?',lessonBad).kind,'start');
for(const q of ['Что мне прояснить перед разговором?','С чего мне начать поиск работы?','Какие сведения мне собрать?','Мой вопрос: что я могу сделать завтра?','Что я могу изменить в своём расписании?','Как мне подготовиться к встрече?'])
 assert.equal(L.questionVerdict(q,lessonBad).ok,true,q);
// 26 · Умеренность: labels, one-word lines and forecasts are not observations; a verb line needs a verb.
for(const o of ['гармония','Вижу: терпение','всё будет хорошо','ангел','баланс','спокойствие','равновесие'])
 assert.equal(L.obsVerdict(o).ok,false,o);
assert.equal(L.obsVerdict('гармония').kind,'label');
assert.equal(L.obsVerdict('ангел').kind,'one');
assert.equal(L.obsVerdict('всё будет хорошо').kind,'future');
for(const o of ['Вижу: ангел льёт воду из чаши в чашу','одна нога стоит в воде','на груди треугольник в квадрате','вдали дорога к горам'])
 assert.equal(L.obsVerdict(o).ok,true,o);
for(const v of ['гармонизировать','успокаивать','нога','чаша'])assert.equal(L.verbVerdict(v).ok,false,v);
for(const v of ['переливать','стоит одной ногой в воде','вода переходит из чаши в чашу','держит'])assert.equal(L.verbVerdict(v).ok,true,v);
// 43 · пара: a short detail word matches its own forms, not the start of a longer word.
assert.equal(L.hasDetail('городской пейзаж',['город']),false);
assert.equal(L.hasDetail('вдали город',['город']),true);
assert.equal(L.hasDetail('у стен города',['город']),true);
assert.equal(L.hasDetail('мастер вырезает пентакли у столба',['пентакль','столб']),true);
assert.equal(L.hasDetail('столбик',['столб']),true);
assert.equal(L.hasDetail('ничего общего',['столб']),false);
console.log('LABS_SELFTEST_OK: Hermit questions, observe labels and verbs, pair details.');
