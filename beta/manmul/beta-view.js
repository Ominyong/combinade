'use strict';
// Beta only (globalThis.COMBINADE_REDESIGN): 3/4 camera test.
// The ground (arena, path, range circles, grade bases) is squashed vertically by BETA_VIEW_TILT, while units, enemies,
// bars, text and effects are drawn upright. Game rules, positions and collisions are unchanged: only drawing and
// pointer picking change. Loaded after manmul/game.js; it replaces a few of its global draw functions.
(function(root){
 if(!root.COMBINADE_REDESIGN||typeof drawScene!=='function')return;
 const TILT=.72;
 viewTilt=TILT;
 root.ManmulBetaView={tilt:TILT};

 // Runs fn with ctx upright around (x,y).
 function upright(x,y,fn){const on=viewUprightBegin(x,y);try{return fn()}finally{viewUprightEnd(on)}}
 // Runs fn with every drawImage made upright around a point of its destination rectangle:
 // fy = 0 is the rectangle's top, 1 its bottom; a picture drawn around the local origin (a sprite after translate) is
 // made upright around that origin instead.
 function uprightImages(fn,fy){
  const draw=ctx.drawImage;
  ctx.drawImage=function(img,...a){
   let dx,dy,dw,dh;
   if(a.length>=8)[,,,,dx,dy,dw,dh]=a;else if(a.length>=4)[dx,dy,dw,dh]=a;else{[dx,dy]=a;dw=img?.width||0;dh=img?.height||0}
   const aroundOrigin=dx<=0&&dx+dw>=0&&dy<=0&&dy+dh>=0,ax=aroundOrigin?0:dx+dw/2,ay=aroundOrigin?0:dy+dh*fy;
   ctx.save();ctx.translate(ax,ay);ctx.scale(1,1/TILT);ctx.translate(-ax,-ay);
   try{return draw.call(ctx,img,...a)}finally{ctx.restore()}
  };
  try{return fn()}finally{delete ctx.drawImage}
 }
 // Runs fn with text drawn upright around its anchor point.
 function uprightText(fn){
  const wrap=name=>{const base=ctx[name];ctx[name]=function(text,x,y,...rest){ctx.save();ctx.translate(x,y);ctx.scale(1,1/TILT);try{return base.call(ctx,text,0,0,...rest)}finally{ctx.restore()}}};
  wrap('fillText');wrap('strokeText');
  try{return fn()}finally{delete ctx.fillText;delete ctx.strokeText}
 }

 // Units and auras stand up around their feet.
 const baseUnitSprite=drawUnitSprite;drawUnitSprite=function(unit,...rest){return upright(unit.x,unit.y,()=>baseUnitSprite.call(this,unit,...rest))};
 const baseUnitAura=drawUnitGradeAura;drawUnitGradeAura=function(unit,...rest){return upright(unit.x,unit.y,()=>baseUnitAura.call(this,unit,...rest))};
 // Effects: skill bursts are centred on their target, arrival effects stand on the ground.
 if(typeof drawSkillFx==='function'){const base=drawSkillFx;drawSkillFx=function(...a){return uprightImages(()=>base.apply(this,a),.5)}}
 if(typeof drawArrivalEffects==='function'){const base=drawArrivalEffects;drawArrivalEffects=function(...a){return uprightImages(()=>base.apply(this,a),.85)}}
 // Damage numbers and skill names.
 const baseFeedback=drawCombatFeedback;drawCombatFeedback=function(...a){return uprightText(()=>baseFeedback.apply(this,a))};

 // Depth: lower on screen is nearer, so draw by y. Enemies hidden behind a unit get a faint see-through copy on top.
 const baseScene=drawScene;
 drawScene=function(...a){
  const saveUnits=units,saveEnemies=enemies;
  units=[...units].sort((p,q)=>p.y-q.y);
  enemies=[...enemies].map(e=>[pathPoint(e.d).y,e]).sort((p,q)=>p[0]-q[0]).map(x=>x[1]);
  try{baseScene.apply(this,a);drawHiddenEnemies()}finally{units=saveUnits;enemies=saveEnemies}
 };
 function drawHiddenEnemies(){
  if(introRemaining>0||!enemies.length||!units.length)return;
  const hidden=enemies.filter(e=>{const p=pathPoint(e.d);return units.some(u=>u.y>p.y&&u.y-p.y<110&&Math.abs(u.x-p.x)<34*unitVisualScale(u))});
  if(!hidden.length)return;
  const t=transform();ctx.save();ctx.translate(t.x,t.y);ctx.scale(t.scale,t.scale*t.ky);ctx.globalAlpha=.42;
  for(const e of hidden){const p=pathPoint(e.d);upright(p.x,p.y,()=>drawEnemySprite(e,p))}
  ctx.restore();
 }

 // Picking: a unit stands up from its feet, so clicks on its body count.
 unitHit=function(u,p){
  const s=unitVisualScale(u),halfW=Math.max(types[u.type].radius+5,15*s),height=26*s,lx=p.x-u.x,ly=(p.y-u.y)*TILT;
  return Math.abs(lx)<=halfW&&ly<=8&&ly>=-height;
 };
})(globalThis);
