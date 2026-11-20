
'use strict';
const canvas=document.querySelector('#game'),ctx=canvas.getContext('2d');
{const defs={...ManmulBasicData,...ManmulUpperBasicData};for(const t of [...Object.values(types),...rosterData.units]){let text=ManmulUnitText.describeBasic(defs[t.id]);if(text)t.attack_effect=text;t.attack_effect=ManmulUnitText.forDamageType(t.attack_effect,t.damage_type);t.skill_effect=ManmulUnitText.forDamageType(t.skill_effect,t.damage_type)}}
const $=selector=>document.querySelector(selector);
Object.assign(unitRoleTags,ManmulRoles.build(types,{...ManmulBasicData,...ManmulUpperBasicData},ManmulSkillData));
// The same first motion frame is used in the recipe book; there are no separate portraits.
const normalMotionSpecs=Object.fromEntries(['N001','N002','N003','N004','N005','N006','N007'].map(id=>[id,{cx:24,cy:24,size:22}]));
// Pixel-art unit sheets (48px cells) are drawn at a whole-number scale so every art pixel stays the same size.
const PIXEL_UNIT_SCALE=2,PIXEL_UNIT_BASELINE=35;
// Unit sheets load on first use (manmul/lazy-images.js); the rest fills in the background after the title shows.
const normalMotionImages=ManmulLazyImages.lazyImages(Object.keys(normalMotionSpecs),id=>`assets/units/normal/${id}-sheet.png`);
const magicMotionImages=ManmulLazyImages.lazyImages(Object.keys(magicMotionSpecs),id=>`assets/units/magic/${id}-sheet.png`);
const magicBasicFxImages=ManmulLazyImages.lazyImages(Object.keys(magicMotionSpecs),id=>`assets/units/manmul-magic/${id}-sheet.png`);
const rareMotionSpecs=Object.fromEntries(Object.keys(upperMotionSpecs).filter(id=>id.startsWith('R')).map(id=>[id,{cx:24,cy:24,size:25}]));
const rareMotionImages=ManmulLazyImages.lazyImages(Object.keys(rareMotionSpecs),id=>`assets/units/rare/${id}-sheet.png`);
const uniqueMotionSpecs=Object.fromEntries(Object.keys(upperMotionSpecs).filter(id=>id.startsWith('U')).map(id=>[id,{cx:24,cy:24,size:29}]));
const uniqueMotionImages=ManmulLazyImages.lazyImages(Object.keys(uniqueMotionSpecs),id=>`assets/units/unique/${id}-sheet.png`);
const epicMotionSpecs=Object.fromEntries(Object.keys(upperMotionSpecs).filter(id=>id.startsWith('E')).map(id=>[id,{cx:24,cy:24,size:29}]));
const epicMotionImages=ManmulLazyImages.lazyImages(Object.keys(epicMotionSpecs),id=>`assets/units/epic/${id}-sheet.png`);
const legendaryMotionSpecs=Object.fromEntries(Object.keys(upperMotionSpecs).filter(id=>id.startsWith('L')).map(id=>[id,{cx:24,cy:24,size:34}]));
const legendaryMotionImages=ManmulLazyImages.lazyImages(Object.keys(legendaryMotionSpecs),id=>`assets/units/legendary/${id}-sheet.png`);
const upperMotionImages=ManmulLazyImages.lazyImages(Object.keys(upperMotionSpecs),id=>`assets/units/manmul-upper/${id}-sheet.png`);
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
const gradeAuraImages=ManmulLazyImages.lazyImages(Object.keys(gradeAuraFiles),grade=>`assets/effects/manmul-grade-aura/${gradeAuraFiles[grade]}.png`);
function drawUnitGradeBase(unit){
 const coopOn=typeof Coop==='object'&&Coop.on,mine=!coopOn||unit.owner===Coop.me,color=coopOn?Coop.colorOf(unit.owner):gradeColors[types[unit.type].grade]||'#d9e3dc',scale=unitVisualScale(unit),rx=13*scale,ry=rx*.38,cy=(normalMotionSpecs[unit.type]||magicMotionSpecs[unit.type]||rareMotionSpecs[unit.type]||uniqueMotionSpecs[unit.type]||epicMotionSpecs[unit.type]||legendaryMotionSpecs[unit.type])?unit.y+(PIXEL_UNIT_BASELINE+1-24)*PIXEL_UNIT_SCALE-2:unit.y+5+44*scale*.15,picked=selected.includes(unit.id);
 ctx.save();ctx.beginPath();ctx.ellipse(unit.x,cy,rx,ry,0,0,Math.PI*2);
 ctx.globalAlpha=picked?.5:mine?.3:.18;ctx.fillStyle=color;ctx.fill();
 ctx.globalAlpha=picked?1:.85;ctx.lineWidth=picked?2.5:1.5;ctx.strokeStyle=picked?'#f4ffd8':color;ctx.stroke();
 if(picked){ctx.beginPath();ctx.ellipse(unit.x,cy,rx+4,ry+2,0,0,Math.PI*2);ctx.globalAlpha=.55+.3*Math.sin(combatTime*6);ctx.lineWidth=1.5;ctx.strokeStyle='#d7ff86';ctx.stroke()}
 ctx.restore();drawUnitStarEffect(unit,cy,rx,ry);
}
// 성급 외관 (임시): 3성부터 발밑에 반짝이는 별 점, 5성은 금빛 고리. Codex 그림이 나오면 교체.
function drawUnitStarEffect(unit,cy,rx,ry){let stars=unitStars(unit.type);if(stars<starRules.sparkleAt)return;ctx.save();
 if(stars>=starRules.goldAt){ctx.beginPath();ctx.ellipse(unit.x,cy,rx+6,ry+3,0,0,Math.PI*2);ctx.globalAlpha=.5+.25*Math.sin(combatTime*3+unit.id);ctx.lineWidth=2;ctx.strokeStyle='#ffd76a';ctx.shadowColor='#ffd76a';ctx.shadowBlur=8;ctx.stroke()}
 ctx.shadowBlur=0;for(let i=0;i<3;i++){let a=combatTime*1.6+unit.id+i*2.094,x=unit.x+Math.cos(a)*(rx+3),y=cy+Math.sin(a)*(ry+2)-2;ctx.globalAlpha=.55+.45*Math.sin(combatTime*5+i);ctx.fillStyle=stars>=starRules.goldAt?'#fff0b0':'#d9f2ff';ctx.fillRect(Math.round(x)-1,Math.round(y)-1,2,2)}
 ctx.restore()}
