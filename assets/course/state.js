'use strict';
(function(root){
 const own=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);
 const dict=o=>o!==null&&typeof o==='object'&&!Array.isArray(o);
 const empty=()=>({version:2,lessons:{},notes:{},large:false});
 function normalize(raw,meta){
  const out=empty();if(!dict(raw)||raw.version!==2)return out;
  out.large=raw.large===true;
  for(const l of meta){
   const n=dict(raw.notes)&&own(raw.notes,l.id)?raw.notes[l.id]:undefined;
   if(typeof n==='string'&&n.length<=100000)out.notes[l.id]=n;
   const r=dict(raw.lessons)&&own(raw.lessons,l.id)?raw.lessons[l.id]:undefined;
   if(!dict(r))continue;
   const answers={};if(dict(r.answers))for(let i=0;i<3;i++)if(Number.isInteger(r.answers[i])&&r.answers[i]>=0&&r.answers[i]<=2)answers[i]=r.answers[i];
   out.lessons[l.id]={score:Number.isInteger(r.score)?Math.max(0,Math.min(3,r.score)):0,checked:r.checked===true,done:r.done===true,stage:Number.isInteger(r.stage)?Math.max(0,Math.min(3,r.stage)):0,reflection:r.reflection===true,answers};
  }return out;
 }
 function merge(state,raw,meta){
  if(!dict(raw)||raw.course!=='eliora-kabbalah-v2'||raw.version!==2||!dict(raw.notes)||!dict(raw.lessons))throw Error('Это не экспорт тетради этого курса.');
  for(const l of meta)if(own(raw.notes,l.id)&&(typeof raw.notes[l.id]!=='string'||raw.notes[l.id].length>100000))throw Error('Некорректная запись.');
  const merged=normalize(state,meta),incoming=normalize(raw,meta);
  for(const l of meta){
   const n=incoming.notes[l.id];if(typeof n==='string'&&n.trim()){
    const before=merged.notes[l.id]||'';
    const combined=before&&before!==n&&!before.endsWith('\n\n— Импортированная запись —\n'+n)?before+'\n\n— Импортированная запись —\n'+n:(before||n);
    if(combined.length>100000)throw Error('После объединения запись слишком велика. Сохраните её отдельно и сократите перед импортом.');
    merged.notes[l.id]=combined;
   }
   const a=incoming.lessons[l.id];if(a){const old=merged.lessons[l.id];const selected=!old||(!old.done&&a.score>old.score)?a:old;merged.lessons[l.id]={...selected,answers:{...selected.answers},done:!!old?.done||(a.done&&a.score===3&&a.checked),reflection:!!old?.reflection||a.reflection,stage:0};}
  }return merged;
 }
 function grade(quiz,answers){return quiz.map((q,i)=>Number(answers[i])===q.answer);}
 function canComplete(record,note,thought,questions=3){return record.checked===true&&record.score===questions&&(String(note).trim().length>=20||thought===true);}
 root.CourseState={empty,normalize,merge,grade,canComplete};
})(typeof module==='object'?module.exports:globalThis);
