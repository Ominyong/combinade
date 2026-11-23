'use strict';
// Beta only (unit redesign): play-feel features on top of the quarter view and the cartoon art.
//  - Special grades: 재앙·역설·신수 one each on the field, 천체 (no recipe uses it) two; a special unit's arrival
//    shakes the screen and shows its name.
//  - "One part short": the unit panel lists recipes the player could finish with a single more material.
//  - Ranges: a selected unit shows its range, its support aura and who it supports or is supported by; hovering the
//    ground shows the range it would have there.
//  - See-through: units in front of a selected or hovered unit turn translucent.
//  - Reactions: bigger mark badges above the health bar, a big popup when a reaction fires, and the panel lists the
//    allies that complete a reaction with this unit's mark.
//  - Wide field (with the half-size bodies of manmul/beta-view.js): unit footprints are halved so 4× as many fit.
//    Enemies come at half the rate: half as many per round, each with twice the health and gold, and the field holds
//    half as many (limit 100 → 50), so a round keeps its total health, gold and leak tolerance.
// Loaded after manmul/beta-cartoon.js.
(function(root){
 const view=root.ManmulBetaView;
 if(!root.COMBINADE_REDESIGN||!view)return;
 const ink='#1a1a24',BODY=view.BODY||1;

 // ---- Wide field: half footprints, half the enemy rate ----
 for(const t of Object.values(types))if(typeof t.radius==='number')t.radius*=BODY;
 const baseFootprint=unitFootprint;unitFootprint=function(type){return baseFootprint(type)*BODY};
 const footY=u=>u.y+(unitFootY(u)-u.y)*BODY;// the grade base centre on the ground, at body size
 const RATE=.5,WAVE_KINDS=new Set(['normal','fast','armor','swarm']);
 for(const k of WAVE_KINDS){const spec=combatRules.enemyKinds[k];if(spec)spec.reward*=1/RATE}
 const baseStartWave=startWave;
 startWave=function(...a){const before=wave,r=baseStartWave.apply(this,a);if(wave!==before&&spawnLeft>1){spawnLeft=Math.max(1,Math.round(spawnLeft*RATE));spawnInterval=spawnDuration/spawnLeft}return r};
 const baseSpawnEnemy=spawnEnemy;
 spawnEnemy=function(kind,...a){const n=enemies.length,r=baseSpawnEnemy.call(this,kind,...a),e=enemies[n];if(e&&enemies.length>n&&WAVE_KINDS.has(kind)){e.hp/=RATE;e.max/=RATE}return r};
 const baseLimit=enemyLimit;enemyLimit=function(){return Math.round(baseLimit()*RATE)};
 if(root.ManmulSound?.enemyCount){const base=root.ManmulSound.enemyCount;root.ManmulSound.enemyCount=n=>base(n/RATE)}// alarms at the same share of the limit

 // ---- Special grade limits ----
 const LIMITS={'재앙':1,'역설':1,'신수':1,'천체':2};
 specialGradeLimit=function(grade){return LIMITS[grade]??null};

 // ---- Special arrival: screen shake and a name banner ----
 const SPECIAL=new Set(Object.keys(LIMITS));
 function banner(unit){
  if(typeof document!=='object'||typeof document.createElement!=='function'||!document.body)return;
  const t=types[unit.type],color=gradeColors[t.grade]||'#fff',el=document.createElement('div');
  el.className='beta-special-banner';el.setAttribute('aria-hidden','true');
  el.innerHTML=`<small>${t.grade}</small><b>${t.name}</b>`;el.style.setProperty('--grade',color);
  document.body.appendChild(el);setTimeout(()=>el.remove(),1900);
  const game=document.querySelector('#game');if(game){game.classList.remove('beta-shake');void game.offsetWidth;game.classList.add('beta-shake');setTimeout(()=>game.classList.remove('beta-shake'),500)}
 }
 const baseArrival=showArrivalEffect;
 showArrivalEffect=function(key,unit,...rest){const r=baseArrival.call(this,key,unit,...rest);if(unit&&SPECIAL.has(types[unit.type]?.grade))banner(unit);return r};
 if(typeof document==='object'&&typeof document.createElement==='function'&&document.head&&!document.querySelector('#beta-play-style')){
  const style=document.createElement('style');style.id='beta-play-style';
  style.textContent=`
.beta-special-banner{position:fixed;left:50%;top:22%;transform:translate(-50%,-50%);z-index:60;pointer-events:none;text-align:center;
 animation:beta-banner 1.9s ease-out forwards;font-family:inherit}
.beta-special-banner small{display:block;font-size:15px;font-weight:700;color:var(--grade);letter-spacing:.2em;text-shadow:0 2px 0 #0008}
.beta-special-banner b{display:block;font-size:44px;line-height:1.1;color:#fff;-webkit-text-stroke:2px ${ink};text-shadow:0 0 18px var(--grade),0 4px 0 ${ink}}
@keyframes beta-banner{0%{opacity:0;transform:translate(-50%,-50%) scale(.6)}12%{opacity:1;transform:translate(-50%,-50%) scale(1.12)}22%{transform:translate(-50%,-50%) scale(1)}80%{opacity:1}100%{opacity:0;transform:translate(-50%,-60%) scale(1)}}
#game.beta-shake{animation:beta-shake .45s linear}
@keyframes beta-shake{0%,100%{transform:translate(0,0)}15%{transform:translate(-6px,3px)}30%{transform:translate(5px,-4px)}45%{transform:translate(-4px,-2px)}60%{transform:translate(4px,3px)}75%{transform:translate(-2px,1px)}}
.beta-hints{grid-column:1/-1;display:grid;gap:4px;margin-top:6px;padding-top:6px;border-top:1px solid #ffffff1f;font-size:12px}
.beta-hints h4{margin:0;font-size:11px;font-weight:700;color:#b9cfc3}
.beta-hints ul{margin:0;padding:0;list-style:none;display:flex;flex-wrap:wrap;gap:4px 10px}
.beta-hints li{white-space:nowrap}
.beta-hints em{font-style:normal;color:#ffd77a}`;
  document.head.appendChild(style);
 }

 // ---- Unit panel hints: one part short, and reaction partners ----
 // Reactions between two marks (the tag-based ones need a kind of attack rather than a second mark).
 const MARK_REACTIONS=[['젖음','열기','증기폭발'],['젖음','냉기','급랭'],['포자','젖음','개화'],['포자','열기','포자연소']];
 const TAG_REACTIONS=[['젖음','번개 공격','감전'],['균열','충격 공격','파쇄'],['표적','광선 공격','집광']];
 function markOf(id){const d=root.ManmulBasicData?.[id]||root.ManmulUpperBasicData?.[id];return d?.mark||null}
 function oneShort(typeId){
  const have={};for(const u of ownedUnits())have[u.type]=(have[u.type]||0)+1;
  const out=[];
  for(const r of recipes){
   if(!r.parts.includes(typeId))continue;const need={};for(const p of r.parts)need[p]=(need[p]||0)+1;
   let missing=[];for(const [p,n] of Object.entries(need)){const short=n-(have[p]||0);for(let i=0;i<short;i++)missing.push(p)}
   if(missing.length===1)out.push({result:r.result,missing:missing[0]});
  }
  const grades=ManmulRoster.grades;out.sort((a,b)=>grades.indexOf(types[b.result].grade)-grades.indexOf(types[a.result].grade));
  return out.slice(0,4);
 }
 function partners(typeId){
  const mark=markOf(typeId);if(!mark)return [];const owned=new Set(ownedUnits().map(u=>u.type)),out=[];
  for(const [a,b,name] of MARK_REACTIONS){if(mark!==a&&mark!==b)continue;const other=mark===a?b:a;
   const allies=[...owned].filter(id=>id!==typeId&&markOf(id)===other).map(id=>types[id].name);out.push({name,other,allies})}
  for(const [m,tag,name] of TAG_REACTIONS)if(mark===m)out.push({name,other:tag,allies:null});
  return out;
 }
 const name=id=>types[id]?.name||id;
 function hintsHtml(typeId){
  const short=oneShort(typeId),react=partners(typeId);if(!short.length&&!react.length)return '';
  let html='<div class="beta-hints">';
  if(short.length)html+=`<h4>재료 1개만 더 있으면</h4><ul>${short.map(s=>`<li><b style="color:${gradeColors[types[s.result].grade]}">${name(s.result)}</b> ← <em>${name(s.missing)}</em> 필요</li>`).join('')}</ul>`;
  if(react.length)html+=`<h4>반응 (${markOf(typeId)} 표식)</h4><ul>${react.map(r=>`<li><b>${r.name}</b>: ${r.other}${r.allies?(r.allies.length?` — 아군 <em>${r.allies.slice(0,3).join(', ')}</em>`:' — 전장에 없음'):''}</li>`).join('')}</ul>`;
  return html+'</div>';
 }
 const baseUpdateUI=updateUI;
 updateUI=function(...a){
  const r=baseUpdateUI.apply(this,a);
  try{
   const box=document.querySelector('#selection');const sel=units.filter(u=>selected.includes(u.id));
   if(box&&sel.length===1&&box.querySelector('.unit-compact')&&!box.querySelector('.beta-hints')){const html=hintsHtml(sel[0].type);if(html)box.querySelector('.unit-compact').insertAdjacentHTML('afterend',html)}
  }catch(e){}
  try{
   const limit=enemyLimit(),n=enemies.length,gauge=document.querySelector('#countGauge'),hud=document.querySelector('.hud-enemies'),label=document.querySelector('.hud-limit');
   gauge?.style?.setProperty('width',Math.min(100,n/limit*100)+'%');if(hud)hud.dataset.level=n>=limit*.8?'danger':n>=limit*.6?'warn':'safe';
   document.querySelector('#count')?.classList?.toggle('danger',n>=limit*.8);if(label&&label.textContent!==`/ ${limit}`)label.textContent=`/ ${limit}`;
  }catch(e){}
  return r;
 };

 // ---- Ranges and support ----
 const auraOf=id=>(root.ManmulUpperBasicData?.[id]||root.ManmulBasicData?.[id])?.aura||null;
 function auraReaches(aura,target){
  const t=types[target.type],cats=t.categories||[];
  if(aura.category&&!cats.includes(aura.category))return false;
  if(aura.categories&&!aura.categories.some(c=>cats.includes(c)))return false;
  if(aura.damageType&&t.damage_type!==aura.damageType)return false;return true;
 }
 let mouse=null;// world point under the cursor, for the move preview and see-through
 if(typeof document==='object'&&typeof document.querySelector==='function'){
  const game=document.querySelector('#game');
  game?.addEventListener?.('mousemove',e=>{try{mouse=pos(e)}catch(err){mouse=null}});
  game?.addEventListener?.('mouseleave',()=>{mouse=null});
 }
 // A ring on the ground (a flat ellipse on screen). fill: inner tint so it reads on grass; outline: dark edge under the colour.
 function ring(x,y,r,color,alpha,dash=null,width=2,fill=0){ctx.save();ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);if(fill){ctx.globalAlpha=fill;ctx.fillStyle=color;ctx.fill()}ctx.globalAlpha=alpha;if(dash)ctx.setLineDash(dash);ctx.strokeStyle='#1a1a24';ctx.lineWidth=width+2;ctx.stroke();ctx.strokeStyle=color;ctx.lineWidth=width;ctx.stroke();ctx.restore()}
 function drawRanges(){
  const sel=units.filter(u=>selected.includes(u.id));if(sel.length!==1)return;
  const u=sel[0],fy=footY(u),aura=auraOf(u.type),mark=19*BODY+3;
  // Support this unit gives: aura circle and the allies it reaches.
  if(aura){
   ring(u.x,fy,aura.radius,'#7fe0a8',.8,[10,6],2.5,.08);
   for(const o of units)if(o!==u&&Math.hypot(o.x-u.x,o.y-u.y)<=aura.radius&&auraReaches(aura,o))ring(o.x,footY(o),mark,'#7fe0a8',1,null,3,.25);
  }
  // Support this unit receives: allies whose aura covers it.
  for(const o of units){if(o===u)continue;const a=auraOf(o.type);if(a&&Math.hypot(o.x-u.x,o.y-u.y)<=a.radius&&auraReaches(a,u))ring(o.x,footY(o),mark,'#ffd77a',1,[6,4],3,.2)}
  // Move preview: the range it would have at the cursor.
  if(mouse&&!units.some(o=>unitHit(o,mouse))){const r=v5Combat.range(u);ring(mouse.x,mouse.y,r,'#d8f5bd',.35,[8,6],1.5);ring(mouse.x,mouse.y,6,'#d8f5bd',.6,null,1.5)}
 }
 const baseArrivalFx=drawArrivalEffects;// drawn before the units, on the ground
 drawArrivalEffects=function(...a){const r=baseArrivalFx.apply(this,a);try{drawRanges()}catch(e){}return r};

 // ---- See-through: units in front of the one you look at ----
 const cartoon=root.ManmulBetaCartoon,hooks=view.hooks;
 function boxOf(u){const b=hooks.unitBox?.(u),h=(b?.height??26*unitVisualScale(u))*BODY,w=(b?.halfW??15*unitVisualScale(u))*BODY,fy=b?u.y+b.foot*BODY:u.y,f=view.toScreen(u.x,fy),t=transform();return {x0:f.x-w*t.scale,x1:f.x+w*t.scale,y0:f.y-h*t.scale,y1:f.y,depth:view.depth(u.x,fy)}}
 let faded=new Set(),fadedAt=-1;
 function fadedUnits(){
  const now=typeof combatTime==='number'?combatTime:0;if(now===fadedAt)return faded;fadedAt=now;faded=new Set();
  const focus=units.filter(u=>selected.includes(u.id));if(mouse){const h=units.find(o=>unitHit(o,mouse));if(h&&!focus.includes(h))focus.push(h)}
  if(!focus.length)return faded;const boxes=new Map(units.map(u=>[u,boxOf(u)]));
  for(const f of focus){const fb=boxes.get(f);for(const u of units){if(u===f||focus.includes(u))continue;const b=boxes.get(u);if(b.depth>fb.depth&&b.x0<fb.x1&&b.x1>fb.x0&&b.y0<fb.y1&&b.y1>fb.y0)faded.add(u)}}
  return faded;
 }
 const baseUnitBody=hooks.unitBody;
 hooks.unitBody=function(u){
  if(!fadedUnits().has(u))return baseUnitBody?baseUnitBody(u):false;
  ctx.save();ctx.globalAlpha*=.38;try{return baseUnitBody?baseUnitBody(u):false}finally{ctx.restore()}
 };

 // ---- Reactions: badges, popups ----
 const MARK_STYLE={젖음:['습','#3a9bd6'],열기:['열','#e8692c'],냉기:['냉','#7cc8f0'],균열:['균','#a07b62'],포자:['포','#6fae4f'],표적:['표','#d4af37']};
 const REACTION_COLOR={감전:'#ffe14d',증기폭발:'#ffffff',급랭:'#9fe3ff',파쇄:'#d8b08a',개화:'#9be36a',포자연소:'#ff9b4d',집광:'#fff3a0',정밀타격:'#ffd77a',다중반응:'#e0a8ff',일식공명:'#ffcf6a',극광:'#8affd2',중력렌즈:'#b8a8ff',반사:'#e8f4ff'};
 const baseDebuffs=drawDebuffs;
 drawDebuffs=function(enemy,point){
  // Reaction marks as bigger round badges just above the health bar; other debuffs keep the small squares below them.
  const now=combatTime,marks=Object.entries(enemy.manmulMarks||{}).filter(([m,until])=>until>now&&MARK_STYLE[m]).map(([m])=>m);
  const y=enemyBarY(enemy,point)-11,r=6.5,gap=3,start=point.x-(marks.length*(r*2)+Math.max(0,marks.length-1)*gap)/2+r;
  ctx.save();ctx.font='bold 9px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';
  marks.forEach((m,i)=>{const x=start+i*(r*2+gap),[label,color]=MARK_STYLE[m];ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fillStyle=color;ctx.fill();ctx.lineWidth=1.6;ctx.strokeStyle=ink;ctx.stroke();ctx.fillStyle='#fff';ctx.fillText(label,x,y+.5)});
  ctx.restore();
  // The old drawer puts its row 30 (42 for bosses) above the point it gets: aim its row just above the badges.
  const off=enemy.kind==='boss'||enemy.kind==='miniboss'?42:30,row=marks.length?y-r-12:y-5;
  const saved=enemy.manmulMarks;enemy.manmulMarks={};try{baseDebuffs(enemy,{x:point.x,y:row+off})}finally{enemy.manmulMarks=saved}
 };
 const popups=[];
 const R=root.ManmulReactions;
 if(R&&typeof R.react==='function'){
  const baseReact=R.react;
  R.react=function(name,target,ctx2,...rest){const ok=baseReact.call(this,name,target,ctx2,...rest);if(ok&&target&&popups.length<24){const p=pathPoint(target.d);popups.push({name,x:p.x,y:p.y+(enemyBarY(target,p)-22-p.y)*BODY,start:combatTime})}return ok};
 }
 function drawPopups(){
  const now=combatTime;
  for(let i=popups.length-1;i>=0;i--){
   const p=popups[i],q=(now-p.start)/.9;if(!(q>=0&&q<1)){if(q>=1)popups.splice(i,1);continue}
   const s=q<.15?.6+q/.15*.6:q<.25?1.2-(q-.15)/.1*.2:1,y=p.y-q*16,color=REACTION_COLOR[p.name]||'#fff';
   view.upright(p.x,y,()=>{ctx.save();ctx.globalAlpha=q>.7?(1-q)/.3:1;ctx.translate(p.x,y);ctx.scale(s,s);ctx.font='900 15px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.lineJoin='round';ctx.lineWidth=4;ctx.strokeStyle=ink;ctx.strokeText(p.name+'!',0,0);ctx.fillStyle=color;ctx.fillText(p.name+'!',0,0);ctx.restore()},.8);
  }
 }
 const baseFeedback=drawCombatFeedback;
 drawCombatFeedback=function(...a){const r=baseFeedback.apply(this,a);try{drawPopups()}catch(e){}return r};

 root.ManmulBetaPlay={LIMITS,oneShort,partners,hintsHtml,fadedUnits,popups,setMouse:p=>{mouse=p}};
})(globalThis);
