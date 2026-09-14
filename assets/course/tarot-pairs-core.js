/* Pure pair enumeration, teaching prompts and notebook validation. No network. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.TarotPairs = factory();
})(typeof globalThis === 'object' ? globalThis : this, function () {
  'use strict';
  const LENSES = {
    aspects: {label: 'Два аспекта ситуации', roles: ['Первый аспект', 'Второй аспект']},
    development: {label: 'Развитие: от А к Б', roles: ['Отправная точка', 'Следующее действие']},
    resource: {label: 'Ресурс → действие', roles: ['Доступный ресурс', 'Как его применить']},
    obstacle: {label: 'Препятствие → совет', roles: ['Что мешает', 'С чем работать']}
  };
  const TEXT_FIELDS = ['question','observationA','observationB','connection','evidence','alternative','conclusion'];
  const CHECKS = ['images','positions','tradition','alternative'];
  const CONDITIONS = ['open','balanced','lack','excess','distortion'];
  const CONDITION_LABELS = {open:'Пока не определено',balanced:'Соразмерное проявление',lack:'Недостаток',excess:'Избыток',distortion:'Искажение'};
  function count(order, reversals, n = 78) { return n * (n - 1) / (order === 'pair' ? 2 : 1) * (reversals ? 4 : 1); }
  function normalize(input, cards) {
    const ids = cards.map(c => c.id), s = {a: ids.includes(input.a) ? input.a : ids[1], b: ids.includes(input.b) ? input.b : (ids.includes('p8') ? 'p8' : ids[2]), order: input.order === 'pair' ? 'pair' : 'sequence', reversals: input.reversals === true, ra: input.ra === true, rb: input.rb === true, lens: input.lens};
    if (s.a === s.b) s.b = ids.find(id => id !== s.a);
    if (!s.reversals) s.ra = s.rb = false;
    if (s.order === 'pair' && ids.indexOf(s.a) > ids.indexOf(s.b)) { [s.a,s.b] = [s.b,s.a]; [s.ra,s.rb] = [s.rb,s.ra]; }
    s.lens = s.order === 'pair' ? 'aspects' : (['development','resource','obstacle'].includes(s.lens) ? s.lens : 'development');
    return s;
  }
  function pairAt(index, input, cards) {
    const n = cards.length, s = normalize(input, cards), total = count(s.order, s.reversals, n);
    let k = ((Math.trunc(index) % total) + total) % total;
    if (!Number.isFinite(k)) k = 0;
    const bits = s.reversals ? k % 4 : 0;
    if (s.reversals) k = Math.floor(k / 4);
    let i, j;
    if (s.order === 'sequence') { i = Math.floor(k / (n-1)); j = k % (n-1); if (j >= i) j++; }
    else { i = 0; while (k >= n-i-1) { k -= n-i-1; i++; } j = i+1+k; }
    return {...s,a:cards[i].id,b:cards[j].id,ra:!!(bits & 2),rb:!!(bits & 1)};
  }
  function indexOf(input, cards) {
    const s = normalize(input,cards), n = cards.length, i = cards.findIndex(c=>c.id===s.a), j = cards.findIndex(c=>c.id===s.b);
    const k = s.order === 'sequence' ? i*(n-1) + j-(j>i?1:0) : i*(2*n-i-1)/2+j-i-1;
    return s.reversals ? k*4+2*Number(s.ra)+Number(s.rb) : k;
  }
  function reverse(input, cards) { return normalize({...input,a:input.b,b:input.a,ra:input.rb,rb:input.ra},cards); }
  function key(input, cards) { const s=normalize(input,cards); return [s.order,s.a,s.b,s.reversals?1:0,s.ra?1:0,s.rb?1:0,s.lens].join('|'); }
  function cardMeta(card, data) {
    const profile = Object.fromEntries(data.profileFields.map((field,i)=>[field,data.profiles[card.id][i]]));
    if (card.group === 'major') {
      const m=data.majors.find(x=>x.id===card.id);
      return {card,profile,kind:'major',title:'Старший аркан',rows:[['Буква пути',m.name+' · '+m.letter],['Соответствие',m.attribution]],major:m,question:'Как тема «'+profile.principle+'» раскрывается в конкретном вопросе?'};
    }
    const suit=data.suits[card.group];
    if (card.rank<=10) {
      const sefira=data.sefirot[card.rank-1];
      return {card,profile,kind:'number',title:card.rank===1?'Туз':'Числовая карта',suit,sefira,rows:[['Сефира',sefira.name+' · '+sefira.meaning],['Мир',suit.world],['Масть / стихия',suit.name+' / '+suit.element]],question:sefira.question};
    }
    const court=data.courts[card.rank];
    return {card,profile,kind:'court',title:'Придворная карта',suit,court,rows:[['Способ фигуры',court.element+' · '+court.letter],['Масть / стихия',suit.name+' / '+suit.element],['Мир масти',suit.world]],question:'Как роль «'+court.role+'» проявляется в области «'+suit.field+'»?'};
  }
  function suitRelation(a,b) {
    if (!a.suit || !b.suit) return {title:'Стихийное правило здесь не вычисляем',text:'Короткий перечень Book T описывает соседство мастей. Для этой пары сначала используйте образы и соответствия Старших арканов; планету автоматически не заменяем одной стихией.'};
    const aa=a.card.group,bb=b.card.group,comb=[aa,bb].sort().join('');
    if (aa===bb) return {title:'Одна масть: усиление темы',text:'В Book T соседство одной масти усиливает её проявление. Здесь общее поле — '+a.suit.field+'. Что усиливается: полезная сторона или избыток?'};
    if (['cw','ps'].includes(comb)) return {title:'Противоположные масти в Book T',text:a.suit.name+' и '+b.suit.name+' ослабляют друг друга в выбранном перечне. Для упражнения ищите, где «'+a.suit.field+'» и «'+b.suit.field+'» расходятся и как их можно согласовать. Это не оценка пары как плохой.'};
    if (['cs','sw','pw'].includes(comb)) return {title:'Дружественные масти в Book T',text:'В выбранном перечне эти масти дружественны. Через что «'+a.suit.field+'» может поддержать область «'+b.suit.field+'»? Поддержка способна закрепить и нежелательную привычку.'};
    return {title:'Для этой пары перечень Book T не задаёт правила',text:'Соседство Кубков и Пентаклей отдельно не оговорено в коротком разделе о достоинствах. Здесь опирайтесь на наблюдаемую связь чувств и практических условий, не приписывая источнику готовой оценки.'};
  }
  function structural(a,b,s) {
    if (a.kind==='number' && b.kind==='number') {
      if (a.card.rank===b.card.rank) return {title:'Одна сефира в разных мирах',text:a.sefira.name+': '+a.sefira.focus+'. Сопоставьте её проявление в мирах '+a.suit.world+' и '+b.suit.world+'. Одинаковый ранг не отменяет различий сцен.',question:'Что общее в принципе этих карт и что меняется при переходе от области «'+a.suit.field+'» к области «'+b.suit.field+'»?'};
      return {title:'Две сефирот: '+a.sefira.name+' и '+b.sefira.name,text:'Учебные опоры: «'+a.sefira.focus+'» и «'+b.sefira.focus+'». '+(a.card.group===b.card.group?'Обе карты принадлежат одному миру — '+a.suit.world+'.':'Здесь меняются и ранг, и мир: '+a.suit.world+' / '+b.suit.world+'.')+' Порядок номеров не устанавливает духовный рост или ухудшение.',question:s.order==='pair'?'Как эти два принципа участвуют в одной ситуации?':'Что должно измениться, чтобы от темы «'+a.profile.principle+'» перейти к теме «'+b.profile.principle+'»?'};
    }
    if (a.kind==='major' && b.kind==='major') return {title:'Два пути Старших арканов',text:a.major.name+' — '+a.major.attribution+'; '+b.major.name+' — '+b.major.attribution+'. Это два соответствия выбранной школы. Соседство в раскладе само по себе не означает соседства путей на Древе.',question:'Какие отношения между темами «'+a.profile.principle+'» и «'+b.profile.principle+'» можно увидеть в изображениях?'};
    if (a.kind==='court' && b.kind==='court') return {title:a.card.rank===b.card.rank?'Один способ участия в разных мастях':'Два способа участия',text:'Фигура А: '+a.court.role+'. Фигура Б: '+b.court.role+'. Рассмотрите роли, которые может выполнять один человек или разные участники; пол и возраст из них не выводятся.',question:'Как способы участия помогают или мешают друг другу? Что меняется, когда их меняют местами?'};
    if (a.kind==='major' || b.kind==='major') {
      const m=a.kind==='major'?a:b, other=a.kind==='major'?b:a;
      return {title:'Общий принцип и его конкретное проявление',text:'«'+m.card.name+'» задаёт тему «'+m.profile.principle+'». «'+other.card.name+'» позволяет проверить её в области «'+other.suit.field+'». Это выбранный способ связать уровни; позиции могут предложить другую связь.',question:'Какая деталь второй карты показывает, как общий принцип проявляется в жизни?'};
    }
    const court=a.kind==='court'?a:b,number=a.kind==='number'?a:b;
    return {title:'Способ участия и ситуация',text:'Роль «'+court.court.role+'» встречается с темой «'+number.profile.principle+'». '+number.sefira.name+' в мире '+number.suit.world+' даёт дополнительный вопрос к этой ситуации.',question:'Как этот способ участия изменяет ситуацию: помогает, ограничивает или поддерживает её избыток?'};
  }
  function frame(a,b,lens) {
    const x=a.profile.action,y=b.profile.action;
    if(lens==='aspects')return 'В этой ситуации важно и «'+x+'», и «'+y+'». Их связь состоит в том, что…';
    if(lens==='resource')return 'Возможность «'+x+'» может стать опорой для действия «'+y+'», если…';
    if(lens==='obstacle')return 'Когда тема «'+a.profile.principle+'» становится препятствием, действие «'+y+'» может помочь, если…';
    return 'От задачи «'+x+'» можно перейти к задаче «'+y+'», если…';
  }
  function analyze(input,cards,data) {
    const s=normalize(input,cards),a=cardMeta(cards.find(c=>c.id===s.a),data),b=cardMeta(cards.find(c=>c.id===s.b),data);
    return {state:s,a,b,structure:structural(a,b,s),suits:suitRelation(a,b),frame:frame(a,b,s.lens),reverseFrame:frame(b,a,s.lens),roles:LENSES[s.lens].roles};
  }
  function emptyNote(s) { return {state:s,...Object.fromEntries(TEXT_FIELDS.map(k=>[k,''])),conditionA:'open',conditionB:'open',checks:[],updated:''}; }
  function cleanNote(value,cards) {
    if (!value || typeof value!=='object' || !value.state || typeof value.state!=='object') return null;
    const v=value.state,ids=cards.map(c=>c.id);
    if(!ids.includes(v.a)||!ids.includes(v.b)||v.a===v.b||!['pair','sequence'].includes(v.order))return null;
    const note=emptyNote(normalize(v,cards));
    for(const k of TEXT_FIELDS) { if(value[k]!==undefined && typeof value[k]!=='string')return null; note[k]=(value[k]||'').slice(0,6000); }
    for(const k of ['conditionA','conditionB'])note[k]=CONDITIONS.includes(value[k])?value[k]:'open';
    note.checks=Array.isArray(value.checks)?CHECKS.filter(k=>value.checks.includes(k)):[];
    note.updated=typeof value.updated==='string'&&Number.isFinite(Date.parse(value.updated))?value.updated:'';
    if(v.order==='pair' && v.a!==note.state.a) {
      [note.observationA,note.observationB]=[note.observationB,note.observationA];
      [note.conditionA,note.conditionB]=[note.conditionB,note.conditionA];
    }
    return note;
  }
  function hasWork(n) { return TEXT_FIELDS.some(k=>n[k]?.trim())||n.conditionA!=='open'||n.conditionB!=='open'||n.checks.length>0; }
  function readNotebook(input,cards) {
    if(!input || input.app!=='eliora-tarot-pairs' || input.version!==1 || !Array.isArray(input.notes) || input.notes.length>120000)throw Error('Это не тетрадь конструктора пар версии 1.');
    const notes=Object.create(null);
    for(const value of input.notes) { const n=cleanNote(value,cards); if(!n)throw Error('В файле есть некорректная запись. Импорт отменён; текущая тетрадь сохранена.'); if(hasWork(n)){const k=key(n.state,cards);notes[k]=notes[k]?mergeNotes({[k]:notes[k]},{[k]:n})[k]:n;} }
    return notes;
  }
  function mergeNotes(existing,incoming) {
    const result=Object.assign(Object.create(null),existing);
    for(const [k,n] of Object.entries(incoming)) {
      if(!result[k]) { result[k]=n;continue; }
      const prev=result[k], merged={...prev};
      for(const field of TEXT_FIELDS) {
        if(!n[field]||n[field]===prev[field]||prev[field].includes(n[field]))continue;
        const joined=prev[field]?prev[field]+'\n\n— Из импортированной тетради —\n'+n[field]:n[field];
        if(joined.length>6000)throw Error('Объединённая запись слишком длинная. Импорт отменён; обе исходные тетради остаются у Вас.');
        merged[field]=joined;
      }
      for(const field of ['conditionA','conditionB']) {
        if(merged[field]==='open') merged[field]=n[field];
        else if(n[field]!=='open'&&n[field]!==merged[field]) {
          const text='В импортированной записи '+(field==='conditionA'?'карта А':'карта Б')+': '+CONDITION_LABELS[n[field]]+'.';
          if(!merged.alternative.includes(text))merged.alternative+=(merged.alternative?'\n':'')+text;
          if(merged.alternative.length>6000)throw Error('Нет места для объединения альтернатив. Импорт отменён.');
        }
      }
      merged.checks=[...new Set([...prev.checks,...n.checks])];merged.updated=new Date().toISOString();result[k]=merged;
    }
    return result;
  }
  return {LENSES,TEXT_FIELDS,CHECKS,CONDITIONS,CONDITION_LABELS,count,normalize,pairAt,indexOf,reverse,key,cardMeta,analyze,emptyNote,cleanNote,hasWork,readNotebook,mergeNotes};
});
