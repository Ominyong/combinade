'use strict';
// Shared permanent progression; game modes can apply these bonuses when integrated.
const progressionKey='defense-hub-progress-v1';
// ---- 계승의 나무: permanent upgrades bought with 균열의 파편, grouped into categories (tabs). ----
// Each node sits on a row (0 기초 · 1 심화 · 2 비전) and column (0–3) of its category board. `requires` lists
// [nodeId, level] pairs. Level n costs cost[0] + cost[1]*(n-1). `effect.key` is summed by treeBonus(key).
// preparation / income / power keep their old ids so upgrades bought before the tree grew stay owned.
const treeRows=['기초','심화','비전'];
const treeCategories={
 combat:{name:'전투',tags:'공격력 · 보스 · 원소',flavor:'균열을 막아 온 수호자들의 검술이 다음 세대로 이어집니다.',icon:'sword',color:'#ef8f6a'},
 economy:{name:'경제',tags:'골드 · 판매 · 파편',flavor:'전선을 지탱하는 것은 결국 보급입니다. 한 닢도 헛되이 쓰지 않습니다.',icon:'coins',color:'#f4d06f'},
 summon:{name:'소환',tags:'선택권 · 정예 · 소집',flavor:'균열 너머에서 더 강한 동료를 불러내는 계약을 맺습니다.',icon:'star',color:'#8bd4c6'},
 cards:{name:'카드',tags:'보상 카드 · 세트 · 해금',flavor:'보스를 쓰러뜨릴 때 얻는 카드를 넓히고, 더 좋은 패를 끌어옵니다.',icon:'cards',color:'#c79bff'},
 rift:{name:'균열',tags:'현상금 · 미션 · 지원',flavor:'균열을 오래 지켜 온 수호자만 아는 요령입니다. 사냥과 의뢰, 비상시의 대비를 익힙니다.',icon:'rift',color:'#e78fc8'}
};
const treeEffectText={
 power:v=>`모든 유닛 공격력 +${v}%`,physical:v=>`물리 유닛 공격력 +${v}%`,magic:v=>`마법 유닛 공격력 +${v}%`,boss:v=>`보스 대상 피해 +${v}%`,
 speed:v=>`공격속도 +${v}%`,burn:v=>`화상 피해 +${v}%`,slow:v=>`감속 효과 +${v}%`,armor:v=>`방어력 감소 효과 +${v}%`,resist:v=>`마법 저항력 감소 효과 +${v}%`,
 startGold:v=>`시작 골드 +${v}`,income:v=>`라운드 시작 골드 +${v}`,bossGold:v=>`보상 카드로 받는 골드 +${v}%`,sale:v=>`유닛 판매 가격 +${v}%`,convert:v=>`같은 등급 변환 비용 -${v}%`,
 killGold:v=>`일반 몬스터 처치 시 ${v}% 확률로 골드 +1`,shard:v=>`전투에서 얻는 파편 +${v}%`,
 ticketNormal:v=>`전투 시작 시 노말 선택권 +${v}장`,ticketMagic:v=>`전투 시작 시 매직 선택권 +${v}장`,elite:v=>`소환할 때 ${v}% 확률로 매직 유닛`,
 luck:v=>`희귀·전설 카드 등장 +${v}%`,cardChoice:v=>`보상 카드 선택지 +${v}장`,setSize:v=>`세트 효과에 필요한 카드 ${3-v}장`,
 huntCooldown:v=>`현상금 보스 재소환 시간 -${v}%`,huntTime:v=>`현상금 보스 제한 시간 +${v}초`,missionGold:v=>`미션 골드 보상 +${v}%`,support:v=>`긴급 지원 폭격·봉쇄 사용 횟수 +${v}`,upgradeDiscount:v=>`등급 강화 비용 -${v}%`,startCard:v=>v?'전투를 시작할 때 보상 카드 1장 선택':'효과 없음'
};
// Percent-type keys store whole percents; treeBonus() returns them as fractions.
const treePercentKeys=new Set(['power','physical','magic','boss','speed','burn','slow','armor','resist','bossGold','sale','convert','killGold','shard','elite','luck','huntCooldown','missionGold','upgradeDiscount']);
const treeNodes={
 // 전투
 power:{cat:'combat',row:0,col:0,name:'수호의 결의',sub:'모든 유닛',icon:'sword',max:10,cost:[1,1],effect:{key:'power',per:2},description:'선대 수호자의 각오를 이어받아 모든 유닛이 더 세게 공격합니다.'},
 physicalArt:{cat:'combat',row:0,col:1,name:'물리 단련',sub:'물리 유닛',icon:'fist',max:5,cost:[2,1],effect:{key:'physical',per:3},requires:[['power',1]],description:'칼날과 주먹을 쓰는 유닛의 기본기를 다집니다.'},
 magicArt:{cat:'combat',row:0,col:2,name:'마력 단련',sub:'마법 유닛',icon:'orb',max:5,cost:[2,1],effect:{key:'magic',per:3},requires:[['power',1]],description:'마법을 쓰는 유닛이 마력을 더 깊이 끌어냅니다.'},
 bossHunt:{cat:'combat',row:1,col:1,name:'보스 사냥술',sub:'보스 대상',icon:'crown',max:5,cost:[3,1],effect:{key:'boss',per:4},requires:[['physicalArt',2]],description:'거대한 적의 약점을 노리는 법을 익힙니다.'},
 swift:{cat:'combat',row:1,col:2,name:'신속',sub:'공격속도',icon:'bolt',max:5,cost:[3,1],effect:{key:'speed',per:2},requires:[['magicArt',2]],description:'모든 유닛의 손놀림이 빨라집니다.'},
 flame:{cat:'combat',row:1,col:3,name:'화염 숙련',sub:'화상',icon:'flame',max:3,cost:[3,2],effect:{key:'burn',per:6},requires:[['magicArt',2]],description:'화상이 더 뜨겁게 타오릅니다.'},
 frost:{cat:'combat',row:1,col:0,name:'빙결 숙련',sub:'감속',icon:'snow',max:3,cost:[3,2],effect:{key:'slow',per:5},requires:[['physicalArt',2]],description:'감속 효과가 더 강하게 걸립니다.'},
 armorBreak:{cat:'combat',row:2,col:1,name:'갑옷 분쇄',sub:'방어력 감소',icon:'shieldBreak',max:3,cost:[5,2],effect:{key:'armor',per:5},requires:[['bossHunt',2]],description:'방어력을 깎는 효과가 더 커집니다.'},
 wardBreak:{cat:'combat',row:2,col:2,name:'마력 분쇄',sub:'마법 저항 감소',icon:'eye',max:3,cost:[5,2],effect:{key:'resist',per:5},requires:[['swift',2]],description:'마법 저항을 깎는 효과가 더 커집니다.'},
 warcryCard:{cat:'combat',row:2,col:3,name:'함성의 기록',sub:'카드 해금',icon:'card',max:1,cost:[8,0],effect:{key:'card',card:'warcry'},requires:[['swift',1]],description:'보상 카드 「함성」이 카드 풀에 들어갑니다.'},
 // 경제
 preparation:{cat:'economy',row:0,col:0,name:'보급 준비',sub:'시작 골드',icon:'bag',max:5,cost:[1,1],effect:{key:'startGold',per:10},description:'전투를 시작할 때 쓸 군자금을 넉넉히 챙깁니다.'},
 income:{cat:'economy',row:0,col:1,name:'전선 보급',sub:'라운드 골드',icon:'coin',max:5,cost:[1,1],effect:{key:'income',per:1},requires:[['preparation',1]],description:'라운드가 시작될 때마다 보급이 조금 더 들어옵니다.'},
 spoils:{cat:'economy',row:0,col:2,name:'전리품',sub:'카드 골드',icon:'coins',max:5,cost:[2,1],effect:{key:'bossGold',per:10},requires:[['income',2]],description:'골드 보상 카드에서 받는 골드가 늘어납니다.'},
 haggle:{cat:'economy',row:1,col:0,name:'흥정',sub:'판매 가격',icon:'scale',max:3,cost:[2,1],effect:{key:'sale',per:10},requires:[['preparation',2]],description:'유닛을 팔 때 값을 더 받습니다.'},
 pickup:{cat:'economy',row:1,col:1,name:'잔돈 줍기',sub:'처치 골드',icon:'coin',max:5,cost:[2,1],effect:{key:'killGold',per:3},requires:[['income',1]],description:'쓰러진 적이 흘린 동전을 주워 담습니다.'},
 resonance:{cat:'economy',row:1,col:3,name:'파편 감응',sub:'파편 획득',icon:'shard',max:5,cost:[4,2],effect:{key:'shard',per:10},requires:[['spoils',1]],description:'전투가 끝날 때 얻는 균열의 파편이 늘어납니다.'},
 alchemy:{cat:'economy',row:2,col:0,name:'변환 숙련',sub:'변환 비용',icon:'swap',max:3,cost:[3,2],effect:{key:'convert',per:10},requires:[['haggle',2]],description:'같은 등급 변환에 드는 골드가 줄어듭니다.'},
 treasuryCard:{cat:'economy',row:2,col:2,name:'금고 열쇠',sub:'카드 해금',icon:'card',max:1,cost:[10,0],effect:{key:'card',card:'treasury'},requires:[['spoils',3]],description:'보상 카드 「대군자금」이 카드 풀에 들어갑니다.'},
 // 소환
 roster:{cat:'summon',row:0,col:0,name:'징집 명부',sub:'노말 선택권',icon:'ticket',max:3,cost:[2,2],effect:{key:'ticketNormal',per:1},description:'전투를 시작할 때 원하는 노말 유닛을 고를 수 있습니다.'},
 bloodline:{cat:'summon',row:0,col:1,name:'정예 혈통',sub:'매직 소환',icon:'star',max:5,cost:[2,1],effect:{key:'elite',per:2},requires:[['roster',1]],description:'소환할 때 가끔 매직 유닛이 나옵니다.'},
 pact:{cat:'summon',row:1,col:1,name:'마력 계약',sub:'매직 선택권',icon:'gem',max:2,cost:[5,3],effect:{key:'ticketMagic',per:1},requires:[['bloodline',2]],description:'전투를 시작할 때 원하는 매직 유닛을 고를 수 있습니다.'},
 archmageCard:{cat:'summon',row:1,col:2,name:'대마력 문서',sub:'카드 해금',icon:'card',max:1,cost:[6,0],effect:{key:'card',card:'archmage'},requires:[['bloodline',1]],description:'보상 카드 「대마력 소집」이 카드 풀에 들어갑니다.'},
 heroCard:{cat:'summon',row:2,col:1,name:'영웅의 맹약',sub:'카드 해금',icon:'card',max:1,cost:[12,0],effect:{key:'card',card:'herocall'},requires:[['pact',1]],description:'보상 카드 「영웅 소집」이 카드 풀에 들어갑니다.'},
 // 카드
 luck:{cat:'cards',row:0,col:0,name:'행운의 손',sub:'희귀·전설',icon:'clover',max:4,cost:[2,2],effect:{key:'luck',per:15},description:'보상 카드에서 희귀·전설 카드가 더 자주 나옵니다.'},
 insight:{cat:'cards',row:0,col:2,name:'넓은 시야',sub:'선택지',icon:'eye',max:1,cost:[10,0],effect:{key:'cardChoice',per:1},requires:[['luck',2]],description:'보스 보상 카드를 한 장 더 보고 고릅니다.'},
 setMastery:{cat:'cards',row:2,col:1,name:'세트 숙련',sub:'세트 효과',icon:'cards',max:1,cost:[15,0],effect:{key:'setSize',per:1},requires:[['insight',1]],description:'같은 계열 카드를 2장만 모아도 세트 효과가 켜집니다.'},
 // 균열 (2차 확장)
 tracking:{cat:'rift',row:0,col:0,name:'추적술',sub:'재소환 시간',icon:'eye',max:5,cost:[2,1],effect:{key:'huntCooldown',per:8},description:'현상금 보스의 흔적을 빨리 찾아 더 자주 불러낼 수 있습니다.'},
 snare:{cat:'rift',row:0,col:1,name:'덫 놓기',sub:'제한 시간',icon:'hourglass',max:3,cost:[3,2],effect:{key:'huntTime',per:4},requires:[['tracking',1]],description:'현상금 보스가 도망치기까지 시간이 늘어납니다.'},
 commission:{cat:'rift',row:0,col:2,name:'의뢰 수수료',sub:'미션 골드',icon:'flag',max:3,cost:[2,1],effect:{key:'missionGold',per:20},description:'미션을 달성할 때 받는 골드가 늘어납니다.'},
 reserves:{cat:'rift',row:1,col:0,name:'비상 물자',sub:'긴급 지원',icon:'bag',max:2,cost:[4,3],effect:{key:'support',per:1},requires:[['tracking',2]],description:'긴급 지원의 균열 폭격과 봉쇄를 판마다 한 번씩 더 쓸 수 있습니다.'},
 forgeFriend:{cat:'rift',row:1,col:2,name:'대장간 단골',sub:'강화 비용',icon:'sword',max:5,cost:[2,1],effect:{key:'upgradeDiscount',per:6},requires:[['commission',1]],description:'등급 강화에 드는 골드가 줄어듭니다.'},
 heirloom:{cat:'rift',row:2,col:1,name:'선대의 유품',sub:'시작 카드',icon:'card',max:1,cost:[15,0],effect:{key:'startCard',per:1},requires:[['reserves',1],['forgeFriend',2]],description:'전투를 시작할 때 보상 카드 한 장을 먼저 고르고 들어갑니다.'}
};
function treeCost(id,level=progression.levels[id]||0){let n=treeNodes[id];return n.cost[0]+n.cost[1]*level}
function treeRequirementsMet(id,levels=progression.levels){return (treeNodes[id].requires||[]).every(([req,lv])=>(levels[req]||0)>=lv)}
function treeCanBuy(id){let n=treeNodes[id],lv=progression.levels[id]||0;return !!n&&lv<n.max&&treeRequirementsMet(id)&&progression.shards>=treeCost(id)}
// Sum of a bonus over learned nodes; percents come back as fractions (6 → .06).
function treeBonus(key,levels=progression.levels){let sum=0;for(const [id,n] of Object.entries(treeNodes))if(n.effect.key===key)sum+=(n.effect.per||0)*(levels[id]||0);return treePercentKeys.has(key)?sum/100:sum}
function treeCardUnlocks(levels=progression.levels){return Object.entries(treeNodes).filter(([id,n])=>n.effect.key==='card'&&(levels[id]||0)>0).map(([,n])=>n.effect.card)}
function treeEffectLine(id,level){let n=treeNodes[id],e=n.effect;if(e.key==='card'){let c=globalThis.ManmulCards?.cards[e.card];return c?`보상 카드 「${c.name}」 해금`:'보상 카드 해금'}return treeEffectText[e.key]((e.per||0)*level)}
const progressionSkills=treeNodes;
function readProgression(){try{let data=JSON.parse(localStorage.getItem(progressionKey)||'{}'),levels={};for(const [id,node] of Object.entries(treeNodes))levels[id]=Math.max(0,Math.min(node.max,Number.isInteger(data.levels?.[id])?data.levels[id]:0));return {shards:Math.max(0,Number.isInteger(data.shards)?data.shards:0),xp:Math.max(0,Number.isInteger(data.xp)?data.xp:0),rift:{unlocked:Math.max(0,Math.min(10,Number.isInteger(data.rift?.unlocked)?data.rift.unlocked:0)),best:Math.max(0,Math.min(10,Number.isInteger(data.rift?.best)?data.rift.best:0))},levels}}catch(e){return {shards:0,levels:Object.fromEntries(Object.keys(treeNodes).map(id=>[id,0]))}}}
let progression=readProgression();
function saveProgression(next){try{localStorage.setItem(progressionKey,JSON.stringify(next));progression=next;return true}catch(e){return false}}
function purchaseProgression(id){if(!treeNodes[id]||!treeCanBuy(id))return false;let level=progression.levels[id]||0;return saveProgression({...progression,shards:progression.shards-treeCost(id),levels:{...progression.levels,[id]:level+1}})}
function grantClearShards(amount=3){return saveProgression({...progression,shards:progression.shards+amount,levels:{...progression.levels}})}
// ---- 수호자 레벨: account XP from every run (rounds, missions, bounty kills). Every level pays shards. ----
const guardianRules={base:120,step:40,shardsPerLevel:3,difficulty:{easy:1,normal:1.3,hard:1.7,extreme:2.2}};
function guardianLevel(xp=progression.xp||0){let level=1,need=guardianRules.base;while(xp>=need){xp-=need;level++;need=guardianRules.base+guardianRules.step*(level-1)}return {level,into:xp,need}}
function runXp({difficultyId='normal',rounds=0,won=false,missions=0,hunts=0}={}){return Math.round(rounds*2*(guardianRules.difficulty[difficultyId]??1)+(won?50:0)+missions*6+hunts*4)}
function grantRunXp(amount){let before=guardianLevel().level,xp=(progression.xp||0)+Math.max(0,amount),after=guardianLevel(xp).level,levels=after-before,shards=levels*guardianRules.shardsPerLevel;let saved=saveProgression({...progression,xp,shards:progression.shards+shards,levels:{...progression.levels}});return {saved,xp:amount,level:after,levelsUp:levels,shards}}