function drawUnitGradeAura(unit){
 const image=gradeAuraImages.get(types[unit.type].grade);
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
const difficulties={easy:{name:'입문',themeIntensity:.5,lapGrowth:.1,rounds:50,hp:1.3,boss:1.3,rate:1.27,income:16},normal:{name:'일반',themeIntensity:1,lapGrowth:.15,rounds:60,hp:1.5,boss:1.5,rate:1.27,income:12},hard:{name:'상급',themeIntensity:1.3,lapGrowth:.15,rounds:75,hp:1.22,boss:1.27,rate:1.27,income:12},extreme:{name:'극한',themeIntensity:1.6,lapGrowth:.15,rounds:90,hp:1.45,boss:1.6,rate:1.28,income:12},endless:{name:'무한 균열',endless:true,themeIntensity:1,lapGrowth:.15,rounds:99999,hp:1.5,boss:1.5,rate:1.27,income:12}};
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
function addUnit(type,x=500,y=350){let p=freePosition(type,x,y);if(!p)return null;let u={id:++uid,type,x:p.x,y:p.y,tx:p.x,ty:p.y,cool:0,skillTimer:types[type].skill_cooldown||0};units.push(u);if(typeof Coop==='object'&&Coop.on)u.owner=Coop.currentOwner();runStats.unitTypes[u.id]=type;if(!runStats.highest||ManmulRoster.grades.indexOf(types[type].grade)>ManmulRoster.grades.indexOf(types[runStats.highest].grade))runStats.highest=type;skillFxPreload(type);v5Combat.prepareUnit(u,combatTime);if(type==='L002')u.cool=v5Combat.attackInterval(u);return u}
function issueMove(group,point){let area=world.inner,moving=new Set(group.map(u=>u.id)),occupied=units.filter(u=>!moving.has(u.id)).map(u=>({x:u.x,y:u.y,radius:types[u.type].radius,foot:unitFootprint(u.type)}));for(const u of group){let radius=types[u.type].radius,foot=unitFootprint(u.type),goal=null;for(const roomy of [true,false]){if(goal)break;for(let n=0;n<2500;n++){let angle=n*2.399963,offset=n===0?0:4*Math.sqrt(n),x=clamp(point.x+Math.cos(angle)*offset,area.x+radius,area.x+area.w-radius),y=clamp(point.y+Math.sin(angle)*offset,area.y+radius,area.y+area.h-radius);if(occupied.every(p=>Math.hypot(p.x-x,p.y-y)>=(roomy?foot+p.foot+2:radius+p.radius+1))){goal={x,y};break}}}u.tx=goal?goal.x:u.x;u.ty=goal?goal.y:u.y;u.bestDistance=Math.hypot(u.tx-u.x,u.ty-u.y);u.stuckTime=0;u.avoidSide=0;occupied.push({x:u.tx,y:u.ty,radius,foot})}}
function markTestRun(){testRun=true;ManmulRecords.abandonRun()}
function recordAcquire(id){ManmulRecords.acquire(id,types[id]?.grade,types[id]?.name||id);missionEvent('acquire',id)}
// Mid-boss selection tickets: from round 15 every mid-boss gives tickets to pick a unit of a fixed grade. They are kept
// until used, so a player can wait for the moment a material completes a recipe.
const ticketRules={normalFrom:15,normalCount:2,magicFrom:35,magicCount:1},ticketGrades={normal:'노말',magic:'매직'};
let selectionTickets={normal:0,magic:0};
function grantTickets(midWave,silent=false){let kind=midWave>=ticketRules.magicFrom?'magic':midWave>=ticketRules.normalFrom?'normal':null;if(!kind)return null;let count=kind==='magic'?ticketRules.magicCount:ticketRules.normalCount;selectionTickets[kind]+=count;if(!silent){globalThis.ManmulSound?.play('reward');notice(`중간 보스 보상: ${ticketGrades[kind]} 선택권 ${count}장`)}updateUI();return kind}
function ticketTotal(){return selectionTickets.normal+selectionTickets.magic}
// Recipes that become buildable when one unit of `id` is added to the current army.
function recipesUnlockedBy(id){let have={};for(const u of ownedUnits())have[u.type]=(have[u.type]||0)+1;const ready=extra=>r=>{let need={};for(const p of r.parts)need[p]=(need[p]||0)+1;return Object.entries(need).every(([t,n])=>(have[t]||0)+(t===extra?1:0)>=n)};return recipes.filter(r=>r.parts.includes(id)&&!ready(null)(r)&&ready(id)(r)).map(r=>r.result)}
// Unit types still missing somewhere in the goal unit's recipe tree (empty when no goal is set).
function goalNeedTypes(){let set=new Set();if(!goalUnit||!types[goalUnit])return set;let q=[goalTree(goalUnit)];while(q.length){let n=q.pop();if(n.need>n.have)set.add(n.id);q.push(...n.children)}return set}
function openTickets(kind=null){if(ended||inLobby)return;kind=kind&&selectionTickets[kind]>0?kind:selectionTickets.magic>0?'magic':selectionTickets.normal>0?'normal':null;if(!kind){closeModal();return}
 let tabs=Object.keys(ticketGrades).filter(k=>selectionTickets[k]>0).map(k=>`<button type="button" class="ticket-tab" aria-pressed="${k===kind}" onclick="openTickets('${k}')">${ticketGrades[k]} 선택권 ${selectionTickets[k]}장</button>`).join('');
 let need=goalNeedTypes(),have={};for(const u of ownedUnits())have[u.type]=(have[u.type]||0)+1;let options=Object.values(types).filter(t=>t.grade===ticketGrades[kind]).map(t=>({t,unlocks:recipesUnlockedBy(t.id),forGoal:need.has(t.id),owned:have[t.id]||0})).sort((a,b)=>Number(b.forGoal)-Number(a.forGoal)||b.unlocks.length-a.unlocks.length||a.t.name.localeCompare(b.t.name));
 $('#modalContent').innerHTML=`${modalOpen({eyebrow:'SELECTION TICKET',title:'유닛 선택권',close:'선택권 닫기'})}<p class="ui-modal-lead">원하는 유닛을 골라 바로 소환합니다. 선택권은 쓰기 전까지 보관됩니다.</p><div class="ticket-tabs">${tabs}</div><div class="ticket-list">${options.map(({t,unlocks,forGoal,owned})=>`<button type="button" class="ticket-option${forGoal?' is-goal':''}" onclick="useTicket('${kind}','${t.id}')"><span class="ticket-portrait" style="${bookPortraitStyle(t.id)}" aria-hidden="true"></span><span class="ticket-text"><strong>${t.name}${owned?` <span class="ticket-owned">보유 ${owned}</span>`:''}${forGoal?' <span class="ticket-goal">목표에 필요</span>':''}</strong><small>${unlocks.length?'조합 가능: '+unlocks.map(id=>types[id].name).join(', '):'바로 가능한 조합 없음'}</small></span></button>`).join('')}</div>${modalClose()}`;$('#modal').classList.remove('hidden')}
function useTicket(kind,id){if(ended||inLobby||!(selectionTickets[kind]>0)||types[id]?.grade!==ticketGrades[kind])return false;let cx=480+Math.random()*40,cy=330+Math.random()*40,spot=roomyPosition(id,cx,cy),u=addUnit(id,spot?spot.x:cx,spot?spot.y:cy);if(!u){notice('유닛을 소환할 공간이 부족합니다');return false}selectionTickets[kind]--;recordAcquire(id);showArrivalEffect('summon',u);selectedEnemy=null;selected=[u.id];if(ticketTotal())openTickets(kind);else closeModal();updateUI();return true}
function summon(){if(ended||paused)return;if(gold<summonCost){notice('골드가 부족합니다');return}let keys=rosterData.units.filter(u=>u.grade==='N').map(u=>u.id);if(Math.random()<(runRelics.elite?relicRules.elite:0)+treeBonus('elite'))keys=rosterData.units.filter(u=>u.grade==='M').map(u=>u.id);let pick=keys[Math.floor(Math.random()*keys.length)],cx=480+Math.random()*40,cy=330+Math.random()*40,spot=roomyPosition(pick,cx,cy);let u=addUnit(pick,spot?spot.x:cx,spot?spot.y:cy);if(!u){notice('유닛을 소환할 공간이 부족합니다');return}gold-=summonCost;missionEvent('summon');recordAcquire(pick);showArrivalEffect("summon",u);selectedEnemy=null;selected=[u.id];updateUI()}
function spawnTestUnits(){if(ended)return;let targets=rosterData.units.filter(u=>['U','L','H','D','C'].includes(u.grade)),area=world.inner,created=0;for(let index=0;index<targets.length;index++){let placed=null;for(let attempt=0;attempt<56&&!placed;attempt++){let slot=(index+attempt)%56,x=area.x+(slot%8+.5)*area.w/8,y=area.y+(Math.floor(slot/8)+.5)*area.h/7;placed=addUnit(targets[index].id,x,y)}if(placed)created++}if(created)markTestRun();notice(created===targets.length?`테스트 유닛 ${created}기 소환 완료`:`공간 부족: 테스트 유닛 ${created}/${targets.length}기 소환`);updateUI()}
function bookUnitIcon(id){return `<button type="button" class="ingredient-portrait book-unit-link" style="${bookPortraitStyle(id)}" onclick="openRecipesForUnit('${id}')" aria-label="${types[id].name} 조합식 보기" title="${types[id].name} 조합식 보기">${portraitContent(id)}</button>`}
function recipeBookIngredients(recipe){return [...new Set(recipe.parts)].map(type=>{let unit=types[type],need=recipe.parts.filter(part=>part===type).length,have=ownedUnits().filter(u=>u.type===type).length,enough=have>=need;return `<span class="book-ingredient">${bookUnitIcon(type)}<span class="book-unit-name" style="color:${gradeColors[unit.grade]}">${unit.name}</span><span class="ingredient-count ${enough?'is-owned':'is-missing'}">${have}/${need} ${enough?'보유':'부족'}</span></span>`}).join('<span class="book-plus" aria-hidden="true">+</span>')}
const expandedGoalBranches=new Set();
// "모두 펼치기": show the whole recipe tree down to single units at once; the choice is remembered.
let goalExpandAll=(()=>{try{return localStorage.getItem('goal-expand-all')!=='0'}catch(e){return true}})();
function toggleGoalExpandAll(){goalExpandAll=!goalExpandAll;try{localStorage.setItem('goal-expand-all',goalExpandAll?'1':'0')}catch(e){}expandedGoalBranches.clear();goalSignature='';updateGoal()}
function goalTree(target){
 let counts={};for(const unit of ownedUnits())counts[unit.type]=(counts[unit.type]||0)+1;
 function makeNode(id,need,path){return {id,need,have:counts[id]||0,path,children:[]}}
 let root=makeNode(target,1,target),queue=[root];
 for(let i=0;i<queue.length;i++){let node=queue[i],missing=Math.max(0,node.need-node.have),recipe=recipes.find(r=>r.result===node.id);if(!missing||!recipe)continue;let grouped=new Map();for(const id of recipe.parts)grouped.set(id,(grouped.get(id)||0)+missing);for(const [id,need] of grouped){let child=makeNode(id,need,node.path+'/'+id);node.children.push(child);queue.push(child)}}
 return root;
}
function goalRows(node,depth=0){let t=types[node.id],available=node.have>=node.need,expandable=!available&&node.children.length>0,expanded=expandable&&expandedGoalBranches.has(node.path);return `<div class="goal-row" style="padding-left:${depth*12}px"><span class="ingredient-portrait goal-portrait" style="${portraitStyle(node.id)}" aria-hidden="true">${portraitContent(node.id)}</span><span class="goal-name" style="color:${gradeColors[t.grade]}">${t.name}</span><span class="goal-count ${available?'is-owned':'is-missing'}">${node.have}/${node.need}</span>${expandable?`<button type="button" class="goal-expand" aria-expanded="${expanded}" aria-label="${t.name} 하위 조합 ${expanded?'접기':'펼치기'}" onclick="toggleGoalBranch('${node.path}')">${expanded?'−':'+'}</button>`:'<span class="goal-expand-space"></span>'}</div>`+(expanded?node.children.map(child=>goalRows(child,depth+1)).join(''):'')}
function toggleGoalBranch(path){if(goalExpandAll&&expandedGoalBranches.has(path))goalExpandAll=false;if(expandedGoalBranches.has(path))expandedGoalBranches.delete(path);else expandedGoalBranches.add(path);goalSignature='';updateGoal()}
function setGoal(id){if(goalUnit!==id)expandedGoalBranches.clear();goalUnit=id;goalSignature='';updateGoal();closeModal()}
function clearGoal(){goalUnit=null;goalSignature='';expandedGoalBranches.clear();updateGoal()}
function updateGoal(){let box=$('#goalTracker');if(!goalUnit||!types[goalUnit]){goalUnit=null;expandedGoalBranches.clear();box.classList.add('hidden');return}let signature=goalUnit+'|'+ownedUnits().map(u=>u.type).sort().join(',');if(goalSignature===signature)return;goalSignature=signature;let tree=goalTree(goalUnit),valid=new Set(),pending=[tree];while(pending.length){let node=pending.pop();if(node.children.length&&node.have<node.need)valid.add(node.path);pending.push(...node.children)}for(const path of expandedGoalBranches)if(!valid.has(path))expandedGoalBranches.delete(path);if(goalExpandAll)for(const path of valid)expandedGoalBranches.add(path);let t=types[goalUnit],scroll=box.scrollTop;box.classList.remove('hidden');box.innerHTML=`<div class="goal-heading"><strong>조합 목표</strong><button class="goal-expand-all" onclick="toggleGoalExpandAll()" aria-pressed="${goalExpandAll}">${goalExpandAll?'모두 접기':'모두 펼치기'}</button><button onclick="clearGoal()">해제</button></div><div class="goal-target"><span class="ingredient-portrait goal-target-portrait" style="${portraitStyle(goalUnit)}" aria-hidden="true">${portraitContent(goalUnit)}</span><strong class="goal-name" style="color:${gradeColors[t.grade]}">${t.name}</strong></div><div class="goal-materials">${tree.children.map(child=>goalRows(child)).join('')}</div>`;if(scroll!==undefined)box.scrollTop=scroll}
const runUpgrades={physical:{name:'물리 전술',description:'물리 유닛 공격력 +8%'},magic:{name:'마법 전술',description:'마법 유닛 마력 +8%'},speed:{name:'신속 공격',description:'공격속도 +5%'},burn:{name:'화상 증폭',description:'화상 피해 +12%'},slow:{name:'감속 전술',description:'감속 효과 +8%'},armor:{name:'방어 파괴',description:'방어력 감소 효과 +10%'},resist:{name:'마력 파괴',description:'마법 저항력 감소 효과 +10%'},boss:{name:'보스 사냥',description:'보스 대상 피해 +8%'},gold:{name:'전술 보급',description:'즉시 40골드'}};
// The gold reward grows with the round (40 at round 10, 150 at round 50) so it stays a real choice next to combat bonuses.
function bossGoldReward(){return Math.max(40,wave*3)}
function rewardDescription(id){let c=ManmulCards.cards[id];if(!c)return relics[id]?.description??runUpgrades[id]?.description??'';return c.effect==='gold'?`즉시 ${cardGoldAmount(id)}골드`:c.description}
let runLevels=Object.fromEntries(Object.keys(runUpgrades).map(id=>[id,0])),rewardChoices=[];
// Relics change rules instead of adding a percentage. Each can be taken once per run.
const runRelics={},relics={
 seal:{name:'순환 봉인',description:'감속·묶기 상태로 한 바퀴를 마친 적은 순환 강화를 받지 않습니다'},
 ember:{name:'잔불 전이',description:'화상 상태로 쓰러진 적의 화상이 가까운 적 2기에게 4초간 옮겨붙습니다'},
 execute:{name:'균열 처형',description:'일반 몬스터의 체력이 최대 체력의 8% 이하가 되면 즉시 처치합니다'},
 bounty:{name:'약탈',description:'일반 몬스터를 처치할 때 25% 확률로 골드 +1'},
 interest:{name:'균열 이자',description:'라운드 시작마다 보유 골드의 10%를 추가로 받습니다(최대 15)'},
 convert:{name:'변환 숙련',description:'같은 등급 변환 비용 50% 감소'},
 adapt:{name:'균열 적응',description:'이후 등장하는 적이 받는 전장 테마 압박 35% 감소'},
 elite:{name:'정예 소환',description:'소환할 때 10% 확률로 매직 유닛이 나옵니다'}
};
const relicRules={emberTargets:2,emberDuration:4,emberRange:160,execute:.08,bounty:.25,interest:.1,interestCap:15,convert:.5,adapt:.65,elite:.1};
function rewardName(id){return ManmulCards.cards[id]?.name??relics[id]?.name??runUpgrades[id]?.name??id}
// Two relics (while any remain) plus stat upgrades fill the three choices.
// ---- Boss reward cards (manmul/cards.js). runCards = one-off cards taken this run; stat/relic cards live in
// runLevels / runRelics so the existing combat hooks keep working.
let runCards=[];
function cardOwned(id){let c=ManmulCards.cards[id];if(!c)return 0;if(c.effect==='stat')return runLevels[id]||0;if(c.effect==='relic')return runRelics[id]?1:0;return runCards.filter(x=>x===id).length}
function cardTaken(){let out=[];for(const [id,c] of Object.entries(ManmulCards.cards))if(c.effect==='stat'||c.effect==='relic')for(let i=0;i<cardOwned(id);i++)out.push(id);return out.concat(runCards.filter(id=>ManmulCards.cards[id]))}
function cardSetSize(){return Math.max(2,ManmulCards.setSize-treeBonus('setSize'))}
function cardSet(family){return ManmulCards.familyCounts(cardTaken())[family]>=cardSetSize()}
function cardChoiceCount(){return Math.max(2,(cardSet('relic')?4:3)+treeBonus('cardChoice')+riftActiveMods().cards)}
function cardGoldAmount(id){return Math.round(bossGoldReward()*(ManmulCards.cards[id]?.factor||1)*(1+treeBonus('bossGold')))}
// Extra attack power from cards: 총공세 plus the 전술 set bonus.
function cardPowerBonus(){return runCards.reduce((s,id)=>s+(ManmulCards.cards[id]?.effect==='power'?ManmulCards.cards[id].amount:0),0)+(cardSet('tactic')?.05:0)}
function cardIncomeBonus(){return cardSet('economy')?5:0}
function summonCardUnits(grade,count){let pool=Object.values(types).filter(t=>t.grade===grade),made=0;for(let i=0;i<count&&pool.length;i++){let t=pool[Math.floor(Math.random()*pool.length)],cx=480+Math.random()*40,cy=330+Math.random()*40,spot=roomyPosition(t.id,cx,cy),u=addUnit(t.id,spot?spot.x:cx,spot?spot.y:cy);if(!u)break;recordAcquire(t.id);showArrivalEffect('summon',u);made++}if(made<count)notice('유닛을 소환할 공간이 부족합니다');return made}
function rewardChoiceSet(){return ManmulCards.draw(cardChoiceCount(),cardOwned,treeCardUnlocks(),Math.random,treeBonus('luck'))}
function ownedRelicNames(){return Object.keys(relics).filter(id=>runRelics[id]).map(id=>relics[id].name)}
function queueBossReward(enemy){if(enemy.kind!=='boss'||enemy.spawnWave>=maxWave)return;if(cardSet('summon')){selectionTickets.normal++;notice('소환 세트 효과: 노말 선택권 1장')}rewardChoices=rewardChoiceSet();if(!rewardChoices.length)return;pendingRewards.push(rewardChoices);if(typeof Coop==='object'&&Coop.on&&Coop.host)Coop.queueGuestRewards();showReward()}
function modalOpen({eyebrow='',title,close='',variant=''}){return `<div class="ui-modal ${variant}"><header class="ui-modal-head"><div class="ui-modal-titles">${eyebrow?`<span class="ui-modal-eyebrow">${eyebrow}</span>`:''}<h2>${title}</h2></div>${close?`<button type="button" class="ui-modal-close" onclick="closeModal()" aria-label="${close}">×</button>`:''}</header><div class="ui-modal-body">`}
function modalClose(footer=''){return `</div>${footer?`<footer class="ui-modal-foot">${footer}</footer>`:''}</div>`}
// ---- Boss reward cards: each card says how it fits the current army so the choice has a reason. ----
const rewardIcons=new Proxy({},{get:(_,id)=>ManmulCards.cards[id]?.icon});
function armyTagCount(keys){return units.filter(u=>(unitRoleTags[u.type]||[]).some(k=>keys.includes(k))).length}
function rewardFit(id){let n=units.length||1,phys=units.filter(u=>types[u.type]?.damage_type==='물리').length,mag=n&&units.length?units.length-phys:0,bossLeft=Math.max(0,Math.floor((maxWave-wave)/10)),roundsLeft=Math.max(0,maxWave-wave);
 const pct=v=>Math.round(v/n*100)+'%';
 switch(id){
  case 'physical':return {text:`물리 유닛 ${phys}기 (${pct(phys)})`,good:units.length>0&&phys/n>=.6};
  case 'magic':return {text:`마법 유닛 ${mag}기 (${pct(mag)})`,good:units.length>0&&mag/n>=.6};
  case 'speed':return {text:'모든 유닛에 적용',good:false};
  case 'burn':case 'ember':{let c=armyTagCount(['dot']);return {text:`지속 피해 유닛 ${c}기`,good:c>=3}}
  case 'slow':case 'seal':{let c=armyTagCount(['slow','control']);return {text:`감속·제어 유닛 ${c}기`,good:c>=3}}
  case 'armor':{let c=armyTagCount(['armor']);return {text:`방어력 감소 유닛 ${c}기`,good:c>=2||currentTheme==='steel'}}
  case 'resist':{let c=armyTagCount(['resist']);return {text:`마법 저항 감소 유닛 ${c}기`,good:c>=2||currentTheme==='magic'}}
  case 'boss':return {text:`남은 보스 ${bossLeft}번`,good:bossLeft>=3};
  case 'gold':return {text:`지금 골드 ${gold}`,good:gold<40};
  case 'execute':return {text:'일반 몬스터가 많을수록 효과적',good:enemies.length>=40};
  case 'bounty':return {text:`남은 ${roundsLeft}라운드 · 라운드당 약 +10골드`,good:roundsLeft>=20};
  case 'interest':return {text:`지금 골드 기준 라운드당 +${Math.min(relicRules.interestCap,Math.floor(gold*relicRules.interest))}`,good:gold>=100};
  case 'convert':return {text:'같은 등급 변환을 자주 쓸 때',good:false};
  case 'adapt':return {text:currentTheme?`${ManmulThemes.themes[currentTheme].name} 압박 완화`:'전장 테마 압박 완화',good:wave>=30};
  case 'onslaught':return {text:`유닛 ${units.length}기 모두에 적용`,good:units.length>=10};
  case 'warchest':return {text:`지금 골드 ${gold}`,good:gold<80};
  case 'recruit':case 'reinforce':return {text:`보유 유닛 ${units.length}기`,good:units.length<15};
  case 'arcane':return {text:'원하는 매직 유닛을 골라 소환',good:wave<=30};
  case 'rarecall':return {text:'바로 쓸 수 있는 레어 유닛',good:true};
  case 'elite':return {text:`남은 ${roundsLeft}라운드 동안 소환할 때마다`,good:wave<=20};
 }return {text:'',good:false}}
// Deck status: cards per family toward the set bonus, plus what has been taken.
function cardDeckHtml(){let taken=cardTaken(),counts=ManmulCards.familyCounts(taken),size=cardSetSize();
 return `<div class="card-deck">${Object.entries(ManmulCards.families).map(([f,fam])=>{let n=counts[f],on=n>=size;return `<span class="card-set${on?' is-on':''}" style="--fam:${fam.color}" title="${fam.name} ${size}장: ${fam.set}"><b>${fam.name}</b> ${Math.min(n,size)}/${size}<small>${on?'✓ ':''}${fam.set}</small></span>`}).join('')}</div>${taken.length?`<p class="reward-owned">보유 카드 ${taken.length}장: ${[...new Set(taken)].map(id=>{let k=taken.filter(x=>x===id).length;return rewardName(id)+(k>1?' ×'+k:'')}).join(' · ')}</p>`:''}`}
function rewardOwnedHtml(){return cardDeckHtml()}
function cardHtml(id){let c=ManmulCards.cards[id],fam=ManmulCards.families[c.family],fit=rewardFit(id),owned=cardOwned(id),meta=c.max===Infinity?'':c.max>1?`${owned}/${c.max}`:'1회';
 return `<button class="reward-card card-${c.family} rarity-${c.rarity}${c.effect==='relic'?' reward-relic':''}${fit.good?' is-good':''}" style="--fam:${fam.color}" onclick="collectReward('${id}')"><span class="card-band"><span>${fam.name}</span><span>${ManmulCards.rarities[c.rarity].name}</span></span><span class="reward-icon" aria-hidden="true">${c.icon}</span><span class="choice-top"><strong>${c.name}</strong><span class="choice-meta">${meta}</span></span><span class="choice-desc">${rewardDescription(id)}</span><span class="reward-fit">${fit.good?'<b>추천</b> · ':''}${fit.text}</span></button>`}
function showReward(){if(!pendingRewards.length)return;paused=true;$('#rewardButton').classList.remove('hidden');let choices=pendingRewards[0].filter(id=>ManmulCards.cards[id]);$('#modalContent').innerHTML=`${modalOpen({eyebrow:'BOSS REWARD',title:'보상 카드 선택'})}<p class="ui-modal-lead">카드 한 장을 골라 이번 전투에 적용합니다. 같은 계열 카드를 ${cardSetSize()}장 모으면 세트 효과가 켜집니다.</p>${rewardOwnedHtml()}<div class="reward-list reward-cards${choices.length>3?' is-four':''}">${choices.map(cardHtml).join('')}</div>${modalClose()}`;$('#modal').classList.remove('hidden');updateUI()}
function collectReward(id){if(!pendingRewards.length||!pendingRewards[0].includes(id))return;let c=ManmulCards.cards[id];if(!c||cardOwned(id)>=c.max)return;
 if(c.effect==='stat')runLevels[id]++;else if(c.effect==='relic')runRelics[id]=true;else{runCards.push(id);if(c.effect==='gold')gold+=cardGoldAmount(id);else if(c.effect==='ticket')selectionTickets[c.ticket]+=c.count;else if(c.effect==='summon')summonCardUnits(c.grade,c.count)}
 globalThis.ManmulSound?.play('reward');pendingRewards.shift();rewardChoices=[];if(pendingRewards.length)showReward();else{paused=false;closeModal();$('#rewardButton').classList.add('hidden');updateUI()}}
function supportReason(text){return text?`<span class="choice-reason">${text}</span>`:''}
function openSupport(){if(ended||paused||inLobby)return;let normal=enemies.some(e=>e.hp>0&&e.kind!=='boss'&&e.kind!=='miniboss');$('#modalContent').innerHTML=`${modalOpen({eyebrow:'SUPPORT',title:'긴급 지원',close:'긴급 지원 닫기'})}<p class="ui-modal-lead">일반 몬스터에게만 적용됩니다.</p><div class="reward-list"><button title="${supportUses.bomb>=supportLimit('bomb')?'사용 횟수 소진':gold<50?'골드 부족':!normal?'대상 일반 몬스터 없음':'균열 폭격 사용'}" onclick="useSupport('bomb')" ${gold<50||supportUses.bomb>=supportLimit('bomb')||!normal?'disabled':''}><span class="choice-top"><strong>균열 폭격</strong><span class="choice-meta">50골드 · ${supportLimit('bomb')-supportUses.bomb}회</span></span><span class="choice-desc">일반 몬스터 최대 체력의 20% 피해</span>${supportReason(supportUses.bomb>=supportLimit('bomb')?'사용 횟수 소진':gold<50?'골드 부족 (50골드 필요)':!normal?'대상 일반 몬스터 없음':'')}</button><button title="${supportUses.slow>=supportLimit('slow')?'사용 횟수 소진':gold<35?'골드 부족':!normal?'대상 일반 몬스터 없음':'시간 봉쇄 사용'}" onclick="useSupport('slow')" ${gold<35||supportUses.slow>=supportLimit('slow')||!normal?'disabled':''}><span class="choice-top"><strong>시간 봉쇄</strong><span class="choice-meta">35골드 · ${supportLimit('slow')-supportUses.slow}회</span></span><span class="choice-desc">일반 몬스터 5초간 35% 감속</span>${supportReason(supportUses.slow>=supportLimit('slow')?'사용 횟수 소진':gold<35?'골드 부족 (35골드 필요)':!normal?'대상 일반 몬스터 없음':'')}</button><button title="${supportUses.loan>=1?'사용 횟수 소진':'긴급 자금 사용'}" onclick="useSupport('loan')" ${supportUses.loan>=1?'disabled':''}><span class="choice-top"><strong>긴급 자금</strong><span class="choice-meta">${1-supportUses.loan}회</span></span><span class="choice-desc">50골드 획득 · 이후 5라운드 동안 라운드 보상에서 12골드씩, 총 60골드 상환</span>${supportReason(supportUses.loan>=1?'사용 횟수 소진':'')}</button></div><p class="ui-modal-note">미상환 ${loanRemaining}골드 · 남은 차감 ${loanRounds}회</p>${modalClose()}`;$('#modal').classList.remove('hidden')}
function useSupport(id){if(ended||paused||inLobby)return;let targets=enemies.filter(e=>e.hp>0&&e.kind!=='boss'&&e.kind!=='miniboss');if(id==='bomb'&&gold>=50&&supportUses.bomb<supportLimit('bomb')&&targets.length){gold-=50;supportUses.bomb++,ManmulRecords.useSupport();for(const e of targets){let damage=Math.min(e.hp,e.max*.2);e.hp-=damage;runStats.supportDamage+=damage;showDamageFeedback(e,damage,'물리')}}else if(id==='slow'&&gold>=35&&supportUses.slow<supportLimit('slow')&&targets.length){gold-=35;supportUses.slow++,ManmulRecords.useSupport();for(const e of targets)v5Combat.effects.slow(e,.35,5,combatTime)}else if(id==='loan'&&supportUses.loan<1){supportUses.loan++,ManmulRecords.useSupport();gold+=50;loanRounds=5;loanRemaining=60}else return;openSupport();updateUI()}
// Mid-boss rounds were removed; the miniboss enemy kind now only appears as a 현상금 사냥 boss (manmul/missions.js).
function isMidWave(n){return false}
// 균열 단계: speed / defence changes on every spawned enemy (health is in the difficulty copy).
{const baseSpawnEnemy=spawnEnemy;spawnEnemy=function(...a){let r=baseSpawnEnemy.apply(this,a);riftApplyEnemy(enemies[enemies.length-1]);eventApplyEnemy(enemies[enemies.length-1]);if(typeof Versus==='object')Versus.applyEnemy(enemies[enemies.length-1]);if(typeof Coop==='object')Coop.applyEnemy(enemies[enemies.length-1]);return r}}
function isBossWave(n){return n%10===0}
function spawnEnemy(kind,boss=null){let spec=kind==='boss'&&boss?boss:combatRules.enemyKinds[kind],base=(combatRules.enemyBaseHp+wave*combatRules.enemyHpPerWave)*spec.hp;if(selectedDifficulty){let d=selectedDifficulty,hw=endlessHpWave(wave),raw=135+42*Math.min(hw,40)+50*Math.max(0,Math.min(hw-40,20))+60*Math.max(0,Math.min(hw-60,20))+70*Math.max(0,hw-80),scale=(kind==='boss'||kind==='miniboss')?d.boss:d.hp;scale=1+(scale-1)*Math.min(1,Math.max(0,hw-(d.rampStart??6))/((d.rampEnd??26)-(d.rampStart??6)));base=raw*spec.hp*scale*Math.pow(d.rate,Math.max(0,hw-10)/10)*endlessHpFactor(wave)}enemies.push({id:++enemyId,bossId:kind==='boss'&&boss?boss.id:null,spawnedAt:combatTime,d:0,hp:base,max:base,speed:spec.speed,armor:kind==='boss'?spec.armor:Math.round(spec.armor*(1+Math.floor((wave-1)/10)*.12)),resist:kind==='boss'?spec.resist:Math.round(spec.resist*(1+Math.floor((wave-1)/10)*.12)),kind,spawnWave:wave,name:spec.name||({'miniboss':'균열 선봉장','normal':'균열 몬스터','fast':'질주체','armor':'강철 갑충','swarm':'안개 유령'}[kind]),color:spec.color,slow:0,slowAmount:0,debuffs:[],burns:[]});if(selectedDifficulty){let e=enemies[enemies.length-1],factor=1+.05*Math.max(0,wave-10)/10;e.armor=Math.round(e.armor*factor);e.resist=Math.round(e.resist*factor)}let spawned=enemies[enemies.length-1];if(currentTheme)ManmulThemes.initialize(spawned,currentTheme,kind==='boss'&&boss?boss.ability:null,combatTime,{wave,intensity:(selectedDifficulty?.themeIntensity??0)*(runRelics.adapt?relicRules.adapt:1)});ManmulRecords.trackEnemies(enemies.length);if(wave>0)runStats.peaks[wave]=Math.max(runStats.peaks[wave]||0,enemies.length);globalThis.ManmulSound?.enemyCount(enemies.length);if(enemies.length>(typeof Coop==='object'?Coop.limit():100)){end();globalThis.ManmulSound?.play('defeat');multiFinished(false)}}
let bossBag=[],bossBagTheme=null,lastBossId=null;
// Bosses of the current theme (4 per theme); the shared bossPool is only used when no theme is active.
function currentBossPool(){return currentTheme&&ManmulThemes.themes[currentTheme]?.bosses?.length?ManmulThemes.themes[currentTheme].bosses:bossPool}
// Every boss in the pool appears once before any boss repeats; a new cycle never starts with the previous boss.
// ---- Multiplayer sync ----
// While a synced room game runs, the room host drives wave starts and game speed, and nothing pauses the battle.
function multiActive(){return typeof Multiplayer==='object'&&!!Multiplayer.syncActive&&!inLobby}
// The boss order is shuffled with a room-wide seed so every player meets the same bosses in the same order.
let bossOrderRandom=null;
function setBossOrderSeed(seed){eventRoomSeed=Number.isFinite(seed)?seed:NaN;if(!Number.isFinite(seed)){bossOrderRandom=null;return}let s=(seed>>>0)||1;bossOrderRandom=()=>((s=(Math.imul(s,1664525)+1013904223)>>>0)/4294967296)}
// Host clock message: wave n has started (or is the current wave) and the next one starts in `remain` seconds.
function multiSyncClock(n,remain){if(inLobby||ended)return;if(n>0&&themePending&&currentTheme)confirmTheme();while(wave<n&&wave<maxWave&&!ended){revealTime=0;startWave()}if(wave===0)preparation=Math.max(0,remain);else waveTimer=Math.max(0,roundInterval-remain);updateUI()}
function multiFinished(won){if(typeof Multiplayer==='object'&&Multiplayer.started)Multiplayer.onLocalEnd(won)}
function setSharedSpeed(v,label){gameSpeed=[1,2,3].includes(v)?v:1;$('#speed').textContent=label||`X${gameSpeed}`}
function nextBossFromBag(){let pool=currentBossPool();if(bossBagTheme!==currentTheme){bossBag=[];bossBagTheme=currentTheme}if(!bossBag.length){bossBag=pool.map(b=>b.id);for(let i=bossBag.length-1;i>0;i--){let j=Math.floor((bossOrderRandom||Math.random)()*(i+1));[bossBag[i],bossBag[j]]=[bossBag[j],bossBag[i]]}if(bossBag.length>1&&bossBag[0]===lastBossId)bossBag.push(bossBag.shift())}let id=bossBag.shift();lastBossId=id;return pool.find(b=>b.id===id)}
function revealBoss(){globalThis.ManmulSound?.play('bossWarn');let base=nextBossFromBag(),ability=currentTheme?(base.ability?ManmulThemes.abilityOf(currentTheme,base.ability):ManmulThemes.choose(currentTheme,lastBossAbility)):null;if(ability)lastBossAbility=ability[0];upcomingBoss={...base,ability};revealTime=8;let box=$('#bossPreview'),factor=selectedDifficulty?1+.05*Math.max(0,wave+5-10)/10:1,theme=currentTheme?ManmulThemes.themes[currentTheme]:null,armor=Math.round(upcomingBoss.armor*factor*(theme?.stat==='armor'?theme.factor:1)),resist=Math.round(upcomingBoss.resist*factor*(theme?.stat==='resist'?theme.factor:1));// One line keeps the top of the arena clear; hovering the box shows the ability text, the hint and defenses.
 box.innerHTML=`<div class="boss-preview-line"><strong>${wave+5}라운드 보스: ${upcomingBoss.name}</strong>${ability?` · ${ability[1]}`:''}<span class="boss-preview-more-hint" aria-hidden="true">▾</span></div><div class="boss-preview-more">${theme?theme.name+' · ':''}${ability?ability[1]+' — '+ability[2]+'<br>':''}${upcomingBoss.hint}<br>방어력 ${armor} · 마법 저항력 ${resist}</div>`;box.classList.remove('hidden')}
const roleTagDisplay={physical:['⚔','물리'],magic:['✦','마법'],single:['●','단일'],area:['◉','범위'],pierce:['➜','관통'],chain:['⌁','연쇄'],boss:['◆','보스 공격'],armor:['▼','방깎'],resist:['▼','마깎'],slow:['⌛','감속'],control:['⛓','제어'],dot:['◷','지속 피해'],support:['✚','지원'],summon:['✧','소환'],special:['◇','특수']};
function renderRoleTags(type){let tags=unitRoleTags[type.id]||[],p=ManmulMarks.profile(type.id);return `<span class="role-tags" aria-label="유닛 역할">${unitStars(type.id)?`<span class="star-chip" title="성급 보너스: 공격력 +${Math.round(starBonus(type.id)*100)}%">${starText(unitStars(type.id))}</span>`:''}${tags.map(key=>{let [icon,label]=roleTagDisplay[key];return `<span class="role-tag"><span class="role-tag-icon" aria-hidden="true">${icon}</span>${label}</span>`}).join('')}${p.applies.map(m=>ManmulMarks.chip(m,' 붙임')).join('')}${p.uses.map(m=>ManmulMarks.chip(m,' 활용')).join('')}</span>`}
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
// Enemy card (click an enemy): large health bar with shield, defences, active marks and abilities.
const enemyKindNames={boss:'보스',miniboss:'현상금 보스',elite:'정예',normal:'일반'};
function enemyCardHtml(e){let hp=Math.max(0,Math.ceil(e.hp)),max=Math.max(1,Math.ceil(e.max)),pct=Math.max(0,Math.min(100,hp/max*100)),shield=e.shield>0?Math.min(100,e.shield/max*100):0,a=defense(e,'물리'),m=defense(e,'마법'),marks=Object.entries(e.manmulMarks||{}).filter(([,until])=>until>combatTime).map(([k])=>k);
 return `<div class="enemy-card is-${e.kind||'normal'}"><button type="button" class="selection-close selection-close-float" aria-label="선택 해제" onclick="clearSelection()">×</button><div class="enemy-card-head"><span class="enemy-kind">${enemyKindNames[e.kind]||'몬스터'}</span><strong>${e.name||'균열 몬스터'}</strong></div>
 <div class="enemy-hp" role="meter" aria-label="체력" aria-valuemin="0" aria-valuemax="${max}" aria-valuenow="${hp}"><i style="width:${pct.toFixed(1)}%"></i>${shield?`<b style="width:${shield.toFixed(1)}%"></b>`:''}<span>${hp.toLocaleString()} / ${max.toLocaleString()} <small>${Math.ceil(pct)}%</small></span></div>
 <div class="enemy-stats"><span>방어력 <b class="${a<e.armor?'stat-reduced':''}">${a}</b></span><span>마법 저항력 <b class="${m<e.resist?'stat-reduced':''}">${m}</b></span>${e.shield>0?`<span>보호막 <b>${Math.ceil(e.shield).toLocaleString()}</b></span>`:''}${e.laps?`<span><b>순환 ${e.laps}회</b> · 체력 +${Math.round(e.laps*(selectedDifficulty?.lapGrowth??lapRules.growth)*100)}%</span>`:''}</div>
 <p class="enemy-note">${enemyDefenseDescription(e)}${marks.length?' · '+marks.map(k=>ManmulMarks.chip(k)).join(''):''}${e.bossAbilityName?` · 능력 <b>${e.bossAbilityName}</b>`:''}</p></div>`}
function enemyDefenseDescription(enemy){let a=defense(enemy,'물리'),m=defense(enemy,'마법');return a>m*1.5?'물리 방어가 높음':m>a*1.5?'마법 저항이 높음':'물리·마법 방어가 비슷함'}
let currentTheme=null,lastBossAbility=null,themePending=false;
const runStats={peaks:[],unitTypes:{},damage:{},physical:0,magic:0,unattributed:0,supportDamage:0,bosses:[],highest:null};
const supportUses={bomb:0,slow:0,loan:0};let loanRounds=0,loanRemaining=0;
let combatTime=0;
// Within a grade, recipes cost 2~5x more normal units from cheapest to priciest while base stats follow the grade only.
// Attack and skill power scale by (normal cost / grade median cost)^costExponent so expensive recipes are worth building.
const gradeMedianCost={};
function unitCostPower(t){if(!t?.normal_cost)return 1;if(!Object.keys(gradeMedianCost).length){let by={};for(const x of Object.values(types))if(x.normal_cost)(by[x.grade]=by[x.grade]||[]).push(x.normal_cost);for(const [g,l] of Object.entries(by)){l.sort((a,b)=>a-b);gradeMedianCost[g]=l[l.length>>1]}}let m=gradeMedianCost[t.grade];return m?Math.pow(t.normal_cost/m,combatRules.costExponent??0):1}
const v5State={costPower:t=>unitCostPower(t),get time(){return combatTime},get types(){return types},get units(){return units},get enemies(){return enemies},get powerBonus(){return treeBonus('power')+cardPowerBonus()},powerBonusFor:u=>typeof Coop==='object'&&Coop.on?Coop.powerFor(u):treeBonus('power')+cardPowerBonus(),gradeLevelFor:(grade,u)=>typeof Coop==='object'&&Coop.on?Coop.gradeLevelFor(grade,u):(gradeLevels[grade]||0),runSpeedBonusFor:u=>typeof Coop==='object'&&Coop.on?Coop.speedFor(u):runLevels.speed*.05+treeBonus('speed'),get gradePower(){return combatRules.gradePower},gradeLevels,pathPoint,runAttackBonus:u=>typeof Coop==='object'&&Coop.on?Coop.attackBonus(u)+eventState.bonus[types[u.type]?.damage_type==='물리'?'physical':'magic']:(typeof Versus==='object'?Versus.attackBonus(u):0)+starBonus(u.type)+(types[u.type].damage_type==='물리'?runLevels.physical*.08+treeBonus('physical')+eventState.bonus.physical:types[u.type].damage_type==='마법'?runLevels.magic*.08+treeBonus('magic')+eventState.bonus.magic:0),get runSpeedBonus(){return runLevels.speed*.05+treeBonus('speed')},get runBurnBonus(){return typeof Coop==='object'&&Coop.on?Coop.teamBonus('burn'):runLevels.burn*.12+treeBonus('burn')},get runSlowBonus(){return typeof Coop==='object'&&Coop.on?Coop.teamBonus('slow'):runLevels.slow*.08+treeBonus('slow')},get runArmorBonus(){return typeof Coop==='object'&&Coop.on?Coop.teamBonus('armor'):runLevels.armor*.1+treeBonus('armor')},get runResistBonus(){return typeof Coop==='object'&&Coop.on?Coop.teamBonus('resist'):runLevels.resist*.1+treeBonus('resist')},adjustDamage:(enemy,amount,type,options)=>{let a=amount*(enemy.kind==='boss'?1+(typeof Coop==='object'&&Coop.on?Coop.teamBonus('boss'):runLevels.boss*.08+treeBonus('boss')):1);return typeof Coop==='object'?Coop.adjustDamage(enemy,a,type,options):a},onSkillEffect:(unit,def,effects,now)=>queueSkillFx(unit,types[unit.type],def,effects,now),onDamage:(enemy,amount,type,options={},hit=amount)=>{if(typeof Versus==='object')Versus.onDamage(enemy,amount);if(typeof Coop==='object')Coop.onDamage(enemy,amount,{...options,type});if(options.source?.id&&runStats.unitTypes[options.source.id])enemy.lastHitType=runStats.unitTypes[options.source.id];if(!options.dot)globalThis.ManmulSound?.play(type==='마법'?'hitMagic':'hitPhys');showDamageFeedback(enemy,Math.max(amount,hit),type);if(type==='물리')runStats.physical+=amount;else if(type==='마법')runStats.magic+=amount;let id=options.source?.id,unitType=runStats.unitTypes[id];if(unitType)runStats.damage[unitType]=(runStats.damage[unitType]||0)+amount;else runStats.unattributed+=amount}};
const v5Combat=ManmulBridge.create(v5State,{...ManmulBasicData,...ManmulUpperBasicData});
// Basic attacks prefer the closest enemy. Skills can still use their own target rules.
function targetPriority(unit,a,b){let pa=pathPoint(a.d),pb=pathPoint(b.d),da=(pa.x-unit.x)**2+(pa.y-unit.y)**2,db=(pb.x-unit.x)**2+(pb.y-unit.y)**2;return da-db||b.d-a.d||a.id-b.id}
// Same order as targetPriority (closest, then furthest along the path, then lowest id), but each candidate's distance is
// computed once and compared as numbers; this runs for every unit every tick and was the largest cost in late game.
function findUnitTarget(unit,range,pointCache=null){let best=null,second=null,bd=0,sd=0,alternate=!!ManmulUpperBasicData[unit.type]?.alternateTwo,r2=range*range;const better=(dist,e,od,o)=>dist<od||(dist===od&&(e.d>o.d||(e.d===o.d&&e.id<o.id)));
 for(const enemy of enemies){if(!(enemy.hp>0))continue;let cached=pointCache&&pointCache.get(enemy),point;if(cached&&cached.d===enemy.d)point=cached.point;else{point=pathPoint(enemy.d);if(pointCache)pointCache.set(enemy,{d:enemy.d,point})}let dx=point.x-unit.x,dy=point.y-unit.y;if(dx>range||dx<-range||dy>range||dy<-range)continue;let dist=dx*dx+dy*dy;if(!(dist<=r2))continue;
  if(!best||better(dist,enemy,bd,best.e)){second=best;sd=bd;best={e:enemy,p:point};bd=dist}else if(alternate&&(!second||better(dist,enemy,sd,second.e))){second={e:enemy,p:point};sd=dist}}
 return alternate&&second&&best.e.id===unit.lastBasicTargetId?second:best}
// Keep combat deterministic across frame rates and playback speeds. Any
// unprocessed time is discarded when a reward dialog pauses the battle.
const combatStep=1/60;
let combatAccumulator=0;
function advanceGame(realDt){if((paused&&!multiActive())||ended){combatAccumulator=0;return}let elapsed=Math.max(0,Math.min(realDt,.05));advanceArrivalEffects(elapsed);combatAccumulator+=elapsed*gameSpeed;while(combatAccumulator+1e-10>=combatStep){combatAccumulator=Math.max(0,combatAccumulator-combatStep);update(combatStep);if(paused||ended){combatAccumulator=0;break}}}
// In 협동 모드 the field holds everyone's units; "mine" are the ones this player owns.
function ownedUnits(){return typeof Coop==='object'&&Coop.on?units.filter(u=>u.owner===Coop.me):units}
function recipeMatches(r){let used=[];for(const type of r.parts){let u=ownedUnits().find(x=>x.type===type&&!used.includes(x.id));if(!u)return null;used.push(u.id)}return used}
function selectedRecipeMatches(recipe){let chosen=[],pool=selected.map(id=>units.find(unit=>unit.id===id)).filter(Boolean);for(const type of recipe.parts){let unit=pool.find(candidate=>candidate.type===type&&!chosen.includes(candidate.id));if(!unit)return null;chosen.push(unit.id)}return chosen}
function saleValue(unit){return Math.floor(types[unit.type].normal_equivalent*summonCost/2*(1+treeBonus('sale')))}
// Same-grade conversion: rerolls one unit into a random different unit of its grade so dead-end materials can be recycled.
// Legendary and special grades (disaster, paradox, celestial) are excluded to keep their acquisition deliberate.
const conversionCosts={'노말':10,'매직':15,'레어':40,'에픽':100,'유니크':250};
function conversionCost(unit){let cost=conversionCosts[types[unit.type]?.grade];if(cost==null)return null;cost=cost*(1-treeBonus('convert'));return Math.ceil(runRelics.convert?cost*relicRules.convert:cost)}
function convertUnit(id){if(ended||paused)return;let unit=units.find(u=>u.id===id);if(!unit||!selected.includes(id))return;let grade=types[unit.type].grade,cost=conversionCost(unit);if(cost===null){notice(grade+' 등급은 변환할 수 없습니다','fusion-warning');return}if(gold<cost){notice('골드가 부족합니다');return}let pool=Object.keys(types).filter(type=>types[type].grade===grade&&type!==unit.type);if(!pool.length)return;let next=pool[Math.floor(Math.random()*pool.length)],previous=units;units=units.filter(u=>u.id!==id);let u=addUnit(next,unit.x,unit.y);if(!u){units=previous;notice('변환할 공간이 부족합니다','fusion-warning');return}gold-=cost;selected=selected.map(value=>value===id?u.id:value);selectedEnemy=null;showArrivalEffect(grade,u);notice(`${types[unit.type].name} → ${types[next].name} 변환`);missionEvent('convert',next);updateUI()}
function sellUnit(id){if(ended||paused)return;let unit=units.find(u=>u.id===id);if(!unit||!selected.includes(id))return;let value=saleValue(unit);units=units.filter(u=>u.id!==id);selected=selected.filter(selectedId=>selectedId!==id);gold+=value;notice(types[unit.type].name+' 판매 · '+value+'골드 획득');missionEvent('sell',unit.type);updateUI()}
function combine(index,preserveScroll=false){if(ended||paused)return;let oldViewport=preserveScroll?$('#fusionViewport'):null,oldScroll=oldViewport?.scrollLeft??0;let r=recipes[index];if(!r)return;if(selected.length<2){notice('선택한 재료가 변경되었습니다','fusion-warning');updateUI();return}let ids=selectedRecipeMatches(r);if(!ids){notice('선택한 재료가 변경되었습니다','fusion-warning');updateUI();return}let resultGrade=types[r.result].grade;if(specialGradeLimit(resultGrade)!==null&&units.filter(u=>types[u.type].grade===resultGrade&&!ids.includes(u.id)).length>=specialGradeLimit(resultGrade)){notice(resultGrade+' 전용 슬롯이 이미 사용 중입니다','fusion-warning');return}let origin=units.find(u=>ids.includes(u.id));if(!origin){notice('선택한 재료가 변경되었습니다','fusion-warning');updateUI();return}let place=roomyPosition(r.result,origin.x,origin.y,ids)||freePosition(r.result,origin.x,origin.y,ids);if(!place){notice('조합 유닛이 등장할 공간이 부족합니다','fusion-warning');return}let previousUnits=units;units=units.filter(u=>!ids.includes(u.id));let u=addUnit(r.result,place.x,place.y);if(u)missionEvent('fuse',r.result);if(!u){units=previousUnits;notice('조합 유닛이 등장할 공간이 부족합니다','fusion-warning');return}showArrivalEffect(types[r.result].grade,u);recordAcquire(r.result);selected=[...selected.filter(id=>!ids.includes(id)&&units.some(unit=>unit.id===id)),u.id];selectedEnemy=null;notice(types[r.result].name+' 조합 성공!');updateUI();if(oldViewport){let viewport=$('#fusionViewport');if(viewport){viewport.scrollLeft=oldScroll;refreshFusionArrows()}}}
let recipeBookContext={filter:null,mainOnly:false};
// ---- Codex (조합 도감): unit grid on the left, the selected unit's details on the right ----
// codexState keeps filters while the book is open; openRecipes(filter, mainOnly, faction) keeps its old signature
// (filter = unit to select; mainOnly is accepted for the R shortcut and shows that unit's details).
const codexState={grade:'all',query:'',show:'all',role:null,mark:null,theme:false,selected:null,usesOf:null};
const codexRoles=[['physical','물리',['physical']],['magic','마법',['magic']],['area','범위·관통',['area','pierce','chain']],['dot','지속 피해',['dot']],['control','감속·제어',['slow','control']],['shred','방깎·마깎',['armor','resist']],['support','지원',['support','summon']]];
// Theme counters, same as the theme descriptions: steel → magic/armor shred, magic → physical/resist shred, speed → area, life → damage over time.
const codexThemeRoles={steel:['magic','armor'],magic:['physical','resist'],speed:['area','pierce','chain'],life:['dot']};
function codexOwned(){let have={};for(const u of ownedUnits())have[u.type]=(have[u.type]||0)+1;return have}
// Parts still missing for one recipe with the current army.
function codexMissing(r,have){let need={};for(const p of r.parts)need[p]=(need[p]||0)+1;return Object.entries(need).reduce((s,[t,n])=>s+Math.max(0,n-(have[t]||0)),0)}
// Best readiness over all recipes of a unit: 0 = can fuse now, 1 = one part short, otherwise null.
function codexReadiness(id,have){let best=null;for(const r of recipes)if(r.result===id){let m=codexMissing(r,have);if(best===null||m<best)best=m}return best}
function codexMatches(t,have){let s=codexState,tags=unitRoleTags[t.id]||[];if(s.mark){let p=ManmulMarks.profile(t.id);if(!p.applies.includes(s.mark)&&!p.uses.includes(s.mark))return false}if(s.usesOf&&!recipes.some(r=>r.result===t.id&&r.parts.includes(s.usesOf)))return false;if(s.grade!=='all'&&t.faction_id!==s.grade)return false;if(s.query&&!t.name.includes(s.query))return false;
 if(s.role){let keys=codexRoles.find(r=>r[0]===s.role)?.[2]||[];if(!tags.some(k=>keys.includes(k)))return false}
 if(s.theme&&currentTheme&&!tags.some(k=>(codexThemeRoles[currentTheme]||[]).includes(k)))return false;
 if(s.show!=='all'){let ready=codexReadiness(t.id,have);if(ready===null||ready>(s.show==='ready'?0:1))return false}return true}
function codexMarkBadge(id){let m=codexState.mark;if(!m)return '';let p=ManmulMarks.profile(id);return `<span class="codex-markrole" style="--mark:${ManmulMarks.byId[m].color}">${p.applies.includes(m)?'붙임':'활용'}</span>`}
function codexCard(t,have){let ready=codexReadiness(t.id,have),owned=have[t.id]||0,badge=ready===0?'<span class="codex-badge is-ready">조합 가능</span>':ready===1?'<span class="codex-badge is-near">1개 부족</span>':'';
 return `<button type="button" class="codex-card${codexState.selected===t.id?' is-selected':''}${ready===0?' is-ready':''}" onclick="openRecipesForUnit('${t.id}')" aria-label="${t.name} 보기"><span class="codex-portrait" style="${bookPortraitStyle(t.id)}">${portraitContent(t.id)}</span><span class="codex-name" style="color:${gradeColors[t.grade]}">${t.name}</span>${owned?`<span class="codex-owned">×${owned}</span>`:''}${badge}${codexMarkBadge(t.id)}</button>`}
function codexListHtml(){let have=codexOwned(),list=Object.values(types).filter(t=>codexMatches(t,have)).sort((a,b)=>ManmulRoster.grades.indexOf(a.grade)-ManmulRoster.grades.indexOf(b.grade)||a.id.localeCompare(b.id));
 return list.length?list.map(t=>codexCard(t,have)).join(''):'<p class="codex-empty">조건에 맞는 유닛이 없습니다.</p>'}
function codexIngredients(r,have){return [...new Set(r.parts)].map(type=>{let need=r.parts.filter(p=>p===type).length,own=have[type]||0;return `<button type="button" class="codex-part" onclick="openRecipesForUnit('${type}')" title="${types[type].name} 보기"><span class="ingredient-portrait" style="${bookPortraitStyle(type)}" aria-hidden="true">${portraitContent(type)}</span><span class="codex-part-name" style="color:${gradeColors[types[type].grade]}">${types[type].name}</span><span class="ingredient-count ${own>=need?'is-owned':'is-missing'}">${own}/${need}</span></button>`}).join('<span class="codex-plus" aria-hidden="true">+</span>')}
function codexDetailHtml(){let id=codexState.selected,t=types[id],have=codexOwned();
 if(!t){let ready=Object.values(types).filter(x=>codexReadiness(x.id,have)===0).length;return `<div class="codex-intro"><strong>유닛을 고르세요</strong><p>왼쪽에서 유닛을 누르면 능력, 만드는 법, 재료로 쓰이는 곳을 보고 목표 지정을 할 수 있습니다.</p><p class="codex-summary">지금 조합 가능한 유닛 <b>${ready}</b>종</p></div>`}
 let level=gradeLevels[t.grade]||0,base=Math.round((t.uses_basic?t.attack:(t.skill_power??t.attack))*(combatRules.gradePower[t.grade]??1)*unitCostPower(t)),bonus=Math.round(base*level*.1);
 let makes=recipes.filter(r=>r.result===id),uses=recipes.filter(r=>r.parts.includes(id)),useResults=[...new Set(uses.map(r=>r.result))];
 return `<div class="codex-head"><span class="codex-big" style="${bookPortraitStyle(id)}">${portraitContent(id)}</span><div><strong style="color:${gradeColors[t.grade]}">${t.name}</strong><span class="codex-sub">${t.grade} · ${t.damage_type} · 노말 ${t.normal_cost}기분</span>${renderRoleTags(t)}</div></div>
  <div class="codex-stats"><span>${t.uses_basic?ManmulUnitText.powerLabel(t.damage_type):(t.damage_type==='마법'?'마력 (기술)':'기술 위력')} <b>${base}</b>${bonus?`<span class="stat-bonus">+${bonus}</span>`:''}</span><span>사거리 <b>${(t.range/45).toFixed(1)}</b>타일</span>${specialGradeLimit(t.grade)!==null?`<span class="grade-limit">${gradeLimitText(t.grade)}</span>`:''}${(()=>{let sp=starProgress(id);return `<span class="codex-stars" title="조각 상자에서 이 유닛의 조각을 모으면 성급이 오릅니다"><b class="star-row">${starText(sp.stars)}</b> ${sp.need?`조각 ${sp.have}/${sp.need}`:'최대'}${sp.stars?` · 공격력 +${sp.stars}%`:''}</span>`})()}${t.uses_basic&&t.attack_speed?`<span>공격속도 <b>${t.attack_speed}</b>회/초</span>`:''}${have[id]?`<span>보유 <b>${have[id]}</b></span>`:''}</div>
  <div class="codex-skills skill-list">${unitSkillIcons(t,level)}</div><p class="codex-effect">${t.attack_effect}${t.active?`<br><b>${t.skill_name}</b> · ${t.skill_effect}`:''}</p>${unitMarkHtml(id)}
  ${makes.length?`<section class="codex-section"><h3>만드는 법</h3>${makes.map((r,i)=>`<div class="codex-recipe${codexMissing(r,have)===0?' is-ready':''}">${makes.length>1?`<span class="codex-recipe-tag">${r.alt?'대체':'기본'}</span>`:''}${codexIngredients(r,have)}</div>`).join('')}<button type="button" class="codex-goal" onclick="setGoal('${id}')">목표 지정</button></section>`:'<section class="codex-section"><h3>만드는 법</h3><p class="muted">소환으로 얻는 유닛입니다.</p></section>'}
  <section class="codex-section"><h3>재료로 쓰이는 곳 <small>${useResults.length}</small></h3>${useResults.length?`<div class="codex-uses">${useResults.map(rid=>`<span class="codex-use" role="button" tabindex="0" title="${types[rid].name} 보기" onclick="if(!event.target.closest('.codex-use-goal'))openRecipesForUnit('${rid}')" onkeydown="if(event.key==='Enter'&&event.target===this)openRecipesForUnit('${rid}')"><span class="ingredient-portrait" style="${bookPortraitStyle(rid)}" aria-hidden="true">${portraitContent(rid)}</span><span style="color:${gradeColors[types[rid].grade]}">${types[rid].name}</span><button type="button" class="codex-use-goal" onclick="setGoal('${rid}')" aria-label="${types[rid].name} 목표 지정">목표 지정</button></span>`).join('')}</div>`:'<p class="muted">다른 조합의 재료로 쓰이지 않습니다.</p>'}</section>`}
function codexToolbarHtml(){let s=codexState,categories=[{id:'all',name:'전체'},...rosterData.factions];
 return `${s.usesOf&&types[s.usesOf]?`<div class="codex-usesof"><span class="ingredient-portrait" style="${bookPortraitStyle(s.usesOf)}" aria-hidden="true">${portraitContent(s.usesOf)}</span><span><b style="color:${gradeColors[types[s.usesOf].grade]}">${types[s.usesOf].name}</b>(으)로 만들 수 있는 유닛</span><button type="button" class="codex-chip" onclick="codexSet('usesOf',null)">전체 보기</button></div>`:''}<div class="faction-tabs" aria-label="등급 분류">${categories.map(c=>`<button class="faction-tab" aria-pressed="${c.id===s.grade}" onclick="filterRecipeFaction('${c.id}')">${c.name}</button>`).join('')}</div>
  <div class="codex-filters"><input class="codex-search" type="search" placeholder="이름 검색" value="${s.query.replace(/"/g,'&quot;')}" oninput="codexSet('query',this.value)" aria-label="유닛 이름 검색">
  ${[['all','전체'],['ready','조합 가능'],['near','1개 부족까지']].map(([k,n])=>`<button type="button" class="codex-chip" aria-pressed="${s.show===k}" onclick="codexSet('show','${k}')">${n}</button>`).join('')}
  <span class="codex-divider"></span>${codexRoles.map(([k,n])=>`<button type="button" class="codex-chip" aria-pressed="${s.role===k}" onclick="codexSet('role','${k}')">${n}</button>`).join('')}
  ${currentTheme?`<button type="button" class="codex-chip is-theme" aria-pressed="${s.theme}" onclick="codexSet('theme',${!s.theme})" title="${ManmulThemes.themes[currentTheme].name}에 유리한 역할">테마 추천</button>`:''}</div>
  <div class="codex-marks"><span class="codex-marks-label">표식</span>${ManmulMarks.marks.map(m=>`<button type="button" class="codex-chip mark-filter" style="--mark:${m.color}" aria-pressed="${s.mark===m.id}" onclick="codexSet('mark','${m.id}')" title="${m.desc}"><i>${m.short}</i>${m.id}</button>`).join('')}<button type="button" class="codex-chip codex-guide" onclick="openMarkGuide('codex')">표식·반응 안내</button></div>`}
// Re-render only the parts that changed so the search box keeps focus while typing.
function codexRefresh(parts={list:true,detail:true,toolbar:false}){let root=$('#modalContent'),q=s=>root?.querySelector?.(s);if(!q('.codex-list')){renderCodex();return}if(parts.toolbar&&q('.codex-toolbar'))q('.codex-toolbar').innerHTML=codexToolbarHtml();if(parts.list&&q('.codex-list'))q('.codex-list').innerHTML=codexListHtml();if(parts.detail&&q('.codex-detail')){q('.codex-detail').innerHTML=codexDetailHtml();q('.codex-detail').scrollTop=0}}
function codexSet(key,value){if(key==='role'||key==='mark')codexState[key]=codexState[key]===value?null:value;else codexState[key]=value;if(key==='query'){codexRefresh({list:true});return}renderCodex()}
// ---- 표식·반응: what a unit does with marks, and a one-page guide to the six marks and their reactions ----
function unitMarkHtml(id){let p=ManmulMarks.profile(id);if(!p.applies.length&&!p.uses.length&&!p.reaction)return '';let r=p.reaction&&ManmulMarks.reactions.find(x=>x.name===p.reaction);
 return `<section class="codex-section codex-markinfo"><h3>표식 <button type="button" class="codex-chip codex-guide" onclick="openMarkGuide('codex')">안내</button></h3><div class="mark-lines">${p.applies.length?`<p><b>붙임</b>${p.applies.map(m=>ManmulMarks.chip(m)).join('')}<small>공격한 적에게 이 표식을 남깁니다</small></p>`:''}${p.uses.length?`<p><b>활용</b>${p.uses.map(m=>ManmulMarks.chip(m)).join('')}<small>이 표식이 붙은 적에게 더 강합니다</small></p>`:''}${r?`<p><b>반응</b><span class="mark-reaction">${r.name}</span><small>${r.need.map(n=>ManmulMarks.byId[n]?ManmulMarks.chip(n):n).join(' + ')}${r.hit?' + '+r.hit:''} → ${r.effect}</small></p>`:''}</div></section>`}
let markGuideFrom=null;
function openMarkGuide(from=null){markGuideFrom=from;if(from==='help'&&menuPreviousPause===null&&helpPreviousPause===null){helpPreviousPause=paused;paused=true}
 let P=ManmulMarks.profiles(),count=(m,k)=>Object.values(P).filter(p=>p[k].includes(m)).length;
 let back=from==='codex'?'<button class="ui-btn-ghost" onclick="renderCodex()">도감으로</button>':from==='help'?'<button class="ui-btn-ghost" onclick="openHelp()">도움말로</button>':'';
 $('#modalContent').innerHTML=`${modalOpen({eyebrow:'MARKS',title:'표식과 반응',close:'표식 안내 닫기',variant:'mark-guide'})}<p class="ui-modal-lead">표식은 적에게 붙는 상태 6가지뿐입니다. <b>붙이는 유닛</b>이 표식을 남기고, <b>활용하는 유닛</b>이나 다른 표식·공격이 겹치면 <b>반응</b>이 터집니다. 표식은 4초 동안 유지됩니다.</p>
 <div class="mark-grid">${ManmulMarks.marks.map(m=>`<div class="mark-card" style="--mark:${m.color}"><div class="mark-card-head"><i>${m.short}</i><strong>${m.id}</strong></div><p>${m.desc}</p><div class="mark-card-links"><button type="button" onclick="markGuideToCodex('${m.id}')">붙임 ${count(m.id,'applies')}종 · 활용 ${count(m.id,'uses')}종 보기</button></div></div>`).join('')}</div>
 <h3 class="mission-group">반응</h3><ul class="reaction-list">${ManmulMarks.reactions.map(r=>`<li><span class="reaction-recipe">${r.need.map(n=>ManmulMarks.byId[n]?ManmulMarks.chip(n):`<span class="mark-chip is-any">${n}</span>`).join('<b>+</b>')}${r.hit?`<b>+</b><span class="reaction-hit">${r.hit}</span>`:''}</span><span class="reaction-arrow">→</span><strong>${r.name}</strong><small>${r.effect}</small></li>`).join('')}</ul>${modalClose(back+'<button class="ui-btn-primary" onclick="closeModal()">닫기</button>')}`;$('#modal').classList.remove('hidden')}
function markGuideToCodex(mark){Object.assign(codexState,{grade:'all',query:'',show:'all',role:null,theme:false,usesOf:null,selected:null,mark});renderCodex()}
function renderCodex(){$('#modalContent').innerHTML=modalOpen({eyebrow:'CODEX',title:'조합 도감',close:'조합 도감 닫기',variant:'recipe-book codex'})+`<div class="codex-toolbar">${codexToolbarHtml()}</div><div class="codex-body"><div class="codex-list" aria-label="유닛 목록">${codexListHtml()}</div><div class="codex-detail" aria-live="polite">${codexDetailHtml()}</div></div>`+modalClose();$('#modal').classList.remove('hidden')}
function filterRecipeFaction(faction){codexState.grade=faction;renderCodex()}
function openRecipesForUnit(id){if(!types[id])return;codexState.selected=id;if($('#modal').classList.contains('hidden')||!$('#modalContent').innerHTML.includes('codex-body'))renderCodex();else codexRefresh({list:true,detail:true})}
function openRecipes(filter=null,mainOnly=false,faction=null){if(ended)return;codexState.usesOf=mainOnly&&types[filter]?filter:null;if(codexState.usesOf)Object.assign(codexState,{grade:'all',query:'',show:'all',role:null,theme:false});if(faction)codexState.grade=faction;codexState.selected=types[filter]?filter:null;renderCodex()}
function openUpgrades(){if(ended)return;const grades=ManmulRoster.grades;$('#modalContent').innerHTML=modalOpen({eyebrow:'UPGRADE',title:'등급 강화',close:'등급 강화 닫기'})+'<p class="ui-modal-lead">해당 등급의 모든 아군 공격력·마력과 기술 위력을 한 판 동안 강화합니다. 새로 소환하거나 조합한 유닛에도 적용됩니다.</p><div class="upgrade-list">'+grades.map(g=>{let level=gradeLevels[g],cost=upgradeCost(level),owned=units.filter(u=>types[u.type]?.grade===g).length;return `<div class="upgrade-row${owned?'':' is-empty'}"><strong class="upgrade-grade" style="color:${gradeColors[g]}">${g}</strong><span class="upgrade-owned">${owned?'보유 '+owned+'기':'보유 없음'}</span><span class="upgrade-pips" role="img" aria-label="${level}단계">${'<i class="on"></i>'.repeat(level)}${'<i></i>'.repeat(Math.max(0,5-level))}</span><span class="upgrade-bonus">공격력·마력·기술 위력 +${level*10}%${level<5?' → <b>+'+(level+1)*10+'%</b>':''}</span><button onclick="upgradeGrade('${g}')" ${level>=5||gold<cost?'disabled':''}>${level>=5?'최대':cost+'골드'}</button></div>`}).join('')+'</div>'+modalClose();$('#modal').classList.remove('hidden')}
// 등급 강화 비용 (계승의 나무 「대장간 단골」로 할인)
function upgradeCost(level){return Math.round((30+level*20)*(1-treeBonus('upgradeDiscount'))*(1-eventState.bonus.upgrade))}
function supportLimit(kind){return (kind==='loan'?1:2)+(kind==='loan'?0:treeBonus('support'))}
function upgradeGrade(grade){let level=gradeLevels[grade],cost=upgradeCost(level);if(level>=5||gold<cost)return;gold-=cost;gradeLevels[grade]++;missionEvent('upgrade',grade);globalThis.ManmulSound?.play('upgrade');updateUI();openUpgrades()}
let helpPreviousPause=null, menuPreviousPause=null, menuPage=null;
let showDamageNumbers=true;
try{showDamageNumbers=localStorage.getItem('rift-show-damage')!=='false'}catch(e){}
// Bottom info panel (selected unit / enemy) size: 80–140%, changed with the −/＋ buttons on the panel or in settings.
const selectionScaleSteps=[.8,.9,1,1.15,1.3,1.4];
let selectionScale=(()=>{try{let v=Number(localStorage.getItem('selection-scale'));return selectionScaleSteps.includes(v)?v:1}catch(e){return 1}})();
function applySelectionScale(){$('#selection')?.style?.setProperty('--sel-scale',String(selectionScale))}
function setSelectionScale(v){v=Number(v);if(!selectionScaleSteps.includes(v))return;selectionScale=v;try{localStorage.setItem('selection-scale',String(v))}catch(e){}applySelectionScale();ensureSelectionZoom(true)}
function stepSelectionScale(dir){let i=selectionScaleSteps.indexOf(selectionScale);setSelectionScale(selectionScaleSteps[Math.max(0,Math.min(selectionScaleSteps.length-1,i+dir))])}
function selectionScaleRowHtml(){return `<label class="setting-row"><span><strong>정보창 크기</strong><small>유닛·적을 눌렀을 때 아래에 뜨는 정보창의 크기입니다.</small></span><select onchange="setSelectionScale(this.value)">${selectionScaleSteps.map(v=>`<option value="${v}" ${v===selectionScale?'selected':''}>${Math.round(v*100)}%</option>`).join('')}</select></label>`}
function ensureSelectionZoom(force=false){let box=$('#selection');if(!box||!box.querySelector||!box.insertAdjacentHTML)return;let old=box.querySelector('.sel-zoom');if(old&&!force)return;old?.remove?.();
 let i=selectionScaleSteps.indexOf(selectionScale);box.insertAdjacentHTML('afterbegin',`<div class="sel-zoom" aria-label="정보창 크기"><button type="button" onclick="stepSelectionScale(-1)" ${i<=0?'disabled':''} aria-label="정보창 축소" title="정보창 축소">−</button><span>${Math.round(selectionScale*100)}%</span><button type="button" onclick="stepSelectionScale(1)" ${i>=selectionScaleSteps.length-1?'disabled':''} aria-label="정보창 확대" title="정보창 확대">＋</button></div>`)}
function setDamageNumbers(value){showDamageNumbers=!!value;try{localStorage.setItem('rift-show-damage',String(showDamageNumbers))}catch(e){}}
function openBattleMenu(){if(ended||inLobby||!$('#modal').classList.contains('hidden'))return;menuPreviousPause=paused;paused=true;renderBattleMenu();$('#modal').classList.remove('hidden');updateUI()}
function openCardDeck(){menuPage='cards';$('#modalContent').innerHTML=`${modalOpen({eyebrow:'DECK',title:'보상 카드',close:'닫기'})}<p class="ui-modal-lead">이번 전투에서 모은 카드와 세트 진행 상황입니다.</p>${cardDeckHtml()}${cardTaken().length?'':'<p class="muted">아직 받은 카드가 없습니다. 보스를 처치하면 카드를 고릅니다.</p>'}${modalClose('<button class="ui-btn-primary" onclick="renderBattleMenu()">메뉴로</button>')}`}
// Game menu buttons follow the title menu: a gold mark on hover, a name and one line of context.
// Test tools are for development only: the menu shows them when the page is opened with ?dev (e.g. index.html?dev).
const devMode=(()=>{try{return /[?&]dev(=|&|$)/.test(location.search||'')}catch(e){return false}})();
function menuButton(label,detail,onclick,cls=''){return `<button type="button" class="menu-btn ${cls}" onclick="${onclick}"><span class="menu-btn-mark" aria-hidden="true">▶</span><strong>${label}</strong><small>${detail}</small></button>`}
// ---- 조각 상자: monsters drop boxes now and then (at most ${starRules.maxBoxesPerRun} per run); they open when the run ends ----
let runBoxes=[],runBoxResults=null;
// Box grade from the round: early rounds give low boxes, later rounds can give up to 레전더리; bosses roll one higher.
function rollBoxGrade(bonus=0){let top=Math.min(boxGrades.length-1,Math.floor(wave/12)+bonus),weights=[];for(let i=0;i<=top;i++)weights.push(1/(1+Math.abs(top-i)*.8+(top-i)*.4));let r=Math.random()*weights.reduce((a,b)=>a+b,0);for(let i=0;i<=top;i++){r-=weights[i];if(r<0)return boxGrades[i]}return boxGrades[top]}
const boxDropRules={normal:.0004,boss:.2,hunt:.12};
// Kill gold: in 협동 모드 (host) every player gets it; otherwise it is this player's.
function coopGoldGain(n){if(typeof Coop==='object'&&Coop.on&&Coop.host)Coop.addGoldAll(n);else gold+=n}
function boxDropCheck(enemy){if(testRun||inLobby||isEndlessRun()||runBoxes.length>=starRules.maxBoxesPerRun)return;let hunt=!!enemy.bountyId,boss=enemy.kind==='boss',chance=boss?boxDropRules.boss:hunt?boxDropRules.hunt:boxDropRules.normal;if(Math.random()>=chance)return;
 let grade=rollBoxGrade(boss||hunt?1:0);runBoxes.push(grade);globalThis.ManmulSound?.play('reward');notice(`조각 상자 획득! (${grade}) · 게임이 끝나면 열립니다 ${runBoxes.length}/${starRules.maxBoxesPerRun}`);if(typeof renderMissionHud==='function')renderMissionHud(true)}
function openRunBoxes(){if(runBoxResults)return runBoxResults;let used=[...new Set(Object.values(runStats.unitTypes))];runBoxResults=testRun?[]:runBoxes.map(gr=>openBox(gr,used)).filter(Boolean);return runBoxResults}
function runBoxResultHtml(){let res=openRunBoxes();if(!res.length)return '<span class="muted">이번 판에 얻은 상자가 없습니다</span>';
 return `<div class="box-results">${res.map(r=>`<div class="box-result" style="--box:${boxDefs[r.grade].color}"><b>${r.grade} 상자</b><span>${r.gains.map(gn=>`${types[gn.id]?.name||gn.id} +${gn.n}${gn.after>gn.before?` <em>★${gn.after} 달성!</em>`:''}`).join(' · ')}</span>${r.cosmetic?`<span class="box-cosmetic">${r.cosmetic.group==='maps'?r.cosmetic.name:`꾸미기 「${r.cosmetic.name}」`} 획득!</span>`:''}</div>`).join('')}</div>`}
// Unit panel: one compact row (portrait, name, stats, skills); ▼ opens the attack/skill text, marks and stars.
let unitDetailsOpen=(()=>{try{return localStorage.getItem('unit-details-open')==='1'}catch(e){return false}})();
function toggleUnitDetails(){unitDetailsOpen=!unitDetailsOpen;try{localStorage.setItem('unit-details-open',unitDetailsOpen?'1':'0')}catch(e){}let box=$('#selection');if(box)box.dataset.signature='';updateUI()}
function unitDetailsHtml(t){let p=ManmulMarks.profile(t.id),sp=starProgress(t.id);
 return `<div class="unit-details"><p><b>기본 공격</b> ${t.attack_effect}</p>${t.active?`<p><b>${t.skill_name}</b> ${t.skill_cooldown}초마다 · ${t.skill_effect}</p>`:''}${p.applies.length||p.uses.length?`<p><b>표식</b> ${p.applies.map(m=>ManmulMarks.chip(m,' 붙임')).join('')}${p.uses.map(m=>ManmulMarks.chip(m,' 활용')).join('')}${p.reaction?` 반응 ${p.reaction}`:''}</p>`:''}<p><b>성급</b> <span class="star-row">${starText(sp.stars)}</span> ${sp.need?`조각 ${sp.have}/${sp.need}`:'최대'}${sp.stars?` · 공격력 +${sp.stars}%`:''}</p></div>`}
function renderBattleMenu(){menuPage='main';let theme=currentTheme?ManmulThemes.themes[currentTheme].name:'테마 미정',cards=cardTaken().length,sets=Object.keys(ManmulCards.families).filter(cardSet).length,ready=typeof huntReadyCount==='function'?huntReadyCount():0;
 $('#modalContent').innerHTML=`${modalOpen({eyebrow:multiActive()?'MENU':'PAUSED',title:'게임 메뉴',close:'게임 메뉴 닫기',variant:'battle-menu'})}<div class="menu-status"><span>${selectedDifficulty?.name||'일반'} · ${theme}</span><b>${isEndlessRun()?endlessFloorText():`${wave} / ${maxWave} 라운드`}</b><span>몬스터 ${enemies.length} · 골드 ${gold}</span></div>${multiActive()?'<p class="ui-modal-lead">멀티 플레이 중에는 메뉴를 열어도 전투가 계속됩니다.</p>':''}
 <div class="menu-grid">${menuButton('계속하기',multiActive()?'전투로 돌아갑니다':'멈춘 전투를 이어 갑니다','closeModal()','is-primary is-wide')}${menuButton('보상 카드',cards?`${cards}장 모음${sets?` · 세트 ${sets}개`:''}`:'보스를 잡으면 카드를 고릅니다','openCardDeck()')}${menuButton('미션',typeof missionDoneCount==='function'?`${missionDoneCount()}/${missionList.length} 달성`:'','closeModal();openMissions()')}${menuButton('현상금 사냥',ready?`지금 ${ready}마리 부를 수 있음`:'재소환 대기 중','closeModal();openHunt()')}${menuButton('설정','소리 · 피해 숫자 · 정보창 크기','openBattleSettings()')}${menuButton('도움말','규칙 · 조작 · 표식과 반응','openHelp()',devMode?'':'is-wide')}${devMode?menuButton('테스트 모드','개발용 · 기록과 파편이 남지 않습니다','openTestMenu()','is-muted'):''}${menuButton('게임 나가기','이번 판을 끝내고 로비로','confirmLeaveBattle()','is-exit is-wide')}</div>${modalClose()}`}
// Sound rows: on/off and volume per group (whole, effects, warnings·progress). Changes are saved by ManmulSound.
function soundSettingsHtml(){let v=ManmulSound.settings,slider=(key,label,hint)=>`<label class="setting-row"><span><strong>${label}</strong><small>${hint}</small></span><input type="range" min="0" max="100" step="5" value="${Math.round(v[key]*100)}" onchange="ManmulSound.set('${key}',this.value/100)" aria-label="${label}"></label>`;return `<label class="setting-row"><span><strong>소리</strong><small>효과음을 켜거나 끕니다.</small></span><input type="checkbox" ${v.enabled?'checked':''} onchange="ManmulSound.set('enabled',this.checked)"></label>${slider('master','전체 음량','모든 소리의 크기')}${slider('sfx','효과음','소환·조합·공격·처치')}${slider('alert','경고·진행','라운드 시작·보스·적 수 경고·보상')}${slider('ui','버튼·알림','버튼 클릭·오류·채팅')}`}
function settingsRowsHtml(){return `<label class="setting-row"><span><strong>피해 숫자 표시</strong><small>전투 중 피해량과 기술 이름을 표시합니다.</small></span><input type="checkbox" ${showDamageNumbers?'checked':''} onchange="setDamageNumbers(this.checked)"></label>${selectionScaleRowHtml()}<label class="setting-row"><span><strong>초보자 안내</strong><small>처음 겪는 상황마다 짧은 안내를 띄웁니다. 전투는 멈추지 않습니다.</small></span><input type="checkbox" ${typeof ManmulTutorial==='object'&&ManmulTutorial.enabled?'checked':''} onchange="ManmulTutorial.setEnabled(this.checked)"></label>${typeof ManmulSound==='object'?soundSettingsHtml():''}<button type="button" class="setting-reset" onclick="ManmulTutorial.reset();notice('안내를 처음부터 다시 보여 줍니다')">안내 다시 보기</button>`}
function openBattleSettings(){if(menuPreviousPause===null)return;menuPage='settings';$('#modalContent').innerHTML=`${modalOpen({eyebrow:'SETTINGS',title:'설정',variant:'battle-menu'})}${settingsRowsHtml()}${modalClose('<button class="ui-btn-ghost" onclick="renderBattleMenu()">← 뒤로</button>')}`}
function openTestMenu(message=''){if(menuPreviousPause===null||ended||inLobby)return;menuPage='test';$('#modalContent').innerHTML=`${modalOpen({eyebrow:'TEST MODE',title:'테스트 모드',variant:'battle-menu test-menu'})}<p class="ui-modal-lead">사용한 전투는 기록과 파편 보상을 얻지 않습니다.</p><p class="test-menu-label">등급별 무작위 유닛 1기 소환</p><div class="test-grade-grid">${ManmulRoster.grades.map(grade=>`<button type="button" onclick="testSummonGrade('${grade}')">${grade} 소환</button>`).join('')}</div><button type="button" onclick="testAddGold()">골드 1,000 획득</button><button type="button" onclick="testSpawnUpperUnits()">상위 등급 유닛 일괄 소환</button><p class="test-menu-status" role="status">${message}</p>${modalClose('<button type="button" class="ui-btn-ghost" onclick="renderBattleMenu()">← 뒤로</button>')}`}
function specialGradeLimit(grade){return grade==='재앙'?1:grade==='천체'?2:null}
// "전장 최대 N기" for grades with a field limit, with how many of that grade are already on the field.
function gradeLimitText(grade,withCount=true){let n=specialGradeLimit(grade);if(n===null)return '';let have=ownedUnits().filter(u=>types[u.type]?.grade===grade).length;return withCount?`전장 최대 ${n}기 (${have}/${n})`:`전장 최대 ${n}기`}
function testSummonGrade(grade){if(menuPreviousPause===null||menuPage!=='test'||ended||inLobby||!ManmulRoster.grades.includes(grade))return;if(specialGradeLimit(grade)!==null&&units.filter(u=>types[u.type].grade===grade).length>=specialGradeLimit(grade)){openTestMenu(grade+' 전용 슬롯이 이미 사용 중입니다.');return}let candidates=Object.values(types).filter(t=>t.grade===grade);if(!candidates.length){openTestMenu('해당 등급의 유닛이 없습니다.');return}let type=candidates[Math.floor(Math.random()*candidates.length)],u=addUnit(type.id);if(!u){openTestMenu('유닛을 소환할 공간이 부족합니다.');return}markTestRun();selectedEnemy=null;selected=[u.id];showArrivalEffect('summon',u);updateUI();openTestMenu(type.name+' 소환 완료')}
function testAddGold(){if(menuPreviousPause===null||menuPage!=='test'||ended||inLobby)return;gold+=1000;markTestRun();updateUI();openTestMenu('골드 1,000 획득 · 현재 '+gold+'골드')}
function testSpawnUpperUnits(){if(menuPreviousPause===null||menuPage!=='test'||ended||inLobby)return;let before=units.length;spawnTestUnits();openTestMenu('상위 등급 유닛 '+(units.length-before)+'기 소환 완료')}
function confirmLeaveBattle(){if(menuPreviousPause===null)return;menuPage='exit';$('#modalContent').innerHTML=`${modalOpen({eyebrow:'EXIT',title:'게임 나가기'})}<p>${typeof ManmulSave==='object'&&!testRun&&!(typeof Multiplayer==='object'&&Multiplayer.started)?'진행 상황은 저장되어 로비에서 이어할 수 있습니다. 로비로 돌아갈까요?':'현재 진행 중인 전투는 저장되지 않습니다. 로비로 돌아갈까요?'}</p>${modalClose('<button class="ui-btn-ghost" onclick="renderBattleMenu()">계속하기</button><button class="ui-btn-danger" onclick="location.reload()">로비로 나가기</button>')}`}

function openHelp(){if(ended||inLobby||(!$('#modal').classList.contains('hidden')&&menuPreviousPause===null))return;if(menuPreviousPause!==null)menuPage='help';else{helpPreviousPause=paused;paused=true;}$('#modalContent').innerHTML=`${modalOpen({eyebrow:'HELP',title:'게임 도움말',close:'도움말 닫기',variant:'help-modal'})}<p><strong>목표</strong><br>바깥길을 도는 적을 처치하세요. 적이 101마리가 되면 패배합니다.</p><p><strong>균열 순환</strong><br>적이 바깥길을 한 바퀴 돌 때마다 최대 체력이 늘어납니다(최대 5회, 체력바 옆 빨간 점). 감속·묶기로 순환을 늦추면 적이 강해지기 전에 처치할 수 있습니다.</p><p><strong>선택권</strong><br>15라운드부터 중간 보스를 처치하면 유닛 선택권을 얻습니다(15·25라운드 노말 2장, 35라운드부터 매직 1장). 오른쪽 위 선택권 버튼으로 원하는 유닛을 골라 소환하며, 쓰기 전까지 보관됩니다.</p><p><strong>보스 보상</strong><br>보스를 처치하면 보상 카드 3장 중 하나를 고릅니다. 카드는 전술·유물·경제·소환 네 계열이고, 같은 계열을 3장 모으면 세트 효과(전술: 공격력 +5%, 유물: 4장 중 선택, 경제: 라운드 골드 +5, 소환: 보스마다 노말 선택권)가 켜집니다. 전술 카드는 3단계까지 쌓이고, 유물 카드는 판마다 한 번만 얻습니다. 오른쪽 위 「현상금」 버튼으로 현상금 보스(다칼·고시츄·후비이·오미뇽)를 직접 불러낼 수 있습니다. 소환은 무료지만 보스마다 재소환 시간이 있고, 제한 시간 안에 잡으면 골드·선택권·보상 카드를 받고 놓치면 도망칩니다. 뒤의 보스일수록 늦은 라운드에 열리고 더 강하지만 보상이 큽니다. 미션은 판마다 같은 목록(공개 17개·히든 9개)이 주어지고, 조건을 채우는 순간 골드·선택권·무작위 유닛 보상을 한 번씩 받습니다. 몇몇은 정해진 라운드 전에 해내야 하고, 히든 미션은 달성하기 전까지 조건이 숨겨져 있습니다. 화면 왼쪽 미션 카드를 누르면 전체 목록을 볼 수 있습니다. 극한을 클리어하면 <b>균열 단계</b>가 열립니다. 출격 화면에서 극한을 고르고 단계를 올리면 불리한 조건이 하나씩 쌓이는 대신 파편과 수호자 경험치를 더 받고, 그 단계를 정복하면 다음 단계가 열립니다(최대 10단계).</p><p><strong>소환과 조합</strong><br>Q 또는 소환 버튼으로 노말 유닛을 뽑습니다. 전장에서 재료 유닛을 함께 선택하고 조합 카드를 누르세요. E 조합 도감에서 조합식을 확인할 수 있습니다. W는 해당 등급 전체를 강화합니다. 쓰임이 적은 유닛은 한 기만 선택해 변환(D)하면 골드를 내고 같은 등급의 다른 유닛으로 무작위로 바뀝니다(노말~유니크).</p><p><strong>이동과 전투</strong><br>왼쪽 클릭이나 드래그로 선택하고 오른쪽 클릭으로 이동합니다. 같은 유닛을 더블클릭하면 같은 종류를 모두 선택합니다. 이동 중에는 공격하지 않으며 S로 정지할 수 있습니다.</p><p><strong>특수 유닛과 연계</strong><br>재앙은 전장에 한 기, 천체는 두 기까지 배치할 수 있습니다. 표식이 붙은 적에게 다른 공격을 맞히면 조건에 따라 연계가 발생합니다. <button type="button" class="codex-chip codex-guide" onclick="openMarkGuide('help')">표식·반응 안내</button></p><p><strong>라운드</strong><br>준비 시간은 30초이며, 이후 자동으로 라운드가 진행됩니다. 다음 스테이지 버튼으로 준비 시간을 넘기거나 적을 모두 처치한 뒤 다음 라운드를 시작할 수 있습니다.</p>${modalClose()}`;$('#modal').classList.remove('hidden')}
function closeModal(){if(themePending||pendingRewards.length)return;if(menuPreviousPause!==null){if(menuPage!=='main'){renderBattleMenu();return}paused=menuPreviousPause;menuPreviousPause=null;menuPage=null;$('#modal').classList.add('hidden');updateUI();return}$('#modal').classList.add('hidden');if(helpPreviousPause!==null){paused=helpPreviousPause;helpPreviousPause=null}if(missionPrevPause!==null){paused=missionPrevPause;missionPrevPause=null;updateUI()}}

function canAdvanceStage(){return !multiActive()&&!ended&&!paused&&wave<maxWave&&(wave===0||(spawnLeft===0&&enemies.every(e=>e.bountyId)))}
function showRoundBanner(round){
 let box=$('#roundBanner'),title=$('#roundBannerTitle'),detail=$('#roundBannerDetail');
 title.textContent=`${round} 라운드`;
 detail.textContent=isBossWave(round)?`${upcomingBoss?upcomingBoss.name:'보스'} 등장`:isMidWave(round)?'중간 보스 라운드':'라운드 시작';
 box.classList.remove('hidden','is-visible');void box.offsetWidth;box.classList.add('is-visible');
}
$('#roundBanner').addEventListener('animationend',event=>{if(event.target===$('#roundBanner')){$('#roundBanner').classList.add('hidden');$('#roundBanner').classList.remove('is-visible')}});
function startWave(){if(ended||(paused&&!multiActive())||wave>=maxWave)return;globalThis.ManmulSound?.play('wave');wave++;ManmulRecords.waveStarted(wave,enemies.length);minibossSpawned=false;minibossCleared=false;missionEvent('roundStart');eventRoundStart();spawnLeft=isBossWave(wave)?1:Math.round(40*(typeof Coop==='object'?Coop.waveCountMul():1)*(currentTheme?ManmulThemes.waveCountFactor(currentTheme,selectedDifficulty?.themeIntensity??0,wave):1));spawnInterval=spawnDuration/Math.max(1,spawnLeft);spawnTimer=0;waveTimer=0;let income=(selectedDifficulty?selectedDifficulty.income:combatRules.roundReward)+progression.levels.income;if(loanRounds>0){let deduction=Math.min(12,income);income-=deduction;loanRemaining-=deduction;loanRounds--;if(!loanRounds)loanRemaining=0}if(runRelics.interest)income+=Math.min(relicRules.interestCap,Math.floor(gold*relicRules.interest));income+=cardIncomeBonus();if(typeof Versus==='object')income=Math.round(income*Versus.incomeMul());if(typeof Coop==='object'&&Coop.on&&Coop.host)Coop.roundIncome(income);else gold+=income;showRoundBanner(wave);updateUI()}
function clearSelection(){selected=[];selectedEnemy=null;updateUI()}
// power = base (grade efficiency and recipe cost included) + bonus (grade upgrades, permanent progression, run rewards, buffs).
function selectedUnitStats(unit){let t=types[unit.type],profile=v5Combat.profile(unit),interval=v5Combat.attackInterval(unit),range=(v5Combat.range(unit)/45).toFixed(1)+'타일',total=Math.round(t.uses_basic?profile.attack:profile.skill_power||0),base=Math.round((t.uses_basic?t.attack:(t.skill_power??t.attack))*(combatRules.gradePower[t.grade]??1)*unitCostPower(t));return {powerLabel:t.uses_basic?ManmulUnitText.powerLabel(t.damage_type):(t.damage_type==='마법'?'마력 (기술)':'기술 위력'),power:total,base:Math.min(base,total),bonus:Math.max(0,total-base),level:gradeLevels[t.grade]||0,range:unit.type==='L002'?'기본 전체 · 기술 '+range:unit.type==='L007'?'전장 전체':range,speed:t.uses_basic&&interval?Number((1/interval).toFixed(2))+'회/초':'—'}}
function updateUI(){if(typeof ManmulTutorial==='object')ManmulTutorial.check();$('#themeStatus').textContent=currentTheme?ManmulThemes.themes[currentTheme].name:'미정';$('#themeStatus').title=currentTheme?ManmulThemes.themes[currentTheme].description:'';$('#waveLabel').textContent=wave===0?'준비 시간':isEndlessRun()?'무한 균열':'라운드';$('#wave').textContent=wave===0?`${Math.ceil(preparation)}초`:isEndlessRun()?endlessFloorText():`${wave} / ${maxWave}`;$('#waveSub').textContent=wave===0?'Q 소환 · 다음 스테이지로 시작':isMidWave(wave)&&waveTimer>=roundInterval&&!minibossCleared?'중간 보스 라운드 정리 중':isMidWave(wave)&&waveTimer>=roundInterval&&revealTime>0?'다음 보스 예고 확인 중':wave<maxWave?'다음 '+Math.max(0,Math.ceil(roundInterval-waveTimer))+'초':'마지막 라운드';$('#gold').textContent=String(gold);{let tb=$('#ticketButton');if(tb){tb.classList.toggle('hidden',!ticketTotal());tb.textContent=`선택권 ${ticketTotal()}`}}$('#count').textContent=String(enemies.length);$('#countGauge').style?.setProperty('width',Math.min(100,enemies.length)+'%');$('.hud-enemies').dataset.level=enemies.length>=80?'danger':enemies.length>=60?'warn':'safe';$('#count').classList.toggle('danger',enemies.length>=80);$('#summon').classList.toggle('is-unavailable',gold<summonCost);$('#actionHint').textContent=gold<summonCost?'소환: 골드 부족':'';$('#next').disabled=!canAdvanceStage();$('#next').title=wave>=maxWave?'마지막 라운드입니다':paused?'일시정지 중입니다':spawnLeft>0||enemies.length>0?'남은 적을 처치하면 진행할 수 있습니다':isMidWave(wave)&&!minibossCleared?'중간 보스를 처치하면 진행할 수 있습니다':'';updateGoal();let sel=units.filter(u=>selected.includes(u.id));let box=$('#selection');if(selectedEnemy){let e=enemies.find(x=>x.id===selectedEnemy);if(e){box.classList.remove('hidden');box.dataset.signature='enemy';box.innerHTML=enemyCardHtml(e);return}selectedEnemy=null}if(!sel.length){box.classList.add('hidden');box.innerHTML='';box.dataset.signature='';return}let currentStats=sel.length===1?selectedUnitStats(sel[0]):null;let signature=(currentStats?JSON.stringify(currentStats)+'|':'')+selected.join(',')+'|'+sel.map(u=>u.type).join(',')+'|'+ownedUnits().map(u=>u.type).sort().join(',')+'|'+JSON.stringify(gradeLevels);if(box.dataset.signature===signature)return;box.dataset.signature=signature;box.classList.toggle('hidden',!sel.length);if(sel.length===1){let t=types[sel[0].type];box.innerHTML=`<div class="selection-toolbar"><div class="selection-toolbar-group"><button type="button" onclick="sellUnit(${sel[0].id})">판매 · ${saleValue(sel[0])}골드</button>${conversionCost(sel[0])!==null?`<button type="button" class="convert-button" onclick="convertUnit(${sel[0].id})" title="같은 등급의 다른 유닛으로 무작위 변환 (D)">변환 · ${conversionCost(sel[0])}골드</button>`:''}</div><div class="selection-toolbar-group"><button type="button" onclick="openRecipes('${t.id}',false)">조합 도감</button><button type="button" class="selection-toolbar-close" aria-label="유닛 선택 해제" onclick="clearSelection()">×</button></div></div><div class="unit-compact"><span class="unit-portrait" style="${portraitStyle(t.id)}" aria-hidden="true">${portraitContent(t.id)}</span><div class="unit-identity"><strong style="color:${gradeColors[t.grade]}">${t.name}</strong><span class="unit-grade" style="color:${gradeColors[t.grade]}">${t.grade} · ${t.damage_type}${t.title?` · ${t.title}`:''}${specialGradeLimit(t.grade)!==null?` · <b class="grade-limit">${gradeLimitText(t.grade)}</b>`:''}</span>${renderRoleTags(t)}</div><div class="unit-stats-inline"><span><small>${currentStats.powerLabel}</small><b>${currentStats.base}${currentStats.bonus>0?`<span class="stat-bonus" title="등급 강화·버프로 오른 수치">+${currentStats.bonus}</span>`:''}</b></span><span><small>사거리</small><b>${currentStats.range}</b></span><span><small>공격속도</small><b>${currentStats.speed}</b></span></div><div class="skill-list">${unitSkillIcons(t,gradeLevels[t.grade]||0)}</div><button type="button" class="unit-more" aria-expanded="${unitDetailsOpen}" onclick="toggleUnitDetails()" title="${unitDetailsOpen?'설명 접기':'자세한 설명 보기'}">${unitDetailsOpen?'▲':'▼'}</button></div>${unitDetailsOpen?unitDetailsHtml(t):''}`;}else if(sel.length){let options=recipes.map((r,i)=>({r,i,ids:selectedRecipeMatches(r)})).filter(option=>option.ids).sort((a,b)=>ManmulRoster.grades.indexOf(types[b.r.result].grade)-ManmulRoster.grades.indexOf(types[a.r.result].grade)||a.i-b.i);box.innerHTML=`<div class="fusion-panel"><div class="selection-toolbar fusion-toolbar"><div class="selection-toolbar-group"><button type="button" class="selection-toolbar-close" onclick="clearSelection()" aria-label="선택 해제">×</button></div></div>${options.length?`<div class="fusion-carousel"><button id="fusionPrev" class="fusion-arrow hidden" type="button" onclick="moveFusionCards(-1)" aria-label="이전 조합 카드">‹</button><div id="fusionViewport" class="fusion-viewport" onscroll="refreshFusionArrows()">${options.map(({r,i})=>{let result=types[r.result];return `<button type="button" class="fusion-card" data-result="${r.result}"${specialGradeLimit(result.grade)!==null?` data-limit="${gradeLimitText(result.grade)}"`:''} ${['매직','레어','에픽','유니크','레전더리','재앙','역설','천체'].includes(result.grade)?`data-illustrated="true" style="--fusion-card-image:url('assets/ui/fusion-cards/${r.result}.webp')"`:''} onclick="combine(${i},event.shiftKey)" aria-label="${result.name} 조합"><span class="fusion-portrait" style="${portraitStyle(r.result)}" aria-hidden="true">${portraitContent(r.result)}</span><strong style="color:${gradeColors[result.grade]}">${result.name}</strong><span class="fusion-materials">${[...new Set(r.parts)].map(id=>{let quantity=r.parts.filter(part=>part===id).length;return `<span class="fusion-ingredient" title="${types[id].name}${quantity>1?' ×'+quantity:''}"><span class="fusion-ingredient-icon" style="${bookPortraitStyle(id)}" aria-hidden="true">${portraitContent(id)}</span><span class="fusion-ingredient-name">${types[id].name}</span>${quantity>1?`<span class="fusion-ingredient-count">×${quantity}</span>`:''}</span>`}).join('')}</span></button>`}).join('')}</div><button id="fusionNext" class="fusion-arrow hidden" type="button" onclick="moveFusionCards(1)" aria-label="다음 조합 카드">›</button></div>`:'<p class="fusion-empty">조합 가능한 식이 없습니다</p>'}</div>`;if(options.length)requestAnimationFrame(refreshFusionArrows)}}
function refreshFusionArrows(){let view=$('#fusionViewport'),prev=$('#fusionPrev'),next=$('#fusionNext');if(!view||!prev||!next)return;prev.classList.toggle('hidden',view.scrollLeft<=1);next.classList.toggle('hidden',view.scrollLeft+view.clientWidth>=view.scrollWidth-1)}
function moveFusionCards(direction){let view=$('#fusionViewport');if(!view)return;view.scrollBy({left:(direction<0?-1:1)*view.clientWidth,behavior:'smooth'})}
addEventListener('resize',()=>requestAnimationFrame(refreshFusionArrows));

function record(result){try{let r=JSON.parse(localStorage.getItem('rift-record')||'{}');if(!isEndlessRun())r.best=Math.max(r.best||0,wave);r.plays=(r.plays||0)+1;r.wins=(r.wins||0)+(result?1:0);if(selectedDifficulty){if(!r.byDifficulty||typeof r.byDifficulty!=='object'||Array.isArray(r.byDifficulty))r.byDifficulty={};let d=r.byDifficulty[selectedDifficultyId]||{},count=n=>Number.isInteger(n)&&n>=0?n:0;d.best=Math.max(count(d.best),wave);d.plays=count(d.plays)+1;d.wins=count(d.wins)+(result?1:0);r.byDifficulty[selectedDifficultyId]=d}localStorage.setItem('rift-record',JSON.stringify(r))}catch(e){}}
// ---- Result screen: summary line, best-record comparison, top damage units, enemy count per round, relics/bosses,
// then the full numbers folded away. 'Retry' restarts the same difficulty after a reload (single player only).
function difficultyBest(){try{let d=JSON.parse(localStorage.getItem('rift-record')||'{}').byDifficulty?.[selectedDifficultyId];return Number.isInteger(d?.best)?d.best:0}catch(e){return 0}}
function resultTopUnitsHtml(){let rows=Object.entries(runStats.damage).filter(([id])=>types[id]).sort((a,b)=>b[1]-a[1]).slice(0,5),total=Object.values(runStats.damage).reduce((a,b)=>a+b,0)||1,max=rows[0]?.[1]||1;
 if(!rows.length)return '<p class="muted">유닛 피해 기록이 없습니다.</p>';
 return '<ol class="result-units">'+rows.map(([id,n])=>`<li><span class="result-portrait" style="${bookPortraitStyle(id)}">${portraitContent(id)}</span><span class="result-unit-name" style="color:${gradeColors[types[id].grade]}">${types[id].name}</span><span class="result-bar"><i style="width:${Math.max(3,Math.round(n/max*100))}%"></i></span><span class="result-num">${formatDamage(n)} · ${Math.round(n/total*100)}%</span></li>`).join('')+'</ol>'}
// Bars per round: height = most enemies alive during that round; red from 80, the dashed line is the 100 limit.
function resultWaveGraphHtml(){let peaks=runStats.peaks||[],n=Math.max(wave,1),bars='';for(let w=1;w<=n;w++){let p=peaks[w]||0,lvl=p>=80?'danger':p>=60?'warn':'safe';bars+=`<i class="is-${lvl}" style="height:${Math.min(100,p)}%" title="${w}라운드 최대 ${p}마리"></i>`}
 return `<div class="result-graph" aria-label="라운드별 최대 몬스터 수"><div class="result-graph-bars" style="--n:${n}">${bars}</div><div class="result-graph-axis"><span>1</span><span>${n}라운드</span></div></div>`}
function resultSummaryHtml(won,prevBest,rewardHtml=''){let theme=currentTheme?ManmulThemes.themes[currentTheme].name:'없음',newBest=!testRun&&wave>prevBest&&prevBest>0,best=Math.max(prevBest,testRun?0:wave);
 let chips=(list,cls)=>list.length?list.map(x=>`<span class="${cls}">${escapeProfileText(x)}</span>`).join(''):'<span class="muted">없음</span>';
 let hunts=typeof huntBosses==='object'?huntBosses.filter(b=>hunt.kills[b.id]).map(b=>`${b.name} ×${hunt.kills[b.id]}`):[];
 return `<div class="result-summary"><div class="result-hero"><div class="result-headline"><span>${selectedDifficulty?.name||'일반'} · ${theme}</span><strong>${isEndlessRun()?endlessFloorText():`${won?'클리어':wave+'라운드'}<small> / ${maxWave}</small>`}</strong><span class="${newBest?'result-best is-new':'result-best'}">${newBest?'최고 기록 갱신!':(best?'최고 기록 '+best+(isEndlessRun()?'층':'라운드'):'첫 기록')}</span></div>${rewardHtml?`<p class="result-reward">${rewardHtml}</p>`:''}</div>
  <div class="result-columns"><div><section><h3>피해를 가장 많이 준 유닛</h3>${resultTopUnitsHtml()}</section>
  <section><h3>라운드별 몬스터 수</h3>${resultWaveGraphHtml()}</section></div>
  <div><section class="result-chips"><h3>미션 · 현상금 사냥</h3><div>${typeof missionDoneCount==='function'?`<span class="result-chip">미션 ${missionDoneCount()}/${missionList.length}</span>`:''}${chips(hunts,'result-chip is-hunt')}</div><h3>조각 상자</h3><div>${runBoxResultHtml()}</div><h3>이벤트</h3><div>${chips(eventSummaryList(),'result-chip is-event')}</div><h3>보상 카드</h3><div>${chips([...new Set(cardTaken())].map(id=>rewardName(id)+(cardTaken().filter(x=>x===id).length>1?' ×'+cardTaken().filter(x=>x===id).length:'')),'result-chip')}</div><h3>유물</h3><div>${chips(ownedRelicNames(),'result-chip is-relic')}</div><h3>처치한 보스</h3><div>${chips(runStats.bosses,'result-chip')}</div></section></div></div>
  <details class="result-more"><summary>자세한 통계</summary><div class="result-stats">${resultDetails()}</div></details></div>`}
function resultButtonsHtml(){let multi=typeof Multiplayer==='object'&&Multiplayer.started;return (multi?'':'<button class="ui-btn-ghost" onclick="retryRun()">같은 난이도로 다시 하기</button>')+'<button class="ui-btn-primary" onclick="location.reload()">로비로 돌아가기</button>'}
function retryRun(){try{sessionStorage.setItem('rift-retry',selectedDifficultyId)}catch(e){}location.reload()}
// After a reload from 'retry', start the same difficulty right away.
function retryFromSession(){let id=null;try{id=sessionStorage.getItem('rift-retry');sessionStorage.removeItem('rift-retry')}catch(e){}if(id&&Object.hasOwn(difficulties,id)&&inLobby){$('#difficultySelect').value=id;beginRiftRun(id)}}
function resultDetails(){let top=Object.entries(runStats.damage).sort((a,b)=>b[1]-a[1]).slice(0,3).map(([id,n])=>`${types[id].name} ${Math.round(n).toLocaleString()}`).join(' · ')||'없음';return `<p>전장 ${currentTheme?ManmulThemes.themes[currentTheme].name:'없음'} · ${selectedDifficulty?.name||'일반'} · ${wave}라운드</p><p>처치한 보스: ${runStats.bosses.join(', ')||'없음'}</p><p>유물: ${ownedRelicNames().join(', ')||'없음'}</p><p>${missionSummaryText()}</p><p>보상 카드: ${cardTaken().length}장${Object.keys(ManmulCards.families).filter(cardSet).map(f=>' · '+ManmulCards.families[f].name+' 세트').join('')}</p><p>최고 등급 유닛: ${runStats.highest?types[runStats.highest].name+' ('+types[runStats.highest].grade+')':'없음'}</p><p>물리 피해 ${Math.round(runStats.physical).toLocaleString()} · 마법 피해 ${Math.round(runStats.magic).toLocaleString()}</p><p>유닛별 피해: ${top}</p><p>출처 미확인 피해 ${Math.round(runStats.unattributed).toLocaleString()} · 지원 피해 ${Math.round(runStats.supportDamage).toLocaleString()}</p><p>긴급 지원: 폭격 ${supportUses.bomb}회 · 봉쇄 ${supportUses.slow}회 · 자금 ${supportUses.loan}회</p>`}
// 기록·업적: 해금 알림과 결과 화면의 "이번 판에서" 영역. 화면 디자인은 임시이며 Codex 작업 후 교체한다.
ManmulRecords.nameOf=id=>types[id]?.name||id;ManmulRecords.gradeOf=id=>types[id]?.grade||null;
function recordRewardText(reward){let labels={titles:'칭호',plates:'명찰',icons:'아이콘'};return (reward||[]).map(([group,id])=>`${labels[group]} 「${profileCosmetics[group]?.[id]?.name||id}」`).join(', ')}
function recordUnlockText(item){return item.kind==='icon'?`아이콘 해금 · ${item.name}`:`업적 달성 · ${item.name}`+(item.reward?.length?` → ${recordRewardText(item.reward)}`:'')}
ManmulRecords.onUnlock(item=>{if(!ended)notice('✦ '+recordUnlockText(item),'unlock')});
function runRecordHtml(summary){if(!summary)return '';let unlocked=summary.unlocked.map(item=>`<li class="run-record-new">${escapeProfileText(recordUnlockText(item))}</li>`).join(''),progress=summary.progress.map(p=>`<li><span>${escapeProfileText(p.label)}</span><span class="run-record-bar" aria-hidden="true" style="--before:${Math.round(p.before/p.max*100)}%"><i style="width:${Math.round(p.after/p.max*100)}%"></i></span><b>${p.before.toLocaleString()} → ${p.after.toLocaleString()}/${p.max.toLocaleString()}</b></li>`).join('');if(!unlocked&&!progress)return '';return `<section class="run-record"><h3>이번 판에서</h3>${unlocked?`<ul class="run-record-list">${unlocked}</ul>`:''}${progress?`<ul class="run-record-list run-record-progress">${progress}</ul>`:''}<small>새로 얻은 꾸미기는 로비의 프로필에서 장착할 수 있습니다.</small></section>`}
addEventListener('pagehide',()=>{if(ManmulRecords.run)ManmulRecords.save()});
function win(){if(ended)return;ended=true;let prevBest=difficultyBest();if(!testRun)record(true);let reward,summary=testRun?null:ManmulRecords.finishRun({won:true,theme:currentTheme});if(testRun)reward="테스트 모드에서는 파편과 기록을 얻을 수 없습니다.";else{let result=grantClearRewards(selectedDifficultyId,maxWave,true),bonus=riftBonusShards(result.shards),opened=selectedDifficultyId==='extreme'?riftRecordClear(runRiftLevel).opened:0;reward=result.saved?`균열의 파편 ${result.shards+bonus}개 획득! <small>(라운드 ${result.parts.rounds} + 클리어 ${result.parts.clear}${bonus?` + 균열 ${bonus}`:''})</small>${opened?`<br><b class="rift-opened">균열 ${opened}단계가 열렸습니다!</b>`:''}${guardianXpHtml(true)}<br><small>타이틀의 계승의 나무에서 기술을 익힐 수 있습니다.</small>`:"보상을 저장하지 못했습니다. 브라우저 저장소를 확인해 주세요."}$('#modalContent').innerHTML=`${modalOpen({eyebrow:'VICTORY',title:'방어 성공!',variant:'result-modal is-victory'})}${resultSummaryHtml(true,prevBest,reward)}${runRecordHtml(summary)}${modalClose(resultButtonsHtml())}`;$('#modal').classList.remove('hidden')}
// 균열 단계 bonus shards on top of the normal reward (granted separately so the base reward stays as before).
function riftBonusShards(base){let n=runRiftLevel?Math.floor(base*runRiftLevel*riftRewardPerLevel.shards):0;if(n)grantClearShards(n);return n}
function defeatRewardText(){if(testRun)return "테스트 모드에서는 파편과 기록을 얻을 수 없습니다.";if(isEndlessRun())return endlessResultText();let result=grantClearRewards(selectedDifficultyId,wave-1,false);result.shards+=riftBonusShards(result.shards);if(!result.saved)return "보상을 저장하지 못했습니다. 브라우저 저장소를 확인해 주세요.";return (result.shards?`균열의 파편 ${result.shards}개 획득 <small>(10라운드마다 ${roundShardRewards[selectedDifficultyId]??1}개)</small>`:"획득한 파편: 0 <small>(10라운드를 버티면 파편을 얻습니다)</small>")+guardianXpHtml(false)+(result.shards?'<br><small>타이틀의 계승의 나무에서 기술을 익힐 수 있습니다.</small>':'')}
// 수호자 경험치: every finished run (not test mode) adds XP; level-ups pay shards.
function guardianXpHtml(won){let missions=typeof missionDoneCount==='function'?missionDoneCount():0,hunts=typeof huntTotalKills==='function'?huntTotalKills():0,amount=Math.round(runXp({difficultyId:selectedDifficultyId,rounds:won?maxWave:Math.max(0,wave-1),won,missions,hunts})*(1+runRiftLevel*riftRewardPerLevel.xp)),r=grantRunXp(amount);if(!r.saved)return '';return `<br><span class="result-xp">수호자 경험치 +${r.xp}${r.levelsUp?` · <b>레벨 업! Lv.${r.level}</b> (파편 +${r.shards})`:` · Lv.${r.level}`}</span>`}
function end(){if(ended)return;ended=true;let prevBest=difficultyBest();if(!testRun)record(false);let summary=testRun?null:ManmulRecords.finishRun({won:false,theme:currentTheme});$('#modalContent').innerHTML=`${modalOpen({eyebrow:'DEFEAT',title:'방어 실패',variant:'result-modal is-defeat'})}<p class="ui-modal-lead">몬스터가 100마리를 초과했습니다.</p>${resultSummaryHtml(false,prevBest,defeatRewardText())}${runRecordHtml(summary)}${modalClose(resultButtonsHtml())}`;$('#modal').classList.remove('hidden')}
// Placeholder lap marker: one red pip per completed lap, to the right of the health bar.
function drawLapPips(e,x,y){if(!e.laps)return;ctx.fillStyle='#17201d';ctx.fillRect(x-1,y-1,e.laps*3+1,5);ctx.fillStyle='#ff6b5e';for(let i=0;i<e.laps;i++)ctx.fillRect(x+i*3,y,2,3)}
// Ember relic: a burning enemy's strongest active burn jumps to the nearest living enemies along the path.
function spreadEmbers(enemy){let burn=(enemy.manmulDots||[]).filter(d=>d.kind==='burn'&&d.until>combatTime).sort((a,b)=>b.amount-a.amount)[0];if(!burn)return;let L=pathLength(),gap=e=>{let x=Math.abs(((e.d-enemy.d)%L+L)%L);return Math.min(x,L-x)};for(const t of enemies.filter(e=>e!==enemy&&e.hp>0&&gap(e)<=relicRules.emberRange).sort((a,b)=>gap(a)-gap(b)).slice(0,relicRules.emberTargets))v5Combat.effects.applyDot(t,'relic:ember:'+enemy.id,burn.amount,relicRules.emberDuration,burn.type,combatTime,'burn')}
function pathPoint(d){let o=world.outer,p=2*(o.w+o.h);d=(((d+2*o.w+o.h)%p)+p)%p;if(d<o.w)return {x:o.x+d,y:o.y+o.h};d-=o.w;if(d<o.h)return{x:o.x+o.w,y:o.y+o.h-d};d-=o.h;if(d<o.w)return{x:o.x+o.w-d,y:o.y};d-=o.w;return{x:o.x,y:o.y+d}}
function drawV5Summons(){for(const summon of v5Combat.summons.active){ctx.fillStyle='#d9e7a7';ctx.beginPath();ctx.arc(summon.x,summon.y,6,0,Math.PI*2);ctx.fill()}}
function update(dt){if((paused&&!multiActive())||ended)return;combatTime+=dt;enemyDeathEffects=enemyDeathEffects.filter(effect=>combatTime-effect.startedAt<enemyDeathDuration);if(wave===0){preparation=Math.max(0,preparation-dt);if(preparation===0&&!multiActive())startWave()}if(revealTime>0)revealTime=Math.max(0,revealTime-dt);
if(spawnLeft>0){spawnTimer-=dt;if(spawnTimer<=0){if(isBossWave(wave)){globalThis.ManmulSound?.play('bossSpawn');spawnEnemy('boss',upcomingBoss||(()=>{let b=nextBossFromBag();return {...b,ability:currentTheme&&b.ability?ManmulThemes.abilityOf(currentTheme,b.ability):null}})());upcomingBoss=null;$('#bossPreview').classList.add('hidden')}else{let kind=wave>=4&&spawnLeft%7===0?'fast':wave>=8&&spawnLeft%6===0?'armor':wave>=12&&spawnLeft%5===0?'swarm':'normal';spawnEnemy(kind);}spawnLeft--;spawnTimer+=spawnInterval;if(ended)return}}
if(wave>0&&wave<maxWave){waveTimer+=dt;if(waveTimer>=roundInterval&&(!isMidWave(wave)||minibossCleared)&&revealTime<=0&&!multiActive())startWave()}
let targetPointCache=new WeakMap();for(let u of units){let t=types[u.type],dx=u.tx-u.x,dy=u.ty-u.y,dist=Math.hypot(dx,dy);if(dist>1){if(u.bestDistance===undefined||dist<u.bestDistance-.5){u.bestDistance=dist;u.stuckTime=0}else u.stuckTime=(u.stuckTime||0)+dt;if(u.stuckTime>=0.5){u.tx=u.x;u.ty=u.y;u.stuckTime=0;u.bestDistance=0;continue}let step=Math.min(dist,t.speed*dt),heading=Math.atan2(dy,dx),area=world.inner;let clear=(x,y)=>x>=area.x+t.radius&&x<=area.x+area.w-t.radius&&y>=area.y+t.radius&&y<=area.y+area.h-t.radius&&units.every(v=>{if(v===u)return true;let r=t.radius+types[v.type].radius,ddx=v.x-x;if(ddx>=r||ddx<=-r)return true;let ddy=v.y-y;return ddx*ddx+ddy*ddy>=r*r});let offsets=[0,.3,-.3,.6,-.6,.9,-.9,1.2,-1.2,1.55,-1.55,1.9,-1.9,2.3,-2.3,2.7,-2.7,Math.PI];if(u.avoidSide<0)offsets=offsets.map(a=>-a);let moved=false;for(let angle of offsets){let nx=u.x+Math.cos(heading+angle)*step,ny=u.y+Math.sin(heading+angle)*step;if(clear(nx,ny)){if(Math.abs(nx-u.x)>.05)u.artFacing=nx<u.x?-1:1;u.x=nx;u.y=ny;if(Math.abs(angle)>.1&&!u.avoidSide)u.avoidSide=Math.sign(angle);if(angle===0)u.avoidSide=0;moved=true;break}}if(!moved)u.avoidSide=-(u.avoidSide||1)}else{let target=findUnitTarget(u,t.grade==='재앙'||u.type==='L002'||u.type==='L007'?Infinity:v5Combat.range(u),targetPointCache);v5Combat.tickPassive(u,combatTime,target?.e);u.cool-=dt;if(t.active&&(target||ManmulSkillData[u.type]?.global||t.grade==='재앙')&&v5Combat.castSkill(u,combatTime))showSkillFeedback(u,t.skill_name);if(target){if(t.uses_basic&&u.cool<=0&&target.e.hp>0){let normal=!!normalMotionSpecs[u.type]||!!magicMotionSpecs[u.type]||!!upperMotionSpecs[u.type],fired=normal?(startNormalBasic(u,target.e,target.p),true):v5Combat.basicAttack(u,target.e,combatTime);if(fired){u.lastBasicTargetId=target.e.id;u.cool=v5Combat.attackInterval(u);u.artAttackAt=combatTime;u.artFacing=target.p.x<u.x?-1:1;if(!normal)shots.push({x:u.x,y:u.y,ex:target.p.x,ey:target.p.y,t:.12,color:t.damage_type==='물리'?'#ffe5c3':'#a8d8ff'})}}}}}
v5Combat.tickSummons();for(let e of enemies){ManmulThemes.update(e,combatTime);let status=v5Combat.tickEnemy(e),slow=e.bossAbility==='tenacity'?status.slow*.5:status.slow;if(!status.rooted)e.d+=e.speed*ManmulThemes.speedMultiplier(e,combatTime)*(1-slow)*dt;applyLapGrowth(e,slow>0||status.rooted)}
updateNormalBasicProjectiles();if(runRelics.execute)for(const e of enemies)if(e.hp>0&&e.kind!=='boss'&&e.kind!=='miniboss'&&e.hp<=e.max*relicRules.execute)e.hp=0;let dead=enemies.filter(e=>e.hp<=0);if(dead.length){for(const enemy of dead){if(runRelics.ember)spreadEmbers(enemy);missionEvent('kill',enemy);boxDropCheck(enemy);if(typeof Versus==='object')Versus.onKill(enemy);if(enemy.bountyId)claimHunt(enemy);globalThis.ManmulSound?.play(enemy.kind==='boss'?'bossDown':'kill');queueEnemyDeath(enemy);ManmulRecords.kill(enemy,{gold,time:combatTime});if(enemy.kind==='boss')runStats.bosses.push(enemy.name+' · '+(enemy.bossAbilityName||''));queueBossReward(enemy)}coopGoldGain(dead.reduce((total,e)=>total+combatRules.enemyKinds[e.kind].reward+((e.kind!=='boss'&&e.kind!=='miniboss'?(runRelics.bounty&&Math.random()<relicRules.bounty?1:0)+(Math.random()<treeBonus('killGold')?1:0):0)),0));enemies=enemies.filter(e=>e.hp>0)}missionTick();if(isMidWave(wave)&&minibossSpawned&&!minibossCleared&&spawnLeft===0&&!enemies.some(e=>e.spawnWave===wave)){minibossCleared=true;revealBoss()}if(wave===maxWave&&spawnLeft===0&&enemies.length===0&&pendingRewards.length===0){if(typeof Versus==='object'&&Versus.onFinalClear())return;win();globalThis.ManmulSound?.play('victory');multiFinished(true);return}shots=shots.filter(s=>(s.t-=dt)>0);updateCombatFeedback(dt);if(toastTimer>0&&(toastTimer-=dt)<=0)$('#toast').classList.add('hidden');updateUI()}
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
 panel.classList.remove('hidden');panel.innerHTML=`<strong style="color:${gradeColors[t.grade]}">${t.name}</strong> <small>${t.grade} · ${t.damage_type}</small><div class="spectate-stat">${t.uses_basic?ManmulUnitText.powerLabel(t.damage_type):(t.damage_type==='마법'?'마력 (기술)':'기술 위력')} ${base}${bonus?`<span class="stat-bonus">+${bonus}</span>`:''} · 사거리 ${(t.range/45).toFixed(1)}타일</div><div class="skill-list">${unitSkillIcons(t,level)}</div><small class="spectate-note">다른 플레이어의 유닛은 정보만 볼 수 있습니다. 강화 외 버프는 표시되지 않습니다.</small>`}
