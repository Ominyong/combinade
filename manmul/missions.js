'use strict';
// 현상금 사냥 (player-summoned bounty bosses) and the per-run mission board. Loaded before game.js; reads game
// globals only when called.
//
// 미션: a fixed checklist for the whole run (like hidden missions in custom defense maps). Every mission pays once,
// as soon as its condition is met. Some must be done before a round ("before"); 히든 미션 show only "???" until
// achieved. Progress comes from game events (kill, summon, fuse, sell, convert, upgrade, acquire, boss last hits).
// ---- 현상금 사냥: bounty bosses the player summons when the army feels strong enough ----
// Four bosses unlock by round. Summoning is free but each boss has a cooldown (from the moment it is summoned)
// and a time limit: kill it before the limit to collect the bounty, otherwise it escapes with nothing paid.
// Health follows the current round and difficulty (a mid-boss-strength enemy × the boss's multiplier).
const huntBosses=[
 {id:'dakal',name:'다칼',tier:1,from:1,hp:1.25,time:40,cooldown:180,color:'#9fd8a0',reward:{goldBase:10,goldPer:.5}},
 {id:'gosichu',name:'고시츄',tier:2,from:10,hp:1.75,time:45,cooldown:300,color:'#8fc1e8',reward:{goldBase:10,goldPer:.5,ticket:'normal',n:1}},
 {id:'hubii',name:'후비이',tier:3,from:20,hp:2.25,time:50,cooldown:480,color:'#c79bff',reward:{goldBase:20,goldPer:1,ticket:'magic',n:1}},
 {id:'ominyong',name:'오미뇽',tier:4,from:35,hp:3.5,time:60,cooldown:720,color:'#f4d06f',reward:{goldBase:40,goldPer:1,card:true}}
];
function freshHunt(){return {ready:{},kills:{},escapes:0}}
let hunt=freshHunt();
function currentWave(){try{return wave}catch(e){return 1}}
function huntBoss(id){return huntBosses.find(b=>b.id===id)}
function huntActive(id){return enemies.find(e=>e.bountyId===id&&e.hp>0)||null}
function huntCooldownLeft(id){return Math.max(0,(hunt.ready[id]||0)-combatTime)}
function huntState(b){if(currentWave()<Math.max(1,b.from))return 'locked';if(huntActive(b.id))return 'active';if(huntCooldownLeft(b.id)>0)return 'cooldown';return 'ready'}
function huntReadyCount(){return huntBosses.filter(b=>huntState(b)==='ready').length}
function huntGold(b,w=currentWave()){return Math.round(b.reward.goldBase+b.reward.goldPer*w)}
function huntRewardText(b,w){let r=b.reward,parts=[`${huntGold(b,w)}골드`];if(r.ticket)parts.push(`${ticketGrades[r.ticket]} 선택권 ${r.n}장`);if(r.card)parts.push('보상 카드 1장 선택');return parts.join(' + ')}
// Health this boss would have if summoned now (spawns a throwaway enemy and removes it again).
function huntHpPreview(b){let keep=enemyId;spawnEnemy('miniboss');let e=enemies.pop();enemyId=keep;return Math.round(e.max*b.hp)}
function summonHunt(id){let b=huntBoss(id);if(!b||ended||inLobby)return false;let st=huntState(b);
 if(st!=='ready'){notice(st==='locked'?`${b.name}은(는) ${b.from}라운드부터 소환할 수 있습니다`:st==='active'?`${b.name}이(가) 이미 전장에 있습니다`:`${b.name} 재소환까지 ${Math.ceil(huntCooldownLeft(id))}초`);return false}
 spawnEnemy('miniboss');let e=enemies[enemies.length-1];e.hp=e.max=e.max*b.hp;e.name=b.name;e.bountyId=id;e.expireAt=combatTime+b.time;e.bountyWave=currentWave();
 hunt.ready[id]=combatTime+b.cooldown;globalThis.ManmulSound?.play('boss');notice(`현상금 사냥: ${b.name} 등장 · ${b.time}초 안에 처치하세요`);renderMissionHud(true);updateUI();return e}
function claimHunt(enemy){let b=huntBoss(enemy.bountyId);if(!b)return null;let w=enemy.bountyWave||currentWave(),coins=huntGold(b,w),r=b.reward;
 gold+=coins;if(r.ticket)selectionTickets[r.ticket]+=r.n;hunt.kills[b.id]=(hunt.kills[b.id]||0)+1;
 if(Number.isFinite(enemy.spawnedAt)&&combatTime-enemy.spawnedAt<=b.time/2)missionState.flags.quickHunt=true;
 globalThis.ManmulSound?.play('reward');notice(`현상금 획득! ${b.name} · ${huntRewardText(b,w)}`);
 if(r.card){let choices=rewardChoiceSet();if(choices.length){pendingRewards.push(choices);showReward()}}
 missionCheck();renderMissionHud(true);updateUI();return {id:b.id,gold:coins}}
