'use strict';
(function(root){
 const suits=['wands','cups','swords','pentacles'];
 const opposite=(a,b)=>(a==='wands'&&b==='cups')||(a==='cups'&&b==='wands')||(a==='swords'&&b==='pentacles')||(a==='pentacles'&&b==='swords');
 const friendly=(a,b)=>['swords,cups','cups,swords','swords,wands','wands,swords','wands,pentacles','pentacles,wands'].includes(a+','+b);
 function relation(a,b){return a===b?'та же масть':opposite(a,b)?'противоположная масть':friendly(a,b)?'дружественная связь':'для этой пары в кратком перечне не указана отдельная дружеская или противоположная связь';}
 function dignity(center,left,right){
  if(![center,left,right].every(x=>suits.includes(x)))throw Error('Неизвестная масть');
  if(opposite(left,right))return {kind:'outer-opposites',text:'Крайние соседи противоположны друг другу. По отдельной оговорке источника центральная карта мало затрагивается каждым из них. Не складываем независимые баллы за две стороны.'};
  if(center===left&&center===right)return {kind:'strengthened',text:'С обеих сторон та же масть, что в центре: центральное проявление сильно усиливается. Усиление не означает автоматически благоприятный исход; характер проявления требует отдельного чтения.'};
  if(opposite(center,left)&&opposite(center,right))return {kind:'weakened',text:'С обеих сторон природа, противоположная центру: центральное проявление сильно ослабляется. Ослабление не равно само по себе хорошему или плохому исходу.'};
  return {kind:'mixed',text:'Слева — '+relation(center,left)+'; справа — '+relation(center,right)+'. Краткий раздел не устанавливает единственный итоговый балл для такого сочетания. Сохраняем оба отношения и продолжаем конкретное чтение.'};
 }
 root.BookWorkshops={dignity};
})(typeof module==='object'?module.exports:globalThis);
