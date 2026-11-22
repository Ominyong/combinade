'use strict';
// Beta only (globalThis.COMBINADE_REDESIGN): quarter view test.
// The ground (arena, path, range circles, grade bases) is turned 45° into a diamond and laid down (squashed
// vertically); units, enemies, bars, text and effects stand upright on it. Game rules, positions and collisions are
// unchanged: only drawing and pointer picking change. Loaded after manmul/game.js and replaces a few of its globals.
(function(root){
 if(!root.COMBINADE_REDESIGN||typeof drawScene!=='function')return;
 const ANGLE=Math.PI/4,SQUASH=.5;// 2:1 like classic isometric tiles
 const co=Math.cos(ANGLE),si=Math.sin(ANGLE);
 // Ground projection around the field centre: screen = L * (world - centre). L = squash(1,SQUASH) * rotate(ANGLE).
 const L={a:co,b:SQUASH*si,c:-si,d:SQUASH*co};// canvas order: x' = a*x + c*y, y' = b*x + d*y
 const det=L.a*L.d-L.b*L.c,Li={a:L.d/det,b:-L.b/det,c:-L.c/det,d:L.a/det};
 const project=(x,y)=>({x:L.a*x+L.c*y,y:L.b*x+L.d*y});
 const unproject=(x,y)=>({x:Li.a*x+Li.c*y,y:Li.b*x+Li.d*y});
 const depth=(x,y)=>L.b*x+L.d*y;// larger = lower on screen = nearer

 transform=function(){
  const m=stageMetrics(),top=84,bottom=90,avail=STAGE_H-top-bottom,hw=world.w/2,hh=world.h/2;
  const corners=[[-hw,-hh],[hw,-hh],[hw,hh],[-hw,hh]].map(([x,y])=>project(x,y));
  const spanX=Math.max(...corners.map(p=>p.x))-Math.min(...corners.map(p=>p.x)),spanY=Math.max(...corners.map(p=>p.y))-Math.min(...corners.map(p=>p.y));
  const s=Math.min(STAGE_W/spanX,avail/spanY)*.98,S=s*m.scale,cx=m.left+STAGE_W/2*m.scale,cy=m.top+(top+avail/2)*m.scale;
  // x/y/scale keep the old meaning (field centre = x + world.w*scale/2) for code that only needs the centre.
  return {scale:S,ky:1,x:cx-world.w*S/2,y:cy-world.h*S/2,cx,cy,quarter:true};
 };
 applyWorldTransform=function(t){
  if(!t.quarter){ctx.translate(t.x,t.y);ctx.scale(t.scale,t.scale);return}
  ctx.translate(t.cx,t.cy);ctx.transform(L.a*t.scale,L.b*t.scale,L.c*t.scale,L.d*t.scale,0,0);ctx.translate(-world.w/2,-world.h/2);
 };
 pos=function(e){const t=transform(),w=unproject((e.clientX-t.cx)/t.scale,(e.clientY-t.cy)/t.scale);return {x:w.x+world.w/2,y:w.y+world.h/2}};
 function toScreen(x,y){const t=transform(),v=project(x-world.w/2,y-world.h/2);return {x:t.cx+v.x*t.scale,y:t.cy+v.y*t.scale}}
 // Upright around a ground point: undo the ground projection locally, keeping the world scale.
 function standUp(x,y){ctx.save();ctx.translate(x,y);ctx.transform(Li.a,Li.b,Li.c,Li.d,0,0);ctx.translate(-x,-y)}
 viewUprightBegin=function(x,y){standUp(x,y);return true};
 root.ManmulBetaView={angle:45,squash:SQUASH,toScreen,depth};

 function upright(x,y,fn){standUp(x,y);try{return fn()}finally{ctx.restore()}}
 // Every drawImage inside fn stands up around a point of its destination: the local origin for sprites drawn after
 // translate, otherwise the horizontal centre at fy of the height (0 top, 1 bottom).
 function uprightImages(fn,fy){
  const draw=ctx.drawImage;
  ctx.drawImage=function(img,...a){
   let dx,dy,dw,dh;
   if(a.length>=8)[,,,,dx,dy,dw,dh]=a;else if(a.length>=4)[dx,dy,dw,dh]=a;else{[dx,dy]=a;dw=img?.width||0;dh=img?.height||0}
   const aroundOrigin=dx<=0&&dx+dw>=0&&dy<=0&&dy+dh>=0,ax=aroundOrigin?0:dx+dw/2,ay=aroundOrigin?0:dy+dh*fy;
   standUp(ax,ay);try{return draw.call(ctx,img,...a)}finally{ctx.restore()}
  };
  try{return fn()}finally{delete ctx.drawImage}
 }
 function uprightText(fn){
  const wrap=name=>{const base=ctx[name];ctx[name]=function(text,x,y,...rest){standUp(x,y);try{return base.call(ctx,text,x,y,...rest)}finally{ctx.restore()}}};
  wrap('fillText');wrap('strokeText');
  try{return fn()}finally{delete ctx.fillText;delete ctx.strokeText}
 }

 const baseUnitSprite=drawUnitSprite;drawUnitSprite=function(unit,...rest){return upright(unit.x,unit.y,()=>baseUnitSprite.call(this,unit,...rest))};
 const baseUnitAura=drawUnitGradeAura;drawUnitGradeAura=function(unit,...rest){return upright(unit.x,unit.y,()=>baseUnitAura.call(this,unit,...rest))};
 if(typeof drawSkillFx==='function'){const base=drawSkillFx;drawSkillFx=function(...a){return uprightImages(()=>base.apply(this,a),.5)}}
 if(typeof drawArrivalEffects==='function'){const base=drawArrivalEffects;drawArrivalEffects=function(...a){return uprightImages(()=>base.apply(this,a),.85)}}
 const baseFeedback=drawCombatFeedback;drawCombatFeedback=function(...a){return uprightText(()=>baseFeedback.apply(this,a))};

 // Draw far to near; enemies hidden behind a unit get a faint see-through copy on top.
 const baseScene=drawScene;
 drawScene=function(...a){
  const saveUnits=units,saveEnemies=enemies;
  units=[...units].sort((p,q)=>depth(p.x,p.y)-depth(q.x,q.y));
  enemies=enemies.map(e=>{const p=pathPoint(e.d);return [depth(p.x,p.y),e]}).sort((p,q)=>p[0]-q[0]).map(x=>x[1]);
  try{baseScene.apply(this,a);drawHiddenEnemies()}finally{units=saveUnits;enemies=saveEnemies}
 };
 function drawHiddenEnemies(){
  if(introRemaining>0||!enemies.length||!units.length)return;
  const hidden=enemies.filter(e=>{const p=pathPoint(e.d);return units.some(u=>{const v=project(u.x-p.x,u.y-p.y);return v.y>0&&v.y<70&&Math.abs(v.x)<30*unitVisualScale(u)})});
  if(!hidden.length)return;
  const t=transform();ctx.save();applyWorldTransform(t);ctx.globalAlpha=.42;
  for(const e of hidden){const p=pathPoint(e.d);upright(p.x,p.y,()=>drawEnemySprite(e,p))}
  ctx.restore();
 }

 // Picking: a unit stands up from its feet, so clicks on its body count.
 unitHit=function(u,p){
  const s=unitVisualScale(u),halfW=Math.max(types[u.type].radius+5,15*s),height=26*s,v=project(p.x-u.x,p.y-u.y);
  return Math.abs(v.x)<=halfW&&v.y<=8&&v.y>=-height;
 };
})(globalThis);