// Bosses past their time limit escape (no reward). Called every frame.
function huntTick(){let gone=enemies.filter(e=>e.bountyId&&e.hp>0&&combatTime>=e.expireAt);if(!gone.length)return;
 enemies=enemies.filter(e=>!gone.includes(e));if(gone.some(e=>e.id===selectedEnemy))selectedEnemy=null;
 for(const e of gone){hunt.escapes++;notice(`${e.name}이(가) 도망쳤습니다 · 현상금 실패`)}renderMissionHud(true);updateUI()}
function huntTotalKills(){return Object.values(hunt.kills).reduce((s,n)=>s+n,0)}
function huntCardHtml(b){let st=huntState(b),w=currentWave(),cd=Math.ceil(huntCooldownLeft(b.id)),active=huntActive(b.id);
 let btn=st==='ready'?`<button type="button" class="ui-btn-primary hunt-summon" onclick="if(summonHunt('${b.id}'))closeMissions();else openHunt()">소환</button>`:st==='active'?`<button type="button" disabled>사냥 중 · ${Math.max(0,Math.ceil(active.expireAt-combatTime))}초</button>`:st==='cooldown'?`<button type="button" disabled>재소환 ${cd}초</button>`:`<button type="button" disabled>${b.from}라운드부터</button>`;
 return `<div class="hunt-card is-${st}" style="--hunt:${b.color}"><div class="hunt-portrait" aria-hidden="true">${b.name[0]}</div><div class="hunt-tier">${'★'.repeat(b.tier)}<span>${b.tier}단계</span></div><strong class="hunt-name">${b.name}</strong>
 <dl class="hunt-stats"><dt>체력</dt><dd>${st==='locked'?'?':huntHpPreview(b).toLocaleString()}</dd><dt>제한 시간</dt><dd>${b.time}초</dd><dt>재소환</dt><dd>${b.cooldown}초</dd><dt>처치</dt><dd>${hunt.kills[b.id]||0}회</dd></dl>
 <p class="hunt-reward"><small>현상금</small>${huntRewardText(b,w)}</p>${btn}</div>`}
function openHunt(){if(inLobby||ended)return;if($('#modal').classList.contains('hidden')){missionPrevPause=paused;if(!multiActive())paused=true}
 $('#modalContent').innerHTML=`${modalOpen({eyebrow:'BOUNTY HUNT',title:'현상금 사냥',close:'현상금 사냥 닫기',variant:'hunt-modal'})}<p class="ui-modal-lead">전력이 충분하다 싶으면 현상금 보스를 불러내 잡으세요. 제한 시간 안에 처치하면 현상금을 받고, 놓치면 도망칩니다. 소환은 무료지만 보스마다 재소환 시간이 있습니다.</p><div class="hunt-grid">${huntBosses.map(huntCardHtml).join('')}</div>${modalClose('<button class="ui-btn-primary" onclick="closeMissions()">닫기</button>')}`;$('#modal').classList.remove('hidden')}

