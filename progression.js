'use strict';
// Shared permanent progression; game modes can apply these bonuses when integrated.
const progressionKey='defense-hub-progress-v1';
const progressionSkills={preparation:{name:'보급 준비',description:'시작 골드 +10',max:3,costs:[1,2,3]},income:{name:'전선 보급',description:'라운드 시작 골드 +1',max:3,costs:[1,2,3],requires:'preparation'},power:{name:'수호의 결의',description:'아군 공격력 +2%',max:3,costs:[1,2,3],requires:'income'}};
function readProgression(){try{let data=JSON.parse(localStorage.getItem(progressionKey)||'{}'),levels={};for(const [id,skill] of Object.entries(progressionSkills))levels[id]=Math.max(0,Math.min(skill.max,Number.isInteger(data.levels?.[id])?data.levels[id]:0));return {shards:Math.max(0,Number.isInteger(data.shards)?data.shards:0),levels}}catch(e){return {shards:0,levels:{preparation:0,income:0,power:0}}}}
let progression=readProgression();
function saveProgression(next){try{localStorage.setItem(progressionKey,JSON.stringify(next));progression=next;return true}catch(e){return false}}
function purchaseProgression(id){let skill=progressionSkills[id];if(!skill)return false;let level=progression.levels[id];if(level>=skill.max||(skill.requires&&!progression.levels[skill.requires])||progression.shards<skill.costs[level])return false;let next={shards:progression.shards-skill.costs[level],levels:{...progression.levels,[id]:level+1}};return saveProgression(next)}
function grantClearShards(amount=3){return saveProgression({shards:progression.shards+amount,levels:{...progression.levels}})}

