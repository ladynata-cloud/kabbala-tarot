'use strict';
(function(root){
 const APP='eliora-study-tools-v1', LIMIT=40000, MAX_REVISIONS=100;
 const obj=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
 const clone=x=>JSON.parse(JSON.stringify(x));
 function create(schema){
  const empty=()=>({app:APP,version:1,records:{}});
  function fields(key,raw){
   if(!obj(raw))throw Error('Некорректная запись.');
   const out={};
   for(const [k,v] of Object.entries(raw)){
    if(!schema[key].includes(k)||typeof v!=='string'||v.length>LIMIT)throw Error('Файл содержит неизвестное поле или слишком длинную запись.');
    out[k]=v;
   }return out;
  }
  function validate(raw){
   if(!obj(raw)||raw.app!==APP||raw.version!==1||!obj(raw.records))throw Error('Выберите JSON-файл тетради мастерских.');
   const out=empty();
   for(const [key,r] of Object.entries(raw.records)){
    if(!Object.hasOwn(schema,key)||!obj(r)||!Array.isArray(r.revisions)||r.revisions.length>MAX_REVISIONS)throw Error('Неизвестное упражнение или слишком много редакций.');
    out.records[key]={fields:fields(key,r.fields),revisions:r.revisions.map(v=>{
     if(!obj(v)||typeof v.at!=='string'||!/^\d{4}-\d\d-\d\dT/.test(v.at)||!Number.isFinite(Date.parse(v.at)))throw Error('Некорректная дата редакции.');
     return {at:v.at,fields:fields(key,v.fields)};
    })};
   }return out;
  }
  function record(state,key){if(!Object.hasOwn(schema,key))throw Error('Неизвестное упражнение.');return state.records[key]||(state.records[key]={fields:{},revisions:[]});}
  function snapshot(state,key,at=new Date().toISOString()){
   const r=record(state,key);if(!Object.values(r.fields).some(v=>v.trim()))return false;
   if(r.revisions.length&&JSON.stringify(r.revisions.at(-1).fields)===JSON.stringify(r.fields))return false;
   if(r.revisions.length>=MAX_REVISIONS)throw Error('Сохранено 100 редакций этого упражнения. Скачайте тетрадь; черновик можно продолжать редактировать.');
   r.revisions.push({at,fields:clone(r.fields)});return true;
  }
  function merge(a,b){
   const out=validate(a), incoming=validate(b);
   for(const [key,r] of Object.entries(incoming.records)){
    const dest=record(out,key);
    for(const [f,v] of Object.entries(r.fields)){
     const old=dest.fields[f]||'';
     if(v&&!old.includes(v))dest.fields[f]=old?old+'\n\n[Из загруженной тетради]\n'+v:v;
    }
    const seen=new Set(dest.revisions.map(v=>JSON.stringify(v)));
    for(const v of r.revisions){const sig=JSON.stringify(v);if(!seen.has(sig)){dest.revisions.push(clone(v));seen.add(sig);}}
    dest.revisions.sort((x,y)=>x.at.localeCompare(y.at));
   }
   return validate(out);
  }
  return {empty,validate,record,snapshot,merge};
 }
 const api={create};if(typeof module!=='undefined'&&module.exports)module.exports=api;root.StudyToolsState=api;
})(typeof window!=='undefined'?window:globalThis);
