'use strict';
// 표식 사전: one place that explains the six marks, the reactions between them, and which units put on or use each mark.
// The combat rules live in reactions.js / skills.js / basic data; this file only describes them for the UI
// (codex filter and unit detail, enemy card chips, the 표식·반응 guide). Colours match the enemy debuff icons.
(function(root){
 const marks=[
  {id:'젖음',key:'wet',color:'#368ebc',short:'습',desc:'물에 젖은 상태. 번개·열기·냉기와 만나면 반응합니다.'},
  {id:'열기',key:'heat',color:'#d96532',short:'열',desc:'달아오른 상태. 젖음·포자와 만나면 반응합니다.'},
  {id:'냉기',key:'cold',color:'#6fb9e5',short:'냉',desc:'얼어붙기 시작한 상태. 젖음과 만나면 급랭합니다.'},
  {id:'균열',key:'crack',color:'#9b7765',short:'균',desc:'금이 간 상태. 충격 공격을 받으면 파쇄됩니다.'},
  {id:'포자',key:'spore',color:'#669e53',short:'포',desc:'포자가 붙은 상태. 젖음이면 개화, 열기면 연소합니다.'},
  {id:'표적',key:'target',color:'#c5a73d',short:'표',desc:'조준당한 상태. 광선·정밀 공격이 더 아프게 들어갑니다.'}
 ];
 // Reaction recipes in player words: which marks must be on the enemy and what kind of hit sets it off.
 const reactions=[
  {name:'감전',need:['젖음'],hit:'번개 공격',effect:'대상과 주변 2명에게 마법 피해, 젖음 소모'},
  {name:'증기폭발',need:['젖음','열기'],hit:'',effect:'대상과 주변 3명에게 마법 피해, 두 표식 소모'},
  {name:'급랭',need:['젖음','냉기'],hit:'',effect:'큰 마법 피해와 잠깐 묶기, 냉기 유지'},
  {name:'파쇄',need:['균열'],hit:'충격 공격',effect:'큰 물리 피해와 주변 2명 피해, 균열 소모'},
  {name:'개화',need:['포자','젖음'],hit:'',effect:'주변 4명에게 마법 피해, 두 표식 소모'},
  {name:'포자연소',need:['포자','열기'],hit:'',effect:'대상과 주변 3명에게 마법 피해, 포자 소모'},
  {name:'집광',need:['표적'],hit:'광선 공격',effect:'광선 피해 +25%, 다른 표적에게도 피해'},
  {name:'정밀타격',need:['표적'],hit:'정밀 공격',effect:'추가 피해 (체력 25% 이하면 1.5배)'},
  {name:'일식공명',need:['열기','냉기'],hit:'일식 공격',effect:'큰 마법 피해'},
  {name:'극광',need:['젖음','냉기'],hit:'오로라 공격',effect:'큰 마법 피해와 냉기'},
  {name:'중력렌즈',need:['표적'],hit:'천체 공격',effect:'3초 동안 받는 피해 +8%'},
  {name:'반사',need:['표적'],hit:'거울 공격',effect:'직전 기본 공격 피해의 45%를 한 번 더'},
  {name:'다중반응',need:['아무 표식 2개'],hit:'연구소 공격',effect:'마법 피해'}
 ];
 const byId=Object.fromEntries(marks.map(m=>[m.id,m]));
 // Per unit: marks it puts on enemies (basic attack, skill, random marks), marks its skill or attack needs or
 // exploits, and the reaction named in the roster's mark text ("표식 균열연계 파쇄").
 let cache=null;
 function profiles(){if(cache)return cache;cache={};
  const basic=root.ManmulBasicData||{},upper=root.ManmulUpperBasicData||{},skills=root.ManmulSkillData||{},units=root.ManmulRosterData?.units||root.rosterData?.units||[];
  const p=id=>cache[id]||(cache[id]={applies:new Set(),uses:new Set(),reaction:null});
  const addMarks=(set,v)=>{for(const m of [].concat(v||[]))if(byId[m])set.add(m)};
  for(const [id,d] of Object.entries(basic))addMarks(p(id).applies,d?.mark);
  for(const [id,d] of Object.entries(upper)){addMarks(p(id).applies,d?.mark);addMarks(p(id).uses,d?.bonusMark)}
  for(const [id,d] of Object.entries(skills)){if(!d)continue;addMarks(p(id).applies,d.mark);addMarks(p(id).applies,d.marks);if(d.kind==='experimentalMarks')marks.forEach(m=>p(id).applies.add(m.id));addMarks(p(id).uses,d.requiresMark);addMarks(p(id).uses,d.bonusMark)}
  for(const u of units){let m=/연계\s+(\S+)/.exec(u.mark_text||'');if(m&&m[1]!=='—'){p(u.id).reaction=m[1];let r=reactions.find(x=>x.name===m[1]);if(r)for(const need of r.need)if(byId[need]&&!p(u.id).applies.has(need))p(u.id).uses.add(need)}}
  for(const v of Object.values(cache)){v.applies=[...v.applies];v.uses=[...v.uses].filter(m=>!v.applies.includes(m))}
  return cache}
 function profile(id){return profiles()[id]||{applies:[],uses:[],reaction:null}}
 function chip(id,extra=''){let m=byId[id];if(!m)return '';return `<span class="mark-chip" style="--mark:${m.color}" title="${m.desc}"><i>${m.short}</i>${m.id}${extra}</span>`}
 root.ManmulMarks={marks,reactions,byId,profile,profiles,chip};
})(globalThis);