// ---- mission board ----
function freshMissionState(){return {done:{},order:[],seen:{},count:{kills:0,summons:0,sells:0,converts:0,upgrades:0,bossKills:0,fuseRare:0,peakGold:0},flags:{},convertStreak:{type:null,n:0}}}
let missionState=freshMissionState();
const gradeRank=g=>ManmulRoster.grades.indexOf(g);
function seenOfGrade(grade){return Object.keys(missionState.seen).filter(id=>types[id]?.grade===grade).length}
function gradeTotal(grade){return Object.values(types).filter(t=>t.grade===grade).length}
function ownedOfGrade(grade){return new Set(units.filter(u=>types[u.type]?.grade===grade).map(u=>u.type)).size}
function maxSameOwned(){let n={};for(const u of units)n[u.type]=(n[u.type]||0)+1;return Math.max(0,...Object.values(n))}
const mc=()=>missionState.count,mf=()=>missionState.flags;
const flag=k=>()=>[mf()[k]?1:0,1];
const missionList=[
 {id:'normals',name:'신병 모집',desc:'노말 유닛 7종을 모두 얻기',progress:()=>[seenOfGrade('노말'),gradeTotal('노말')],reward:{ticket:'normal',n:1}},
 {id:'sweep',name:'청소부',desc:'몬스터 40마리 처치',progress:()=>[mc().kills,40],reward:{gold:30}},
 {id:'smith',name:'대장장이',desc:'등급 강화 2회',progress:()=>[mc().upgrades,2],reward:{gold:40}},
 {id:'merchant',name:'상인',desc:'유닛 5기 판매',progress:()=>[mc().sells,5],reward:{gold:40}},
 {id:'quickRare',name:'빠른 손',desc:'레어 유닛 조합',before:10,progress:()=>[Math.min(1,mc().fuseRare),1],reward:{ticket:'magic',n:1}},
 {id:'firstHunt',name:'첫 사냥',desc:'현상금 보스 다칼 처치',before:15,progress:()=>[Math.min(1,hunt.kills.dakal||0),1],reward:{ticket:'normal',n:2}},
 {id:'magics',name:'마력 수집가',desc:'서로 다른 매직 유닛 10종 얻기',progress:()=>[seenOfGrade('매직'),10],reward:{ticket:'magic',n:1}},
 {id:'saver',name:'저축왕',desc:'골드 300을 한 번에 모으기',progress:()=>[Math.min(300,mc().peakGold),300],reward:{ticket:'normal',n:2}},
 {id:'alchemist',name:'연금술사',desc:'같은 등급 변환 10회',progress:()=>[mc().converts,10],reward:{ticket:'magic',n:1}},
 {id:'caller',name:'소환술사',desc:'소환 60회',progress:()=>[mc().summons,60],reward:{gold:60}},
 {id:'rares',name:'레어 수집가',desc:'서로 다른 레어 유닛 5종을 동시에 보유',progress:()=>[Math.min(5,ownedOfGrade('레어')),5],reward:{ticket:'magic',n:1}},
 {id:'epic',name:'영웅의 탄생',desc:'에픽 유닛 얻기',progress:()=>[Math.min(1,seenOfGrade('에픽')),1],reward:{unit:'레어'}},
 {id:'bossHunter',name:'보스 사냥꾼',desc:'보스 3마리 처치',progress:()=>[mc().bossKills,3],reward:{gold:80}},
 {id:'hunter',name:'현상금 사냥꾼',desc:'현상금 보스 10번 처치',progress:()=>[huntTotalKills(),10],reward:{unit:'레어'}},
 {id:'legend',name:'전설의 시작',desc:'레전더리 유닛 얻기',progress:()=>[Math.min(1,seenOfGrade('레전더리')),1],reward:{gold:200}},
 {id:'ominyongHunt',name:'오미뇽 토벌',desc:'현상금 보스 오미뇽 처치',progress:()=>[Math.min(1,hunt.kills.ominyong||0),1],reward:{unit:'에픽'}},
 {id:'slayer',name:'학살자',desc:'몬스터 1500마리 처치',progress:()=>[mc().kills,1500],reward:{unit:'에픽'}},
 // 히든: name and condition stay hidden until achieved
 {id:'h_lasthit',hidden:true,name:'맨주먹의 일격',desc:'노말 유닛으로 보스에게 마지막 일격',progress:flag('lasthit'),reward:{unit:'레어'}},
 {id:'h_blitz',hidden:true,name:'번개 사냥',desc:'보스를 나타난 지 30초 안에 처치',progress:flag('blitz'),reward:{gold:120}},
 {id:'h_broke',hidden:true,name:'탕진',desc:'골드를 다 써서 0으로 만들기',progress:flag('broke'),reward:{ticket:'normal',n:2}},
 {id:'h_quad',hidden:true,name:'붕어빵',desc:'같은 유닛 4기를 동시에 보유',progress:()=>[maxSameOwned()>=4?1:0,1],reward:{ticket:'magic',n:1}},
 {id:'h_rainbow',hidden:true,name:'무지개',desc:'노말 유닛 7종을 동시에 보유',progress:()=>[ownedOfGrade('노말')>=gradeTotal('노말')?1:0,1],reward:{unit:'레어'}},
 {id:'h_twice',hidden:true,name:'운명의 장난',desc:'변환 결과로 같은 유닛이 3번 연속 나오기',progress:flag('twice'),reward:{ticket:'magic',n:2}},
 {id:'h_edge',hidden:true,name:'위기일발',desc:'몬스터 85마리 이상인 채로 라운드 넘기기',progress:flag('edge'),reward:{gold:150}},
 {id:'h_bigsale',hidden:true,name:'아낌없이',desc:'에픽 이상 유닛 판매',progress:flag('bigsale'),reward:{ticket:'magic',n:2}},
 {id:'h_quickhunt',hidden:true,name:'속전속결',desc:'현상금 보스를 제한 시간의 절반 안에 처치',progress:flag('quickHunt'),reward:{ticket:'normal',n:2}},
 {id:'h_hunt4',hidden:true,name:'사냥의 달인',desc:'한 판에 현상금 보스 4종을 모두 처치',progress:()=>[huntBosses.every(b=>hunt.kills[b.id])?1:0,1],reward:{gold:250}}
];
function missionById(id){return missionList.find(m=>m.id===id)}
function missionExpired(m){return !!m.before&&!missionState.done[m.id]&&currentWave()>=m.before}
function missionRewardText(r){return r.gold?`${r.gold}골드`:r.ticket?`${ticketGrades[r.ticket]} 선택권 ${r.n}장`:r.unit?`무작위 ${r.unit} 유닛 1기`:''}
function grantMissionReward(r){if(r.gold)gold+=r.gold;if(r.ticket)selectionTickets[r.ticket]+=r.n;if(r.unit)summonCardUnits(r.unit,1)}
let missionChecking=false;
// Mark every mission whose condition is now met (once each) and pay it.
function missionCheck(){if(missionChecking||inLobby)return;missionChecking=true;try{mc().peakGold=Math.max(mc().peakGold,gold);
 for(const m of missionList){if(missionState.done[m.id]||missionExpired(m))continue;let [cur,max]=m.progress();if(cur<max)continue;
  missionState.done[m.id]=currentWave()||1;missionState.order.push(m.id);grantMissionReward(m.reward);globalThis.ManmulSound?.play('reward');
  notice(`${m.hidden?'히든 미션':'미션'} 달성! ${m.name} · ${missionRewardText(m.reward)}`)}
 }finally{missionChecking=false}renderMissionHud(true)}
