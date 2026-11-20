'use strict';
// 판 중간 이벤트: at a few random rounds a small event appears and every player picks one of its option cards
// (a trade-off, never a pure loss). In a multiplayer room the rounds and the event come from the shared room seed, so
// everyone meets the same event at the same round; each player still chooses for themselves.
// Loaded before game.js; game globals are read only when the functions run. Saved with the run (eventState).
const runEvents={
 merchant:{name:'떠돌이 상인',icon:'상',color:'#f4d06f',flavor:'짐을 잔뜩 진 상인이 균열 앞에 좌판을 폈습니다.',options:[
  {id:'rare',name:'레어 유닛 구입',desc:'무작위 레어 유닛 1기를 데려옵니다',cost:60,apply:()=>summonCardUnits('레어',1)},
  {id:'tickets',name:'선택권 묶음',desc:'노말 선택권 2장',cost:30,apply:()=>{selectionTickets.normal+=2}},
  {id:'pass',name:'그냥 보낸다',desc:'아무 일도 일어나지 않습니다'}]},
 altar:{name:'수상한 제단',icon:'제',color:'#c79bff',flavor:'오래된 제단이 무언가를 바치라고 속삭입니다.',options:[
  {id:'normals',name:'노말 2기를 바친다',desc:'무작위 노말 유닛 2기를 잃고 매직 선택권 1장을 얻습니다',need:()=>units.filter(u=>types[u.type].grade==='노말').length>=2,needText:'노말 유닛 2기 필요',apply:()=>{for(let i=0;i<2;i++){let list=units.filter(u=>types[u.type].grade==='노말'),u=list[Math.floor(Math.random()*list.length)];if(u)units=units.filter(x=>x!==u)}selectionTickets.magic++}},
  {id:'gold',name:'골드 절반을 바친다',desc:'가진 골드의 절반을 잃고 보상 카드 1장을 고릅니다',need:()=>gold>=20,needText:'골드 20 필요',apply:()=>{gold-=Math.floor(gold/2);let c=rewardChoiceSet();if(c.length)pendingRewards.push(c)}},
  {id:'pass',name:'지나친다',desc:'아무 일도 일어나지 않습니다'}]},
 rift:{name:'균열 틈새',icon:'틈',color:'#e78fc8',flavor:'바닥에 새 틈이 벌어졌습니다. 안쪽에서 금빛이 새어 나옵니다.',options:[
  {id:'open',name:'틈새를 연다',desc:()=>`즉시 ${60+wave*2}골드, 대신 다음 라운드 적 체력 +25%`,apply:()=>{gold+=60+wave*2;eventState.waveHp={wave:wave+1,mult:1.25}}},
  {id:'seal',name:'틈새를 막는다',desc:'안전하게 15골드',apply:()=>{gold+=15}}]},
 survivor:{name:'부상당한 수호자',icon:'수',color:'#8bd4c6',flavor:'다른 균열에서 밀려난 수호자가 쓰러져 있습니다.',options:[
  {id:'heal',name:'치료한다',desc:'무작위 매직 유닛 1기가 합류합니다',cost:40,apply:()=>summonCardUnits('매직',1)},
  {id:'map',name:'길을 물어본다',desc:'20골드',apply:()=>{gold+=20}}]},
 supply:{name:'보급 상자',icon:'보',color:'#9fd8a0',flavor:'아군이 떨어뜨리고 간 보급 상자가 두 개 있습니다. 하나만 가져갈 수 있습니다.',options:[
  {id:'gold',name:'골드 상자',desc:()=>`${30+wave}골드`,apply:()=>{gold+=30+wave}},
  {id:'ticket',name:'선택권 상자',desc:()=>wave>=30?'매직 선택권 1장':'노말 선택권 1장',apply:()=>{selectionTickets[wave>=30?'magic':'normal']++}}]},
 drill:{name:'훈련 교관',icon:'훈',color:'#ef8f6a',flavor:'노련한 교관이 이번 전투 동안 한 가지만 가르쳐 주겠다고 합니다.',options:[
  {id:'physical',name:'검술 훈련',desc:'이번 판 동안 물리 유닛 공격력 +6%',apply:()=>{eventState.bonus.physical+=.06}},
  {id:'magic',name:'마력 훈련',desc:'이번 판 동안 마법 유닛 공격력 +6%',apply:()=>{eventState.bonus.magic+=.06}}]},
 smith:{name:'떠돌이 대장장이',icon:'대',color:'#b8c4cc',flavor:'모루를 짊어진 대장장이가 일거리를 찾고 있습니다.',options:[
  {id:'free',name:'무료 강화',desc:'유닛이 가장 많은 등급을 1단계 강화합니다',need:()=>!!eventMainGrade(),needText:'강화할 수 있는 등급 없음',apply:()=>{let g=eventMainGrade();if(g)gradeLevels[g]++}},
  {id:'deal',name:'단골 계약',desc:'이번 판 동안 등급 강화 비용 -15%',apply:()=>{eventState.bonus.upgrade+=.15}}]},
 frenzy:{name:'균열 폭주',icon:'폭',color:'#d6453a',flavor:'균열이 요동치며 몬스터들이 비틀거립니다. 기회일까요?',options:[
  {id:'calm',name:'폭주를 잠재운다',desc:'지금 있는 일반 몬스터 체력 -30%, 대신 다음 보스 체력 +15%',apply:()=>{for(const e of enemies)if(e.kind!=='boss'&&e.kind!=='miniboss'&&e.hp>0)e.hp*=.7;eventState.bossHp=1.15}},
  {id:'ride',name:'흐름에 맡긴다',desc:'25골드',apply:()=>{gold+=25}}]},
 gambler:{name:'도박사',icon:'도',color:'#c9a75c',flavor:'"반반이오. 걸겠소?" 낡은 동전을 튕기며 웃습니다.',options:[
  {id:'bet',name:'50골드를 건다',desc:'절반 확률로 150골드, 아니면 잃습니다',cost:50,apply:()=>{let win=Math.random()<.5;if(win)gold+=150;notice(win?'도박 성공! +150골드':'도박 실패… 50골드를 잃었습니다');return win?'성공':'실패'}},
  {id:'pass',name:'사양한다',desc:'아무 일도 일어나지 않습니다'}]},
 board:{name:'현상금 게시판',icon:'게',color:'#c4553f',flavor:'새로 붙은 수배서와 함께 정보상이 서 있습니다.',options:[
  {id:'reset',name:'수배 갱신',desc:'모든 현상금 보스의 재소환 대기를 없앱니다',need:()=>typeof huntBosses==='object'&&huntBosses.some(b=>huntCooldownLeft(b.id)>0),needText:'대기 중인 현상금 보스 없음',apply:()=>{hunt.ready={}}},
  {id:'info',name:'정보를 판다',desc:()=>`${20+wave}골드`,apply:()=>{gold+=20+wave}}]}
};
// In a multiplayer room (even while reconnecting) events never pause: the shared clock must keep advancing rounds.
function eventInRoom(){return typeof Multiplayer==='object'&&!!(Multiplayer.started||Multiplayer.inRoom)}
function eventMainGrade(){let n={};for(const u of units){let g=types[u.type].grade;if((gradeLevels[g]??5)<5)n[g]=(n[g]||0)+1}return Object.entries(n).sort((a,b)=>b[1]-a[1])[0]?.[0]||null}
function freshEventState(){return {schedule:[],done:[],pending:null,bonus:{physical:0,magic:0,upgrade:0},waveHp:null,bossHp:0}}
let eventState=freshEventState(),eventRoomSeed=NaN;
// Rounds and events for the whole run from one seed: first event in rounds 4–7, then every 6–9 rounds, never on a
// boss round or the last round; events come from a shuffled bag so none repeats until all have appeared.
function planRunEvents(seed,lastWave){let s=(seed>>>0)||1,rnd=()=>((s=(Math.imul(s,1664525)+1013904223)>>>0)/4294967296),ids=Object.keys(runEvents),bag=[],out=[];
 let round=4+Math.floor(rnd()*4);while(round<lastWave){if(round%10===0)round++;if(round>=lastWave)break;if(!bag.length){bag=[...ids];for(let i=bag.length-1;i>0;i--){let j=Math.floor(rnd()*(i+1));[bag[i],bag[j]]=[bag[j],bag[i]]}}out.push({round,id:bag.pop()});round+=6+Math.floor(rnd()*4)}return out}
