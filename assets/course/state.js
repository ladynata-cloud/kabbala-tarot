'use strict';
(function(root){
 const own=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);
 const dict=o=>o!==null&&typeof o==='object'&&!Array.isArray(o);
 const empty=()=>({version:2,lessons:{},notes:{},readings:{},large:false});
 function normalize(raw,meta){
  const out=empty();if(!dict(raw)||raw.version!==2)return out;
  out.large=raw.large===true;
  for(let i=1;i<=888;i++){
   const r=dict(raw.readings)&&own(raw.readings,i)?raw.readings[i]:undefined;
   if(!dict(r))continue;
   out.readings[i]={done:r.done===true,note:typeof r.note==='string'&&r.note.length<=100000?r.note:''};
  }
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
  if(dict(raw.readings))for(let i=1;i<=888;i++)if(own(raw.readings,i)&&(!dict(raw.readings[i])||(raw.readings[i].note!==undefined&&(typeof raw.readings[i].note!=='string'||raw.readings[i].note.length>100000))))throw Error('Некорректная запись к Зоару.');
  const merged=normalize(state,meta),incoming=normalize(raw,meta);
  for(let i=1;i<=888;i++){
   const a=merged.readings[i],b=incoming.readings[i];if(!b)continue;
   const before=a?.note||'',n=b.note||'',sep='\n\n— Импортированная запись —\n';
   const note=before&&n&&before!==n&&!before.endsWith(sep+n)?before+sep+n:(before||n);
   if(note.length>100000)throw Error('Объединённая запись к Зоару слишком велика.');
   merged.readings[i]={note,done:!!a?.done||b.done};
  }
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