// Game events. data: kill → enemy, fuse/acquire/convert/sell → unit type id.
function missionEvent(type,data){if(inLobby)return;let c=mc(),f=mf();
 if(type==='kill'){c.kills++;if(data?.kind==='boss'){c.bossKills++;if(types[data.lastHitType]?.grade==='노말')f.lasthit=true;if(Number.isFinite(data.spawnedAt)&&combatTime-data.spawnedAt<=30)f.blitz=true}}
 else if(type==='summon'){c.summons++;if(gold===0)f.broke=true}
 else if(type==='fuse'){if(gradeRank(types[data]?.grade)>=gradeRank('레어'))c.fuseRare++}
 else if(type==='acquire'){if(data)missionState.seen[data]=true}
 else if(type==='sell'){c.sells++;if(gradeRank(types[data]?.grade)>=gradeRank('에픽'))f.bigsale=true}
 else if(type==='convert'){c.converts++;let s=missionState.convertStreak;s.n=s.type===data?s.n+1:1;s.type=data;if(s.n>=3)f.twice=true;if(gold===0)f.broke=true}
 else if(type==='upgrade'){c.upgrades++;if(gold===0)f.broke=true}
 else if(type==='roundStart'){if(currentWave()>1&&enemies.length>=85)f.edge=true}
 else if(type==='tick'){if(combatTime-(missionState.lastTick||0)<.5)return;missionState.lastTick=combatTime}
 missionCheck()}