function drawScene(){ctx.clearRect(0,0,innerWidth,innerHeight);drawForestBackdrop();let t=transform();ctx.save();ctx.translate(t.x,t.y);ctx.scale(t.scale,t.scale);
 ctx.save();ctx.beginPath();ctx.rect(0,0,world.w,world.h);ctx.clip();if(introRemaining>0){let camera=introCameraState();ctx.translate(camera.x,camera.y);ctx.translate(world.w/2,world.h/2);ctx.scale(camera.zoom,camera.zoom);ctx.translate(-world.w/2,-world.h/2)}drawBlendedArena();ctx.restore();drawArenaIntro();drawArenaImpact();drawEnemyDeathEffects();for(let e of enemies){let p=pathPoint(e.d);if(!drawEnemySprite(e,p)){ctx.fillStyle=e.color||({miniboss:'#f59b58',boss:'#b04bce',fast:'#ffcf69',armor:'#aab0b9',swarm:'#e980ac',normal:'#d85e70'})[e.kind]||'#d85e70';ctx.beginPath();ctx.arc(p.x,p.y,e.kind==='boss'?15:e.kind==='miniboss'?12:9,0,Math.PI*2);ctx.fill();ctx.fillStyle='#271a2d';ctx.fillRect(p.x-4,p.y-2,2,2);ctx.fillRect(p.x+2,p.y-2,2,2)}let healthY=p.y-enemyVisualSize(e.kind)/2-6,ratio=Math.max(0,e.hp/e.max),elite=e.kind==='boss'||e.kind==='miniboss',barW=elite?34:20;if(ratio<.999||elite||e.laps){ctx.fillStyle='#17201d';ctx.fillRect(p.x-barW/2-1,healthY-1,barW+2,5);ctx.fillStyle=ratio>.5?'#8bed8c':ratio>.25?'#f2c94c':'#ff6b5e';ctx.fillRect(p.x-barW/2,healthY,barW*ratio,3)}drawEnemyKindBadge(e.kind,p.x-barW/2-7,healthY+1.5);drawLapPips(e,p.x+barW/2+3,healthY);drawDebuffs(e,p)}if(!spectateDrawing)drawV5Summons();for(let s of shots){ctx.strokeStyle=s.color;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(s.x,s.y);ctx.lineTo(s.ex,s.ey);ctx.stroke()}if(!spectateDrawing)drawArrivalEffects();for(let u of units){drawUnitGradeBase(u);drawUnitGradeAura(u)}for(let u of units){let type=types[u.type];if(selected.includes(u.id)){if(selected.length===1){ctx.strokeStyle='#d8f5bd55';ctx.lineWidth=1;ctx.beginPath();ctx.arc(u.x,u.y,v5Combat.range(u),0,Math.PI*2);ctx.stroke()}if(Math.hypot(u.tx-u.x,u.ty-u.y)>1){ctx.strokeStyle='#d8f5bd88';ctx.beginPath();ctx.moveTo(u.x,u.y);ctx.lineTo(u.tx,u.ty);ctx.stroke()}ctx.strokeStyle='#d7ff86';ctx.lineWidth=2;ctx.beginPath();ctx.arc(u.x,u.y,(type.radius+5)*unitVisualScale(u),0,Math.PI*2);ctx.stroke()}if(!drawUnitSprite(u)){ctx.fillStyle=type.color;ctx.beginPath();ctx.arc(u.x,u.y,type.radius,0,Math.PI*2);ctx.fill();ctx.fillStyle='#f2f7e8';ctx.beginPath();ctx.arc(u.x-type.radius*.28,u.y-type.radius*.12,Math.max(2,type.radius*.18),0,Math.PI*2);ctx.arc(u.x+type.radius*.28,u.y-type.radius*.12,Math.max(2,type.radius*.18),0,Math.PI*2);ctx.fill();ctx.fillStyle='#19322c';ctx.beginPath();ctx.arc(u.x-type.radius*.28,u.y-type.radius*.12,1.2,0,Math.PI*2);ctx.arc(u.x+type.radius*.28,u.y-type.radius*.12,1.2,0,Math.PI*2);ctx.fill();}}if(!spectateDrawing){drawNormalBasicFx();drawSkillFx(ctx,combatTime);drawCombatFeedback();if(typeof Coop==='object')Coop.drawPings(ctx)}if(drag){ctx.strokeStyle='#dcf9b3';ctx.lineWidth=1;ctx.strokeRect(drag.x,drag.y,drag.end.x-drag.x,drag.end.y-drag.y)}ctx.restore()}
