'use strict';
// Beta only (globalThis.COMBINADE_REDESIGN): quarter view test.
// - The enemy path becomes a 600×600 square (same lap length 2400 as the main 700×500 path) so the field is a true
//   diamond with symmetric corners.
// - The ground is turned 45° and laid down 2:1 like isometric tiles, and drawn here in code (temporary art): a raised
//   platform with tiles, a stone path and the placement area. Units, enemies, bars, text and effects stand upright.
// - Picking, the drag box, enemy facing and near/far overlap follow the screen.
// - Wide field: everything that stands (units, enemies, bars, effects) is drawn at BODY (half) size while the field,
//   the path and the ranges keep their size. That reads as a field with 4× the area and 2× the ranges for the same
//   units; manmul/beta-play.js halves the unit footprints to match, so 4× as many units fit.
// - Camera: mouse wheel zooms around the cursor (up to ZOOM_MAX). Right drag pans when no unit is selected (with a
//   selection the right button still moves units), wheel-button drag pans too, and the mouse at a window edge scrolls.
// Game rules are unchanged apart from the square path. Loaded after manmul/game.js; replaces some of its globals.
(function(root){
 if(!root.COMBINADE_REDESIGN||typeof drawScene!=='function')return;
 const ANGLE=Math.PI/4,SQUASH=.5;// 2:1 like classic isometric tiles
 const co=Math.cos(ANGLE),si=Math.sin(ANGLE);
 const L={a:co,b:SQUASH*si,c:-si,d:SQUASH*co};// canvas order: x' = a*x + c*y, y' = b*x + d*y
 const det=L.a*L.d-L.b*L.c,Li={a:L.d/det,b:-L.b/det,c:-L.c/det,d:L.a/det};
 const project=(x,y)=>({x:L.a*x+L.c*y,y:L.b*x+L.d*y});
 const unproject=(x,y)=>({x:Li.a*x+Li.c*y,y:Li.b*x+Li.d*y});
 const depth=(x,y)=>L.b*x+L.d*y;// larger = lower on screen = nearer

 // Square field centred on the world centre (500,350). Path lap 2*(600+600) = 2400, as before.
 const CX=world.w/2,CY=world.h/2,PATH=600,INNER_GAP=40,EDGE=45,PATH_HALF=24;
 Object.assign(world.outer,{x:CX-PATH/2,y:CY-PATH/2,w:PATH,h:PATH});
 Object.assign(world.inner,{x:world.outer.x+INNER_GAP,y:world.outer.y+INNER_GAP,w:PATH-2*INNER_GAP,h:PATH-2*INNER_GAP});
 const field={x:world.outer.x-EDGE,y:world.outer.y-EDGE,w:PATH+2*EDGE,h:PATH+2*EDGE};
 const THICK=20,HEADROOM=46*.5+10;// platform side height and room above the far corner for standing sprites (world units)

 const BODY=.5,TEXT=.75,ZOOM_MAX=3;
 const camera={zoom:1,x:0,y:0};// player camera (screen pixels); the intro camera is applied on top of the default view
 function baseTransform(){
  const m=stageMetrics(),top=84,bottom=90,avail=STAGE_H-top-bottom,hw=field.w/2,hh=field.h/2;
  const spanX=2*project(hw,-hh).x,spanY=2*project(hw,hh).y+THICK+HEADROOM;
  const s=Math.min(STAGE_W/spanX,avail/spanY)*.97,S=s*m.scale;
  const cx=m.left+STAGE_W/2*m.scale,cy=m.top+(top+avail/2+(HEADROOM-THICK)/2*s)*m.scale;
  return {S,cx,cy,w:STAGE_W*m.scale,h:avail*m.scale};
 }
 transform=function(){
  const b=baseTransform(),z=introRemaining>0?1:camera.zoom,S=b.S*z,cx=b.cx+(z===1?0:camera.x),cy=b.cy+(z===1?0:camera.y);
  // x/y/scale keep their old meaning (field centre = x + world.w*scale/2) for code that only needs the centre.
  return {scale:S,ky:1,x:cx-world.w*S/2,y:cy-world.h*S/2,cx,cy,quarter:true,zoom:z};
 };
 function clampCamera(){
  const b=baseTransform(),z=camera.zoom=Math.max(1,Math.min(ZOOM_MAX,camera.zoom));
  const mx=(z-1)*b.w/2,my=(z-1)*b.h/2;camera.x=Math.max(-mx,Math.min(mx,camera.x));camera.y=Math.max(-my,Math.min(my,camera.y));
  if(z<=1.001){camera.zoom=1;camera.x=0;camera.y=0}
 }
 // Zoom by factor around a screen point, keeping the ground under it in place.
 function zoomAt(px,py,factor){
  const b=baseTransform(),z0=camera.zoom,z1=Math.max(1,Math.min(ZOOM_MAX,z0*factor));if(z1===z0)return;
  const ox=b.cx+camera.x,oy=b.cy+camera.y;camera.x=px-b.cx-(px-ox)*z1/z0;camera.y=py-b.cy-(py-oy)*z1/z0;camera.zoom=z1;clampCamera();
 }
 function resetCamera(){camera.zoom=1;camera.x=0;camera.y=0}
 let pan=null,pointer=null,edgeAt=0;// pointer: last mouse position in the window, for edge scrolling
 const hasSelection=()=>units.some(u=>selected.includes(u.id));
 if(typeof canvas==='object'&&canvas&&typeof canvas.addEventListener==='function'){
  canvas.addEventListener('wheel',e=>{if(introRemaining>0)return;e.preventDefault();zoomAt(e.clientX,e.clientY,Math.exp(-Math.max(-120,Math.min(120,e.deltaY))*.0018))},{passive:false});
  canvas.addEventListener('mousedown',e=>{if(e.button===1)e.preventDefault()},true);// no browser auto-scroll
  // Pan: right drag when no unit is selected (with a selection the right button moves the units), or wheel-button drag.
  canvas.addEventListener('pointerdown',e=>{
   if(introRemaining>0||(typeof spectate!=='undefined'&&spectate))return;
   if(!(e.button===1||(e.button===2&&!hasSelection())))return;
   e.preventDefault();e.stopImmediatePropagation();
   pan={id:e.pointerId,x:e.clientX,y:e.clientY,moved:false};try{canvas.setPointerCapture(e.pointerId)}catch(err){}
  },true);
  canvas.addEventListener('pointermove',e=>{
   if(!pan||e.pointerId!==pan.id)return;const dx=e.clientX-pan.x,dy=e.clientY-pan.y;
   if(!pan.moved&&Math.hypot(dx,dy)<4)return;
   if(!pan.moved){pan.moved=true;canvas.style.cursor='grabbing'}
   pan.x=e.clientX;pan.y=e.clientY;camera.x+=dx;camera.y+=dy;clampCamera();
  },true);
  const end=e=>{if(!pan||e.pointerId!==pan.id)return;if(pan.moved)canvas.style.cursor='';pan=null};
  canvas.addEventListener('pointerup',end,true);canvas.addEventListener('pointercancel',end,true);
 }
 if(typeof addEventListener==='function'){
  addEventListener('mousemove',e=>{pointer={x:e.clientX,y:e.clientY}});
  addEventListener('mouseout',e=>{if(!e.relatedTarget)pointer=null});
  addEventListener('blur',()=>{pointer=null});
 }
 // Edge scrolling: while zoomed in, the mouse at a window edge moves the view that way (faster nearer the edge).
 const SCROLL_EDGE=26,SCROLL_SPEED=900;
 function edgeScroll(){
  const now=typeof performance==='object'?performance.now()/1000:0,dt=Math.min(.05,Math.max(0,now-edgeAt));edgeAt=now;
  if(!pointer||pan||camera.zoom<=1||introRemaining>0||typeof innerWidth!=='number')return;
  if(typeof document==='object'&&document.querySelector?.('#modal')?.classList?.contains('hidden')===false)return;
  const push=d=>d<SCROLL_EDGE?(1-Math.max(0,d)/SCROLL_EDGE):0;
  const vx=push(pointer.x)-push(innerWidth-1-pointer.x),vy=push(pointer.y)-push(innerHeight-1-pointer.y);
  if(!vx&&!vy)return;camera.x+=vx*SCROLL_SPEED*dt;camera.y+=vy*SCROLL_SPEED*dt;clampCamera();
 }

 applyWorldTransform=function(t){
  if(!t.quarter){ctx.translate(t.x,t.y);ctx.scale(t.scale,t.scale);return}
  ctx.translate(t.cx,t.cy);ctx.transform(L.a*t.scale,L.b*t.scale,L.c*t.scale,L.d*t.scale,0,0);ctx.translate(-CX,-CY);
 };
 function screenToWorld(x,y,t=transform()){const w=unproject((x-t.cx)/t.scale,(y-t.cy)/t.scale);return {x:w.x+CX,y:w.y+CY}}
 function toScreen(x,y,t=transform()){const v=project(x-CX,y-CY);return {x:t.cx+v.x*t.scale,y:t.cy+v.y*t.scale}}
 pos=function(e){return screenToWorld(e.clientX,e.clientY)};

 // Upright around a ground point: undo the ground projection locally, keeping the world scale.
 // k: size of the standing thing (BODY by default, see the header).
 function standUp(x,y,k=BODY){ctx.save();ctx.translate(x,y);ctx.transform(Li.a,Li.b,Li.c,Li.d,0,0);if(k!==1)ctx.scale(k,k);ctx.translate(-x,-y)}
 function upright(x,y,fn,k=BODY){standUp(x,y,k);try{return fn()}finally{ctx.restore()}}
 viewUprightBegin=function(x,y){standUp(x,y);return true};
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
  const wrap=name=>{const base=ctx[name];ctx[name]=function(text,x,y,...rest){standUp(x,y,TEXT);try{return base.call(ctx,text,x,y,...rest)}finally{ctx.restore()}}};
  wrap('fillText');wrap('strokeText');
  try{return fn()}finally{delete ctx.fillText;delete ctx.strokeText}
 }

 // ---- Ground (temporary code art) ----
 const C={grassA:'#2e4733',grassB:'#2a4230',inner:'#34503a',innerEdge:'#c9a86a',path:'#6d6254',pathSeam:'#574e43',pathEdge:'#3c352d',rim:'#1c2a20',sideL:'#1b2a20',sideR:'#24372a',sideLine:'#121c15'};
 function paintGround(g){
  const o=world.outer,i=world.inner,TILE=PATH/12;
  g.fillStyle=C.grassA;g.fillRect(field.x,field.y,field.w,field.h);
  g.fillStyle=C.grassB;
  for(let y=field.y,r=0;y<field.y+field.h-1e-6;y+=TILE*.75,r++)for(let x=field.x,q=0;x<field.x+field.w-1e-6;x+=TILE*.75,q++)if((r+q)%2)g.fillRect(x,y,Math.min(TILE*.75,field.x+field.w-x),Math.min(TILE*.75,field.y+field.h-y));
  // Placement area.
  g.fillStyle=C.inner;g.fillRect(i.x,i.y,i.w,i.h);
  g.strokeStyle='rgba(0,0,0,.18)';g.lineWidth=1;
  for(let x=i.x+TILE;x<i.x+i.w-1;x+=TILE){g.beginPath();g.moveTo(x,i.y);g.lineTo(x,i.y+i.h);g.stroke()}
  for(let y=i.y+TILE;y<i.y+i.h-1;y+=TILE){g.beginPath();g.moveTo(i.x,y);g.lineTo(i.x+i.w,y);g.stroke()}
  // Stone path along world.outer.
  g.beginPath();g.rect(o.x-PATH_HALF,o.y-PATH_HALF,o.w+2*PATH_HALF,o.h+2*PATH_HALF);g.rect(o.x+PATH_HALF,o.y+PATH_HALF,o.w-2*PATH_HALF,o.h-2*PATH_HALF);
  g.fillStyle=C.path;g.fill('evenodd');
  g.strokeStyle=C.pathSeam;g.lineWidth=2;
  for(let d=0;d<o.w;d+=TILE){for(const [x0,y0,x1,y1] of [[o.x+d,o.y-PATH_HALF,o.x+d,o.y+PATH_HALF],[o.x+d,o.y+o.h-PATH_HALF,o.x+d,o.y+o.h+PATH_HALF],[o.x-PATH_HALF,o.y+d,o.x+PATH_HALF,o.y+d],[o.x+o.w-PATH_HALF,o.y+d,o.x+o.w+PATH_HALF,o.y+d]]){g.beginPath();g.moveTo(x0,y0);g.lineTo(x1,y1);g.stroke()}}
  g.strokeStyle=C.pathEdge;g.lineWidth=3;
  g.strokeRect(o.x-PATH_HALF,o.y-PATH_HALF,o.w+2*PATH_HALF,o.h+2*PATH_HALF);g.strokeRect(o.x+PATH_HALF,o.y+PATH_HALF,o.w-2*PATH_HALF,o.h-2*PATH_HALF);
  g.strokeStyle=C.innerEdge;g.lineWidth=2;g.globalAlpha=.55;g.strokeRect(i.x,i.y,i.w,i.h);g.globalAlpha=1;
  g.strokeStyle=C.rim;g.lineWidth=3;g.strokeRect(field.x,field.y,field.w,field.h);
 }
 let groundLayer=null;
 // Hooks for finished art (manmul/beta-cartoon.js): ground image (drawn in screen space, since the world pass clips to
 // the world rectangle and would cut the platform sides), unit and enemy bodies, unit size for picking.
 const hooks={groundReady:null,groundScreen:null,unitBody:null,enemyBody:null,unitBox:null};
 drawBlendedArena=function(){
  if(hooks.groundReady&&hooks.groundReady())return;
  if(groundLayer===null&&typeof document==='object'&&typeof document.createElement==='function'){
   const layer=document.createElement('canvas'),g=layer?.getContext?.('2d');
   if(g){layer.width=world.w*2;layer.height=world.h*2;g.scale(2,2);paintGround(g);groundLayer=layer}else groundLayer=false;
  }
  if(groundLayer)ctx.drawImage(groundLayer,0,0,world.w,world.h);else paintGround(ctx);
 };
 drawArena=function(){paintGround(ctx)};
 drawForestBoundary=function(){};
 drawArenaIntro=function(){};
 drawArenaImpact=function(){};
 // Platform sides: the two near edges get a visible thickness (screen space, under the ground).
 const baseBackdrop=drawForestBackdrop;
 drawForestBackdrop=function(...a){
  if(!(hooks.backdrop&&hooks.backdrop()))baseBackdrop.apply(this,a);
  const t=transform(),cam=introRemaining>0?introCameraState():{zoom:1,x:0,y:0};
  const at=(x,y)=>{const p=toScreen(x,y,t);return {x:t.cx+(p.x-t.cx)*cam.zoom+cam.x*t.scale,y:t.cy+(p.y-t.cy)*cam.zoom+cam.y*t.scale}};
  if(hooks.groundScreen&&hooks.groundScreen(at(CX,CY),t.scale*cam.zoom))return;// the finished ground image has its own sides
  const left=at(field.x,field.y+field.h),bottom=at(field.x+field.w,field.y+field.h),right=at(field.x+field.w,field.y),h=THICK*t.scale*cam.zoom;
  ctx.save();ctx.fillStyle='rgba(0,0,0,.35)';ctx.beginPath();ctx.moveTo(left.x,left.y+h);ctx.lineTo(bottom.x,bottom.y+h+h*.6);ctx.lineTo(right.x,right.y+h);ctx.lineTo(right.x,right.y+h*1.6);ctx.lineTo(bottom.x,bottom.y+h*2.4);ctx.lineTo(left.x,left.y+h*1.6);ctx.closePath();ctx.fill();
  for(const [p,q,color] of [[left,bottom,C.sideL],[bottom,right,C.sideR]]){ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(q.x,q.y);ctx.lineTo(q.x,q.y+h);ctx.lineTo(p.x,p.y+h);ctx.closePath();ctx.fill();ctx.strokeStyle=C.sideLine;ctx.lineWidth=1;ctx.stroke()}
  ctx.restore();
 };

 // ---- Standing things ----
 const baseUnitSprite=drawUnitSprite;drawUnitSprite=function(unit,...rest){return upright(unit.x,unit.y,()=>(hooks.unitBody&&hooks.unitBody(unit))||baseUnitSprite.call(this,unit,...rest))};
 const baseUnitAura=drawUnitGradeAura;drawUnitGradeAura=function(unit,...rest){return upright(unit.x,unit.y,()=>baseUnitAura.call(this,unit,...rest))};
 // The grade base is already a flat ellipse in screen terms: keep it level with the screen, not turned with the ground.
 const baseUnitBase=drawUnitGradeBase;drawUnitGradeBase=function(unit,...rest){return upright(unit.x,unit.y,()=>baseUnitBase.call(this,unit,...rest))};
 // Enemies get a small shadow on the ground.
 const baseEnemySprite=drawEnemySprite;
 drawEnemySprite=function(enemy,point,...rest){
  const size=enemyVisualSize(enemy.kind);ctx.save();ctx.fillStyle='rgba(0,0,0,.32)';ctx.beginPath();ctx.ellipse(point.x,point.y+1,size*.34,size*.12,0,0,Math.PI*2);ctx.fill();ctx.restore();
  return enemyBody(enemy,point,...rest);
 };
 function enemyBody(enemy,point,...rest){return (hooks.enemyBody&&hooks.enemyBody(enemy,point,...rest))||baseEnemySprite(enemy,point,...rest)}
 // Face the way the enemy moves on screen.
 enemyFacing=function(distance){const a=pathPoint(distance),b=pathPoint(distance+2),v=project(b.x-a.x,b.y-a.y);return v.x>=0?1:-1};
 if(typeof drawSkillFx==='function'){const base=drawSkillFx;drawSkillFx=function(...a){return uprightImages(()=>base.apply(this,a),.5)}}
 if(typeof drawArrivalEffects==='function'){const base=drawArrivalEffects;drawArrivalEffects=function(...a){return uprightImages(()=>base.apply(this,a),.85)}}
 const baseFeedback=drawCombatFeedback;drawCombatFeedback=function(...a){return uprightText(()=>baseFeedback.apply(this,a))};

 // ---- Depth ----
 // Sizes on the ground plane in world units, at BODY size.
 const unitFoot=u=>(hooks.unitBox?.(u)?.foot??0)*BODY;// finished art stands on the grade base, below unit.y
 const unitHalfW=u=>(hooks.unitBox?.(u)?.halfW??Math.max(types[u.type].radius/BODY+5,15*unitVisualScale(u)))*BODY,unitHeight=u=>(hooks.unitBox?.(u)?.height??26*unitVisualScale(u))*BODY;
 const baseScene=drawScene;
 drawScene=function(...a){
  if(!spectateDrawing)edgeScroll();
  const saveUnits=units,saveEnemies=enemies;
  units=[...units].sort((p,q)=>depth(p.x,p.y)-depth(q.x,q.y));
  enemies=enemies.map(e=>{const p=pathPoint(e.d);return [depth(p.x,p.y),e]}).sort((p,q)=>p[0]-q[0]).map(x=>x[1]);
  try{baseScene.apply(this,a);drawOverlaps()}finally{units=saveUnits;enemies=saveEnemies}
 };
 // Enemies are drawn before units. An enemy nearer than an overlapping unit is drawn again on top; an enemy behind a
 // unit gets a faint see-through copy so it is never lost.
 function drawOverlaps(){
  if(introRemaining>0||!enemies.length||!units.length)return;
  const front=[],ghost=[];
  for(const e of enemies){
   const p=pathPoint(e.d),eh=enemyVisualSize(e.kind)*BODY,ew=eh*.5;let near=false,behind=false;
   for(const u of units){const v=project(u.x-p.x,u.y-p.y);v.y+=unitFoot(u);if(Math.abs(v.x)>=unitHalfW(u)+ew||v.y<=-eh||v.y-unitHeight(u)>=0)continue;if(v.y>0)behind=true;else near=true}
   if(behind)ghost.push(e);else if(near)front.push(e);
  }
  if(!front.length&&!ghost.length)return;
  const t=transform();ctx.save();applyWorldTransform(t);
  for(const e of front){const p=pathPoint(e.d);upright(p.x,p.y,()=>enemyBody(e,p))}
  ctx.globalAlpha=.42;
  for(const e of ghost){const p=pathPoint(e.d);upright(p.x,p.y,()=>enemyBody(e,p))}
  ctx.restore();
 }

 // ---- Picking and drag selection (screen based) ----
 unitHit=function(u,p){const v=project(p.x-u.x,p.y-u.y),f=unitFoot(u);return Math.abs(v.x)<=unitHalfW(u)&&v.y<=f+8&&v.y>=f-unitHeight(u)};
 enemyHit=function(e,p){const q=pathPoint(e.d),size=Math.max(14,enemyVisualSize(e.kind)*BODY),v=project(p.x-q.x,p.y-q.y);return Math.abs(v.x)<=size*.45&&v.y<=4&&v.y>=-size};
 unitsInBox=function(a,b){
  const t=transform(),A=toScreen(a.x,a.y,t),B=toScreen(b.x,b.y,t),x1=Math.min(A.x,B.x),x2=Math.max(A.x,B.x),y1=Math.min(A.y,B.y),y2=Math.max(A.y,B.y);
  return units.filter(u=>{const f=toScreen(u.x,u.y,t);f.y+=unitFoot(u)*t.scale;const mid=f.y-unitHeight(u)*t.scale/2;return f.x>=x1&&f.x<=x2&&((f.y>=y1&&f.y<=y2)||(mid>=y1&&mid<=y2))});
 };
 drawDragBox=function(d){
  const t=transform(),A=toScreen(d.x,d.y,t),B=toScreen(d.end.x,d.end.y,t);
  const corners=[[A.x,A.y],[B.x,A.y],[B.x,B.y],[A.x,B.y]].map(([x,y])=>screenToWorld(x,y,t));
  ctx.save();ctx.strokeStyle='#dcf9b3';ctx.fillStyle='rgba(220,249,179,.08)';ctx.lineWidth=1.5/t.scale;ctx.beginPath();corners.forEach((c,i)=>i?ctx.lineTo(c.x,c.y):ctx.moveTo(c.x,c.y));ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();
 };

 root.ManmulBetaView={edgeScroll,setPointer:p=>{pointer=p;edgeAt=typeof performance==='object'?performance.now()/1000:0},angle:45,squash:SQUASH,field,toScreen,screenToWorld,depth,project,upright,center:{x:CX,y:CY},hooks,BODY,camera,zoomAt,resetCamera};
})(globalThis);
