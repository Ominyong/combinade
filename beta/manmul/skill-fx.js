'use strict';
// Each registered skill uses its own generated six-frame sprite sheet.
const skillFxEvents=[],skillFxImages=new Map(),skillFxDuration=.72,skillFxLimit=100,skillFxImageLimit=32;
function skillFxPreload(id){
 if(!generatedSkillFxSpecs[id]||typeof Image==='undefined')return null;
 if(skillFxImages.has(id)){const image=skillFxImages.get(id);skillFxImages.delete(id);skillFxImages.set(id,image);return image}
 const image=new Image();image.src=`assets/effects/manmul-skill-generated/${id}.webp`;skillFxImages.set(id,image);
 if(skillFxImages.size>skillFxImageLimit)skillFxImages.delete(skillFxImages.keys().next().value);
 return image;
}
function queueSkillFx(unit,type,def,effects,now){
 if(!unit||!type||!def||!generatedSkillFxSpecs[type.id])return;
 const image=skillFxPreload(type.id),unique=new Map();
 for(const effect of effects){if(!Number.isFinite(effect.x)||!Number.isFinite(effect.y))continue;let key=effect.kind+':'+effect.id;if(!unique.has(key))unique.set(key,effect)}
 if(skillFxEvents.length>=skillFxLimit)skillFxEvents.shift();
 skillFxEvents.push({id:type.id,image,x:unit.x,y:unit.y,start:now,targets:[...unique.values()].slice(0,16),size:['재앙','천체','레전더리'].includes(type.grade)?62:type.grade==='유니크'?52:42});
}
function drawSkillFx(ctx,now){
 for(let i=skillFxEvents.length-1;i>=0;i--){const e=skillFxEvents[i],age=now-e.start;if(age>=skillFxDuration){skillFxEvents.splice(i,1);continue}if(age<0)continue;
  const image=e.image,spec=generatedSkillFxSpecs[e.id];if(!image||!image.complete||!image.naturalWidth||!spec)continue;
  // spec is measured on the original 2172px-wide sheet; k converts it to the stored image size.
  const frame=Math.min(5,Math.floor(age/skillFxDuration*6)),cell=image.naturalWidth/6,height=image.naturalHeight,k=image.naturalWidth/2172,scale=e.size/spec.size;
  const locations=e.targets.length?e.targets:[{x:e.x,y:e.y}];ctx.save();ctx.imageSmoothingEnabled=false;
  for(const p of locations)ctx.drawImage(image,frame*cell,0,cell,height,p.x-spec.cx*scale,p.y-spec.cy*scale,cell*scale/k,height*scale/k);
  ctx.restore();
 }
}
