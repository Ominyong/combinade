
'use strict';
const canvas=document.querySelector('#game'),ctx=canvas.getContext('2d');
{const defs={...ManmulBasicData,...ManmulUpperBasicData};for(const t of [...Object.values(types),...rosterData.units]){let text=ManmulUnitText.describeBasic(defs[t.id]);if(text)t.attack_effect=text}}
const $=selector=>document.querySelector(selector);
Object.assign(unitRoleTags,ManmulRoles.build(types,{...ManmulBasicData,...ManmulUpperBasicData},ManmulSkillData));
// The same first motion frame is used in the recipe book; there are no separate portraits.
const normalMotionSpecs=Object.fromEntries(['N001','N002','N003','N004','N005','N006','N007'].map(id=>[id,{cx:24,cy:24,size:22}]));
// Pixel-art unit sheets (48px cells) are drawn at a whole-number scale so every art pixel stays the same size.
const PIXEL_UNIT_SCALE=2,PIXEL_UNIT_BASELINE=35;
const normalMotionImages=new Map();
for(const id of Object.keys(normalMotionSpecs))if(typeof Image!=='undefined'){
 let image=new Image();image.src=`assets/units/normal/${id}-sheet.png`;normalMotionImages.set(id,image);
}
const magicMotionImages=new Map(),magicBasicFxImages=new Map();
for(const id of Object.keys(magicMotionSpecs))if(typeof Image!=='undefined'){
 let image=new Image();image.src=`assets/units/magic/${id}-sheet.png`;magicMotionImages.set(id,image);
 let fx=new Image();fx.src=`assets/units/manmul-magic/${id}-sheet.png`;magicBasicFxImages.set(id,fx);
}
const rareMotionSpecs=Object.fromEntries(Object.keys(upperMotionSpecs).filter(id=>id.startsWith('R')).map(id=>[id,{cx:24,cy:24,size:25}]));
const rareMotionImages=new Map();
for(const id of Object.keys(rareMotionSpecs))if(typeof Image!=='undefined'){let image=new Image();image.src=`assets/units/rare/${id}-sheet.png`;rareMotionImages.set(id,image)}
const uniqueMotionSpecs=Object.fromEntries(Object.keys(upperMotionSpecs).filter(id=>id.startsWith('U')).map(id=>[id,{cx:24,cy:24,size:29}]));
const uniqueMotionImages=new Map();
for(const id of Object.keys(uniqueMotionSpecs))if(typeof Image!=='undefined'){let image=new Image();image.src=`assets/units/unique/${id}-sheet.png`;uniqueMotionImages.set(id,image)}
const epicMotionSpecs=Object.fromEntries(Object.keys(upperMotionSpecs).filter(id=>id.startsWith('E')).map(id=>[id,{cx:24,cy:24,size:29}]));
const epicMotionImages=new Map();
for(const id of Object.keys(epicMotionSpecs))if(typeof Image!=='undefined'){let image=new Image();image.src=`assets/units/epic/${id}-sheet.png`;epicMotionImages.set(id,image)}
const legendaryMotionSpecs=Object.fromEntries(Object.keys(upperMotionSpecs).filter(id=>id.startsWith('L')).map(id=>[id,{cx:24,cy:24,size:34}]));
const legendaryMotionImages=new Map();
for(const id of Object.keys(legendaryMotionSpecs))if(typeof Image!=='undefined'){let image=new Image();image.src=`assets/units/legendary/${id}-sheet.png`;legendaryMotionImages.set(id,image)}
const upperMotionImages=new Map();
for(const id of Object.keys(upperMotionSpecs))if(typeof Image!=='undefined'){
 let image=new Image();image.src=`assets/units/manmul-upper/${id}-sheet.png`;upperMotionImages.set(id,image);
}
function portraitStyle(id){
 if(normalMotionSpecs[id]||magicMotionSpecs[id]||rareMotionSpecs[id]||uniqueMotionSpecs[id]||epicMotionSpecs[id]||legendaryMotionSpecs[id])return bookPortraitStyle(id);
 const upper=!!upperMotionSpecs[id],magic=!!magicMotionSpecs[id],normal=!!normalMotionSpecs[id];
 return normal||magic||upper?`background-color:#202629;background-image:url('assets/units/${normal?'normal':magic?'magic':'manmul-upper'}/${id}-sheet.png');background-size:600% ${upper?'300':'200'}%;background-position:0 0;background-repeat:no-repeat;image-rendering:pixelated;color:transparent`:`background:${types[id].color}`;
}
// Center recipe-book portraits on the visible bounds of each first idle frame.
function bookPortraitStyle(id){
 const legendary=legendaryMotionSpecs[id],epic=epicMotionSpecs[id],unique=uniqueMotionSpecs[id],rare=rareMotionSpecs[id],upper=rare||unique||epic||legendary?null:upperMotionSpecs[id],magic=magicMotionSpecs[id],normal=normalMotionSpecs[id],spec=normal||magic||rare||unique||epic||legendary||globalThis.ManmulBookPortraitBounds?.[id]||upper;
 if(!spec)return portraitStyle(id);
 const cell=upper?96:48,rows=upper?3:2,scale=.76/spec.size,width=6*cell*scale,height=rows*cell*scale;
 const x=(.5-spec.cx*scale)/(1-width)*100,y=(.5-spec.cy*scale)/(1-height)*100;
 return `background-color:#202629;background-image:url('assets/units/${normal?'normal':magic?'magic':rare?'rare':unique?'unique':epic?'epic':legendary?'legendary':'manmul-upper'}/${id}-sheet.png');background-size:${width*100}% ${height*100}%;background-position:${x}% ${y}%;background-repeat:no-repeat;image-rendering:pixelated;color:transparent`;
}
function portraitContent(id){return normalMotionSpecs[id]||magicMotionSpecs[id]||upperMotionSpecs[id]?'':types[id].name[0]}
// Stage sheets contain six walking frames and six death frames (362px cells).
const enemySpriteBounds=[[185.5,189.5,227],[184.5,185.5,307],[183,187,266],[181,174,250],[180.5,175,331],[172.5,177,293],[185.5,179,291],[181,165.5,282],[181,182.5,294],[185,185,322],[178,166,330],[177.5,178,339],[183,171.5,352],[184,172,322],[183.5,188,169],[183,159,324],[184.5,171,325],[177.5,174,319]];
const enemySpriteImages=new Map(),enemyDeathDuration=.6;
let enemyDeathEffects=[],enemyDeathEndElapsed=0;
function enemyStageIndex(round){return Math.min(17,Math.max(0,Math.floor(((Number(round)||1)-1)/5)))}
function enemySpriteImage(index){
 if(typeof Image==='undefined')return null;
 if(!enemySpriteImages.has(index)){let img=new Image(),suffix=index===14?'-v2':'';img.src=`assets/enemies/stage-sheets/enemy-${String(index+1).padStart(2,'0')}${suffix}.webp`;enemySpriteImages.set(index,img)}
 return enemySpriteImages.get(index);
}
function enemyFacing(distance){let o=world.outer,p=2*(o.w+o.h),d=((distance+2*o.w+o.h)%p+p)%p;return d<o.w+o.h?1:-1}
function enemyVisualSize(kind){return kind==='boss'?58:kind==='miniboss'?48:kind==='armor'?39:kind==='fast'?32:kind==='swarm'?30:34}
function drawEnemySprite(enemy,point,deathAge=null){
 let index=enemyStageIndex(enemy.spawnWave),image=enemySpriteImage(index);if(!image||!image.complete||!image.naturalWidth)return false;
 let [cx,cy,extent]=enemySpriteBounds[index],size=enemyVisualSize(enemy.kind),scale=size/extent;
 let frame=deathAge===null?Math.floor(combatTime*8+(enemy.id||0))%6:Math.min(5,Math.floor(deathAge/enemyDeathDuration*6));
 ctx.save();ctx.imageSmoothingEnabled=false;ctx.translate(point.x,point.y);ctx.scale(enemyFacing(enemy.d||0),1);
 let cell=image.naturalWidth/6;ctx.drawImage(image,frame*cell,deathAge===null?0:cell,cell,cell,-cx*scale,-cy*scale,362*scale,362*scale);ctx.restore();return true;
}
function queueEnemyDeath(enemy){enemyDeathEffects.push({id:enemy.id,kind:enemy.kind,spawnWave:enemy.spawnWave,d:enemy.d,startedAt:combatTime});}
function drawEnemyDeathEffects(){for(const effect of enemyDeathEffects){let age=combatTime+enemyDeathEndElapsed-effect.startedAt;if(age>=0&&age<enemyDeathDuration)drawEnemySprite(effect,pathPoint(effect.d),age)}}
// Visual sizes do not affect placement, movement, or combat radii.
const unitVisualScales={'노말':1.5,'매직':1.65,'레어':1.8,'유니크':1.95,'에픽':2.1,'레전더리':2.25,'재앙':2.25,'역설':2.25,'천체':2.25};
function unitVisualScale(unit){return unitVisualScales[types[unit.type]?.grade]||1}
const gradeAuraFiles={'유니크':'unique','레전더리':'legendary','재앙':'calamity','역설':'paradox','천체':'celestial'};
const gradeAuraImages={};
if(typeof Image!=='undefined')for(const [grade,file] of Object.entries(gradeAuraFiles)){const image=new Image();image.src=`assets/effects/manmul-grade-aura/${file}.png`;gradeAuraImages[grade]=image}
function drawUnitGradeBase(unit){
 const color=gradeColors[types[unit.type].grade]||'#d9e3dc',scale=unitVisualScale(unit),rx=13*scale,ry=rx*.38,cy=(normalMotionSpecs[unit.type]||magicMotionSpecs[unit.type]||rareMotionSpecs[unit.type]||uniqueMotionSpecs[unit.type]||epicMotionSpecs[unit.type]||legendaryMotionSpecs[unit.type])?unit.y+(PIXEL_UNIT_BASELINE+1-24)*PIXEL_UNIT_SCALE-2:unit.y+5+44*scale*.15,picked=selected.includes(unit.id);
 ctx.save();ctx.beginPath();ctx.ellipse(unit.x,cy,rx,ry,0,0,Math.PI*2);
 ctx.globalAlpha=picked?.5:.3;ctx.fillStyle=color;ctx.fill();
 ctx.globalAlpha=picked?1:.85;ctx.lineWidth=picked?2.5:1.5;ctx.strokeStyle=picked?'#f4ffd8':color;ctx.stroke();
 if(picked){ctx.beginPath();ctx.ellipse(unit.x,cy,rx+4,ry+2,0,0,Math.PI*2);ctx.globalAlpha=.55+.3*Math.sin(combatTime*6);ctx.lineWidth=1.5;ctx.strokeStyle='#d7ff86';ctx.stroke()}
 ctx.restore();
}
function drawUnitGradeAura(unit){
 const image=gradeAuraImages[types[unit.type].grade];
 if(!image||!image.complete||!image.naturalWidth)return;
 const size=44*unitVisualScale(unit),alpha=.72+.08*Math.sin(combatTime*2+unit.id);
 ctx.save();ctx.imageSmoothingEnabled=false;ctx.globalAlpha=alpha;
 ctx.drawImage(image,unit.x-size/2,unit.y+5,size,size*.30);
 ctx.restore();
}
// Most artwork faces right. These sheets instead have a visibly left-facing front.
// A few attack rows were drawn facing the other way, sometimes only on certain frames.
const leftFacingUnitSprites=new Set(['E030','E043','U001','U009','U013','U014','U016','U017','U022','U023','U025','U029','U035','U036','U037','L004','L011','L015','L021','H006','H010','H016','H018','H019']);
const attackFrameFacing={U022:[1,1,1,1,1,1],U025:[-1,1,1,1,1,1],U037:[-1,1,1,1,1,1],H010:[-1,1,1,1,1,-1]};
function unitSpriteFacing(unit,attacking,frame){let source=attacking&&!uniqueMotionSpecs[unit.type]&&!epicMotionSpecs[unit.type]&&!legendaryMotionSpecs[unit.type]&&attackFrameFacing[unit.type]?attackFrameFacing[unit.type][frame]:leftFacingUnitSprites.has(unit.type)?-1:1;return (unit.artFacing===-1?-1:1)*source}
function drawUnitSprite(unit){
 const legendary=!!legendaryMotionSpecs[unit.type],epic=!!epicMotionSpecs[unit.type],unique=!!uniqueMotionSpecs[unit.type],rare=!!rareMotionSpecs[unit.type],upper=!!upperMotionSpecs[unit.type]&&!rare&&!unique&&!epic&&!legendary,magic=!!magicMotionSpecs[unit.type],spec=legendaryMotionSpecs[unit.type]||epicMotionSpecs[unit.type]||uniqueMotionSpecs[unit.type]||rareMotionSpecs[unit.type]||upperMotionSpecs[unit.type]||magicMotionSpecs[unit.type]||normalMotionSpecs[unit.type],image=(legendary?legendaryMotionImages:epic?epicMotionImages:unique?uniqueMotionImages:rare?rareMotionImages:upper?upperMotionImages:magic?magicMotionImages:normalMotionImages).get(unit.type);
 if(!spec||!image||!image.complete||!image.naturalWidth)return false;
 const age=combatTime-(unit.artAttackAt??-10),attacking=age>=0&&age<.6;
 const moving=Math.hypot(unit.tx-unit.x,unit.ty-unit.y)>1;
 const frame=attacking?Math.min(5,Math.floor((age+1e-9)*10)):moving?Math.floor(combatTime*10+unit.id)%6:(normalMotionSpecs[unit.type]||magicMotionSpecs[unit.type]||rareMotionSpecs[unit.type]||uniqueMotionSpecs[unit.type]||epicMotionSpecs[unit.type]||legendaryMotionSpecs[unit.type])?Math.floor(combatTime*5+unit.id)%6:0;
 const scale=normalMotionSpecs[unit.type]||magicMotionSpecs[unit.type]||rareMotionSpecs[unit.type]||uniqueMotionSpecs[unit.type]||epicMotionSpecs[unit.type]||legendaryMotionSpecs[unit.type]?PIXEL_UNIT_SCALE:28*unitVisualScale(unit)/spec.size;
 ctx.save();ctx.imageSmoothingEnabled=false;ctx.translate(unit.x,unit.y);ctx.scale(unitSpriteFacing(unit,attacking,frame),1);
 const cell=upper?96:48;
 ctx.drawImage(image,frame*cell,attacking?cell:0,cell,cell,-spec.cx*scale,-spec.cy*scale,cell*scale,cell*scale);
 ctx.restore();return true;
}
let inLobby=true,testRun=false;
let units=[], enemies=[], shots=[], gold=100, wave=0, spawnLeft=0, spawnTimer=0, spawnInterval=0, waveTimer=0, preparation=30, paused=false, ended=false, selected=[], drag=null, uid=0, enemyId=0, selectedEnemy=null, last=0, toastTimer=0, goalUnit=null, goalSignature="", upcomingBoss=null, revealTime=0, minibossSpawned=false, minibossCleared=false, pendingRewards=[], gameSpeed=1;
let maxWave=40;
const difficulties={easy:{name:'입문',themeIntensity:.5,lapGrowth:.1,rounds:50,hp:1.3,boss:1.3,rate:1.27,income:16},normal:{name:'일반',themeIntensity:1,lapGrowth:.15,rounds:60,hp:1.5,boss:1.5,rate:1.27,income:12},hard:{name:'상급',themeIntensity:1.3,lapGrowth:.15,rounds:75,hp:1.22,boss:1.27,rate:1.27,income:12},extreme:{name:'극한',themeIntensity:1.6,lapGrowth:.15,rounds:90,hp:1.45,boss:1.6,rate:1.28,income:12}};
let selectedDifficulty=null,selectedDifficultyId='normal';
// Rift lap pressure: every full lap an enemy survives adds lapGrowth of its spawn max HP (current HP rises by the same amount).
// Slowing enemies delays this, so slow/control units have a job on the looping path.
const lapRules={growth:.15,maxStacks:5};
function pathLength(){return 2*(world.outer.w+world.outer.h)}
// e.lapsPassed counts laps; e.laps counts growth stacks (the seal relic can make them differ).
function applyLapGrowth(e,impeded=false){let passed=Math.max(0,Math.floor(e.d/pathLength())),prev=e.lapsPassed??e.laps??0;if(passed<=prev)return;e.lapsPassed=passed;if(impeded&&runRelics.seal)return;let stacks=Math.min(lapRules.maxStacks,(e.laps||0)+passed-prev);if(stacks<=(e.laps||0))return;e.lapBase??=e.max;let add=e.lapBase*(selectedDifficulty?.lapGrowth??lapRules.growth)*(stacks-(e.laps||0));e.max+=add;e.hp+=add;e.laps=stacks}
const roundInterval=60, spawnDuration=40, gradeLevels={'노말':0,'매직':0,'레어':0,'에픽':0,'유니크':0,'레전더리':0,'재앙':0,'역설':0,'천체':0};
const world={w:1000,h:700,inner:{x:190,y:140,w:620,h:420},outer:{x:150,y:100,w:700,h:500}};
// These layers are visual only; the existing placement and path geometry is unchanged.
const arenaTextures={};
if(typeof Image!=='undefined')for(const [key,file] of Object.entries({outer:'outer-ground',path:'enemy-path',floor:'arena-floor'})){let image=new Image();image.src=`assets/ui/ancient-ruins-v1/${file}.webp`;arenaTextures[key]=image}
let skinMapImage=null,skinIntroImage=null,skinNearImage=null,skinBackdrop=null;
function loadMapSkin(id){skinMapImage=null;skinIntroImage=null;skinNearImage=null;skinBackdrop=null;if(id==='forest'||typeof Image==='undefined')return;skinMapImage=new Image();skinMapImage.src=`assets/ui/map-skins/${id}.webp`;skinBackdrop=new Image();skinBackdrop.src=`assets/ui/map-backdrops/generated-v7/${id}.webp`;skinIntroImage=new Image();skinIntroImage.src=`assets/ui/map-intro-sources/${id}-v2.png`;skinNearImage=new Image();skinNearImage.src=`assets/ui/map-intro-near/${id}.png`}
loadMapSkin(playerProfile.mapSkin);
function textureReady(image){return !!(image&&image.complete&&image.naturalWidth)}
const introDuration=5.5;
let introRemaining=0,introTotal=introDuration,introLoadWait=0,introThemeQueued=false;
const forestBackdrop=typeof Image!=='undefined'?new Image():null;
const forestBoundary=typeof Image!=='undefined'?new Image():null;
if(forestBackdrop)forestBackdrop.src='assets/ui/ancient-ruins-v1/forest-background.webp';
if(forestBoundary)forestBoundary.src='assets/ui/ancient-ruins-v1/forest-boundary.webp';
const introOutside=typeof Image!=='undefined'?new Image():null;
if(introOutside)introOutside.src='assets/ui/stage-intro/ruins-outer-extension.webp';
const introDebris=typeof Image!=='undefined'?new Image():null;
if(introDebris)introDebris.src='assets/ui/stage-intro/impact-debris.webp';
const introViewportFill=typeof Image!=='undefined'?new Image():null;
if(introViewportFill)introViewportFill.src='assets/ui/stage-intro/fog-screen-fill.webp';
const introViewportFog=typeof Image!=='undefined'?new Image():null;
if(introViewportFog)introViewportFog.src='assets/ui/stage-intro/fog-screen-edge.webp';
const introFogLayers={};
if(typeof Image!=='undefined')for(const [name,file] of Object.entries({edge:'fog-edge.webp',wisps:'fog-wisps.webp'})){
 const image=new Image();image.src=`assets/ui/stage-intro/${file}`;introFogLayers[name]=image;
}
function startArenaIntro(){
 introTotal=introDuration;introRemaining=introTotal;introLoadWait=0;
 document.body?.classList.add('arena-intro');
}
function introAssetsSettled(){return (!skinMapImage||skinMapImage.complete)&&(!skinBackdrop||skinBackdrop.complete)&&(!skinIntroImage||skinIntroImage.complete)&&(!skinNearImage||skinNearImage.complete)&&(!forestBackdrop||forestBackdrop.complete)&&(!forestBoundary||forestBoundary.complete)&&(!introViewportFill||introViewportFill.complete)&&(!introViewportFog||introViewportFog.complete)&&(!introOutside||introOutside.complete)&&(!introDebris||introDebris.complete)&&Object.values(introFogLayers).every(image=>image.complete)&&Object.values(arenaTextures).every(image=>image.complete)}
function updateArenaIntro(dt){
 if(introRemaining<=0)return false;
 introLoadWait+=dt;
 if(introAssetsSettled()||introLoadWait>=3){
  introRemaining=Math.max(0,introRemaining-dt);
  if(introRemaining===0){document.body?.classList.remove('arena-intro');if(introThemeQueued){introThemeQueued=false;showThemeRoulette()}}
 }
 return true;
}
// The camera accelerates into the arena and impacts before the HUD returns.
function introCameraState(){
 if(introRemaining<=0)return {zoom:1,x:0,y:0,impact:0};
 const progress=1-introRemaining/introTotal,approach=Math.min(1,progress/.82);
 const zoom=.75+.25*approach*approach*approach;
 const impact=Math.max(0,Math.min(1,(progress-.82)/.18));
 const strength=progress>=.82?(1-impact)*(1-impact):0;
 return {zoom,x:Math.sin(impact*42)*7*strength,y:Math.cos(impact*37)*5*strength,impact:progress>=.82?impact:0};
}
const introDebrisOrigins=[{x:78,y:78,vx:24,vy:10},{x:145,y:68,vx:28,vy:24},{x:850,y:65,vx:-25,vy:17},{x:930,y:90,vx:-26,vy:12},{x:65,y:345,vx:27,vy:-15},{x:935,y:360,vx:-26,vy:-12},{x:78,y:615,vx:27,vy:-19},{x:150,y:640,vx:20,vy:-26},{x:850,y:640,vx:-24,vy:-25},{x:930,y:610,vx:-25,vy:-16}];
function drawArenaImpact(){
 if(introRemaining<=0)return;
 const progress=1-introRemaining/introTotal;if(progress<.82)return;
 const age=Math.min(1,(progress-.82)/.18);
 ctx.save();ctx.globalAlpha=Math.min(1,age*7)*(1-age);
 if(playerProfile.mapSkin!=='forest'){
  const palettes={snow:['#d9f2ff','#a7cedd'],desert:['#d5ae74','#9e7548'],lava:['#e87539','#463938'],sky:['#edf4f5','#b9d2da'],mushroom:['#a8b1e8','#7b5ba4'],cherry:['#f4b4cb','#c88e91'],library:['#97bdad','#b2a074'],clockwork:['#d5a85f','#738e83'],deepsea:['#9adce5','#688d91'],candy:['#f0c6d8','#e3c393'],stars:['#ffe3a2','#9699c1'],amusement:['#c3a28d','#918b77']};
  const colors=palettes[playerProfile.mapSkin]||palettes.deepsea;
  for(let i=0;i<36;i++){const p=introDebrisOrigins[i%introDebrisOrigins.length],x=p.x+p.vx*age*(1+i%3)+Math.sin(i*4)*20*age,y=p.y+p.vy*age*(1+i%3)+35*age*age;ctx.fillStyle=colors[i%2];ctx.beginPath();if(['cherry','snow','deepsea','sky'].includes(playerProfile.mapSkin)){ctx.ellipse(x,y,2+i%4,1.5+i%3,i+age*4,0,Math.PI*2)}else{ctx.rect(x,y,3+i%5,2+i%4)}ctx.fill()}
  ctx.restore();return;
 }
 if(!textureReady(introDebris)){ctx.restore();return}
 for(let i=0;i<introDebrisOrigins.length;i++){
  const p=introDebrisOrigins[i],size=32+(i%3)*5+age*7;
  const x=p.x+p.vx*age,y=p.y+p.vy*age+18*age*age;
  ctx.drawImage(introDebris,440,220,650,550,x-size/2,y-size/2,size,size);
 }
 ctx.restore();
}
function drawArenaIntro(){
 if(introRemaining<=0)return;
 const progress=1-introRemaining/introTotal;
 const eased=progress*progress*(3-2*progress);
 const fogFade=Math.max(0,Math.min(1,(progress-.08)/.82));
 const opacity=1-fogFade*fogFade*(3-2*fogFade);
 if(playerProfile.mapSkin!=='forest'&&textureReady(skinIntroImage))return;
 ctx.save();ctx.fillStyle=`rgba(8,19,20,${opacity*.55})`;ctx.fillRect(0,0,world.w,world.h);
 if(textureReady(introFogLayers.wisps)){
  const fogScale=1+eased*.5,width=(world.w+180)*fogScale,height=(world.h+140)*fogScale;
  ctx.globalAlpha=opacity*.75;
  ctx.drawImage(introFogLayers.wisps,(world.w-width)/2+eased*36,(world.h-height)/2,width,height);
 }
 if(textureReady(introFogLayers.edge)){
  // Keep the dense border attached to the screen edges while its wisps drift outward.
  const edgeScale=1+eased*.45,width=world.w*edgeScale,height=world.h*edgeScale;
  ctx.save();ctx.globalAlpha=Math.min(1,opacity*1.15);ctx.filter='blur(14px)';
  ctx.drawImage(introFogLayers.edge,(world.w-width)/2,(world.h-height)/2,width,height);ctx.restore();
 }
 ctx.restore();
}
function drawArena(target=ctx){
 const i=world.inner;
 target.fillStyle='#1b302d';target.fillRect(0,0,world.w,world.h);
 if(textureReady(arenaTextures.outer))target.drawImage(arenaTextures.outer,0,0,world.w,world.h);
 if(textureReady(arenaTextures.floor))target.drawImage(arenaTextures.floor,i.x,i.y,i.w,i.h);
 // The generated path includes transparent padding; this aligns its centerline to world.outer.
 if(textureReady(arenaTextures.path))target.drawImage(arenaTextures.path,105,53,790,594);
}