let lastDrawAt=-1e9;// High refresh screens (144/240Hz) drew the whole field 2-4 times per game step; about 60 pictures a second is plenty.
function loop(time){let dt=Math.min((time-last)/1000||0,.05);last=time;if(!updateArenaIntro(dt))advanceGame(dt);if(ended&&!paused&&enemyDeathEffects.length){enemyDeathEndElapsed+=dt*gameSpeed;enemyDeathEffects=enemyDeathEffects.filter(effect=>combatTime+enemyDeathEndElapsed-effect.startedAt<enemyDeathDuration)}if(time-lastDrawAt>=12||time<lastDrawAt){lastDrawAt=time;draw()}requestAnimationFrame(loop)}requestAnimationFrame(loop);
// Hidden or background tabs get no animation frames. When frames stop for 0.25s in a synced multiplayer game, keep simulating from a timer so this player stays
// in step with the room (browsers run background timers about once a second, or less, so catch up in 50ms steps).
if(typeof setInterval==='function'&&typeof performance==='object')setInterval(()=>{if(!multiActive())return;let t=performance.now(),dt=Math.min(60,Math.max(0,(t-last)/1000));if(dt<.25)return;last=t;let left=dt;while(left>1e-6&&introRemaining>0){updateArenaIntro(Math.min(.05,left));left-=.05}for(;left>1e-6;left-=.05)advanceGame(Math.min(.05,left))},250);
function selectSameType(point,additive=false){let unit=[...units].reverse().find(u=>Math.hypot(u.x-point.x,u.y-point.y)<types[u.type].radius+5);if(!unit)return;let matches=units.filter(u=>u.type===unit.type).map(u=>u.id);selected=additive?[...new Set([...selected,...matches])]:matches;selectedEnemy=null;updateUI()}
canvas.addEventListener('dblclick',e=>{if(spectate||ended||paused||e.button!==0)return;selectSameType(pos(e),e.shiftKey)});
canvas.addEventListener('contextmenu',e=>e.preventDefault());canvas.addEventListener('pointerdown',e=>{if(spectate){if(e.button===0)spectatePick(pos(e));return}if(ended||paused||introRemaining>0)return;let p=pos(e);if(e.button===2){let group=units.filter(u=>selected.includes(u.id));issueMove(group,p);return}if(e.button===0)drag={x:p.x,y:p.y,end:p,shift:e.shiftKey,ctrl:e.ctrlKey}});canvas.addEventListener('pointermove',e=>{if(drag)drag.end=pos(e)});addEventListener('pointerup',e=>{if(!drag)return;let p=pos(e),a=drag;drag=null;let found;if(Math.hypot(p.x-a.x,p.y-a.y)<6){let u=[...units].reverse().find(u=>Math.hypot(u.x-p.x,u.y-p.y)<types[u.type].radius+5);found=u?[u.id]:[]}else{let x1=Math.min(a.x,p.x),x2=Math.max(a.x,p.x),y1=Math.min(a.y,p.y),y2=Math.max(a.y,p.y);found=units.filter(u=>u.x>=x1&&u.x<=x2&&u.y>=y1&&u.y<=y2).map(u=>u.id)}if(a.ctrl&&Math.hypot(p.x-a.x,p.y-a.y)<6){if(found.length){let id=found[0];selected=selected.includes(id)?selected.filter(value=>value!==id):[...selected,id];selectedEnemy=null}updateUI();return}selectedEnemy=null;if(!found.length&&Math.hypot(p.x-a.x,p.y-a.y)<6){let enemy=[...enemies].reverse().find(e=>{let q=pathPoint(e.d);return Math.hypot(q.x-p.x,q.y-p.y)<(e.kind==='boss'?18:12)});if(enemy)selectedEnemy=enemy.id}selected=a.shift?[...new Set([...selected,...found])]:found;updateUI()});
$('#summon').title=`노말 소환 ${summonCost}골드 · ${rosterData.units.filter(u=>u.grade==='N').map(u=>u.name).join('·')} 각 ${(100/rosterData.units.filter(u=>u.grade==='N').length).toFixed(2)}%`;$('#menuButton').onclick=openBattleMenu;$('#speed').onclick=()=>{if(typeof Multiplayer==='object'&&Multiplayer.syncActive){Multiplayer.cycleSpeedRequest();return}gameSpeed=gameSpeed%3+1;$('#speed').textContent=`X${gameSpeed}`};$('#rewardButton').onclick=showReward;$('#summon').onclick=summon;$('#upgrades').onclick=openUpgrades;$('#recipes').onclick=()=>openRecipes();$('#next').onclick=()=>{if(canAdvanceStage()){revealTime=0;startWave()}};addEventListener('keydown',e=>{if(e.target?.closest?.('input,textarea'))return;if(spectate&&!inLobby){if(e.key==='Escape')stopSpectate();return}if(e.repeat||inLobby||introRemaining>0)return;let k=e.key.toLowerCase();if(k==='escape'){if(!$('#modal').classList.contains('hidden')&&!ended&&$('#begin'))return;if(!$('#modal').classList.contains('hidden')&&!ended)closeModal();else openBattleMenu();return}if(!$('#modal').classList.contains('hidden'))return;if(k==='q')summon();if(k==='w')openUpgrades();if(k==='e')openRecipes();if(k==='r'&&selected.length===1){let u=units.find(u=>u.id===selected[0]);if(u)openRecipes(u.type,true)}if(k==='d'&&selected.length===1)convertUnit(selected[0]);if(k==='s')units.filter(u=>selected.includes(u.id)).forEach(u=>{u.tx=u.x;u.ty=u.y;u.stuckTime=0;u.bestDistance=0})});
{const baseUpdateUI=updateUI;updateUI=function(...a){let r=baseUpdateUI.apply(this,a);ensureSelectionZoom();renderMissionHud();return r}}applySelectionScale();
updateUI();initLobby();retryFromSession();
// Once the title is up, fetch the remaining unit art in the background and show progress in the title footer.
function startAssetWarmup(){let label=$('#hubAssetLoad');ManmulLazyImages.onProgress((done,total)=>{if(!label)return;label.textContent=done>=total?'그림 준비 완료':`그림 받는 중 ${Math.floor(done/Math.max(1,total)*100)}%`;label.classList.toggle('is-done',done>=total)});ManmulLazyImages.warm()}
if(typeof setTimeout==='function')setTimeout(startAssetWarmup,1200);
function renderDifficultyRecord(){let id=Object.hasOwn(difficulties,$('#difficultySelect').value)?$('#difficultySelect').value:'normal',records={};try{records=JSON.parse(localStorage.getItem('rift-record')||'{}').byDifficulty||{}}catch(e){}let d=records[id]||{},plays=Number.isInteger(d.plays)&&d.plays>=0?d.plays:0,wins=Number.isInteger(d.wins)&&d.wins>=0?d.wins:0,best=Number.isInteger(d.best)&&d.best>=0?d.best:0;$('#hubDifficultyRecord').textContent=`${difficulties[id].name} · ${plays}전 ${wins}승${plays?' · 클리어율 '+Math.round(wins/plays*100)+'%':''} · 최고 ${best}라운드`}
function renderLobby(){if(typeof ManmulSave==='object')ManmulSave.renderLobby();renderEndlessRanking();
 $('#hubShards').textContent=progression.shards;
 if(typeof renderTreeSummary==='function')renderTreeSummary();
 let record={};try{record=JSON.parse(localStorage.getItem('rift-record')||'{}')}catch(e){}$('#hubRecord').textContent=`최고 ${record.best||0}라운드 · ${record.wins||0}회 승리`;renderDifficultyRecord();
 renderProfile();
 for(const option of $('#difficultySelect').options||[]){let d=difficulties[option.value];if(d)option.textContent=`${d.name} · ${d.rounds}라운드 · 10라운드마다 파편 ${roundShardRewards[option.value]} · 클리어 +${clearShardRewards[option.value]}`}
 renderDifficultyCards();
}
// 수집 아이콘: 유닛은 기존 스프라이트, 보스는 초상화가 나오기 전까지 임시로 보스 색 + 첫 글자.
function bossInfo(id){return Object.values(ManmulThemes.bosses).flat().find(b=>b.id===id)||null}
function profileIconHtml(iconId){if(typeof iconId==='string'&&iconId.startsWith('unit:')&&types[iconId.slice(5)])return `<span class="profile-icon profile-icon-unit" style="--icon-color:#b69a64;${portraitStyle(iconId.slice(5))}" aria-hidden="true"></span>`;if(typeof iconId==='string'&&iconId.startsWith('boss:')){let b=bossInfo(iconId.slice(5));if(b)return `<span class="profile-icon profile-icon-boss" data-boss="${b.id}" style="--icon-color:${b.color};background-image:url('assets/ui/pixel-v1/bosses/${b.id}.png')" aria-hidden="true"><span class="boss-fallback">${escapeProfileText(b.name[0])}</span></span>`}let icon=profileCosmetics.icons[iconId]||profileCosmetics.icons.basic;return `<span class="profile-icon" style="--icon-color:${icon.color}" aria-hidden="true">${icon.symbol}</span>`}
function profileIconName(iconId){if(iconId.startsWith('unit:'))return types[iconId.slice(5)]?.name||iconId;if(iconId.startsWith('boss:'))return bossInfo(iconId.slice(5))?.name||iconId;return profileCosmetics.icons[iconId]?.name||iconId}
function profileBadge(profile=playerProfile){return `${profileIconHtml(profile.icon)}<span class="profile-text"><strong>${escapeProfileText(profile.name)}</strong><small>${profileCosmetics.titles[profile.title]?.name||''}</small></span>`}
function escapeProfileText(text){return String(text).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]))}
function renderProfile(){let card=$('#hubProfile');if(!card)return;card.className=`hub-profile plate-${playerProfile.plate}`;card.innerHTML=profileBadge();card.onclick=openProfileDialog}
let profileTab='look';
function profileLockText(group,id){if(profileCosmetics[group]?.[id]?.box)return '조각 상자에서 획득';let a=ManmulRecords.achievementForReward(group,id);if(a)return a.hidden&&!ManmulRecords.hasAchievement(a.id)?'숨겨진 업적':`업적 「${a.name}」`;return '잠김'}
function profileOptionHtml(group,slot,id,name,preview){let open=cosmeticUnlocked(group,id),on=playerProfile[slot]===id;return `<button type="button" class="profile-option" aria-pressed="${on}" ${open?'':'disabled'} onclick="equipCosmetic('${slot}','${id}')">${preview}<span><strong>${escapeProfileText(name)}</strong><small>${open?(on?'장착 중':'장착 가능'):profileLockText(group,id)}</small></span></button>`}
function profileLookHtml(){let section=(group,slot,label)=>`<section class="profile-section"><h3>${label}</h3><div class="profile-options">${Object.entries(profileCosmetics[group]).map(([id,item])=>profileOptionHtml(group,slot,id,item.name,group==='icons'?profileIconHtml(id):group==='plates'?`<span class="plate-swatch plate-${id}" aria-hidden="true"></span>`:'')).join('')}</div></section>`;
 let owned=Object.keys(ManmulRecords.data.icons).filter(id=>types[id.slice(5)]||bossInfo(id.slice(5))),collected=owned.length?`<div class="profile-options">${owned.map(id=>profileOptionHtml('icons','icon',id,profileIconName(id),profileIconHtml(id))).join('')}</div>`:'<p class="profile-hint">아직 모은 아이콘이 없습니다. 「수집」 탭에서 조건을 확인하세요.</p>';
 return `${section('titles','title','칭호')}${section('icons','icon','문장 아이콘')}<section class="profile-section"><h3>수집 아이콘</h3>${collected}</section>${section('plates','plate','명찰')}`}
