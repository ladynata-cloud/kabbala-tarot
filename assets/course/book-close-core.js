'use strict';
(function(root){
 const names=['Кетер','Хохма','Бина','Хесед','Гвура','Тиферет','Нецах','Ход','Йесод','Малхут'];
 const suits={wands:{name:'Жезлы',letter:'Йод'},cups:{name:'Кубки',letter:'первого Хе'},swords:{name:'Мечи',letter:'Вав'},pentacles:{name:'Круги / Пентакли',letter:'заключительного Хе'}};
 const examples={'5:wands':'Справедливость творца или гнев человека.','7:cups':'Победа милости или торжество женщины.','8:swords':'Борьба или вечное равновесие.'};
 function formula(number,suit){
  if(!Number.isInteger(number)||number<1||number>10||!Object.hasOwn(suits,suit))throw new RangeError('Выберите достоинство от туза до 10 и масть из списка.');
  const s=suits[suit];return {number,suit:s.name,sephira:names[number-1],letter:s.letter,formula:names[number-1]+' '+s.letter,example:examples[number+':'+suit]||null};
 }
 root.BookClose={formula};
})(typeof module==='object'?module.exports:globalThis);
