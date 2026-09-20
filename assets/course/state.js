'use strict';
(function(root){
 const own=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);
 const dict=o=>o!==null&&typeof o==='object'&&!Array.isArray(o);
 // obs: stage-2 «Мои наблюдения» under each card — {lessonId:{cardId:text}}; the course promises
 // that what the learner types is kept, and these fields used to be the only ones that were not.
 const empty=()=>({version:2,lessons:{},notes:{},obs:{},readings:{},large:false,intro:false});
 // quizVersion of a lesson in the page metadata (the page list uses qv, course.json uses quizVersion)
 const quizVersion=l=>Number.isInteger(l.qv)?l.qv:Number.isInteger(l.quizVersion)?l.quizVersion:undefined;
 const small=(o,max)=>{const out={};if(dict(o))for(let i=0;i<3;i++)if(Number.isInteger(o[i])&&o[i]>=0&&o[i]<=max)out[i]=o[i];return out;};
 function normalize(raw,meta){
  const out=empty();if(!dict(raw)||raw.version!==2)return out;
  out.large=raw.large===true;out.intro=raw.intro===true;
  for(let i=1;i<=888;i++){
   const r=dict(raw.readings)&&own(raw.readings,i)?raw.readings[i]:undefined;
   if(!dict(r))continue;
   out.readings[i]={done:r.done===true,note:typeof r.note==='string'&&r.note.length<=100000?r.note:''};
  }
  for(const l of meta){
   const n=dict(raw.notes)&&own(raw.notes,l.id)?raw.notes[l.id]:undefined;
   if(typeof n==='string'&&n.length<=100000)out.notes[l.id]=n;
   const o=dict(raw.obs)&&own(raw.obs,l.id)?raw.obs[l.id]:undefined;
   if(dict(o)){const kept={};for(const k of Object.keys(o))if(/^[A-Za-z0-9]{1,8}$/.test(k)&&typeof o[k]==='string'&&o[k].length<=2000&&o[k].trim())kept[k]=o[k];if(Object.keys(kept).length)out.obs[l.id]=kept;}
   const r=dict(raw.lessons)&&own(raw.lessons,l.id)?raw.lessons[l.id]:undefined;
   if(!dict(r))continue;
   const rec={score:Number.isInteger(r.score)?Math.max(0,Math.min(3,r.score)):0,checked:r.checked===true,done:r.done===true,stage:Number.isInteger(r.stage)?Math.max(0,Math.min(3,r.stage)):0,reflection:r.reflection===true,answers:small(r.answers,2),res:small(r.res,2),miss:small(r.miss,2)};
   const qv=quizVersion(l);
   if(qv!==undefined){
    // A changed quiz makes old answers meaningless: clear them, keep done, notes and reflection.
    if(r.qv!==qv){rec.answers={};rec.res={};rec.miss={};rec.score=0;rec.checked=false;}
    rec.qv=qv;
   }else if(Number.isInteger(r.qv))rec.qv=r.qv;
   out.lessons[l.id]=rec;
  }return out;
 }
 const resolvedCount=rec=>[0,1,2].filter(i=>rec&&rec.res&&rec.res[i]>0).length;
 function merge(state,raw,meta){
  if(!dict(raw)||raw.course!=='eliora-kabbalah-v2'||raw.version!==2||!dict(raw.notes)||!dict(raw.lessons))throw Error('Это не экспорт тетради этого курса.');
  for(const l of meta)if(own(raw.notes,l.id)&&(typeof raw.notes[l.id]!=='string'||raw.notes[l.id].length>100000))throw Error('Некорректная запись.');
  if(dict(raw.readings))for(let i=1;i<=888;i++)if(own(raw.readings,i)&&(!dict(raw.readings[i])||(raw.readings[i].note!==undefined&&(typeof raw.readings[i].note!=='string'||raw.readings[i].note.length>100000))))throw Error('Некорректная запись к Зоару.');
  const merged=normalize(state,meta),incoming=normalize(raw,meta);
  merged.intro=merged.intro||incoming.intro;
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
   // Observations are short per-card lines: an existing one wins, an empty slot takes the imported text.
   const io=incoming.obs[l.id];
   if(io){const m=merged.obs[l.id]||(merged.obs[l.id]={});for(const k of Object.keys(io))if(!m[k])m[k]=io[k];}
   const a=incoming.lessons[l.id];if(a){
    const old=merged.lessons[l.id];
    const better=!old||(!old.done&&(a.score>old.score||resolvedCount(a)>resolvedCount(old)));
    const selected=better?a:old;
    // judged on the raw record: a stale quiz version clears answers but a finished lesson stays finished
    const rr=raw.lessons[l.id],rres=dict(rr)?small(rr.res,2):{};
    const complete=a.done&&dict(rr)&&((rr.score===3&&rr.checked===true)||resolvedCount({res:rres})===3);
    merged.lessons[l.id]={...selected,answers:{...selected.answers},res:{...selected.res},miss:{...selected.miss},done:!!old?.done||complete,reflection:!!old?.reflection||a.reflection,stage:0};
   }
  }return merged;
 }
 function grade(quiz,answers){return quiz.map((q,i)=>Number(answers[i])===q.answer);}
 // Quiz v3: a question is resolved when answered correctly (res 1) or shown after the hint (res 2).
 // Records saved before v3 (checked, score 3) still count as resolved.
 function resolved(record,questions=3){if(!record)return false;if(record.res&&Array.from({length:questions},(_,i)=>record.res[i]>0).every(Boolean))return true;return record.checked===true&&record.score===questions;}
 function canComplete(record,note,thought,questions=3){return resolved(record,questions)&&(String(note??'').trim().length>0||thought===true);}
 // Stage 4 scaffold: several short fields are stored as ONE note string of labelled lines
 // («Текст: …»), followed by a blank line and any free text; parseNote reverses joinNote.
 function scaffoldLabels(placeholders){const seen=new Set();return (placeholders||[]).map((p,i)=>{let s=String(p).split(/[…:]/)[0].replace(/[\s=—–-]+$/,'').trim();if(!s)s='Строка '+(i+1);let t=s,k=2;while(seen.has(t))t=s+' '+(k++);seen.add(t);return t;});}
 function joinNote(labels,values,free){
  const lines=[];labels.forEach((lab,i)=>{const v=String(values[i]??'').trim();if(v)lines.push(lab+': '+v.split(/\r?\n/).map(x=>x.trim()).filter(Boolean).join('\n  '));});
  const rest=String(free??'').trim();
  return lines.join('\n')+(lines.length&&rest?'\n\n':'')+rest;
 }
 function parseNote(labels,note){
  const values=labels.map(()=>''),rows=String(note??'').replace(/\r\n/g,'\n').split('\n');
  const order=labels.map((l,i)=>[l,i]).sort((a,b)=>b[0].length-a[0].length);
  let cur=-1,k=0;
  for(;k<rows.length;k++){
   const row=rows[k];
   if(cur>=0&&row.startsWith('  ')&&row.trim()){values[cur]+='\n'+row.trim();continue;}
   const hit=order.find(([l])=>row.startsWith(l+': '));
   if(hit&&!values[hit[1]]){cur=hit[1];values[cur]=row.slice(hit[0].length+2).trim();continue;}
   if(!row.trim()&&cur>=0)k++;
   break;
  }
  return {values,free:rows.slice(k).join('\n').trim()};
 }
 root.CourseState={empty,normalize,merge,grade,resolved,canComplete,scaffoldLabels,joinNote,parseNote};
})(typeof module==='object'?module.exports:globalThis);
