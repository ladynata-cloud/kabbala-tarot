'use strict';
(function(root){
 const object=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
 function create(book){
  if(!['tomer-devorah','bahir'].includes(book))throw Error('Неизвестный модуль.');
  const course='eliora-book-'+book+'-v1',fields=['before','working','note'];
  const empty=()=>({course,version:1,lessons:{}});
  const valid=id=>/^(?:[1-9]|1[0-2])$/.test(String(id));
  function normalize(raw){
   const out=empty();if(!object(raw)||raw.course!==course||raw.version!==1||!object(raw.lessons))return out;
   for(const [id,r] of Object.entries(raw.lessons)){
    if(!valid(id)||!object(r))continue;
    out.lessons[id]={done:r.done===true};
    for(const f of fields)out.lessons[id][f]=typeof r[f]==='string'&&r[f].length<=100000?r[f]:'';
   }return out;
  }
  function merge(old,raw){
   if(!object(raw)||raw.course!==course||raw.version!==1||!object(raw.lessons))throw Error('Выберите файл тетради именно этой книги.');
   for(const [id,r]of Object.entries(raw.lessons)){
    if(!valid(id)||!object(r))throw Error('В файле есть неизвестное занятие.');
    for(const f of fields)if(r[f]!==undefined&&(typeof r[f]!=='string'||r[f].length>100000))throw Error('В файле есть некорректная запись.');
   }
   const out=normalize(old),incoming=normalize(raw),sep='\n\n— Импортированная запись —\n';
   for(const [id,r]of Object.entries(incoming.lessons)){
    const a=out.lessons[id]||{before:'',working:'',note:'',done:false};
    for(const f of fields){if(r[f]&&a[f]!==r[f]&&!a[f].endsWith(sep+r[f]))a[f]=a[f]?a[f]+sep+r[f]:r[f];if(a[f].length>100000)throw Error('Объединённая запись слишком длинная. Сохраните обе копии отдельно.');}
    a.done=a.done||r.done;out.lessons[id]=a;
   }return out;
  }
  return {course,fields,empty,normalize,merge};
 }
 root.BookState={create};
})(typeof module==='object'?module.exports:globalThis);
