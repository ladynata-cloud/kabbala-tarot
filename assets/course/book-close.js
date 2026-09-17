'use strict';
(()=>{
 const node=document.querySelector('#book-module-data');if(!node)return;
 const d=JSON.parse(node.textContent),$=s=>document.querySelector(s);
 const el=(tag,text)=>{const n=document.createElement(tag);n.textContent=text;return n;};
 const axis=$('#comparison-axis'),comparison=$('[data-comparison-output]');
 if(axis){
  axis.addEventListener('change',()=>{comparison.textContent='Основание изменено. Сначала предскажите новый вывод и объясните его.';});
  $('[data-comparison-check]').addEventListener('click',()=>{const a=d.lab.axes[Number(axis.value)];if(!a)return;comparison.replaceChildren(el('h3',a.verdict),el('p','Основание: '+a.reason),el('p','Граница вывода: '+a.limit));});
 }
 const number=$('#levi-number'),suit=$('#levi-suit'),out=$('[data-levi-output]');
 if(number){
  const changed=()=>{out.textContent='Сочетание изменено. Что осталось прежним: сефира числа или буква масти? Предскажите формулу.';};
  number.addEventListener('change',changed);suit.addEventListener('change',changed);
  $('[data-levi-check]').addEventListener('click',()=>{
   try{const f=BookClose.formula(Number(number.value),suit.value);out.replaceChildren(el('h3',f.formula),el('p','Числовая ось: '+(f.number===1?'туз':f.number)+' → '+f.sephira+'. Мастевая ось: '+f.suit+' → '+f.letter+'.'));
    if(f.example)out.append(el('h4','Авторский пример · «Учение» X, с. 96'),el('p',f.example));
    else out.append(el('h4','Самостоятельный комментарий'),el('p','В выбранном абзаце с. 96 отдельного толкования этого сочетания нет. Формула составлена по таблице с. 94–95. Предложите своё объяснение и обозначьте его как учебный вывод.'));
    out.append(el('p','В черновике объясните связь двух осей. Формула сама по себе не является прогнозом события.'));
   }catch(e){out.textContent=e.message;}
  });
 }
})();
