'use strict';
// 전투 화면 정리: the side panels used to sit at fixed positions and pile on top of each other once multiplayer,
// missions, bounty hunts, versus and co-op were all on screen. This keeps two tidy columns inside the 1600×900 stage:
//  - left: room board, mission/bounty card, then chat anchored at the bottom (above the co-op signal bar);
//  - right: goal tracker at the top, versus panel and the beginner hint stacked from the bottom.
// Panels that would collide are given a max height and scroll instead of overlapping. The room board and the chat
// can be folded to one line (remembered). Beginner hints fold away by themselves after a while.
const HudLayout=(()=>{
 const STAGE_H=900,GAP=8,TOP_LEFT=16,TOP_RIGHT=83,BOTTOM=16,HINT_SECONDS=15;
 const $=s=>typeof document!=='undefined'?document.querySelector(s):null;
 const shown=el=>!!el&&!el.classList.contains('hidden');
 const h=el=>el?el.offsetHeight||0:0;
 let folded=(()=>{try{return JSON.parse(localStorage.getItem('hud-folded')||'{}')||{}}catch(e){return {}}})();
 function saveFolded(){try{localStorage.setItem('hud-folded',JSON.stringify(folded))}catch(e){}}
 function place(el,top,maxBottom){if(!el)return top;el.style.top=top+'px';el.style.bottom='auto';let room=Math.max(60,maxBottom-top);el.style.maxHeight=room+'px';el.style.overflowY=h(el)>room?'auto':'';return top+Math.min(h(el),room)+GAP}
 function layout(){if(typeof document==='undefined')return;
  // left column
  let board=$('#multiBoard'),mission=$('#missionPanel'),chat=$('#multiChat'),bar=$('#coopBar'),bottom=STAGE_H-BOTTOM;
  if(shown(bar)){bar.style.bottom=BOTTOM+'px';bottom-=h(bar)+GAP}
  if(chat){chat.classList.toggle('is-folded',!!folded.chat);if(shown(chat)){chat.style.top='auto';chat.style.bottom=(STAGE_H-bottom)+'px';bottom-=h(chat)+GAP}}
  let top=TOP_LEFT;if(board){board.classList.toggle('is-folded',!!folded.board);if(shown(board))top=place(board,top,bottom-(shown(mission)?120:0))}
  if(shown(mission))place(mission,top,bottom);
  // right column: versus panel at the bottom, the hint above it, the goal tracker fills what is left at the top
  let rBottom=STAGE_H-BOTTOM,vs=$('#versusPanel'),hint=$('#tutorialHint'),goal=$('#goalTracker');
  if(shown(vs)){vs.style.bottom=BOTTOM+'px';rBottom-=h(vs)+GAP}
  if(hint){hint.style.bottom=(STAGE_H-rBottom)+'px';if(shown(hint))rBottom-=h(hint)+GAP}
  if(shown(goal)){goal.style.top=TOP_RIGHT+'px';let room=Math.max(80,rBottom-TOP_RIGHT);goal.style.maxHeight=room+'px'}}
 // Fold buttons on the room board and the chat (added once; the board re-renders its body, so the button lives outside it).
 function addFoldButtons(){for(const [key,sel,label] of [['board','#multiBoard','현황'],['chat','#multiChat','채팅']]){let el=$(sel);if(!el||el.querySelector?.(':scope > .hud-fold'))continue;let b=document.createElement('button');b.type='button';b.className='hud-fold';b.title=`${label} 접기/펼치기`;b.textContent=folded[key]?'＋':'−';b.onclick=()=>{folded[key]=!folded[key];b.textContent=folded[key]?'＋':'−';saveFolded();layout()};el.prepend(b)}}
 // Beginner hints dismiss themselves (counted as seen) when left alone.
 let hintSince=0,hintId=null;
 function hintTick(){let hint=$('#tutorialHint');if(!shown(hint)||typeof ManmulTutorial!=='object'){hintId=null;return}let id=ManmulTutorial.current;if(id!==hintId){hintId=id;hintSince=Date.now();return}if(id&&Date.now()-hintSince>HINT_SECONDS*1000){ManmulTutorial.dismiss();hintId=null}}
 function tick(){try{addFoldButtons();layout();hintTick()}catch(e){}}
 if(typeof setInterval==='function'&&typeof document!=='undefined')setInterval(tick,400);
 return {layout,tick,get folded(){return folded}};
})();
globalThis.HudLayout=HudLayout;
