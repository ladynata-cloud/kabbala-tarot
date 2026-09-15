'use strict';
const assert=require('node:assert/strict');
const {test}=require('node:test');
const T=require('../assets/course/tarot-triples-core.js');
const cards=require('../content/tarot.json').cards,method=require('../content/tarot-pairs.json'),content=require('../content/tarot-triples.json');
const E=T.create(cards,method,content),ids=cards.map(c=>c.id),idx=new Map(ids.map((id,i)=>[id,i]));
const state=(ids=['p4','p5','p6'],extra={})=>E.normalize({ids,lens:'mediation',...extra});

test('All unordered and ordered triples have unique indices, with every orientation attached to its card',()=>{
  assert.equal(E.count('group'),76076);assert.equal(E.count('sequence'),456456);
  assert.equal(E.count('group',true),608608);assert.equal(E.count('sequence',true),3651648);
  for(const order of ['group','sequence']){
    const seen=new Uint8Array(78**3);
    for(let i=0;i<E.count(order);i++){
      const s=E.at(i,{order});
      assert.equal(new Set(s.ids).size,3);assert.equal(E.indexOf(s),i);
      const [a,b,c]=s.ids.map(id=>idx.get(id)),key=(a*78+b)*78+c;
      assert.equal(seen[key],0);seen[key]=1;
      if(order==='group')assert.ok(a<b&&b<c);
      for(let bit=0;bit<8;bit++){
        const oriented={...s,reversals:true,reversed:[!!(bit&4),!!(bit&2),!!(bit&1)]};
        assert.equal(E.indexOf(oriented),i*8+bit);
      }
    }
    assert.deepEqual(E.at(-1,{order}),E.at(E.count(order)-1,{order}));
    assert.deepEqual(E.at(E.count(order),{order}),E.at(0,{order}));
    for(const i of [0,1,7,8,103,Math.floor(E.count(order,true)/2),E.count(order,true)-1])assert.equal(E.indexOf(E.at(i,{order,reversals:true})),i);
  }
});

test('Every unordered triple has a complete analysis with all pair and central relations',()=>{
  const structures=new Set();
  for(let i=0;i<76076;i++){
    const a=E.analyze(E.at(i,{order:'group'}));
    assert.equal(a.metas.length,3);assert.equal(a.pairs.length,3);assert.equal(a.centers.length,3);
    assert.ok(a.reading.length>80&&a.structure.text.length>80&&a.effect.after.length>80);
    assert.ok(!JSON.stringify(a).includes('undefined'));
    for(const c of a.centers)assert.ok(c.title&&c.text&&c.center);
    for(const p of a.pairs)assert.ok(p.analysis.structure.text&&p.code);
    structures.add(a.structure.code);
  }
  for(const code of ['triad-1,2,3','triad-4,5,6','triad-7,8,9','one-sefira','repeated-sefira','three-sefirot','three-paths','three-courts','mixed-levels'])assert.ok(structures.has(code),code);
});

test('Six positions, shared group identity, and orientation follow card identity',()=>{
  const s=state(undefined,{reversals:true,reversed:[true,false,true]}),perms=E.permutations(s);
  assert.equal(new Set(perms.map(E.key)).size,6);
  const byId=Object.fromEntries(s.ids.map((id,i)=>[id,s.reversed[i]]));
  for(const p of perms){p.ids.forEach((id,i)=>assert.equal(p.reversed[i],byId[id]));assert.equal(E.key({...p,order:'group'}),E.key({...s,order:'group'}));}
  assert.notEqual(E.key(s),E.key({...s,lens:'center'}));
  assert.notEqual(E.key(s),E.key({...s,reversals:false}));
  assert.equal(new Set(E.normalize({ids:['no','p4','p4']}).ids).size,3);
});