function profileCollectionHtml(){let byGrade=ManmulRoster.grades.map(grade=>{let list=Object.entries(types).filter(([,t])=>t.grade===grade);if(!list.length)return '';let done=list.filter(([id])=>ManmulRecords.iconUnlocked('unit:'+id)).length;return `<details class="collection-grade"><summary>${grade} <small>${done}/${list.length} · ${ManmulRecords.unitIconThresholds[grade]}회 획득 시 해금</small></summary><div class="collection-grid">${list.map(([id,t])=>{let p=ManmulRecords.unitIconProgress(id,grade);return `<span class="collection-cell${p.unlocked?' is-open':''}" data-grade="${grade}" title="${escapeProfileText(t.name)} ${p.current}/${p.max}"><span class="profile-icon profile-icon-unit" style="${portraitStyle(id)}"></span><small>${p.unlocked?'✓':p.current+'/'+p.max}</small></span>`}).join('')}</div></details>`}).join('');
 let bosses=Object.entries(ManmulThemes.bosses).map(([theme,list])=>`<div class="collection-boss-row"><strong>${ManmulThemes.themes[theme].name}</strong>${list.map(b=>{let p=ManmulRecords.bossIconProgress(b.id);return `<span class="collection-cell${p.unlocked?' is-open':''}" title="${escapeProfileText(b.name)} ${p.current}/${p.max}">${profileIconHtml('boss:'+b.id)}<small>${p.unlocked?'✓':p.current+'/'+p.max}</small></span>`}).join('')}</div>`).join('');
 return `<section class="profile-section"><h3>유닛 아이콘</h3><p class="profile-hint">소환·조합으로 유닛을 정해진 횟수만큼 얻으면 그 유닛을 아이콘으로 쓸 수 있습니다.</p>${byGrade}</section><section class="profile-section"><h3>보스 초상화</h3><p class="profile-hint">보스를 ${ManmulRecords.bossIconThreshold}회 처치하면 초상화 아이콘이 열립니다.</p>${bosses}</section>`}
