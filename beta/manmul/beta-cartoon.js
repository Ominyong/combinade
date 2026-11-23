'use strict';
// Beta only: draws the finished cartoon art (assets/cartoon/, listed in manmul/cartoon-manifest.js) on the quarter view
// (manmul/beta-view.js). Each unit and each enemy view is one 256×256 picture with its ground point at (128, 236);
// idle, attack, walk, hit and death motion are made here in code. Units and enemies without cartoon art keep the
// old pixel sprites. Add art, then run: node tools/unit-redesign/make-cartoon-manifest.cjs
// `?cartoon-fill` in the address makes every enemy stage borrow the cartoon enemies there are (preview only).
(function(root){
 const view=root.ManmulBetaView,list=root.ManmulCartoon;
 if(!root.COMBINADE_REDESIGN||!view||!list||typeof Image==='undefined')return;
 const ANCHOR_X=128,ANCHOR_Y=236,BOX=210;// ground point and art box of every picture
 const STAGE_SCALE=1.2713762819694192;// world→screen scale of the quarter view at the 1600×900 stage
 // On-screen height of the art box by grade at the 1600×900 stage.
 const GRADE_PX={'노말':56,'매직':62,'레어':68,'에픽':74,'유니크':80,'레전더리':88,'신수':96,'재앙':96,'역설':96,'천체':96};
 const ENEMY_BODY=1.45;// cartoon enemy height = enemyVisualSize × this (world units)
 const fill=typeof location==='object'&&/[?&]cartoon-fill\b/.test(location.search||'');

 const load=src=>{const img=new Image();img.decoding='async';img.src=src;return img};
 const ready=img=>!!(img&&img.complete&&img.naturalWidth>0);
 const unitIds=new Set(list.units),unitImages=new Map(),enemyImages=new Map();
 function unitImage(id){if(!unitIds.has(id))return null;if(!unitImages.has(id))unitImages.set(id,load(`assets/cartoon/units/${id}.png`));return unitImages.get(id)}
 function enemyViews(index){
  let n=index+1;if(!list.enemies.includes(n)){if(!fill||!list.enemies.length)return null;n=list.enemies[index%list.enemies.length]}
  if(!enemyImages.has(n)){const k=String(n).padStart(2,'0');enemyImages.set(n,{front:load(`assets/cartoon/enemies/enemy-${k}-front.png`),back:load(`assets/cartoon/enemies/enemy-${k}-back.png`)})}
  return enemyImages.get(n);
 }
 // White silhouette of a picture, for the hit flash (made once per picture).
 const flashCache=new Map();
 function whiteOf(img){
  if(flashCache.has(img))return flashCache.get(img);
  let c=null;try{c=document.createElement('canvas');c.width=img.naturalWidth||img.width;c.height=img.naturalHeight||img.height;const g=c.getContext('2d');g.drawImage(img,0,0);g.globalCompositeOperation='source-in';g.fillStyle='#fff';g.fillRect(0,0,c.width,c.height)}catch(e){c=null}
  flashCache.set(img,c);return c;
 }
 // Pictures shrunk ahead of time to the size they appear on screen: drawing a 256px picture at 60px every frame is
 // slower and its outline shimmers. Halving step by step keeps the thick outline clean. Cached per picture and size.
 const sizeCache=new Map();
 function scaledOf(img,f){
  if(!(f>0&&f<.85)||typeof document!=='object'||typeof document.createElement!=='function')return img;
  const step=Math.round(f*32)/32||1/32,key=Math.round(step*32);let bySize=sizeCache.get(img);if(!bySize)sizeCache.set(img,bySize=new Map());
  if(bySize.has(key))return bySize.get(key)||img;
  let out=null;try{
   let src=img,w=img.naturalWidth||img.width,h=img.naturalHeight||img.height;const tw=Math.max(1,Math.round(w*step)),th=Math.max(1,Math.round(h*step));
   while(w/2>=tw){const c=document.createElement('canvas');c.width=Math.round(w/2);c.height=Math.round(h/2);const g=c.getContext('2d');g.imageSmoothingQuality='high';g.drawImage(src,0,0,c.width,c.height);src=c;w=c.width;h=c.height}
   const c=document.createElement('canvas');c.width=tw;c.height=th;const g=c.getContext('2d');g.imageSmoothingQuality='high';g.drawImage(src,0,0,tw,th);out=c;
  }catch(e){out=null}
  if(bySize.size>6)bySize.delete(bySize.keys().next().value);
  bySize.set(key,out);return out||img;
 }
 function paint(img,x,y,k,{facing=1,sx=1,sy=1,dx=0,dy=0,tilt=0,alpha=1,flash=0}={}){
  ctx.save();ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
  ctx.translate(x,y);ctx.scale(facing,1);ctx.rotate(tilt);ctx.scale(k*sx,k*sy);ctx.translate(dx,dy);
  if(alpha<1)ctx.globalAlpha*=alpha;
  const m=typeof ctx.getTransform==='function'?ctx.getTransform():null,pic=m&&Number.isFinite(m.a)?scaledOf(img,Math.hypot(m.a,m.b)):img;
  const W=img.naturalWidth||256,H=img.naturalHeight||256;
  ctx.drawImage(pic,-ANCHOR_X,-ANCHOR_Y,W,H);
  if(flash>0){const w=whiteOf(pic);if(w){ctx.globalAlpha*=flash;ctx.drawImage(w,-ANCHOR_X,-ANCHOR_Y,W,H)}}
  ctx.restore();
 }
 const ease=q=>1-(1-q)*(1-q);
 // Turning (left/right, and front/back for enemies) narrows the old view and widens the new one over 0.14 s
 // instead of flipping in a single frame.
 function turning(obj,facing,back,now){
  let s=obj.cartoonTurn;if(!s)s=obj.cartoonTurn={f:facing,back,pf:facing,pback:back,at:-9};
  if(s.f!==facing||s.back!==back){s.pf=s.f;s.pback=s.back;s.f=facing;s.back=back;s.at=now}
  const p=(now-s.at)/.14;if(!(p>=0&&p<1))return {f:s.f,back:s.back};
  const first=p<.5,w=Math.max(.12,first?1-p*2:p*2-1);return {f:(first?s.pf:s.f)*w,back:first?s.pback:s.back};
 }

 // ---- Units ----
 const unitScale=u=>(GRADE_PX[types[u.type]?.grade]||64)/STAGE_SCALE/BOX;// world units per picture pixel
 function unitFacing(u,attackAge){
  // Face the current target on screen while fighting, the way it walks while moving, otherwise keep the last facing.
  let dx=0,dy=0;
  if(attackAge<1.5&&u.lastBasicTargetId!=null){const e=enemies.find(x=>x.id===u.lastBasicTargetId);if(e){const p=pathPoint(e.d);dx=p.x-u.x;dy=p.y-u.y}}
  if(!dx&&!dy&&Math.hypot(u.tx-u.x,u.ty-u.y)>1){dx=u.tx-u.x;dy=u.ty-u.y}
  if(dx||dy){const v=view.project(dx,dy);if(Math.abs(v.x)>.01)u.cartoonFacing=v.x<0?-1:1}
  return u.cartoonFacing||1;
 }
 function unitBody(u){
  // A unit born from a fusion stays hidden inside the whirlwind, then pops out (see transformations below).
  const pop=popScale(u);if(pop===0)return true;
  const img=unitImage(u.type);if(!ready(img))return false;
  const now=combatTime,age=now-(u.artAttackAt??-10),phase=((u.id||0)*1.7)%(Math.PI*2),moving=Math.hypot(u.tx-u.x,u.ty-u.y)>1;
  const m={facing:turning(u,unitFacing(u,age),false,now).f};
  if(pop!==1){m.sx=pop;m.sy=pop;paint(img,u.x,unitFootY(u),unitScale(u),m);return true}
  if(age>=0&&age<.42){
   // Attack: crouch, spring toward the target, settle back.
   const p=age/.42;
   if(p<.25){const q=p/.25;m.sx=1+.1*q;m.sy=1-.13*q}
   else if(p<.5){const q=(p-.25)/.25;m.sx=1.1-.16*q;m.sy=.87+.21*q;m.dx=16*q;m.tilt=.09*q}
   else{const q=ease((p-.5)/.5);m.sx=.94+.06*q;m.sy=1.08-.08*q;m.dx=16*(1-q);m.tilt=.09*(1-q)}
  }else if(moving){const w=Math.sin(now*13+phase);m.dy=-Math.abs(w)*10;m.tilt=w*.06;m.sy=1+.03*Math.abs(w)}
  else{const b=Math.sin(now*2.6+phase);m.sy=1+.028*b;m.sx=1-.018*b}
  paint(img,u.x,unitFootY(u),unitScale(u),m);return true;
 }
 const unitBox=u=>{if(!ready(unitImage(u.type)))return null;const h=BOX*unitScale(u);return {halfW:h*.42,height:h,foot:unitFootY(u)-u.y}};

 // ---- Enemies ----
 function enemyBody(enemy,point,deathAge=null){
  const views=enemyViews(enemyStageIndex(enemy.spawnWave));if(!views)return false;
  const a=pathPoint(enemy.d||0),b=pathPoint((enemy.d||0)+2),v=view.project(b.x-a.x,b.y-a.y);
  const now=combatTime,turn=deathAge===null?turning(enemy,v.x>=0?1:-1,v.y<0,now):{f:v.x>=0?1:-1,back:v.y<0};
  const img=turn.back?views.back:views.front;if(!ready(img))return false;
  const k=enemyVisualSize(enemy.kind)*ENEMY_BODY/BOX,phase=((enemy.id||0)*2.3)%(Math.PI*2);
  const m={facing:turn.f};
  if(deathAge!==null){
   // Death: flash, squash flat and fade.
   const q=Math.min(1,deathAge/enemyDeathDuration);m.sy=1-.65*q;m.sx=1+.35*q;m.alpha=1-q;m.flash=Math.max(0,1-q*4);
  }else{
   const w=Math.sin(now*11+phase);m.dy=-Math.abs(w)*7;m.tilt=w*.07;m.sy=1-.03*Math.abs(w);
   // Hit flash: the picture turns white for a moment when the enemy loses health. An enemy hit by many units at once
   // would stay white all the time, so a new flash starts at most every 0.3 s and is kept light.
   if(enemy.cartoonHp!==undefined&&enemy.hp<enemy.cartoonHp&&!(now-(enemy.cartoonHitAt??-9)<.3))enemy.cartoonHitAt=now;enemy.cartoonHp=enemy.hp;
   if(enemy.cartoonHitAt!==undefined)m.flash=Math.max(0,1-(now-enemy.cartoonHitAt)/.1)*.45;
  }
  paint(img,point.x,point.y,k,m);return true;
 }

 // ---- Ground and backdrop, per map skin ----
 // assets/cartoon/arena/<skin>/arena.png and backdrop.png; a skin without its own art uses the forest (default) art,
 // and without that the code ground and the old backdrop stay. The older arena/arena.png and backdrop.png count as forest.
 const arenaSkins=new Set(list.arenas||(list.arena?['forest']:[])),backdropSkins=new Set(list.backdrops||(list.backdrop?['forest']:[]));
 const groundImages=new Map();
 function skinImage(kind,skins,legacy){
  let skin=(typeof playerProfile==='object'&&playerProfile?.mapSkin)||'forest';if(!skins.has(skin))skin='forest';if(!skins.has(skin))return null;
  const src=skin==='forest'&&legacy?`assets/cartoon/arena/${kind}.png`:`assets/cartoon/arena/${skin}/${kind}.png`;
  if(!groundImages.has(src))groundImages.set(src,load(src));return groundImages.get(src);
 }
 const arenaImage=()=>skinImage('arena',arenaSkins,list.legacyArena??!!list.arena);
 const backdropImage=()=>skinImage('backdrop',backdropSkins,list.legacyBackdrop??!!list.backdrop);
 // The backdrop fills the screen (cover) around the field centre and follows the intro camera, like the old skin backdrops.
 function backdropScreen(){
  const img=backdropImage();if(!ready(img))return false;
  const iw=img.naturalWidth,ih=img.naturalHeight,cam=introRemaining>0?introCameraState():{zoom:1,x:0,y:0},t=transform();
  const s=Math.max(innerWidth/iw,innerHeight/ih)*1.06*cam.zoom,w=iw*s,h=ih*s,cx=(t.cx??innerWidth/2)+cam.x*t.scale,cy=(t.cy??innerHeight/2)+cam.y*t.scale;
  ctx.save();ctx.fillStyle='#101d19';ctx.fillRect(0,0,innerWidth,innerHeight);ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';ctx.drawImage(img,cx-w/2,cy-h/2,w,h);ctx.restore();return true;
 }
 // arena.png is 1280×760 at the 1600×900 stage with the field centre at (640, 390); `scale` is the current world→screen scale.
 function groundScreen(centre,scale){
  const arena=arenaImage();if(!ready(arena))return false;const k=scale/STAGE_SCALE;
  // The top 760 px (at 1280 wide) match the guide; a taller picture (e.g. 1280×960) hangs its cliff further down.
  // A 2× picture (2560 wide) is scaled down by its width.
  const w=arena.naturalWidth||1280,h=(arena.naturalHeight||760)*1280/w;
  ctx.save();ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';ctx.drawImage(arena,centre.x-640*k,centre.y-390*k,1280*k,h*k);ctx.restore();return true;
 }

 const baseBarY=enemyBarY;
 enemyBarY=function(enemy,point){const views=enemyViews(enemyStageIndex(enemy.spawnWave));return views&&ready(views.front)?point.y-enemyVisualSize(enemy.kind)*ENEMY_BODY*.92-4:baseBarY(enemy,point)};
 Object.assign(view.hooks,{unitBody,enemyBody,unitBox,groundScreen,groundReady:()=>ready(arenaImage()),backdrop:backdropScreen});
 // ---- Fusion transformation (cartoon "evolution" whirlwind) ----
 // The materials spiral into the spot where the result appears, a whirlwind in the result's grade colour wraps it,
 // a white flash bursts, and the result pops out with a small overshoot. Used for fusions and conversions.
 const SWIRL=.45,FLASH=.1,POP=.4,TRANSFORM=SWIRL+FLASH+POP;
 const clock=()=>typeof performance==='object'&&performance.now?performance.now()/1000:combatTime;
 const transforms=[];let pendingMaterials=null;
 const snapshot=u=>({type:u.type,x:u.x,y:unitFootY(u),lift:unitLift(u)});
 function popScale(u){
  const t=u.cartoonPopAt;if(t===undefined)return 1;const p=clock()-t;
  if(p<SWIRL+FLASH*.5)return 0;const q=(p-SWIRL-FLASH*.5)/(POP+FLASH*.5);if(q>=1){delete u.cartoonPopAt;return 1}
  // 0 → 1.25 → 1 (back-out ease)
  return q<.6?1.25*ease(q/.6):1.25-.25*ease((q-.6)/.4);
 }
 const baseCombine=combine;
 combine=function(index,...rest){
  const r=recipes[index],ids=r?selectedRecipeMatches(r):null;
  pendingMaterials=ids?units.filter(u=>ids.includes(u.id)).map(snapshot):null;
  try{return baseCombine.call(this,index,...rest)}finally{pendingMaterials=null}
 };
 const baseConvert=convertUnit;
 convertUnit=function(id,...rest){
  const u=units.find(x=>x.id===id);pendingMaterials=u?[snapshot(u)]:null;
  try{return baseConvert.call(this,id,...rest)}finally{pendingMaterials=null}
 };
 const baseArrival=showArrivalEffect;
 showArrivalEffect=function(key,unit,...rest){
  if(!pendingMaterials||key==='summon')return baseArrival.call(this,key,unit,...rest);
  // A fusion or conversion: the whirlwind replaces the old pixel arrival sheet; the sound stays.
  globalThis.ManmulSound?.play('fuse',{grade:key});
  const start=clock();unit.cartoonPopAt=start;
  transforms.push({unit,start,color:gradeColors[key]||'#ffe9a8',materials:pendingMaterials,x:unit.x,y:unitFootY(unit)});
 };
 function star(x,y,r,color){ctx.beginPath();for(let i=0;i<8;i++){const a=i*Math.PI/4,d=i%2?r*.35:r;ctx.lineTo(x+Math.cos(a)*d,y+Math.sin(a)*d)}ctx.closePath();ctx.fillStyle=color;ctx.fill()}
 // Fusion pictures (assets/cartoon/fusion/): whirl-back/whirl-front 8-frame loops and sparkle are drawn white and
 // tinted with the result's grade colour here; flash and puff keep their own colours. Missing pictures fall back to
 // the code-drawn whirlwind.
 const fusionNames=new Set(list.fusion||[]),fusionImages=new Map(),tintCache=new Map();
 function fusionImage(name){if(!fusionNames.has(name))return null;if(!fusionImages.has(name))fusionImages.set(name,load(`assets/cartoon/fusion/${name}.png`));const img=fusionImages.get(name);return ready(img)?img:null}
 function tinted(img,color){
  const key=img.src+'|'+color;if(tintCache.has(key))return tintCache.get(key);let c=null;
  try{c=document.createElement('canvas');c.width=img.naturalWidth;c.height=img.naturalHeight;const g=c.getContext('2d');
   // Tint the white strokes lightly (40 %) with the grade colour, keeping the picture's own transparency: a full
   // multiply made the wind vanish on same-coloured ground (green magic whirlwind on grass).
   g.drawImage(img,0,0);g.globalCompositeOperation='source-atop';g.globalAlpha=.4;g.fillStyle=color;g.fillRect(0,0,c.width,c.height);
  }catch(e){c=null}
  tintCache.set(key,c);return c||img;
 }
 // One frame of a horizontal sheet; (ax, ay) is the frame's anchor in sheet pixels, drawn at (x, y) with `k` world units per pixel.
 function sheetFrame(img,frame,cell,x,y,k,ax,ay,alpha=1){
  const ch=img.naturalHeight||img.height;ctx.save();// a tinted copy is a canvas, which has no naturalHeightctx.globalAlpha*=alpha;ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
  ctx.drawImage(img,frame*cell,0,cell,ch,x-ax*k,y-ay*k,cell*k,ch*k);ctx.restore();
 }
 // Two passes so the materials and the new unit sit inside the whirlwind: 'back' before the units, 'front' after them.
 function drawTransforms(layer){
  const now=clock();
  for(let i=transforms.length-1;i>=0;i--){
   const fx=transforms[i],p=now-fx.start;if(p>=TRANSFORM+.25||!units.includes(fx.unit)){if(layer==='front')transforms.splice(i,1);continue}
   const cx=fx.x,cy=fx.y,h=Math.max(28,(unitBox(fx.unit)?.height||30)),mid=cy-h*.45;
   const whirl=p<SWIRL+FLASH?Math.min(1,p/.12):Math.max(0,1-(p-SWIRL-FLASH)/.2);
   const back=fusionImage('whirl-back'),front=fusionImage('whirl-front'),pictures=back&&front;
   view.upright(cx,cy,()=>{
    ctx.save();
    if(pictures){
     // Pictures: about 18 frames a second, sized so the whirlwind (about 200 px tall in the sheet) wraps the new unit.
     const frame=Math.floor(p*18)%8,k=h*1.4/200;
     if(whirl>0)sheetFrame(tinted(layer==='back'?back:front,fx.color),frame,256,cx,cy,k,128,236,whirl);

     if(layer==='back')drawMaterials(fx,p,cx,cy,mid);
     if(layer==='front'){
      const sparkle=fusionImage('sparkle');
      if(sparkle&&whirl>0)for(let j=0;j<5;j++){const a=p*8+j*1.26,r=h*.55+6*Math.sin(p*6+j);sheetFrame(tinted(sparkle,'#fff7c2'),(Math.floor(p*12)+j)%4,64,cx+Math.cos(a)*r,mid+Math.sin(a)*r*.4,h*.4/64,32,32,whirl)}
      const flash=fusionImage('flash'),f=(p-SWIRL)/(FLASH+.2);
      if(flash&&f>=0&&f<1)sheetFrame(flash,Math.min(5,Math.floor(f*6)),256,cx,mid,h*1.7/256,128,128);
      const puff=fusionImage('puff'),q=(p-SWIRL-FLASH*.5)/.45;
      if(puff&&q>=0&&q<1)sheetFrame(puff,Math.min(5,Math.floor(q*6)),256,cx,cy,h*1.6/256,128,236);
     }
    }else if(layer==='front'){
     codeWhirl(fx,p,cx,cy,h,mid,whirl,true);
     drawMaterials(fx,p,cx,cy,mid);
     const f=(p-SWIRL)/(FLASH+.15);
     if(f>0&&f<1){
      ctx.globalAlpha=1-f;ctx.fillStyle='#ffffff';ctx.beginPath();ctx.arc(cx,mid,8+f*26,0,Math.PI*2);ctx.fill();
      ctx.strokeStyle=fx.color;ctx.lineWidth=3;for(let k=0;k<10;k++){const a=k*Math.PI/5+.3,r0=10+f*20,r1=r0+10+f*14;ctx.beginPath();ctx.moveTo(cx+Math.cos(a)*r0,mid+Math.sin(a)*r0);ctx.lineTo(cx+Math.cos(a)*r1,mid+Math.sin(a)*r1);ctx.stroke()}
     }
    }
    ctx.restore();
   });
  }
 }
 // Code-drawn whirlwind: stacked spinning rings in the grade colour and white (and small stars when no sparkle picture).
 function codeWhirl(fx,p,cx,cy,h,mid,whirl,stars){
  if(!(whirl>0))return;ctx.save();ctx.lineCap='round';
  for(let j=0;j<6;j++){
   const y=cy-4-j*h*.17,rx=9+j*4.2*(1+p),ry=rx*.32,a0=p*14+j*1.1;
   ctx.globalAlpha=whirl*(.55+.08*j);ctx.lineWidth=3.2;ctx.strokeStyle=j%2?'#ffffff':fx.color;
   ctx.beginPath();ctx.ellipse(cx,y,rx,ry,0,a0,a0+Math.PI*1.25);ctx.stroke();
  }
  if(stars)for(let k=0;k<6;k++){const a=p*9+k*1.05,r=16+6*Math.sin(p*7+k);ctx.globalAlpha=whirl*.9;star(cx+Math.cos(a)*r,mid+Math.sin(a)*r*.45-6*Math.sin(p*5+k),2.6,k%2?'#fff7c2':'#ffffff')}
  ctx.restore();
 }
 // The materials spiral in toward the middle of the whirlwind, shrinking.
 function drawMaterials(fx,p,cx,cy,mid){
  if(p>=SWIRL)return;const q=p/SWIRL;
  fx.materials.forEach(m=>{
   const sx=m.x-cx,sy=m.y-cy,d0=Math.max(14,Math.hypot(sx,sy)),a0=Math.atan2(sy,sx),a=a0+q*q*Math.PI*3,d=d0*(1-ease(q));
   const x=cx+Math.cos(a)*d,y=mid+Math.sin(a)*d*.45,s=1-q*.75,img=unitImage(m.type);
   ctx.globalAlpha=1;
   if(ready(img)){const kk=(GRADE_PX[types[m.type]?.grade]||64)/STAGE_SCALE/BOX;paint(img,x,y+BOX*kk*.45,kk,{sx:s,sy:s,tilt:a*.3})}
   else{ctx.fillStyle=gradeColors[types[m.type]?.grade]||'#fff';ctx.beginPath();ctx.arc(x,y,7*s,0,Math.PI*2);ctx.fill()}
  });
 }
 if(typeof drawArrivalEffects==='function'){const baseArrivalFx=drawArrivalEffects;drawArrivalEffects=function(...a){const r=baseArrivalFx.apply(this,a);drawTransforms('back');return r}}

 // ---- Shared attack effects (assets/cartoon/fx/<style>-<physical|magic>.png, 1536×256 = six 256px frames) ----
 // Each unit's basic attack is sorted into one of six styles from its basic-attack kind, and physical/magic from its
 // damage type. A style is drawn with the cartoon sheet once that sheet exists; until then the old pixel effect stays.
 const STYLE_OF_KIND={pierce:'pierce',chain:'chain',splash:'area',periodic_area:'area',slow:'slow',areaSlow:'slow',root:'slow',dot:'dot'};
 function attackStyle(typeId){
  const d=root.ManmulBasicData?.[typeId]||root.ManmulUpperBasicData?.[typeId]||{};
  return {style:STYLE_OF_KIND[d.kind]||'single',family:types[typeId]?.damage_type==='물리'?'physical':'magic',dot:d.kind==='dot'?(d.dotType||'poison'):null};
 }
 const fxNames=new Set(list.fx||[]),fxImages=new Map();
 function fxImage(name){if(!fxNames.has(name))return null;if(!fxImages.has(name))fxImages.set(name,load(`assets/cartoon/fx/${name}.png`));const img=fxImages.get(name);return ready(img)?img:null}
 const FX_FRAME=256,FX_SIZE=44,FX_PLAY=.36;// frame size in the sheet, on-field size (world units), impact play time
 const flying=s=>s==='single'||s==='pierce';
 // Height of the body centre above the ground point, so shots fly from chest to chest instead of along the floor.
 const unitLift=u=>{const box=unitBox(u);return box?box.height*.45:0};
 const enemyLift=e=>{const v=enemyViews(enemyStageIndex(e.spawnWave));return v&&ready(v.front)?enemyVisualSize(e.kind)*ENEMY_BODY*.45:0};
 const impacts=[];// impact animations of area/slow/dot/chain, played after the shot lands
 function frameAt(img,frame,x,y,angle,{w=FX_SIZE,h=FX_SIZE}={}){
  ctx.save();ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';ctx.translate(x,y);
  // Face the travel direction on screen: flip for leftward shots, tilt a little toward up/down.
  const left=Math.cos(angle)<0;ctx.scale(left?-1:1,1);ctx.rotate(left?Math.PI-angle:angle);
  ctx.drawImage(img,frame*FX_FRAME,0,FX_FRAME,FX_FRAME,-w/2,-h/2,w,h);ctx.restore();
 }
 const baseBasicFx=drawNormalBasicFx;
 drawNormalBasicFx=function(){
  drawTransforms('front');
  const now=combatTime,fallback=[];
  for(const shot of normalBasicProjectiles){
   const a=attackStyle(shot.type),sheet=fxImage(`${a.style}-${a.family}`),carrier=flying(a.style)||a.style==='chain'?sheet:fxImage(`single-${a.family}`);
   if(!sheet||!carrier){fallback.push(shot);continue}
   const unit=shot.unit,target=shot.target;
   const from=unit?{x:unit.x,y:unitFootY(unit),lift:unitLift(unit)}:{x:shot.x??shot.impact.x,y:shot.y??shot.impact.y,lift:0};
   const end=target?pathPoint(target.d):shot.impact,endLift=target?enemyLift(target):0;
   const screen=view.project(end.x-from.x,end.y-from.y),angle=Math.atan2(screen.y-(endLift-from.lift),screen.x);
   if(shot.hitAt!==null){
    // Landed: area/slow/dot/chain start their own animation once; flying styles show their two impact frames.
    if(!shot.cartoonImpact){shot.cartoonImpact=true;if(!flying(a.style))impacts.push({sheet,style:a.style,from,x:shot.impact.x,y:shot.impact.y,lift:endLift,angle,start:shot.hitAt})}
    if(flying(a.style)){const f=now-shot.hitAt<normalBasicImpact/2?4:5;view.upright(shot.impact.x,shot.impact.y,()=>frameAt(sheet,f,shot.impact.x,shot.impact.y-endLift,angle))}
    continue;
   }
   if(a.style==='chain')continue;// a chain appears all at once when it lands
   const age=Math.max(0,now-shot.start),t=age<normalBasicCast?0:Math.min(1,(age-normalBasicCast)/normalBasicFlight),e=t*t;
   const frame=age<normalBasicCast?0:Math.min(3,1+Math.floor(t*3));
   const gx=from.x+(end.x-from.x)*e,gy=from.y+(end.y-from.y)*e,lift=from.lift+(endLift-from.lift)*e;
   view.upright(gx,gy,()=>frameAt(carrier,frame,gx,gy-lift,angle));
  }
  for(let i=impacts.length-1;i>=0;i--){
   const fx=impacts[i],p=(now-fx.start)/FX_PLAY;if(!(p>=0&&p<1)){if(p>=1)impacts.splice(i,1);continue}
   const frame=Math.min(5,Math.floor(p*6));
   if(fx.style==='chain'){
    // Stretch the zigzag from the attacker to the target.
    const sx=fx.from.x,sy=fx.from.y,dist=Math.hypot(view.project(fx.x-sx,fx.y-sy).x,view.project(fx.x-sx,fx.y-sy).y-(fx.lift-fx.from.lift));
    view.upright(sx,sy,()=>{ctx.save();ctx.translate(sx,sy-fx.from.lift);ctx.rotate(fx.angle);ctx.imageSmoothingEnabled=true;ctx.drawImage(fx.sheet,frame*FX_FRAME,0,FX_FRAME,FX_FRAME,0,-FX_SIZE/2,dist,FX_SIZE);ctx.restore()});
   }else view.upright(fx.x,fx.y,()=>frameAt(fx.sheet,frame,fx.x,fx.y-fx.lift,0,{w:FX_SIZE*1.4,h:FX_SIZE*1.4}));
  }
  if(fallback.length){
   // Styles without a cartoon sheet yet keep the old pixel effect.
   const all=normalBasicProjectiles.splice(0,normalBasicProjectiles.length);normalBasicProjectiles.push(...fallback);
   try{baseBasicFx()}finally{normalBasicProjectiles.splice(0,normalBasicProjectiles.length,...all)}
  }
 };
 root.ManmulBetaCartoon={unitImage,enemyViews,ready,GRADE_PX,ENEMY_BODY,attackStyle,transforms,TRANSFORM};
})(globalThis);
