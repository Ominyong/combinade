'use strict';
// The approved preview sheets are rendered behind units, with their floor aligned to the unit's feet.
const arrivalFxSpecs={
 summon:{frames:6,sourceY:140,ground:337,size:66},
 '매직':{file:'magic',frames:12,ground:289,size:62},
 '레어':{file:'rare',frames:12,ground:335,size:66},
 '에픽':{file:'epic',frames:12,ground:318,size:70},
 '유니크':{file:'unique',frames:12,ground:309,size:74},
 '레전더리':{file:'legendary',frames:12,ground:321,size:80},
 '히든':{file:'hidden',frames:12,ground:334,size:80}
};
const arrivalFxImages=new Map(),arrivalEffects=[];
for(const [key,spec] of Object.entries(arrivalFxSpecs)){
 if(typeof Image==='undefined')continue;
 const image=new Image();image.src=`assets/effects/summon-fusion/${spec.file||key}-sheet.png`;arrivalFxImages.set(key,image);
}
function showArrivalEffect(key,unit){
 if(!arrivalFxSpecs[key])return;
 arrivalEffects.push({key,x:unit.x,y:unit.y,age:0});
}
function advanceArrivalEffects(dt){
 for(const effect of arrivalEffects)effect.age+=dt;
 for(let i=arrivalEffects.length-1;i>=0;i--)if(arrivalEffects[i].age+1e-9>=arrivalFxSpecs[arrivalEffects[i].key].frames/10)arrivalEffects.splice(i,1);
}
function drawArrivalEffects(){
 for(const effect of arrivalEffects){
  const spec=arrivalFxSpecs[effect.key],image=arrivalFxImages.get(effect.key);
  if(!image||!image.complete||!image.naturalWidth)continue;
  const frame=Math.min(spec.frames-1,Math.floor((effect.age+1e-9)*10)),size=spec.size;
  ctx.save();ctx.imageSmoothingEnabled=false;ctx.globalAlpha=.78;
  const cell=image.naturalWidth/6,k=cell/362;
  ctx.drawImage(image,(frame%6)*cell,((spec.sourceY||0)+Math.floor(frame/6)*362)*k,cell,cell,effect.x-size/2,effect.y+12-size*spec.ground/362,size,size);
  ctx.restore();
 }
}