function profileAchievementsHtml(){let list=ManmulRecords.achievementList(),groups=[...new Set(list.map(a=>a.group))],done=list.filter(a=>a.done).length;return `<p class="profile-hint">달성 ${done}/${list.length}</p>`+groups.map(g=>`<section class="profile-section"><h3>${g}</h3><div class="achievement-list">${list.filter(a=>a.group===g).map(a=>`<div class="achievement-row${a.done?' is-done':''}" data-group="${({누적:'total',진행:'progress',테마:'theme',도전:'challenge'})[a.group]||''}"><span><strong>${escapeProfileText(a.name)}</strong><small>${escapeProfileText(a.desc)}</small></span><span class="run-record-bar" aria-hidden="true"><i style="width:${Math.round(a.current/a.max*100)}%"></i></span><small class="achievement-reward">${a.done?'✓ '+a.date:a.current.toLocaleString()+'/'+a.max.toLocaleString()}<br>${a.done||!a.name.startsWith('?')?recordRewardText(a.reward):'???'}</small></div>`).join('')}</div></section>`).join('')}
function switchProfileTab(tab){profileTab=tab;openProfileDialog()}
function profileMapsHtml(){return `<section class="profile-section"><h3>전장 스킨 <small>${Object.keys(mapSkins).filter(id=>mapSkinUnlocked(id)).length}/${Object.keys(mapSkins).length}</small></h3><p class="profile-hint">선택한 스킨은 다음 전투에 적용됩니다. 난이도를 처음 클리어하거나 조각 상자에서 새 스킨을 얻을 수 있습니다.</p><div class="map-skin-options">${Object.entries(mapSkins).map(([id,name])=>{let open=mapSkinUnlocked(id);return `<button type="button" class="map-skin-option${open?'':' is-locked'}" aria-pressed="${playerProfile.mapSkin===id}" ${open?'':'disabled'} onclick="equipMapSkin('${id}')">${id==='forest'?'<span class="map-skin-forest" aria-hidden="true"><i></i><b></b></span>':`<img src="assets/ui/map-skins/${id}.webp" alt="">`}<span>${name}</span>${open?'':`<small class="map-skin-lock">🔒 ${mapSkinLockText(id)}</small>`}</button>`}).join('')}</div></section>`}
function openProfileDialog(){let dialog=$('#profileDialog');if(!dialog)return;let tabs=[['look','꾸미기'],['maps','전장 스킨'],['collection','수집'],['achievements','업적']],body=profileTab==='maps'?profileMapsHtml():profileTab==='collection'?profileCollectionHtml():profileTab==='achievements'?profileAchievementsHtml():profileLookHtml();
 dialog.querySelector('.hub-dialog-panel').innerHTML=`<button type="button" class="hub-dialog-close" onclick="closeProfileDialog()" aria-label="프로필 닫기">×</button><h2 id="profileDialogTitle">프로필</h2><div class="hub-profile plate-${playerProfile.plate} profile-preview">${profileBadge()}</div><form class="profile-name" onsubmit="event.preventDefault();saveProfileName()"><label for="profileName">이름</label><input id="profileName" maxlength="12" value="${escapeProfileText(playerProfile.name)}" autocomplete="off" onkeydown="if(event.key==='Enter'&&(event.isComposing||event.keyCode===229)){event.preventDefault();this.dataset.saveAfter='1'}" onkeyup="if(event.key==='Enter'&&this.dataset.saveAfter){delete this.dataset.saveAfter;saveProfileName()}"><small class="profile-name-saved" role="status"></small><button type="submit">저장</button></form><div class="profile-tabs" role="tablist">${tabs.map(([id,label])=>`<button type="button" role="tab" aria-selected="${profileTab===id}" onclick="switchProfileTab('${id}')">${label}</button>`).join('')}</div>${body}`;
dialog.classList.remove('hidden');dialog.onkeydown=e=>{if(e.key==='Escape')closeProfileDialog()};dialog.onclick=e=>{if(e.target===dialog)closeProfileDialog()};dialog.querySelector('#profileName')?.focus()}
function closeProfileDialog(){$('#profileDialog')?.classList.add('hidden');$('#hubProfile')?.focus()}
function equipCosmetic(slot,id){if(updateProfile({[slot]:id})){renderProfile();openProfileDialog()}}
function equipMapSkin(id){if(updateProfile({mapSkin:id})){loadMapSkin(id);openProfileDialog()}}
// Korean input: Enter while a syllable is still being composed only commits it, so the name is saved when the
// Enter key is released (keyup) instead of needing a second Enter.
function saveProfileName(){let input=$('#profileName');if(input&&updateProfile({name:input.value})){renderProfile();openProfileDialog();$('#hubMessage').textContent='프로필이 저장되었습니다.';let ok=$('.profile-name-saved');if(ok)ok.textContent='✓ 저장됨'}}