// PC-only 16:9 stage: all HTML UI lives in a fixed 1600x900 #stage scaled to fit the window; the rest is letterboxed.
const STAGE_W=1600,STAGE_H=900;
function stageMetrics(){let scale=Math.min(innerWidth/STAGE_W,innerHeight/STAGE_H);if(!(scale>0))scale=1;return {scale,left:(innerWidth-STAGE_W*scale)/2,top:(innerHeight-STAGE_H*scale)/2}}
function resize(){let d=devicePixelRatio||1;canvas.width=innerWidth*d;canvas.height=innerHeight*d;ctx.setTransform(d,0,0,d,0,0);let stage=document.querySelector('#stage'),m=stageMetrics();if(stage&&stage.style)stage.style.transform=`translate(${m.left}px,${m.top}px) scale(${m.scale})`} addEventListener('resize',resize);resize();
function transform(){let m=stageMetrics(),top=84,bottom=90,availableHeight=STAGE_H-top-bottom,scale=Math.min(STAGE_W/world.w,availableHeight/world.h);return {scale:scale*m.scale,x:m.left+(STAGE_W-world.w*scale)/2*m.scale,y:m.top+(top+(availableHeight-world.h*scale)/2)*m.scale}}
function pos(e){let t=transform();return {x:(e.clientX-t.x)/t.scale,y:(e.clientY-t.y)/t.scale}}
function clamp(v,a,b){return Math.max(a,Math.min(b,v))}
function notice(s,kind='info'){if(kind==='fusion-warning'||/부족/.test(s))globalThis.ManmulSound?.play('error');$('#toast').textContent=s;$('#toast').classList.toggle('is-fusion-warning',kind==='fusion-warning');$('#toast').classList.toggle('is-unlock',kind==='unlock');$('#toast').classList.remove('hidden');toastTimer=2.3}
function freePosition(type,x,y,exclude=[]){
 let r=types[type].radius,i=world.inner,ignored=new Set(exclude),clear=(px,py)=>units.every(u=>ignored.has(u.id)||Math.hypot(u.x-px,u.y-py)>=r+types[u.type].radius+1);
 for(let n=0;n<500;n++){let angle=n*2.399963,radius=n===0?0:5*Math.sqrt(n),px=clamp(x+Math.cos(angle)*radius,i.x+r,i.x+i.w-r),py=clamp(y+Math.sin(angle)*radius,i.y+r,i.y+i.h-r);if(clear(px,py))return {x:px,y:py}}
 // If the nearby area is crowded, search the rest of the allowed arena before
 // reporting that there is no room. The fine grid is only used as a fallback.
 let step=Math.max(4,r/2);for(let py=i.y+r;py<=i.y+i.h-r;py+=step)for(let px=i.x+r;px<=i.x+i.w-r;px+=step)if(clear(px,py))return {x:px,y:py};return null;
}
// Summons look for a spot with room for the drawn sprite; collision radii stay unchanged.
// Half the drawn width of a unit: pixel sheets use their art size, older art its visual scale.
function unitFootprint(type){const spec=normalMotionSpecs[type]||magicMotionSpecs[type]||rareMotionSpecs[type]||epicMotionSpecs[type]||uniqueMotionSpecs[type]||legendaryMotionSpecs[type];return spec?spec.size*PIXEL_UNIT_SCALE/2:14*(unitVisualScales[types[type]?.grade]||1.5)}
function roomyPosition(type,x,y,exclude=[]){let r=types[type].radius,f=unitFootprint(type),i=world.inner,ignored=new Set(exclude),clear=(px,py)=>units.every(u=>ignored.has(u.id)||Math.hypot(u.x-px,u.y-py)>=f+unitFootprint(u.type)+2);for(let n=0;n<900;n++){let angle=n*2.399963,radius=n===0?0:5*Math.sqrt(n),px=clamp(x+Math.cos(angle)*radius,i.x+r,i.x+i.w-r),py=clamp(y+Math.sin(angle)*radius,i.y+r,i.y+i.h-r);if(clear(px,py))return {x:px,y:py}}return null}
function addUnit(type,x=500,y=350){let p=freePosition(type,x,y);if(!p)return null;let u={id:++uid,type,x:p.x,y:p.y,tx:p.x,ty:p.y,cool:0,skillTimer:types[type].skill_cooldown||0};units.push(u);runStats.unitTypes[u.id]=type;if(!runStats.highest||ManmulRoster.grades.indexOf(types[type].grade)>ManmulRoster.grades.indexOf(types[runStats.highest].grade))runStats.highest=type;skillFxPreload(type);v5Combat.prepareUnit(u,combatTime);if(type==='L002')u.cool=v5Combat.attackInterval(u);return u}
function issueMove(group,point){let area=world.inner,moving=new Set(group.map(u=>u.id)),occupied=units.filter(u=>!moving.has(u.id)).map(u=>({x:u.x,y:u.y,radius:types[u.type].radius,foot:unitFootprint(u.type)}));for(const u of group){let radius=types[u.type].radius,foot=unitFootprint(u.type),goal=null;for(const roomy of [true,false]){if(goal)break;for(let n=0;n<2500;n++){let angle=n*2.399963,offset=n===0?0:4*Math.sqrt(n),x=clamp(point.x+Math.cos(angle)*offset,area.x+radius,area.x+area.w-radius),y=clamp(point.y+Math.sin(angle)*offset,area.y+radius,area.y+area.h-radius);if(occupied.every(p=>Math.hypot(p.x-x,p.y-y)>=(roomy?foot+p.foot+2:radius+p.radius+1))){goal={x,y};break}}}u.tx=goal?goal.x:u.x;u.ty=goal?goal.y:u.y;u.bestDistance=Math.hypot(u.tx-u.x,u.ty-u.y);u.stuckTime=0;u.avoidSide=0;occupied.push({x:u.tx,y:u.ty,radius,foot})}}
function markTestRun(){testRun=true;ManmulRecords.abandonRun()}
function recordAcquire(id){ManmulRecords.acquire(id,types[id]?.grade,types[id]?.name||id)}
// Mid-boss selection tickets: from round 15 every mid-boss gives tickets to pick a unit of a fixed grade. They are kept
// until used, so a player can wait for the moment a material completes a recipe.
const ticketRules={normalFrom:15,normalCount:2,magicFrom:35,magicCount:1},ticketGrades={normal:'노말',magic:'매직'};
let selectionTickets={normal:0,magic:0};
function grantTickets(midWave){let kind=midWave>=ticketRules.magicFrom?'magic':midWave>=ticketRules.normalFrom?'normal':null;if(!kind)return null;let count=kind==='magic'?ticketRules.magicCount:ticketRules.normalCount;selectionTickets[kind]+=count;globalThis.ManmulSound?.play('reward');notice(`중간 보스 보상: ${ticketGrades[kind]} 선택권 ${count}장`);updateUI();return kind}
function ticketTotal(){return selectionTickets.normal+selectionTickets.magic}
// Recipes that become buildable when one unit of `id` is added to the current army.
function recipesUnlockedBy(id){let have={};for(const u of ownedUnits())have[u.type]=(have[u.type]||0)+1;const ready=extra=>r=>{let need={};for(const p of r.parts)need[p]=(need[p]||0)+1;return Object.entries(need).every(([t,n])=>(have[t]||0)+(t===extra?1:0)>=n)};return recipes.filter(r=>r.parts.includes(id)&&!ready(null)(r)&&ready(id)(r)).map(r=>r.result)}
function openTickets(kind=null){if(ended||inLobby)return;kind=kind&&selectionTickets[kind]>0?kind:selectionTickets.magic>0?'magic':selectionTickets.normal>0?'normal':null;if(!kind){closeModal();return}
 let tabs=Object.keys(ticketGrades).filter(k=>selectionTickets[k]>0).map(k=>`<button type="button" class="ticket-tab" aria-pressed="${k===kind}" onclick="openTickets('${k}')">${ticketGrades[k]} 선택권 ${selectionTickets[k]}장</button>`).join('');
 let options=Object.values(types).filter(t=>t.grade===ticketGrades[kind]).map(t=>({t,unlocks:recipesUnlockedBy(t.id)})).sort((a,b)=>b.unlocks.length-a.unlocks.length||a.t.name.localeCompare(b.t.name));
 $('#modalContent').innerHTML=`${modalOpen({eyebrow:'SELECTION TICKET',title:'유닛 선택권',close:'선택권 닫기'})}<p class="ui-modal-lead">원하는 유닛을 골라 바로 소환합니다. 선택권은 쓰기 전까지 보관됩니다.</p><div class="ticket-tabs">${tabs}</div><div class="ticket-list">${options.map(({t,unlocks})=>`<button type="button" class="ticket-option" onclick="useTicket('${kind}','${t.id}')"><span class="ticket-portrait" style="${bookPortraitStyle(t.id)}" aria-hidden="true"></span><span class="ticket-text"><strong>${t.name}</strong><small>${unlocks.length?'조합 가능: '+unlocks.map(id=>types[id].name).join(', '):'바로 가능한 조합 없음'}</small></span></button>`).join('')}</div>${modalClose()}`;$('#modal').classList.remove('hidden')}
