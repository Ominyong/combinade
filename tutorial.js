'use strict';
// 초보자 안내: 처음 겪는 상황마다 한 번씩 짧은 안내 카드를 띄운다. 전투를 멈추지 않는다.
// game.js의 updateUI()가 ManmulTutorial.check()를 부르고, 조건을 만족한 안내 중 아직 본 적 없는 것을 하나씩 보여 준다.
// 본 안내와 켜기/끄기는 'rift-tutorial-v1'에 저장한다(설정 > 초보자 안내).
const ManmulTutorial=(()=>{
 const KEY='rift-tutorial-v1',CHECK_EVERY=250;
 let store=read(),queue=[],current=null,lastCheck=0;
 function read(){try{let d=JSON.parse(localStorage.getItem(KEY)||'{}');return {enabled:d.enabled!==false,seen:Array.isArray(d.seen)?d.seen.filter(x=>typeof x==='string'):[]}}catch(e){return {enabled:true,seen:[]}}}
 function save(){try{localStorage.setItem(KEY,JSON.stringify(store))}catch(e){}}
 const $=s=>document.querySelector(s);
 const playing=()=>typeof inLobby!=='undefined'&&!inLobby&&!ended&&introRemaining<=0&&!themePending;
 // 지금 가진 유닛으로 만들 수 있는 조합이 있는지
 function anyRecipeReady(){let have={};for(const u of units)have[u.type]=(have[u.type]||0)+1;return recipes.some(r=>{let need={};for(const p of r.parts)need[p]=(need[p]||0)+1;return Object.entries(need).every(([t,n])=>(have[t]||0)>=n)})}
 const relicOffered=()=>pendingRewards.length>0;
 // 새 기능 안내에 쓰는 조건들 (manmul/missions.js, manmul/marks.js)
 const huntBoss=id=>typeof huntBosses==='object'?huntBosses.find(b=>b.id===id):null;
 const huntOpen=id=>{let b=huntBoss(id);return !!b&&wave>=b.from};
 const huntText=id=>{let b=huntBoss(id);return b?`이제 <b>${b.name}</b>(${b.tier}단계)도 부를 수 있습니다. 제한 시간 ${b.time}초, 현상금은 ${huntRewardText(b,wave)}입니다.`:''};
 const markedEnemy=()=>enemies.some(e=>Object.values(e.manmulMarks||{}).some(t=>t>combatTime));
 const missionDone=hidden=>typeof missionList==='object'&&missionList.some(m=>!!m.hidden===hidden&&missionState.done[m.id]);
 // 순서가 곧 우선순위다. 같은 순간에 여러 조건이 맞으면 앞의 것부터 보여 준다.
 const hints=[
  {id:'summon',when:()=>units.length===0,title:'유닛 소환',text:'Q 또는 아래 <b>소환</b> 버튼으로 노말 유닛을 뽑으세요(20골드). 유닛은 사거리 안의 적을 자동으로 공격합니다.'},
  {id:'combine',when:()=>anyRecipeReady(),title:'조합',text:'재료 유닛을 <b>드래그로 함께 선택</b>하면 아래에 조합 카드가 나옵니다. 카드를 누르면 더 강한 유닛이 됩니다. 유닛 하나를 고르고 R을 누르면 그 유닛이 들어가는 조합식을 봅니다.'},
  {id:'move',when:()=>units.length>=3,title:'이동',text:'유닛을 선택하고 <b>마우스 오른쪽 클릭</b>으로 옮길 수 있습니다. 적이 다니는 바깥길 가까이에 두면 더 많이 공격합니다.'},
  {id:'wave',when:()=>wave>=1,title:'라운드와 패배 조건',text:'적은 바깥길을 계속 돕니다. 살아 있는 적이 <b>101마리</b>가 되면 패배합니다. 위쪽에서 몬스터 수를 확인하세요.'},
  {id:'recipebook',when:()=>units.some(u=>types[u.type]?.grade!=='노말'),title:'조합 도감',text:'E로 <b>조합 도감</b>을 열어 다음 목표를 찾아보세요. 같은 유닛을 만드는 조합식이 여러 개인 경우도 있습니다. 등급이 높을수록 같은 골드로 더 강해집니다.'},
  {id:'theme',when:()=>wave>=2&&!!currentTheme,title:()=>`전장 테마: ${ManmulThemes.themes[currentTheme].name}`,text:()=>`${ManmulThemes.themes[currentTheme].description} 위쪽 테마 이름에 마우스를 올리면 다시 볼 수 있습니다.`},
  {id:'upgrade',when:()=>wave>=4&&gold>=50,title:'등급 강화',text:'W로 <b>같은 등급 유닛 전체</b>를 강화할 수 있습니다. 강화 단계는 기본 공격 아이콘의 +N으로, 오른 공격력은 초록색 +수치로 표시됩니다.'},
  {id:'lap',when:()=>enemies.some(e=>e.laps>0),title:'균열 순환',text:'적이 바깥길을 한 바퀴 돌 때마다 최대 체력이 늘어납니다(체력바 옆 <b>빨간 점</b>). 놓친 적은 빨리 처치하거나, 감속·묶기로 순환을 늦추세요.'},
  {id:'boss',when:()=>!!upcomingBoss,title:'보스 예고',text:'다음 보스의 이름과 능력이 위쪽에 표시됩니다. 대응 팁을 보고 미리 유닛을 준비하세요. 보스는 10라운드마다 나옵니다.'},
  {id:'relic',when:()=>relicOffered(),title:'보상 카드',text:'보스를 잡을 때마다 카드 한 장을 고릅니다. 카드는 <b>전술·유물·경제·소환</b> 네 계열이고, 같은 계열을 <b>3장</b> 모으면 세트 효과가 켜집니다(창 위쪽에 진행도 표시). 모은 카드는 메뉴의 「보상 카드」에서 다시 볼 수 있습니다.'},
  {id:'ticket',when:()=>typeof ticketTotal==='function'&&ticketTotal()>0,title:'선택권',text:'<b>선택권</b>을 얻었습니다. 오른쪽 위 선택권 버튼으로 원하는 유닛을 골라 소환하세요. 쓰기 전까지 보관됩니다.'},
  {id:'hunt',when:()=>wave>=2&&typeof huntReadyCount==='function'&&huntReadyCount()>0,title:'현상금 사냥',text:'오른쪽 위 <b>현상금</b> 버튼으로 현상금 보스를 직접 불러낼 수 있습니다. 제한 시간 안에 잡으면 골드·선택권을 받고, 놓치면 도망칩니다. 전력에 여유가 있을 때 부르세요.'},
  {id:'mission',when:()=>wave>=3&&typeof missionList==='object',title:'미션',text:'왼쪽 <b>미션</b> 카드에 거의 다 된 미션이 보입니다. 조건을 채우는 순간 보상을 바로 받고, 카드를 누르면 전체 목록과 받은 보상을 볼 수 있습니다.'},
  {id:'marks',when:()=>wave>=3&&markedEnemy(),title:'표식',text:'적 머리 위 <b>색 네모</b>가 표식입니다. 표식이 붙은 적을 다른 공격으로 때리면 반응이 터집니다. 도감(E)의 <b>표식</b> 버튼으로 붙이는 유닛·활용하는 유닛을 찾고, 「표식·반응 안내」에서 조합을 볼 수 있습니다.'},
  {id:'hunt2',when:()=>huntOpen('gosichu'),title:'새 현상금 보스',text:()=>huntText('gosichu')},
  {id:'hiddenMission',when:()=>missionDone(true),title:'히든 미션 발견!',text:'조건이 숨겨진 <b>히든 미션</b>을 달성했습니다. 미션 목록의 <b>???</b> 칸에 아직 찾지 못한 히든 미션이 남아 있습니다.'},
  {id:'hunt3',when:()=>huntOpen('hubii'),title:'새 현상금 보스',text:()=>huntText('hubii')},
  {id:'hunt4',when:()=>huntOpen('ominyong'),title:'새 현상금 보스',text:()=>huntText('ominyong')},
  {id:'convert',when:()=>wave>=8&&units.length>=8,title:'같은 등급 변환',text:'쓸 곳이 없는 유닛을 하나 선택하고 <b>D</b>를 누르면 같은 등급의 다른 유닛으로 바꿉니다(골드 필요).'},
  {id:'danger',when:()=>enemies.length>=60,title:'위험!',text:'몬스터가 60마리를 넘었습니다. 오른쪽 위 <b>긴급 지원</b>으로 폭격·감속을 쓰거나, 조합으로 화력을 올리세요.'}
 ];
 const val=v=>typeof v==='function'?v():v;
 function check(){if(!store.enabled||typeof document!=='object')return;let t=Date.now();if(t-lastCheck<CHECK_EVERY)return;lastCheck=t;if(!playing())return;
  for(const h of hints){if(store.seen.includes(h.id)||queue.includes(h)||current===h)continue;let ok=false;try{ok=!!h.when()}catch(e){}if(ok)queue.push(h)}
  if(!current&&queue.length)show(queue.shift())}
 function show(h){current=h;let box=$('#tutorialHint');if(!box)return;box.innerHTML=`<div class="tutorial-head"><span class="tutorial-eyebrow">안내</span><strong>${val(h.title)}</strong></div><p>${val(h.text)}</p><div class="tutorial-actions"><button type="button" class="tutorial-ok" onclick="ManmulTutorial.dismiss()">알겠어요</button><button type="button" class="tutorial-off" onclick="ManmulTutorial.setEnabled(false)">안내 끄기</button></div>`;box.classList.remove('hidden')}
 function hide(){current=null;let box=$('#tutorialHint');if(box){box.classList.add('hidden');box.innerHTML=''}}
 function dismiss(){if(current&&!store.seen.includes(current.id)){store.seen.push(current.id);save()}hide();if(queue.length&&store.enabled)show(queue.shift())}
 function setEnabled(on){store.enabled=!!on;save();if(!on){queue=[];hide()}}
 function reset(){store={enabled:true,seen:[]};save();queue=[];hide()}
 return {check,dismiss,setEnabled,reset,hints,get enabled(){return store.enabled},get seen(){return [...store.seen]},get current(){return current?.id||null}};
})();