// Tests that are not about events set globalThis.__noRunEvents so random event rounds cannot interrupt them.
function eventStartRun(){eventState=freshEventState();if(globalThis.__noRunEvents||(typeof Multiplayer==='object'&&Multiplayer.mode==='coop'))return;let seed=Number.isFinite(eventRoomSeed)?(eventRoomSeed^0x5bd1e995):Math.floor(Math.random()*4294967296);eventState.schedule=planRunEvents(seed,Math.min(maxWave,1000))}
// Called when a round starts: the scheduled event of this round becomes pending and opens as soon as nothing else is.
function eventRoundStart(){let e=eventState.schedule.find(x=>x.round===wave);if(e&&!eventState.done.some(d=>d.round===wave)&&!eventState.pending)eventState.pending={round:wave,id:e.id};eventMaybeShow()}
function eventMaybeShow(){if(!eventState.pending||inLobby||ended||themePending||pendingRewards.length)return;let modal=$('#modal');if(!modal?.classList.contains('hidden')&&!$('#modalContent')?.innerHTML.includes('run-event'))return;showRunEvent()}
const eventText=v=>typeof v==='function'?v():v;
function eventOptionState(o){if(o.cost&&gold<o.cost)return `골드 ${o.cost} 필요`;if(o.need&&!o.need())return o.needText||'조건 부족';return ''}
function showRunEvent(){let p=eventState.pending;if(!p)return;let ev=runEvents[p.id];if(!ev){eventState.pending=null;return}if(!eventInRoom())paused=true;
 $('#modalContent').innerHTML=`${modalOpen({eyebrow:`EVENT · ${p.round}라운드`,title:ev.name,variant:'run-event'})}<p class="ui-modal-lead">${ev.flavor}${eventInRoom()?' 방 전체에 같은 일이 일어났습니다. 선택은 각자 합니다.':''}</p><div class="reward-list reward-cards event-cards${ev.options.length>3?' is-four':''}">${ev.options.map(o=>{let block=eventOptionState(o);return `<button class="reward-card event-card${o.id==='pass'?' is-pass':''}" style="--fam:${ev.color}" ${block?'disabled':''} onclick="chooseRunEvent('${o.id}')"><span class="card-band"><span>${ev.name}</span><span>${o.cost?`${o.cost}골드`:'무료'}</span></span><span class="reward-icon" aria-hidden="true">${ev.icon}</span><span class="choice-top"><strong>${o.name}</strong></span><span class="choice-desc">${eventText(o.desc)}</span>${block?`<span class="reward-fit">${block}</span>`:''}</button>`}).join('')}</div>${modalClose()}`;$('#modal').classList.remove('hidden');updateUI()}
