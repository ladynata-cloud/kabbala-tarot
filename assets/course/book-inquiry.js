'use strict';
(()=>{
 const node=document.querySelector('#book-module-data');if(!node)return;
 const d=JSON.parse(node.textContent),$=s=>document.querySelector(s),C=BookInquiry;
 const el=(tag,text)=>{const x=document.createElement(tag);x.textContent=text;return x;};
 const number=$('#papus-number'),math=$('[data-papus-arithmetic]');
 if(number){
  $('[data-papus-calculate]').addEventListener('click',()=>{
   math.replaceChildren();try{
    if(!number.value.trim())throw new Error('Введите целое число от 1 до 9999.');
    const a=C.arithmetic(Number(number.value));number.removeAttribute('aria-invalid');
    math.append(el('h3','Только сокращение'),el('p',a.reduced.join(' → ')+(a.n<10?' — число уже однозначное.':'.')));
    math.append(el('h3','Сложение 1…'+a.n+', затем сокращение'));
    const sumText=a.n<=12?Array.from({length:a.n},(_,i)=>i+1).join(' + '):a.n+' × ('+a.n+' + 1) ÷ 2';
    math.append(el('p',sumText+' = '+a.sum+'.'),el('p','Сокращение суммы: '+a.sumReduced.join(' → ')+'.'),el('p','Сравните ответы: '+a.reduced.at(-1)+' и '+a.sumReduced.at(-1)+'. Укажите в черновике, чем различаются операции.'));
   }catch(e){number.setAttribute('aria-invalid','true');math.textContent=e.message;}
  });
  number.addEventListener('input',()=>{number.removeAttribute('aria-invalid');math.textContent='Число изменено. Сначала предположите оба результата, затем сравните операции.';});
 }
 const group=$('#papus-group'),member=$('#papus-member'),frameOut=$('[data-papus-frame-output]');
 if(group){
  group.addEventListener('change',()=>{const old=Number(member.value),start=Number(group.value);member.replaceChildren();for(let n=start;n<=start+3;n++){const o=el('option',String(n));o.value=String(n);member.append(o);}const kept=old>=start&&old<=start+3;member.value=String(kept?old:start);frameOut.textContent=(kept?'Число '+old+' сохранено. ':'Прежнее число не входит в группу; выбрано '+start+'. ')+'Группа изменилась: сначала назовите новую роль.';});
  member.addEventListener('change',()=>frameOut.textContent='Выбрано число '+member.value+'. Предскажите его роль в группе '+group.selectedOptions[0].textContent+'.');
  $('[data-papus-frame-check]').addEventListener('click',()=>{const f=C.frame(Number(member.value),Number(group.value));frameOut.textContent='Число '+f.n+' в группе '+group.selectedOptions[0].textContent+': позиция '+f.position+' из 4. '+f.role+'. '+(f.position===4?'Завершение может служить началом следующего цикла.':'Функция определена относительно выбранной группы.');});
 }
 const box=$('[data-argument-stage]');
 if(box){
  let stage=0;const next=$('[data-argument-next]'),feedback=$('[data-argument-feedback]'),stages=d.lab.stages;
  function draw(focus){
   next.disabled=true;box.replaceChildren();feedback.textContent='Сначала выберите ответ.';
   if(stage===stages.length){const h=el('h3','Три перехода восстановлены');h.tabIndex=-1;box.append(h,el('p','Теперь составьте собственный ответ без вариантов выбора в черновике ниже. Отдельно назовите цель, участие и предел частного вывода.'));feedback.textContent='Эта тренировка завершена. Запишите итог: он сохранится вместе с черновиком.';next.hidden=true;if(focus)h.focus();return;}
   next.hidden=false;next.textContent=stage===stages.length-1?'Завершить тренировку':'Следующий переход';
   const s=stages[stage],h=el('h3',s.title);h.tabIndex=-1;box.append(h,el('p',s.premise));
   const field=document.createElement('fieldset');field.append(el('legend',s.prompt));const choices=[];
   s.options.forEach(o=>{const b=el('button',o.text);b.type='button';b.className='button secondary';b.setAttribute('aria-pressed','false');b.addEventListener('click',()=>{choices.forEach(x=>x.setAttribute('aria-pressed',String(x===b)));feedback.textContent=(o.correct?'Верно. ':'Проверьте переход. ')+o.feedback;next.disabled=!o.correct;});choices.push(b);field.append(b);});box.append(field);
   if(s.hint){const details=document.createElement('details');details.append(el('summary','Опора для первого перехода'),el('p',s.hint));box.append(details);}
   if(focus)h.focus();
  }
  next.addEventListener('click',()=>{if(next.disabled)return;stage++;draw(true);});
  $('[data-argument-reset]').addEventListener('click',()=>{stage=0;draw(true);});draw(false);
 }
})();