function useTicket(kind,id){if(ended||inLobby||!(selectionTickets[kind]>0)||types[id]?.grade!==ticketGrades[kind])return false;let cx=480+Math.random()*40,cy=330+Math.random()*40,spot=roomyPosition(id,cx,cy),u=addUnit(id,spot?spot.x:cx,spot?spot.y:cy);if(!u){notice('유닛을 소환할 공간이 부족합니다');return false}selectionTickets[kind]--;recordAcquire(id);showArrivalEffect('summon',u);selectedEnemy=null;selected=[u.id];if(ticketTotal())openTickets(kind);else closeModal();updateUI();return true}
function summon(){if(ended||paused)return;if(gold<summonCost){notice('골드가 부족합니다');return}let keys=rosterData.units.filter(u=>u.grade==='N').map(u=>u.id);if(runRelics.elite&&Math.random()<relicRules.elite)keys=rosterData.units.filter(u=>u.grade==='M').map(u=>u.id);let pick=keys[Math.floor(Math.random()*keys.length)],cx=480+Math.random()*40,cy=330+Math.random()*40,spot=roomyPosition(pick,cx,cy);let u=addUnit(pick,spot?spot.x:cx,spot?spot.y:cy);if(!u){notice('유닛을 소환할 공간이 부족합니다');return}gold-=summonCost;recordAcquire(pick);showArrivalEffect("summon",u);selectedEnemy=null;selected=[u.id];updateUI()}
function spawnTestUnits(){if(ended)return;let targets=rosterData.units.filter(u=>['U','L','H','D','C'].includes(u.grade)),area=world.inner,created=0;for(let index=0;index<targets.length;index++){let placed=null;for(let attempt=0;attempt<56&&!placed;attempt++){let slot=(index+attempt)%56,x=area.x+(slot%8+.5)*area.w/8,y=area.y+(Math.floor(slot/8)+.5)*area.h/7;placed=addUnit(targets[index].id,x,y)}if(placed)created++}if(created)markTestRun();notice(created===targets.length?`테스트 유닛 ${created}기 소환 완료`:`공간 부족: 테스트 유닛 ${created}/${targets.length}기 소환`);updateUI()}
function bookUnitIcon(id){return `<button type="button" class="ingredient-portrait book-unit-link" style="${bookPortraitStyle(id)}" onclick="openRecipesForUnit('${id}')" aria-label="${types[id].name} 조합식 보기" title="${types[id].name} 조합식 보기">${portraitContent(id)}</button>`}
function recipeBookIngredients(recipe){return [...new Set(recipe.parts)].map(type=>{let unit=types[type],need=recipe.parts.filter(part=>part===type).length,have=ownedUnits().filter(u=>u.type===type).length,enough=have>=need;return `<span class="book-ingredient">${bookUnitIcon(type)}<span class="book-unit-name" style="color:${gradeColors[unit.grade]}">${unit.name}</span><span class="ingredient-count ${enough?'is-owned':'is-missing'}">${have}/${need} ${enough?'보유':'부족'}</span></span>`}).join('<span class="book-plus" aria-hidden="true">+</span>')}
const expandedGoalBranches=new Set();
function goalTree(target){
 let counts={};for(const unit of ownedUnits())counts[unit.type]=(counts[unit.type]||0)+1;
 function makeNode(id,need,path){return {id,need,have:counts[id]||0,path,children:[]}}
 let root=makeNode(target,1,target),queue=[root];
 for(let i=0;i<queue.length;i++){let node=queue[i],missing=Math.max(0,node.need-node.have),recipe=recipes.find(r=>r.result===node.id);if(!missing||!recipe)continue;let grouped=new Map();for(const id of recipe.parts)grouped.set(id,(grouped.get(id)||0)+missing);for(const [id,need] of grouped){let child=makeNode(id,need,node.path+'/'+id);node.children.push(child);queue.push(child)}}
 return root;
}
function goalRows(node,depth=0){let t=types[node.id],available=node.have>=node.need,expandable=!available&&node.children.length>0,expanded=expandable&&expandedGoalBranches.has(node.path);return `<div class="goal-row" style="padding-left:${depth*12}px"><span class="ingredient-portrait goal-portrait" style="${portraitStyle(node.id)}" aria-hidden="true">${portraitContent(node.id)}</span><span class="goal-name" style="color:${gradeColors[t.grade]}">${t.name}</span><span class="goal-count ${available?'is-owned':'is-missing'}">${node.have}/${node.need}</span>${expandable?`<button type="button" class="goal-expand" aria-expanded="${expanded}" aria-label="${t.name} 하위 조합 ${expanded?'접기':'펼치기'}" onclick="toggleGoalBranch('${node.path}')">${expanded?'−':'+'}</button>`:'<span class="goal-expand-space"></span>'}</div>`+(expanded?node.children.map(child=>goalRows(child,depth+1)).join(''):'')}
function toggleGoalBranch(path){if(expandedGoalBranches.has(path))expandedGoalBranches.delete(path);else expandedGoalBranches.add(path);goalSignature='';updateGoal()}
function setGoal(id){if(goalUnit!==id)expandedGoalBranches.clear();goalUnit=id;goalSignature='';updateGoal();closeModal()}
function clearGoal(){goalUnit=null;goalSignature='';expandedGoalBranches.clear();updateGoal()}
function updateGoal(){let box=$('#goalTracker');if(!goalUnit||!types[goalUnit]){goalUnit=null;expandedGoalBranches.clear();box.classList.add('hidden');return}let signature=goalUnit+'|'+ownedUnits().map(u=>u.type).sort().join(',');if(goalSignature===signature)return;goalSignature=signature;let tree=goalTree(goalUnit),valid=new Set(),pending=[tree];while(pending.length){let node=pending.pop();if(node.children.length&&node.have<node.need)valid.add(node.path);pending.push(...node.children)}for(const path of expandedGoalBranches)if(!valid.has(path))expandedGoalBranches.delete(path);let t=types[goalUnit],scroll=box.scrollTop;box.classList.remove('hidden');box.innerHTML=`<div class="goal-heading"><strong>조합 목표</strong><button onclick="clearGoal()">해제</button></div><div class="goal-target"><span class="ingredient-portrait goal-target-portrait" style="${portraitStyle(goalUnit)}" aria-hidden="true">${portraitContent(goalUnit)}</span><strong class="goal-name" style="color:${gradeColors[t.grade]}">${t.name}</strong></div><div class="goal-materials">${tree.children.map(child=>goalRows(child)).join('')}</div>`;if(scroll!==undefined)box.scrollTop=scroll}
const runUpgrades={physical:{name:'물리 전술',description:'물리 유닛 공격력 +8%'},magic:{name:'마법 전술',description:'마법 유닛 공격력 +8%'},speed:{name:'신속 공격',description:'공격속도 +5%'},burn:{name:'화상 증폭',description:'화상 피해 +12%'},slow:{name:'감속 전술',description:'감속 효과 +8%'},armor:{name:'방어 파괴',description:'방어력 감소 효과 +10%'},resist:{name:'마력 파괴',description:'마법 저항력 감소 효과 +10%'},boss:{name:'보스 사냥',description:'보스 대상 피해 +8%'},gold:{name:'전술 보급',description:'즉시 40골드'}};
// The gold reward grows with the round (40 at round 10, 150 at round 50) so it stays a real choice next to combat bonuses.
function bossGoldReward(){return Math.max(40,wave*3)}
function rewardDescription(id){return relics[id]?relics[id].description:id==='gold'?`즉시 ${bossGoldReward()}골드`:runUpgrades[id].description}
let runLevels=Object.fromEntries(Object.keys(runUpgrades).map(id=>[id,0])),rewardChoices=[];
// Relics change rules instead of adding a percentage. Each can be taken once per run.
const runRelics={},relics={
 seal:{name:'순환 봉인',description:'감속·묶기 상태로 한 바퀴를 마친 적은 순환 강화를 받지 않습니다'},
 ember:{name:'잔불 전이',description:'화상 상태로 쓰러진 적의 화상이 가까운 적 2기에게 4초간 옮겨붙습니다'},
 execute:{name:'균열 처형',description:'일반 몬스터의 체력이 최대 체력의 8% 이하가 되면 즉시 처치합니다'},
 bounty:{name:'현상금',description:'일반 몬스터를 처치할 때 25% 확률로 골드 +1'},
 interest:{name:'균열 이자',description:'라운드 시작마다 보유 골드의 10%를 추가로 받습니다(최대 15)'},
 convert:{name:'변환 숙련',description:'같은 등급 변환 비용 50% 감소'},
 adapt:{name:'균열 적응',description:'이후 등장하는 적이 받는 전장 테마 압박 35% 감소'},
 elite:{name:'정예 소환',description:'소환할 때 10% 확률로 매직 유닛이 나옵니다'}
};
const relicRules={emberTargets:2,emberDuration:4,emberRange:160,execute:.08,bounty:.25,interest:.1,interestCap:15,convert:.5,adapt:.65,elite:.1};
function rewardName(id){return relics[id]?.name??runUpgrades[id].name}
// Two relics (while any remain) plus stat upgrades fill the three choices.
function rewardChoiceSet(){let relicPool=Object.keys(relics).filter(id=>!runRelics[id]),statPool=Object.keys(runUpgrades).filter(id=>runLevels[id]<3),out=[];const take=pool=>out.push(...pool.splice(Math.floor(Math.random()*pool.length),1));while(relicPool.length&&out.length<2)take(relicPool);while(statPool.length&&out.length<3)take(statPool);while(relicPool.length&&out.length<3)take(relicPool);return out}
function ownedRelicNames(){return Object.keys(relics).filter(id=>runRelics[id]).map(id=>relics[id].name)}
function queueBossReward(enemy){if(enemy.kind!=='boss'||enemy.spawnWave>=maxWave)return;rewardChoices=rewardChoiceSet();if(!rewardChoices.length)return;pendingRewards.push(rewardChoices);showReward()}
function modalOpen({eyebrow='',title,close='',variant=''}){return `<div class="ui-modal ${variant}"><header class="ui-modal-head"><div class="ui-modal-titles">${eyebrow?`<span class="ui-modal-eyebrow">${eyebrow}</span>`:''}<h2>${title}</h2></div>${close?`<button type="button" class="ui-modal-close" onclick="closeModal()" aria-label="${close}">×</button>`:''}</header><div class="ui-modal-body">`}
function modalClose(footer=''){return `</div>${footer?`<footer class="ui-modal-foot">${footer}</footer>`:''}</div>`}
function showReward(){if(!pendingRewards.length)return;paused=true;$('#rewardButton').classList.remove('hidden');let choices=pendingRewards[0];$('#modalContent').innerHTML=`${modalOpen({eyebrow:'BOSS REWARD',title:'보스 처치 보상'})}<p class="ui-modal-lead">이번 전투에 적용할 보상을 하나 선택하세요. 유물은 규칙을 바꾸고, 판마다 한 번만 얻습니다.</p>${ownedRelicNames().length?`<p class="reward-owned">보유 유물: ${ownedRelicNames().join(' · ')}</p>`:''}<div class="reward-list">${choices.map(id=>`<button class="${relics[id]?'reward-relic':''}" onclick="collectReward('${id}')"><span class="choice-top"><strong>${rewardName(id)}</strong><span class="choice-meta">${relics[id]?'유물':runLevels[id]+'/3'}</span></span><span class="choice-desc">${rewardDescription(id)}</span></button>`).join('')}</div>${modalClose()}`;$('#modal').classList.remove('hidden');updateUI()}
function collectReward(id){if(!pendingRewards.length||!pendingRewards[0].includes(id))return;if(relics[id]){if(runRelics[id])return;runRelics[id]=true}else{if(runLevels[id]>=3)return;runLevels[id]++}globalThis.ManmulSound?.play('reward');if(id==='gold')gold+=bossGoldReward();pendingRewards.shift();rewardChoices=[];if(pendingRewards.length)showReward();else{paused=false;closeModal();$('#rewardButton').classList.add('hidden');updateUI()}}
function openSupport(){if(ended||paused||inLobby)return;let normal=enemies.some(e=>e.hp>0&&e.kind!=='boss'&&e.kind!=='miniboss');$('#modalContent').innerHTML=`${modalOpen({eyebrow:'SUPPORT',title:'긴급 지원',close:'긴급 지원 닫기'})}<p class="ui-modal-lead">일반 몬스터에게만 적용됩니다.</p><div class="reward-list"><button title="${supportUses.bomb>=2?'사용 횟수 소진':gold<50?'골드 부족':!normal?'대상 일반 몬스터 없음':'균열 폭격 사용'}" onclick="useSupport('bomb')" ${gold<50||supportUses.bomb>=2||!normal?'disabled':''}><span class="choice-top"><strong>균열 폭격</strong><span class="choice-meta">50골드 · ${2-supportUses.bomb}회</span></span><span class="choice-desc">일반 몬스터 최대 체력의 20% 피해</span></button><button title="${supportUses.slow>=2?'사용 횟수 소진':gold<35?'골드 부족':!normal?'대상 일반 몬스터 없음':'시간 봉쇄 사용'}" onclick="useSupport('slow')" ${gold<35||supportUses.slow>=2||!normal?'disabled':''}><span class="choice-top"><strong>시간 봉쇄</strong><span class="choice-meta">35골드 · ${2-supportUses.slow}회</span></span><span class="choice-desc">일반 몬스터 5초간 35% 감속</span></button><button title="${supportUses.loan>=1?'사용 횟수 소진':'긴급 자금 사용'}" onclick="useSupport('loan')" ${supportUses.loan>=1?'disabled':''}><span class="choice-top"><strong>긴급 자금</strong><span class="choice-meta">${1-supportUses.loan}회</span></span><span class="choice-desc">50골드 획득 · 이후 5라운드 동안 라운드 보상에서 12골드씩, 총 60골드 상환</span></button></div><p class="ui-modal-note">미상환 ${loanRemaining}골드 · 남은 차감 ${loanRounds}회</p>${modalClose()}`;$('#modal').classList.remove('hidden')}
function useSupport(id){if(ended||paused||inLobby)return;let targets=enemies.filter(e=>e.hp>0&&e.kind!=='boss'&&e.kind!=='miniboss');if(id==='bomb'&&gold>=50&&supportUses.bomb<2&&targets.length){gold-=50;supportUses.bomb++,ManmulRecords.useSupport();for(const e of targets){let damage=Math.min(e.hp,e.max*.2);e.hp-=damage;runStats.supportDamage+=damage;showDamageFeedback(e,damage,'물리')}}else if(id==='slow'&&gold>=35&&supportUses.slow<2&&targets.length){gold-=35;supportUses.slow++,ManmulRecords.useSupport();for(const e of targets)v5Combat.effects.slow(e,.35,5,combatTime)}else if(id==='loan'&&supportUses.loan<1){supportUses.loan++,ManmulRecords.useSupport();gold+=50;loanRounds=5;loanRemaining=60}else return;openSupport();updateUI()}
function isMidWave(n){return n%10===5}
function isBossWave(n){return n%10===0}
function spawnEnemy(kind,boss=null){let spec=kind==='boss'&&boss?boss:combatRules.enemyKinds[kind],base=(combatRules.enemyBaseHp+wave*combatRules.enemyHpPerWave)*spec.hp;if(selectedDifficulty){let d=selectedDifficulty,raw=135+42*Math.min(wave,40)+50*Math.max(0,Math.min(wave-40,20))+60*Math.max(0,Math.min(wave-60,20))+70*Math.max(0,wave-80),scale=(kind==='boss'||kind==='miniboss')?d.boss:d.hp;scale=1+(scale-1)*Math.min(1,Math.max(0,wave-(d.rampStart??6))/((d.rampEnd??26)-(d.rampStart??6)));base=raw*spec.hp*scale*Math.pow(d.rate,Math.max(0,wave-10)/10)}enemies.push({id:++enemyId,bossId:kind==='boss'&&boss?boss.id:null,spawnedAt:combatTime,d:0,hp:base,max:base,speed:spec.speed,armor:kind==='boss'?spec.armor:Math.round(spec.armor*(1+Math.floor((wave-1)/10)*.12)),resist:kind==='boss'?spec.resist:Math.round(spec.resist*(1+Math.floor((wave-1)/10)*.12)),kind,spawnWave:wave,name:spec.name||({'miniboss':'균열 선봉장','normal':'균열 몬스터','fast':'질주체','armor':'강철 갑충','swarm':'안개 유령'}[kind]),color:spec.color,slow:0,slowAmount:0,debuffs:[],burns:[]});if(selectedDifficulty){let e=enemies[enemies.length-1],factor=1+.05*Math.max(0,wave-10)/10;e.armor=Math.round(e.armor*factor);e.resist=Math.round(e.resist*factor)}let spawned=enemies[enemies.length-1];if(currentTheme)ManmulThemes.initialize(spawned,currentTheme,kind==='boss'&&boss?boss.ability:null,combatTime,{wave,intensity:(selectedDifficulty?.themeIntensity??0)*(runRelics.adapt?relicRules.adapt:1)});ManmulRecords.trackEnemies(enemies.length);globalThis.ManmulSound?.enemyCount(enemies.length);if(enemies.length>100){end();globalThis.ManmulSound?.play('defeat');multiFinished(false)}}
let bossBag=[],bossBagTheme=null,lastBossId=null;
// Bosses of the current theme (4 per theme); the shared bossPool is only used when no theme is active.
function currentBossPool(){return currentTheme&&ManmulThemes.themes[currentTheme]?.bosses?.length?ManmulThemes.themes[currentTheme].bosses:bossPool}
// Every boss in the pool appears once before any boss repeats; a new cycle never starts with the previous boss.
// ---- Multiplayer sync ----
// While a synced room game runs, the room host drives wave starts and game speed, and nothing pauses the battle.
function multiActive(){return typeof Multiplayer==='object'&&!!Multiplayer.syncActive&&!inLobby}
// The boss order is shuffled with a room-wide seed so every player meets the same bosses in the same order.
let bossOrderRandom=null;
function setBossOrderSeed(seed){if(!Number.isFinite(seed)){bossOrderRandom=null;return}let s=(seed>>>0)||1;bossOrderRandom=()=>((s=(Math.imul(s,1664525)+1013904223)>>>0)/4294967296)}
// Host clock message: wave n has started (or is the current wave) and the next one starts in `remain` seconds.
function multiSyncClock(n,remain){if(inLobby||ended)return;if(n>0&&themePending&&currentTheme)confirmTheme();while(wave<n&&wave<maxWave&&!ended){revealTime=0;startWave()}if(wave===0)preparation=Math.max(0,remain);else waveTimer=Math.max(0,roundInterval-remain);updateUI()}
function multiFinished(won){if(typeof Multiplayer==='object'&&Multiplayer.started)Multiplayer.onLocalEnd(won)}
function setSharedSpeed(v,label){gameSpeed=[1,2,3].includes(v)?v:1;$('#speed').textContent=label||`X${gameSpeed}`}
function nextBossFromBag(){let pool=currentBossPool();if(bossBagTheme!==currentTheme){bossBag=[];bossBagTheme=currentTheme}if(!bossBag.length){bossBag=pool.map(b=>b.id);for(let i=bossBag.length-1;i>0;i--){let j=Math.floor((bossOrderRandom||Math.random)()*(i+1));[bossBag[i],bossBag[j]]=[bossBag[j],bossBag[i]]}if(bossBag.length>1&&bossBag[0]===lastBossId)bossBag.push(bossBag.shift())}let id=bossBag.shift();lastBossId=id;return pool.find(b=>b.id===id)}
function revealBoss(){globalThis.ManmulSound?.play('bossWarn');let base=nextBossFromBag(),ability=currentTheme?(base.ability?ManmulThemes.abilityOf(currentTheme,base.ability):ManmulThemes.choose(currentTheme,lastBossAbility)):null;if(ability)lastBossAbility=ability[0];upcomingBoss={...base,ability};revealTime=8;let box=$('#bossPreview'),factor=selectedDifficulty?1+.05*Math.max(0,wave+5-10)/10:1,theme=currentTheme?ManmulThemes.themes[currentTheme]:null,armor=Math.round(upcomingBoss.armor*factor*(theme?.stat==='armor'?theme.factor:1)),resist=Math.round(upcomingBoss.resist*factor*(theme?.stat==='resist'?theme.factor:1));box.innerHTML=`<strong>${wave+5}라운드 보스 예고: ${upcomingBoss.name}</strong><br>${theme?theme.name+' · ':''}${ability?ability[1]+' — '+ability[2]+'<br>':''}${upcomingBoss.hint}<br>방어력 ${armor} · 마법 저항력 ${resist}`;box.classList.remove('hidden')}
const roleTagDisplay={physical:['⚔','물리'],magic:['✦','마법'],single:['●','단일'],area:['◉','범위'],pierce:['➜','관통'],chain:['⌁','연쇄'],boss:['◆','보스 공격'],armor:['▼','방깎'],resist:['▼','마깎'],slow:['⌛','감속'],control:['⛓','제어'],dot:['◷','지속 피해'],support:['✚','지원'],summon:['✧','소환'],special:['◇','특수']};
function renderRoleTags(type){let tags=unitRoleTags[type.id]||[];return `<span class="role-tags" aria-label="유닛 역할">${tags.map(key=>{let [icon,label]=roleTagDisplay[key];return `<span class="role-tag"><span class="role-tag-icon" aria-hidden="true">${icon}</span>${label}</span>`}).join('')}</span>`}
const uniqueSkillIconIds=new Set(["E001","E002","E003","E004","E005","E006","E007","E008","E009","E010","E011","E012","E013","E014","E015","E016","E017","E018","E019","E020","E021","E022","E023","E024","E025","E026","E027","E028","E029","E030","E031","E032","E033","E034","E035","E036","E037","E038","E039","E040","E041","E042","E043","E044","E045","E046","E047","E048","E049","E050","E051","E052","E053","E054","E055","E056","E057","E058","E059","E060","E061","E062","E063","E064","E065","E066","E067","E068","E069","E070","E071","E072","E073","U001","U002","U003","U004","U005","U006","U007","U008","U009","U010","U011","U012","U013","U014","U015","U016","U017","U018","U019","U020","U021","U022","U023","U024","U025","U026","U027","U028","U029","U030","U031","U032","U033","U034","U035","U036","U037","U038","U039","U040","U041","U042","L001","L002","L003","L004","L005","L006","L007","L008","L009","L010","L011","L012","L013","L014","L015","L016","L017","L018","L019","L020","L021","L022","L023","L024","D001","D002","D003","D004","D005","D006","D007","D008","D009","D010","D011","D012","D013","H001","H002","H003","H004","H005","H006","H007","H008","H009","H010","H011","H012","H013","H014","H015","H016","H017","H018","H019","C001","C002","C003","C004","C005","C006","C007","C008"]);
// level: grade upgrade count, shown as +N on the basic attack icon.
function unitSkillIcons(t,level=0){
 const assigned=ManmulSkillIcons[t.id]||['generic','generic'];
 let icons=[{symbol:'기본',key:assigned[0]||'generic',name:'기본 공격',description:`${t.damage_type} · ${t.attack_effect}`,pending:t.grade!=='노말'&&t.grade!=='매직'}];
 if(t.active)icons.push({symbol:'기술',key:assigned[1]||'generic',uniqueId:uniqueSkillIconIds.has(t.id)?t.id:null,name:t.skill_name,description:`자동 발동 · ${t.skill_cooldown}초<br>${t.skill_effect}`,pending:t.grade!=='노말'&&t.grade!=='매직'});
 return icons.map((icon,i)=>{const tip=`skill-tip-${t.id}-${i}`;return `<span class="skill-wrap"><button class="skill-icon" aria-label="${icon.name}" aria-describedby="${tip}" type="button"><img src="${icon.uniqueId?`assets/ui/skill-icons-unique/${icon.uniqueId}.png`:`assets/ui/skill-icons-centered/${icon.key}.png`}" alt="" onerror="this.hidden=true;this.nextElementSibling.hidden=false"><span class="skill-icon-fallback" hidden>${icon.symbol}</span>${i===0&&level>0?`<span class="skill-level" aria-label="등급 강화 ${level}단계">+${level}</span>`:''}</button><span class="skill-tip" id="${tip}" role="tooltip"><strong>${icon.name}</strong><br>${icon.description}</span></span>`}).join('')
}
function defense(enemy,type){return Math.round(v5Combat.effects.effectiveDefense(enemy,type,combatTime))}
const debuffIcons={armor:{label:'방',color:'#c96055'},magic:{label:'마',color:'#a479d0'},slow:{label:'감',color:'#438bb7'},burn:{label:'화',color:'#dc853e'},root:{label:'묶',color:'#67975b'},bleed:{label:'열',color:'#bf4e4e'},dawn:{label:'광',color:'#c59f35'},shock:{label:'전',color:'#caad42'},wet:{label:'습',color:'#368ebc'},afterimage:{label:'잔',color:'#be925b'},spore:{label:'포',color:'#669e53'},time:{label:'시',color:'#9275b8'},star:{label:'별',color:'#717fca'},heat:{label:'열',color:'#d96532'},cold:{label:'냉',color:'#6fb9e5'},crack:{label:'균',color:'#9b7765'},target:{label:'표',color:'#c5a73d'},poison:{label:'독',color:'#8d63a7'},vulnerable:{label:'취',color:'#d06598'}};
function markDebuff(enemy,key){enemy.iconOrder=enemy.iconOrder||[];if(!enemy.iconOrder.includes(key))enemy.iconOrder.push(key)}
function activeDebuffs(enemy){
 let active=[],order=0,add=(key,started)=>{if(key)active.push({key,started:started??0,order:order++})};
 for(const [mark,until] of Object.entries(enemy.manmulMarks||{}))if(until>combatTime)add({젖음:'wet',열기:'heat',냉기:'cold',균열:'crack',포자:'spore',표적:'target'}[mark],enemy.manmulMarkStarted?.[mark]);
 for(const d of enemy.manmulDebuffs||[])if(d.until>combatTime)add({armor:'armor',resist:'magic',slow:'slow',damageTaken:'vulnerable',magicDamageTaken:'vulnerable'}[d.stat]||(d.stat?.startsWith('element:')?'vulnerable':null),d.startedAt);
 for(const dot of enemy.manmulDots||[])if(dot.until>combatTime)add(dot.kind==='burn'?'burn':dot.kind==='poison'?'poison':null,dot.startedAt);
 if(enemy.manmulRootUntil>combatTime)add('root',enemy.manmulRootStarted);
 if(enemy.manmulVulnerability?.until>combatTime)add('vulnerable',enemy.manmulVulnerability.startedAt);
 active.sort((a,b)=>a.started-b.started||a.order-b.order);return [...new Set(active.map(x=>x.key))];
}
function drawEnemyKindBadge(kind,x,y){
 if(kind!=='fast'&&kind!=='armor'&&kind!=='swarm')return;
 ctx.save();ctx.translate(x,y);ctx.lineJoin='round';ctx.lineCap='round';ctx.strokeStyle='#10201c';
 if(kind==='armor'){ctx.beginPath();ctx.moveTo(-4,-4);ctx.lineTo(4,-4);ctx.lineTo(4,0);ctx.quadraticCurveTo(4,4,0,5.5);ctx.quadraticCurveTo(-4,4,-4,0);ctx.closePath();ctx.lineWidth=2.5;ctx.stroke();ctx.fillStyle='#c9d4e0';ctx.fill()}
 else if(kind==='fast'){ctx.lineWidth=3.5;for(const ox of [-2.5,1.5]){ctx.beginPath();ctx.moveTo(ox-1.5,-3.5);ctx.lineTo(ox+1.5,0);ctx.lineTo(ox-1.5,3.5);ctx.stroke()}ctx.lineWidth=1.6;ctx.strokeStyle='#ffd35a';for(const ox of [-2.5,1.5]){ctx.beginPath();ctx.moveTo(ox-1.5,-3.5);ctx.lineTo(ox+1.5,0);ctx.lineTo(ox-1.5,3.5);ctx.stroke()}}
 else{for(const [dx,dy] of [[-3,1.5],[3,1.5],[0,-2.5]]){ctx.beginPath();ctx.arc(dx,dy,2.1,0,Math.PI*2);ctx.lineWidth=1.5;ctx.stroke();ctx.fillStyle='#f39ac0';ctx.fill()}}
 ctx.restore();
}
function drawDebuffs(enemy,point){let icons=activeDebuffs(enemy),size=10,gap=2,start=point.x-(icons.length*size+Math.max(0,icons.length-1)*gap)/2;ctx.save();ctx.font='bold 8px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';icons.forEach((key,i)=>{let x=start+i*(size+gap),y=point.y-(enemy.kind==='boss'||enemy.kind==='miniboss'?42:30);ctx.fillStyle=debuffIcons[key].color;ctx.fillRect(x,y,size,size);ctx.strokeStyle='#17201d';ctx.lineWidth=1;ctx.strokeRect(x,y,size,size);ctx.fillStyle='#fff';ctx.fillText(debuffIcons[key].label,x+size/2,y+size/2)});ctx.restore()}
const combatFeedback=[];
function showDamageFeedback(enemy,amount,type){if(!(amount>0))return;let existing=combatFeedback.find(e=>e.kind==='damage'&&e.enemy===enemy&&e.damageType===type&&e.age<.35);if(existing){existing.amount+=amount;return}if(enemy.max>0&&amount<enemy.max*.01&&enemy.hp>0)return;let p=pathPoint(enemy.d||0);if(combatFeedback.length>=40)combatFeedback.shift();combatFeedback.push({kind:'damage',enemy,damageType:type,amount,x:p.x,y:p.y-28,age:0,duration:.8})}
function showSkillFeedback(unit,name){if(combatFeedback.length>=40)combatFeedback.shift();combatFeedback.push({kind:'skill',text:name,x:unit.x,y:unit.y-24,age:0,duration:1.2})}
function updateCombatFeedback(dt){for(const entry of combatFeedback)entry.age+=dt;for(let i=combatFeedback.length-1;i>=0;i--)if(combatFeedback[i].age>=combatFeedback[i].duration)combatFeedback.splice(i,1)}
function formatDamage(amount){let n=Math.max(1,Math.round(amount));return n>=100000?Math.round(n/10000)+'만':n>=10000?(n/10000).toFixed(1).replace(/\.0$/,'')+'만':String(n)}
function drawCombatFeedback(){if(!showDamageNumbers)return;ctx.save();ctx.textAlign='center';for(const entry of combatFeedback){let impact=entry.kind==='damage'&&entry.enemy?.max>0?Math.min(1,entry.amount/entry.enemy.max):0,size=entry.kind==='skill'?12:Math.round(10+impact*24);ctx.font=`bold ${Math.min(18,size)}px sans-serif`;ctx.globalAlpha=Math.max(0,1-entry.age/entry.duration);ctx.fillStyle=entry.kind==='skill'?'#f4e5a6':entry.damageType==='물리'?'#ffc977':'#8fd3ff';ctx.strokeStyle='#10201c';ctx.lineWidth=3;let label=entry.kind==='skill'?entry.text:formatDamage(entry.amount),y=entry.y-entry.age*22;ctx.strokeText(label,entry.x,y);ctx.fillText(label,entry.x,y)}ctx.restore()}
function enemyDefenseDescription(enemy){let a=defense(enemy,'물리'),m=defense(enemy,'마법');return a>m*1.5?'물리 방어가 높음':m>a*1.5?'마법 저항이 높음':'물리·마법 방어가 비슷함'}
let currentTheme=null,lastBossAbility=null,themePending=false;
const runStats={unitTypes:{},damage:{},physical:0,magic:0,unattributed:0,supportDamage:0,bosses:[],highest:null};
const supportUses={bomb:0,slow:0,loan:0};let loanRounds=0,loanRemaining=0;
let combatTime=0;
// Within a grade, recipes cost 2~5x more normal units from cheapest to priciest while base stats follow the grade only.
// Attack and skill power scale by (normal cost / grade median cost)^costExponent so expensive recipes are worth building.
const gradeMedianCost={};
function unitCostPower(t){if(!t?.normal_cost)return 1;if(!Object.keys(gradeMedianCost).length){let by={};for(const x of Object.values(types))if(x.normal_cost)(by[x.grade]=by[x.grade]||[]).push(x.normal_cost);for(const [g,l] of Object.entries(by)){l.sort((a,b)=>a-b);gradeMedianCost[g]=l[l.length>>1]}}let m=gradeMedianCost[t.grade];return m?Math.pow(t.normal_cost/m,combatRules.costExponent??0):1}
const v5State={costPower:t=>unitCostPower(t),get time(){return combatTime},get types(){return types},get units(){return units},get enemies(){return enemies},get powerBonus(){return progression.levels.power*.02},get gradePower(){return combatRules.gradePower},gradeLevels,pathPoint,runAttackBonus:u=>types[u.type].damage_type==='물리'?runLevels.physical*.08:types[u.type].damage_type==='마법'?runLevels.magic*.08:0,get runSpeedBonus(){return runLevels.speed*.05},get runBurnBonus(){return runLevels.burn*.12},get runSlowBonus(){return runLevels.slow*.08},get runArmorBonus(){return runLevels.armor*.1},get runResistBonus(){return runLevels.resist*.1},adjustDamage:(enemy,amount)=>amount*(enemy.kind==='boss'?1+runLevels.boss*.08:1),onSkillEffect:(unit,def,effects,now)=>queueSkillFx(unit,types[unit.type],def,effects,now),onDamage:(enemy,amount,type,options={},hit=amount)=>{if(!options.dot)globalThis.ManmulSound?.play(type==='마법'?'hitMagic':'hitPhys');showDamageFeedback(enemy,Math.max(amount,hit),type);if(type==='물리')runStats.physical+=amount;else if(type==='마법')runStats.magic+=amount;let id=options.source?.id,unitType=runStats.unitTypes[id];if(unitType)runStats.damage[unitType]=(runStats.damage[unitType]||0)+amount;else runStats.unattributed+=amount}};
const v5Combat=ManmulBridge.create(v5State,{...ManmulBasicData,...ManmulUpperBasicData});
// Basic attacks prefer the closest enemy. Skills can still use their own target rules.
function targetPriority(unit,a,b){let pa=pathPoint(a.d),pb=pathPoint(b.d),da=(pa.x-unit.x)**2+(pa.y-unit.y)**2,db=(pb.x-unit.x)**2+(pb.y-unit.y)**2;return da-db||b.d-a.d||a.id-b.id}
function findUnitTarget(unit,range,pointCache=null){let best=null,second=null,alternate=!!ManmulUpperBasicData[unit.type]?.alternateTwo;for(const enemy of enemies){if(!(enemy.hp>0))continue;let cached=pointCache&&pointCache.get(enemy),point;if(cached&&cached.d===enemy.d)point=cached.point;else{point=pathPoint(enemy.d);if(pointCache)pointCache.set(enemy,{d:enemy.d,point})}let dx=point.x-unit.x,dy=point.y-unit.y;if(Math.abs(dx)>range||Math.abs(dy)>range||!(Math.hypot(dx,dy)<=range))continue;let candidate={e:enemy,p:point};if(!best||targetPriority(unit,enemy,best.e)<0){second=best;best=candidate}else if(alternate&&(!second||targetPriority(unit,enemy,second.e)<0))second=candidate}return alternate&&second&&best.e.id===unit.lastBasicTargetId?second:best}
// Keep combat deterministic across frame rates and playback speeds. Any
// unprocessed time is discarded when a reward dialog pauses the battle.
const combatStep=1/60;
let combatAccumulator=0;
function advanceGame(realDt){if((paused&&!multiActive())||ended){combatAccumulator=0;return}let elapsed=Math.max(0,Math.min(realDt,.05));advanceArrivalEffects(elapsed);combatAccumulator+=elapsed*gameSpeed;while(combatAccumulator+1e-10>=combatStep){combatAccumulator=Math.max(0,combatAccumulator-combatStep);update(combatStep);if(paused||ended){combatAccumulator=0;break}}}
function ownedUnits(){return units}
function recipeMatches(r){let used=[];for(const type of r.parts){let u=ownedUnits().find(x=>x.type===type&&!used.includes(x.id));if(!u)return null;used.push(u.id)}return used}
function selectedRecipeMatches(recipe){let chosen=[],pool=selected.map(id=>units.find(unit=>unit.id===id)).filter(Boolean);for(const type of recipe.parts){let unit=pool.find(candidate=>candidate.type===type&&!chosen.includes(candidate.id));if(!unit)return null;chosen.push(unit.id)}return chosen}
function saleValue(unit){return Math.floor(types[unit.type].normal_equivalent*summonCost/2)}
// Same-grade conversion: rerolls one unit into a random different unit of its grade so dead-end materials can be recycled.
// Legendary and special grades (disaster, paradox, celestial) are excluded to keep their acquisition deliberate.
const conversionCosts={'노말':10,'매직':15,'레어':40,'에픽':100,'유니크':250};
function conversionCost(unit){let cost=conversionCosts[types[unit.type]?.grade];return cost==null?null:runRelics.convert?Math.ceil(cost*relicRules.convert):cost}
function convertUnit(id){if(ended||paused)return;let unit=units.find(u=>u.id===id);if(!unit||!selected.includes(id))return;let grade=types[unit.type].grade,cost=conversionCost(unit);if(cost===null){notice(grade+' 등급은 변환할 수 없습니다','fusion-warning');return}if(gold<cost){notice('골드가 부족합니다');return}let pool=Object.keys(types).filter(type=>types[type].grade===grade&&type!==unit.type);if(!pool.length)return;let next=pool[Math.floor(Math.random()*pool.length)],previous=units;units=units.filter(u=>u.id!==id);let u=addUnit(next,unit.x,unit.y);if(!u){units=previous;notice('변환할 공간이 부족합니다','fusion-warning');return}gold-=cost;selected=selected.map(value=>value===id?u.id:value);selectedEnemy=null;showArrivalEffect(grade,u);notice(`${types[unit.type].name} → ${types[next].name} 변환`);updateUI()}
function sellUnit(id){if(ended||paused)return;let unit=units.find(u=>u.id===id);if(!unit||!selected.includes(id))return;let value=saleValue(unit);units=units.filter(u=>u.id!==id);selected=selected.filter(selectedId=>selectedId!==id);gold+=value;notice(types[unit.type].name+' 판매 · '+value+'골드 획득');updateUI()}
function combine(index,preserveScroll=false){if(ended||paused)return;let oldViewport=preserveScroll?$('#fusionViewport'):null,oldScroll=oldViewport?.scrollLeft??0;let r=recipes[index];if(!r)return;if(selected.length<2){notice('선택한 재료가 변경되었습니다','fusion-warning');updateUI();return}let ids=selectedRecipeMatches(r);if(!ids){notice('선택한 재료가 변경되었습니다','fusion-warning');updateUI();return}let resultGrade=types[r.result].grade;if(specialGradeLimit(resultGrade)!==null&&units.filter(u=>types[u.type].grade===resultGrade&&!ids.includes(u.id)).length>=specialGradeLimit(resultGrade)){notice(resultGrade+' 전용 슬롯이 이미 사용 중입니다','fusion-warning');return}let origin=units.find(u=>ids.includes(u.id));if(!origin){notice('선택한 재료가 변경되었습니다','fusion-warning');updateUI();return}let place=roomyPosition(r.result,origin.x,origin.y,ids)||freePosition(r.result,origin.x,origin.y,ids);if(!place){notice('조합 유닛이 등장할 공간이 부족합니다','fusion-warning');return}let previousUnits=units;units=units.filter(u=>!ids.includes(u.id));let u=addUnit(r.result,place.x,place.y);if(!u){units=previousUnits;notice('조합 유닛이 등장할 공간이 부족합니다','fusion-warning');return}showArrivalEffect(types[r.result].grade,u);recordAcquire(r.result);selected=[...selected.filter(id=>!ids.includes(id)&&units.some(unit=>unit.id===id)),u.id];selectedEnemy=null;notice(types[r.result].name+' 조합 성공!');updateUI();if(oldViewport){let viewport=$('#fusionViewport');if(viewport){viewport.scrollLeft=oldScroll;refreshFusionArrows()}}}
let recipeBookContext={filter:null,mainOnly:false};
function filterRecipeFaction(faction){openRecipes(recipeBookContext.filter,recipeBookContext.mainOnly,faction)}
function openRecipesForUnit(id){if(!types[id])return;openRecipes(id,false,'all');$('#modalContent').scrollTop=0}
function openRecipes(filter=null,mainOnly=false,faction='all'){if(ended)return;recipeBookContext={filter,mainOnly};let list=recipes.map((r,i)=>({r,i})).filter(({r})=>(faction==='all'||types[r.result].faction_id===faction)&&(!filter||r.result===filter||(mainOnly?r.main===filter:r.parts.includes(filter))));if(filter)list.sort((a,b)=>Number(b.r.result===filter)-Number(a.r.result===filter)||a.i-b.i);let categories=[{id:'all',name:'전체'},...rosterData.factions];let tabs=categories.map(c=>`<button class="faction-tab" aria-pressed="${c.id===faction}" onclick="filterRecipeFaction('${c.id}')">${c.name}</button>`).join('');$('#modalContent').innerHTML=modalOpen({eyebrow:'CODEX',title:'조합 도감',close:'조합 도감 닫기',variant:'recipe-book'})+'<div class="faction-tabs" aria-label="등급 분류">'+tabs+'</div>'+(filter?`<p class="book-filter-summary"><strong style="color:${gradeColors[types[filter].grade]}">${types[filter].name}</strong> 조합식 <button type="button" onclick="openRecipes()">전체 보기</button></p>`:'<p class="muted">유닛 아이콘을 누르면 관련 조합식을 볼 수 있습니다.</p>')+'<div class="book-recipes">'+list.map(({r,i})=>`<div class="book-recipe"><div class="book-formula"><span class="book-result">${bookUnitIcon(r.result)}<strong class="book-unit-name" style="color:${gradeColors[types[r.result].grade]}">${types[r.result].name}</strong></span><span class="book-arrow" aria-label="조합 재료">←</span><span class="book-ingredients">${recipeBookIngredients(r)}</span></div><span class="book-actions"><button onclick="setGoal('${r.result}')">목표 지정</button></span></div>`).join('')+(list.length?'':'<p>이 분류에서 표시할 조합이 없습니다.</p>')+'</div>'+modalClose();$('#modal').classList.remove('hidden')}
function openUpgrades(){if(ended)return;const grades=ManmulRoster.grades;$('#modalContent').innerHTML=modalOpen({eyebrow:'UPGRADE',title:'등급 강화',close:'등급 강화 닫기'})+'<p class="ui-modal-lead">해당 등급의 모든 아군 공격력과 기술 위력을 한 판 동안 강화합니다. 새로 소환하거나 조합한 유닛에도 적용됩니다.</p><div class="upgrade-list">'+grades.map(g=>{let level=gradeLevels[g],cost=30+level*20;return `<div class="upgrade-row"><strong class="upgrade-grade" style="color:${gradeColors[g]}">${g}</strong><span class="upgrade-pips" role="img" aria-label="${level}단계">${'<i class="on"></i>'.repeat(level)}${'<i></i>'.repeat(Math.max(0,5-level))}</span><span class="upgrade-bonus">공격력·기술 위력 +${level*10}%</span><button onclick="upgradeGrade('${g}')" ${level>=5||gold<cost?'disabled':''}>${level>=5?'최대':cost+'골드'}</button></div>`}).join('')+'</div>'+modalClose();$('#modal').classList.remove('hidden')}
function upgradeGrade(grade){let level=gradeLevels[grade],cost=30+level*20;if(level>=5||gold<cost)return;gold-=cost;gradeLevels[grade]++;globalThis.ManmulSound?.play('upgrade');updateUI();openUpgrades()}
let helpPreviousPause=null, menuPreviousPause=null, menuPage=null;
let showDamageNumbers=true;
try{showDamageNumbers=localStorage.getItem('rift-show-damage')!=='false'}catch(e){}
function setDamageNumbers(value){showDamageNumbers=!!value;try{localStorage.setItem('rift-show-damage',String(showDamageNumbers))}catch(e){}}
function openBattleMenu(){if(ended||inLobby||!$('#modal').classList.contains('hidden'))return;menuPreviousPause=paused;paused=true;renderBattleMenu();$('#modal').classList.remove('hidden');updateUI()}
function renderBattleMenu(){menuPage='main';$('#modalContent').innerHTML=`${modalOpen({eyebrow:multiActive()?'MENU':'PAUSED',title:'게임 메뉴',close:'게임 메뉴 닫기',variant:'battle-menu'})}${multiActive()?'<p class="ui-modal-lead">멀티 플레이 중에는 메뉴를 열어도 전투가 계속됩니다.</p>':''}<button class="menu-primary" onclick="closeModal()">계속하기</button><button onclick="openBattleSettings()">설정</button><button onclick="openHelp()">도움말</button><button onclick="openTestMenu()">테스트 모드</button><button class="menu-exit" onclick="confirmLeaveBattle()">게임 나가기</button>${modalClose()}`}
// Sound rows: on/off and volume per group (whole, effects, warnings·progress). Changes are saved by ManmulSound.
function soundSettingsHtml(){let v=ManmulSound.settings,slider=(key,label,hint)=>`<label class="setting-row"><span><strong>${label}</strong><small>${hint}</small></span><input type="range" min="0" max="100" step="5" value="${Math.round(v[key]*100)}" onchange="ManmulSound.set('${key}',this.value/100)" aria-label="${label}"></label>`;return `<label class="setting-row"><span><strong>소리</strong><small>효과음을 켜거나 끕니다.</small></span><input type="checkbox" ${v.enabled?'checked':''} onchange="ManmulSound.set('enabled',this.checked)"></label>${slider('master','전체 음량','모든 소리의 크기')}${slider('sfx','효과음','소환·조합·공격·처치')}${slider('alert','경고·진행','라운드 시작·보스·적 수 경고·보상')}${slider('ui','버튼·알림','버튼 클릭·오류·채팅')}`}
function openBattleSettings(){if(menuPreviousPause===null)return;menuPage='settings';$('#modalContent').innerHTML=`${modalOpen({eyebrow:'SETTINGS',title:'설정',variant:'battle-menu'})}<label class="setting-row"><span><strong>피해 숫자 표시</strong><small>전투 중 피해량과 기술 이름을 표시합니다.</small></span><input type="checkbox" ${showDamageNumbers?'checked':''} onchange="setDamageNumbers(this.checked)"></label><label class="setting-row"><span><strong>초보자 안내</strong><small>처음 겪는 상황마다 짧은 안내를 띄웁니다. 전투는 멈추지 않습니다.</small></span><input type="checkbox" ${typeof ManmulTutorial==='object'&&ManmulTutorial.enabled?'checked':''} onchange="ManmulTutorial.setEnabled(this.checked)"></label>${typeof ManmulSound==='object'?soundSettingsHtml():''}<button type="button" class="setting-reset" onclick="ManmulTutorial.reset();notice('안내를 처음부터 다시 보여 줍니다')">안내 다시 보기</button>${modalClose('<button class="ui-btn-ghost" onclick="renderBattleMenu()">← 뒤로</button>')}`}
function openTestMenu(message=''){if(menuPreviousPause===null||ended||inLobby)return;menuPage='test';$('#modalContent').innerHTML=`${modalOpen({eyebrow:'TEST MODE',title:'테스트 모드',variant:'battle-menu test-menu'})}<p class="ui-modal-lead">사용한 전투는 기록과 파편 보상을 얻지 않습니다.</p><p class="test-menu-label">등급별 무작위 유닛 1기 소환</p><div class="test-grade-grid">${ManmulRoster.grades.map(grade=>`<button type="button" onclick="testSummonGrade('${grade}')">${grade} 소환</button>`).join('')}</div><button type="button" onclick="testAddGold()">골드 1,000 획득</button><button type="button" onclick="testSpawnUpperUnits()">상위 등급 유닛 일괄 소환</button><p class="test-menu-status" role="status">${message}</p>${modalClose('<button type="button" class="ui-btn-ghost" onclick="renderBattleMenu()">← 뒤로</button>')}`}
function specialGradeLimit(grade){return grade==='재앙'?1:grade==='천체'?2:null}
function testSummonGrade(grade){if(menuPreviousPause===null||menuPage!=='test'||ended||inLobby||!ManmulRoster.grades.includes(grade))return;if(specialGradeLimit(grade)!==null&&units.filter(u=>types[u.type].grade===grade).length>=specialGradeLimit(grade)){openTestMenu(grade+' 전용 슬롯이 이미 사용 중입니다.');return}let candidates=Object.values(types).filter(t=>t.grade===grade);if(!candidates.length){openTestMenu('해당 등급의 유닛이 없습니다.');return}let type=candidates[Math.floor(Math.random()*candidates.length)],u=addUnit(type.id);if(!u){openTestMenu('유닛을 소환할 공간이 부족합니다.');return}markTestRun();selectedEnemy=null;selected=[u.id];showArrivalEffect('summon',u);updateUI();openTestMenu(type.name+' 소환 완료')}
function testAddGold(){if(menuPreviousPause===null||menuPage!=='test'||ended||inLobby)return;gold+=1000;markTestRun();updateUI();openTestMenu('골드 1,000 획득 · 현재 '+gold+'골드')}
function testSpawnUpperUnits(){if(menuPreviousPause===null||menuPage!=='test'||ended||inLobby)return;let before=units.length;spawnTestUnits();openTestMenu('상위 등급 유닛 '+(units.length-before)+'기 소환 완료')}
function confirmLeaveBattle(){if(menuPreviousPause===null)return;menuPage='exit';$('#modalContent').innerHTML=`${modalOpen({eyebrow:'EXIT',title:'게임 나가기'})}<p>${typeof ManmulSave==='object'&&!testRun&&!(typeof Multiplayer==='object'&&Multiplayer.started)?'진행 상황은 저장되어 로비에서 이어할 수 있습니다. 로비로 돌아갈까요?':'현재 진행 중인 전투는 저장되지 않습니다. 로비로 돌아갈까요?'}</p>${modalClose('<button class="ui-btn-ghost" onclick="renderBattleMenu()">계속하기</button><button class="ui-btn-danger" onclick="location.reload()">로비로 나가기</button>')}`}

