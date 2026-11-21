'use strict';
// 균열 단계: an extra challenge ladder on top of 극한. Clearing 극한 unlocks 단계 1; clearing 단계 N unlocks N+1 (max 10).
// Each level adds one penalty and every penalty below it stays on. Higher levels pay more shards and guardian XP.
// Loaded before game.js; game globals are read only when the functions run. Saved in progression.rift.
const riftMax=10;
// One penalty per level, in order. `mods` are summed over levels 1..N by riftMods().
const riftSteps=[
 {text:'적 체력 +10%',mods:{hp:.10}},
 {text:'라운드 시작 골드 -2',mods:{income:-2}},
 {text:'보스·현상금 보스 체력 +15%',mods:{boss:.15}},
 {text:'보상 카드 선택지 -1',mods:{cards:-1}},
 {text:'적 이동 속도 +8%',mods:{speed:.08}},
 {text:'현상금 보스 제한 시간 -5초',mods:{huntTime:-5}},
 {text:'적 방어력·마법 저항력 +15%',mods:{defense:.15}},
 {text:'균열 순환 때 체력 증가 +5%p',mods:{lap:.05}},
 {text:'시작 골드 -30',mods:{startGold:-30}},
 {text:'적 체력 +10%, 보스 체력 +25% 추가',mods:{hp:.10,boss:.25}}
];
const riftRewardPerLevel={shards:.15,xp:.10};
function riftMods(level){let m={hp:0,boss:0,income:0,cards:0,speed:0,huntTime:0,defense:0,lap:0,startGold:0};for(let i=0;i<Math.min(level,riftMax);i++)for(const [k,v] of Object.entries(riftSteps[i].mods))m[k]+=v;return m}
// A copy of the 극한 difficulty with the level's health / income / lap changes folded in.
function riftDifficulty(base,level){if(!level)return base;let m=riftMods(level);return {...base,name:`${base.name} · 균열 ${level}`,riftLevel:level,hp:base.hp*(1+m.hp),boss:base.boss*(1+m.hp)*(1+m.boss),income:base.income+m.income,lapGrowth:base.lapGrowth+m.lap}}
let runRiftLevel=0;
function riftActiveMods(){return riftMods(runRiftLevel)}
// Speed and defences are per enemy (health is already in the difficulty copy).
function riftApplyEnemy(e){if(!runRiftLevel||!e)return;let m=riftActiveMods();if(m.speed)e.speed*=1+m.speed;if(m.defense){e.armor=Math.round(e.armor*(1+m.defense));e.resist=Math.round(e.resist*(1+m.defense))}}
// ---- progress: unlocked = highest level that can be picked; best = highest level cleared ----
function riftProgress(){let r=progression.rift||{};let cleared=playerProfile?.firstClears?.extreme===true;return {unlocked:Math.max(cleared?1:0,Math.min(riftMax,r.unlocked||0)),best:Math.max(0,Math.min(riftMax,r.best||0))}}
function riftRecordClear(level){let p=riftProgress(),next={unlocked:Math.min(riftMax,Math.max(p.unlocked,level+1)),best:Math.max(p.best,level)};saveProgression({...progression,rift:next,levels:{...progression.levels}});return {opened:next.unlocked>p.unlocked?next.unlocked:0,best:next.best}}
// Lobby pick, remembered between visits. Only used for single-player 극한.
let selectedRiftLevel=(()=>{try{return Math.max(0,Number(localStorage.getItem('rift-level'))||0)}catch(e){return 0}})();
function setRiftLevel(level){let p=riftProgress();selectedRiftLevel=Math.max(0,Math.min(p.unlocked,level));try{localStorage.setItem('rift-level',String(selectedRiftLevel))}catch(e){}if(typeof renderDifficultyCards==='function')renderDifficultyCards()}
function riftPickerHtml(){let p=riftProgress();if(!p.unlocked)return '<p class="rift-locked">극한을 클리어하면 <b>균열 단계</b>가 열립니다. 단계마다 조건이 하나씩 붙고 보상이 커집니다.</p>';
 let lv=Math.min(selectedRiftLevel,p.unlocked),list=riftSteps.slice(0,Math.max(lv,0)).map((s,i)=>`<li><b>${i+1}</b>${s.text}</li>`).join(''),nextStep=lv<riftMax?riftSteps[lv]:null;
 return `<div class="rift-picker"><div class="rift-picker-head"><strong>균열 단계</strong><button type="button" onclick="setRiftLevel(${lv-1})" ${lv<=0?'disabled':''} aria-label="균열 단계 낮추기">−</button><b class="rift-level">${lv?lv+'단계':'없음'}</b><button type="button" onclick="setRiftLevel(${lv+1})" ${lv>=p.unlocked?'disabled':''} aria-label="균열 단계 올리기">＋</button><small>열린 단계 ${p.unlocked} · 정복 ${p.best||'-'}</small></div>
 ${lv?`<ol class="rift-steps">${list}</ol><p class="rift-reward">보상: 파편 +${Math.round(lv*riftRewardPerLevel.shards*100)}% · 수호자 경험치 +${Math.round(lv*riftRewardPerLevel.xp*100)}%</p>`:'<p class="rift-locked">단계 없이 일반 극한으로 출격합니다.</p>'}${nextStep&&lv===p.unlocked&&p.unlocked<riftMax?`<p class="rift-next">이 단계를 정복하면 ${lv+1}단계(${nextStep.text})가 열립니다.</p>`:''}</div>`}