function buyHubSkill(id){if(purchaseProgression(id)){$('#hubMessage').textContent='강화가 저장되었습니다. 다음 전투부터 적용됩니다.';renderLobby()}else $('#hubMessage').textContent='강화 조건이나 브라우저 저장소를 확인해 주세요.'}
// Role tags that counter a theme (same list as the codex 'theme' filter) and a shortcut into that filter.
function themeRoleTagsHtml(id){return (codexThemeRoles[id]||[]).map(k=>{let [icon,label]=roleTagDisplay[k]||['',k];return `<span class="role-tag"><span class="role-tag-icon" aria-hidden="true">${icon}</span>${label}</span>`}).join('')}
function openThemeCodex(){confirmTheme();codexState.theme=true;codexState.grade='all';codexState.selected=null;openRecipes()}
function showThemeRoulette(){themePending=true;let ids=Object.keys(ManmulThemes.themes);currentTheme=(typeof Multiplayer==='object'&&Multiplayer.theme)||ids[Math.floor(Math.random()*ids.length)];let theme=ManmulThemes.themes[currentTheme];$('#modalContent').innerHTML=`${modalOpen({eyebrow:'RIFT THEME',title:'이번 전장의 균열',variant:'theme-roulette'})}<div class="theme-reel-window"><div class="theme-reel">${[...ids,...ids,...ids,currentTheme].map(id=>`<span class="theme-reel-item">${ManmulThemes.themes[id].name}</span>`).join('')}</div></div><div class="theme-result"><strong>${theme.name}</strong><p>${theme.description}</p>${typeof Coop==='object'&&Coop.on&&Coop.extraThemes.length?`<p class="theme-good">함께 걸린 테마: <b>${Coop.extraThemes.map(t=>ManmulThemes.themes[t].name).join(' · ')}</b> (인원만큼 겹칩니다)</p>`:''}<p class="theme-good">유리한 역할 ${themeRoleTagsHtml(currentTheme)}</p><p class="muted">보스는 이 테마에 맞는 능력을 사용합니다.</p></div>${modalClose('<button class="ui-btn-ghost" onclick="openThemeCodex()">확인하고 추천 유닛 보기</button><button class="ui-btn-primary" onclick="confirmTheme()">확인</button>')}`;$('#modal').classList.remove('hidden');updateUI()}
function confirmTheme(){if(!themePending||!currentTheme||inLobby||!paused)return;themePending=false;$('#modal').classList.add('hidden');paused=false;updateUI();notice('30초 준비 시간 · Q 소환 / W 강화 / E 조합 도감');if(wave===0&&treeBonus('startCard')&&!runCards.includes('__start')){runCards.push('__start');let choices=rewardChoiceSet();if(choices.length){pendingRewards.push(choices);showReward()}}}
// ---- Title screen: main menu → single / multi panels (data-view on #lobby). Difficulty cards drive the hidden
// #difficultySelect, which multiplayer.js still reads and syncs; guests see the host's choice but cannot change it.
function lobbyView(){return $('#lobby')?.dataset?.view||'main'}
function setLobbyView(view){let lobby=$('#lobby');if(!lobby||!['main','single','multi'].includes(view))return;lobby.dataset.view=view;renderDifficultyCards();
 let focus=view==='main'?lobby.querySelector?.('.hub-menu-btn'):view==='single'?$('#startRift'):lobby.querySelector?.('#multiBox button');focus?.focus?.()}
