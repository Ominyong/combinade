'use strict';
// 유닛 성급: every unit type collects shards across runs. Enough shards raise its star level (0–5); each star gives
// +1% attack, so a fully starred unit is only 5% stronger (keeps the gap between new and veteran players small).
// 3 stars adds a twinkle under the unit, 5 stars a gold ring.
// Shards come from 조각 상자 that monsters drop during a run (at most 5 per run). Boxes are opened when the run ends,
// win or lose (not in test mode). The box grade is how big the reward is (like card chests): a higher box holds more
// shards, split into more stacks, each stack going to a random unit from the whole roster. Boxes sometimes also hold a
// cosmetic or a 전장 스킨 that can only be found in boxes.
// Loaded before progression.js (cosmetic unlock checks read it); game globals are only read inside functions.
const starKey='combinade-stars-v1';
const starRules={need:[4,8,12,16,20],bonusPerStar:.01,max:5,sparkleAt:3,goldAt:5,maxBoxesPerRun:5};
// Box grade → total shards and how many random units (stacks) share them. Higher boxes: more of both.
const boxGrades=['노말','매직','레어','에픽','유니크','레전더리'];
const boxDefs={'노말':{shards:12,units:2,color:'#c9d2cc',cosmetic:.04},'매직':{shards:24,units:3,color:'#7fd18b',cosmetic:.06},'레어':{shards:40,units:4,color:'#6fb2ff',cosmetic:.09},'에픽':{shards:65,units:5,color:'#c38dff',cosmetic:.13},'유니크':{shards:100,units:6,color:'#ffcf5a',cosmetic:.18},'레전더리':{shards:150,units:8,color:'#ff8c5a',cosmetic:.25}};
// Cosmetics that only come out of boxes: [group, id, name]. progression.js adds them to profileCosmetics.
const boxCosmetics=[['maps','mushroom','전장 스킨 · 달빛 버섯 숲'],['maps','cherry','전장 스킨 · 벚꽃 정원'],['maps','library','전장 스킨 · 침수된 도서관'],['maps','clockwork','전장 스킨 · 태엽 공방'],['maps','deepsea','전장 스킨 · 심해 유적'],['maps','candy','전장 스킨 · 과자 왕국'],['maps','stars','전장 스킨 · 별빛 관측소'],['maps','amusement','전장 스킨 · 폐허가 된 놀이공원'],['titles','box-hunter','상자 사냥꾼'],['titles','shard-smith','조각 장인'],['titles','star-keeper','별을 모으는 자'],['plates','starry','별무늬 이름표'],['plates','treasure','보물 상자 이름표'],['icons','star-crest','별 문장'],['icons','box-crest','상자 문장']];
function readStars(){try{let d=JSON.parse(localStorage.getItem(starKey)||'{}');return {shards:d.shards&&typeof d.shards==='object'?d.shards:{},cosmetics:Array.isArray(d.cosmetics)?d.cosmetics.filter(x=>typeof x==='string'):[],opened:Number.isInteger(d.opened)?d.opened:0}}catch(e){return {shards:{},cosmetics:[],opened:0}}}
let starData=readStars();
function saveStars(){try{localStorage.setItem(starKey,JSON.stringify(starData));return true}catch(e){return false}}
function starsFor(shards){let stars=0,left=shards;for(const need of starRules.need){if(left<need)break;left-=need;stars++}return stars}
function unitStars(id){return starsFor(starData.shards[id]||0)}
// Shards toward the next star: {stars, have, need} (need 0 at max).
function starProgress(id){let total=starData.shards[id]||0,stars=0,left=total;for(const need of starRules.need){if(left<need)return {stars,have:left,need};left-=need;stars++}return {stars,have:0,need:0}}
function starBonus(id){return unitStars(id)*starRules.bonusPerStar}
function starText(stars){return '★'.repeat(stars)+'☆'.repeat(starRules.max-stars)}
function boxCosmeticOwned(group,id){return starData.cosmetics.includes(group+':'+id)}
function boxUnitPool(){return (globalThis.ManmulRosterData?.units||[]).map(u=>u.id)}
// Open one box: pick distinct random units from the whole roster and split the shards into uneven stacks
// (one bigger stack, the rest smaller), like a card chest.
function openBox(grade,usedTypes=[],random=Math.random){let def=boxDefs[grade];if(!def)return null;let pool=boxUnitPool();if(!pool.length)return null;let picks=[];
 while(picks.length<Math.min(def.units,pool.length)){let id=pool[Math.floor(random()*pool.length)];if(!picks.includes(id))picks.push(id)}
 let weights=picks.map((_,i)=>i===0?2:1+random()),sum=weights.reduce((a,b)=>a+b,0),sizes=weights.map(w=>Math.max(1,Math.floor(def.shards*w/sum)));sizes[0]+=def.shards-sizes.reduce((a,b)=>a+b,0);
 let gains=picks.map((id,i)=>{let before=unitStars(id),n=sizes[i];starData.shards[id]=(starData.shards[id]||0)+n;return {id,n,before,after:unitStars(id)}}).sort((a,b)=>b.n-a.n);
 let cosmetic=null,left=boxCosmetics.filter(([g,id])=>!boxCosmeticOwned(g,id));if(left.length&&random()<def.cosmetic){let [group,id,name]=left[Math.floor(random()*left.length)];starData.cosmetics.push(group+':'+id);cosmetic={group,id,name}}
 starData.opened++;saveStars();return {grade,gains,cosmetic}}