function openHelp(){if(ended||inLobby||(!$('#modal').classList.contains('hidden')&&menuPreviousPause===null))return;if(menuPreviousPause!==null)menuPage='help';else{helpPreviousPause=paused;paused=true;}$('#modalContent').innerHTML=`${modalOpen({eyebrow:'HELP',title:'게임 도움말',close:'도움말 닫기',variant:'help-modal'})}<p><strong>목표</strong><br>바깥길을 도는 적을 처치하세요. 적이 101마리가 되면 패배합니다.</p><p><strong>균열 순환</strong><br>적이 바깥길을 한 바퀴 돌 때마다 최대 체력이 늘어납니다(최대 5회, 체력바 옆 빨간 점). 감속·묶기로 순환을 늦추면 적이 강해지기 전에 처치할 수 있습니다.</p><p><strong>선택권</strong><br>15라운드부터 중간 보스를 처치하면 유닛 선택권을 얻습니다(15·25라운드 노말 2장, 35라운드부터 매직 1장). 오른쪽 위 선택권 버튼으로 원하는 유닛을 골라 소환하며, 쓰기 전까지 보관됩니다.</p><p><strong>보스 보상</strong><br>보스를 처치하면 보상 3개 중 하나를 고릅니다. 수치 강화는 최대 3단계까지 쌓이고, 유물은 규칙을 바꾸며 판마다 한 번만 얻습니다.</p><p><strong>소환과 조합</strong><br>Q 또는 소환 버튼으로 노말 유닛을 뽑습니다. 전장에서 재료 유닛을 함께 선택하고 조합 카드를 누르세요. E 조합 도감에서 조합식을 확인할 수 있습니다. W는 해당 등급 전체를 강화합니다. 쓰임이 적은 유닛은 한 기만 선택해 변환(D)하면 골드를 내고 같은 등급의 다른 유닛으로 무작위로 바뀝니다(노말~유니크).</p><p><strong>이동과 전투</strong><br>왼쪽 클릭이나 드래그로 선택하고 오른쪽 클릭으로 이동합니다. 같은 유닛을 더블클릭하면 같은 종류를 모두 선택합니다. 이동 중에는 공격하지 않으며 S로 정지할 수 있습니다.</p><p><strong>특수 유닛과 연계</strong><br>재앙은 전장에 한 기, 천체는 두 기까지 배치할 수 있습니다. 표식이 붙은 적에게 다른 공격을 맞히면 조건에 따라 연계가 발생합니다.</p><p><strong>라운드</strong><br>준비 시간은 30초이며, 이후 자동으로 라운드가 진행됩니다. 다음 스테이지 버튼으로 준비 시간을 넘기거나 적을 모두 처치한 뒤 다음 라운드를 시작할 수 있습니다.</p>${modalClose()}`;$('#modal').classList.remove('hidden')}
function closeModal(){if(themePending||pendingRewards.length)return;if(menuPreviousPause!==null){if(menuPage!=='main'){renderBattleMenu();return}paused=menuPreviousPause;menuPreviousPause=null;menuPage=null;$('#modal').classList.add('hidden');updateUI();return}$('#modal').classList.add('hidden');if(helpPreviousPause!==null){paused=helpPreviousPause;helpPreviousPause=null}}

