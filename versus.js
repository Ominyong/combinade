'use strict';
// 경쟁 모드 「균열 쟁탈전」: a multiplayer room mode on top of the normal one (everyone defends their own map, the room
// clock is shared). Last player standing wins. The run lasts 100 rounds; if two or more players are still alive when
// round 99 is cleared, round 100 is a 60-second duel against the final boss: whoever deals the most damage to it ranks
// highest. Killing monsters fills the 균열 게이지, spent on hindrances sent to a chosen opponent or on own skills.
// Loaded after multiplayer.js; talks to the room through Multiplayer.send / Multiplayer.players / Multiplayer.states.
const Versus=(()=>{
 const rules={segment:40,maxSegments:6,gain:{normal:1,boss:20,hunt:12},finalSeconds:60,finalBossHp:5,repeatWindow:30,rankShards:[10,6,3,1]};
 const hindrances={
  elite:{name:'정예 습격',cost:2,desc:'정예 몬스터 3마리'},
  swarm:{name:'몬스터 떼',cost:2,desc:'일반 몬스터 15마리'},
  supply:{name:'보급 차단',cost:3,desc:'다음 라운드 골드 -40%'},
  quake:{name:'균열 진동',cost:3,desc:'유닛 3기 2초 기절'},
  boss:{name:'보스 강화',cost:4,desc:'다음 보스 체력 +20%'}
 };
 const skills={
  shield:{name:'균열 결계',cost:2,desc:'다음 방해 1회 무효'},
  onslaught:{name:'총공세',cost:3,desc:'10초간 공격력 +25%'},
  warp:{name:'시간 왜곡',cost:3,desc:'8초간 적 이동 속도 -40%'},
  bombard:{name:'균열 폭격',cost:4,desc:'일반 몬스터 최대 체력 25% 피해'}
 };
 let s=fresh();
 function fresh(){return {active:false,gauge:0,target:null,shield:false,buffUntil:0,incomeMul:1,bossHp:0,lastFrom:{},final:null,finishedAs:null,rankGiven:false,hudKey:''}}
 const segments=()=>Math.floor(s.gauge/rules.segment);
 const inRoom=()=>typeof Multiplayer==='object'&&Multiplayer.started&&Multiplayer.mode==='versus';
 function start(){s=fresh();s.active=true;maxWave=100;selectedDifficulty={...selectedDifficulty,rounds:100,name:`${selectedDifficulty.name} · 경쟁`};if(typeof eventStartRun==='function')eventStartRun();render(true)}
 function reset(){s=fresh();render(true)}
 // ---- gauge ----
 function onKill(enemy){if(!s.active||ended)return;let g=enemy?.kind==='boss'?rules.gain.boss:enemy?.bountyId?rules.gain.hunt:rules.gain.normal;s.gauge=Math.min(rules.segment*rules.maxSegments,s.gauge+g);render()}
 function spend(cost){if(segments()<cost)return false;s.gauge-=cost*rules.segment;return true}
 // ---- opponents ----
 function opponents(){if(typeof Multiplayer!=='object')return [];let st=Multiplayer.states||{};return (Multiplayer.players||[]).filter(p=>p.id!==Multiplayer.selfId).map(p=>({id:p.id,name:p.name,wave:st[p.id]?.wave||0,enemies:st[p.id]?.enemies||0,out:!!(st[p.id]?.left||(st[p.id]?.ended&&!st[p.id]?.vs?.done&&st[p.id]?.vs?.how!=='survivor'))}))}
 function aliveOpponents(){return opponents().filter(o=>!o.out)}
 function setTarget(id){s.target=id;render(true)}
 function currentTarget(){let alive=aliveOpponents();if(s.target&&alive.some(o=>o.id===s.target))return s.target;s.target=alive[0]?.id||null;return s.target}
 // ---- sending a hindrance ----
 function send(kind){let h=hindrances[kind],to=currentTarget();if(!s.active||ended||!h||!to)return false;if(!spend(h.cost)){notice('균열 게이지가 부족합니다');return false}
  Multiplayer.send({t:'hinder',to,kind});let name=opponents().find(o=>o.id===to)?.name||'상대';notice(`${name} 님에게 「${h.name}」을(를) 보냈습니다`);globalThis.ManmulSound?.play('wave');render(true);return true}
 // ---- receiving one (diminished when the same sender hits again within 30s; 균열 결계 blocks it) ----
 function receive(msg){if(!s.active||ended||inLobby)return {blocked:true};let h=hindrances[msg.kind];if(!h)return {blocked:true};let from=msg.fromName||'상대';
  if(s.shield){s.shield=false;notice(`${from} 님의 「${h.name}」을(를) 균열 결계가 막았습니다`);render(true);return {blocked:true}}
  let repeat=(s.lastFrom[msg.from]??-1e9)>combatTime-rules.repeatWindow,scale=repeat?.5:1;s.lastFrom[msg.from]=combatTime;
  if(msg.kind==='elite'){for(let i=0;i<Math.round(3*scale);i++){spawnEnemy('fast');let e=enemies[enemies.length-1];e.hp*=4;e.max*=4;e.name='정예 습격대'}}
  else if(msg.kind==='swarm'){for(let i=0;i<Math.round(15*scale);i++)spawnEnemy('normal')}
  else if(msg.kind==='supply'){s.incomeMul=Math.min(s.incomeMul,1-.4*scale)}
  else if(msg.kind==='quake'){let pool=[...units];for(let i=0;i<3&&pool.length;i++){let u=pool.splice(Math.floor(Math.random()*pool.length),1)[0];u.vsStunUntil=combatTime+2*scale}}
  else if(msg.kind==='boss'){s.bossHp=Math.max(s.bossHp,1+.2*scale)}
  notice(`${from} 님이 「${h.name}」을(를) 보냈습니다!${repeat?' (연속 방해라 약해짐)':''}`);globalThis.ManmulSound?.play('boss');updateUI();return {blocked:false}}
 function result(msg){let h=hindrances[msg.kind];if(h&&msg.blocked)notice(`「${h.name}」이(가) 균열 결계에 막혔습니다`)}
 // ---- own skills ----
 function useSkill(kind){let k=skills[kind];if(!s.active||ended||!k)return false;if(!spend(k.cost)){notice('균열 게이지가 부족합니다');return false}
  if(kind==='shield')s.shield=true;
  else if(kind==='onslaught')s.buffUntil=combatTime+10;
  else if(kind==='warp'){for(const e of enemies)if(e.hp>0)v5Combat.effects.slow(e,.4,8,combatTime)}
  else if(kind==='bombard'){for(const e of enemies)if(e.hp>0&&e.kind!=='boss'&&e.kind!=='miniboss'){let d=Math.min(e.hp,e.max*.25);e.hp-=d;showDamageFeedback(e,d,'물리')}}
  notice(`「${k.name}」 사용`);globalThis.ManmulSound?.play('reward');render(true);return true}
 // ---- hooks used by game.js ----
 function attackBonus(u){if(!s.active)return 0;if((u.vsStunUntil||0)>combatTime)return -1;return s.buffUntil>combatTime?.25:0}
 function incomeMul(){if(!s.active)return 1;let m=s.incomeMul;s.incomeMul=1;return m}
 function applyEnemy(e){if(!s.active||!e||e.kind!=='boss')return;if(wave>=maxWave){e.hp*=rules.finalBossHp;e.max*=rules.finalBossHp;e.name='균열 심판자'}if(s.bossHp){e.hp*=s.bossHp;e.max*=s.bossHp;s.bossHp=0}}
 function onDamage(enemy,amount){if(s.final&&!s.final.done&&enemy?.kind==='boss'&&wave>=maxWave)s.final.damage+=Math.max(0,Math.min(amount,enemy.max))}
 // ---- ending: last survivor, or the round-100 boss duel ----
 function tick(){if(!s.active||ended||inLobby)return;
  // Last survivor only counts before the final round: opponents who finished the boss duel are not "out".
  if(!s.final&&inRoom()&&aliveOpponents().length===0&&opponents().length>0){finish('survivor');return}
  if(wave>=maxWave&&!s.final&&enemies.some(e=>e.kind==='boss')){s.final={startedAt:combatTime,damage:0,done:false,killAt:null};notice(`최종 라운드! ${rules.finalSeconds}초 동안 보스에게 가장 큰 피해를 준 사람이 이깁니다`)}
  if(s.final&&!s.final.done&&combatTime-s.final.startedAt>=rules.finalSeconds)finish('final');
  render()}
 // Called instead of win() when the last round is cleared in versus mode (the final boss died before time ran out).
 function onFinalClear(){if(!s.active)return false;if(s.final&&!s.final.done){s.final.killAt=combatTime-s.final.startedAt;finish('final')}else finish('survivor');return true}
 function finish(how){if(ended)return;if(s.final&&how==='final')s.final.done=true;s.finishedAs=how;ended=true;paused=false;let prevBest=difficultyBest();
  let r=testRun?null:grantClearRewards(selectedDifficultyId,Math.max(0,wave-1),false),xp=testRun?'':guardianXpHtml(how==='survivor');
  let head=how==='survivor'?'최후 생존!':'최종 결산',lead=how==='survivor'?'다른 플레이어가 모두 탈락했습니다.':`최종 보스에게 준 피해 <b>${Math.round(s.final?.damage||0).toLocaleString()}</b>${s.final?.killAt!=null?` · ${s.final.killAt.toFixed(1)}초 만에 처치`:''}. 다른 플레이어의 결과를 기다립니다.`;
  $('#modalContent').innerHTML=`${modalOpen({eyebrow:'VERSUS',title:head,variant:'result-modal is-victory'})}<p class="ui-modal-lead">${lead}</p>${resultSummaryHtml(true,prevBest,r?`균열의 파편 ${r.shards}개 획득${xp}`:'테스트 모드에서는 파편과 기록을 얻을 수 없습니다.')}${modalClose(resultButtonsHtml())}`;$('#modal').classList.remove('hidden');
  globalThis.ManmulSound?.play('victory');sendSoon();multiFinished(true)}
 function sendSoon(){if(typeof Multiplayer==='object'&&Multiplayer.sendState)Multiplayer.sendState(true)}
 // What other players see (sent with the room state) and how the final list is sorted.
 function snapshot(){return s.active?{dmg:Math.round(s.final?.damage||0),done:!!s.final?.done,killAt:s.final?.killAt??null,how:s.finishedAs}:null}
 function rankRows(rows){return rows.sort((a,b)=>{let ra=a.vs?.how==='survivor'?3:a.vs?.done?2:a.won?1:0,rb=b.vs?.how==='survivor'?3:b.vs?.done?2:b.won?1:0;if(ra!==rb)return rb-ra;if(ra===2){if((b.vs.dmg||0)!==(a.vs.dmg||0))return (b.vs.dmg||0)-(a.vs.dmg||0);return (a.vs.killAt??1e9)-(b.vs.killAt??1e9)}return (b.wave-a.wave)||((a.enemies||0)-(b.enemies||0))})}
 function rowText(r){if(r.vs?.how==='survivor')return '최후 생존';if(r.vs?.done)return `보스 피해 ${Number(r.vs.dmg||0).toLocaleString()}`;return r.left&&!r.ended?'연결 끊김':`${r.wave}라운드 탈락`}
 // Rank bonus shards, once, when the final list is shown.
 function onFinalRank(rank){if(!s.active||s.rankGiven||testRun)return 0;s.rankGiven=true;let n=rules.rankShards[rank-1]||0;if(n)grantClearShards(n);return n}
 // ---- panel (bottom right): gauge, target, hindrances, skills ----
 function render(force=false){let box=typeof document!=='undefined'?$('#versusPanel'):null;if(!box)return;if(!s.active||inLobby){if(!box.classList.contains('hidden'))box.classList.add('hidden');s.hudKey='';return}
  let seg=segments(),opp=opponents(),tgt=currentTarget(),key=JSON.stringify([seg,Math.floor(s.gauge%rules.segment/4),opp,tgt,s.shield,s.buffUntil>combatTime,ended,s.final?Math.ceil(rules.finalSeconds-(combatTime-s.final.startedAt)):null]);if(!force&&key===s.hudKey)return;s.hudKey=key;box.classList.remove('hidden');
  let fill=Math.min(100,s.gauge/(rules.segment*rules.maxSegments)*100),cells=Array.from({length:rules.maxSegments},(_,i)=>`<i class="${i<seg?'is-on':''}"></i>`).join('');
  let targets=opp.map(o=>`<button type="button" class="vs-target${o.id===tgt?' is-on':''}${o.out?' is-out':''}" ${o.out?'disabled':''} onclick="Versus.setTarget('${o.id}')"><b>${escapeProfileText(o.name)}</b><small>${o.out?'탈락':`${o.wave}R · 몬스터 ${o.enemies}`}</small></button>`).join('');
  let btn=(id,d,fn)=>`<button type="button" class="vs-act" ${seg<d.cost||ended||(fn==='send'&&!tgt)?'disabled':''} onclick="Versus.${fn}('${id}')" title="${d.desc}"><b>${d.name}</b><small>${'◆'.repeat(d.cost)}</small></button>`;
  let finalLine=s.final&&!s.final.done?`<p class="vs-final">최종 라운드 · 남은 ${Math.max(0,Math.ceil(rules.finalSeconds-(combatTime-s.final.startedAt)))}초 · 피해 ${Math.round(s.final.damage).toLocaleString()}</p>`:'';
  box.innerHTML=`<div class="vs-head"><b>균열 게이지</b><small>${s.shield?'결계 ✓ · ':''}${s.buffUntil>combatTime?'총공세 중 · ':''}${seg}/${rules.maxSegments}</small></div><div class="vs-gauge"><span style="width:${fill.toFixed(1)}%"></span>${cells}</div>${finalLine}
  <div class="vs-section"><small>방해 대상</small><div class="vs-targets">${targets||'<span class="muted">상대 없음</span>'}</div></div>
  <div class="vs-section"><small>방해 보내기</small><div class="vs-acts">${Object.entries(hindrances).map(([id,d])=>btn(id,d,'send')).join('')}</div></div>
  <div class="vs-section"><small>내 스킬</small><div class="vs-acts">${Object.entries(skills).map(([id,d])=>btn(id,d,'useSkill')).join('')}</div></div>`}
 return {rules,hindrances,skills,start,reset,onKill,send,receive,result,useSkill,setTarget,attackBonus,incomeMul,applyEnemy,onDamage,tick,onFinalClear,snapshot,rankRows,rowText,onFinalRank,render,
  get active(){return s.active},get gauge(){return s.gauge},set gauge(v){s.gauge=v},get state(){return s},opponents};
})();
globalThis.Versus=Versus;
