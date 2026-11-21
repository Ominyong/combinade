'use strict';
// 협동 모드 「균열 공동 방어」: 2–4 players defend ONE shared battlefield, no zones. The host's game runs the whole
// battle; guests do not simulate, they send commands (summon, combine, sell, convert, upgrade, ticket, card, move,
// support) and draw the host's snapshots (10 per second). Every unit belongs to a player (u.owner) and is drawn in
// that player's colour; only its owner can select or command it.
// Each player keeps their own gold, grade upgrades, tickets, boss reward cards, Heritage Tree bonuses and unit stars.
// On the host, a guest's command runs the normal game function after swapping that player's state in (ctx), with
// screen side effects silenced; per-owner combat bonuses come from a cache refreshed a few times per second.
// Enemies scale with the number of players, the team shares one monster limit, one rift theme per player is stacked,
// every 20th round brings the raid boss 「균열 군주」 with changing weaknesses, Alt+click pings, and the result shows
// each player's share of the damage.
// Loaded after multiplayer.js; game globals are read only inside functions.
const Coop=(()=>{
 const colors=['#f0cb82','#6fe0d0','#f39ac8','#b79bff'];
 const scale={hp:[1,1,1.8,2.5,3.2],boss:[1,1,2.2,3.3,4.4],count:[1,1,1.3,1.6,1.9],limit:[100,100,130,150,170]};
 const SNAP=.1,CACHE=.25,RAID_EVERY=20;
 let on=false,host=false,me=null,roster=[],extraThemes=[],ctx={},acting=null,saved=null,cache={},team={},cacheAt=-1,snapAt=0,notes=null,pings=[],contrib={},hits=[],guestTargets=new Map(),sentCards=[],lastPending='',raidPhase={};
 const count=()=>Math.max(1,Math.min(4,roster.length));
 function colorOf(id){let i=roster.findIndex(p=>p.id===id);return colors[(i<0?0:i)%colors.length]}
 function nameOf(id){return roster.find(p=>p.id===id)?.name||'플레이어'}
 // ---- start / stop ----
 function start(msg,list,selfId,isHost){on=true;host=isHost;me=selfId;roster=list.map(p=>({id:p.id,name:p.name}));extraThemes=(Array.isArray(msg.themes)?msg.themes:[]).filter(t=>ManmulThemes.themes[t]&&t!==msg.theme).slice(0,3);ctx={};contrib={};pings=[];hits=[];cache={};team={};cacheAt=-1;raidPhase={};
  if(host)for(const p of roster)if(p.id!==me)ctx[p.id]=freshCtx(msg.profiles?.[p.id]);
  if(!host)installGuest();installCommon();updateLimitLabel()}
 // Both sides: only own units can be selected; Alt+click pings; the signal bar and coop styles show.
 let commonInstalled=false;
 function installCommon(){if(typeof document==='undefined')return;document.body?.classList?.add('coop-mode');$('#coopBar')?.classList.remove('hidden');if(commonInstalled)return;commonInstalled=true;
  const baseUpdateUI=updateUI;globalThis.updateUI=function(...a){if(on&&selected.length)selected=selected.filter(id=>units.some(u=>u.id===id&&u.owner===me));return baseUpdateUI.apply(this,a)};
  let canvas=$('#game');canvas?.addEventListener?.('pointerdown',e=>{if(!on||!e.altKey||e.button!==0||typeof pos!=='function')return;e.stopImmediatePropagation();e.preventDefault();let p=pos(e);ping(p.x,p.y)},true)}
 function stop(){on=false;host=false;ctx={};roster=[];extraThemes=[];if(typeof document!=='undefined'){document.body?.classList?.remove('coop-mode');$('#coopBar')?.classList.add('hidden')}}
 // A player's run state on the host. Guests send their Heritage Tree levels and unit stars when the game starts.
 function freshCtx(profile){let levels=profile?.levels&&typeof profile.levels==='object'?profile.levels:{},shards=profile?.stars&&typeof profile.stars==='object'?profile.stars:{};
  let prog={shards:0,xp:0,levels:Object.fromEntries(Object.keys(treeNodes).map(id=>[id,Math.max(0,Math.min(treeNodes[id].max,Number(levels[id])||0))])),rift:{unlocked:0,best:0}};
  return {gold:Math.max(20,100+treeBonus('startGold',prog.levels)),selectionTickets:{normal:treeBonus('ticketNormal',prog.levels),magic:treeBonus('ticketMagic',prog.levels)},runCards:[],pendingRewards:[],runLevels:Object.fromEntries(Object.keys(runUpgrades).map(k=>[k,0])),progression:prog,starData:{shards:{...shards},cosmetics:[],opened:0},gradeLevels:Object.fromEntries(Object.keys(gradeLevels).map(k=>[k,0])),runRelics:{},supportUses:{bomb:0,slow:0,loan:0}}}
 // ---- swapping a player's state into the game globals (host) ----
 function swapIn(id){if(acting!==null||!ctx[id])return false;let c=ctx[id];saved={gold,selectionTickets,runCards,pendingRewards,runLevels,progression,starData,gl:{...gradeLevels},rr:{...runRelics},su:{...supportUses},selected:[...selected],selectedEnemy,paused};
  gold=c.gold;selectionTickets=c.selectionTickets;runCards=c.runCards;pendingRewards=c.pendingRewards;runLevels=c.runLevels;progression=c.progression;starData=c.starData;
  for(const k of Object.keys(gradeLevels))gradeLevels[k]=c.gradeLevels[k]||0;for(const k of Object.keys(runRelics))delete runRelics[k];Object.assign(runRelics,c.runRelics);Object.assign(supportUses,c.supportUses);acting=id;return true}
 function swapOut(){if(acting===null)return;let c=ctx[acting];c.gold=gold;c.selectionTickets=selectionTickets;c.runCards=runCards;c.pendingRewards=pendingRewards;c.runLevels=runLevels;c.gradeLevels={...gradeLevels};c.runRelics={...runRelics};c.supportUses={...supportUses};
  let s=saved;gold=s.gold;selectionTickets=s.selectionTickets;runCards=s.runCards;pendingRewards=s.pendingRewards;runLevels=s.runLevels;progression=s.progression;starData=s.starData;for(const k of Object.keys(gradeLevels))gradeLevels[k]=s.gl[k]||0;for(const k of Object.keys(runRelics))delete runRelics[k];Object.assign(runRelics,s.rr);Object.assign(supportUses,s.su);selected=s.selected;selectedEnemy=s.selectedEnemy;paused=s.paused;acting=null;saved=null}
 const silent=['notice','updateUI','openUpgrades','openTickets','closeModal','showReward','recordAcquire','missionEvent','openSupport','renderBattleMenu'];
 // Run fn as player id with screen side effects silenced; notices are collected and sent to that player.
 function runAs(id,fn){if(id===me||!ctx[id])return fn();let keep={};for(const k of silent){keep[k]=globalThis[k];globalThis[k]=()=>{}}let collected=[];globalThis.notice=t=>collected.push(String(t));
  let r;try{swapIn(id);paused=false;r=fn()}finally{swapOut();for(const k of silent)globalThis[k]=keep[k];cacheAt=-1}
  if(collected.length&&typeof Multiplayer==='object')Multiplayer.sendTo(id,{t:'coopNote',texts:collected.slice(-3)});
  if(pendingRewards.length)$('#rewardButton')?.classList.remove('hidden');updateUI();return r}
 function currentOwner(){return acting??me}
 // ---- guest commands, handled on the host ----
 const ownedBy=(id,ids)=>ids.every(uid=>units.some(u=>u.id===uid&&u.owner===id));
 function onCommand(from,cmd){if(!on||!host||!cmd||typeof cmd!=='object'||!ctx[from]||ended)return;let ids=Array.isArray(cmd.ids)?cmd.ids.map(Number).filter(Number.isFinite):[];
  runAs(from,()=>{switch(cmd.c){
   case 'summon':return summon();
   case 'combine':if(!ownedBy(from,ids)||ids.length<2)return;selected=ids;return combine(Number(cmd.i));
   case 'sell':if(!ownedBy(from,[Number(cmd.id)]))return;selected=[Number(cmd.id)];return sellUnit(Number(cmd.id));
   case 'convert':if(!ownedBy(from,[Number(cmd.id)]))return;selected=[Number(cmd.id)];return convertUnit(Number(cmd.id));
   case 'upgrade':return upgradeGrade(String(cmd.grade));
   case 'ticket':return useTicket(String(cmd.kind),String(cmd.id));
   case 'card':return collectReward(String(cmd.id));
   case 'support':return useSupport(String(cmd.id));
   case 'move':{let group=units.filter(u=>ids.includes(u.id)&&u.owner===from);if(group.length&&Number.isFinite(+cmd.x)&&Number.isFinite(+cmd.y))issueMove(group,{x:+cmd.x,y:+cmd.y});return}
  }})}
 // ---- economy on the host ----
 // Kill gold goes to every player (the whole team shares the kills).
 function addGoldAll(n){gold+=n;for(const c of Object.values(ctx))c.gold+=n}
 // Round income: the host already got theirs; each guest gets the same formula with their own tree / cards / relics.
 function roundIncome(hostIncome){gold+=hostIncome;for(const id of Object.keys(ctx)){swapIn(id);let income=(selectedDifficulty?selectedDifficulty.income:combatRules.roundReward)+progression.levels.income;if(runRelics.interest)income+=Math.min(relicRules.interestCap,Math.floor(gold*relicRules.interest));income+=cardIncomeBonus();gold+=income;swapOut()}}
 // Boss reward cards: every guest gets their own choice.
 function queueGuestRewards(){for(const id of Object.keys(ctx)){swapIn(id);let choices=rewardChoiceSet();if(choices.length)pendingRewards.push(choices);swapOut()}}
 // ---- per-owner combat bonuses (host) ----
 function bonusesNow(){return {power:treeBonus('power')+cardPowerBonus(),phys:runLevels.physical*.08+treeBonus('physical'),mag:runLevels.magic*.08+treeBonus('magic'),speed:runLevels.speed*.05+treeBonus('speed'),burn:runLevels.burn*.12+treeBonus('burn'),slow:runLevels.slow*.08+treeBonus('slow'),armor:runLevels.armor*.1+treeBonus('armor'),resist:runLevels.resist*.1+treeBonus('resist'),boss:runLevels.boss*.08+treeBonus('boss'),gl:{...gradeLevels},stars:starData.shards}}
 function refreshCache(){if(acting!==null)return;cache={[me]:bonusesNow()};for(const id of Object.keys(ctx)){swapIn(id);cache[id]=bonusesNow();swapOut()}
  let all=Object.values(cache),avg=k=>all.reduce((a,b)=>a+b[k],0)/all.length;team={burn:avg('burn'),slow:avg('slow'),armor:avg('armor'),resist:avg('resist'),boss:avg('boss')};cacheAt=combatTime}
 function bonusOf(u){if(cacheAt<0||combatTime-cacheAt>CACHE||combatTime<cacheAt)refreshCache();return cache[u?.owner]||cache[me]||bonusesNow()}
 function attackBonus(u){let b=bonusOf(u),dt=types[u.type]?.damage_type;return (dt==='물리'?b.phys:dt==='마법'?b.mag:0)+starsFor(b.stars?.[u.type]||0)*starRules.bonusPerStar}
 function powerFor(u){return bonusOf(u).power}
 function gradeLevelFor(grade,u){return bonusOf(u).gl?.[grade]||0}
 function speedFor(u){return bonusOf(u).speed}
 function teamBonus(k){if(cacheAt<0||combatTime-cacheAt>CACHE)refreshCache();return team[k]||0}
 // ---- enemies: scaled by players, stacked themes, raid boss ----
 function applyEnemy(e){if(!on||!host||!e||e.bountyId)return;let n=count(),boss=e.kind==='boss'||e.kind==='miniboss',mul=boss?scale.boss[n]:scale.hp[n];e.hp*=mul;e.max*=mul;
  for(const th of extraThemes)ManmulThemes.stack?.(e,th,combatTime,{wave,intensity:selectedDifficulty?.themeIntensity??0});
  if(e.kind==='boss'&&wave%RAID_EVERY===0){e.raid=true;e.name='균열 군주';e.hp*=1.25;e.max*=1.25;e.bossAbilityName='약점: 물리'}}
 function waveCountMul(){return on?scale.count[count()]:1}
 function limit(){return on?scale.limit[count()]:100}
 function updateLimitLabel(){let el=typeof document!=='undefined'?$('.hud-limit'):null;if(el)el.textContent=`/ ${limit()}`}
 // Raid boss weakness by health: physical → magic → reactions (mark combos).
 function raidPhaseOf(e){let r=e.hp/e.max;return r>2/3?0:r>1/3?1:2}
 function adjustDamage(enemy,amount,type,options){if(!on||!enemy?.raid)return amount;let p=raidPhaseOf(enemy);if(p===0)return amount*(type==='물리'?1.5:.6);if(p===1)return amount*(type==='마법'?1.5:.6);return amount*(options?.reaction?2.5:.8)}
 function raidTick(){for(const e of enemies){if(!e.raid||e.hp<=0)continue;let p=raidPhaseOf(e);if(raidPhase[e.id]!==p){raidPhase[e.id]=p;e.bossAbilityName=['약점: 물리','약점: 마법','약점: 표식 반응'][p];broadcastNote(`균열 군주의 약점이 바뀌었습니다 → ${['물리','마법','표식 반응'][p]}`)}}}
 // ---- contribution ----
 function onDamage(enemy,amount,options){if(!on||!host)return;let src=options?.source?.id,u=src!=null?units.find(x=>x.id===src):null,owner=u?.owner;if(!owner)return;contrib[owner]=(contrib[owner]||0)+amount;if(hits.length<40)hits.push([enemy.id,Math.round(amount),options?.type==='마법'?1:0])}
 function contributionHtml(){let total=Object.values(contrib).reduce((a,b)=>a+b,0)||1;return roster.map(p=>({p,v:contrib[p.id]||0})).sort((a,b)=>b.v-a.v).map(({p,v},i)=>`<li style="--own:${colorOf(p.id)}"><b>${i===0&&v>0?'MVP ':''}${escapeProfileText(p.name)}${p.id===me?' (나)':''}</b><span class="coop-bar"><i style="width:${Math.round(v/total*100)}%"></i></span><small>${formatDamage(v)} · ${Math.round(v/total*100)}%</small></li>`).join('')}
 // ---- snapshots (host → guests) ----
 let lastTickT=null;
 function tick(dt){if(!on)return;if(dt===undefined){dt=lastTickT===null?0:Math.max(0,combatTime-lastTickT);lastTickT=combatTime}pings=pings.filter(p=>p.until>combatTime);if(!host)return;raidTick();snapAt+=dt;if(snapAt<SNAP)return;snapAt=0;sendSnapshot()}
 function publicState(){let r=v=>Math.round(v*10)/10;return {w:wave,mw:maxWave,ct:r(combatTime),sl:spawnLeft,wt:r(waveTimer),pr:r(preparation),en:ended,won:!!ended&&wave>=maxWave&&enemies.length===0,lim:limit(),ub:upcomingBoss?{name:upcomingBoss.name}:null,
  e:enemies.map(e=>[e.id,r(e.d),Math.round(e.hp),Math.round(e.max),e.kind,e.laps||0,r(e.speed),e.name||'',e.bossAbilityName||'',e.raid?1:0,Math.round(e.shield||0),Object.keys(e.manmulMarks||{}).filter(k=>e.manmulMarks[k]>combatTime)]),
  u:units.map(u=>[u.id,u.type,r(u.x),r(u.y),u.owner||me]),h:hits.splice(0),c:contrib}}
 function privateState(id){let c=ctx[id];return c?{g:c.gold,gl:c.gradeLevels,tk:c.selectionTickets,pr:c.pendingRewards,rc:c.runCards,rl:c.runLevels,rr:Object.keys(c.runRelics),su:c.supportUses}:null}
 function sendSnapshot(){if(typeof Multiplayer!=='object')return;let pub=publicState();for(const id of Object.keys(ctx))Multiplayer.sendTo(id,{t:'coopState',s:pub,p:privateState(id)})}
 // ---- guests: draw the host's battle, send commands ----
 function send(cmd){if(typeof Multiplayer==='object')Multiplayer.send({t:'coopCmd',cmd})}
 function installGuest(){
  globalThis.summon=()=>{if(!ended)send({c:'summon'})};
  globalThis.combine=i=>{let r=recipes[i];if(!r)return;let ids=selectedRecipeMatches(r);if(ids)send({c:'combine',i,ids});selected=[];updateUI()};
  globalThis.sellUnit=id=>{send({c:'sell',id});selected=[];updateUI()};
  globalThis.convertUnit=id=>{send({c:'convert',id})};
  globalThis.upgradeGrade=grade=>{send({c:'upgrade',grade})};
  globalThis.useTicket=(kind,id)=>{send({c:'ticket',kind,id});if((selectionTickets[kind]||0)<=1)closeModal();return true};
  globalThis.collectReward=id=>{if(!pendingRewards.length||!pendingRewards[0].includes(id))return;sentCards.push({s:JSON.stringify(pendingRewards[0]),at:Date.now()});send({c:'card',id});pendingRewards=pendingRewards.slice(1);lastPending=JSON.stringify(pendingRewards);paused=false;$('#modal').classList.add('hidden');if(!pendingRewards.length)$('#rewardButton').classList.add('hidden');else showReward();updateUI()};
  globalThis.useSupport=id=>{send({c:'support',id});closeModal()};
  globalThis.issueMove=(group,point)=>{let ids=group.filter(u=>u.owner===me).map(u=>u.id);if(ids.length)send({c:'move',ids,x:point.x,y:point.y});for(const u of group){u.tx=point.x;u.ty=point.y}};
  globalThis.startWave=()=>{};globalThis.multiSyncClock=()=>{};
  // No simulation on guests: enemies glide along the path between snapshots.
  globalThis.update=dt=>{combatTime+=dt;for(const e of enemies)e.d+=(e.speed||0)*dt*.98;if(preparation>0&&wave===0)preparation=Math.max(0,preparation-dt);tick(dt);updateHuntButtonSafe()}}
 function updateHuntButtonSafe(){}
 function applySnapshot(s,p){if(!on||host||!s)return;let wasWave=wave;wave=s.w;maxWave=s.mw;combatTime=s.ct;spawnLeft=s.sl;waveTimer=s.wt;preparation=s.pr;upcomingBoss=s.ub;updateLimitLabel();
  let byId=new Map(enemies.map(e=>[e.id,e]));enemies=s.e.map(a=>{let e=byId.get(a[0])||{id:a[0],spawnedAt:combatTime};Object.assign(e,{d:a[1],hp:a[2],max:a[3],kind:a[4],laps:a[5],speed:a[6],name:a[7]||undefined,bossAbilityName:a[8]||'',raid:!!a[9],shield:a[10],armor:e.armor??0,resist:e.resist??0});e.manmulMarks=Object.fromEntries((a[11]||[]).map(k=>[k,combatTime+1]));return e});
  let ub=new Map(units.map(u=>[u.id,u]));units=s.u.map(a=>{let u=ub.get(a[0])||{id:a[0],cool:0,skillTimer:0};Object.assign(u,{type:a[1],owner:a[4]});if(!u.tx||Math.hypot(u.x-a[2],u.y-a[3])>2){u.x=a[2];u.y=a[3]}u.tx=a[2];u.ty=a[3];return u});
  for(const [eid,amt,mag] of s.h||[]){let e=enemies.find(x=>x.id===eid);if(e)showDamageFeedback(e,amt,mag?'마법':'물리')}
  contrib=s.c||{};
  if(p){gold=p.g;for(const k of Object.keys(gradeLevels))gradeLevels[k]=p.gl?.[k]||0;selectionTickets=p.tk||{normal:0,magic:0};runCards=p.rc||[];runLevels=p.rl||runLevels;for(const k of Object.keys(runRelics))delete runRelics[k];for(const k of p.rr||[])runRelics[k]=true;Object.assign(supportUses,p.su||{});
   let pr=(p.pr||[]).slice(),now=Date.now();sentCards=sentCards.filter(x=>{if(now-x.at>4000)return false;let i=pr.findIndex(c=>JSON.stringify(c)===x.s);if(i<0)return false;pr.splice(i,1);return true});
   let pend=JSON.stringify(pr);if(pend!==lastPending){lastPending=pend;pendingRewards=pr;let rewardOpen=!$('#modal')?.classList.contains('hidden')&&String($('#modalContent')?.innerHTML||'').includes('BOSS REWARD');if(pendingRewards.length){$('#rewardButton')?.classList.remove('hidden');if(rewardOpen||$('#modal')?.classList.contains('hidden'))showReward()}else{$('#rewardButton')?.classList.add('hidden');if(rewardOpen){$('#modal').classList.add('hidden');paused=false}}}}
  if(wave!==wasWave&&typeof showRoundBanner==='function')showRoundBanner(wave);
  if(s.en&&!ended){if(s.won)win();else end();multiFinished(!!s.won)}
  updateUI()}
 function onNote(texts){for(const t of texts||[])notice(String(t))}
 // ---- pings: Alt+click on the field; quick signals post to the chat ----
 function ping(x,y){if(!on)return;let msg={t:'coopPing',x:Math.round(x),y:Math.round(y)};if(typeof Multiplayer==='object')Multiplayer.send(msg)}
 function onPing(from,x,y){pings.push({x,y,color:colorOf(from),name:nameOf(from),until:combatTime+3,at:combatTime});globalThis.ManmulSound?.play('reward')}
 function signal(text){if(typeof Multiplayer==='object')Multiplayer.sendChat(`📢 ${text}`)}
 function drawPings(g){if(!on||!pings.length)return;g.save();for(const p of pings){let t=combatTime-p.at,r=10+(t%1)*16;g.globalAlpha=Math.max(0,1-(t%1));g.strokeStyle=p.color;g.lineWidth=3;g.beginPath();g.arc(p.x,p.y,r,0,Math.PI*2);g.stroke();g.globalAlpha=1;g.fillStyle=p.color;g.font='bold 12px sans-serif';g.textAlign='center';g.fillText(p.name,p.x,p.y-22)}g.restore()}
 function broadcastNote(text){notice(text);if(typeof Multiplayer==='object')for(const id of Object.keys(ctx))Multiplayer.sendTo(id,{t:'coopNote',texts:[text]})}
 return {start,stop,onCommand,runAs,currentOwner,addGoldAll,roundIncome,queueGuestRewards,attackBonus,powerFor,gradeLevelFor,speedFor,teamBonus,applyEnemy,waveCountMul,limit,adjustDamage,onDamage,contributionHtml,tick,applySnapshot,onNote,ping,onPing,signal,drawPings,colorOf,nameOf,sendSnapshot,refreshCache,
  get on(){return on},get host(){return host},get me(){return me},get roster(){return roster},get extraThemes(){return extraThemes},get ctx(){return ctx},get contrib(){return contrib},get pings(){return pings}};
})();
globalThis.Coop=Coop;