function canAdvanceStage(){return !multiActive()&&!ended&&!paused&&wave<maxWave&&(wave===0||(spawnLeft===0&&enemies.length===0&&(!isMidWave(wave)||minibossCleared)))}
function showRoundBanner(round){
 let box=$('#roundBanner'),title=$('#roundBannerTitle'),detail=$('#roundBannerDetail');
 title.textContent=`${round} 라운드`;
 detail.textContent=isBossWave(round)?`${upcomingBoss?upcomingBoss.name:'보스'} 등장`:isMidWave(round)?'중간 보스 라운드':'라운드 시작';
 box.classList.remove('hidden','is-visible');void box.offsetWidth;box.classList.add('is-visible');
}
$('#roundBanner').addEventListener('animationend',event=>{if(event.target===$('#roundBanner')){$('#roundBanner').classList.add('hidden');$('#roundBanner').classList.remove('is-visible')}});
function startWave(){if(ended||(paused&&!multiActive())||wave>=maxWave)return;globalThis.ManmulSound?.play('wave');wave++;ManmulRecords.waveStarted(wave,enemies.length);minibossSpawned=false;minibossCleared=false;spawnLeft=isBossWave(wave)?1:Math.round(40*(currentTheme?ManmulThemes.waveCountFactor(currentTheme,selectedDifficulty?.themeIntensity??0,wave):1));spawnInterval=spawnDuration/Math.max(1,spawnLeft);spawnTimer=0;waveTimer=0;let income=(selectedDifficulty?selectedDifficulty.income:combatRules.roundReward)+progression.levels.income;if(loanRounds>0){let deduction=Math.min(12,income);income-=deduction;loanRemaining-=deduction;loanRounds--;if(!loanRounds)loanRemaining=0}if(runRelics.interest)income+=Math.min(relicRules.interestCap,Math.floor(gold*relicRules.interest));gold+=income;showRoundBanner(wave);updateUI()}
function clearSelection(){selected=[];selectedEnemy=null;updateUI()}
// power = base (grade efficiency and recipe cost included) + bonus (grade upgrades, permanent progression, run rewards, buffs).
function selectedUnitStats(unit){let t=types[unit.type],profile=v5Combat.profile(unit),interval=v5Combat.attackInterval(unit),range=(v5Combat.range(unit)/45).toFixed(1)+'타일',total=Math.round(t.uses_basic?profile.attack:profile.skill_power||0),base=Math.round((t.uses_basic?t.attack:(t.skill_power??t.attack))*(combatRules.gradePower[t.grade]??1)*unitCostPower(t));return {powerLabel:t.uses_basic?'공격력':'기술 위력',power:total,base:Math.min(base,total),bonus:Math.max(0,total-base),level:gradeLevels[t.grade]||0,range:unit.type==='L002'?'기본 전체 · 기술 '+range:unit.type==='L007'?'전장 전체':range,speed:t.uses_basic&&interval?Number((1/interval).toFixed(2))+'회/초':'—'}}
function updateUI(){if(typeof ManmulTutorial==='object')ManmulTutorial.check();$('#themeStatus').textContent=currentTheme?ManmulThemes.themes[currentTheme].name:'미정';$('#themeStatus').title=currentTheme?ManmulThemes.themes[currentTheme].description:'';$('#waveLabel').textContent=wave===0?'준비 시간':'라운드';$('#wave').textContent=wave===0?`${Math.ceil(preparation)}초`:`${wave} / ${maxWave}`;$('#waveSub').textContent=wave===0?'Q 소환 · 다음 스테이지로 시작':isMidWave(wave)&&waveTimer>=roundInterval&&!minibossCleared?'중간 보스 라운드 정리 중':isMidWave(wave)&&waveTimer>=roundInterval&&revealTime>0?'다음 보스 예고 확인 중':wave<maxWave?'다음 '+Math.max(0,Math.ceil(roundInterval-waveTimer))+'초':'마지막 라운드';$('#gold').textContent=String(gold);{let tb=$('#ticketButton');if(tb){tb.classList.toggle('hidden',!ticketTotal());tb.textContent=`선택권 ${ticketTotal()}`}}$('#count').textContent=String(enemies.length);$('#countGauge').style?.setProperty('width',Math.min(100,enemies.length)+'%');$('.hud-enemies').dataset.level=enemies.length>=80?'danger':enemies.length>=60?'warn':'safe';$('#count').classList.toggle('danger',enemies.length>=80);$('#summon').classList.toggle('is-unavailable',gold<summonCost);$('#actionHint').textContent=gold<summonCost?'소환: 골드 부족':'';$('#next').disabled=!canAdvanceStage();$('#next').title=wave>=maxWave?'마지막 라운드입니다':paused?'일시정지 중입니다':spawnLeft>0||enemies.length>0?'남은 적을 처치하면 진행할 수 있습니다':isMidWave(wave)&&!minibossCleared?'중간 보스를 처치하면 진행할 수 있습니다':'';updateGoal();let sel=units.filter(u=>selected.includes(u.id));let box=$('#selection');if(selectedEnemy){let e=enemies.find(x=>x.id===selectedEnemy);if(e){box.classList.remove('hidden');box.dataset.signature='enemy';box.innerHTML=`<button type="button" class="selection-close selection-close-float" aria-label="선택 해제" onclick="clearSelection()">×</button><strong>${e.name||'균열 몬스터'}</strong><br>체력 ${Math.max(0,Math.ceil(e.hp))} / ${Math.ceil(e.max)}<br>방어력 <span class="${defense(e,'물리')<e.armor?'stat-reduced':''}">${defense(e,'물리')}</span> · 마법 저항력 <span class="${defense(e,'마법')<e.resist?'stat-reduced':''}">${defense(e,'마법')}</span><br><span class="muted">${enemyDefenseDescription(e)}</span>${e.bossAbilityName?`<br>능력: ${e.bossAbilityName}`:''}${e.shield>0?`<br>보호막 ${Math.ceil(e.shield)}`:''}${e.laps?`<br>순환 ${e.laps}회 · 최대 체력 +${Math.round(e.laps*(selectedDifficulty?.lapGrowth??lapRules.growth)*100)}%`:''}`;return}selectedEnemy=null}if(!sel.length){box.classList.add('hidden');box.innerHTML='';box.dataset.signature='';return}let currentStats=sel.length===1?selectedUnitStats(sel[0]):null;let signature=(currentStats?JSON.stringify(currentStats)+'|':'')+selected.join(',')+'|'+sel.map(u=>u.type).join(',')+'|'+ownedUnits().map(u=>u.type).sort().join(',')+'|'+JSON.stringify(gradeLevels);if(box.dataset.signature===signature)return;box.dataset.signature=signature;box.classList.toggle('hidden',!sel.length);if(sel.length===1){let t=types[sel[0].type];box.innerHTML=`<div class="selection-toolbar"><div class="selection-toolbar-group"><button type="button" onclick="sellUnit(${sel[0].id})">판매 · ${saleValue(sel[0])}골드</button>${conversionCost(sel[0])!==null?`<button type="button" class="convert-button" onclick="convertUnit(${sel[0].id})" title="같은 등급의 다른 유닛으로 무작위 변환 (D)">변환 · ${conversionCost(sel[0])}골드</button>`:''}</div><div class="selection-toolbar-group"><button type="button" onclick="openRecipes('${t.id}',false)">조합 도감</button><button type="button" class="selection-toolbar-close" aria-label="유닛 선택 해제" onclick="clearSelection()">×</button></div></div><div class="unit-panel-left"><div class="unit-header"><span class="unit-heading-main"><span class="unit-portrait" style="${portraitStyle(t.id)}" aria-hidden="true">${portraitContent(t.id)}</span><span class="unit-identity"><strong style="color:${gradeColors[t.grade]}">${t.name}</strong><span class="unit-grade" style="color:${gradeColors[t.grade]}">${t.grade} · ${t.damage_type}</span>${t.title?`<span class="unit-title">${t.title}</span>`:''}</span></span></div>${renderRoleTags(t)}<div class="unit-info"><div class="unit-stats"><div><span>${currentStats.powerLabel}</span><strong>${currentStats.base}${currentStats.bonus>0?`<span class="stat-bonus" title="등급 강화·버프로 오른 수치">+${currentStats.bonus}</span>`:''}</strong></div><div><span>사거리</span><strong>${currentStats.range}</strong></div><div><span>공격속도</span><strong>${currentStats.speed}</strong></div></div><div class="unit-skills"><span class="unit-section-label">스킬</span><div class="skill-list">${unitSkillIcons(t,gradeLevels[t.grade]||0)}</div></div></div></div>`;}else if(sel.length){let options=recipes.map((r,i)=>({r,i,ids:selectedRecipeMatches(r)})).filter(option=>option.ids).sort((a,b)=>ManmulRoster.grades.indexOf(types[b.r.result].grade)-ManmulRoster.grades.indexOf(types[a.r.result].grade)||a.i-b.i);box.innerHTML=`<div class="fusion-panel"><div class="selection-toolbar fusion-toolbar"><div class="selection-toolbar-group"><button type="button" class="selection-toolbar-close" onclick="clearSelection()" aria-label="선택 해제">×</button></div></div>${options.length?`<div class="fusion-carousel"><button id="fusionPrev" class="fusion-arrow hidden" type="button" onclick="moveFusionCards(-1)" aria-label="이전 조합 카드">‹</button><div id="fusionViewport" class="fusion-viewport" onscroll="refreshFusionArrows()">${options.map(({r,i})=>{let result=types[r.result];return `<button type="button" class="fusion-card" data-result="${r.result}" ${['매직','레어','에픽','유니크','레전더리','재앙','역설','천체'].includes(result.grade)?`data-illustrated="true" style="--fusion-card-image:url('assets/ui/fusion-cards/${r.result}.webp')"`:''} onclick="combine(${i},event.shiftKey)" aria-label="${result.name} 조합"><span class="fusion-portrait" style="${portraitStyle(r.result)}" aria-hidden="true">${portraitContent(r.result)}</span><strong style="color:${gradeColors[result.grade]}">${result.name}</strong><span class="fusion-materials">${[...new Set(r.parts)].map(id=>{let quantity=r.parts.filter(part=>part===id).length;return `<span class="fusion-ingredient" title="${types[id].name}${quantity>1?' ×'+quantity:''}"><span class="fusion-ingredient-icon" style="${bookPortraitStyle(id)}" aria-hidden="true">${portraitContent(id)}</span><span class="fusion-ingredient-name">${types[id].name}</span>${quantity>1?`<span class="fusion-ingredient-count">×${quantity}</span>`:''}</span>`}).join('')}</span></button>`}).join('')}</div><button id="fusionNext" class="fusion-arrow hidden" type="button" onclick="moveFusionCards(1)" aria-label="다음 조합 카드">›</button></div>`:'<p class="fusion-empty">조합 가능한 식이 없습니다</p>'}</div>`;if(options.length)requestAnimationFrame(refreshFusionArrows)}}
function refreshFusionArrows(){let view=$('#fusionViewport'),prev=$('#fusionPrev'),next=$('#fusionNext');if(!view||!prev||!next)return;prev.classList.toggle('hidden',view.scrollLeft<=1);next.classList.toggle('hidden',view.scrollLeft+view.clientWidth>=view.scrollWidth-1)}
function moveFusionCards(direction){let view=$('#fusionViewport');if(!view)return;view.scrollBy({left:(direction<0?-1:1)*view.clientWidth,behavior:'smooth'})}
addEventListener('resize',()=>requestAnimationFrame(refreshFusionArrows));

