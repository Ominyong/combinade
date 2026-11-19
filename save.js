'use strict';
// 이어하기(싱글 플레이): 진행 중인 판을 브라우저에 저장했다가 로비에서 이어서 한다.
// - 5초마다, 그리고 창을 닫거나 다른 탭으로 갈 때 저장한다. 클리어·패배하면 지운다.
// - 저장하는 것: 난이도·테마·라운드·시계, 골드, 유닛과 적(객체 그대로), 등급 강화, 유물·수치 강화·선택권,
//   보스 순서·예고, 긴급 지원 사용 횟수, 판 통계와 업적 진행. 투사체·이펙트처럼 순간적인 것은 저장하지 않는다.
// - 멀티 플레이는 따로(rift-multi-save-v1) 방 정보와 함께 저장해서, 새로고침 뒤 '멀티 게임으로 돌아가기'로 재입장한다.
// - 테스트 모드는 저장하지 않는다.
// - 이어할 때는 메뉴가 열린 일시정지 상태로 시작해서, 준비되면 '계속하기'로 재개한다.
const ManmulSave=(()=>{
 const KEY='rift-save-v1',KEY_MULTI='rift-multi-save-v1',VERSION=1,EVERY=5000,MAX_AGE=14*24*3600*1000,MAX_AGE_MULTI=20*60*1000;
// 한 번이라도 멀티였던 판은 싱글 저장에 넣지 않는다. 창을 닫을 때 멀티 연결이 먼저 정리되어도 싱글 판으로 착각하지 않게 한다.
let multiRun=false;
const inMulti=()=>{let on=typeof Multiplayer==='object'&&Multiplayer.started;if(on)multiRun=true;return on};
 const $=s=>document.querySelector(s);
 const clone=v=>v==null?v:JSON.parse(JSON.stringify(v));
 function playing(){return typeof inLobby!=='undefined'&&!inLobby&&!ended&&!testRun&&introRemaining<=0&&!themePending&&!!currentTheme&&!!selectedDifficulty}
 function savable(){return playing()&&!inMulti()&&!multiRun}
 function capture(){return {v:VERSION,at:Date.now(),difficulty:selectedDifficultyId,theme:currentTheme,
  wave,maxWave,gold,combatTime,spawnLeft,spawnTimer,spawnInterval,waveTimer,preparation,uid,enemyId,revealTime,minibossSpawned,minibossCleared,
  units:clone(units),enemies:clone(enemies),upcomingBoss:clone(upcomingBoss),pendingRewards:clone(pendingRewards),
  gradeLevels:clone(gradeLevels),runLevels:clone(runLevels),runRelics:clone(runRelics),selectionTickets:clone(selectionTickets),
  bossBag:clone(bossBag),bossBagTheme,lastBossId,lastBossAbility,supportUses:clone(supportUses),loanRounds,loanRemaining,
  runStats:clone(runStats),record:clone(ManmulRecords.run),goalUnit}}
 function save(){if(!savable())return false;try{localStorage.setItem(KEY,JSON.stringify(capture()));return true}catch(e){return false}}
 function saveMulti(){if(!playing()||!inMulti())return false;let room=Multiplayer.roomSnapshot();if(!room?.token)return false;try{localStorage.setItem(KEY_MULTI,JSON.stringify({...capture(),room}));return true}catch(e){return false}}
 function load(key=KEY){try{let s=JSON.parse(localStorage.getItem(key)||'null');if(!s||s.v!==VERSION||!Object.hasOwn(difficulties,s.difficulty)||!ManmulThemes.themes[s.theme]||Date.now()-s.at>(key===KEY_MULTI?MAX_AGE_MULTI:MAX_AGE)||!Array.isArray(s.units)||!Array.isArray(s.enemies)||(key===KEY_MULTI&&!s.room?.token))return null;return s}catch(e){return null}}
 const loadMulti=()=>load(KEY_MULTI);
 function clear(){try{localStorage.removeItem(KEY)}catch(e){}renderLobby()}
 function clearMulti(){try{localStorage.removeItem(KEY_MULTI)}catch(e){}renderLobby()}
 // 그대로 옮겨 담는 값들: 같은 이름의 game.js 전역에 넣는다(객체는 내용만 바꿔 같은 참조를 유지한다).
 const fill=(target,source)=>{if(!target||!source)return;for(const k of Object.keys(target))if(!(k in source))delete target[k];Object.assign(target,source)};
 // 저장을 게임 전역에 되돌린다(싱글·멀티 공통).
 function applyState(s){
  selectedDifficultyId=s.difficulty;selectedDifficulty=difficulties[s.difficulty];maxWave=s.maxWave||selectedDifficulty.rounds;inLobby=false;
  if(s.record)ManmulRecords.restoreRun(s.record);else ManmulRecords.beginRun({difficulty:s.difficulty});
  $('#lobby').classList.add('hidden');document.body?.classList.remove('arena-intro');introRemaining=0;introThemeQueued=false;themePending=false;currentTheme=s.theme;
  ({wave,gold,combatTime,spawnLeft,spawnTimer,spawnInterval,waveTimer,preparation,revealTime,minibossSpawned,minibossCleared,lastBossId,lastBossAbility,loanRounds,loanRemaining,goalUnit}=s);
  bossBag=s.bossBag||[];bossBagTheme=s.bossBagTheme??null;upcomingBoss=s.upcomingBoss||null;pendingRewards=s.pendingRewards||[];
  fill(gradeLevels,s.gradeLevels);fill(runLevels,s.runLevels);fill(runRelics,s.runRelics||{});selectionTickets={normal:0,magic:0,...(s.selectionTickets||{})};fill(supportUses,s.supportUses);if(s.runStats)fill(runStats,s.runStats);
  units=[];for(const saved of s.units){if(!types[saved.type])continue;let u={...saved};v5Combat.prepareUnit(u,combatTime);Object.assign(u,saved);units.push(u);skillFxPreload(u.type)}
  enemies=s.enemies.filter(e=>e&&Number.isFinite(e.hp)&&e.hp>0);uid=Math.max(s.uid||0,...units.map(u=>u.id));enemyId=Math.max(s.enemyId||0,...enemies.map(e=>e.id||0));
  // 메뉴가 일시정지를 맡는다: 메뉴를 열면 멈추고, '계속하기'로 닫으면 재개된다.
  paused=false;selected=[];selectedEnemy=null;ended=false;
  if(typeof loadMapSkin==='function'&&playerProfile?.mapSkin)loadMapSkin(playerProfile.mapSkin);
  updateUI();if(pendingRewards.length)$('#rewardButton')?.classList.remove('hidden');$('#modal')?.classList.add('hidden');return true}
 function resume(){let s=load();if(!s||!inLobby)return false;applyState(s);openBattleMenu();notice(`이어하기 · ${difficulties[s.difficulty].name} ${wave}라운드`);return true}
 // 멀티: 먼저 방에 다시 연결하고(방장이 신원을 확인), 받아들여지면 게임 상태를 되살린다. 멀티에서는 멈추지 않으므로 메뉴를 열지 않는다.
 async function resumeMulti(){let s=loadMulti();if(!s||!inLobby||typeof Multiplayer!=='object')return false;let box=$('#resumeBox');box?.querySelectorAll?.('button').forEach(b=>b.disabled=true);
  let ok=await Multiplayer.rejoin(s.room,()=>{if(!inLobby)return false;applyState(s);notice(`멀티 게임에 다시 들어왔습니다 · ${wave}라운드`);return true});if(!ok)renderLobby();return ok}
 function ago(at){let m=Math.round((Date.now()-at)/60000);return m<1?'방금 전':m<60?`${m}분 전`:m<1440?`${Math.round(m/60)}시간 전`:`${Math.round(m/1440)}일 전`}
 function renderLobby(){let box=$('#resumeBox');if(!box)return;let s=load(),m=loadMulti();if(!s&&!m){box.classList.add('hidden');box.innerHTML='';return}
  box.classList.remove('hidden');box.innerHTML=(m?`<div class="resume-row resume-multi"><div class="resume-info"><strong>진행 중인 멀티 게임</strong><span>방 ${m.room.code||'-'} · ${difficulties[m.difficulty].name} · ${m.wave}/${m.maxWave}라운드 · ${(m.room.players||[]).length}명 · ${ago(m.at)}</span></div><div class="resume-actions"><button type="button" class="resume-go" onclick="ManmulSave.resumeMulti()">돌아가기</button><button type="button" class="resume-drop" onclick="ManmulSave.clearMulti()">포기</button></div></div>`:'')+(s?`<div class="resume-row">`:'')+(s?`<div class="resume-info"><strong>이어하기</strong><span>${difficulties[s.difficulty].name} · ${ManmulThemes.themes[s.theme].name} · ${s.wave}/${s.maxWave}라운드 · 유닛 ${s.units.length} · ${ago(s.at)}</span></div><div class="resume-actions"><button type="button" class="resume-go" onclick="ManmulSave.resume()">이어하기</button><button type="button" class="resume-drop" onclick="ManmulSave.confirmDrop()">삭제</button></div></div>`:'')}
 function confirmDrop(){let box=$('#resumeBox');if(!box)return;let row=box.querySelector?.('.resume-row:not(.resume-multi) .resume-actions');row&&(row.innerHTML='<span class="resume-ask">저장을 지울까요?</span><button type="button" class="resume-drop" onclick="ManmulSave.clear()">지우기</button><button type="button" onclick="ManmulSave.renderLobby()">취소</button>')}
 // 판이 끝나면 저장을 지운다(끝난 판은 이어할 수 없다).
 function tick(){if(typeof inLobby==='undefined')return;if(inLobby){multiRun=false;return}if(inMulti()){if(ended){try{localStorage.removeItem(KEY_MULTI)}catch(e){}}else saveMulti();return}if(ended&&!testRun){try{localStorage.removeItem(KEY)}catch(e){}return}save()}
 if(typeof setInterval==='function')setInterval(tick,EVERY);
 if(typeof addEventListener==='function')addEventListener('beforeunload',()=>tick());
 if(typeof document==='object')document.addEventListener?.('visibilitychange',()=>{if(document.hidden)tick()});
 renderLobby();
 return {save,saveMulti,load,loadMulti,clear,clearMulti,resume,resumeMulti,applyState,capture,renderLobby,confirmDrop,tick,KEY,KEY_MULTI};
})();
globalThis.ManmulSave=ManmulSave;
