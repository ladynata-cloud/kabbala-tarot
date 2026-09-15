(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('./tarot-pairs-core.js'));else root.ReversalStudy=factory(root.TarotPairs);})(typeof globalThis!=='undefined'?globalThis:this,function(P){
 'use strict';
 const APP='eliora-reversal-study';
 function count(n){if(!Number.isInteger(n)||n<4||n>6)throw Error('Нужны четыре, пять или шесть позиций.');return 2**n;}
 function orientations(n,value){const total=count(n);if(!Number.isInteger(value)||value<0||value>=total)throw Error('Недопустимый вариант ориентации.');return Array.from({length:n},(_,i)=>Boolean(value&(1<<i)));}
 function mask(reversed){count(reversed.length);if(!reversed.every(v=>typeof v==='boolean'))throw Error('Нужны явно указанные ориентации.');return reversed.reduce((v,b,i)=>v+(b?2**i:0),0);}
 function patterns(n){return Array.from({length:count(n)},(_,value)=>({value,reversed:orientations(n,value),label:orientations(n,value).map(b=>b?'О':'П').join(' · ')}));}
 function apply(config,value){if(config.ids.length!==config.reversed.length)throw Error('Число карт и ориентаций различается.');mask(config.reversed);return {...config,ids:[...config.ids],roles:[...config.roles],reversed:orientations(config.ids.length,value)};}
 function flip(config,id){const i=config.ids.indexOf(id);if(i<0)throw Error('Карты нет в раскладе.');return apply(config,mask(config.reversed)^(1<<i));}
 function create(cards,method){const byId=new Map(cards.map(c=>[c.id,c]));return {describe(id){const card=byId.get(id);if(!card)throw Error('Неизвестная карта.');const m=P.cardMeta(card,method);return {id,name:card.name,principle:m.profile.principle,rows:m.rows.map(r=>[...r]),hypotheses:[
  {title:'Соразмерное проявление',text:m.profile.action,question:'Кому и при каких условиях это действие помогает?'},
  {title:'Недостаток',text:m.profile.lack,question:'Какой наблюдаемый факт говорит, что этой функции не хватает?'},
  {title:'Избыток',text:m.profile.excess,question:'По какому признаку полезная мера уже превышена?'},
  {title:'Искажение',text:m.profile.distortion,question:'Где заявленная цель расходится с действительным действием?'}
 ]};}};}
 return {APP,count,orientations,mask,patterns,apply,flip,create};
});