// Clear rewards: shards scale with difficulty. Cosmetics come from records.js achievements and collection,
// not from first clears. `unlock` is kept only so cosmetics earned under the old first-clear rule stay owned.
const clearShardRewards={easy:2,normal:3,hard:5,extreme:8};
const profileKey='defense-hub-profile-v1';
const profileCosmetics={
 titles:{
  rookie:{name:'신입 수호자'},
  easy:{name:'균열 입문자',unlock:'easy'},
  normal:{name:'균열 수호자',unlock:'normal'},
  hard:{name:'균열 토벌자',unlock:'hard'},
  extreme:{name:'균열의 종결자',unlock:'extreme'},
  regular:{name:'균열의 단골'},
  hunter:{name:'균열 사냥꾼'},
  'boss-hunter':{name:'보스 사냥꾼'},
  collector:{name:'수집가'},
  'rift-closer':{name:'균열을 닫은 자'},
  'steel-breaker':{name:'강철 분쇄자'},
  'veil-breaker':{name:'장막 파괴자'},
  'ankle-hunter':{name:'발목 사냥꾼'},
  woodcutter:{name:'고목 벌목꾼'},
  'legend-start':{name:'전설의 시작'},
  'star-caller':{name:'별을 부른 자'},
  'bare-hands':{name:'맨주먹 수호자'},
  miser:{name:'구두쇠'},
  'close-call':{name:'아슬아슬'},
  'one-strike':{name:'일격'},
  alone:{name:'홀로 선 자'}
 },
 icons:{
  basic:{name:'기본 문장',symbol:'◆',color:'#a8d8ae'},
  sprout:{name:'새싹 문장',symbol:'✧',color:'#9fe0a6',unlock:'easy'},
  shield:{name:'방패 문장',symbol:'◈',color:'#8fc1e8',unlock:'normal'},
  blade:{name:'검 문장',symbol:'⚔',color:'#f0a46c',unlock:'hard'},
  crown:{name:'왕관 문장',symbol:'♛',color:'#f4d06f',unlock:'extreme'}
 },
 plates:{
  basic:{name:'기본 이름표'},
  moss:{name:'이끼 이름표',unlock:'easy'},
  bronze:{name:'청동 이름표',unlock:'normal'},
  silver:{name:'은빛 이름표',unlock:'hard'},
  gold:{name:'황금 이름표',unlock:'extreme'},
  banner:{name:'낡은 전투 깃발'},
  blood:{name:'핏빛 이름표'},
  codex:{name:'도감 장정 이름표'},
  rift:{name:'균열 문양 이름표'},
  flawless:{name:'무결 이름표'}
 }
};
const mapSkins={forest:'고대 유적 숲',snow:'설원 유적',desert:'사막 신전',lava:'용암 균열',sky:'천공 성역',mushroom:'달빛 버섯 숲',cherry:'벚꽃 정원',library:'침수된 도서관',clockwork:'태엽 공방',deepsea:'심해 유적',candy:'과자 왕국',stars:'별빛 관측소',amusement:'폐허가 된 놀이공원'};
const profileDefaults={name:'수호자',title:'rookie',icon:'basic',plate:'basic',mapSkin:'forest',firstClears:{}};
const cosmeticSlots=[['title','titles'],['icon','icons'],['plate','plates']];
// Icons also include collected unit sprites ("unit:N001") and boss portraits ("boss:steel-x").
function collectionIcon(id){return typeof id==='string'&&/^(unit|boss):[A-Za-z0-9-]+$/.test(id)}
function cosmeticExists(group,id){return typeof id==='string'&&(Object.hasOwn(profileCosmetics[group]||{},id)||(group==='icons'&&collectionIcon(id)))}
function cosmeticUnlocked(group,id,firstClears=playerProfile.firstClears){
 if(group==='icons'&&collectionIcon(id))return !!globalThis.ManmulRecords?.iconUnlocked(id);
 let item=profileCosmetics[group]?.[id];if(!item)return false;
 let achievement=globalThis.ManmulRecords?.achievementForReward(group,id);
 if(!achievement&&!item.unlock)return true;
 return !!(achievement&&globalThis.ManmulRecords.hasAchievement(achievement.id))||!!(item.unlock&&firstClears[item.unlock]===true);
}
function readProfile(){try{let data=JSON.parse(localStorage.getItem(profileKey)||'{}'),firstClears={};for(const id of Object.keys(clearShardRewards))if(data.firstClears?.[id]===true)firstClears[id]=true;let profile={...profileDefaults,firstClears};if(typeof data.name==='string'&&data.name.trim())profile.name=data.name.trim().slice(0,12);if(typeof data.mapSkin==='string'&&Object.hasOwn(mapSkins,data.mapSkin))profile.mapSkin=data.mapSkin;for(const [slot,group] of cosmeticSlots)if(cosmeticExists(group,data[slot])&&cosmeticUnlocked(group,data[slot],firstClears))profile[slot]=data[slot];return profile}catch(e){return {...profileDefaults,firstClears:{}}}}
let playerProfile=readProfile();
globalThis.ManmulRecords?.migrateFirstClears(playerProfile.firstClears);
function saveProfile(next){try{localStorage.setItem(profileKey,JSON.stringify(next));playerProfile=next;return true}catch(e){return false}}
function updateProfile(changes){let next={...playerProfile,firstClears:{...playerProfile.firstClears}};if(typeof changes.name==='string'){let name=changes.name.trim().slice(0,12);next.name=name||profileDefaults.name}if(changes.mapSkin!==undefined){if(typeof changes.mapSkin!=='string'||!Object.hasOwn(mapSkins,changes.mapSkin))return false;next.mapSkin=changes.mapSkin}for(const [slot,group] of cosmeticSlots)if(changes[slot]!==undefined){if(!cosmeticExists(group,changes[slot])||!cosmeticUnlocked(group,changes[slot]))return false;next[slot]=changes[slot]}return saveProfile(next)}
// Returns what was granted so the result screen can show it; saved=false means browser storage failed.
// firstClears is still recorded for the lobby record, but it no longer unlocks cosmetics.
function grantClearRewards(difficultyId){let shards=clearShardRewards[difficultyId]??3,saved=grantClearShards(shards);if(saved&&Object.hasOwn(clearShardRewards,difficultyId)&&!playerProfile.firstClears[difficultyId])saved=saveProfile({...playerProfile,firstClears:{...playerProfile.firstClears,[difficultyId]:true}});return {saved,shards}}