function record(result){try{let r=JSON.parse(localStorage.getItem('rift-record')||'{}');r.best=Math.max(r.best||0,wave);r.plays=(r.plays||0)+1;r.wins=(r.wins||0)+(result?1:0);if(selectedDifficulty){if(!r.byDifficulty||typeof r.byDifficulty!=='object'||Array.isArray(r.byDifficulty))r.byDifficulty={};let d=r.byDifficulty[selectedDifficultyId]||{},count=n=>Number.isInteger(n)&&n>=0?n:0;d.best=Math.max(count(d.best),wave);d.plays=count(d.plays)+1;d.wins=count(d.wins)+(result?1:0);r.byDifficulty[selectedDifficultyId]=d}localStorage.setItem('rift-record',JSON.stringify(r))}catch(e){}}
function resultDetails(){let top=Object.entries(runStats.damage).sort((a,b)=>b[1]-a[1]).slice(0,3).map(([id,n])=>`${types[id].name} ${Math.round(n).toLocaleString()}`).join(' · ')||'없음';return `<p>전장 ${currentTheme?ManmulThemes.themes[currentTheme].name:'없음'} · ${selectedDifficulty?.name||'일반'} · ${wave}라운드</p><p>처치한 보스: ${runStats.bosses.join(', ')||'없음'}</p><p>유물: ${ownedRelicNames().join(', ')||'없음'}</p><p>최고 등급 유닛: ${runStats.highest?types[runStats.highest].name+' ('+types[runStats.highest].grade+')':'없음'}</p><p>물리 피해 ${Math.round(runStats.physical).toLocaleString()} · 마법 피해 ${Math.round(runStats.magic).toLocaleString()}</p><p>유닛별 피해: ${top}</p><p>출처 미확인 피해 ${Math.round(runStats.unattributed).toLocaleString()} · 지원 피해 ${Math.round(runStats.supportDamage).toLocaleString()}</p><p>긴급 지원: 폭격 ${supportUses.bomb}회 · 봉쇄 ${supportUses.slow}회 · 자금 ${supportUses.loan}회</p>`}
// 기록·업적: 해금 알림과 결과 화면의 "이번 판에서" 영역. 화면 디자인은 임시이며 Codex 작업 후 교체한다.
ManmulRecords.nameOf=id=>types[id]?.name||id;ManmulRecords.gradeOf=id=>types[id]?.grade||null;
function recordRewardText(reward){let labels={titles:'칭호',plates:'명찰',icons:'아이콘'};return (reward||[]).map(([group,id])=>`${labels[group]} 「${profileCosmetics[group]?.[id]?.name||id}」`).join(', ')}
function recordUnlockText(item){return item.kind==='icon'?`아이콘 해금 · ${item.name}`:`업적 달성 · ${item.name}`+(item.reward?.length?` → ${recordRewardText(item.reward)}`:'')}
ManmulRecords.onUnlock(item=>{if(!ended)notice('✦ '+recordUnlockText(item),'unlock')});
function runRecordHtml(summary){if(!summary)return '';let unlocked=summary.unlocked.map(item=>`<li class="run-record-new">${escapeProfileText(recordUnlockText(item))}</li>`).join(''),progress=summary.progress.map(p=>`<li><span>${escapeProfileText(p.label)}</span><span class="run-record-bar" aria-hidden="true" style="--before:${Math.round(p.before/p.max*100)}%"><i style="width:${Math.round(p.after/p.max*100)}%"></i></span><b>${p.before.toLocaleString()} → ${p.after.toLocaleString()}/${p.max.toLocaleString()}</b></li>`).join('');if(!unlocked&&!progress)return '';return `<section class="run-record"><h3>이번 판에서</h3>${unlocked?`<ul class="run-record-list">${unlocked}</ul>`:''}${progress?`<ul class="run-record-list run-record-progress">${progress}</ul>`:''}<small>새로 얻은 꾸미기는 로비의 프로필에서 장착할 수 있습니다.</small></section>`}
addEventListener('pagehide',()=>{if(ManmulRecords.run)ManmulRecords.save()});
function win(){if(ended)return;ended=true;if(!testRun)record(true);let reward,summary=testRun?null:ManmulRecords.finishRun({won:true,theme:currentTheme});if(testRun)reward="테스트 모드에서는 파편과 기록을 얻을 수 없습니다.";else{let result=grantClearRewards(selectedDifficultyId);reward=result.saved?`균열의 파편 ${result.shards}개 획득!`:"보상을 저장하지 못했습니다. 브라우저 저장소를 확인해 주세요."}$('#modalContent').innerHTML=`${modalOpen({eyebrow:'VICTORY',title:'방어 성공!',variant:'result-modal is-victory'})}<div class="result-stats">${resultDetails()}</div><p class="result-reward">${reward}</p>${runRecordHtml(summary)}${modalClose('<button class="ui-btn-primary" onclick="location.reload()">로비로 돌아가기</button>')}`;$('#modal').classList.remove('hidden')}
function end(){if(ended)return;ended=true;if(!testRun)record(false);let summary=testRun?null:ManmulRecords.finishRun({won:false,theme:currentTheme});$('#modalContent').innerHTML=`${modalOpen({eyebrow:'DEFEAT',title:'방어 실패',variant:'result-modal is-defeat'})}<p class="ui-modal-lead">몬스터가 100마리를 초과했습니다.</p><div class="result-stats">${resultDetails()}</div><p class="result-reward">획득한 파편: 0</p>${runRecordHtml(summary)}${modalClose('<button class="ui-btn-primary" onclick="location.reload()">로비로 돌아가기</button>')}`;$('#modal').classList.remove('hidden')}
// Placeholder lap marker: one red pip per completed lap, to the right of the health bar.
function drawLapPips(e,x,y){if(!e.laps)return;ctx.fillStyle='#17201d';ctx.fillRect(x-1,y-1,e.laps*3+1,5);ctx.fillStyle='#ff6b5e';for(let i=0;i<e.laps;i++)ctx.fillRect(x+i*3,y,2,3)}
// Ember relic: a burning enemy's strongest active burn jumps to the nearest living enemies along the path.
function spreadEmbers(enemy){let burn=(enemy.manmulDots||[]).filter(d=>d.kind==='burn'&&d.until>combatTime).sort((a,b)=>b.amount-a.amount)[0];if(!burn)return;let L=pathLength(),gap=e=>{let x=Math.abs(((e.d-enemy.d)%L+L)%L);return Math.min(x,L-x)};for(const t of enemies.filter(e=>e!==enemy&&e.hp>0&&gap(e)<=relicRules.emberRange).sort((a,b)=>gap(a)-gap(b)).slice(0,relicRules.emberTargets))v5Combat.effects.applyDot(t,'relic:ember:'+enemy.id,burn.amount,relicRules.emberDuration,burn.type,combatTime,'burn')}
function pathPoint(d){let o=world.outer,p=2*(o.w+o.h);d=(((d+2*o.w+o.h)%p)+p)%p;if(d<o.w)return {x:o.x+d,y:o.y+o.h};d-=o.w;if(d<o.h)return{x:o.x+o.w,y:o.y+o.h-d};d-=o.h;if(d<o.w)return{x:o.x+o.w-d,y:o.y};d-=o.w;return{x:o.x,y:o.y+d}}
function drawV5Summons(){for(const summon of v5Combat.summons.active){ctx.fillStyle='#d9e7a7';ctx.beginPath();ctx.arc(summon.x,summon.y,6,0,Math.PI*2);ctx.fill()}}
function update(dt){if((paused&&!multiActive())||ended)return;combatTime+=dt;enemyDeathEffects=enemyDeathEffects.filter(effect=>combatTime-effect.startedAt<enemyDeathDuration);if(wave===0){preparation=Math.max(0,preparation-dt);if(preparation===0&&!multiActive())startWave()}if(revealTime>0)revealTime=Math.max(0,revealTime-dt);
if(spawnLeft>0){spawnTimer-=dt;if(spawnTimer<=0){if(isBossWave(wave)){globalThis.ManmulSound?.play('bossSpawn');spawnEnemy('boss',upcomingBoss||(()=>{let b=nextBossFromBag();return {...b,ability:currentTheme&&b.ability?ManmulThemes.abilityOf(currentTheme,b.ability):null}})());upcomingBoss=null;$('#bossPreview').classList.add('hidden')}else{let kind=wave>=4&&spawnLeft%7===0?'fast':wave>=8&&spawnLeft%6===0?'armor':wave>=12&&spawnLeft%5===0?'swarm':'normal';spawnEnemy(kind);if(isMidWave(wave)&&!minibossSpawned&&spawnLeft===20&&!ended){spawnEnemy('miniboss');minibossSpawned=true}}spawnLeft--;spawnTimer+=spawnInterval;if(ended)return}}
if(wave>0&&wave<maxWave){waveTimer+=dt;if(waveTimer>=roundInterval&&(!isMidWave(wave)||minibossCleared)&&revealTime<=0&&!multiActive())startWave()}
let targetPointCache=new WeakMap();for(let u of units){let t=types[u.type],dx=u.tx-u.x,dy=u.ty-u.y,dist=Math.hypot(dx,dy);if(dist>1){if(u.bestDistance===undefined||dist<u.bestDistance-.5){u.bestDistance=dist;u.stuckTime=0}else u.stuckTime=(u.stuckTime||0)+dt;if(u.stuckTime>=0.5){u.tx=u.x;u.ty=u.y;u.stuckTime=0;u.bestDistance=0;continue}let step=Math.min(dist,t.speed*dt),heading=Math.atan2(dy,dx),area=world.inner;let clear=(x,y)=>x>=area.x+t.radius&&x<=area.x+area.w-t.radius&&y>=area.y+t.radius&&y<=area.y+area.h-t.radius&&units.every(v=>v.id===u.id||Math.hypot(v.x-x,v.y-y)>=t.radius+types[v.type].radius);let offsets=[0,.3,-.3,.6,-.6,.9,-.9,1.2,-1.2,1.55,-1.55,1.9,-1.9,2.3,-2.3,2.7,-2.7,Math.PI];if(u.avoidSide<0)offsets=offsets.map(a=>-a);let moved=false;for(let angle of offsets){let nx=u.x+Math.cos(heading+angle)*step,ny=u.y+Math.sin(heading+angle)*step;if(clear(nx,ny)){if(Math.abs(nx-u.x)>.05)u.artFacing=nx<u.x?-1:1;u.x=nx;u.y=ny;if(Math.abs(angle)>.1&&!u.avoidSide)u.avoidSide=Math.sign(angle);if(angle===0)u.avoidSide=0;moved=true;break}}if(!moved)u.avoidSide=-(u.avoidSide||1)}else{let target=findUnitTarget(u,t.grade==='재앙'||u.type==='L002'||u.type==='L007'?Infinity:v5Combat.range(u),targetPointCache);v5Combat.tickPassive(u,combatTime,target?.e);u.cool-=dt;if(t.active&&(target||ManmulSkillData[u.type]?.global||t.grade==='재앙')&&v5Combat.castSkill(u,combatTime))showSkillFeedback(u,t.skill_name);if(target){if(t.uses_basic&&u.cool<=0&&target.e.hp>0){let normal=!!normalMotionSpecs[u.type]||!!magicMotionSpecs[u.type]||!!upperMotionSpecs[u.type],fired=normal?(startNormalBasic(u,target.e,target.p),true):v5Combat.basicAttack(u,target.e,combatTime);if(fired){u.lastBasicTargetId=target.e.id;u.cool=v5Combat.attackInterval(u);u.artAttackAt=combatTime;u.artFacing=target.p.x<u.x?-1:1;if(!normal)shots.push({x:u.x,y:u.y,ex:target.p.x,ey:target.p.y,t:.12,color:t.damage_type==='물리'?'#ffe5c3':'#a8d8ff'})}}}}}
v5Combat.tickSummons();for(let e of enemies){ManmulThemes.update(e,combatTime);let status=v5Combat.tickEnemy(e),slow=e.bossAbility==='tenacity'?status.slow*.5:status.slow;if(!status.rooted)e.d+=e.speed*ManmulThemes.speedMultiplier(e,combatTime)*(1-slow)*dt;applyLapGrowth(e,slow>0||status.rooted)}
updateNormalBasicProjectiles();if(runRelics.execute)for(const e of enemies)if(e.hp>0&&e.kind!=='boss'&&e.kind!=='miniboss'&&e.hp<=e.max*relicRules.execute)e.hp=0;let dead=enemies.filter(e=>e.hp<=0);if(dead.length){for(const enemy of dead){if(runRelics.ember)spreadEmbers(enemy);if(enemy.kind==='miniboss')grantTickets(enemy.spawnWave);globalThis.ManmulSound?.play(enemy.kind==='boss'?'bossDown':'kill');queueEnemyDeath(enemy);ManmulRecords.kill(enemy,{gold,time:combatTime});if(enemy.kind==='boss')runStats.bosses.push(enemy.name+' · '+(enemy.bossAbilityName||''));queueBossReward(enemy)}gold+=dead.reduce((total,e)=>total+combatRules.enemyKinds[e.kind].reward+(runRelics.bounty&&e.kind!=='boss'&&e.kind!=='miniboss'&&Math.random()<relicRules.bounty?1:0),0);enemies=enemies.filter(e=>e.hp>0)}if(isMidWave(wave)&&minibossSpawned&&!minibossCleared&&spawnLeft===0&&!enemies.some(e=>e.spawnWave===wave)){minibossCleared=true;revealBoss()}if(wave===maxWave&&spawnLeft===0&&enemies.length===0&&pendingRewards.length===0){win();globalThis.ManmulSound?.play('victory');multiFinished(true);return}shots=shots.filter(s=>(s.t-=dt)>0);updateCombatFeedback(dt);if(toastTimer>0&&(toastTimer-=dt)<=0)$('#toast').classList.add('hidden');updateUI()}
function drawViewportFog(){
 if(introRemaining<=0)return;
 if(playerProfile.mapSkin!=='forest'&&textureReady(skinIntroImage)){
  const progress=1-introRemaining/introTotal,ease=progress*progress*(3-2*progress);
  const layer=(image,scale,alpha)=>{if(!textureReady(image))return;const iw=image.naturalWidth||innerWidth,ih=image.naturalHeight||innerHeight,factor=Math.max(innerWidth/iw,innerHeight/ih)*scale,w=iw*factor,h=ih*factor;ctx.globalAlpha=alpha;ctx.drawImage(image,(innerWidth-w)/2,(innerHeight-h)/2,w,h)};
  ctx.save();const fogColors={snow:'#d4e7ed',desert:'#b58b59',lava:'#383637',sky:'#d9e8eb',mushroom:'#343257',cherry:'#d6afbc',library:'#627f79',clockwork:'#685e50',deepsea:'#285966',candy:'#e1c6c5',stars:'#242e4a',amusement:'#596460'};
  const veil=Math.max(0,1-Math.min(1,progress/.78));ctx.globalAlpha=veil;ctx.fillStyle=fogColors[playerProfile.mapSkin]||'#506467';ctx.fillRect(0,0,innerWidth,innerHeight);
  // Cover the viewport with the full layer; shrinking it exposes hard image edges.
  layer(skinIntroImage,1.08+ease*.32,Math.max(0,1-ease));
  layer(skinNearImage,1.18+ease*.95,Math.max(0,1-Math.min(1,progress/.68)));
  const colors={snow:'#eaf7ff',desert:'#d4ac70',lava:'#ed874b',sky:'#effaff',mushroom:'#b5bbff',cherry:'#f7b7d4',library:'#b6d5c9',clockwork:'#c2b497',deepsea:'#92dce9',candy:'#f9d4ef',stars:'#f4e8b5',amusement:'#d2aa82'};
  ctx.fillStyle=colors[playerProfile.mapSkin]||'#ffffff';ctx.globalAlpha=.7*(1-ease);
  for(let i=0;i<42;i++){let x=((i*137.7+progress*(70+i%7*11))%innerWidth),y=((i*89.1+progress*(160+i%5*20))%innerHeight),size=1+(i%3);ctx.beginPath();ctx.arc(x,y,size,0,Math.PI*2);ctx.fill()}
  ctx.restore();return;
 }
 const progress=1-introRemaining/introTotal,fade=Math.max(0,Math.min(1,(progress-.08)/.82));
 const opacity=1-fade*fade*(3-2*fade),scale=1.08+progress*.12;
 const w=innerWidth*scale,h=innerHeight*scale;
 ctx.save();
 // One continuous viewport-sized mist layer hides hard stage-sized seams.
 if(textureReady(introViewportFill)){
  ctx.globalAlpha=opacity*.88;ctx.drawImage(introViewportFill,(innerWidth-w)/2,(innerHeight-h)/2,w,h);
 }
 if(textureReady(introViewportFog)){
  ctx.globalAlpha=opacity;ctx.filter='blur(12px)';
  ctx.drawImage(introViewportFog,(innerWidth-w)/2,(innerHeight-h)/2,w,h);
 }
 ctx.restore();
}
// The modal backdrop lives inside the scaled stage; extend the same dimming
// over the exposed viewport outside it without darkening the stage twice.
function drawModalOuterBackdrop(){
 if($('#modal').classList.contains('hidden'))return;
 const m=stageMetrics(),w=STAGE_W*m.scale,h=STAGE_H*m.scale;
 ctx.save();ctx.fillStyle='#0009';
 if(m.left>0){ctx.fillRect(0,0,m.left,innerHeight);ctx.fillRect(m.left+w,0,innerWidth-m.left-w,innerHeight)}
 if(m.top>0){ctx.fillRect(m.left,0,w,m.top);ctx.fillRect(m.left,m.top+h,w,innerHeight-m.top-h)}
 ctx.restore();
}
function draw(){if(spectate?.view)drawSpectateScene();else drawScene();drawViewportFog();drawModalOuterBackdrop()}
// After the intro the outer ruins stay visible (dimmed) so the stage has no black side bars.
function drawOuterRuins(){if(introRemaining>0||!textureReady(introOutside))return;ctx.save();ctx.drawImage(introOutside,-250,-175,1500,1050);ctx.fillStyle='rgba(5,9,12,.18)';ctx.fillRect(-250,-175,1500,1050);let fade=(x0,y0,x1,y1)=>{let g=ctx.createLinearGradient(x0,y0,x1,y1);g.addColorStop(0,'rgba(5,9,12,.92)');g.addColorStop(1,'rgba(5,9,12,0)');return g};ctx.fillStyle=fade(-250,0,0,0);ctx.fillRect(-250,-175,250,1050);ctx.fillStyle=fade(1250,0,1000,0);ctx.fillRect(1000,-175,250,1050);ctx.fillStyle=fade(0,-175,0,0);ctx.fillRect(-250,-175,1500,175);ctx.fillStyle=fade(0,875,0,700);ctx.fillRect(-250,700,1500,175);ctx.restore()}
function drawForestBackdrop(){
 ctx.fillStyle='#101d19';ctx.fillRect(0,0,innerWidth,innerHeight);
 if(playerProfile.mapSkin!=='forest'&&textureReady(skinBackdrop)){
  const iw=skinBackdrop.naturalWidth,ih=skinBackdrop.naturalHeight||iw*.7,camera=introRemaining>0?introCameraState():{zoom:1,x:0,y:0};
  // Use the same camera pivot, zoom, and shake as the board. At the start of
  // the approach the camera reveals beyond the artwork; extend its edge pixels
  // under the entrance fog instead of changing the background's camera speed.
  const base=Math.max(innerWidth/iw,innerHeight/ih)*1.10,t=transform(),w=iw*base*camera.zoom,h=ih*base*camera.zoom;
  const cx=t.x+world.w*t.scale/2+camera.x*t.scale,cy=t.y+world.h*t.scale/2+camera.y*t.scale,x=cx-w/2,y=cy-h/2;
  ctx.drawImage(skinBackdrop,x,y,w,h);
  const left=Math.max(0,x),right=Math.max(0,innerWidth-x-w),top=Math.max(0,y),bottom=Math.max(0,innerHeight-y-h);
  if(left)ctx.drawImage(skinBackdrop,0,0,1,ih,0,y,left,h);
  if(right)ctx.drawImage(skinBackdrop,iw-1,0,1,ih,x+w,y,right,h);
  if(top)ctx.drawImage(skinBackdrop,0,0,iw,1,x,0,w,top);
  if(bottom)ctx.drawImage(skinBackdrop,0,ih-1,iw,1,x,y+h,w,bottom);
  if(left&&top)ctx.drawImage(skinBackdrop,0,0,1,1,0,0,left,top);
  if(right&&top)ctx.drawImage(skinBackdrop,iw-1,0,1,1,x+w,0,right,top);
  if(left&&bottom)ctx.drawImage(skinBackdrop,0,ih-1,1,1,0,y+h,left,bottom);
  if(right&&bottom)ctx.drawImage(skinBackdrop,iw-1,ih-1,1,1,x+w,y+h,right,bottom);
  return;
 }
 if(!textureReady(forestBackdrop))return;
 const iw=forestBackdrop.naturalWidth||1500,ih=forestBackdrop.naturalHeight||1050;
 const camera=introRemaining>0?introCameraState():{zoom:1,x:0,y:0};
 const scale=Math.max(innerWidth/iw,innerHeight/ih)*1.02*camera.zoom/.75,w=iw*scale,h=ih*scale;
 const t=transform(),cx=t.x+world.w*t.scale/2+camera.x*t.scale,cy=t.y+world.h*t.scale/2+camera.y*t.scale;ctx.drawImage(forestBackdrop,cx-w/2,cy-h/2,w,h);
}
function drawForestBoundary(target=ctx){
 if(!textureReady(forestBoundary))return;
 const o=world.outer;target.save();target.beginPath();target.rect(-100,-70,1200,840);
 // Keep every enemy lane and the entire unit placement area unobscured.
 target.rect(o.x-40,o.y-40,o.w+80,o.h+80);target.clip('evenodd');
 target.drawImage(forestBoundary,-100,-70,1200,840);target.restore();
}
// Composite once into a separate layer and feather only its outer margins.
// The enemy route and unit area are fully opaque; no game geometry changes.
let blendedArena=null;
function drawBlendedArena(){
 if(playerProfile.mapSkin!=='forest'&&textureReady(skinMapImage)){
  // The skin illustration contains incidental scenery outside the board.
  // Draw only the board and its corridor; the backdrop is a separate layer.
  const x=.117,y=.089,w=.766,h=.822,iw=skinMapImage.naturalWidth,ih=skinMapImage.naturalHeight||iw*1049/1500;
  ctx.drawImage(skinMapImage,iw*x,ih*y,iw*w,ih*h,world.w*x,world.h*y,world.w*w,world.h*h);return
 }
 const ready=Object.values(arenaTextures).every(textureReady)&&textureReady(forestBoundary);
 if(!ready||typeof document.createElement!=='function'){drawArena();drawForestBoundary();return}
 if(!blendedArena){
  const layer=document.createElement('canvas');layer.width=world.w;layer.height=world.h;
  const brush=layer.getContext('2d');
  if(!brush){drawArena();drawForestBoundary();return}
  drawArena(brush);drawForestBoundary(brush);
  brush.globalCompositeOperation='destination-in';
  for(const [x0,y0,x1,y1] of [[0,0,105,0],[world.w,0,world.w-105,0],[0,0,0,60],[0,world.h,0,world.h-60]]){
   const g=brush.createLinearGradient(x0,y0,x1,y1);g.addColorStop(0,'rgba(0,0,0,0)');g.addColorStop(1,'rgba(0,0,0,1)');brush.fillStyle=g;brush.fillRect(0,0,world.w,world.h);
  }
  brush.globalCompositeOperation='source-over';blendedArena=layer;
 }
 ctx.drawImage(blendedArena,0,0,world.w,world.h);
}
// ---- Spectating another player's map (read-only) ----
// spectate = {id,name,view,unit}; view comes from Multiplayer: {wave,maxWave,gold,levels,units:[[id,type,x,y]],enemies:[[id,d,hp,max,kind,laps,spawnWave]]}.
let spectate=null,spectateDrawing=false;const spectateKinds=['normal','fast','armor','swarm','miniboss','boss'];
function startSpectate(id,name){spectate={id,name,view:spectate?.id===id?spectate.view:null,unit:null};selected=[];selectedEnemy=null;drag=null;renderSpectateUi();updateUI()}
function stopSpectate(){if(!spectate)return;spectate=null;renderSpectateUi();if(typeof Multiplayer==='object')Multiplayer.stopWatching();updateUI()}
function setSpectateView(id,view){if(!spectate||spectate.id!==id||!view||typeof view!=='object')return;spectate.view=view;renderSpectateUi()}
function spectateUnits(){return (spectate?.view?.units||[]).filter(u=>Array.isArray(u)&&types[u[1]]).map(([id,type,x,y])=>({id,type,x,y,tx:x,ty:y,artAttackAt:-10}))}
function drawSpectateScene(){let v=spectate.view,save={units,enemies,shots,selected,selectedEnemy,enemyDeathEffects,drag};
 units=spectateUnits();enemies=(v.enemies||[]).filter(Array.isArray).map(([id,d,hp,max,k,laps,spawnWave])=>({id,d,hp,max:max||1,kind:spectateKinds[k]||'normal',laps,spawnWave}));
 shots=[];selected=spectate.unit&&units.some(u=>u.id===spectate.unit)?[spectate.unit]:[];selectedEnemy=null;enemyDeathEffects=[];drag=null;spectateDrawing=true;
 try{drawScene()}finally{spectateDrawing=false;({units,enemies,shots,selected,selectedEnemy,enemyDeathEffects,drag}=save)}}