function missionTick(){huntTick();updateHuntButton();missionEvent('tick')}
// Right-panel button shows how many bounty bosses can be summoned right now.
let huntButtonKey='';
function updateHuntButton(){let b=typeof document!=='undefined'?$('#huntButton'):null;if(!b)return;let n=inLobby?0:huntReadyCount(),key=String(n);if(key===huntButtonKey)return;huntButtonKey=key;b.textContent=n?`현상금 ${n}`:'현상금';b.classList.toggle('has-ready',n>0)}
function missionDoneCount(){return Object.keys(missionState.done).length}
// ---- HUD (left column): bounty bosses being hunted (health and time left), then the three missions closest to completion ----
let missionHudKey='';
function missionNearest(n=3){return missionList.filter(m=>!m.hidden&&!missionState.done[m.id]&&!missionExpired(m)).map(m=>{let [cur,max]=m.progress();return {m,cur,max,ratio:cur/max+(m.before?.5:0)}}).sort((a,b)=>b.ratio-a.ratio).slice(0,n)}
function renderMissionHud(force=false){let box=typeof document!=='undefined'?$('#missionPanel'):null;if(!box)return;if(inLobby||currentWave()<1){if(!box.classList.contains('hidden'))box.classList.add('hidden');missionHudKey='';return}
 let hunting=enemies.filter(e=>e.bountyId&&e.hp>0),near=missionNearest(),key=JSON.stringify([near.map(x=>[x.m.id,x.cur]),hunting.map(e=>[e.id,Math.ceil(e.hp/e.max*50),Math.ceil(e.expireAt-combatTime)]),missionDoneCount()]);if(!force&&key===missionHudKey)return;missionHudKey=key;box.classList.remove('hidden');
 let b=hunting.map(e=>{let boss=huntBoss(e.bountyId),left=Math.max(0,Math.ceil(e.expireAt-combatTime));return `<div class="hunt-hud" style="--hunt:${boss.color}"><div class="mission-head"><b>현상금 사냥 · ${boss.name}</b><small class="${left<=10?'is-urgent':''}">${left}초</small></div><div class="hunt-hp"><i style="width:${Math.max(0,e.hp/e.max*100).toFixed(1)}%"></i></div><small>${huntRewardText(boss,e.bountyWave)}</small></div>`}).join('');
 let rows=near.map(({m,cur,max})=>`<li><span>${m.name}${m.before?` <em>${m.before}R 전</em>`:''}</span><span class="mission-bar"><i style="width:${Math.min(100,cur/max*100).toFixed(0)}%"></i><span>${Math.min(cur,max)}/${max}</span></span></li>`).join('');
 let m=`<button type="button" class="mission-card" onclick="openMissions()"><div class="mission-head"><b>미션</b><small>${missionDoneCount()}/${missionList.length} 달성 · 눌러서 전체 보기</small></div>${rows?`<ul class="mission-near">${rows}</ul>`:''}</button>`;
 box.innerHTML=b+m}
// ---- full list (modal) ----
function missionRowHtml(m){let done=missionState.done[m.id],expired=missionExpired(m),secret=m.hidden&&!done,[cur,max]=m.progress();
 return `<li class="mission-row${done?' is-done':''}${expired?' is-expired':''}${m.hidden?' is-hidden':''}"><span class="mission-mark" aria-hidden="true">${done?'✓':secret?'?':expired?'✗':''}</span><span class="mission-text"><strong>${secret?'???':m.name}</strong><small>${secret?'조건을 찾아보세요':m.desc}${m.before?` · <em>${m.before}라운드 전까지</em>`:''}</small></span>${secret||done?'':`<span class="mission-bar"><i style="width:${Math.min(100,cur/max*100).toFixed(0)}%"></i><span>${Math.min(cur,max)}/${max}</span></span>`}<span class="mission-reward">${done?`${done}R 달성`:expired?'기한 지남':secret?'???':missionRewardText(m.reward)}</span></li>`}
let missionPrevPause=null;
function openMissions(){if(inLobby)return;if($('#modal').classList.contains('hidden')){missionPrevPause=paused;if(!multiActive())paused=true}
 let open=missionList.filter(m=>!m.hidden),hidden=missionList.filter(m=>m.hidden),hiddenDone=hidden.filter(m=>missionState.done[m.id]).length;
 $('#modalContent').innerHTML=`${modalOpen({eyebrow:'MISSION',title:`미션 ${missionDoneCount()}/${missionList.length}`,close:'미션 닫기',variant:'mission-modal'})}<p class="ui-modal-lead">조건을 채우는 순간 보상을 바로 받습니다. 미션마다 판에 한 번씩입니다.</p><h3 class="mission-group">미션 <small>${open.filter(m=>missionState.done[m.id]).length}/${open.length}</small></h3><ul class="mission-list">${open.map(missionRowHtml).join('')}</ul><h3 class="mission-group">히든 미션 <small>${hiddenDone}/${hidden.length}</small></h3><ul class="mission-list">${hidden.map(missionRowHtml).join('')}</ul>${modalClose('<button class="ui-btn-primary" onclick="closeMissions()">확인</button>')}`;$('#modal').classList.remove('hidden')}
function closeMissions(){$('#modal').classList.add('hidden');if(missionPrevPause!==null){paused=missionPrevPause;missionPrevPause=null}updateUI()}
function missionSummaryText(){let kills=huntBosses.filter(b=>hunt.kills[b.id]).map(b=>`${b.name} ${hunt.kills[b.id]}`).join(' · '),hidden=missionList.filter(m=>m.hidden&&missionState.done[m.id]).length;return `미션 ${missionDoneCount()}/${missionList.length} 달성${hidden?` (히든 ${hidden})`:''} · 현상금 사냥 ${kills||'없음'}${hunt.escapes?` · 놓침 ${hunt.escapes}`:''}`}
