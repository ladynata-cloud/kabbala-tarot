'use strict';
(function(root){
 const letters='אבגדהוזחטיכלמנסעפצקרשת',values=[1,2,3,4,5,6,7,8,9,10,20,30,40,50,60,70,80,90,100,200,300,400];
 const table=Object.fromEntries([...letters].map((c,i)=>[c,values[i]]));Object.assign(table,{'ך':20,'ם':40,'ן':50,'ף':80,'ץ':90});
 function calculate(word){
  if(typeof word!=='string'||word.length>100)return {error:'Введите не более 100 знаков.'};
  const clean=word.normalize('NFD').replace(/[\u0591-\u05BD\u05BF-\u05C2\u05C4-\u05C5\u05C7]/g,'').replace(/[\s\-\u05BE\u05F3\u05F4'".,:;!?]/g,'');
  if(!clean)return {error:'Введите слово на иврите или выберите пример.'};
  if([...clean].some(c=>!Object.hasOwn(table,c)))return {error:'Здесь считаются только еврейские буквы. Выберите пример или введите слово на иврите.'};
  const terms=[...clean].map(c=>({letter:c,value:table[c]}));return {word:clean,terms,total:terms.reduce((n,t)=>n+t.value,0)};
 }
 root.CourseGematria={calculate};
 if(typeof document==='undefined')return;
 const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>Array.from(r.querySelectorAll(s));
 const gem=$('[data-gematria]');if(gem){const input=$('#gematria-word',gem),out=$('[data-gematria-output]',gem);const draw=()=>{const r=calculate(input.value);out.replaceChildren();if(r.error){out.textContent=r.error;return;}const word=document.createElement('bdi');word.lang='he';word.dir='rtl';word.textContent=r.word;out.append(word,document.createTextNode(': '+r.terms.map(t=>t.value).join(' + ')+' = '+r.total));};input.addEventListener('input',draw);$$('[data-gematria-example]',gem).forEach(b=>b.addEventListener('click',()=>{input.value=b.dataset.gematriaExample;draw();}));draw();}
 const catalogue=$('[data-card-catalogue]');if(!catalogue)return;
 const cards=$$('.tarot-card',catalogue),search=$('[data-card-search]'),group=$('[data-card-filter]'),rank=$('[data-rank-filter]');
 const normalize=s=>s.toLocaleLowerCase('ru').replaceAll('ё','е');
 function filter(){const q=normalize(search.value.trim()),g=group.value,n=rank.value;let count=0;cards.forEach(c=>{const inGroup=g==='all'||(g==='court'?c.dataset.cardGroup!=='major'&&Number(c.dataset.cardRank)>10:c.dataset.cardGroup===g);const inRank=n==='all'||(c.dataset.cardGroup!=='major'&&c.dataset.cardRank===n);const found=normalize(c.textContent).includes(q);c.hidden=!(inGroup&&inRank&&found);if(!c.hidden)count++;});$('[data-card-count]').textContent=count?'Показано карт: '+count:'Совпадений нет. Измените запрос или сбросьте фильтры.';}
 search.addEventListener('input',filter);group.addEventListener('change',filter);rank.addEventListener('change',filter);$('[data-clear-card-filters]').addEventListener('click',()=>{search.value='';group.value='all';rank.value='all';filter();});
 const selectors=$$('[data-compare]'),result=$('[data-compare-result]');function compare(){result.replaceChildren();selectors.forEach(s=>{const source=cards.find(c=>c.id==='card-'+s.value);if(!source)return;const copy=source.cloneNode(true);copy.removeAttribute('id');copy.hidden=false;copy.removeAttribute('data-search-item');result.append(copy);});}
 selectors.forEach(s=>s.addEventListener('change',compare));$('[data-swap-cards]').addEventListener('click',()=>{const a=selectors[0].value;selectors[0].value=selectors[1].value;selectors[1].value=a;compare();});compare();
 // A link to a card should reveal it even after filters have been used.
 function revealHash(){const id=location.hash.slice(1),c=cards.find(x=>x.id===id);if(c){search.value='';group.value='all';rank.value='all';filter();c.scrollIntoView({block:'start'});}}
 addEventListener('hashchange',revealHash);if(location.hash)revealHash();
})(typeof module==='object'?module.exports:globalThis);
