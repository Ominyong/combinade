'use strict';
// Boss reward cards. Each boss kill offers cards drawn from the card pool; picking one applies its effect for this run.
// Cards belong to a family (전술·유물·경제·소환); collecting 3 cards of one family turns on that family's set bonus.
// Rarity sets how often a card is drawn. `locked` cards join the pool only once unlocked (계승의 나무 will unlock them).
// Card ids for the old stat upgrades and relics are kept, so saved runs and pending rewards still work.
(function(root){
 const families={
  tactic:{name:'전술',color:'#f0a46c',set:'모든 유닛 공격력 +5%'},
  relic:{name:'유물',color:'#c79bff',set:'보스 보상 카드를 4장 중에서 고릅니다'},
  economy:{name:'경제',color:'#f4d06f',set:'라운드 시작 골드 +5'},
  summon:{name:'소환',color:'#8bd4c6',set:'보스를 잡을 때마다 노말 선택권 1장'}
 };
 const rarities={common:{name:'일반',weight:60},rare:{name:'희귀',weight:28},legend:{name:'전설',weight:9}};
 const setSize=3;
 // effect: how game.js applies the card. stat → runLevels[id] (stacks to max), relic → runRelics[id] (once),
 // gold/tickets/summon/power → one-off or stacking card effects handled in game.js.
 const cards={
  physical:{name:'물리 전술',family:'tactic',rarity:'common',icon:'물',effect:'stat',max:3,description:'물리 유닛 공격력 +8%'},
  magic:{name:'마법 전술',family:'tactic',rarity:'common',icon:'마',effect:'stat',max:3,description:'마법 유닛 마력 +8%'},
  speed:{name:'신속 공격',family:'tactic',rarity:'common',icon:'속',effect:'stat',max:3,description:'공격속도 +5%'},
  burn:{name:'화상 증폭',family:'tactic',rarity:'common',icon:'화',effect:'stat',max:3,description:'화상 피해 +12%'},
  slow:{name:'감속 전술',family:'tactic',rarity:'common',icon:'감',effect:'stat',max:3,description:'감속 효과 +8%'},
  armor:{name:'방어 파괴',family:'tactic',rarity:'common',icon:'방',effect:'stat',max:3,description:'방어력 감소 효과 +10%'},
  resist:{name:'마력 파괴',family:'tactic',rarity:'common',icon:'저',effect:'stat',max:3,description:'마법 저항력 감소 효과 +10%'},
  boss:{name:'보스 사냥',family:'tactic',rarity:'common',icon:'보',effect:'stat',max:3,description:'보스 대상 피해 +8%'},
  onslaught:{name:'총공세',family:'tactic',rarity:'legend',icon:'총',effect:'power',amount:.12,max:1,description:'모든 유닛 공격력 +12%'},
  seal:{name:'순환 봉인',family:'relic',rarity:'rare',icon:'봉',effect:'relic',max:1,description:'감속·묶기 상태로 한 바퀴를 마친 적은 순환 강화를 받지 않습니다'},
  ember:{name:'잔불 전이',family:'relic',rarity:'rare',icon:'불',effect:'relic',max:1,description:'화상 상태로 쓰러진 적의 화상이 가까운 적 2기에게 4초간 옮겨붙습니다'},
  execute:{name:'균열 처형',family:'relic',rarity:'rare',icon:'처',effect:'relic',max:1,description:'일반 몬스터의 체력이 최대 체력의 8% 이하가 되면 즉시 처치합니다'},
  adapt:{name:'균열 적응',family:'relic',rarity:'rare',icon:'적',effect:'relic',max:1,description:'이후 등장하는 적이 받는 전장 테마 압박 35% 감소'},
  gold:{name:'전술 보급',family:'economy',rarity:'common',icon:'금',effect:'gold',factor:1,max:Infinity,description:'즉시 골드 (라운드가 높을수록 많음)'},
  warchest:{name:'군자금',family:'economy',rarity:'rare',icon:'자',effect:'gold',factor:2.2,max:Infinity,description:'즉시 골드 (전술 보급의 2배 이상)'},
  bounty:{name:'약탈',family:'economy',rarity:'common',icon:'약',effect:'relic',max:1,description:'일반 몬스터를 처치할 때 25% 확률로 골드 +1'},
  interest:{name:'균열 이자',family:'economy',rarity:'rare',icon:'이',effect:'relic',max:1,description:'라운드 시작마다 보유 골드의 10%를 추가로 받습니다(최대 15)'},
  convert:{name:'변환 숙련',family:'economy',rarity:'common',icon:'변',effect:'relic',max:1,description:'같은 등급 변환 비용 50% 감소'},
  elite:{name:'정예 소환',family:'summon',rarity:'rare',icon:'정',effect:'relic',max:1,description:'소환할 때 10% 확률로 매직 유닛이 나옵니다'},
  recruit:{name:'긴급 징집',family:'summon',rarity:'common',icon:'징',effect:'ticket',ticket:'normal',count:2,max:Infinity,description:'노말 선택권 2장'},
  arcane:{name:'마력 소집',family:'summon',rarity:'rare',icon:'소',effect:'ticket',ticket:'magic',count:1,max:Infinity,description:'매직 선택권 1장'},
  reinforce:{name:'증원',family:'summon',rarity:'common',icon:'증',effect:'summon',grade:'노말',count:4,max:Infinity,description:'무작위 노말 유닛 4기를 바로 소환'},
  // Unlocked from 계승의 나무
  warcry:{name:'함성',family:'tactic',rarity:'rare',icon:'함',effect:'power',amount:.06,max:2,locked:true,description:'모든 유닛 공격력 +6%'},
  treasury:{name:'대군자금',family:'economy',rarity:'legend',icon:'고',effect:'gold',factor:4,max:Infinity,locked:true,description:'즉시 골드 (전술 보급의 4배)'},
  archmage:{name:'대마력 소집',family:'summon',rarity:'rare',icon:'대',effect:'ticket',ticket:'magic',count:2,max:Infinity,locked:true,description:'매직 선택권 2장'},
  herocall:{name:'영웅 소집',family:'summon',rarity:'legend',icon:'영',effect:'summon',grade:'에픽',count:1,max:Infinity,locked:true,description:'무작위 에픽 유닛 1기를 바로 소환'},
  rarecall:{name:'희귀 소집',family:'summon',rarity:'legend',icon:'희',effect:'summon',grade:'레어',count:1,max:Infinity,description:'무작위 레어 유닛 1기를 바로 소환'}
 };
 function unlocked(id,unlocks=[]){let c=cards[id];return !!c&&(!c.locked||unlocks.includes(id))}
 // Draw `count` distinct cards, weighted by rarity (luck raises rare/legend weights), skipping maxed or locked ones. owned(id) = times taken this run.
 function draw(count,owned,unlocks=[],random=Math.random,luck=0){const weight=id=>rarities[cards[id].rarity].weight*(cards[id].rarity==='common'?1:1+luck);
  let pool=Object.keys(cards).filter(id=>unlocked(id,unlocks)&&owned(id)<cards[id].max),out=[];
  while(out.length<count&&pool.length){let total=pool.reduce((s,id)=>s+weight(id),0),r=random()*total,i=0;
   for(;i<pool.length-1;i++){r-=weight(pool[i]);if(r<0)break}
   out.push(pool.splice(i,1)[0])}
  return out}
 // Cards taken per family and which set bonuses are on.
 function familyCounts(taken){let n={};for(const f of Object.keys(families))n[f]=0;for(const id of taken)if(cards[id])n[cards[id].family]++;return n}
 function setActive(taken,family){return familyCounts(taken)[family]>=setSize}
 root.ManmulCards={families,rarities,cards,setSize,unlocked,draw,familyCounts,setActive};
})(globalThis);
