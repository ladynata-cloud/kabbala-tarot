'use strict';
(function(root){
 const object=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
 const empty=()=>({course:'eliora-yetzirah-v1',version:1,lessons:{}});
 const validId=id=>/^(?:[1-9]|1[0-2])$/.test(String(id));
 function normalize(raw){
  const out=empty();if(!object(raw)||raw.course!==out.course||raw.version!==1||!object(raw.lessons))return out;
  for(const [id,r] of Object.entries(raw.lessons)){
   if(!validId(id)||!object(r))continue;
   const quiz={};if(object(r.quiz))for(let i=0;i<2;i++)if(Number.isInteger(r.quiz[i])&&r.quiz[i]>=0&&r.quiz[i]<3)quiz[i]=r.quiz[i];
   out.lessons[id]={before:typeof r.before==='string'&&r.before.length<=100000?r.before:'',note:typeof r.note==='string'&&r.note.length<=100000?r.note:'',done:r.done===true,quiz};
  }return out;
 }
 function merge(old,raw){
  if(!object(raw)||raw.course!=='eliora-yetzirah-v1'||raw.version!==1||!object(raw.lessons))throw Error('Выберите экспорт тетради модуля «Сефер Йецира».');
  for(const [id,r] of Object.entries(raw.lessons)){
   if(!validId(id)||!object(r))throw Error('В файле есть неизвестное занятие.');
   for(const k of ['before','note'])if(r[k]!==undefined&&(typeof r[k]!=='string'||r[k].length>100000))throw Error('Некорректная или слишком длинная запись.');
  }
  const result=normalize(old),inc=normalize(raw),sep='\n\n— Импортированная запись —\n';
  for(const [id,r] of Object.entries(inc.lessons)){
   const a=result.lessons[id]||{before:'',note:'',done:false,quiz:{}};
   for(const k of ['before','note']){
    const v=r[k];if(v&&a[k]!==v&&!a[k].endsWith(sep+v))a[k]=a[k]?a[k]+sep+v:v;
    if(a[k].length>100000)throw Error('После объединения запись слишком велика. Сохраните её отдельно и сократите перед импортом.');
   }
   a.done=a.done||r.done;a.quiz={...r.quiz,...a.quiz};result.lessons[id]=a;
  }return result;
 }
 function countPairs(n,ordered=false){if(!Number.isInteger(n)||n<2||n>22)throw Error('Некорректное количество знаков');return n*(n-1)/(ordered?1:2);}
 function factorial(n){if(!Number.isInteger(n)||n<0||n>7)throw Error('Некорректное число элементов');let out=1;for(let i=2;i<=n;i++)out*=i;return out;}
 root.YetzirahState={empty,normalize,merge,countPairs,factorial};
})(typeof module==='object'?module.exports:globalThis);