function chooseRunEvent(optionId){let p=eventState.pending;if(!p)return false;let ev=runEvents[p.id],o=ev?.options.find(x=>x.id===optionId);if(!o||eventOptionState(o))return false;
 if(o.cost)gold-=o.cost;let note=o.apply?o.apply():null;eventState.done.push({round:p.round,id:p.id,choice:o.id,note:typeof note==='string'?note:null});eventState.pending=null;globalThis.ManmulSound?.play('reward');
 $('#modal').classList.add('hidden');if(!eventInRoom())paused=false;if(pendingRewards.length)showReward();updateUI();return true}
// Effects that live through the run (enemy health changes are applied when enemies spawn).
function eventApplyEnemy(e){if(!e||e.bountyId)return;if(eventState.waveHp&&e.spawnWave===eventState.waveHp.wave&&e.kind!=='boss'){e.hp*=eventState.waveHp.mult;e.max*=eventState.waveHp.mult}if(e.kind==='boss'&&eventState.bossHp){e.hp*=eventState.bossHp;e.max*=eventState.bossHp;eventState.bossHp=0}}
function eventSummaryList(){return eventState.done.map(d=>{let ev=runEvents[d.id],o=ev?.options.find(x=>x.id===d.choice);return ev&&o?`${d.round}R ${ev.name} · ${o.name}${d.note?` (${d.note})`:''}`:null}).filter(Boolean)}