// Clear rewards: shards scale with difficulty. Cosmetics come from records.js achievements and collection,
// not from first clears. `unlock` is kept only so cosmetics earned under the old first-clear rule stay owned.
const clearShardRewards={easy:2,normal:3,hard:5,extreme:8};
// Every 10 rounds survived also pays shards, so a run that falls short of the end still earns something.
const roundShardRewards={easy:1,normal:1,hard:2,extreme:2};
function runShardReward(difficultyId,roundsCleared,won){let per=roundShardRewards[difficultyId]??1,rounds=Math.floor(Math.max(0,roundsCleared||0)/10)*per,clear=won?(clearShardRewards[difficultyId]??3):0,base=rounds+clear,bonus=Math.floor(base*treeBonus('shard'));return {rounds,clear,bonus,total:base+bonus}}
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
  alone:{name:'홀로 선 자'},
  'box-hunter':{name:'상자 사냥꾼',box:true},
  'shard-smith':{name:'조각 장인',box:true},
  'star-keeper':{name:'별을 모으는 자',box:true}
 },
 icons:{
  basic:{name:'기본 문장',symbol:'◆',color:'#a8d8ae'},
  sprout:{name:'새싹 문장',symbol:'✧',color:'#9fe0a6',unlock:'easy'},
  shield:{name:'방패 문장',symbol:'◈',color:'#8fc1e8',unlock:'normal'},
  blade:{name:'검 문장',symbol:'⚔',color:'#f0a46c',unlock:'hard'},
  crown:{name:'왕관 문장',symbol:'♛',color:'#f4d06f',unlock:'extreme'},
  'star-crest':{name:'별 문장',symbol:'★',color:'#ffe08a',box:true},
  'box-crest':{name:'상자 문장',symbol:'▣',color:'#c9a75c',box:true}
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
  flawless:{name:'무결 이름표'},
  starry:{name:'별무늬 이름표',box:true},
  treasure:{name:'보물 상자 이름표',box:true}
 }
};
const mapSkins={forest:'고대 유적 숲',snow:'설원 유적',desert:'사막 신전',lava:'용암 균열',sky:'천공 성역',mushroom:'달빛 버섯 숲',cherry:'벚꽃 정원',library:'침수된 도서관',clockwork:'태엽 공방',deepsea:'심해 유적',candy:'과자 왕국',stars:'별빛 관측소',amusement:'폐허가 된 놀이공원'};
// 전장 스킨 해금: 숲만 처음부터 열려 있고, 네 스킨은 난이도 첫 클리어, 나머지는 조각 상자에서 얻는다.
const mapSkinUnlock={forest:{free:true},snow:{clear:'easy'},desert:{clear:'normal'},lava:{clear:'hard'},sky:{clear:'extreme'}};
function mapSkinUnlocked(id,firstClears=playerProfile?.firstClears||{}){if(!Object.hasOwn(mapSkins,id))return false;let rule=mapSkinUnlock[id];if(rule?.free)return true;if(rule?.clear)return firstClears[rule.clear]===true;return typeof boxCosmeticOwned==='function'&&boxCosmeticOwned('maps',id)}
function mapSkinLockText(id){let rule=mapSkinUnlock[id];if(rule?.clear)return `${({easy:'입문',normal:'일반',hard:'상급',extreme:'극한'})[rule.clear]} 첫 클리어`;return '조각 상자에서 획득'}
const profileDefaults={name:'수호자',title:'rookie',icon:'basic',plate:'basic',mapSkin:'forest',firstClears:{}};
const cosmeticSlots=[['title','titles'],['icon','icons'],['plate','plates']];
// Icons also include collected unit sprites ("unit:N001") and boss portraits ("boss:steel-x").
function collectionIcon(id){return typeof id==='string'&&/^(unit|boss):[A-Za-z0-9-]+$/.test(id)}
function cosmeticExists(group,id){return typeof id==='string'&&(Object.hasOwn(profileCosmetics[group]||{},id)||(group==='icons'&&collectionIcon(id)))}
function cosmeticUnlocked(group,id,firstClears=playerProfile.firstClears){
 if(group==='icons'&&collectionIcon(id))return !!globalThis.ManmulRecords?.iconUnlocked(id);
 let item=profileCosmetics[group]?.[id];if(!item)return false;if(item.box)return typeof boxCosmeticOwned==='function'&&boxCosmeticOwned(group,id);
 let achievement=globalThis.ManmulRecords?.achievementForReward(group,id);
 if(!achievement&&!item.unlock)return true;
 return !!(achievement&&globalThis.ManmulRecords.hasAchievement(achievement.id))||!!(item.unlock&&firstClears[item.unlock]===true);
}
function readProfile(){try{let data=JSON.parse(localStorage.getItem(profileKey)||'{}'),firstClears={};for(const id of Object.keys(clearShardRewards))if(data.firstClears?.[id]===true)firstClears[id]=true;let profile={...profileDefaults,firstClears};if(typeof data.name==='string'&&data.name.trim())profile.name=data.name.trim().slice(0,12);if(typeof data.mapSkin==='string'&&mapSkinUnlocked(data.mapSkin,firstClears))profile.mapSkin=data.mapSkin;for(const [slot,group] of cosmeticSlots)if(cosmeticExists(group,data[slot])&&cosmeticUnlocked(group,data[slot],firstClears))profile[slot]=data[slot];return profile}catch(e){return {...profileDefaults,firstClears:{}}}}
let playerProfile=readProfile();
globalThis.ManmulRecords?.migrateFirstClears(playerProfile.firstClears);
function saveProfile(next){try{localStorage.setItem(profileKey,JSON.stringify(next));playerProfile=next;return true}catch(e){return false}}
function updateProfile(changes){let next={...playerProfile,firstClears:{...playerProfile.firstClears}};if(typeof changes.name==='string'){let name=changes.name.trim().slice(0,12);next.name=name||profileDefaults.name}if(changes.mapSkin!==undefined){if(typeof changes.mapSkin!=='string'||!mapSkinUnlocked(changes.mapSkin))return false;next.mapSkin=changes.mapSkin}for(const [slot,group] of cosmeticSlots)if(changes[slot]!==undefined){if(!cosmeticExists(group,changes[slot])||!cosmeticUnlocked(group,changes[slot]))return false;next[slot]=changes[slot]}return saveProfile(next)}
// Returns what was granted so the result screen can show it; saved=false means browser storage failed.
// firstClears is still recorded for the lobby record, but it no longer unlocks cosmetics.
function grantClearRewards(difficultyId,roundsCleared=0,won=true){let parts=runShardReward(difficultyId,roundsCleared,won),shards=parts.total,saved=shards>0?grantClearShards(shards):true;if(!won)return {saved,shards,parts};if(saved&&Object.hasOwn(clearShardRewards,difficultyId)&&!playerProfile.firstClears[difficultyId])saved=saveProfile({...playerProfile,firstClears:{...playerProfile.firstClears,[difficultyId]:true}});return {saved,shards,parts}}