test('Book T outer opposition changes the whole; missing and major rules are not invented',()=>{
  const center=ids=>E.analyze(state(ids)).central;
  assert.equal(center(['w1','s6','c2']).code,'outer-opposition');
  assert.deepEqual(center(['w1','s6','c2']).edges,['friendly','friendly','opposed']);
  assert.equal(center(['w1','c2','w3']).code,'both-opposed');
  assert.equal(center(['w1','w2','w3']).code,'same-suit');
  assert.equal(center(['s1','w2','p3']).code,'outer-opposition');
  assert.equal(center(['c1','p2','p3']).code,'partial');
  assert.equal(center(['w1','w2','s3']).code,'supported');
  assert.equal(center(['1','w2','s3']).code,'unassigned');
  assert.equal(T.relation(E.metas.get('p2'),E.metas.get('c3')),'unspecified');
});

test('Numbered cards, paths and courts retain distinct correspondences',()=>{
  const code=ids=>E.analyze(state(ids)).structure.code;
  assert.equal(code(['p6','p4','p5']),'triad-4,5,6');
  assert.equal(code(['w1','c2','s3']),'triad-1,2,3');
  assert.equal(code(['p7','p8','p9']),'triad-7,8,9');
  assert.equal(code(['w2','c2','p2']),'one-sefira');
  assert.equal(code(['1','2','3']),'three-paths');
  assert.equal(code(['c13','s13','p13']),'three-courts');
  assert.equal(code(['1','p8','w10']),'mixed-levels');
  assert.equal(E.metas.get('1').sefira,undefined);assert.equal(E.metas.get('8').sefira,undefined);
  assert.equal(E.metas.get('p11').sefira,undefined);
  for(const ex of content.examples){const a=E.analyze(state(ex.cards,{lens:ex.lens,order:ex.lens==='system'?'group':'sequence'}));assert.equal(a.example.title,ex.title);}
  const ms=E.analyze(state()).metas;
  for(let i=0;i<3;i++){const effect=E.thirdEffect(ms,i);assert.equal(effect.card,ms[i].card.id);assert.ok(effect.after.includes(ms[i].card.name));}
});

test('Notebook records preserve separate omissions, interpretations, observations and conditions',()=>{
  const n=E.emptyNote(state());n.reading='Гипотеза';n.question='Мой вопрос';
  n.observations.p4='Граница';n.conditions.p4='excess';
  n.experiments.p4={before:'Без четвёрки',after:'Вернули четвёрку'};
  n.experiments.p6={before:'Без шестёрки',after:'Вернули шестёрку'};
  n.checks=['images','third'];
  const pack={app:'eliora-tarot-triples',version:1,notes:[n]},parsed=E.readNotebook(JSON.parse(JSON.stringify(pack))),k=E.key(n.state);
  assert.equal(parsed[k].experiments.p4.before,'Без четвёрки');assert.equal(parsed[k].experiments.p6.before,'Без шестёрки');
  assert.equal(parsed[k].conditions.p4,'excess');assert.equal(parsed[k].observations.p4,'Граница');
  const incoming=structuredClone(n);incoming.reading='Другой взгляд';incoming.conditions.p4='lack';incoming.experiments.p6.after='Новая деталь';
  const merged=E.merge(parsed,E.readNotebook({...pack,notes:[incoming]}));
  assert.ok(merged[k].reading.includes('Гипотеза')&&merged[k].reading.includes('Другой взгляд'));
  assert.ok(merged[k].experiments.p6.after.includes('Вернули шестёрку')&&merged[k].experiments.p6.after.includes('Новая деталь'));
  assert.ok(merged[k].alternative.length>0);assert.equal(parsed[k].reading,'Гипотеза');
  const duplicate=E.readNotebook({...pack,notes:[n,n]})[k];
  assert.deepEqual({...duplicate,updated:''},{...parsed[k],updated:''});
  const large=structuredClone(incoming);large.reading='x'.repeat(7999);
  assert.throws(()=>E.merge(parsed,E.readNotebook({...pack,notes:[large]})),/8 000/);
  assert.equal(parsed[k].reading,'Гипотеза');assert.equal(parsed[k].experiments.p6.after,'Вернули шестёрку');
  assert.throws(()=>E.readNotebook({...pack,notes:[{...n,state:{...n.state,ids:['p4','p4','p6']}}]}),/Импорт отменён/);
  assert.throws(()=>E.readNotebook({app:'eliora-tarot-pairs',version:1,notes:[n]}),/троек/);
});
