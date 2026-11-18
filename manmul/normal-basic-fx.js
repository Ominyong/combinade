'use strict';
// The six sheet cells are cast, launch, two flight poses and two impact poses.
const normalBasicFxImages=new Map(),normalBasicProjectiles=[];
for(let i=1;i<=7;i++)if(typeof Image!=='undefined'){
 const id=`N${String(i).padStart(3,'0')}`,image=new Image();
 image.src=`assets/effects/manmul-normal-basic/${id}-effect-sheet.png`;normalBasicFxImages.set(id,image);
}
const normalBasicCast=.18,normalBasicFlight=.30,normalBasicImpact=.20;
function startNormalBasic(unit,target,point){
 const dx=point.x-unit.x,dy=point.y-unit.y,length=Math.hypot(dx,dy)||1;
 normalBasicProjectiles.push({unit,target,type:unit.type,start:combatTime,x:unit.x+dx/length*12,y:unit.y+dy/length*12,angle:Math.atan2(dy,dx),hitAt:null,impact:null});
}
function updateNormalBasicProjectiles(){
 for(let i=normalBasicProjectiles.length-1;i>=0;i--){
  const shot=normalBasicProjectiles[i],age=combatTime-shot.start;
  if(shot.hitAt!==null){if(combatTime-shot.hitAt>=normalBasicImpact)normalBasicProjectiles.splice(i,1);continue}
  if(!enemies.includes(shot.target)||shot.target.hp<=0||(age<normalBasicCast&&!units.includes(shot.unit))){normalBasicProjectiles.splice(i,1);continue}
  if(age+1e-9>=normalBasicCast+normalBasicFlight){
   shot.impact=pathPoint(shot.target.d);shot.hitAt=combatTime;
   // Multi-target attacks resolve against the real combat rules at impact.
   // Mirror the impact visually on every additional enemy that actually took damage.
   const onDamage=v5State.onDamage,additional=new Set();
   v5State.onDamage=(enemy,...args)=>{if(enemy!==shot.target)additional.add(enemy);if(onDamage)onDamage(enemy,...args)};
   try{v5Combat.basicAttack(shot.unit,shot.target,combatTime)}finally{v5State.onDamage=onDamage}
   for(const enemy of additional){
    const impact=pathPoint(enemy.d);
    normalBasicProjectiles.push({type:shot.type,start:shot.start,hitAt:combatTime,impact,angle:Math.atan2(impact.y-shot.y,impact.x-shot.x)});
   }
  }
 }
}
function normalBasicVisual(shot){
 const age=Math.max(0,combatTime-shot.start);
 if(shot.hitAt!==null)return {frame:combatTime-shot.hitAt<normalBasicImpact/2?4:5,x:shot.impact.x,y:shot.impact.y};
 if(age<normalBasicCast)return {frame:0,x:shot.x,y:shot.y};
 const t=Math.min(1,(age-normalBasicCast)/normalBasicFlight),p=pathPoint(shot.target.d),ease=t*t;
 return {frame:Math.min(3,1+Math.floor(t*3)),x:shot.x+(p.x-shot.x)*ease,y:shot.y+(p.y-shot.y)*ease};
}
function drawNormalBasicFx(){
 for(const shot of normalBasicProjectiles){
  const upper=!!upperMotionSpecs[shot.type],magic=!!magicMotionSpecs[shot.type],image=upper?upperMotionImages.get(shot.type):magic?magicBasicFxImages.get(shot.type):normalBasicFxImages.get(shot.type);if(!image||!image.complete||!image.naturalWidth)continue;
  const p=normalBasicVisual(shot),size=44*unitVisualScale({type:shot.type});ctx.save();ctx.imageSmoothingEnabled=false;ctx.translate(p.x,p.y);ctx.rotate(shot.angle);
  const cell=magic||upper?96:362,sourceY=magic||upper?192:181;
  ctx.drawImage(image,p.frame*cell,sourceY,cell,cell,-size/2,-size/2,size,size);ctx.restore();
 }
}