function spectatePick(p){let u=[...spectateUnits()].reverse().find(u=>Math.hypot(u.x-p.x,u.y-p.y)<types[u.type].radius+5);spectate.unit=u?u.id:null;renderSpectateUi()}
// Read-only unit info: base attack and the part from that player's grade upgrades (their buffs are not shared).
function renderSpectateUi(){let bar=$('#spectateBar'),panel=$('#spectatePanel');if(!bar||!panel)return;
 if(!spectate){bar.classList.add('hidden');panel.classList.add('hidden');panel.innerHTML='';return}
 let v=spectate.view;bar.classList.remove('hidden');bar.innerHTML=`<strong>관전 중 · ${spectate.name}</strong><span>${v?`${v.wave}/${v.maxWave}라운드 · 몬스터 ${(v.enemies||[]).length} · 유닛 ${(v.units||[]).length}`:'화면을 받는 중…'}</span><button type="button" onclick="stopSpectate()">내 맵으로 (Esc)</button>`;
 let u=spectate.unit&&spectateUnits().find(x=>x.id===spectate.unit);if(!u){panel.classList.add('hidden');panel.innerHTML='';return}
 let t=types[u.type],level=v?.levels?.[t.grade]||0,base=Math.round((t.uses_basic?t.attack:(t.skill_power??t.attack))*(combatRules.gradePower[t.grade]??1)*unitCostPower(t)),bonus=Math.round(base*level*.1);
 panel.classList.remove('hidden');panel.innerHTML=`<strong style="color:${gradeColors[t.grade]}">${t.name}</strong> <small>${t.grade} · ${t.damage_type}</small><div class="spectate-stat">${t.uses_basic?'공격력':'기술 위력'} ${base}${bonus?`<span class="stat-bonus">+${bonus}</span>`:''} · 사거리 ${(t.range/45).toFixed(1)}타일</div><div class="skill-list">${unitSkillIcons(t,level)}</div><small class="spectate-note">다른 플레이어의 유닛은 정보만 볼 수 있습니다. 강화 외 버프는 표시되지 않습니다.</small>`}
function drawScene(){ctx.clearRect(0,0,innerWidth,innerHeight);drawForestBackdrop();let t=transform();ctx.save();ctx.translate(t.x,t.y);ctx.scale(t.scale,t.scale);
 ctx.save();ctx.beginPath();ctx.rect(0,0,world.w,world.h);ctx.clip();if(introRemaining>0){let camera=introCameraState();ctx.translate(camera.x,camera.y);ctx.translate(world.w/2,world.h/2);ctx.scale(camera.zoom,camera.zoom);ctx.translate(-world.w/2,-world.h/2)}drawBlendedArena();ctx.restore();drawArenaIntro();drawArenaImpact();drawEnemyDeathEffects();for(let e of enemies){let p=pathPoint(e.d);if(!drawEnemySprite(e,p)){ctx.fillStyle=e.color||({miniboss:'#f59b58',boss:'#b04bce',fast:'#ffcf69',armor:'#aab0b9',swarm:'#e980ac',normal:'#d85e70'})[e.kind]||'#d85e70';ctx.beginPath();ctx.arc(p.x,p.y,e.kind==='boss'?15:e.kind==='miniboss'?12:9,0,Math.PI*2);ctx.fill();ctx.fillStyle='#271a2d';ctx.fillRect(p.x-4,p.y-2,2,2);ctx.fillRect(p.x+2,p.y-2,2,2)}let healthY=p.y-enemyVisualSize(e.kind)/2-6,ratio=Math.max(0,e.hp/e.max),elite=e.kind==='boss'||e.kind==='miniboss',barW=elite?34:20;if(ratio<.999||elite||e.laps){ctx.fillStyle='#17201d';ctx.fillRect(p.x-barW/2-1,healthY-1,barW+2,5);ctx.fillStyle=ratio>.5?'#8bed8c':ratio>.25?'#f2c94c':'#ff6b5e';ctx.fillRect(p.x-barW/2,healthY,barW*ratio,3)}drawEnemyKindBadge(e.kind,p.x-barW/2-7,healthY+1.5);drawLapPips(e,p.x+barW/2+3,healthY);drawDebuffs(e,p)}if(!spectateDrawing)drawV5Summons();for(let s of shots){ctx.strokeStyle=s.color;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(s.x,s.y);ctx.lineTo(s.ex,s.ey);ctx.stroke()}if(!spectateDrawing)drawArrivalEffects();for(let u of units){drawUnitGradeBase(u);drawUnitGradeAura(u)}for(let u of units){let type=types[u.type];if(selected.includes(u.id)){if(selected.length===1){ctx.strokeStyle='#d8f5bd55';ctx.lineWidth=1;ctx.beginPath();ctx.arc(u.x,u.y,v5Combat.range(u),0,Math.PI*2);ctx.stroke()}if(Math.hypot(u.tx-u.x,u.ty-u.y)>1){ctx.strokeStyle='#d8f5bd88';ctx.beginPath();ctx.moveTo(u.x,u.y);ctx.lineTo(u.tx,u.ty);ctx.stroke()}ctx.strokeStyle='#d7ff86';ctx.lineWidth=2;ctx.beginPath();ctx.arc(u.x,u.y,(type.radius+5)*unitVisualScale(u),0,Math.PI*2);ctx.stroke()}if(!drawUnitSprite(u)){ctx.fillStyle=type.color;ctx.beginPath();ctx.arc(u.x,u.y,type.radius,0,Math.PI*2);ctx.fill();ctx.fillStyle='#f2f7e8';ctx.beginPath();ctx.arc(u.x-type.radius*.28,u.y-type.radius*.12,Math.max(2,type.radius*.18),0,Math.PI*2);ctx.arc(u.x+type.radius*.28,u.y-type.radius*.12,Math.max(2,type.radius*.18),0,Math.PI*2);ctx.fill();ctx.fillStyle='#19322c';ctx.beginPath();ctx.arc(u.x-type.radius*.28,u.y-type.radius*.12,1.2,0,Math.PI*2);ctx.arc(u.x+type.radius*.28,u.y-type.radius*.12,1.2,0,Math.PI*2);ctx.fill();}}if(!spectateDrawing){drawNormalBasicFx();drawSkillFx(ctx,combatTime);drawCombatFeedback()}if(drag){ctx.strokeStyle='#dcf9b3';ctx.lineWidth=1;ctx.strokeRect(drag.x,drag.y,drag.end.x-drag.x,drag.end.y-drag.y)}ctx.restore()}