function difficultyBestOf(id){try{let d=JSON.parse(localStorage.getItem('rift-record')||'{}').byDifficulty?.[id];return Number.isInteger(d?.best)?d.best:0}catch(e){return 0}}
function renderDifficultyCards(){let box=$('#difficultyCards'),select=$('#difficultySelect');if(!box||!select)return;let locked=!!select.disabled;
 let multiView=$('#lobby')?.dataset?.view==='multi'||locked;if(multiView&&difficulties[select.value]?.endless)select.value='normal';
 box.innerHTML=Object.entries(difficulties).filter(([id,d])=>!(d.endless&&multiView)).map(([id,d])=>{let on=select.value===id,best=difficultyBestOf(id);if(d.endless)return `<button type="button" class="difficulty-card is-${id}${on?' is-on':''}" role="radio" aria-checked="${on}" onclick="pickDifficulty('${id}')"><strong>${d.name}</strong><span>끝없는 층</span><small>${endlessRules.from}층부터 층마다 체력 +${Math.round(endlessRules.growth*100)}% · 파편 없음 · 랭킹 기록${best?' · 최고 '+best+'층':''}</small></button>`;return `<button type="button" class="difficulty-card is-${id}${on?' is-on':''}" role="radio" aria-checked="${on}" ${locked&&!on?'disabled':''} onclick="pickDifficulty('${id}')"><strong>${d.name}</strong><span>${d.rounds}라운드</span><small>${id==='extreme'&&riftProgress().unlocked?`균열 ${riftProgress().unlocked}단계까지 열림 · `:''}10라운드마다 ✦${roundShardRewards[id]} · 클리어 +${clearShardRewards[id]}${best?' · 최고 '+best:''}</small></button>`}).join('')+(locked?'<p class="difficulty-lock">난이도는 방장이 정합니다.</p>':'');renderRiftPicker()}
function renderRiftPicker(){let box=$('#riftPicker');if(!box)return;box.innerHTML=$('#difficultySelect')?.value==='extreme'?riftPickerHtml():''}
function pickDifficulty(id){let select=$('#difficultySelect');if(!select||select.disabled||!Object.hasOwn(difficulties,id))return;select.value=id;renderDifficultyRecord();renderDifficultyCards();select.dispatchEvent?.(new Event('change'))}
function openLobbySettings(){let dialog=$('#profileDialog');if(!dialog)return;dialog.querySelector('.hub-dialog-panel').innerHTML=`<button type="button" class="hub-dialog-close" onclick="closeProfileDialog()" aria-label="설정 닫기">×</button><h2 id="profileDialogTitle">설정</h2><div class="lobby-settings">${settingsRowsHtml()}</div>`;dialog.classList.remove('hidden');dialog.onkeydown=e=>{if(e.key==='Escape')closeProfileDialog()};dialog.onclick=e=>{if(e.target===dialog)closeProfileDialog()}}
function initLobby(){paused=true;inLobby=true;$('#difficultySelect').onchange=renderDifficultyRecord;renderLobby();
 for(const b of document.querySelectorAll?.('[data-view-go]')||[])b.onclick=()=>setLobbyView(b.dataset.viewGo);
 if($('#hubSettings'))$('#hubSettings').onclick=openLobbySettings;
 document.addEventListener?.('keydown',e=>{if(inLobby&&e.key==='Escape'&&lobbyView()!=='main'&&$('#profileDialog')?.classList.contains('hidden'))setLobbyView('main')});$('#startRift').onclick=()=>{if(typeof Multiplayer==='object'&&Multiplayer.inRoom){$('#hubMessage').textContent=Multiplayer.isHost?'멀티 방에서는 「함께 시작」을 눌러 주세요.':'방장이 시작하면 함께 시작됩니다.';return}beginRiftRun($('#difficultySelect').value)}}
function beginRiftRun(difficultyId){if(!inLobby)return;selectedDifficultyId=Object.hasOwn(difficulties,difficultyId)?difficultyId:'normal';let inRoom=typeof Multiplayer==='object'&&(Multiplayer.inRoom||Multiplayer.started);if(inRoom&&difficulties[selectedDifficultyId].endless)selectedDifficultyId='normal';runRiftLevel=selectedDifficultyId==='extreme'&&!inRoom?Math.min(selectedRiftLevel,riftProgress().unlocked):0;selectedDifficulty=riftDifficulty(difficulties[selectedDifficultyId],runRiftLevel);maxWave=selectedDifficulty.rounds;inLobby=false;eventStartRun();ManmulRecords.beginRun({difficulty:selectedDifficultyId});gold=Math.max(20,100+treeBonus('startGold')+riftActiveMods().startGold);selectionTickets.normal+=treeBonus('ticketNormal');selectionTickets.magic+=treeBonus('ticketMagic');paused=true;$('#lobby').classList.add('hidden');introThemeQueued=true;startArenaIntro();updateUI()}
