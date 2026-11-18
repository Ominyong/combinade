'use strict';
// 누적 기록과 업적. 꾸미기(칭호·명찰·아이콘) 해금 판단의 근거가 된다.
// 저장은 판 종료·보스 처치·페이지 이탈 시. 테스트 모드 전투는 게임 쪽에서 abandonRun()으로 제외한다.
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(root);else root.ManmulRecords=factory(root)})(globalThis,function(root){
 const storageKey='defense-hub-records-v1';
 const lowGrades=['노말','매직'],specialGrades=['재앙','역설','천체'];
 const unitIconThresholds={노말:100,매직:30,레어:15,에픽:8,유니크:4,레전더리:2,재앙:1,역설:1,천체:1};
 const bossIconThreshold=5;
 const difficultyIds=['easy','normal','hard','extreme'];
 const themeIds=['steel','magic','speed','life'];
 const themeBosses=()=>root.ManmulThemes?.bosses||{};
 const allBossIds=()=>Object.values(themeBosses()).flat().map(b=>b.id);

 // reward: [묶음, id] 목록. 묶음은 progression.js의 profileCosmetics 키(titles·plates·icons).
 // progress(rec)가 있는 업적은 진행도 막대를 보여 줄 수 있다.
 const count=(rec,key)=>Number(rec[key])||0;
 const unlockedIconCount=rec=>Object.keys(rec.icons).filter(id=>id.startsWith('unit:')).length;
 const themeClearCount=(rec,minDifficulty)=>themeIds.filter(t=>difficultyIds.slice(difficultyIds.indexOf(minDifficulty)).some(d=>rec.clears[d]?.[t])).length;
 const bossSetCount=(rec,theme)=>(themeBosses()[theme]||[]).filter(b=>rec.bossKills[b.id]>0).length;
 const achievements=[
  {id:'first-game',group:'누적',name:'첫 발걸음',desc:'게임 1판 완료(승패 무관)',reward:[['icons','sprout']],progress:r=>[count(r,'games'),1]},
  {id:'regular',group:'누적',name:'단골 수호자',desc:'누적 50판',reward:[['titles','regular'],['plates','moss']],progress:r=>[count(r,'games'),50]},
  {id:'veteran',group:'누적',name:'백전노장',desc:'누적 200판',reward:[['plates','banner']],progress:r=>[count(r,'games'),200]},
  {id:'hunter',group:'누적',name:'사냥꾼',desc:'누적 처치 10,000',reward:[['titles','hunter'],['icons','blade']],progress:r=>[count(r,'kills'),10000]},
  {id:'slayer',group:'누적',name:'학살자',desc:'누적 처치 100,000',reward:[['plates','blood']],progress:r=>[count(r,'kills'),100000]},
  {id:'boss-hunter',group:'누적',name:'보스 사냥꾼',desc:'보스 누적 100회 처치',reward:[['titles','boss-hunter'],['icons','shield']],progress:r=>[Object.values(r.bossKills).reduce((a,b)=>a+b,0),100]},
  {id:'collector',group:'누적',name:'수집가',desc:'유닛 아이콘 50종 해금',reward:[['titles','collector']],progress:r=>[unlockedIconCount(r),50]},
  {id:'scholar',group:'누적',name:'만물 박사',desc:'유닛 아이콘 200종 해금',reward:[['plates','codex']],progress:r=>[unlockedIconCount(r),200]},
  {id:'clear-easy',group:'진행',name:'입문 돌파',desc:'입문 난이도 클리어',reward:[['titles','easy']]},
  {id:'clear-normal',group:'진행',name:'수호 완수',desc:'일반 난이도 클리어',reward:[['titles','normal']]},
  {id:'clear-hard',group:'진행',name:'토벌 완수',desc:'상급 난이도 클리어',reward:[['titles','hard']]},
  {id:'clear-extreme',group:'진행',name:'종결',desc:'극한 난이도 클리어',reward:[['titles','extreme'],['plates','gold']]},
  {id:'theme-four',group:'진행',name:'네 갈래 균열',desc:'4개 테마를 모두 클리어(난이도 무관)',reward:[['plates','bronze']],progress:r=>[themeClearCount(r,'easy'),4]},
  {id:'extreme-four',group:'진행',name:'극한의 사계',desc:'극한에서 4개 테마 모두 클리어',reward:[['titles','rift-closer'],['icons','crown']],progress:r=>[themeClearCount(r,'extreme'),4]},
  {id:'steel-set',group:'테마',name:'강철을 꺾은 자',desc:'강철 보스 4종 처치',reward:[['titles','steel-breaker']],progress:r=>[bossSetCount(r,'steel'),4]},
  {id:'magic-set',group:'테마',name:'마력을 끊은 자',desc:'마력 보스 4종 처치',reward:[['titles','veil-breaker']],progress:r=>[bossSetCount(r,'magic'),4]},
  {id:'speed-set',group:'테마',name:'질주를 멈춘 자',desc:'질주 보스 4종 처치',reward:[['titles','ankle-hunter']],progress:r=>[bossSetCount(r,'speed'),4]},
  {id:'life-set',group:'테마',name:'생명을 거둔 자',desc:'생명 보스 4종 처치',reward:[['titles','woodcutter']],progress:r=>[bossSetCount(r,'life'),4]},
  {id:'all-bosses',group:'테마',name:'균열 백과',desc:'보스 16종 모두 처치',reward:[['plates','silver']],progress:r=>[allBossIds().filter(id=>r.bossKills[id]>0).length,Math.max(1,allBossIds().length)]},
  {id:'first-legend',group:'도전',name:'첫 전설',desc:'레전더리 유닛 첫 획득',reward:[['titles','legend-start']]},
  {id:'forbidden',group:'도전',name:'금기의 조합',desc:'재앙·역설·천체 유닛 첫 획득',reward:[['plates','rift']]},
  {id:'star-caller',group:'도전',name:'별을 부른 자',desc:'천체 유닛 획득',hidden:true,reward:[['titles','star-caller']]},
  {id:'bare-hands',group:'도전',name:'맨주먹',desc:'노말·매직 유닛만으로 20라운드 도달',reward:[['titles','bare-hands']]},
  {id:'miser',group:'도전',name:'절약가',desc:'골드 500 이상 보유한 채 보스 처치',reward:[['titles','miser']]},
  {id:'close-call',group:'도전',name:'아슬아슬',desc:'몬스터 95마리 이상인 채 다음 라운드 시작',reward:[['titles','close-call']]},
  {id:'flawless',group:'도전',name:'무결점',desc:'몬스터 수 50을 넘기지 않고 클리어',reward:[['plates','flawless']]},
  {id:'quick-kill',group:'도전',name:'속전속결',desc:'보스를 등장 10초 안에 처치',reward:[['titles','one-strike']]},
  {id:'no-support',group:'도전',name:'긴급 금지',desc:'긴급 지원 없이 상급 이상 클리어',reward:[['titles','alone']]}
 ];
 const achievementById=Object.fromEntries(achievements.map(a=>[a.id,a]));

 function blank(){return {version:1,games:0,wins:0,kills:0,bossKills:{},acquired:{},clears:{},achievements:{},icons:{},skins:{owned:['default'],selected:'default'}}}
 function clean(data){
  let rec=blank(),num=n=>Number.isFinite(n)&&n>=0?Math.floor(n):0,map=(src,fn)=>{let out={};if(src&&typeof src==='object'&&!Array.isArray(src))for(const [k,v] of Object.entries(src)){let x=fn(v);if(x!==undefined)out[k]=x}return out};
  if(!data||typeof data!=='object')return rec;
  for(const key of ['games','wins','kills'])rec[key]=num(data[key]);
  rec.bossKills=map(data.bossKills,v=>num(v)||undefined);
  rec.acquired=map(data.acquired,v=>num(v)||undefined);
  rec.clears=map(data.clears,v=>map(v,x=>x===true||undefined));
  rec.achievements=map(data.achievements,v=>typeof v==='string'?v:undefined);
  rec.icons=map(data.icons,v=>typeof v==='string'?v:undefined);
  if(data.skins&&Array.isArray(data.skins.owned))rec.skins.owned=[...new Set(['default',...data.skins.owned.filter(s=>typeof s==='string')])];
  if(typeof data.skins?.selected==='string'&&rec.skins.owned.includes(data.skins.selected))rec.skins.selected=data.skins.selected;
  return rec;
 }
 function read(){try{return clean(JSON.parse(root.localStorage?.getItem(storageKey)||'{}'))}catch(e){return blank()}}
 let rec=read(),run=null,listeners=[];
 const today=()=>{try{return new Date().toISOString().slice(0,10)}catch(e){return '1970-01-01'}};
 function save(){try{root.localStorage?.setItem(storageKey,JSON.stringify(rec));return true}catch(e){return false}}
 function emit(item){if(run)run.unlocked.push(item);for(const fn of listeners){try{fn(item)}catch(e){}}}

 function unlockAchievement(id){
  let a=achievementById[id];if(!a||rec.achievements[id])return false;
  rec.achievements[id]=today();emit({kind:'achievement',id,name:a.name,reward:a.reward});return true;
 }
 function evaluate(){for(const a of achievements)if(a.progress&&!rec.achievements[a.id]){let [cur,max]=a.progress(rec);if(cur>=max)unlockAchievement(a.id)}}
 function unlockIcon(iconId,name){if(rec.icons[iconId])return false;rec.icons[iconId]=today();emit({kind:'icon',id:iconId,name});return true}

 // 판 단위 추적
 function beginRun({difficulty=null,theme=null}={}){run={difficulty,theme,lowOnly:true,maxEnemies:0,supportUsed:false,unlocked:[],startAcquired:{...rec.acquired},startRec:JSON.parse(JSON.stringify(rec))}}
 function abandonRun(){if(run)save();run=null}
 function acquire(id,grade,name=id){
  if(!run||!id)return;
  rec.acquired[id]=(rec.acquired[id]||0)+1;
  let need=unitIconThresholds[grade];if(need&&rec.acquired[id]>=need)unlockIcon('unit:'+id,name);
  if(!lowGrades.includes(grade))run.lowOnly=false;
  if(grade==='레전더리')unlockAchievement('first-legend');
  if(specialGrades.includes(grade))unlockAchievement('forbidden');
  if(grade==='천체')unlockAchievement('star-caller');
  evaluate();
 }
 function trackEnemies(n){if(run&&n>run.maxEnemies)run.maxEnemies=n}
 function useSupport(){if(run)run.supportUsed=true}
 function waveStarted(wave,enemyCount){
  if(!run)return;
  if(enemyCount>=95)unlockAchievement('close-call');
  if(wave>=20&&run.lowOnly)unlockAchievement('bare-hands');
 }
 function kill(enemy,{gold=0,time=0}={}){
  if(!run||!enemy)return;
  rec.kills++;
  if(enemy.kind==='boss'&&enemy.bossId){
   rec.bossKills[enemy.bossId]=(rec.bossKills[enemy.bossId]||0)+1;
   if(rec.bossKills[enemy.bossId]>=bossIconThreshold)unlockIcon('boss:'+enemy.bossId,enemy.name||enemy.bossId);
   if(gold>=500)unlockAchievement('miser');
   if(Number.isFinite(enemy.spawnedAt)&&time-enemy.spawnedAt<=10)unlockAchievement('quick-kill');
   evaluate();save();
  }
 }
 function finishRun({won=false,theme}={}){
  if(!run)return null;
  if(theme!==undefined)run.theme=theme;
  rec.games++;
  if(won){
   rec.wins++;
   let d=difficultyIds.includes(run.difficulty)?run.difficulty:'normal';
   if(run.theme){rec.clears[d]=rec.clears[d]||{};rec.clears[d][run.theme]=true}
   unlockAchievement('clear-'+d);
   if(run.maxEnemies<=50)unlockAchievement('flawless');
   if(!run.supportUsed&&(d==='hard'||d==='extreme'))unlockAchievement('no-support');
  }
  evaluate();
  let summary={unlocked:run.unlocked.slice(),progress:runProgress(run)};
  save();run=null;return summary;
 }
 // 이번 판에서 진행이 오른 것 중 완료에 가까운 순서로 3개.
 function runProgress(r,limit=3){
  let items=[],nameOf=api.nameOf||(id=>id),gradeOf=api.gradeOf||(()=>null);
  for(const [id,after] of Object.entries(rec.acquired)){
   let before=r.startAcquired[id]||0,need=unitIconThresholds[gradeOf(id)];
   if(!need||after===before||before>=need||after>=need)continue;
   items.push({label:`${nameOf(id)} 아이콘`,before,after,max:need});
  }
  for(const a of achievements){
   if(!a.progress||a.hidden||rec.achievements[a.id])continue;
   let [before]=a.progress(r.startRec),[after,max]=a.progress(rec);
   if(after>before)items.push({label:a.name,before,after:Math.min(after,max),max});
  }
  return items.sort((x,y)=>y.after/y.max-x.after/x.max).slice(0,limit);
 }

 // 기존 난이도 최초 클리어 기록을 클리어 업적으로 옮긴다(보유 꾸미기는 progression.js가 별도로 유지).
 function migrateFirstClears(firstClears){
  let changed=false;
  for(const d of difficultyIds)if(firstClears?.[d]===true&&!rec.achievements['clear-'+d]){rec.achievements['clear-'+d]=today();changed=true}
  if(changed)save();return changed;
 }

 function hasAchievement(id){return !!rec.achievements[id]}
 function iconUnlocked(iconId){return !!rec.icons[iconId]}
 function achievementForReward(group,id){return achievements.find(a=>a.reward.some(([g,i])=>g===group&&i===id))||null}
 function achievementList(){return achievements.map(a=>{let done=!!rec.achievements[a.id],[cur,max]=a.progress?a.progress(rec):[done?1:0,1];return {id:a.id,group:a.group,name:a.hidden&&!done?'???':a.name,desc:a.hidden&&!done?'숨겨진 업적':a.desc,done,date:rec.achievements[a.id]||null,current:Math.min(cur,max),max,reward:a.reward}})}
 function unitIconProgress(id,grade){let need=unitIconThresholds[grade]||0;return {current:Math.min(rec.acquired[id]||0,need),max:need,unlocked:iconUnlocked('unit:'+id)}}
 function bossIconProgress(id){return {current:Math.min(rec.bossKills[id]||0,bossIconThreshold),max:bossIconThreshold,unlocked:iconUnlocked('boss:'+id)}}
 function onUnlock(fn){if(typeof fn==='function')listeners.push(fn)}
 function reload(){rec=read();run=null}

 const api={storageKey,unitIconThresholds,bossIconThreshold,achievements,
  get data(){return rec},get run(){return run},
  nameOf:null,gradeOf:null,
  beginRun,abandonRun,acquire,trackEnemies,useSupport,waveStarted,kill,finishRun,save,reload,
  migrateFirstClears,hasAchievement,iconUnlocked,achievementForReward,achievementList,unitIconProgress,bossIconProgress,onUnlock};
 return api;
});
