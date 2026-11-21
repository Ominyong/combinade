'use strict';
// 무한 균열: a single-player mode with no last round. It follows the 일반 curve up to floor 60, then every floor adds
// a fixed percentage of health (compounding), so every lineup meets its limit somewhere. It grants no 균열의 파편,
// no unit-shard boxes and no guardian XP; the only reward is a place on the ranking (floor, play time) shown on the
// title screen. The ranking is kept in this browser (top 10).
const endlessRules={from:60,growth:.06,keep:10,key:'endless-ranking-v1'};
function isEndlessRun(){return !!selectedDifficulty?.endless}
// Health factor on top of the normal formula, which is evaluated at min(floor, from).
function endlessHpWave(w){return selectedDifficulty?.endless?Math.min(w,endlessRules.from):w}
function endlessHpFactor(w){return selectedDifficulty?.endless?Math.pow(1+endlessRules.growth,Math.max(0,w-endlessRules.from)):1}
function endlessRanking(){try{let list=JSON.parse(localStorage.getItem(endlessRules.key)||'[]');return Array.isArray(list)?list.filter(r=>r&&Number.isInteger(r.floor)&&Number.isFinite(r.time)):[]}catch(e){return []}}
function endlessSort(list){return list.sort((a,b)=>b.floor-a.floor||a.time-b.time||a.at-b.at)}
// Adds this run; returns its place (1-based) or 0 when it did not make the list.
function endlessRecord(floor,time,name){let entry={floor,time:Math.round(time),name:String(name||'수호자').slice(0,12),at:Date.now()},list=endlessSort([...endlessRanking(),entry]).slice(0,endlessRules.keep),rank=list.indexOf(entry)+1;try{localStorage.setItem(endlessRules.key,JSON.stringify(list))}catch(e){return 0}return rank}
function endlessTimeText(sec){sec=Math.max(0,Math.round(sec||0));let h=Math.floor(sec/3600),m=Math.floor(sec%3600/60),s=sec%60,pad=n=>String(n).padStart(2,'0');return h?`${h}:${pad(m)}:${pad(s)}`:`${m}:${pad(s)}`}
function endlessEsc(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function endlessRankingHtml(limit=5){let list=endlessRanking().slice(0,limit);
 return `<div class="hub-ranking-head"><span>무한 균열 랭킹</span><small>층수 · 플레이 시간</small></div>${list.length?`<ol class="hub-ranking-list">${list.map((r,i)=>`<li class="${i===0?'is-top':''}"><b>${i+1}</b><strong>${r.floor}층</strong><span>${endlessEsc(r.name)}</span><small>${endlessTimeText(r.time)}</small></li>`).join('')}</ol>`:'<p class="hub-ranking-empty">아직 기록이 없습니다. 싱글 플레이 → 무한 균열에서 도전해 보세요.</p>'}`}
function renderEndlessRanking(){let box=typeof document!=='undefined'?document.querySelector('#hubRanking'):null;if(box)box.innerHTML=endlessRankingHtml()}
// Result text for a finished endless run (used in place of the shard reward line).
function endlessResultText(){let floor=Math.max(1,wave),time=combatTime,rank=testRun?0:endlessRecord(floor,time,playerProfile?.name);renderEndlessRanking();
 return `무한 균열 기록: <b>${floor}층</b> · 플레이 시간 ${endlessTimeText(time)}${rank?` · <b class="rift-opened">랭킹 ${rank}위</b>`:' · 랭킹 10위 밖'}<br><small>무한 균열에서는 파편·조각 상자·수호자 경험치를 얻지 않습니다.</small>`}
function endlessFloorText(){return `${wave}층`}
globalThis.endlessRules=endlessRules;