function loop(time){let dt=Math.min((time-last)/1000||0,.05);last=time;if(!updateArenaIntro(dt))advanceGame(dt);if(ended&&!paused&&enemyDeathEffects.length){enemyDeathEndElapsed+=dt*gameSpeed;enemyDeathEffects=enemyDeathEffects.filter(effect=>combatTime+enemyDeathEndElapsed-effect.startedAt<enemyDeathDuration)}draw();requestAnimationFrame(loop)}requestAnimationFrame(loop);
// Hidden or background tabs get no animation frames. When frames stop for 0.25s in a synced multiplayer game, keep simulating from a timer so this player stays
// in step with the room (browsers run background timers about once a second, or less, so catch up in 50ms steps).
if(typeof setInterval==='function'&&typeof performance==='object')setInterval(()=>{if(!multiActive())return;let t=performance.now(),dt=Math.min(60,Math.max(0,(t-last)/1000));if(dt<.25)return;last=t;let left=dt;while(left>1e-6&&introRemaining>0){updateArenaIntro(Math.min(.05,left));left-=.05}for(;left>1e-6;left-=.05)advanceGame(Math.min(.05,left))},250);
function selectSameType(point,additive=false){let unit=[...units].reverse().find(u=>Math.hypot(u.x-point.x,u.y-point.y)<types[u.type].radius+5);if(!unit)return;let matches=units.filter(u=>u.type===unit.type).map(u=>u.id);selected=additive?[...new Set([...selected,...matches])]:matches;selectedEnemy=null;updateUI()}
canvas.addEventListener('dblclick',e=>{if(spectate||ended||paused||e.button!==0)return;selectSameType(pos(e),e.shiftKey)});
canvas.addEventListener('contextmenu',e=>e.preventDefault());canvas.addEventListener('pointerdown',e=>{if(spectate){if(e.button===0)spectatePick(pos(e));return}if(ended||paused||introRemaining>0)return;let p=pos(e);if(e.button===2){let group=units.filter(u=>selected.includes(u.id));issueMove(group,p);return}if(e.button===0)drag={x:p.x,y:p.y,end:p,shift:e.shiftKey,ctrl:e.ctrlKey}});canvas.addEventListener('pointermove',e=>{if(drag)drag.end=pos(e)});addEventListener('pointerup',e=>{if(!drag)return;let p=pos(e),a=drag;drag=null;let found;if(Math.hypot(p.x-a.x,p.y-a.y)<6){let u=[...units].reverse().find(u=>Math.hypot(u.x-p.x,u.y-p.y)<types[u.type].radius+5);found=u?[u.id]:[]}else{let x1=Math.min(a.x,p.x),x2=Math.max(a.x,p.x),y1=Math.min(a.y,p.y),y2=Math.max(a.y,p.y);found=units.filter(u=>u.x>=x1&&u.x<=x2&&u.y>=y1&&u.y<=y2).map(u=>u.id)}if(a.ctrl&&Math.hypot(p.x-a.x,p.y-a.y)<6){if(found.length){let id=found[0];selected=selected.includes(id)?selected.filter(value=>value!==id):[...selected,id];selectedEnemy=null}updateUI();return}selectedEnemy=null;if(!found.length&&Math.hypot(p.x-a.x,p.y-a.y)<6){let enemy=[...enemies].reverse().find(e=>{let q=pathPoint(e.d);return Math.hypot(q.x-p.x,q.y-p.y)<(e.kind==='boss'?18:12)});if(enemy)selectedEnemy=enemy.id}selected=a.shift?[...new Set([...selected,...found])]:found;updateUI()});
$('#summon').title=`노말 소환 ${summonCost}골드 · ${rosterData.units.filter(u=>u.grade==='N').map(u=>u.name).join('·')} 각 ${(100/rosterData.units.filter(u=>u.grade==='N').length).toFixed(2)}%`;$('#menuButton').onclick=openBattleMenu;$('#speed').onclick=()=>{if(typeof Multiplayer==='object'&&Multiplayer.syncActive){Multiplayer.cycleSpeedRequest();return}gameSpeed=gameSpeed%3+1;$('#speed').textContent=`X${gameSpeed}`};$('#rewardButton').onclick=showReward;$('#summon').onclick=summon;$('#upgrades').onclick=openUpgrades;$('#recipes').onclick=()=>openRecipes();$('#next').onclick=()=>{if(canAdvanceStage()){revealTime=0;startWave()}};addEventListener('keydown',e=>{if(e.target?.closest?.('input,textarea'))return;if(spectate&&!inLobby){if(e.key==='Escape')stopSpectate();return}if(e.repeat||inLobby||introRemaining>0)return;let k=e.key.toLowerCase();if(k==='escape'){if(!$('#modal').classList.contains('hidden')&&!ended&&$('#begin'))return;if(!$('#modal').classList.contains('hidden')&&!ended)closeModal();else openBattleMenu();return}if(!$('#modal').classList.contains('hidden'))return;if(k==='q')summon();if(k==='w')openUpgrades();if(k==='e')openRecipes();if(k==='r'&&selected.length===1){let u=units.find(u=>u.id===selected[0]);if(u)openRecipes(u.type,true)}if(k==='d'&&selected.length===1)convertUnit(selected[0]);if(k==='s')units.filter(u=>selected.includes(u.id)).forEach(u=>{u.tx=u.x;u.ty=u.y;u.stuckTime=0;u.bestDistance=0})});
updateUI();initLobby();
function renderDifficultyRecord(){let id=Object.hasOwn(difficulties,$('#difficultySelect').value)?$('#difficultySelect').value:'normal',records={};try{records=JSON.parse(localStorage.getItem('rift-record')||'{}').byDifficulty||{}}catch(e){}let d=records[id]||{},plays=Number.isInteger(d.plays)&&d.plays>=0?d.plays:0,wins=Number.isInteger(d.wins)&&d.wins>=0?d.wins:0,best=Number.isInteger(d.best)&&d.best>=0?d.best:0;$('#hubDifficultyRecord').textContent=`${difficulties[id].name} · ${plays}전 ${wins}승${plays?' · 클리어율 '+Math.round(wins/plays*100)+'%':''} · 최고 ${best}라운드`}
function renderLobby(){if(typeof ManmulSave==='object')ManmulSave.renderLobby();
 $('#hubShards').textContent=progression.shards;
 let icons={preparation:'◈',income:'✦',power:'⚔'};
 $('#hubSkills').innerHTML=Object.entries(progressionSkills).map(([id,skill])=>{let level=progression.levels[id],locked=!!(skill.requires&&!progression.levels[skill.requires]),cost=skill.costs[level],disabled=locked||level>=skill.max||progression.shards<cost;return `<div class="hub-skill"><span class="hub-skill-icon" aria-hidden="true">${icons[id]}</span><span><strong>${skill.name} <small style="display:inline">${level}/${skill.max}</small></strong><small>${skill.description}${locked?' · 이전 강화 필요':''}</small></span><button type="button" onclick="buyHubSkill('${id}')" ${disabled?'disabled':''}>${level>=skill.max?'최대':`✦ ${cost} 강화`}</button></div>`}).join('');
 let record={};try{record=JSON.parse(localStorage.getItem('rift-record')||'{}')}catch(e){}$('#hubRecord').textContent=`최고 ${record.best||0}라운드 · ${record.wins||0}회 승리`;renderDifficultyRecord();
 renderProfile();
 for(const option of $('#difficultySelect').options||[]){let d=difficulties[option.value];if(d)option.textContent=`${d.name} · ${d.rounds}라운드 · 파편 ${clearShardRewards[option.value]}`}
}
// 수집 아이콘: 유닛은 기존 스프라이트, 보스는 초상화가 나오기 전까지 임시로 보스 색 + 첫 글자.
function bossInfo(id){return Object.values(ManmulThemes.bosses).flat().find(b=>b.id===id)||null}
function profileIconHtml(iconId){if(typeof iconId==='string'&&iconId.startsWith('unit:')&&types[iconId.slice(5)])return `<span class="profile-icon profile-icon-unit" style="--icon-color:#b69a64;${portraitStyle(iconId.slice(5))}" aria-hidden="true"></span>`;if(typeof iconId==='string'&&iconId.startsWith('boss:')){let b=bossInfo(iconId.slice(5));if(b)return `<span class="profile-icon profile-icon-boss" data-boss="${b.id}" style="--icon-color:${b.color};background-image:url('assets/ui/pixel-v1/bosses/${b.id}.png')" aria-hidden="true"><span class="boss-fallback">${escapeProfileText(b.name[0])}</span></span>`}let icon=profileCosmetics.icons[iconId]||profileCosmetics.icons.basic;return `<span class="profile-icon" style="--icon-color:${icon.color}" aria-hidden="true">${icon.symbol}</span>`}
function profileIconName(iconId){if(iconId.startsWith('unit:'))return types[iconId.slice(5)]?.name||iconId;if(iconId.startsWith('boss:'))return bossInfo(iconId.slice(5))?.name||iconId;return profileCosmetics.icons[iconId]?.name||iconId}
function profileBadge(profile=playerProfile){return `${profileIconHtml(profile.icon)}<span class="profile-text"><strong>${escapeProfileText(profile.name)}</strong><small>${profileCosmetics.titles[profile.title]?.name||''}</small></span>`}
function escapeProfileText(text){return String(text).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]))}
function renderProfile(){let card=$('#hubProfile');if(!card)return;card.className=`hub-profile plate-${playerProfile.plate}`;card.innerHTML=profileBadge();card.onclick=openProfileDialog}
let profileTab='look';
function profileLockText(group,id){let a=ManmulRecords.achievementForReward(group,id);if(a)return a.hidden&&!ManmulRecords.hasAchievement(a.id)?'숨겨진 업적':`업적 「${a.name}」`;return '잠김'}
function profileOptionHtml(group,slot,id,name,preview){let open=cosmeticUnlocked(group,id),on=playerProfile[slot]===id;return `<button type="button" class="profile-option" aria-pressed="${on}" ${open?'':'disabled'} onclick="equipCosmetic('${slot}','${id}')">${preview}<span><strong>${escapeProfileText(name)}</strong><small>${open?(on?'장착 중':'장착 가능'):profileLockText(group,id)}</small></span></button>`}
function profileLookHtml(){let section=(group,slot,label)=>`<section class="profile-section"><h3>${label}</h3><div class="profile-options">${Object.entries(profileCosmetics[group]).map(([id,item])=>profileOptionHtml(group,slot,id,item.name,group==='icons'?profileIconHtml(id):group==='plates'?`<span class="plate-swatch plate-${id}" aria-hidden="true"></span>`:'')).join('')}</div></section>`;
 let owned=Object.keys(ManmulRecords.data.icons).filter(id=>types[id.slice(5)]||bossInfo(id.slice(5))),collected=owned.length?`<div class="profile-options">${owned.map(id=>profileOptionHtml('icons','icon',id,profileIconName(id),profileIconHtml(id))).join('')}</div>`:'<p class="profile-hint">아직 모은 아이콘이 없습니다. 「수집」 탭에서 조건을 확인하세요.</p>';
 return `${section('titles','title','칭호')}${section('icons','icon','문장 아이콘')}<section class="profile-section"><h3>수집 아이콘</h3>${collected}</section>${section('plates','plate','명찰')}`}
function profileCollectionHtml(){let byGrade=ManmulRoster.grades.map(grade=>{let list=Object.entries(types).filter(([,t])=>t.grade===grade);if(!list.length)return '';let done=list.filter(([id])=>ManmulRecords.iconUnlocked('unit:'+id)).length;return `<details class="collection-grade"><summary>${grade} <small>${done}/${list.length} · ${ManmulRecords.unitIconThresholds[grade]}회 획득 시 해금</small></summary><div class="collection-grid">${list.map(([id,t])=>{let p=ManmulRecords.unitIconProgress(id,grade);return `<span class="collection-cell${p.unlocked?' is-open':''}" data-grade="${grade}" title="${escapeProfileText(t.name)} ${p.current}/${p.max}"><span class="profile-icon profile-icon-unit" style="${portraitStyle(id)}"></span><small>${p.unlocked?'✓':p.current+'/'+p.max}</small></span>`}).join('')}</div></details>`}).join('');
 let bosses=Object.entries(ManmulThemes.bosses).map(([theme,list])=>`<div class="collection-boss-row"><strong>${ManmulThemes.themes[theme].name}</strong>${list.map(b=>{let p=ManmulRecords.bossIconProgress(b.id);return `<span class="collection-cell${p.unlocked?' is-open':''}" title="${escapeProfileText(b.name)} ${p.current}/${p.max}">${profileIconHtml('boss:'+b.id)}<small>${p.unlocked?'✓':p.current+'/'+p.max}</small></span>`}).join('')}</div>`).join('');
 return `<section class="profile-section"><h3>유닛 아이콘</h3><p class="profile-hint">소환·조합으로 유닛을 정해진 횟수만큼 얻으면 그 유닛을 아이콘으로 쓸 수 있습니다.</p>${byGrade}</section><section class="profile-section"><h3>보스 초상화</h3><p class="profile-hint">보스를 ${ManmulRecords.bossIconThreshold}회 처치하면 초상화 아이콘이 열립니다.</p>${bosses}</section>`}
function profileAchievementsHtml(){let list=ManmulRecords.achievementList(),groups=[...new Set(list.map(a=>a.group))],done=list.filter(a=>a.done).length;return `<p class="profile-hint">달성 ${done}/${list.length}</p>`+groups.map(g=>`<section class="profile-section"><h3>${g}</h3><div class="achievement-list">${list.filter(a=>a.group===g).map(a=>`<div class="achievement-row${a.done?' is-done':''}" data-group="${({누적:'total',진행:'progress',테마:'theme',도전:'challenge'})[a.group]||''}"><span><strong>${escapeProfileText(a.name)}</strong><small>${escapeProfileText(a.desc)}</small></span><span class="run-record-bar" aria-hidden="true"><i style="width:${Math.round(a.current/a.max*100)}%"></i></span><small class="achievement-reward">${a.done?'✓ '+a.date:a.current.toLocaleString()+'/'+a.max.toLocaleString()}<br>${a.done||!a.name.startsWith('?')?recordRewardText(a.reward):'???'}</small></div>`).join('')}</div></section>`).join('')}
function switchProfileTab(tab){profileTab=tab;openProfileDialog()}
function profileMapsHtml(){return `<section class="profile-section"><h3>전장 스킨</h3><p class="profile-hint">선택한 스킨은 다음 전투에 적용됩니다.</p><div class="map-skin-options">${Object.entries(mapSkins).map(([id,name])=>`<button type="button" class="map-skin-option" aria-pressed="${playerProfile.mapSkin===id}" onclick="equipMapSkin('${id}')">${id==='forest'?'<span class="map-skin-forest" aria-hidden="true"><i></i><b></b></span>':`<img src="assets/ui/map-skins/${id}.webp" alt="">`}<span>${name}</span></button>`).join('')}</div></section>`}
function openProfileDialog(){let dialog=$('#profileDialog');if(!dialog)return;let tabs=[['look','꾸미기'],['maps','전장 스킨'],['collection','수집'],['achievements','업적']],body=profileTab==='maps'?profileMapsHtml():profileTab==='collection'?profileCollectionHtml():profileTab==='achievements'?profileAchievementsHtml():profileLookHtml();
 dialog.querySelector('.hub-dialog-panel').innerHTML=`<button type="button" class="hub-dialog-close" onclick="closeProfileDialog()" aria-label="프로필 닫기">×</button><h2 id="profileDialogTitle">프로필</h2><div class="hub-profile plate-${playerProfile.plate} profile-preview">${profileBadge()}</div><form class="profile-name" onsubmit="event.preventDefault();saveProfileName()"><label for="profileName">이름</label><input id="profileName" maxlength="12" value="${escapeProfileText(playerProfile.name)}" autocomplete="off"><button type="submit">저장</button></form><div class="profile-tabs" role="tablist">${tabs.map(([id,label])=>`<button type="button" role="tab" aria-selected="${profileTab===id}" onclick="switchProfileTab('${id}')">${label}</button>`).join('')}</div>${body}`;
dialog.classList.remove('hidden');dialog.onkeydown=e=>{if(e.key==='Escape')closeProfileDialog()};dialog.onclick=e=>{if(e.target===dialog)closeProfileDialog()};dialog.querySelector('#profileName')?.focus()}
function closeProfileDialog(){$('#profileDialog')?.classList.add('hidden');$('#hubProfile')?.focus()}
function equipCosmetic(slot,id){if(updateProfile({[slot]:id})){renderProfile();openProfileDialog()}}
function equipMapSkin(id){if(updateProfile({mapSkin:id})){loadMapSkin(id);openProfileDialog()}}
function saveProfileName(){let input=$('#profileName');if(input&&updateProfile({name:input.value})){renderProfile();openProfileDialog();$('#hubMessage').textContent='프로필이 저장되었습니다.'}}

function buyHubSkill(id){if(purchaseProgression(id)){$('#hubMessage').textContent='강화가 저장되었습니다. 다음 전투부터 적용됩니다.';renderLobby()}else $('#hubMessage').textContent='강화 조건이나 브라우저 저장소를 확인해 주세요.'}
function showThemeRoulette(){themePending=true;let ids=Object.keys(ManmulThemes.themes);currentTheme=(typeof Multiplayer==='object'&&Multiplayer.theme)||ids[Math.floor(Math.random()*ids.length)];let theme=ManmulThemes.themes[currentTheme];$('#modalContent').innerHTML=`${modalOpen({eyebrow:'RIFT THEME',title:'이번 전장의 균열',variant:'theme-roulette'})}<div class="theme-reel-window"><div class="theme-reel">${[...ids,...ids,...ids,currentTheme].map(id=>`<span class="theme-reel-item">${ManmulThemes.themes[id].name}</span>`).join('')}</div></div><div class="theme-result"><strong>${theme.name}</strong><p>${theme.description}</p><p>보스는 이 테마에 맞는 능력을 사용합니다.</p></div>${modalClose('<button class="ui-btn-primary" onclick="confirmTheme()">확인</button>')}`;$('#modal').classList.remove('hidden');updateUI()}
function confirmTheme(){if(!themePending||!currentTheme||inLobby||!paused)return;themePending=false;$('#modal').classList.add('hidden');paused=false;updateUI();notice('30초 준비 시간 · Q 소환 / W 강화 / E 조합 도감')}
function initLobby(){paused=true;inLobby=true;$('#difficultySelect').onchange=renderDifficultyRecord;renderLobby();$('#startRift').onclick=()=>{if(typeof Multiplayer==='object'&&Multiplayer.inRoom){$('#hubMessage').textContent=Multiplayer.isHost?'멀티 방에서는 「함께 시작」을 눌러 주세요.':'방장이 시작하면 함께 시작됩니다.';return}beginRiftRun($('#difficultySelect').value)}}
function beginRiftRun(difficultyId){if(!inLobby)return;selectedDifficultyId=Object.hasOwn(difficulties,difficultyId)?difficultyId:'normal';selectedDifficulty=difficulties[selectedDifficultyId];maxWave=selectedDifficulty.rounds;inLobby=false;ManmulRecords.beginRun({difficulty:selectedDifficultyId});gold=100+progression.levels.preparation*10;paused=true;$('#lobby').classList.add('hidden');introThemeQueued=true;startArenaIntro();updateUI()}
